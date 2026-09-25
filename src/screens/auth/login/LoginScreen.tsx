import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
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

  const {
    login,
    forgotPassword,
    isLoading,
    isBiometricsAvailable,
    isBiometricEnrolled,
    hasBiometric,
    biometryType,
    verifyBiometrics,
  } = useAuthStore();

  const biometricName = biometryType === 'FaceID' ? 'Face ID' : 'Fingerprint';
  const biometricIcon = biometryType === 'FaceID' ? 'scan-outline' : 'finger-print-outline';
  const canUseBiometrics = isBiometricsAvailable && (isBiometricEnrolled || hasBiometric);

  const handleLogin = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter your account password.');
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
      const hasSecuritySet =
        store.hasPin ||
        store.hasBiometric ||
        !!store.profile?.login_pin_exist ||
        !!store.profile?.biometric_exist ||
        !!store.user?.login_pin_exist;

      if (hasSecuritySet) {
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

  const handleBiometricQuickLogin = async () => {
    try {
      const verified = await verifyBiometrics();
      if (verified) {
        Toast.show({
          type: 'success',
          text1: 'Biometric Authenticated',
          text2: 'Welcome back to Aura Trading.',
        });
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Biometric Verification Failed',
        text2: err.message || 'Please use your password.',
      });
    }
  };

  const handleForgotPassword = async () => {
    try {
      const res = await forgotPassword(email);
      Toast.show({
        type: 'info',
        text1: 'Reset Code Sent',
        text2: res.msg || `A password reset code was sent to ${email}`,
      });
      navigation.navigate('VerifyOtp', {
        email,
        otp_type: 'reset_password',
        testOtp: res?.otp,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: err.message || 'Unable to send password reset code.',
      });
    }
  };

  const emailInitial = email ? email.charAt(0).toUpperCase() : 'A';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* Ambient Backlight Glow */}
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowBottom} pointerEvents="none" />

      {/* Top Back Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={moderateScale(20)} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuraLogo size={52} showTagline={false} />

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your password to access your trading portfolio</Text>

          {/* User Account Tile */}
          <View style={styles.accountTile}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{emailInitial}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountEmail} numberOfLines={1} ellipsizeMode="middle">
                {email}
              </Text>
              <Text style={styles.accountStatus}>Registered Trader</Text>
            </View>
            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icon name="pencil" size={moderateScale(12)} color={Colors.secondary} style={{ marginRight: 3 }} />
              <Text style={styles.changeEmailText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Password Input */}
          <AuraInput
            label="Account Password"
            icon="lock-closed-outline"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            isPassword
            error={passwordError}
          />

          <View style={styles.forgotRow}>
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <AuraButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.signInBtn}
            icon={
              <Icon
                name="log-in-outline"
                size={moderateScale(18)}
                color={Colors.background}
                style={{ marginRight: scale(6) }}
              />
            }
          />

          {/* Quick Biometric Access if Enrolled */}
          {canUseBiometrics && (
            <TouchableOpacity
              style={styles.biometricQuickBtn}
              onPress={handleBiometricQuickLogin}
              activeOpacity={0.75}
            >
              <Icon name={biometricIcon} size={moderateScale(18)} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.biometricQuickText}>Sign in with {biometricName}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.securityFooter}>
          <Icon name="shield-checkmark" size={moderateScale(13)} color={Colors.primary} style={{ marginRight: 5 }} />
          <Text style={styles.securityFooterText}>Encrypted & Authenticated Session</Text>
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
  ambientGlowTop: {
    position: 'absolute',
    top: -scale(80),
    right: scale(10),
    width: scale(220),
    height: scale(220),
    borderRadius: scale(110),
    backgroundColor: 'rgba(0, 230, 118, 0.05)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -scale(80),
    left: -scale(30),
    width: scale(220),
    height: scale(220),
    borderRadius: scale(110),
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
  },
  topNav: {
    paddingHorizontal: scale(16),
    paddingTop: Platform.OS === 'ios' ? verticalScale(44) : verticalScale(14),
    paddingBottom: verticalScale(4),
  },
  backBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(30),
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: scale(22),
    marginTop: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '700',
    marginBottom: verticalScale(4),
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(18),
  },
  accountTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  avatarCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  avatarText: {
    color: Colors.primary,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  accountStatus: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginTop: 1,
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: moderateScale(6),
  },
  changeEmailText: {
    color: Colors.secondary,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: verticalScale(8),
    marginTop: verticalScale(2),
  },
  forgotPasswordContainer: {
    paddingVertical: verticalScale(4),
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  signInBtn: {
    marginTop: verticalScale(10),
  },
  biometricQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(46),
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    marginTop: verticalScale(12),
  },
  biometricQuickText: {
    color: Colors.primary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(24),
  },
  securityFooterText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
});
