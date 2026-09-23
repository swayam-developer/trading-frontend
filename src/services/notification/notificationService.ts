import {
  getMessaging,
  requestPermission,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  AuthorizationStatus,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

class NotificationService {
  private currentFcmToken: string | null = null;
  private onTokenRefreshCallback: ((token: string) => void) | null = null;

  /**
   * Request system & FCM permissions and fetch current device FCM token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[NotificationService] Android POST_NOTIFICATIONS permission denied');
          return null;
        }
      }

      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await getToken(messagingInstance);
        this.currentFcmToken = token;
        console.log('[NotificationService] FCM Token obtained:', token);
        return token;
      }
      return null;
    } catch (error) {
      console.warn('[NotificationService] Error requesting permission/token:', error);
      return null;
    }
  }

  /**
   * Get cached FCM token or request a fresh one
   */
  async getFcmToken(): Promise<string | null> {
    if (this.currentFcmToken) {
      return this.currentFcmToken;
    }
    return this.requestPermissionAndGetToken();
  }

  /**
   * Set callback for token refreshes
   */
  setOnTokenRefresh(callback: (token: string) => void) {
    this.onTokenRefreshCallback = callback;
  }

  /**
   * Initialize notification handlers and foreground listener
   */
  initializeListeners(onNotificationClick?: (message: RemoteMessage) => void) {
    try {
      const messagingInstance = getMessaging();

      // 1. Listen for foreground notifications
      const unsubscribeForeground = onMessage(messagingInstance, async (remoteMessage: RemoteMessage) => {
        console.log('[NotificationService] Foreground notification received:', remoteMessage);

        const title = remoteMessage.notification?.title || 'Notification';
        const body = remoteMessage.notification?.body || '';

        Toast.show({
          type: 'info',
          text1: title,
          text2: body,
          visibilityTime: 6000,
          onPress: () => {
            Toast.hide();
            if (onNotificationClick) {
              onNotificationClick(remoteMessage);
            }
          },
        });
      });

      // 2. Notification opened while app was in background
      const unsubscribeNotificationOpened = onNotificationOpenedApp(messagingInstance, (remoteMessage: RemoteMessage) => {
        console.log('[NotificationService] Notification opened from background:', remoteMessage);
        if (onNotificationClick) {
          onNotificationClick(remoteMessage);
        }
      });

      // 3. Notification opened while app was completely closed (quit state)
      getInitialNotification(messagingInstance)
        .then((remoteMessage: RemoteMessage | null) => {
          if (remoteMessage) {
            console.log('[NotificationService] Notification opened from quit state:', remoteMessage);
            if (onNotificationClick) {
              onNotificationClick(remoteMessage);
            }
          }
        });

      // 4. Token refresh listener
      const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, (newToken: string) => {
        console.log('[NotificationService] FCM Token refreshed:', newToken);
        this.currentFcmToken = newToken;
        if (this.onTokenRefreshCallback) {
          this.onTokenRefreshCallback(newToken);
        }
      });

      // Also proactively obtain token
      this.requestPermissionAndGetToken().catch(() => {});

      return () => {
        unsubscribeForeground();
        unsubscribeNotificationOpened();
        unsubscribeTokenRefresh();
      };
    } catch (error) {
      console.warn('[NotificationService] Error initializing listeners:', error);
      return () => {};
    }
  }
}

export const notificationService = new NotificationService();
