import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      loading: false,

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      addItem: async (item, restaurantId, restaurantName) => {
        const state = get();
        if (state.restaurantId && state.restaurantId !== restaurantId && state.items.length > 0) {
          return { conflict: true, existingRestaurant: state.restaurantName };
        }

        try {
          await api.post("/cart/add", {
            restaurantId,
            restaurantName,
            menuItemId: item.itemId,
            menuItemName: item.name,
            unitPrice: item.price,
            quantity: 1,
          });
        } catch {}

        set((s) => {
          const existing = s.items.find((i) => i.menuItemId === item.itemId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.menuItemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            restaurantId,
            restaurantName,
            items: [
              ...s.items,
              {
                menuItemId: item.itemId,
                name: item.name,
                price: item.price,
                isVeg: item.isVeg,
                imageUrl: item.imageUrl,
                quantity: 1,
                restaurantId,
                restaurantName,
              },
            ],
          };
        });
        return { conflict: false };
      },

      clearAndAdd: async (item, restaurantId, restaurantName) => {
        try { await api.delete("/cart/clear"); } catch {}
        set({
          items: [{
            menuItemId: item.itemId,
            name: item.name,
            price: item.price,
            isVeg: item.isVeg,
            imageUrl: item.imageUrl,
            quantity: 1,
            restaurantId,
            restaurantName,
          }],
          restaurantId,
          restaurantName,
        });
      },

      // BUG FIX #7: backend uses @RequestParam not @RequestBody for quantity
      updateQuantity: async (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        try {
          await api.put(`/cart/update/${menuItemId}`, null, { params: { quantity } });
        } catch (err) {
          // 404 = item not in Redis (cart expired or diverged from localStorage)
          // Re-add the item so backend stays in sync
          if (err.response?.status === 404) {
            const item = get().items.find((i) => i.menuItemId === menuItemId);
            if (item) {
              try {
                await api.post("/cart/add", {
                  restaurantId: item.restaurantId,
                  restaurantName: item.restaurantName,
                  menuItemId: item.menuItemId,
                  menuItemName: item.name,
                  unitPrice: item.price,
                  quantity,
                });
              } catch { /* non-fatal */ }
            }
          }
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        }));
      },

      removeItem: async (menuItemId) => {
        try { await api.delete(`/cart/remove/${menuItemId}`); } catch {}
        set((s) => {
          const items = s.items.filter((i) => i.menuItemId !== menuItemId);
          return {
            items,
            restaurantId: items.length === 0 ? null : s.restaurantId,
            restaurantName: items.length === 0 ? null : s.restaurantName,
          };
        });
      },

      clearCart: async () => {
        try { await api.delete("/cart/clear"); } catch {}
        set({ items: [], restaurantId: null, restaurantName: null });
      },

      fetchCart: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/cart");
          const data = res.data;
          if (data && Array.isArray(data.items)) {
            set({
              items: data.items,
              restaurantId: data.restaurantId || null,
              restaurantName: data.restaurantName || null,
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
      name: "foodrush-cart",
      partialize: (s) => ({
        items: s.items,
        restaurantId: s.restaurantId,
        restaurantName: s.restaurantName,
      }),
    }
  )
);
