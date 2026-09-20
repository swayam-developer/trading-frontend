import { apiClient } from '../apiClient';
import {
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  SetPinRequest,
  SetPinResponse,
  VerifyPinRequest,
  VerifyPinResponse,
  UploadBiometricRequest,
  UploadBiometricResponse,
  VerifyBiometricRequest,
  VerifyBiometricResponse,
  LogoutResponse,
} from './user.types';

export const userApi = {
  /**
   * Get authenticated user profile details
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  /**
   * Update authenticated user profile details
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await apiClient.put<UpdateProfileResponse>('/auth/profile', data);
    return response.data;
  },

  /**
   * Set a 4-digit login PIN
   */
  setPin: async (data: SetPinRequest): Promise<SetPinResponse> => {
    const response = await apiClient.post<SetPinResponse>('/auth/set-pin', data);
    return response.data;
  },

  /**
   * Verify the 4-digit login PIN and receive WebSocket tokens
   */
  verifyPin: async (data: VerifyPinRequest): Promise<VerifyPinResponse> => {
    const response = await apiClient.post<VerifyPinResponse>('/auth/verify-pin', data);
    return response.data;
  },

  /**
   * Upload device biometric public key
   */
  uploadBiometric: async (data: UploadBiometricRequest): Promise<UploadBiometricResponse> => {
    const response = await apiClient.post<UploadBiometricResponse>('/auth/upload-biometric', data);
    return response.data;
  },

  /**
   * Verify device biometric signature and receive WebSocket tokens
   */
  verifyBiometric: async (data: VerifyBiometricRequest): Promise<VerifyBiometricResponse> => {
    const response = await apiClient.post<VerifyBiometricResponse>('/auth/verify-biometric', data);
    return response.data;
  },

  /**
   * Logout user and invalidate token
   */
  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>('/auth/logout');
    return response.data;
  },
};
