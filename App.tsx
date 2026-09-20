import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/theme/colors';
import { StorageProvider } from './src/services/storage/StorageProvider';

function App() {
  return (
    <SafeAreaProvider>
      <StorageProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <Toast />
      </StorageProvider>
    </SafeAreaProvider>
  );
}

export default App;
