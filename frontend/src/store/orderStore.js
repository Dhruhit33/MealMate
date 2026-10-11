import { create } from "zustand";
import api from "../api/axios";

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

  placeOrder: async (addressObj) => {
    // Build deliverAddress from address object fields
    const addressStr = [
      addressObj.street,
      addressObj.city,
      addressObj.state,
      addressObj.pincode,
    ].filter(Boolean).join(", ");

    const payload = {
      deliveryAddressId: String(addressObj.addressId || ""),
      deliverAddress: addressStr,
      specialInstructions: "",
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
