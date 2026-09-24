import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, getSocketAccessToken } from '../apiClient';
import { Stock, MarketStatusData } from '../stock/stock.types';

class SocketService {
  private socket: Socket | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private isConnecting = false;
  private marketStatus: MarketStatusData | null = null;
  private onStockUpdateListeners: Array<(stock: Stock) => void> = [];
  private onStatusChangeListeners: Array<(connected: boolean) => void> = [];

  /**
   * Set market status received from backend API
   */
  public setMarketStatus(status: MarketStatusData): void {
    this.marketStatus = status;
  }

  /**
   * Get current market status (provided by backend)
   */
  public getMarketStatus(): MarketStatusData | null {
    return this.marketStatus;
  }


  /**
   * Connect to backend Socket.IO server
   */
  public connect(tokenOverride?: string): Socket | null {
    const token = tokenOverride || getSocketAccessToken();
    if (!token) {
      console.warn('[SocketService] No socket token available. Deferring connection.');
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting && this.socket) {
      return this.socket;
    }

    this.isConnecting = true;

    try {
      this.socket = io(API_BASE_URL, {
        auth: {
          access_token: token,
          token: token,
        },
        extraHeaders: {
          access_token: token,
          authorization: `Bearer ${token}`,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('[SocketService] Connected with socket ID:', this.socket?.id);
        this.isConnecting = false;
        this.notifyStatus(true);

        // Re-subscribe to all active symbols on reconnect
        if (this.subscribedSymbols.size > 0) {
          const symbols = Array.from(this.subscribedSymbols);
          this.socket?.emit('subscribeToMultipleStocks', symbols);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[SocketService] Connection Error:', error.message);
        this.isConnecting = false;
        this.notifyStatus(false);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
        this.isConnecting = false;
        this.notifyStatus(false);
      });

      return this.socket;
    } catch (err: any) {
      console.error('[SocketService] Failed to initialize socket:', err.message);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Subscribe to a single stock ticker updates
   */
  public subscribeToStock(symbol: string): void {
    if (!symbol) return;
    const cleanSymbol = symbol.trim().toUpperCase();
    this.subscribedSymbols.add(cleanSymbol);

    const socket = this.socket || this.connect();
    if (socket) {
      socket.emit('SubscribeToStocks', cleanSymbol);

      // Listen for updates on this symbol event
      socket.off(cleanSymbol);
      socket.on(cleanSymbol, (stockData: Stock) => {
        this.notifyStockUpdate(stockData);
      });
    }
  }

  /**
   * Subscribe to multiple stock symbols (e.g. Watchlist)
   */
  public subscribeToMultipleStocks(symbols: string[]): void {
    if (!symbols || symbols.length === 0) return;
    const cleanSymbols = symbols.map((s) => s.trim().toUpperCase());
    cleanSymbols.forEach((s) => this.subscribedSymbols.add(s));

    const socket = this.socket || this.connect();
    if (socket) {
      socket.emit('subscribeToMultipleStocks', cleanSymbols);

      // Register listeners for each symbol
      cleanSymbols.forEach((symbol) => {
        socket.off(symbol);
        socket.on(symbol, (stockData: Stock) => {
          this.notifyStockUpdate(stockData);
        });
      });
    }
  }

  /**
   * Unsubscribe from a stock ticker
   */
  public unsubscribeFromStock(symbol: string): void {
    if (!symbol) return;
    const cleanSymbol = symbol.trim().toUpperCase();
    this.subscribedSymbols.delete(cleanSymbol);
    if (this.socket) {
      this.socket.off(cleanSymbol);
    }
  }

  /**
   * Register a listener for real-time stock price updates
   */
  public onStockUpdate(callback: (stock: Stock) => void): () => void {
    this.onStockUpdateListeners.push(callback);
    return () => {
      this.onStockUpdateListeners = this.onStockUpdateListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register a listener for connection status changes
   */
  public onStatusChange(callback: (connected: boolean) => void): () => void {
    this.onStatusChangeListeners.push(callback);
    return () => {
      this.onStatusChangeListeners = this.onStatusChangeListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Disconnect and clear all listeners
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscribedSymbols.clear();
    this.isConnecting = false;
    this.notifyStatus(false);
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  private notifyStockUpdate(stock: Stock): void {
    this.onStockUpdateListeners.forEach((cb) => {
      try {
        cb(stock);
      } catch (err) {
        console.warn('[SocketService] Error in onStockUpdate listener:', err);
      }
    });
  }

  private notifyStatus(connected: boolean): void {
    this.onStatusChangeListeners.forEach((cb) => {
      try {
        cb(connected);
      } catch (err) {
        console.warn('[SocketService] Error in onStatusChange listener:', err);
      }
    });
  }
}

export const socketService = new SocketService();
