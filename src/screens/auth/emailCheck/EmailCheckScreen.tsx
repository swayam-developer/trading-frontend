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
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';
import { ActivityIndicator } from 'react-native';
import { RootNavigationProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraInput } from '../../../components/common/AuraInput';
import { AuraButton } from '../../../components/common/AuraButton';
import { GoogleLogoIcon } from '../../../components/common/GoogleLogoIcon';
import { useAuthStore } from '../../../store/auth/authStore';
import { googleAuthService } from '../../../services/auth/googleAuth.service';

export const EmailCheckScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'EmailCheck'>>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { checkEmail, oauthLogin, isLoading } = useAuthStore();

  const isEmailValidFormat = (val: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val.trim());
  };

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!isEmailValidFormat(val)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleContinue = async () => {
    if (!validateEmail(email)) return;

    try {
      const result = await checkEmail(email.trim());

      if (result.isExist) {
        Toast.show({
          type: 'info',
          text1: 'Welcome Back',
          text2: 'Please enter your password to sign in.',
        });
        navigation.navigate('Login', { email: email.trim() });
      } else {
        Toast.show({
          type: 'success',
          text1: result.otp ? `Test OTP: ${result.otp}` : 'Verification Code Sent',
          text2: result.otp
            ? 'SMTP disabled for testing. Use this code to verify.'
            : 'Verification code sent to your email.',
          visibilityTime: 10000,
        });
        navigation.navigate('VerifyOtp', {
          email: email.trim(),
          otp_type: 'email',
          testOtp: result.otp,
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Email Verification Failed',
        text2: err.message || 'Unable to check email.',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const authResult = await googleAuthService.signIn();
      if (!authResult) {
        // User dismissed the Google sign-in dialog
        setIsGoogleLoading(false);
        return;
      }

      await oauthLogin('google', authResult.idToken);

      const store = useAuthStore.getState();
      const userName = store.user?.name || authResult.user.name || 'Trader';

      Toast.show({
        type: 'success',
        text1: 'Welcome Back',
        text2: `Signed in as ${userName}`,
      });

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
        text1: 'Google Sign-In Failed',
        text2: err.message || 'Unable to sign in with Google.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isValid = isEmailValidFormat(email);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* Ambient Background Glow Effect */}
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.headerSection}>
          <AuraLogo size={58} showTagline={false} />
          <View style={styles.stepBadge}>
            <View style={styles.stepDot} />
            <Text style={styles.stepBadgeText}>INSTITUTIONAL ACCESS</Text>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Start Trading</Text>
          <Text style={styles.subtitle}>
            Enter your email to sign in or create an Aura Trading institutional account.
          </Text>

          <View style={styles.inputContainer}>
            <AuraInput
              label="Email Address"
              icon="mail-outline"
              placeholder="name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
            />
            {isValid && !emailError && (
              <View style={styles.validCheckmark} pointerEvents="none">
                <Icon name="checkmark-circle" size={moderateScale(18)} color={Colors.primary} />
              </View>
            )}
          </View>

          <AuraButton
            title="Continue"
            onPress={handleContinue}
            loading={isLoading}
            style={styles.continueBtn}
            icon={
              <Icon
                name="arrow-forward"
                size={moderateScale(18)}
                color={Colors.background}
                style={{ marginLeft: scale(6) }}
              />
            }
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            activeOpacity={0.8}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <View style={styles.googleIconWrapper}>
                  <GoogleLogoIcon size={moderateScale(18)} />
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Institutional Trust Badges */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustBadgeItem}>
            <Icon name="shield-checkmark-outline" size={moderateScale(14)} color={Colors.primary} />
            <Text style={styles.trustBadgeText}>256-Bit SSL</Text>
          </View>
          <View style={styles.trustBadgeDot} />
          <View style={styles.trustBadgeItem}>
            <Icon name="flash-outline" size={moderateScale(14)} color={Colors.secondary} />
            <Text style={styles.trustBadgeText}>0% Commission</Text>
          </View>
          <View style={styles.trustBadgeDot} />
          <View style={styles.trustBadgeItem}>
            <Icon name="business-outline" size={moderateScale(14)} color={Colors.accentGold} />
            <Text style={styles.trustBadgeText}>SIPC Insured</Text>
          </View>
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
    top: -scale(100),
    left: scale(20),
    width: scale(240),
    height: scale(240),
    borderRadius: scale(120),
    backgroundColor: 'rgba(0, 230, 118, 0.05)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -scale(80),
    right: -scale(40),
    width: scale(220),
    height: scale(220),
    borderRadius: scale(110),
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(24),
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderColor: 'rgba(0, 230, 118, 0.25)',
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(6),
  },
  stepDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: Colors.primary,
    marginRight: scale(6),
  },
  stepBadgeText: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: scale(22),
    marginTop: verticalScale(14),
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
  inputContainer: {
    position: 'relative',
  },
  validCheckmark: {
    position: 'absolute',
    right: scale(14),
    top: verticalScale(38),
  },
  continueBtn: {
    marginTop: verticalScale(12),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(18),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    color: Colors.textMuted,
    marginHorizontal: scale(12),
    fontSize: moderateScale(11),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(50),
    backgroundColor: '#1C2029',
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  googleIconWrapper: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14.5),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(26),
    paddingHorizontal: scale(10),
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustBadgeText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '500',
    marginLeft: scale(4),
  },
  trustBadgeDot: {
    width: scale(3),
    height: scale(3),
    borderRadius: scale(1.5),
    backgroundColor: Colors.divider,
    marginHorizontal: scale(10),
  },
});
