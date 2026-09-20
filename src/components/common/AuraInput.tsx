import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface AuraInputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string | null;
  isPassword?: boolean;
}

export const AuraInput: React.FC<AuraInputProps> = ({
  label,
  icon,
  error,
  isPassword = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textPlaceholder}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: verticalScale(8),
    width: '100%',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
    fontWeight: '500',
    marginBottom: verticalScale(6),
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.2,
    borderColor: Colors.inputBorder,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(14),
    height: verticalScale(48),
  },
  inputFocused: {
    borderColor: Colors.inputFocusBorder,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: Colors.error,
  },
  icon: {
    fontSize: moderateScale(16),
    color: Colors.textMuted,
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    paddingVertical: 0,
  },
  eyeButton: {
    padding: scale(6),
  },
  eyeIcon: {
    fontSize: moderateScale(16),
    color: Colors.textMuted,
  },
  errorText: {
    color: Colors.error,
    fontSize: moderateScale(11),
    marginTop: verticalScale(4),
    marginLeft: scale(4),
  },
});
