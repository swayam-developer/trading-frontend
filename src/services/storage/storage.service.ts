import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private initPromise: Promise<void> | null = null;
  private onReadyListeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        if (keys && keys.length > 0) {
          const entries = await AsyncStorage.getMany(keys);
          for (const [key, value] of Object.entries(entries)) {
            if (value !== null && value !== undefined) {
              this.cache.set(key, value);
            }
          }
        }
      } catch (err) {
        console.warn('[StorageService] Error loading keys from AsyncStorage:', err);
      } finally {
        this.isInitialized = true;
        const listeners = [...this.onReadyListeners];
        this.onReadyListeners = [];
        listeners.forEach((cb) => {
          try {
            cb();
          } catch (e) {
            console.warn('[StorageService] Error in onReady callback:', e);
          }
        });
      }
    })();

    return this.initPromise;
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
    if (!this.isInitialized) {
      await this.init();
    }
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) {
        this.cache.set(key, val);
      }
      return val;
    } catch (err) {
      console.warn(`[StorageService] Error getting item "${key}":`, err);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    AsyncStorage.setItem(key, value).catch((err) => {
      console.warn(`[StorageService] Error setting item "${key}":`, err);
    });
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[StorageService] Error setting item async "${key}":`, err);
    }
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    AsyncStorage.removeItem(key).catch((err) => {
      console.warn(`[StorageService] Error removing item "${key}":`, err);
    });
  }

  async removeItemAsync(key: string): Promise<void> {
    this.cache.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[StorageService] Error removing item async "${key}":`, err);
    }
  }

  clear(): void {
    this.cache.clear();
    AsyncStorage.clear().catch((err) => {
      console.warn('[StorageService] Error clearing AsyncStorage:', err);
    });
  }

  async clearAsync(): Promise<void> {
    this.cache.clear();
    try {
      await AsyncStorage.clear();
    } catch (err) {
      console.warn('[StorageService] Error clearing AsyncStorage async:', err);
    }
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export const storageService = new StorageService();
