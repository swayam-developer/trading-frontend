import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { PinKeypad } from '../../../components/common/PinKeypad';
import { useAuthStore } from '../../../store/auth/authStore';

export const SetPinScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'SetPin'>>();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { setPin, isLoading } = useAuthStore();

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
      navigation.replace('Dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN.');
      setConfirmPin('');
      setStep('create');
      setFirstPin('');
    }
  };

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
});
