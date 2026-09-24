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
import Icon from 'react-native-vector-icons/Ionicons';
import { AuraCheckbox } from '../../../components/common/AuraCheckbox';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp, RootRouteProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraInput } from '../../../components/common/AuraInput';
import { AuraButton } from '../../../components/common/AuraButton';
import { useAuthStore } from '../../../store/auth/authStore';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'Register'>>();
  const route = useRoute<RootRouteProp<'Register'>>();
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { register, isLoading } = useAuthStore();

  // Password criteria checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthScore =
    (hasMinLength ? 1 : 0) +
    (hasUppercase ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecial ? 1 : 0);

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Institutional'];
  const strengthColors = [Colors.error, '#FFB300', Colors.secondary, Colors.primary];

  const isMatching = confirmPassword.length > 0 && password === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async () => {
    if (!hasMinLength) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      Toast.show({
        type: 'error',
        text1: 'Terms Required',
        text2: 'Please accept the Terms of Service & Privacy Policy.',
      });
      return;
    }

    setPasswordError(null);

    try {
      await register(password);
      Toast.show({
        type: 'success',
        text1: 'Account Created Successfully!',
        text2: 'Set up your quick 4-digit PIN.',
      });
      navigation.replace('SetPin');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: err.message || 'Unable to create account.',
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
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>
            Creating account for <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <AuraInput
            label="Create Password"
            icon="lock-closed-outline"
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            isPassword
            error={passwordError}
          />

          {/* Password Strength Visualizer */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthTitle}>Security Strength:</Text>
                <Text
                  style={[
                    styles.strengthBadge,
                    { color: strengthColors[strengthScore - 1] || Colors.textMuted },
                  ]}
                >
                  {strengthLabels[strengthScore - 1] || 'Weak'}
                </Text>
              </View>

              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthBar,
                      index < strengthScore && {
                        backgroundColor: strengthColors[strengthScore - 1] || Colors.primary,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Requirement Pills */}
              <View style={styles.requirementsGrid}>
                <View style={[styles.reqPill, hasMinLength && styles.reqPillActive]}>
                  <Icon
                    name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                    size={moderateScale(11)}
                    color={hasMinLength ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.reqText, hasMinLength && styles.reqTextActive]}>8+ chars</Text>
                </View>

                <View style={[styles.reqPill, hasUppercase && styles.reqPillActive]}>
                  <Icon
                    name={hasUppercase ? 'checkmark-circle' : 'ellipse-outline'}
                    size={moderateScale(11)}
                    color={hasUppercase ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.reqText, hasUppercase && styles.reqTextActive]}>Uppercase</Text>
                </View>

                <View style={[styles.reqPill, hasNumber && styles.reqPillActive]}>
                  <Icon
                    name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                    size={moderateScale(11)}
                    color={hasNumber ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.reqText, hasNumber && styles.reqTextActive]}>Number</Text>
                </View>

                <View style={[styles.reqPill, hasSpecial && styles.reqPillActive]}>
                  <Icon
                    name={hasSpecial ? 'checkmark-circle' : 'ellipse-outline'}
                    size={moderateScale(11)}
                    color={hasSpecial ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.reqText, hasSpecial && styles.reqTextActive]}>Symbol</Text>
                </View>
              </View>
            </View>
          )}

          {/* Confirm Password Input */}
          <AuraInput
            label="Confirm Password"
            icon="shield-checkmark-outline"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />

          {/* Match Status Banner */}
          {confirmPassword.length > 0 && (
            <View
              style={[
                styles.matchStatusRow,
                isMatching ? styles.matchRowSuccess : styles.matchRowError,
              ]}
            >
              <Icon
                name={isMatching ? 'checkmark-circle' : 'alert-circle'}
                size={moderateScale(14)}
                color={isMatching ? Colors.primary : Colors.error}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.matchStatusText,
                  { color: isMatching ? Colors.primary : Colors.error },
                ]}
              >
                {isMatching ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}

          {/* Terms & Conditions Checkbox */}
          <View style={styles.termsContainer}>
            <AuraCheckbox
              value={agreedToTerms}
              onValueChange={setAgreedToTerms}
              label={
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              }
            />
          </View>

          <AuraButton
            title="Create Aura Account"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitBtn}
            icon={
              <Icon
                name="shield-checkmark"
                size={moderateScale(18)}
                color={Colors.background}
                style={{ marginRight: scale(6) }}
              />
            }
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
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(18),
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  strengthContainer: {
    backgroundColor: Colors.inputBackground,
    padding: scale(12),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  strengthTitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  strengthBadge: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  strengthBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  strengthBar: {
    flex: 1,
    height: verticalScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginHorizontal: scale(2),
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  reqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reqPillActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  reqText: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginLeft: scale(4),
    fontWeight: '500',
  },
  reqTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  matchRowSuccess: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  matchRowError: {
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
  },
  matchStatusText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  termsText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    marginLeft: scale(8),
    lineHeight: moderateScale(16),
  },
  termsLink: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: verticalScale(12),
  },
});
