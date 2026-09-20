import { apiClient } from '../apiClient';
import {
  CheckEmailRequest,
  CheckEmailResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  OAuthRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './auth.types';

export const authApi = {
  /**
   * Check if email exists in the system.
   * If not, sends an OTP for registration.
   */
  checkEmail: async (data: CheckEmailRequest): Promise<CheckEmailResponse> => {
    const response = await apiClient.post<CheckEmailResponse>('/auth/check-email', data);
    return response.data;
  },

  /**
   * Send an OTP to email for email verification or password/pin reset
   */
  sendOtp: async (data: SendOtpRequest): Promise<SendOtpResponse> => {
    const response = await apiClient.post<SendOtpResponse>('/auth/send-otp', data);
    return response.data;
  },

  /**
   * Verify the 6-digit OTP sent to email
   */
  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', data);
    return response.data;
  },

  /**
   * Register a new user with email, password, and registration token from OTP
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * User login with email and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * OAuth login with Google or Apple ID token
   */
  oauthLogin: async (data: OAuthRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/oauth', data);
    return response.data;
  },

  /**
   * Refresh expired access token using refresh token
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh-token', data);
    return response.data;
  },
};
