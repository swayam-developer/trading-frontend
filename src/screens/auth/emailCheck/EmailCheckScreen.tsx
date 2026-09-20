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
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp } from '../../../navigation/types';
import { Colors } from '../../../theme/colors';
import { AuraLogo } from '../../../components/common/AuraLogo';
import { AuraInput } from '../../../components/common/AuraInput';
import { AuraButton } from '../../../components/common/AuraButton';
import { useAuthStore } from '../../../store/auth/authStore';

export const EmailCheckScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'EmailCheck'>>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const { checkEmail, isLoading } = useAuthStore();

  const validateEmail = (val: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!re.test(val.trim())) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleContinue = async () => {
    if (!validateEmail(email)) return;

    try {
      const result = await checkEmail(email.trim());

      if (result.isExist) {
        Toast.show({
          type: 'info',
          text1: 'Welcome Back',
          text2: 'Please enter your password to sign in.',
        });
        navigation.navigate('Login', { email: email.trim() });
      } else {
        Toast.show({
          type: 'success',
          text1: 'New Account',
          text2: 'Verification code sent to your email.',
        });
        navigation.navigate('VerifyOtp', {
          email: email.trim(),
          otp_type: 'email',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Email Verification Failed',
        text2: err.message || 'Unable to check email.',
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
        <AuraLogo size={60} showTagline={false} />

        <View style={styles.card}>
          <Text style={styles.title}>Start Trading</Text>
          <Text style={styles.subtitle}>
            Enter your email to sign in or create an Aura Trading account
          </Text>

          <AuraInput
            label="Email Address"
            icon="✉"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError}
          />

          <AuraButton
            title="Continue"
            onPress={handleContinue}
            loading={isLoading}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Google Sign-In',
                text2: 'Google OAuth integration ready with @react-native-google-signin',
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityBadge}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            256-Bit Bank-Grade SSL Encryption & Regulated Custody
          </Text>
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
    lineHeight: moderateScale(18),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(16),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    color: Colors.textMuted,
    marginHorizontal: scale(12),
    fontSize: moderateScale(12),
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(46),
    backgroundColor: Colors.inputBackground,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  googleIcon: {
    color: Colors.textPrimary,
    fontSize: moderateScale(18),
    fontWeight: '800',
    marginRight: scale(10),
  },
  googleButtonText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(24),
    paddingHorizontal: scale(16),
  },
  securityIcon: {
    fontSize: moderateScale(14),
    marginRight: scale(6),
  },
  securityText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    textAlign: 'center',
  },
});
