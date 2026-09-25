import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { Stock } from '../services/stock/stock.types';

export type MainTabParamList = {
  Markets: undefined;
  Portfolio: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  EmailCheck: undefined;
  VerifyOtp: {
    email: string;
    otp_type?: 'email' | 'phone' | 'reset_password' | 'reset_pin';
    testOtp?: string;
  };
  Register: {
    email: string;
    registerToken: string;
  };
  Login: {
    email: string;
  };
  ResetPassword: {
    email: string;
    otp: string;
  };
  ResetPin: {
    email: string;
    otp: string;
  };
  SetPin: undefined;
  VerifyPin: undefined;
  Dashboard: undefined;
  MainTabs: undefined;
  StockDetail: {
    stock: Stock;
  };
};

export type RootNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;

export type MainTabRouteProp<T extends keyof MainTabParamList> = RouteProp<
  MainTabParamList,
  T
>;
