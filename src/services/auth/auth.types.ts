export type OtpType = 'phone' | 'email' | 'reset_password' | 'reset_pin';

export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  isExist: boolean;
  otp?: string;
}

export interface SendOtpRequest {
  email: string;
  otp_type: OtpType;
}

export interface SendOtpResponse {
  msg: string;
  otp?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  otp_type: OtpType;
  data?: string | null;
}

export interface VerifyOtpResponse {
  msg: string;
  register_token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  register_token: string;
}

export interface UserEntity {
  _id: string;
  userId?: string;
  email: string;
  name?: string;
  phone_number?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  balance?: number | string;
  phone_exist?: boolean;
  login_pin_exist?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface RegisterResponse {
  user: UserEntity;
  tokens: AuthTokens;
  token?: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserEntity;
  tokens?: AuthTokens;
  token?: AuthTokens;
}

export interface OAuthRequest {
  provider: 'google' | 'apple';
  id_token: string;
}

export interface RefreshTokenRequest {
  type: 'app' | 'socket';
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface ApiErrorResponse {
  msg?: string;
  message?: string;
}
