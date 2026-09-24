import ReactNativeBiometrics, { BiometryType } from 'react-native-biometrics';
import { userApi } from '../user/user.api';
import { SocketTokens } from '../user/user.types';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

export interface BiometricsAvailability {
  available: boolean;
  biometryType: BiometryType | null;
  error?: string;
}

export const biometricsService = {
  /**
   * Check if the device hardware supports biometric authentication and has enrolled credentials
   */
  checkAvailability: async (): Promise<BiometricsAvailability> => {
    try {
      const { available, biometryType, error } = await rnBiometrics.isSensorAvailable();
      return {
        available: !!available,
        biometryType: biometryType || null,
        error,
      };
    } catch (err: any) {
      return {
        available: false,
        biometryType: null,
        error: err?.message || 'Biometrics check failed',
      };
    }
  },

  /**
   * Check if RSA key pair exists on the device keystore/keychain
   */
  checkKeysExist: async (): Promise<boolean> => {
    try {
      const { keysExist } = await rnBiometrics.biometricKeysExist();
      return !!keysExist;
    } catch {
      return false;
    }
  },

  /**
   * Enroll device biometric:
   * 1. Clear any old keys on the device.
   * 2. Generate a fresh RSA 2048 key pair.
   * 3. Prompt the physical biometric sensor to sign the userId payload.
   * 4. Upload the public key to the backend (/auth/upload-biometric).
   */
  enroll: async (
    userId: string,
    promptMessage = 'Scan your fingerprint or Face ID to activate biometric security'
  ): Promise<string> => {
    // 1. Delete any existing keys to guarantee a clean state
    await rnBiometrics.deleteKeys();

    // 2. Generate fresh RSA 2048 key pair
    const { publicKey } = await rnBiometrics.createKeys();
    if (!publicKey) {
      throw new Error('Failed to generate biometric cryptographic keys on device.');
    }

    // 3. Prompt user's biometric to sign userId payload
    const { success, signature, error } = await rnBiometrics.createSignature({
      promptMessage,
      payload: userId,
      cancelButtonText: 'Cancel',
    });

    if (!success || !signature) {
      await rnBiometrics.deleteKeys();
      if (error && error !== 'User cancellation') {
        throw new Error(error);
      }
      throw new Error('Biometric scan was cancelled.');
    }

    // 4. Upload the public key to backend
    await userApi.uploadBiometric({ public_key: publicKey });
    return publicKey;
  },

  /**
   * Prompt biometric authentication dialog, verify via device hardware keystore,
   * and unlock locally stored secure tokens without blocking on server cold start.
   */
  authenticate: async (
    userId: string,
    promptMessage = 'Confirm fingerprint or Face ID to unlock'
  ): Promise<{ success: boolean; signature?: string }> => {
    // 1. Verify that hardware keys exist on device before attempting signature
    const keysExist = await biometricsService.checkKeysExist();
    if (!keysExist) {
      throw new Error('Biometric key not found on this device. Please re-enroll.');
    }

    const { success, signature, error } = await rnBiometrics.createSignature({
      promptMessage,
      payload: userId,
      cancelButtonText: 'Use PIN',
    });

    if (!success || !signature) {
      if (error && error !== 'User cancellation') {
        if (
          error.includes('No installed provider supports this key') ||
          error.includes('(null)') ||
          error.includes('Key permanently invalidated') ||
          error.includes('Key not found')
        ) {
          await rnBiometrics.deleteKeys().catch(() => {});
          throw new Error('Biometric key is missing or invalidated on this device. Please re-enroll.');
        }
        throw new Error(error);
      }
      return { success: false };
    }

    // Fire background verification silently without blocking the user
    userApi
      .verifyBiometric({ signature })
      .then((res) => {
        if (res?.socket_tokens) {
          console.log('[Biometrics] Background socket tokens refreshed successfully.');
        }
      })
      .catch((err) => {
        console.log('[Biometrics] Background sync pending server wake-up:', err.message);
      });

    return { success: true, signature };
  },


  /**
   * Delete biometric keys from device keystore/keychain
   */
  deleteKeys: async (): Promise<boolean> => {
    try {
      const { keysDeleted } = await rnBiometrics.deleteKeys();
      return !!keysDeleted;
    } catch {
      return false;
    }
  },
};
