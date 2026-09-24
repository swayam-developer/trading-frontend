import { create } from 'zustand';
import { AuthState } from './authStore.types';
import { authApi } from '../../services/auth/auth.api';
import { userApi } from '../../services/user/user.api';
import { setAuthTokens, setSocketTokens } from '../../services/apiClient';
import { biometricsService } from '../../services/biometrics/biometrics.service';
import { storageService, StoredSession } from '../../services/storage/storage.service';
import { keychainService } from '../../services/storage/keychain.service';
import { notificationService } from '../../services/notification/notificationService';
import { socketService } from '../../services/socket/socket.service';
import { marketAlertService } from '../../services/marketAlert/marketAlert.service';
import Toast from 'react-native-toast-message';

const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { msg?: string; message?: string } }; message?: string };
    if (err.response?.data?.msg) return err.response.data.msg;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.message) return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

const persistSession = (data?: Partial<StoredSession>) => {
  const state = useAuthStore.getState();
  const tokens = data?.tokens || state.tokens;
  if (!tokens?.access_token) return;

  const session: StoredSession = {
    user: data?.user !== undefined ? data.user : state.user,
    profile: data?.profile !== undefined ? data.profile : state.profile,
    tokens,
    hasPin: data?.hasPin !== undefined ? data.hasPin : state.hasPin,
    hasBiometric: data?.hasBiometric !== undefined ? data.hasBiometric : state.hasBiometric,
  };
  storageService.setItem('aura_auth_session', JSON.stringify(session));

  // Also persist in hardware-backed Keychain
  keychainService.saveTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    socket_access_token: state.socketTokens?.socket_access_token,
    socket_refresh_token: state.socketTokens?.socket_refresh_token,
  });
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
  hasBiometric: false,
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
      const fcmToken = await notificationService.getFcmToken().catch(() => null);
      const res = await authApi.register({
        email: pendingEmail,
        password,
        register_token: registerToken,
        fcmToken,
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
      persistSession({ user: res.user, tokens: tokens || undefined });

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
      const fcmToken = await notificationService.getFcmToken().catch(() => null);
      const res = await authApi.login({
        email: pendingEmail,
        password,
        fcmToken,
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
        hasPin: !!res.user?.login_pin_exist,
      });
      persistSession({ user: res.user, tokens: tokens || undefined, hasPin: !!res.user?.login_pin_exist });

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
      const fcmToken = await notificationService.getFcmToken().catch(() => null);
      const res = await authApi.oauthLogin({ provider, id_token: idToken, fcmToken });
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
      persistSession({ user: res.user, tokens: tokens || undefined });

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
      const currentHasPin = get().hasPin;
      const keysExist = await biometricsService.checkKeysExist();
      const hasPin = profile.login_pin_exist !== undefined ? profile.login_pin_exist : (currentHasPin || false);
      const hasBiometric = !!profile.biometric_exist;

      set({
        profile,
        hasPin,
        hasBiometric,
        isBiometricEnrolled: hasBiometric && keysExist,
      });
      persistSession({ profile, hasPin, hasBiometric });
      return profile;
    } catch {
      return null;
    }
  },

  setPin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userApi.setPin({ login_pin: pin });
      if (res.socket_tokens) {
        setSocketTokens(res.socket_tokens.socket_access_token, res.socket_tokens.socket_refresh_token);
      }
      set({
        isLoading: false,
        hasPin: true,
        socketTokens: res.socket_tokens || null,
      });
      persistSession({ hasPin: true });
    } catch (err) {
      const msg = extractErrorMessage(err);
      if (msg.toLowerCase().includes('already set')) {
        set({ isLoading: false, hasPin: true });
        return;
      }
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyPin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userApi.verifyPin({ login_pin: pin });
      if (res.socket_tokens) {
        setSocketTokens(res.socket_tokens.socket_access_token, res.socket_tokens.socket_refresh_token);
      }
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
    const keysExist = available ? await biometricsService.checkKeysExist() : false;
    const { hasBiometric } = get();
    const enrolled = hasBiometric && keysExist;
    set({
      isBiometricsAvailable: available,
      biometryType,
      isBiometricEnrolled: enrolled,
    });
    return { available, biometryType, enrolled };
  },

  enrollBiometrics: async () => {
    const { profile, user } = get();
    const userId = profile?.userId || user?.userId || (user as any)?._id || (user as any)?.id;
    if (!userId) {
      throw new Error('User identity required to register biometric key.');
    }

    set({ isLoading: true, error: null });
    try {
      await biometricsService.enroll(userId);
      set({
        isLoading: false,
        isBiometricEnrolled: true,
        hasBiometric: true,
      });
      persistSession({ hasBiometric: true });
      await get().fetchProfile();
    } catch (err) {
      const msg = extractErrorMessage(err);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyBiometrics: async () => {
    const { profile, user } = get();
    const userId = profile?.userId || user?.userId || (user as any)?._id || (user as any)?.id;
    if (!userId) {
      throw new Error('User identifier not found.');
    }

    set({ isLoading: true, error: null });
    try {
      // 1. Authenticate with device hardware sensor
      const { success, signature } = await biometricsService.authenticate(userId);
      if (success) {
        // 2. Retrieve hardware-secured tokens from Keychain
        let secureTokens = await keychainService.getTokens();

        if (secureTokens?.access_token) {
          setAuthTokens(secureTokens.access_token, secureTokens.refresh_token);
        }

        // If socket tokens are present in Keychain, restore them immediately
        if (secureTokens?.socket_access_token && secureTokens?.socket_refresh_token) {
          setSocketTokens(secureTokens.socket_access_token, secureTokens.socket_refresh_token);
          set({
            socketTokens: {
              socket_access_token: secureTokens.socket_access_token,
              socket_refresh_token: secureTokens.socket_refresh_token,
            },
          });
        } else if (signature) {
          // If socket tokens weren't in Keychain yet, sync them once
          try {
            const res = await userApi.verifyBiometric({ signature });
            if (res?.socket_tokens) {
              setSocketTokens(res.socket_tokens.socket_access_token, res.socket_tokens.socket_refresh_token);
              set({ socketTokens: res.socket_tokens });
              persistSession({ socketTokens: res.socket_tokens });
            }
          } catch (e: any) {
            console.warn('[authStore] Initial socket token acquisition error:', e.message);
          }
        }

        set({
          isLoading: false,
          isAuthenticated: true,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      const msg = extractErrorMessage(err);
      if (
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('biometric key') ||
        msg.toLowerCase().includes('provider') ||
        msg.toLowerCase().includes('invalidated') ||
        msg.toLowerCase().includes('missing')
      ) {
        set({ isLoading: false, isBiometricEnrolled: false });
      } else {
        set({ isLoading: false, error: msg });
      }
      throw new Error(msg);
    }
  },


  restoreSession: (session: StoredSession) => {
    if (session?.tokens?.access_token) {
      setAuthTokens(session.tokens.access_token, session.tokens.refresh_token);
      set({
        user: session.user || null,
        profile: session.profile || null,
        tokens: session.tokens,
        hasPin: !!session.hasPin,
        hasBiometric: !!session.hasBiometric,
        isAuthenticated: true,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await userApi.logout();
    } catch {
      // Ignore error on logout
    } finally {
      marketAlertService.reset();
      socketService.disconnect();
      Toast.hide();
      storageService.removeItem('aura_auth_session');
      await keychainService.clearTokens();
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
        hasBiometric: false,
        isBiometricEnrolled: false,
        isLoading: false,
        error: null,
      });
    }
  },


  clearError: () => set({ error: null }),
}));

// Sync refreshed FCM tokens if user is logged in
notificationService.setOnTokenRefresh(async (newToken) => {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      await userApi.updateFcmToken(newToken);
      console.log('[authStore] Refreshed FCM token synced with backend.');
    } catch (err) {
      console.warn('[authStore] Failed to sync refreshed FCM token:', err);
    }
  }
});

