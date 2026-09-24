import * as Keychain from 'react-native-keychain';

export interface SecureTokensPayload {
  access_token: string;
  refresh_token: string;
  socket_access_token?: string;
  socket_refresh_token?: string;
}

const KEYCHAIN_SERVICE = 'com.auratrading.auth';

export const keychainService = {
  /**
   * Securely store tokens inside Android KeyStore / iOS Keychain
   */
  saveTokens: async (payload: SecureTokensPayload): Promise<boolean> => {
    try {
      await Keychain.setGenericPassword('aura_user', JSON.stringify(payload), {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });
      return true;
    } catch (error) {
      console.warn('[KeychainService] Error saving tokens to Keychain:', error);
      return false;
    }
  },

  /**
   * Retrieve securely stored tokens from Keychain
   */
  getTokens: async (): Promise<SecureTokensPayload | null> => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });
      if (credentials && credentials.password) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch (error) {
      console.warn('[KeychainService] Error getting tokens from Keychain:', error);
      return null;
    }
  },

  /**
   * Clear credentials on logout
   */
  clearTokens: async (): Promise<boolean> => {
    try {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      return true;
    } catch (error) {
      console.warn('[KeychainService] Error clearing tokens from Keychain:', error);
      return false;
    }
  },
};
