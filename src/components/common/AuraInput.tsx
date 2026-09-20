import React, { useState, useRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

export interface AuraInputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string | null;
  isPassword?: boolean;
}

export const AuraInput = React.forwardRef<any, AuraInputProps>(
  ({ label, icon, error, isPassword = false, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const localInputRef = useRef<any>(null);

    useImperativeHandle(ref, () => localInputRef.current);

    const handleContainerPress = () => {
      localInputRef.current?.focus();
    };

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Pressable
          onPress={handleContainerPress}
          style={[
            styles.inputWrapper,
            isFocused && styles.inputFocused,
            !!error && styles.inputError,
          ]}
        >
          {icon && (
            <View style={styles.iconContainer} pointerEvents="none">
              {icon.length > 2 ? (
                <Icon
                  name={icon}
                  size={moderateScale(18)}
                  color={isFocused ? Colors.primary : Colors.textMuted}
                />
              ) : (
                <Text style={styles.iconText}>{icon}</Text>
              )}
            </View>
          )}
          <TextInput
            ref={localInputRef}
            style={[styles.input, style]}
            placeholderTextColor={Colors.textPlaceholder}
            secureTextEntry={isPassword && !showPassword}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
            textAlignVertical="center"
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={moderateScale(20)}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </Pressable>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

AuraInput.displayName = 'AuraInput';

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
  iconContainer: {
    marginRight: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: moderateScale(16),
    color: Colors.textMuted,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  eyeButton: {
    padding: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: moderateScale(11),
    marginTop: verticalScale(4),
    marginLeft: scale(4),
  },
});
