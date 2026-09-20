import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
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

  const { verifyPin, logout, profile, user } = useAuthStore();
  const displayName = profile?.name || user?.email || 'Trader';

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
      />

      <TouchableOpacity
        style={styles.switchButton}
        onPress={handleSwitchAccount}
        activeOpacity={0.7}
      >
        <Text style={styles.switchText}>Switch Account or Reset PIN</Text>
      </TouchableOpacity>
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
  nameHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  switchText: {
    color: Colors.secondary,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
});
