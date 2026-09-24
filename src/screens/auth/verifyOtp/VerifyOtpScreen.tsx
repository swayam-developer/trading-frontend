import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp, RootRouteProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraButton } from '../../../components/common/AuraButton';
import { useAuthStore } from '../../../store/auth/authStore';

export const VerifyOtpScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'VerifyOtp'>>();
  const route = useRoute<RootRouteProp<'VerifyOtp'>>();
  const { email, otp_type = 'email', testOtp } = route.params;

  const [otpArray, setOtpArray] = useState<string[]>(() => {
    if (testOtp && testOtp.length === 6) {
      return testOtp.split('');
    }
    return ['', '', '', '', '', ''];
  });
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { verifyOtp, sendOtp, isLoading } = useAuthStore();

  const currentOtp = otpArray.join('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first empty box or box 0 on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    // Handle paste of full 6-digit OTP
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length > 1) {
      const newArray = [...otpArray];
      for (let i = 0; i < 6; i++) {
        if (cleanText[i]) {
          newArray[i] = cleanText[i];
        }
      }
      setOtpArray(newArray);
      const targetIndex = Math.min(cleanText.length, 5);
      inputRefs.current[targetIndex]?.focus();
      setActiveIndex(targetIndex);
      return;
    }

    const newArray = [...otpArray];
    newArray[index] = cleanText.slice(-1);
    setOtpArray(newArray);

    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        const newArray = [...otpArray];
        newArray[index - 1] = '';
        setOtpArray(newArray);
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      } else {
        const newArray = [...otpArray];
        newArray[index] = '';
        setOtpArray(newArray);
      }
    }
  };

  const handleAutoFillTestOtp = () => {
    if (testOtp && testOtp.length === 6) {
      setOtpArray(testOtp.split(''));
      Toast.show({
        type: 'success',
        text1: 'Code Auto-filled',
        text2: `Filled code: ${testOtp}`,
      });
      inputRefs.current[5]?.focus();
      setActiveIndex(5);
    }
  };

  const handleVerify = async () => {
    if (currentOtp.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Code',
        text2: 'Please enter all 6 digits of the OTP code.',
      });
      return;
    }

    try {
      const registerToken = await verifyOtp(email, currentOtp, otp_type);
      Toast.show({
        type: 'success',
        text1: 'Identity Verified',
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
      setOtpArray(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setActiveIndex(0);

      Toast.show({
        type: 'success',
        text1: 'New Code Sent',
        text2: 'A new 6-digit code has been dispatched.',
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

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
        <AuraLogo size={50} showTagline={false} />

        <View style={styles.card}>
          <Text style={styles.title}>Verify Email Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit security code sent to{' '}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          {/* Test Mode Banner */}
          {testOtp ? (
            <TouchableOpacity
              style={styles.testOtpBanner}
              onPress={handleAutoFillTestOtp}
              activeOpacity={0.8}
            >
              <View style={styles.testOtpHeader}>
                <View style={styles.testPill}>
                  <Icon name="code-slash" size={moderateScale(12)} color="#FFB300" style={{ marginRight: 4 }} />
                  <Text style={styles.testPillText}>DEVELOPER TEST MODE</Text>
                </View>
                <Text style={styles.tapToFillText}>Tap to Auto-fill</Text>
              </View>
              <View style={styles.testCodeRow}>
                <Text style={styles.testOtpLabel}>Verification Code:</Text>
                <Text style={styles.testOtpCode}>{testOtp}</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* 6-Digit Split Box OTP Input */}
          <View style={styles.otpGrid}>
            {otpArray.map((digit, index) => {
              const isFocused = activeIndex === index;
              const isFilled = digit.length > 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    isFilled && styles.otpBoxFilled,
                  ]}
                >
                  <TextInput
                    ref={(el) => (inputRefs.current[index] = el)}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setActiveIndex(index)}
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                    caretHidden={false}
                    cursorColor={Colors.primary}
                  />
                </View>
              );
            })}
          </View>

          <AuraButton
            title="Verify Code"
            onPress={handleVerify}
            loading={isLoading}
            disabled={currentOtp.length !== 6}
            style={styles.verifyBtn}
            icon={
              <Icon
                name="checkmark-done"
                size={moderateScale(18)}
                color={Colors.background}
                style={{ marginRight: scale(6) }}
              />
            }
          />

          {/* Resend Countdown Bar */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResend}
                activeOpacity={0.7}
              >
                <Icon name="refresh" size={moderateScale(14)} color={Colors.secondary} style={{ marginRight: 5 }} />
                <Text style={styles.resendLink}>Resend Verification Code</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerRow}>
                <Icon name="time-outline" size={moderateScale(13)} color={Colors.textMuted} style={{ marginRight: 5 }} />
                <Text style={styles.timerText}>
                  Resend code in <Text style={styles.timerHighlight}>{countdown}s</Text>
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="mail-unread-outline" size={moderateScale(14)} color={Colors.textMuted} style={{ marginRight: 5 }} />
            <Text style={styles.backButtonText}>Change Email Address</Text>
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
    marginTop: verticalScale(10),
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
    marginBottom: verticalScale(18),
    lineHeight: moderateScale(18),
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  testOtpBanner: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderColor: 'rgba(255, 179, 0, 0.35)',
    borderWidth: 1,
    borderRadius: moderateScale(12),
    padding: scale(12),
    marginBottom: verticalScale(16),
  },
  testOtpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  testPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  testPillText: {
    color: '#FFB300',
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tapToFillText: {
    color: Colors.secondary,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  testCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testOtpLabel: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
  },
  testOtpCode: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: moderateScale(18),
    letterSpacing: 3,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: verticalScale(12),
  },
  otpBox: {
    width: scale(44),
    height: verticalScale(52),
    borderRadius: moderateScale(10),
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.2,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 230, 118, 0.05)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  otpBoxFilled: {
    borderColor: 'rgba(0, 230, 118, 0.4)',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '700',
    padding: 0,
  },
  verifyBtn: {
    marginTop: verticalScale(14),
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(12),
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(6),
  },
  resendLink: {
    color: Colors.secondary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(8),
    paddingVertical: verticalScale(6),
  },
  backButtonText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
});
