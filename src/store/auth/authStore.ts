import { create } from 'zustand';
import { AuthState } from './authStore.types';
import { authApi } from '../../services/auth/auth.api';
import { userApi } from '../../services/user/user.api';
import { setAuthTokens } from '../../services/apiClient';
import { biometricsService } from '../../services/biometrics/biometrics.service';

const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { msg?: string; message?: string } }; message?: string };
    if (err.response?.data?.msg) return err.response.data.msg;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.message) return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  tokens: null,
  socketTokens: null,
  isAuthenticated: false,
  isEmailVerified: false,
  pendingEmail: null,
  registerToken: null,
  hasPin: false,
  isBiometricsAvailable: false,
  biometryType: null,
  isBiometricEnrolled: false,
  isLoading: false,
  error: null,

  setPendingEmail: (email: string) => {
    set({ pendingEmail: email.trim().toLowerCase(), error: null });
  },

  checkEmail: async (email: string) => {
    set({ isLoading: true, error: null, pendingEmail: email.trim().toLowerCase() });
    try {
      const res = await authApi.checkEmail({ email: email.trim().toLowerCase() });
      set({ isLoading: false });
      return res;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  sendOtp: async (email: string, otp_type = 'email') => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.sendOtp({ email: email.trim().toLowerCase(), otp_type });
      set({ isLoading: false });
      return res.msg;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyOtp: async (email: string, otp: string, otp_type: any = 'email') => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.verifyOtp({ email: email.trim().toLowerCase(), otp, otp_type });
      set({
        isLoading: false,
        isEmailVerified: true,
        registerToken: res.register_token || null,
      });
      return res.register_token;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  register: async (password: string) => {
    const { pendingEmail, registerToken } = get();
    if (!pendingEmail || !registerToken) {
      throw new Error('Missing verified email or registration token.');
    }
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register({
        email: pendingEmail,
        password,
        register_token: registerToken,
      });

      const tokens = res.tokens || res.token;
      if (tokens) {
        setAuthTokens(tokens.access_token, tokens.refresh_token);
      }

      set({
        isLoading: false,
        user: res.user,
        tokens: tokens || null,
        isAuthenticated: true,
      });

      // Fetch profile to verify if PIN exists
      await get().fetchProfile();
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  login: async (password: string) => {
    const { pendingEmail } = get();
    if (!pendingEmail) {
      throw new Error('Please provide an email address first.');
    }
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({
        email: pendingEmail,
        password,
      });

      const tokens = res.tokens || res.token;
      if (tokens) {
        setAuthTokens(tokens.access_token, tokens.refresh_token);
      }

      set({
        isLoading: false,
        user: res.user,
        tokens: tokens || null,
        isAuthenticated: true,
      });

      await get().fetchProfile();
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  oauthLogin: async (provider: 'google' | 'apple', idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.oauthLogin({ provider, id_token: idToken });
      const tokens = res.tokens || (res as any).token;
      if (tokens) {
        setAuthTokens(tokens.access_token, tokens.refresh_token);
      }

      set({
        isLoading: false,
        user: res.user,
        tokens: tokens || null,
        isAuthenticated: true,
      });

      await get().fetchProfile();
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  fetchProfile: async () => {
    try {
      const profile = await userApi.getProfile();
      set({
        profile,
        hasPin: profile.login_pin_exist,
      });
      return profile;
    } catch {
      return null;
    }
  },

  setPin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userApi.setPin({ login_pin: pin });
      set({
        isLoading: false,
        hasPin: true,
        socketTokens: res.socket_tokens || null,
      });
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyPin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userApi.verifyPin({ login_pin: pin });
      set({
        isLoading: false,
        socketTokens: res.socket_tokens || null,
      });
      return res.success;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  checkBiometrics: async () => {
    const { available, biometryType } = await biometricsService.checkAvailability();
    const enrolled = available ? await biometricsService.checkKeysExist() : false;
    set({
      isBiometricsAvailable: available,
      biometryType,
      isBiometricEnrolled: enrolled,
    });
    return { available, biometryType, enrolled };
  },

  enrollBiometrics: async () => {
    set({ isLoading: true, error: null });
    try {
      await biometricsService.enroll();
      set({ isLoading: false, isBiometricEnrolled: true });
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyBiometrics: async () => {
    const { profile, user } = get();
    const userId = profile?.userId || (user as any)?._id || (user as any)?.id;
    if (!userId) {
      throw new Error('User identifier not found.');
    }

    set({ isLoading: true, error: null });
    try {
      const socketTokens = await biometricsService.authenticate(userId);
      if (socketTokens) {
        set({
          isLoading: false,
          socketTokens,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await userApi.logout();
    } catch {
      // Ignore error on logout
    } finally {
      setAuthTokens(null, null);
      set({
        user: null,
        profile: null,
        tokens: null,
        socketTokens: null,
        isAuthenticated: false,
        isEmailVerified: false,
        pendingEmail: null,
        registerToken: null,
        hasPin: false,
        isBiometricEnrolled: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
