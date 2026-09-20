import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { AuraLogo } from '../../components/common/AuraLogo';
import { useAuthStore } from '../../store/auth/authStore';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'Splash'>>();
  const { isAuthenticated, hasPin } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        if (hasPin) {
          navigation.replace('VerifyPin');
        } else {
          navigation.replace('SetPin');
        }
      } else {
        navigation.replace('EmailCheck');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasPin, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.centerContent}>
        <AuraLogo size={80} showTagline={true} />
      </View>

      <View style={styles.footer}>
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>
        <Text style={styles.connectingText}>Connecting to Global Markets...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    width: '80%',
  },
  progressBarBackground: {
    width: '100%',
    height: verticalScale(4),
    backgroundColor: Colors.card,
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(2),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  connectingText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(10),
    letterSpacing: 0.5,
  },
});
