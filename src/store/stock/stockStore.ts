import { create } from 'zustand';
import { StockState } from './stockStore.types';
import { stockApi } from '../../services/stock/stock.api';
import { useAuthStore } from '../auth/authStore';

const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { msg?: string; message?: string } }; message?: string };
    if (err.response?.data?.msg) return err.response.data.msg;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.message) return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

export const useStockStore = create<StockState>((set, get) => ({
  stocks: [],
  holdings: [],
  orders: [],
  selectedStock: null,

  isLoadingStocks: false,
  isLoadingHoldings: false,
  isLoadingOrders: false,
  isTrading: false,
  error: null,

  setSelectedStock: (stock) => set({ selectedStock: stock }),

  fetchStocks: async () => {
    set({ isLoadingStocks: true, error: null });
    try {
      const data = await stockApi.getAllStocks();
      set({ stocks: data, isLoadingStocks: false });
      return data;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoadingStocks: false, error: msg });
      return [];
    }
  },

  fetchHoldings: async () => {
    set({ isLoadingHoldings: true, error: null });
    try {
      const data = await stockApi.getHoldings();
      set({ holdings: data, isLoadingHoldings: false });
      return data;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoadingHoldings: false, error: msg });
      return [];
    }
  },

  fetchOrders: async () => {
    set({ isLoadingOrders: true, error: null });
    try {
      const data = await stockApi.getOrders();
      set({ orders: data, isLoadingOrders: false });
      return data;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoadingOrders: false, error: msg });
      return [];
    }
  },

  buyStock: async (stockId: string, quantity: number) => {
    set({ isTrading: true, error: null });
    try {
      await stockApi.buyStock({ stock_id: stockId, quantity });
      set({ isTrading: false });
      // Refresh holdings, orders, and user profile balance
      await Promise.allSettled([
        get().fetchHoldings(),
        get().fetchOrders(),
        useAuthStore.getState().fetchProfile(),
      ]);
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isTrading: false, error: msg });
      throw new Error(msg);
    }
  },

  sellStock: async (holdingId: string, quantity: number) => {
    set({ isTrading: true, error: null });
    try {
      await stockApi.sellStock({ holdingId, quantity });
      set({ isTrading: false });
      // Refresh holdings, orders, and user profile balance
      await Promise.allSettled([
        get().fetchHoldings(),
        get().fetchOrders(),
        useAuthStore.getState().fetchProfile(),
      ]);
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isTrading: false, error: msg });
      throw new Error(msg);
    }
  },

  refreshAll: async () => {
    await Promise.allSettled([
      get().fetchStocks(),
      get().fetchHoldings(),
      get().fetchOrders(),
      useAuthStore.getState().fetchProfile(),
    ]);
  },

  clearError: () => set({ error: null }),
}));
