/**
 * Authentication and OAuth Configuration
 */

export const AUTH_CONFIG = {
  // Google OAuth Configuration
  GOOGLE: {
    /**
     * Web Client ID (OAuth Client ID of type 'Web application' in Google Cloud Console / Firebase).
     * NOTE: Even for Android apps, @react-native-google-signin requires the Web Client ID
     * to mint an OpenID Connect idToken that your backend (/auth/oauth) can verify.
     *
     * The Android Client ID is identified automatically by Google Play Services
     * via your app package name (com.tradingfrontend) and SHA-1 certificate fingerprint.
     */
    WEB_CLIENT_ID: '511218824118-u7aloc7m3mm3vfa2edo7gis67ehub25d.apps.googleusercontent.com', // Replace with your Web Client ID
    SCOPES: ['email', 'profile'],
    OFFLINE_ACCESS: true,
  },
};
