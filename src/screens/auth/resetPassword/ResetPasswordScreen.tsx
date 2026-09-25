import React, { useState, useMemo } from 'react';
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
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp, RootRouteProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraInput } from '../../../components/common/AuraInput';
import { AuraButton } from '../../../components/common/AuraButton';
import { useAuthStore } from '../../../store/auth/authStore';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'ResetPassword'>>();
  const route = useRoute<RootRouteProp<'ResetPassword'>>();
  const { email, otp } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const { resetPassword, isLoading } = useAuthStore();

  // Password strength calculation
  const strength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score += 1;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return '';
    if (strength <= 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  }, [newPassword, strength]);

  const strengthColor = useMemo(() => {
    if (strength <= 1) return Colors.error;
    if (strength === 2) return Colors.accentGold;
    if (strength === 3) return Colors.secondary;
    return Colors.primary;
  }, [strength]);

  const handleResetPassword = async () => {
    let hasError = false;

    if (!newPassword) {
      setNewPasswordError('Please enter a new password.');
      hasError = true;
    } else if (newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters.');
      hasError = true;
    } else {
      setNewPasswordError(null);
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      hasError = true;
    } else {
      setConfirmPasswordError(null);
    }

    if (hasError) return;

    try {
      const msg = await resetPassword(email, otp, newPassword);
      Toast.show({
        type: 'success',
        text1: 'Password Updated 🎉',
        text2: msg || 'Your password has been reset. Please sign in.',
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { email } }],
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: err.message || 'Could not reset password. Please try again.',
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
        <AuraLogo size={50} showTagline={false} />

        <View style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Create a secure password for your Aura Trading account
          </Text>

          {/* User Account Tile */}
          <View style={styles.accountTile}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{emailInitial}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountEmail} numberOfLines={1} ellipsizeMode="middle">
                {email}
              </Text>
              <Text style={styles.accountStatus}>Verified OTP Security Code</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={moderateScale(14)} color={Colors.primary} />
            </View>
          </View>

          {/* New Password Input */}
          <AuraInput
            label="New Password"
            icon="lock-closed-outline"
            placeholder="Enter at least 8 characters"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (newPasswordError) setNewPasswordError(null);
            }}
            isPassword
            error={newPasswordError}
          />

          {/* Password Strength Meter */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>Security Strength:</Text>
                <Text style={[styles.strengthValue, { color: strengthColor }]}>
                  {strengthLabel}
                </Text>
              </View>
              <View style={styles.strengthBarBg}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      width: `${(strength / 4) * 100}%`,
                      backgroundColor: strengthColor,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Confirm Password Input */}
          <AuraInput
            label="Confirm New Password"
            icon="shield-checkmark-outline"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError(null);
            }}
            isPassword
            error={confirmPasswordError}
          />

          {/* Password Requirements Checklist */}
          <View style={styles.requirementsBox}>
            <View style={styles.reqItem}>
              <Icon
                name={newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                size={moderateScale(13)}
                color={newPassword.length >= 8 ? Colors.primary : Colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.reqText, newPassword.length >= 8 && styles.reqTextActive]}>
                At least 8 characters
              </Text>
            </View>
            <View style={styles.reqItem}>
              <Icon
                name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                size={moderateScale(13)}
                color={/[0-9]/.test(newPassword) ? Colors.primary : Colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.reqText, /[0-9]/.test(newPassword) && styles.reqTextActive]}>
                Contains a number (0-9)
              </Text>
            </View>
            <View style={styles.reqItem}>
              <Icon
                name={
                  confirmPassword.length > 0 && newPassword === confirmPassword
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={moderateScale(13)}
                color={
                  confirmPassword.length > 0 && newPassword === confirmPassword
                    ? Colors.primary
                    : Colors.textMuted
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.reqText,
                  confirmPassword.length > 0 &&
                    newPassword === confirmPassword &&
                    styles.reqTextActive,
                ]}
              >
                Passwords match
              </Text>
            </View>
          </View>

          <AuraButton
            title="Set New Password"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={!newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
            style={styles.resetBtn}
            icon={
              <Icon
                name="checkmark-done-circle-outline"
                size={moderateScale(18)}
                color={Colors.background}
                style={{ marginRight: scale(6) }}
              />
            }
          />
        </View>

        <View style={styles.securityFooter}>
          <Icon name="shield-checkmark" size={moderateScale(13)} color={Colors.primary} style={{ marginRight: 5 }} />
          <Text style={styles.securityFooterText}>End-to-End Encrypted Password Update</Text>
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
    marginBottom: verticalScale(14),
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
    color: Colors.primary,
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    padding: scale(4),
    borderRadius: scale(12),
  },
  strengthContainer: {
    marginTop: -verticalScale(8),
    marginBottom: verticalScale(12),
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  strengthLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  strengthValue: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  strengthBarBg: {
    height: verticalScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: moderateScale(10),
    padding: scale(10),
    marginTop: -verticalScale(4),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(2),
  },
  reqText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11.5),
  },
  reqTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  resetBtn: {
    marginTop: verticalScale(6),
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
