import { create } from "zustand";
import api from "../api/axios";

export const useAddressStore = create((set) => ({
  addresses: [],
  loading: false,

  fetchAddresses: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/users/addresses");
      set({ addresses: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addAddress: async (data) => {
    const res = await api.post("/users/addresses", data);
    set((s) => ({ addresses: [...s.addresses, res.data] }));
    return res.data;
  },

  updateAddress: async (id, data) => {
    const res = await api.put(`/users/addresses/${id}`, data);
    set((s) => ({
      addresses: s.addresses.map((a) => (a.addressId === id ? res.data : a)),
    }));
    return res.data;
  },

  deleteAddress: async (id) => {
    await api.delete(`/users/addresses/${id}`);
    set((s) => ({
      addresses: s.addresses.filter((a) => a.addressId !== id),
    }));
  },
}));
