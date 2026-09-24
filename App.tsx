import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/common/ToastConfig';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/theme/colors';
import { StorageProvider } from './src/services/storage/StorageProvider';
import { notificationService } from './src/services/notification/notificationService';

function App() {
  useEffect(() => {
    const unsubscribe = notificationService.initializeListeners();
    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StorageProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} topOffset={50} />
      </StorageProvider>
    </SafeAreaProvider>
  );
}

export default App;
