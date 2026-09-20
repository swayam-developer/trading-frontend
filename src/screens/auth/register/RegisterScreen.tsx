import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuraCheckbox } from '../../../components/common/AuraCheckbox';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp, RootRouteProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraInput } from '../../../components/common/AuraInput';
import { AuraButton } from '../../../components/common/AuraButton';
import { useAuthStore } from '../../../store/auth/authStore';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'Register'>>();
  const route = useRoute<RootRouteProp<'Register'>>();
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { register, isLoading } = useAuthStore();

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [Colors.error, '#FFB300', '#29B6F6', Colors.primary];

  const handleRegister = async () => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      Toast.show({
        type: 'error',
        text1: 'Terms Required',
        text2: 'Please accept the Terms of Service & Privacy Policy.',
      });
      return;
    }

    setPasswordError(null);

    try {
      await register(password);
      Toast.show({
        type: 'success',
        text1: 'Registration Complete!',
        text2: 'Set up your 4-digit PIN for quick access.',
      });
      navigation.replace('SetPin');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: err.message || 'Unable to create account.',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AuraLogo size={50} showTagline={false} />

        <View style={styles.card}>
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>
            Creating account for <Text style={styles.emailText}>{email}</Text>
          </Text>

          <AuraInput
            label="Password"
            icon="lock-closed-outline"
            placeholder="Min. 8 characters with numbers & symbols"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={passwordError}
          />

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthBar,
                      index < strength && {
                        backgroundColor: strengthColors[strength - 1] || Colors.primary,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.strengthLabel,
                  { color: strengthColors[strength - 1] || Colors.textMuted },
                ]}
              >
                {strengthLabels[strength - 1] || 'Weak'}
              </Text>
            </View>
          )}

          <AuraInput
            label="Confirm Password"
            icon="lock-closed-outline"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />

          <View style={styles.termsContainer}>
            <AuraCheckbox
              value={agreedToTerms}
              onValueChange={setAgreedToTerms}
              label={
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text>{' '}
                  and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              }
            />
          </View>

          <AuraButton
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(30),
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: scale(20),
    marginTop: verticalScale(10),
  },
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '700',
    marginBottom: verticalScale(4),
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13),
    marginBottom: verticalScale(16),
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  strengthContainer: {
    marginBottom: verticalScale(10),
  },
  strengthBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(4),
  },
  strengthBar: {
    flex: 1,
    height: verticalScale(4),
    backgroundColor: Colors.inputBackground,
    borderRadius: 2,
    marginHorizontal: scale(2),
  },
  strengthLabel: {
    fontSize: moderateScale(11),
    textAlign: 'right',
    marginTop: verticalScale(2),
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(12),
  },
  termsText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    marginLeft: scale(8),
    flex: 1,
  },
  termsLink: {
    color: Colors.secondary,
    fontWeight: '500',
  },
});
