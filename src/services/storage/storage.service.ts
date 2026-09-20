export interface StoredSession {
  user: any;
  profile: any;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  hasPin: boolean;
  hasBiometric: boolean;
}

class StorageService {
  private cache: Map<string, string> = new Map();
  private isInitialized = false;
  private sendToWebView: ((msg: any) => void) | null = null;
  private onReadyListeners: Array<() => void> = [];

  setSender(sender: (msg: any) => void) {
    this.sendToWebView = sender;
  }

  handleInit(data: Record<string, string>) {
    this.cache.clear();
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined) {
          this.cache.set(k, String(v));
        }
      }
    }
    this.isInitialized = true;
    const listeners = [...this.onReadyListeners];
    this.onReadyListeners = [];
    listeners.forEach((cb) => cb());
  }

  onReady(cb: () => void) {
    if (this.isInitialized) {
      cb();
    } else {
      this.onReadyListeners.push(cb);
    }
  }

  getItem(key: string): string | null {
    return this.cache.get(key) || null;
  }

  async getItemAsync(key: string): Promise<string | null> {
    if (this.isInitialized) {
      return this.getItem(key);
    }
    return new Promise((resolve) => {
      // Set safety timeout of 1000ms so we never hang
      const timeout = setTimeout(() => {
        resolve(this.getItem(key));
      }, 1000);

      this.onReady(() => {
        clearTimeout(timeout);
        resolve(this.getItem(key));
      });
    });
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    if (this.sendToWebView) {
      this.sendToWebView({ type: 'SET', key, val: value });
    }
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    if (this.sendToWebView) {
      this.sendToWebView({ type: 'REMOVE', key });
    }
  }

  clear(): void {
    this.cache.clear();
    if (this.sendToWebView) {
      this.sendToWebView({ type: 'CLEAR' });
    }
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export const storageService = new StorageService();
