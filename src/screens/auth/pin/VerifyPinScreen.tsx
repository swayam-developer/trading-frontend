import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { PinKeypad } from '../../../components/common/PinKeypad';
import { useAuthStore } from '../../../store/auth/authStore';

export const VerifyPinScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'VerifyPin'>>();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasPromptedRef = useRef(false);
  const isVerifyingRef = useRef(false);

  const {
    verifyPin,
    verifyBiometrics,
    enrollBiometrics,
    checkBiometrics,
    isBiometricsAvailable,
    isBiometricEnrolled,
    biometryType,
    hasPin,
    hasBiometric,
    logout,
    profile,
    user,
  } = useAuthStore();

  const displayName = profile?.name || user?.name || (user?.email ? user.email.split('@')[0] : 'Trader');
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'A';
  const biometricName = biometryType === 'FaceID' ? 'Face ID' : 'Fingerprint';
  const biometricIcon = biometryType === 'FaceID' ? 'scan-outline' : 'finger-print-outline';

  const triggerBiometricAuth = useCallback(async () => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setError(null);
    try {
      const verified = await verifyBiometrics();
      if (verified) {
        Toast.show({
          type: 'success',
          text1: 'Authenticated',
          text2: 'Welcome back to Aura Trading.',
        });
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('biometric key') ||
        msg.toLowerCase().includes('no installed provider') ||
        msg.toLowerCase().includes('null') ||
        msg.toLowerCase().includes('missing') ||
        msg.toLowerCase().includes('invalidated')
      ) {
        Toast.show({
          type: 'info',
          text1: 'Biometrics Needs Setup on Device',
          text2: 'Tap "Re-register" below to activate on this device.',
        });
        setError('Biometric key is missing on this device. Please tap below to re-register.');
      } else {
        setError(msg || 'Biometric verification failed. Please try again.');
      }
    } finally {
      isVerifyingRef.current = false;
    }
  }, [verifyBiometrics, navigation]);

  // Auto-prompt biometrics only once on mount
  useEffect(() => {
    if (hasPromptedRef.current) return;

    const initBiometrics = async () => {
      const { available, enrolled } = await checkBiometrics();
      if (available && enrolled && hasBiometric && !hasPromptedRef.current) {
        hasPromptedRef.current = true;
        setTimeout(() => {
          triggerBiometricAuth();
        }, 400);
      }
    };

    initBiometrics();
  }, [checkBiometrics, hasBiometric, triggerBiometricAuth]);

  const handleDigitPress = async (digit: string) => {
    setError(null);
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      try {
        await verifyPin(nextPin);
        Toast.show({
          type: 'success',
          text1: 'Authenticated',
          text2: 'Welcome back to Aura Trading.',
        });
        navigation.replace('Dashboard');
      } catch (err: any) {
        setError(err.message || 'Incorrect PIN. Try again.');
        setPin('');
      }
    }
  };

  const handleDeletePress = () => {
    setError(null);
    setPin(pin.slice(0, -1));
  };

  const handleSwitchAccount = async () => {
    await logout();
    navigation.replace('EmailCheck');
  };

  const handleReEnrollBiometrics = async () => {
    try {
      await enrollBiometrics();
      Toast.show({
        type: 'success',
        text1: `${biometricName} Enrolled`,
        text2: 'Biometric key is now active on this device.',
      });
      navigation.replace('Dashboard');
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Enrollment Failed',
        text2: e.message || 'Could not enroll biometrics.',
      });
    }
  };

  // If user has ONLY Biometrics enrolled and NO PIN:
  if (!hasPin && (isBiometricEnrolled || hasBiometric)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        <View style={styles.ambientGlowTop} pointerEvents="none" />
        <View style={styles.ambientGlowBottom} pointerEvents="none" />

        <View style={styles.header}>
          <AuraLogo size={46} showTagline={false} />
          <View style={styles.avatarPill}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>{userInitial}</Text>
            </View>
            <Text style={styles.avatarNameText}>{displayName}</Text>
          </View>
          <Text style={styles.title}>Unlock Portfolio</Text>
          <Text style={styles.subtitle}>Institutional Biometric Security</Text>
        </View>

        <View style={styles.bioCenterContainer}>
          <TouchableOpacity
            style={styles.bioRadarContainer}
            onPress={triggerBiometricAuth}
            activeOpacity={0.7}
          >
            <View style={styles.bioRadarOuter} />
            <View style={styles.bioBigCircle}>
              <Icon name={biometricIcon} size={moderateScale(54)} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.bioPromptText}>Tap to unlock with {biometricName}</Text>
          {!!error && (
            <View style={styles.errorPill}>
              <Icon name="alert-circle" size={moderateScale(13)} color={Colors.error} style={{ marginRight: 4 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {isBiometricsAvailable && (
            <TouchableOpacity
              style={styles.bioQuickButton}
              onPress={handleReEnrollBiometrics}
              activeOpacity={0.7}
            >
              <Icon name="refresh-outline" size={moderateScale(16)} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.bioQuickText}>Re-register {biometricName} on this device</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.replace('SetPin')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Set Up 4-Digit MPIN Instead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.switchText}>Switch Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If user has PIN or BOTH methods:
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowBottom} pointerEvents="none" />

      <View style={styles.header}>
        <AuraLogo size={42} showTagline={false} />

        {/* User Identity Pill */}
        <View style={styles.avatarPill}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{userInitial}</Text>
          </View>
          <Text style={styles.avatarNameText}>{displayName}</Text>
        </View>

        <Text style={styles.title}>Unlock Portfolio</Text>
        <Text style={styles.subtitle}>Enter your 4-digit MPIN to resume trading</Text>
      </View>

      <PinKeypad
        pin={pin}
        maxDigits={4}
        onDigitPress={handleDigitPress}
        onDeletePress={handleDeletePress}
        error={error}
        showBiometricButton={isBiometricsAvailable && isBiometricEnrolled && hasBiometric}
        onBiometricPress={triggerBiometricAuth}
        biometryType={biometryType}
      />

      <View style={styles.footer}>
        {isBiometricsAvailable && isBiometricEnrolled && hasBiometric && (
          <TouchableOpacity
            style={styles.bioQuickButton}
            onPress={triggerBiometricAuth}
            activeOpacity={0.7}
          >
            <Icon name={biometricIcon} size={moderateScale(16)} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.bioQuickText}>Unlock with {biometricName}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.switchButton}
          onPress={handleSwitchAccount}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>Switch Account or Reset PIN</Text>
        </TouchableOpacity>
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
    marginBottom: verticalScale(4),
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
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginTop: verticalScale(6),
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    textAlign: 'center',
    marginTop: verticalScale(4),
    paddingHorizontal: scale(20),
  },
  bioCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(30),
  },
  bioRadarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(18),
  },
  bioRadarOuter: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  bioBigCircle: {
    width: scale(92),
    height: scale(92),
    borderRadius: scale(46),
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  bioPromptText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(12),
  },
  errorText: {
    color: Colors.error,
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: verticalScale(10),
  },
  bioQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    paddingVertical: verticalScale(9),
    paddingHorizontal: scale(18),
    borderRadius: moderateScale(20),
    marginBottom: verticalScale(10),
  },
  bioQuickText: {
    color: Colors.primary,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(4),
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  switchText: {
    color: Colors.secondary,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
});
