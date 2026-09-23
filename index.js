/**
 * @format
 */

import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background message handler
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  console.log('[FCM Background Message]', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
