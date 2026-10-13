import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

if (typeof window !== "undefined" && window.localStorage) {
  try {
    if (!window.localStorage.getItem("mealmate-cart") && window.localStorage.getItem("foodrush-cart")) {
      window.localStorage.setItem("mealmate-cart", window.localStorage.getItem("foodrush-cart"));
    }
  } catch (e) {}
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      loading: false,

      getTotal: () =>
        get().items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0),
      getItemCount: () =>
        get().items.reduce((sum, i) => sum + (i.quantity || 1), 0),

      addItem: async (item, restaurantId, restaurantName) => {
        const state = get();
        if (state.restaurantId && state.restaurantId !== restaurantId && state.items.length > 0) {
          return { conflict: true, existingRestaurant: state.restaurantName };
        }

        const id = item.itemId || item.id || item.menuItemId;
        const name = item.name || item.menuItemName || "Item";
        const price = Number(item.price ?? item.unitPrice ?? 0);
        const isVeg = item.isVeg !== undefined ? item.isVeg : true;
        const imageUrl = item.imageUrl || "";

        // Optimistic local state update for 0ms latency UI response
        set((s) => {
          const existing = s.items.find((i) => (i.menuItemId || i.itemId) === id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                (i.menuItemId || i.itemId) === id
                  ? { ...i, quantity: (i.quantity || 1) + 1 }
                  : i
              ),
            };
          }
          return {
            restaurantId: restaurantId || s.restaurantId,
            restaurantName: restaurantName || s.restaurantName,
            items: [
              ...s.items,
              {
                menuItemId: id,
                itemId: id,
                name,
                price,
                isVeg,
                imageUrl,
                quantity: 1,
                restaurantId: restaurantId || s.restaurantId,
                restaurantName: restaurantName || s.restaurantName,
              },
            ],
          };
        });

        // Sync with backend Redis asynchronously
        try {
          await api.post("/cart/add", {
            restaurantId,
            restaurantName,
            menuItemId: id,
            menuItemName: name,
            unitPrice: price,
            quantity: 1,
          });
        } catch (err) {
          console.warn("Backend cart/add sync notice:", err?.message);
        }
        return { conflict: false };
      },

      clearAndAdd: async (item, restaurantId, restaurantName) => {
        const id = item.itemId || item.id || item.menuItemId;
        const name = item.name || item.menuItemName || "Item";
        const price = Number(item.price ?? item.unitPrice ?? 0);
        const isVeg = item.isVeg !== undefined ? item.isVeg : true;
        const imageUrl = item.imageUrl || "";

        set({
          items: [
            {
              menuItemId: id,
              itemId: id,
              name,
              price,
              isVeg,
              imageUrl,
              quantity: 1,
              restaurantId,
              restaurantName,
            },
          ],
          restaurantId,
          restaurantName,
        });

        try {
          await api.delete("/cart/clear");
          await api.post("/cart/add", {
            restaurantId,
            restaurantName,
            menuItemId: id,
            menuItemName: name,
            unitPrice: price,
            quantity: 1,
          });
        } catch {}
      },

      updateQuantity: async (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        // Optimistic update
        set((s) => ({
          items: s.items.map((i) =>
            (i.menuItemId || i.itemId) === menuItemId ? { ...i, quantity } : i
          ),
        }));

        try {
          await api.put(`/cart/update/${menuItemId}`, null, { params: { quantity } });
        } catch (err) {
          if (err.response?.status === 404) {
            const item = get().items.find((i) => (i.menuItemId || i.itemId) === menuItemId);
            if (item) {
              try {
                await api.post("/cart/add", {
                  restaurantId: item.restaurantId,
                  restaurantName: item.restaurantName,
                  menuItemId: item.menuItemId || item.itemId,
                  menuItemName: item.name,
                  unitPrice: item.price,
                  quantity,
                });
              } catch {}
            }
          }
        }
      },

      removeItem: async (menuItemId) => {
        set((s) => {
          const items = s.items.filter((i) => (i.menuItemId || i.itemId) !== menuItemId);
          return {
            items,
            restaurantId: items.length === 0 ? null : s.restaurantId,
            restaurantName: items.length === 0 ? null : s.restaurantName,
          };
        });

        try {
          await api.delete(`/cart/remove/${menuItemId}`);
        } catch {}
      },

      clearCart: async () => {
        set({ items: [], restaurantId: null, restaurantName: null });
        try {
          await api.delete("/cart/clear");
        } catch {}
      },

      fetchCart: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/cart");
          const data = res.data;
          // Handle both 'items' and 'item' fields from backend
          const rawItems = Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.item)
            ? data.item
            : [];

          if (rawItems.length > 0) {
            const normalizedItems = rawItems.map((raw) => ({
              menuItemId: raw.menuItemId || raw.itemId || raw.id,
              itemId: raw.itemId || raw.menuItemId || raw.id,
              name: raw.name || raw.menuItemName || "Item",
              price: Number(raw.price ?? raw.unitPrice ?? 0),
              quantity: Number(raw.quantity || 1),
              isVeg: raw.isVeg !== undefined ? Boolean(raw.isVeg) : true,
              imageUrl: raw.imageUrl || "",
              restaurantId: raw.restaurantId || data.restaurantId,
              restaurantName: raw.restaurantName || data.restaurantName,
            }));
            set({
              items: normalizedItems,
              restaurantId: data.restaurantId || normalizedItems[0]?.restaurantId || null,
              restaurantName: data.restaurantName || normalizedItems[0]?.restaurantName || null,
              loading: false,
            });
          } else {
            set({ loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },
    }),
    {
      name: "mealmate-cart",
      partialize: (s) => ({
        items: s.items,
        restaurantId: s.restaurantId,
        restaurantName: s.restaurantName,
      }),
    }
  )
);
