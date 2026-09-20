import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
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

type SecurityMode = 'choose' | 'pin_create' | 'pin_confirm' | 'already_configured';

export const SetPinScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'SetPin'>>();

  const [mode, setMode] = useState<SecurityMode>('choose');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBothFlow, setIsBothFlow] = useState(false);
  const [enrollingBio, setEnrollingBio] = useState(false);

  const {
    setPin,
    checkBiometrics,
    enrollBiometrics,
    verifyBiometrics,
    isBiometricsAvailable,
    biometryType,
    hasPin,
    hasBiometric,
  } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await checkBiometrics();
      if (hasPin || hasBiometric) {
        navigation.replace('VerifyPin');
      }
    };
    init();
  }, [checkBiometrics, hasPin, hasBiometric, navigation]);

  const biometricName = biometryType === 'FaceID' ? 'Face ID' : 'Fingerprint';
  const biometricIcon = biometryType === 'FaceID' ? 'scan-outline' : 'finger-print-outline';

  // --- Handlers for PIN Setup ---
  const handleDigitPress = (digit: string) => {
    setError(null);
    if (mode === 'pin_create') {
      const nextPin = firstPin + digit;
      setFirstPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => setMode('pin_confirm'), 200);
      }
    } else if (mode === 'pin_confirm') {
      const nextPin = confirmPin + digit;
      setConfirmPin(nextPin);
      if (nextPin.length === 4) {
        handlePinSubmit(nextPin);
      }
    }
  };

  const handleDeletePress = () => {
    setError(null);
    if (mode === 'pin_create') {
      setFirstPin(firstPin.slice(0, -1));
    } else if (mode === 'pin_confirm') {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setMode('pin_create');
      }
    }
  };

  const handlePinSubmit = async (enteredConfirmPin: string) => {
    if (firstPin !== enteredConfirmPin) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      setFirstPin('');
      setMode('pin_create');
      return;
    }

    try {
      await setPin(firstPin);
      Toast.show({
        type: 'success',
        text1: 'PIN Activated',
        text2: 'Your 4-digit security PIN is now set.',
      });

      if (isBothFlow && isBiometricsAvailable) {
        // Proceed to physical biometric scan
        await handleEnrollBiometricDirectly(true);
      } else {
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN.');
      setConfirmPin('');
      setFirstPin('');
      setMode('pin_create');
    }
  };

  // --- Direct Biometric Enrollment ---
  const handleEnrollBiometricDirectly = async (fromBothFlow = false) => {
    setEnrollingBio(true);
    try {
      await enrollBiometrics();
      if (!fromBothFlow) {
        // Authenticate immediately to acquire trading session socket token
        await verifyBiometrics();
      }
      Toast.show({
        type: 'success',
        text1: `${biometricName} Enabled`,
        text2: 'Biometric security activated successfully.',
      });
      navigation.replace('Dashboard');
    } catch (err: any) {
      if (fromBothFlow) {
        // PIN was already set successfully, just skip biometrics
        Toast.show({
          type: 'info',
          text1: 'PIN Set Successfully',
          text2: 'Biometrics skipped. You can enable it anytime in settings.',
        });
        navigation.replace('Dashboard');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Biometric Setup Failed',
          text2: err.message || 'Sensor was not verified.',
        });
      }
    } finally {
      setEnrollingBio(false);
    }
  };

  // --- Render PIN Keypad View ---
  if (mode === 'pin_create' || mode === 'pin_confirm') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <AuraLogo size={44} showTagline={false} />
          <Text style={styles.title}>
            {mode === 'pin_create' ? 'Set 4-Digit MPIN' : 'Confirm Your MPIN'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'pin_create'
              ? 'Enter a 4-digit PIN for swift authentication'
              : 'Re-enter your 4-digit PIN to confirm'}
          </Text>
        </View>

        <PinKeypad
          pin={mode === 'pin_create' ? firstPin : confirmPin}
          maxDigits={4}
          onDigitPress={handleDigitPress}
          onDeletePress={handleDeletePress}
          error={error}
        />

        <TouchableOpacity
          style={styles.backToChoiceButton}
          onPress={() => {
            setMode('choose');
            setFirstPin('');
            setConfirmPin('');
            setError(null);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backToChoiceText}>Change Security Option</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Render Already Configured View (e.g. PIN already set on server) ---
  if (mode === 'already_configured') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <AuraLogo size={44} showTagline={false} />
          <Text style={styles.title}>Security Already Set</Text>
          <Text style={styles.subtitle}>
            Your 4-digit MPIN is active. Would you like to enable {biometricName} unlock as well?
          </Text>
        </View>

        <View style={styles.cardContainer}>
          {isBiometricsAvailable && (
            <AuraButton
              title={`Enable ${biometricName}`}
              onPress={() => handleEnrollBiometricDirectly(false)}
              loading={enrollingBio}
              style={styles.actionBtn}
            />
          )}

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => navigation.replace('Dashboard')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryActionText}>Continue to Dashboard</Text>
          </TouchableOpacity>
        </View>

        <View />
      </View>
    );
  }

  // --- Render Security Options Choice Screen ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AuraLogo size={48} showTagline={false} />
          <Text style={styles.title}>Choose Unlock Security</Text>
          <Text style={styles.subtitle}>
            Select how you want to protect and quickly unlock your portfolio.
          </Text>
        </View>

        <View style={styles.optionsList}>
          {/* Option 1: Both (Recommended) */}
          {isBiometricsAvailable && (
            <TouchableOpacity
              style={[styles.optionCard, styles.recommendedCard]}
              onPress={() => {
                setIsBothFlow(true);
                setMode('pin_create');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>RECOMMENDED</Text>
              </View>
              <View style={styles.optionHeader}>
                <View style={[styles.optionIconCircle, styles.bothIconCircle]}>
                  <Icon name="shield-checkmark-outline" size={moderateScale(24)} color={Colors.primary} />
                </View>
                <View style={styles.optionDetails}>
                  <Text style={styles.optionTitle}>MPIN + {biometricName}</Text>
                  <Text style={styles.optionDesc}>
                    Best combination of speed and backup security. Unlock with {biometricName.toLowerCase()} or PIN anytime.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Option 2: Biometric Only */}
          {isBiometricsAvailable && (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleEnrollBiometricDirectly(false)}
              activeOpacity={0.75}
              disabled={enrollingBio}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionIconCircle}>
                  <Icon name={biometricIcon} size={moderateScale(24)} color={Colors.primary} />
                </View>
                <View style={styles.optionDetails}>
                  <Text style={styles.optionTitle}>{biometricName} Only</Text>
                  <Text style={styles.optionDesc}>
                    1-touch instant unlock using your device biometric sensor without remembering a PIN.
                  </Text>
                </View>
                {enrollingBio && <ActivityIndicator color={Colors.primary} size="small" />}
              </View>
            </TouchableOpacity>
          )}

          {/* Option 3: MPIN Only */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => {
              setIsBothFlow(false);
              setMode('pin_create');
            }}
            activeOpacity={0.75}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIconCircle}>
                <Icon name="keypad-outline" size={moderateScale(24)} color={Colors.primary} />
              </View>
              <View style={styles.optionDetails}>
                <Text style={styles.optionTitle}>4-Digit MPIN Only</Text>
                <Text style={styles.optionDesc}>
                  Traditional numeric PIN passcode to unlock your account.
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            Alert.alert(
              'Security Setup Required',
              'A 4-digit PIN or Biometric unlock is required to authorize live market access and trading.',
              [
                { text: 'Set Up PIN', onPress: () => setMode('pin_create') },
                ...(isBiometricsAvailable
                  ? [
                      {
                        text: `Enable ${biometricName}`,
                        onPress: () => handleEnrollBiometricDirectly(false),
                      },
                    ]
                  : []),
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Set Up Later</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
  },
  header: {
    alignItems: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(20),
  },
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '700',
    marginTop: verticalScale(12),
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
    textAlign: 'center',
    marginTop: verticalScale(6),
    paddingHorizontal: scale(15),
    lineHeight: moderateScale(18),
  },
  optionsList: {
    width: '100%',
    marginVertical: verticalScale(10),
  },
  optionCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: scale(16),
    marginBottom: verticalScale(14),
    position: 'relative',
  },
  recommendedCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 229, 155, 0.04)',
  },
  badge: {
    position: 'absolute',
    top: -verticalScale(9),
    right: scale(14),
    backgroundColor: Colors.primary,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  badgeText: {
    color: Colors.background,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconCircle: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    backgroundColor: 'rgba(0, 229, 155, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 155, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(14),
  },
  bothIconCircle: {
    backgroundColor: 'rgba(0, 229, 155, 0.18)',
    borderColor: Colors.primary,
  },
  optionDetails: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '600',
    marginBottom: verticalScale(3),
  },
  optionDesc: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  backToChoiceButton: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  backToChoiceText: {
    color: Colors.secondary,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
  cardContainer: {
    width: '100%',
    paddingHorizontal: scale(10),
  },
  actionBtn: {
    width: '100%',
    marginBottom: verticalScale(14),
  },
  secondaryActionBtn: {
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  secondaryActionText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
  },
});
