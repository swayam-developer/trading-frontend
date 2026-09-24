export interface CandleData {
  timeStamp?: string;
  time?: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  value?: number;
  price?: number;
  label?: string;
}

export interface Stock {
  _id: string;
  symbol: string;
  companyName: string;
  iconUrl: string;
  lastDayTradedPrice: number;
  currentPrice: number;
  dayTimeSeries?: CandleData[];
  tenMinTimeSeries?: CandleData[];
}

export interface HolidayItem {
  date: string;
  name: string;
}

export interface MarketClosureSpan {
  from: string;
  to: string;
  reason: string;
  totalDays: number;
  daysUntil: number;
  holidayName?: string;
}

export interface MarketAlertPayload {
  type: 'open' | 'closed' | 'holiday_today' | 'closed_tomorrow' | 'upcoming_closure';
  title: string;
  message: string;
  dateRange?: string;
}

export interface MarketStatusData {
  isOpen: boolean;
  isTradingHour: boolean;
  isHoliday: boolean;
  isWeekDay: boolean;
  message: string;
  todayHoliday?: HolidayItem | null;
  isTomorrowClosed?: boolean;
  tomorrowReason?: string | null;
  nextOpenTime?: string | null;
  nextOpenFormatted?: string;
  upcomingClosures?: MarketClosureSpan[];
  holidays: string[];
  holidayCalendar?: HolidayItem[];
  marketHours: {
    open: string;
    close: string;
    timezone?: string;
  };
  serverTime: string;
  alert?: MarketAlertPayload;
}

export interface MarketStatusResponse {
  msg: string;
  data: MarketStatusData;
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
  status?: 'EXECUTED' | 'PENDING_AMO' | 'CANCELLED';
  isAMO?: boolean;
  executedAt?: string;
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
