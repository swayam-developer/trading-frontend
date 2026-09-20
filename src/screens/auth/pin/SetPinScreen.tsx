import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Modal, TouchableOpacity } from 'react-native';
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

export const SetPinScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'SetPin'>>();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Biometric Enrollment Modal State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [detectedBiometryType, setDetectedBiometryType] = useState<string | null>(null);
  const [enrollingBiometrics, setEnrollingBiometrics] = useState(false);

  const { setPin, checkBiometrics, enrollBiometrics } = useAuthStore();

  const handleDigitPress = (digit: string) => {
    setError(null);

    if (step === 'create') {
      const nextPin = firstPin + digit;
      setFirstPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => setStep('confirm'), 200);
      }
    } else {
      const nextPin = confirmPin + digit;
      setConfirmPin(nextPin);
      if (nextPin.length === 4) {
        handleSubmit(nextPin);
      }
    }
  };

  const handleDeletePress = () => {
    setError(null);
    if (step === 'create') {
      setFirstPin(firstPin.slice(0, -1));
    } else {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setStep('create');
      }
    }
  };

  const handleSubmit = async (enteredConfirmPin: string) => {
    if (firstPin !== enteredConfirmPin) {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      setStep('create');
      setFirstPin('');
      return;
    }

    try {
      await setPin(firstPin);
      Toast.show({
        type: 'success',
        text1: 'PIN Activated',
        text2: 'Your 4-digit security PIN is now set.',
      });

      // Check if device supports biometrics
      const bio = await checkBiometrics();
      if (bio.available) {
        setDetectedBiometryType(bio.biometryType);
        setShowBiometricModal(true);
      } else {
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN.');
      setConfirmPin('');
      setStep('create');
      setFirstPin('');
    }
  };

  const handleEnableBiometrics = async () => {
    setEnrollingBiometrics(true);
    try {
      await enrollBiometrics();
      Toast.show({
        type: 'success',
        text1: 'Biometrics Enabled',
        text2: 'Quick login with biometrics is now active.',
      });
      setShowBiometricModal(false);
      navigation.replace('Dashboard');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Biometrics Setup Skipped',
        text2: err.message || 'Could not enroll biometrics at this time.',
      });
      setShowBiometricModal(false);
      navigation.replace('Dashboard');
    } finally {
      setEnrollingBiometrics(false);
    }
  };

  const handleSkipBiometrics = () => {
    setShowBiometricModal(false);
    navigation.replace('Dashboard');
  };

  const isFaceId = detectedBiometryType === 'FaceID';
  const biometricLabel = isFaceId ? 'Face ID' : 'Fingerprint';
  const biometricIcon = isFaceId ? 'scan-outline' : 'finger-print-outline';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <AuraLogo size={44} showTagline={false} />
        <Text style={styles.title}>
          {step === 'create' ? 'Set Your 4-Digit PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create'
            ? 'Used to quickly unlock your portfolio and authorize trades'
            : 'Re-enter your 4-digit PIN to confirm'}
        </Text>
      </View>

      <PinKeypad
        pin={step === 'create' ? firstPin : confirmPin}
        maxDigits={4}
        onDigitPress={handleDigitPress}
        onDeletePress={handleDeletePress}
        error={error}
      />

      {/* Biometric Enrollment Modal */}
      <Modal
        visible={showBiometricModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkipBiometrics}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <Icon name={biometricIcon} size={moderateScale(42)} color={Colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Enable {biometricLabel}?</Text>
            <Text style={styles.modalSubtitle}>
              Log in faster and trade seamlessly with instant {biometricLabel.toLowerCase()} authentication.
            </Text>

            <AuraButton
              title={`Enable ${biometricLabel}`}
              onPress={handleEnableBiometrics}
              loading={enrollingBiometrics}
              style={styles.enableButton}
            />

            <TouchableOpacity
              onPress={handleSkipBiometrics}
              disabled={enrollingBiometrics}
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingVertical: verticalScale(30),
    paddingHorizontal: scale(20),
  },
  header: {
    alignItems: 'center',
    marginTop: verticalScale(20),
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: verticalScale(28),
    paddingHorizontal: scale(20),
    alignItems: 'center',
  },
  iconCircle: {
    width: scale(76),
    height: scale(76),
    borderRadius: scale(38),
    backgroundColor: 'rgba(0, 229, 155, 0.1)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
    textAlign: 'center',
    lineHeight: moderateScale(19),
    marginBottom: verticalScale(24),
    paddingHorizontal: scale(10),
  },
  enableButton: {
    width: '100%',
    marginBottom: verticalScale(12),
  },
  skipButton: {
    paddingVertical: verticalScale(8),
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
});
