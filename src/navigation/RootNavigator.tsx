import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/splash/SplashScreen';
import { EmailCheckScreen } from '../screens/auth/emailCheck/EmailCheckScreen';
import { VerifyOtpScreen } from '../screens/auth/verifyOtp/VerifyOtpScreen';
import { RegisterScreen } from '../screens/auth/register/RegisterScreen';
import { LoginScreen } from '../screens/auth/login/LoginScreen';
import { ResetPasswordScreen } from '../screens/auth/resetPassword/ResetPasswordScreen';
import { SetPinScreen } from '../screens/auth/pin/SetPinScreen';
import { VerifyPinScreen } from '../screens/auth/pin/VerifyPinScreen';
import { ResetPinScreen } from '../screens/auth/pin/ResetPinScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { StockDetailScreen } from '../screens/stockDetail/StockDetailScreen';
import { Colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="EmailCheck" component={EmailCheckScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="VerifyPin" component={VerifyPinScreen} />
      <Stack.Screen name="ResetPin" component={ResetPinScreen} />
      <Stack.Screen name="Dashboard" component={MainTabNavigator} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="StockDetail" component={StockDetailScreen} />
    </Stack.Navigator>
  );
};
