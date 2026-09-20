export interface Stock {
  _id: string;
  symbol: string;
  companyName: string;
  iconUrl: string;
  lastDayTradedPrice: number;
  currentPrice: number;
  dayTimeSeries?: Array<{ time?: string; price?: number; value?: number }>;
  tenMinTimeSeries?: Array<{ time?: string; price?: number; value?: number }>;
}

export interface Holding {
  _id: string;
  user: string;
  stock: Stock;
  quantity: number;
  buyPrice: number;
}

export interface Order {
  _id: string;
  user: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;
  stock: Stock;
  quantity: number;
  price: number;
  type: 'buy' | 'sell';
  timestamp: string;
  remainingBalance: number;
}

export interface GetAllStocksResponse {
  msg: string;
  data: Stock[];
}

export interface GetStockResponse {
  msg: string;
  data: Stock;
}

export interface BuyStockRequest {
  stock_id: string;
  quantity: number;
}

export interface BuyStockResponse {
  msg: string;
  data: {
    _id: string;
    user: string;
    stock: string;
    quantity: number;
    buyPrice: number;
  };
}

export interface SellStockRequest {
  holdingId: string;
  quantity: number;
}

export interface SellStockResponse {
  msg: string;
  data: {
    orderId: string;
    sellPrice: number;
  };
}

export interface GetHoldingsResponse {
  msg: string;
  data: Holding[];
}

export interface GetOrdersResponse {
  msg: string;
  data: Order[];
}

export interface RegisterStockRequest {
  symbol: string;
  companyName: string;
  currentPrice: number;
  lastDayTradedPrice: number;
  iconUrl: string;
}

export interface RegisterStockResponse {
  msg: string;
  data: Stock;
}
