import { create } from 'zustand';
import { StockState } from './stockStore.types';
import { Stock } from '../../services/stock/stock.types';
import { stockApi } from '../../services/stock/stock.api';
import { useAuthStore } from '../auth/authStore';
import { socketService } from '../../services/socket/socket.service';
import { marketAlertService } from '../../services/marketAlert/marketAlert.service';

const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { msg?: string; message?: string } }; message?: string };
    if (err.response?.data?.msg) return err.response.data.msg;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.message) return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// Batch queue for high-frequency live stock ticks to prevent JS thread jank
const pendingStockUpdates = new Map<string, Partial<Stock>>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;

const flushBatchUpdates = (set: any, get: any) => {
  if (pendingStockUpdates.size === 0) {
    batchTimer = null;
    return;
  }

  const updates = new Map(pendingStockUpdates);
  pendingStockUpdates.clear();
  batchTimer = null;

  const currentStocks = get().stocks;
  const currentSelected = get().selectedStock;
  const currentHoldings = get().holdings;

  let stocksChanged = false;
  const updatedStocks = currentStocks.map((s: Stock) => {
    const update = updates.get(s.symbol.toUpperCase());
    if (update) {
      stocksChanged = true;
      return { ...s, ...update };
    }
    return s;
  });

  let nextSelected = currentSelected;
  if (currentSelected) {
    const selectedUpdate = updates.get(currentSelected.symbol.toUpperCase());
    if (selectedUpdate) {
      nextSelected = { ...currentSelected, ...selectedUpdate };
    }
  }

  let holdingsChanged = false;
  const updatedHoldings = currentHoldings.map((h: any) => {
    if (h.stock && h.stock.symbol) {
      const update = updates.get(h.stock.symbol.toUpperCase());
      if (update) {
        holdingsChanged = true;
        return {
          ...h,
          stock: { ...h.stock, ...update },
        };
      }
    }
    return h;
  });

  if (stocksChanged || holdingsChanged || nextSelected !== currentSelected) {
    set({
      stocks: stocksChanged ? updatedStocks : currentStocks,
      selectedStock: nextSelected,
      holdings: holdingsChanged ? updatedHoldings : currentHoldings,
      marketStatus: socketService.getMarketStatus(),
    });
  }
};

export const useStockStore = create<StockState>((set, get) => ({
  stocks: [],
  holdings: [],
  orders: [],
  selectedStock: null,
  isSocketConnected: false,
  marketStatus: socketService.getMarketStatus(),

  isLoadingStocks: false,
  isLoadingHoldings: false,
  isLoadingOrders: false,
  isTrading: false,
  error: null,

  setSelectedStock: (stock) => set({ selectedStock: stock }),

  updateLiveStock: (updatedStock, immediate = false) => {
    if (!updatedStock || !updatedStock.symbol) return;
    pendingStockUpdates.set(updatedStock.symbol.toUpperCase(), updatedStock);

    if (immediate) {
      if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
      }
      flushBatchUpdates(set, get);
      return;
    }

    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        flushBatchUpdates(set, get);
      }, 80);
    }
  },

  initSocket: () => {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated || !authState.tokens?.access_token) {
      console.log('[stockStore] Socket init deferred: User not authenticated.');
      return;
    }

    socketService.connect();
    get().fetchMarketStatus();
    socketService.onStockUpdate((stock) => {
      get().updateLiveStock(stock, false);
    });
    socketService.onMarketStatus((status) => {
      set({ marketStatus: status });
      if (useAuthStore.getState().isAuthenticated) {
        marketAlertService.showMarketAlert(status);
      }
    });
    socketService.onStatusChange((connected) => {
      if (connected) {
        get().fetchMarketStatus();
      }
      set({
        isSocketConnected: connected,
        marketStatus: socketService.getMarketStatus(),
      });
    });
  },



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

  fetchStockDetail: async (symbol: string) => {
    try {
      const data = await stockApi.getStockBySymbol(symbol);
      if (data) {
        set({ selectedStock: data });
        get().updateLiveStock(data);
      }
      return data || null;
    } catch (err) {
      console.warn('[stockStore] Failed to fetch stock detail:', err);
      return null;
    }
  },

  fetchMarketStatus: async () => {
    try {
      const status = await stockApi.getMarketStatus();
      if (status) {
        socketService.setMarketStatus(status);
        set({ marketStatus: status });
        if (useAuthStore.getState().isAuthenticated) {
          marketAlertService.showMarketAlert(status);
        }
      }
      return status || null;
    } catch (err) {
      console.warn('[stockStore] Failed to fetch market status:', err);
      return null;
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
