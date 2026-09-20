import React, { useState, useEffect } from 'react';
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

export const VerifyOtpScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'VerifyOtp'>>();
  const route = useRoute<RootRouteProp<'VerifyOtp'>>();
  const { email, otp_type = 'email', testOtp } = route.params;

  const [otp, setOtp] = useState(testOtp || '');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { verifyOtp, sendOtp, isLoading } = useAuthStore();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a complete 6-digit OTP code.',
      });
      return;
    }

    try {
      const registerToken = await verifyOtp(email, otp.trim(), otp_type);
      Toast.show({
        type: 'success',
        text1: 'Verified Successfully',
        text2: 'Set your password to finish creating your account.',
      });

      navigation.navigate('Register', {
        email,
        registerToken: registerToken || '',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: err.message || 'The OTP is invalid or has expired.',
      });
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await sendOtp(email, otp_type);
      setCountdown(60);
      setCanResend(false);
      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: 'A new 6-digit code has been sent to your email.',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Resend',
        text2: err.message || 'Please wait before requesting another OTP.',
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
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We have sent a 6-digit verification code to{' '}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          {testOtp ? (
            <View style={styles.testOtpBanner}>
              <Text style={styles.testOtpLabel}>🧪 Test Mode (SMTP Disabled)</Text>
              <Text style={styles.testOtpValue}>
                Your OTP code is:{' '}
                <Text style={styles.testOtpCode}>{testOtp}</Text>
              </Text>
            </View>
          ) : null}

          <AuraInput
            label="6-Digit OTP Code"
            icon="key-outline"
            placeholder="e.g. 123456"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />

          <AuraButton
            title="Verify Code"
            onPress={handleVerify}
            loading={isLoading}
            disabled={otp.length !== 6}
          />

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerHighlight}>{countdown}s</Text>
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Change Email Address</Text>
          </TouchableOpacity>
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
  subtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
    marginBottom: verticalScale(20),
    lineHeight: moderateScale(18),
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(14),
  },
  resendLink: {
    color: Colors.secondary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  timerText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  timerHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  backButtonText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  testOtpBanner: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    borderColor: 'rgba(255, 179, 0, 0.35)',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    padding: scale(10),
    marginBottom: verticalScale(14),
    alignItems: 'center',
  },
  testOtpLabel: {
    color: '#FFB300',
    fontSize: moderateScale(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: verticalScale(3),
  },
  testOtpValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  testOtpCode: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    letterSpacing: 2,
  },
});
