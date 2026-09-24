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

const KEYPAD_LETTERS: Record<string, string> = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '0': '+',
};

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
            >
              {isFilled && <View style={styles.dotInnerCore} />}
            </View>
          );
        })}
      </View>

      {/* Error Message with Warning Icon */}
      {!!error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={moderateScale(14)} color={Colors.error} style={{ marginRight: 5 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Numeric Keypad Grid */}
      <View style={styles.keypadGrid}>
        {digits.map((digit, index) => {
          if (digit === '') {
            if (showBiometricButton && onBiometricPress) {
              const iconName = biometryType === 'FaceID' ? 'scan-outline' : 'finger-print-outline';
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
          const letters = KEYPAD_LETTERS[digit] || '';

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.key,
                isDelete ? styles.deleteKey : styles.numberKey,
              ]}
              onPress={() => {
                if (isDelete) {
                  onDeletePress();
                } else if (pin.length < maxDigits) {
                  onDigitPress(digit);
                }
              }}
              activeOpacity={0.65}
            >
              {isDelete ? (
                <Icon name="backspace-outline" size={moderateScale(24)} color={Colors.textSecondary} />
              ) : (
                <View style={styles.numberKeyContent}>
                  <Text style={styles.keyDigitText}>{digit}</Text>
                  {letters ? <Text style={styles.keyLetterText}>{letters}</Text> : <View style={styles.keyLetterSpacer} />}
                </View>
              )}
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
    paddingVertical: verticalScale(10),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(16),
  },
  dot: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.inputBackground,
    marginHorizontal: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  dotInnerCore: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: Colors.primary,
  },
  dotError: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    shadowColor: Colors.error,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(4),
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.2)',
  },
  errorText: {
    color: Colors.error,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: scale(290),
    marginTop: verticalScale(6),
  },
  key: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(10),
    marginVertical: verticalScale(7),
  },
  numberKey: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  numberKeyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigitText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '700',
    lineHeight: moderateScale(26),
  },
  keyLetterText: {
    color: Colors.textMuted,
    fontSize: moderateScale(9),
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: -verticalScale(1),
  },
  keyLetterSpacer: {
    height: verticalScale(10),
  },
  emptyKey: {
    width: scale(72),
    height: scale(72),
    marginHorizontal: scale(10),
    marginVertical: verticalScale(7),
  },
  biometricKey: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  deleteKey: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});
