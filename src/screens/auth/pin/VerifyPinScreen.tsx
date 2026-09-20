import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraButton } from '../../../components/common/AuraButton';
import { PinKeypad } from '../../../components/common/PinKeypad';
import { useAuthStore } from '../../../store/auth/authStore';

export const VerifyPinScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'VerifyPin'>>();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const displayName = profile?.name || user?.name || user?.email || 'Trader';
  const biometricName = biometryType === 'FaceID' ? 'Face ID' : 'Fingerprint';
  const biometricIcon = biometryType === 'FaceID' ? 'scan-outline' : 'finger-print-outline';

  const triggerBiometricAuth = useCallback(async () => {
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
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('biometric key')) {
        Toast.show({
          type: 'info',
          text1: 'Biometrics Not Registered',
          text2: 'Please enter your 4-digit PIN to unlock.',
        });
        setError(null);
      } else {
        setError(msg || 'Biometric verification failed. Please enter your PIN.');
      }
    }
  }, [verifyBiometrics, navigation]);

  // Auto-prompt biometrics only if THIS account has biometrics enrolled on the backend
  useEffect(() => {
    const initBiometrics = async () => {
      const { available, enrolled } = await checkBiometrics();
      if (available && enrolled && hasBiometric) {
        setTimeout(() => {
          triggerBiometricAuth();
        }, 350);
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
        setError(err.message || 'Incorrect PIN.');
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

  // If the user has ONLY Biometrics enrolled and NO PIN:
  if (!hasPin && (isBiometricEnrolled || hasBiometric)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <AuraLogo size={48} showTagline={false} />
          <Text style={styles.title}>Unlock Portfolio</Text>
          <Text style={styles.subtitle}>
            Welcome back, <Text style={styles.nameHighlight}>{displayName}</Text>
          </Text>
        </View>

        <View style={styles.bioCenterContainer}>
          <TouchableOpacity
            style={styles.bioBigCircle}
            onPress={triggerBiometricAuth}
            activeOpacity={0.7}
          >
            <Icon name={biometricIcon} size={moderateScale(56)} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.bioPromptText}>Tap to unlock with {biometricName}</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.footer}>
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
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <AuraLogo size={44} showTagline={false} />
        <Text style={styles.title}>Unlock Portfolio</Text>
        <Text style={styles.subtitle}>
          Enter your 4-digit PIN for{' '}
          <Text style={styles.nameHighlight}>{displayName}</Text>
        </Text>
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
            <Icon name={biometricIcon} size={moderateScale(18)} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.bioQuickText}>Unlock with {biometricName}</Text>
          </TouchableOpacity>
        )}

        {isBiometricsAvailable && !hasBiometric && (
          <TouchableOpacity
            style={styles.bioQuickButton}
            onPress={async () => {
              try {
                await enrollBiometrics();
                Toast.show({
                  type: 'success',
                  text1: `${biometricName} Enrolled`,
                  text2: 'Biometric unlock is now active for this account.',
                });
                navigation.replace('Dashboard');
              } catch (e: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Enrollment Failed',
                  text2: e.message || 'Could not enroll biometrics.',
                });
              }
            }}
            activeOpacity={0.7}
          >
            <Icon name={biometricIcon} size={moderateScale(18)} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.bioQuickText}>Activate {biometricName} for this account</Text>
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
    paddingVertical: verticalScale(25),
    paddingHorizontal: scale(20),
  },
  header: {
    alignItems: 'center',
    marginTop: verticalScale(15),
  },
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginTop: verticalScale(12),
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginTop: verticalScale(6),
    paddingHorizontal: scale(20),
  },
  nameHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bioCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(40),
  },
  bioBigCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: 'rgba(0, 229, 155, 0.1)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  bioPromptText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: moderateScale(12),
    marginTop: verticalScale(10),
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  bioQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 155, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 155, 0.25)',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(20),
    marginBottom: verticalScale(12),
  },
  bioQuickText: {
    color: Colors.primary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  switchText: {
    color: Colors.secondary,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
});
