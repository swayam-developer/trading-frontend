import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp, RootRouteProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraInput } from '../../../components/common/AuraInput';
import { AuraButton } from '../../../components/common/AuraButton';
import { useAuthStore } from '../../../store/auth/authStore';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'Login'>>();
  const route = useRoute<RootRouteProp<'Login'>>();
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { login, sendOtp, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter your password.');
      return;
    }

    setPasswordError(null);

    try {
      await login(password);
      Toast.show({
        type: 'success',
        text1: 'Signed In Successfully',
        text2: 'Welcome to Aura Trading.',
      });

      const store = useAuthStore.getState();
      if (store.hasPin || store.hasBiometric) {
        navigation.replace('VerifyPin');
      } else {
        navigation.replace('SetPin');
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Failed',
        text2: err.message || 'Invalid email or password.',
      });
    }
  };

  const handleForgotPassword = async () => {
    try {
      await sendOtp(email, 'reset_password');
      Toast.show({
        type: 'info',
        text1: 'Reset Code Sent',
        text2: `A reset OTP was sent to ${email}`,
      });
      navigation.navigate('VerifyOtp', { email, otp_type: 'reset_password' });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Unable to send reset OTP.',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AuraLogo size={50} showTagline={false} />

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <View style={styles.emailRow}>
            <Text style={styles.emailText}>{email}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.changeEmailText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <AuraInput
            label="Password"
            icon="lock-closed-outline"
            placeholder="Enter your account password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            isPassword
            error={passwordError}
          />

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <AuraButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(30),
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: scale(20),
    marginTop: verticalScale(10),
  },
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '700',
    marginBottom: verticalScale(6),
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  emailText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
  },
  changeEmailText: {
    color: Colors.secondary,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(12),
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
});
