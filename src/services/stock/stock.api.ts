import { apiClient } from '../apiClient';
import {
  Stock,
  Holding,
  Order,
  GetAllStocksResponse,
  GetStockResponse,
  BuyStockRequest,
  BuyStockResponse,
  SellStockRequest,
  SellStockResponse,
  GetHoldingsResponse,
  GetOrdersResponse,
  RegisterStockRequest,
  RegisterStockResponse,
} from './stock.types';

export const stockApi = {
  /**
   * Fetch all registered stocks with current and last day traded prices
   */
  getAllStocks: async (): Promise<Stock[]> => {
    const response = await apiClient.get<GetAllStocksResponse>('/stocks');
    return response.data.data || [];
  },

  /**
   * Fetch a single stock by its symbol (e.g. AAPL)
   */
  getStockBySymbol: async (symbol: string): Promise<Stock> => {
    const response = await apiClient.get<GetStockResponse>(`/stocks/stock?stock=${encodeURIComponent(symbol)}`);
    return response.data.data;
  },

  /**
   * Purchase stock shares
   */
  buyStock: async (data: BuyStockRequest): Promise<BuyStockResponse> => {
    const response = await apiClient.post<BuyStockResponse>('/stocks/buy', data);
    return response.data;
  },

  /**
   * Sell stock shares from existing holding
   */
  sellStock: async (data: SellStockRequest): Promise<SellStockResponse> => {
    const response = await apiClient.post<SellStockResponse>('/stocks/sell', data);
    return response.data;
  },

  /**
   * Fetch all holdings owned by the authenticated user
   */
  getHoldings: async (): Promise<Holding[]> => {
    const response = await apiClient.get<GetHoldingsResponse>('/stocks/holding');
    return response.data.data || [];
  },

  /**
   * Fetch order execution history for the authenticated user
   */
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<GetOrdersResponse>('/stocks/order');
    return response.data.data || [];
  },

  /**
   * Register a new stock symbol (admin/mock helper)
   */
  registerStock: async (data: RegisterStockRequest): Promise<Stock> => {
    const response = await apiClient.post<RegisterStockResponse>('/stocks/register', data);
    return response.data.data;
  },
};
