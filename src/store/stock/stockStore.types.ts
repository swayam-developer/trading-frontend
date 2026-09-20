import { Stock, Holding, Order } from '../../services/stock/stock.types';

export interface StockState {
  stocks: Stock[];
  holdings: Holding[];
  orders: Order[];
  selectedStock: Stock | null;

  isLoadingStocks: boolean;
  isLoadingHoldings: boolean;
  isLoadingOrders: boolean;
  isTrading: boolean;
  error: string | null;

  // Actions
  fetchStocks: () => Promise<Stock[]>;
  fetchHoldings: () => Promise<Holding[]>;
  fetchOrders: () => Promise<Order[]>;
  setSelectedStock: (stock: Stock | null) => void;
  buyStock: (stockId: string, quantity: number) => Promise<void>;
  sellStock: (holdingId: string, quantity: number) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}
