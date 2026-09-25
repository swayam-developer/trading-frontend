import {
  GoogleSignin,
  statusCodes,
  SignInResponse,
  User,
} from '@react-native-google-signin/google-signin';
import { AUTH_CONFIG } from '../../constant/auth.config';

export interface GoogleAuthResult {
  idToken: string;
  user: User['user'];
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isConfigured = false;

  private constructor() {}

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Initializes the Google Sign-In SDK with Web Client ID.
   * Google Play Services on Android automatically binds this with the Android Client ID
   * based on package name and SHA-1 fingerprint.
   */
  public configure(): void {
    if (this.isConfigured) return;

    try {
      GoogleSignin.configure({
        webClientId: AUTH_CONFIG.GOOGLE.WEB_CLIENT_ID,
        scopes: AUTH_CONFIG.GOOGLE.SCOPES,
        offlineAccess: AUTH_CONFIG.GOOGLE.OFFLINE_ACCESS,
      });
      this.isConfigured = true;
      console.log('[GoogleAuthService] Google Sign-In configured successfully.');
    } catch (error) {
      console.error('[GoogleAuthService] Configuration error:', error);
    }
  }

  /**
   * Prompts user to select a Google account and sign in.
   * Returns the OpenID Connect idToken required by the backend /auth/oauth endpoint.
   */
  public async signIn(): Promise<GoogleAuthResult | null> {
    this.configure();

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response: SignInResponse = await GoogleSignin.signIn();

      if (response.type === 'cancelled') {
        console.log('[GoogleAuthService] Sign-in cancelled by user.');
        return null;
      }

      const idToken = response.data?.idToken || (response as any).idToken;
      const user = response.data?.user || (response as any).user;

      if (!idToken) {
        throw new Error(
          'Failed to retrieve Google ID Token. Ensure webClientId is valid in auth.config.ts.'
        );
      }

      return {
        idToken,
        user,
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GoogleAuthService] Sign-in cancelled by user.');
        return null;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is not available or outdated on this device.');
      } else {
        console.error('[GoogleAuthService] Sign-in error:', error);
        throw new Error(error.message || 'Google authentication failed.');
      }
    }
  }

  /**
   * Signs out the user from Google Sign-In cache.
   */
  public async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('[GoogleAuthService] Sign-out error:', error);
    }
  }

  /**
   * Revokes access permissions for current Google account.
   */
  public async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('[GoogleAuthService] Revoke access error:', error);
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
