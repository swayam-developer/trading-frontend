import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface PinKeypadProps {
  pin: string;
  maxDigits?: number;
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  error?: string | null;
  showBiometricButton?: boolean;
  onBiometricPress?: () => void;
  biometryType?: string | null;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  pin,
  maxDigits = 4,
  onDigitPress,
  onDeletePress,
  error,
  showBiometricButton = false,
  onBiometricPress,
  biometryType,
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <View style={styles.container}>
      {/* Indicator Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: maxDigits }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                !!error && styles.dotError,
              ]}
            />
          );
        })}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Numeric Keypad Grid */}
      <View style={styles.keypadGrid}>
        {digits.map((digit, index) => {
          if (digit === '') {
            if (showBiometricButton && onBiometricPress) {
              const iconName = biometryType === 'FaceID' ? 'scan-outline' : 'finger-print';
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.key, styles.biometricKey]}
                  onPress={onBiometricPress}
                  activeOpacity={0.6}
                >
                  <Icon name={iconName} size={moderateScale(28)} color={Colors.primary} />
                </TouchableOpacity>
              );
            }
            return <View key={index} style={styles.emptyKey} />;
          }

          const isDelete = digit === '⌫';

          return (
            <TouchableOpacity
              key={index}
              style={[styles.key, isDelete && styles.deleteKey]}
              onPress={() => {
                if (isDelete) {
                  onDeletePress();
                } else if (pin.length < maxDigits) {
                  onDigitPress(digit);
                }
              }}
              activeOpacity={0.6}
            >
              <Text style={[styles.keyText, isDelete && styles.deleteKeyText]}>
                {digit}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: verticalScale(16),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  dot: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: 'transparent',
    marginHorizontal: scale(12),
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  dotError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: moderateScale(12),
    marginBottom: verticalScale(10),
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: scale(280),
    marginTop: verticalScale(10),
  },
  key: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    margin: scale(10),
  },
  emptyKey: {
    width: scale(72),
    height: scale(72),
    margin: scale(10),
  },
  biometricKey: {
    backgroundColor: 'rgba(0, 229, 155, 0.08)',
    borderColor: 'rgba(0, 229, 155, 0.25)',
  },
  deleteKey: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(24),
    fontWeight: '600',
  },
  deleteKeyText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(22),
  },
});
