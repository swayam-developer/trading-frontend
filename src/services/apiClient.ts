import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storageService } from './storage/storage.service';

export const API_BASE_URL = 'https://trading-app-yfln.onrender.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// In-memory token storage (also synced from Zustand store)
let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;
let currentSocketAccessToken: string | null = null;
let currentSocketRefreshToken: string | null = null;

export const setAuthTokens = (access: string | null, refresh: string | null) => {
  currentAccessToken = access;
  currentRefreshToken = refresh;
  if (!access) {
    currentSocketAccessToken = null;
    currentSocketRefreshToken = null;
  }
};

export const setSocketTokens = (access: string | null, refresh: string | null) => {
  currentSocketAccessToken = access;
  currentSocketRefreshToken = refresh;
};

export const getAccessToken = () => currentAccessToken;
export const getSocketAccessToken = () => currentSocketAccessToken;

// Request Interceptor: Attach Bearer Token (strictly uses socket_token for /stocks)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isStockRoute = config.url?.startsWith('/stocks');
    const token = isStockRoute
      ? currentSocketAccessToken
      : (currentAccessToken || currentSocketAccessToken);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const errData = error.response?.data as any;
    const errorMsg = String(errData?.msg || errData?.message || '');

    const isLoginEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/check-email');
    const isWrongPinError =
      errorMsg.toLowerCase().includes('wrong pin') ||
      errorMsg.toLowerCase().includes('attempt') ||
      errorMsg.toLowerCase().includes('blocked');

    const isStockRoute = originalRequest.url?.startsWith('/stocks');

    // Handle 401 on /stocks with socket token refresh
    if (isStockRoute) {
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        currentSocketRefreshToken
      ) {
        originalRequest._retry = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            type: 'socket',
            refresh_token: currentSocketRefreshToken,
          });

          const { access_token, refresh_token: newSocketRefresh } = response.data;
          setSocketTokens(access_token, newSocketRefresh || currentSocketRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch (socketErr) {
          setSocketTokens(null, null);
          return Promise.reject(socketErr);
        }
      }
      return Promise.reject(error);
    }

    // Handle 401 on protected routes with app token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      currentRefreshToken &&
      !isLoginEndpoint &&
      !isWrongPinError
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          type: 'app',
          refresh_token: currentRefreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        const finalRefresh = newRefreshToken || currentRefreshToken;
        setAuthTokens(access_token, finalRefresh);

        const raw = storageService.getItem('aura_auth_session');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.tokens = { access_token, refresh_token: finalRefresh };
            storageService.setItem('aura_auth_session', JSON.stringify(parsed));
          } catch {}
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        setAuthTokens(null, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
