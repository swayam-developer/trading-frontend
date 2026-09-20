import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

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
  SetPin: undefined;
  VerifyPin: undefined;
  Dashboard: undefined;
};

export type RootNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
