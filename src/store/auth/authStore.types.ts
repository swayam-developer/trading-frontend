import { UserEntity, AuthTokens, OtpType } from '../../services/auth/auth.types';
import { ProfileResponse, SocketTokens } from '../../services/user/user.types';

export interface AuthState {
  // Authentication State
  user: UserEntity | null;
  profile: ProfileResponse | null;
  tokens: AuthTokens | null;
  socketTokens: SocketTokens | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  pendingEmail: string | null;
  registerToken: string | null;
  hasPin: boolean;
  hasBiometric: boolean;
  
  // Biometric State
  isBiometricsAvailable: boolean;
  biometryType: string | null;
  isBiometricEnrolled: boolean;
  
  // Loading & Error States
  isLoading: boolean;
  error: string | null;

  // Actions
  setPendingEmail: (email: string) => void;
  checkEmail: (email: string) => Promise<{ isExist: boolean; otp?: string }>;
  sendOtp: (email: string, otp_type?: 'email' | 'phone' | 'reset_password' | 'reset_pin') => Promise<string>;
  verifyOtp: (email: string, otp: string, otp_type?: OtpType) => Promise<string | undefined>;
  register: (password: string) => Promise<void>;
  login: (password: string) => Promise<void>;
  oauthLogin: (provider: 'google' | 'apple', idToken: string) => Promise<void>;
  fetchProfile: () => Promise<ProfileResponse | null>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  checkBiometrics: () => Promise<{ available: boolean; biometryType: string | null; enrolled: boolean }>;
  enrollBiometrics: () => Promise<void>;
  verifyBiometrics: () => Promise<boolean>;
  restoreSession: (session: any) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}
