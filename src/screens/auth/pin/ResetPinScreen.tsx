import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp, RootRouteProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { PinKeypad } from '../../../components/common/PinKeypad';
import { useAuthStore } from '../../../store/auth/authStore';

type StepMode = 'new_pin' | 'confirm_pin';

export const ResetPinScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'ResetPin'>>();
  const route = useRoute<RootRouteProp<'ResetPin'>>();
  const { email, otp } = route.params;

  const [mode, setMode] = useState<StepMode>('new_pin');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { resetPin, isAuthenticated } = useAuthStore();

  const handleDigitPress = (digit: string) => {
    setError(null);
    if (mode === 'new_pin') {
      const nextPin = firstPin + digit;
      setFirstPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => setMode('confirm_pin'), 250);
      }
    } else if (mode === 'confirm_pin') {
      const nextPin = confirmPin + digit;
      setConfirmPin(nextPin);
      if (nextPin.length === 4) {
        handlePinSubmit(nextPin);
      }
    }
  };

  const handleDeletePress = () => {
    setError(null);
    if (mode === 'new_pin') {
      setFirstPin(firstPin.slice(0, -1));
    } else if (mode === 'confirm_pin') {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setMode('new_pin');
      }
    }
  };

  const handlePinSubmit = async (enteredConfirmPin: string) => {
    if (firstPin !== enteredConfirmPin) {
      setError('PINs do not match. Please try again.');
      setConfirmPin('');
      setFirstPin('');
      setMode('new_pin');
      return;
    }

    try {
      const msg = await resetPin(email, otp, firstPin);
      Toast.show({
        type: 'success',
        text1: 'MPIN Updated 🎉',
        text2: msg || 'Your 4-digit MPIN has been reset successfully.',
      });

      if (isAuthenticated) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login', params: { email } }],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset PIN.');
      setConfirmPin('');
      setFirstPin('');
      setMode('new_pin');
    }
  };

  const emailInitial = email ? email.charAt(0).toUpperCase() : 'A';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ambient Backlight Glow */}
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowBottom} pointerEvents="none" />

      {/* Top Bar with User Badge */}
      <View style={styles.header}>
        <AuraLogo size={42} showTagline={false} />

        <View style={styles.avatarPill}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{emailInitial}</Text>
          </View>
          <Text style={styles.avatarNameText}>{email}</Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {mode === 'new_pin' ? 'STEP 1 OF 2 • NEW MPIN' : 'STEP 2 OF 2 • CONFIRM MPIN'}
          </Text>
        </View>

        <Text style={styles.title}>
          {mode === 'new_pin' ? 'Set New 4-Digit MPIN' : 'Confirm New MPIN'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'new_pin'
            ? 'Choose a memorable 4-digit PIN to secure and unlock your portfolio'
            : 'Re-enter your 4-digit PIN to confirm accuracy'}
        </Text>
      </View>

      {/* Pin Keypad Component */}
      <PinKeypad
        pin={mode === 'new_pin' ? firstPin : confirmPin}
        maxDigits={4}
        onDigitPress={handleDigitPress}
        onDeletePress={handleDeletePress}
        error={error}
      />

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {mode === 'confirm_pin' ? (
          <TouchableOpacity
            style={styles.backStepButton}
            onPress={() => {
              setMode('new_pin');
              setConfirmPin('');
              setError(null);
            }}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back-outline" size={moderateScale(14)} color={Colors.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.backStepText}>Re-enter New PIN</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backStepButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={moderateScale(14)} color={Colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(20),
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
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? verticalScale(24) : verticalScale(10),
  },
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.divider,
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(16),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(6),
  },
  avatarMini: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(6),
  },
  avatarMiniText: {
    color: Colors.background,
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
  avatarNameText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  stepBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderColor: 'rgba(0, 230, 118, 0.25)',
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
    marginTop: verticalScale(6),
    marginBottom: verticalScale(4),
  },
  stepBadgeText: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginTop: verticalScale(4),
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    textAlign: 'center',
    marginTop: verticalScale(4),
    paddingHorizontal: scale(15),
    lineHeight: moderateScale(17),
  },
  footer: {
    alignItems: 'center',
    paddingBottom: verticalScale(10),
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  backStepText: {
    color: Colors.secondary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
});
