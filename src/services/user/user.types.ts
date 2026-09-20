export interface ProfileResponse {
  userId: string;
  email: string;
  phone_exist: boolean;
  name: string;
  login_pin_exist: boolean;
  balance: string;
}

export interface UpdateProfileRequest {
  name?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  data: {
    _id: string;
    email: string;
    name?: string;
    phone_number?: string | null;
    gender?: string;
    balance?: number;
  };
}

export interface SocketTokens {
  socket_access_token: string;
  socket_refresh_token: string;
}

export interface SetPinRequest {
  login_pin: string; // 4-digit PIN
}

export interface SetPinResponse {
  success: boolean;
  socket_tokens?: SocketTokens;
}

export interface VerifyPinRequest {
  login_pin: string; // 4-digit PIN
}

export interface VerifyPinResponse {
  success: boolean;
  socket_tokens?: SocketTokens;
}

export interface UploadBiometricRequest {
  public_key: string;
}

export interface UploadBiometricResponse {
  msg: string;
}

export interface VerifyBiometricRequest {
  signature: string;
}

export interface VerifyBiometricResponse {
  success: boolean;
  socket_tokens?: SocketTokens;
}

export interface LogoutResponse {
  message: string;
}
