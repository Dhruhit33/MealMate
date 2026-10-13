import { create } from "zustand";
import api from "../api/axios";
import { getAddressCoords } from "./addressStore";

/**
 * Status normalization: backend Order uses CREATED/CONFIRMED/PICKED_UP
 * but some frontend components used PLACED/ACCEPTED/OUT_FOR_DELIVERY.
 * We normalize at the store level so all pages get consistent values.
 */
const normalizeStatus = (status) => {
  if (!status) return status;
  const map = {
    PLACED: "CREATED",
    ACCEPTED: "CONFIRMED",
    OUT_FOR_DELIVERY: "PICKED_UP",
  };
  return map[status] || status;
};

const normalizeOrder = (order) => {
  if (!order) return order;
  return { ...order, status: normalizeStatus(order.status) };
};

export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  deliveryInfo: null,
  loading: false,

  placeOrder: async (addressObj, userMeta = {}) => {
    let authUser = null;
    try {
      const stored = localStorage.getItem("mealmate-auth") || localStorage.getItem("foodrush-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        authUser = parsed.state?.user;
      }
    } catch {}

    // Store clean formatted address without bracket prefix
    const addressStr = [
      addressObj.street,
      addressObj.city,
      addressObj.state,
      addressObj.pincode,
    ].filter(Boolean).join(", ");

    let lat = addressObj.latitude !== undefined && addressObj.latitude !== null ? Number(addressObj.latitude) : null;
    let lng = addressObj.longitude !== undefined && addressObj.longitude !== null ? Number(addressObj.longitude) : null;
    if (!lat || !lng || Math.abs(lat) < 0.001) {
      const coords = getAddressCoords(addressObj);
      lat = coords.lat;
      lng = coords.lng;
    }

    const payload = {
      deliveryAddressId: String(addressObj.addressId || ""),
      deliverAddress: addressStr,
      customerPhone: userMeta.phone || authUser?.phone || addressObj.phone || "",
      customerName: userMeta.name || authUser?.name || addressObj.name || "Customer",
      specialInstructions: userMeta.instructions || "",
      latitude: lat,
      longitude: lng,
    };
    const res = await api.post("/orders/place", payload);
    return normalizeOrder(res.data);
  },

  fetchMyOrders: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/orders/my");
      const orders = Array.isArray(res.data) ? res.data.map(normalizeOrder) : [];
      set({ orders, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchOrder: async (orderId) => {
    // Clear stale order immediately so the detail page never flashes old data
    set({ loading: true, currentOrder: null });
    try {
      const res = await api.get(`/orders/${orderId}`);
      const order = normalizeOrder(res.data);
      set({ currentOrder: order, loading: false });
      return order;
    } catch {
      set({ loading: false });
    }
  },

  /**
   * Fetch delivery info for an order from the delivery-service.
   * Returns driver details, ETA, delivery status, coordinates.
   * Backend: GET /delivery/{orderId}/status → DeliveryResponse
   */
  fetchDeliveryInfo: async (orderId) => {
    try {
      const res = await api.get(`/delivery/${orderId}/status`);
      const info = res.data;
      set({ deliveryInfo: info });
      return info;
    } catch {
      set({ deliveryInfo: null });
      return null;
    }
  },

  cancelOrder: async (orderId) => {
    const res = await api.post(`/orders/${orderId}/cancel`);
    set((s) => ({
      orders: s.orders.map((o) =>
        o.orderId === orderId ? { ...o, status: "CANCELLED" } : o
      ),
      currentOrder:
        s.currentOrder?.orderId === orderId
          ? { ...s.currentOrder, status: "CANCELLED" }
          : s.currentOrder,
    }));
    return res.data;
  },
}));
