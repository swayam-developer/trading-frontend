import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { storageService, StoredSession } from './storage.service';
import { useAuthStore } from '../../store/auth/authStore';

const HTML_SOURCE = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script>
  function notifyInit() {
    try {
      var all = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        all[k] = localStorage.getItem(k);
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'INIT', data: all }));
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'INIT', data: {} }));
    }
  }

  window.addEventListener('message', function(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'SET') {
        localStorage.setItem(msg.key, msg.val);
      } else if (msg.type === 'REMOVE') {
        localStorage.removeItem(msg.key);
      } else if (msg.type === 'CLEAR') {
        localStorage.clear();
      }
    } catch (err) {}
  });

  setTimeout(notifyInit, 30);
</script>
</body>
</html>
`;

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webViewRef = useRef<any>(null);
  const WebViewComponent = WebView as any;

  useEffect(() => {
    storageService.setSender((msg) => {
      try {
        webViewRef.current?.postMessage(JSON.stringify(msg));
      } catch (err) {
        console.warn('StorageProvider message send error:', err);
      }
    });
  }, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'INIT') {
        storageService.handleInit(payload.data || {});

        // Automatically restore session if present
        const rawSession = payload.data?.['aura_auth_session'];
        if (rawSession) {
          try {
            const session: StoredSession = JSON.parse(rawSession);
            if (session?.tokens?.access_token) {
              useAuthStore.getState().restoreSession(session);
            }
          } catch (e) {
            console.warn('Failed to parse restored session:', e);
          }
        }
      }
    } catch (err) {
      console.warn('StorageProvider onMessage error:', err);
    }
  };

  return (
    <View style={styles.container}>
      {children}
      <View style={styles.hiddenContainer} pointerEvents="none">
        <WebViewComponent
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: HTML_SOURCE }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={styles.hiddenWebView}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hiddenContainer: {
    width: 0,
    height: 0,
    position: 'absolute',
    top: -100,
    left: -100,
    opacity: 0,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
