import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/auth/authStore';
import { MainTabNavigationProp } from '../../navigation/types';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp<'Profile'>>();
  const {
    user,
    profile,
    fetchProfile,
    logout,
    hasBiometric,
    isBiometricsAvailable,
    enrollBiometrics,
  } = useAuthStore();

  const [biometricEnabled, setBiometricEnabled] = useState(hasBiometric);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setBiometricEnabled(hasBiometric);
  }, [hasBiometric]);

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      try {
        await enrollBiometrics();
        setBiometricEnabled(true);
        Toast.show({
          type: 'success',
          text1: 'Biometrics Enrolled',
          text2: 'Fingerprint / Face ID is active for instant unlock.',
        });
      } catch (err: any) {
        setBiometricEnabled(false);
        Toast.show({
          type: 'error',
          text1: 'Enrollment Failed',
          text2: err.message || 'Could not enroll biometrics.',
        });
      }
    } else {
      setBiometricEnabled(false);
      Toast.show({
        type: 'info',
        text1: 'Biometrics Disabled',
        text2: 'You can re-enable anytime.',
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Toast.show({
              type: 'info',
              text1: 'Signed Out',
              text2: 'You have been safely signed out.',
            });
            navigation.getParent<any>()?.reset({
              index: 0,
              routes: [{ name: 'EmailCheck' }],
            });
          },
        },
      ]
    );
  };

  const displayName = profile?.name || user?.name || user?.email?.split('@')[0] || 'Aura Trader';
  const displayEmail = profile?.email || user?.email || 'user@auratrading.com';
  const balance = profile?.balance || '50,000.00';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>ACCOUNT & SECURITY</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.statusBadge}>
          <Icon name="checkmark-circle" size={moderateScale(12)} color={Colors.primary} />
          <Text style={styles.statusBadgeText}>ACTIVE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
            <View style={styles.userIdBadge}>
              <Text style={styles.userIdText}>
                ID: {profile?.userId ? `${profile.userId.slice(0, 8)}...` : 'TRADER'}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            <View style={styles.walletLabelGroup}>
              <Icon name="wallet" size={moderateScale(16)} color={Colors.primary} />
              <Text style={styles.walletLabel}>TRADING WALLET</Text>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>USD ($)</Text>
            </View>
          </View>

          <Text style={styles.walletBalance}>${balance}</Text>
          <Text style={styles.walletSubtext}>Available to purchase stocks immediately</Text>
        </View>

        {/* Security & Authentication Settings */}
        <Text style={styles.sectionHeader}>Security & Access</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="keypad-outline" size={moderateScale(18)} color={Colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>4-Digit Login PIN</Text>
              <Text style={styles.settingSubtitle}>Protected & Verified</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Configured</Text>
            </View>
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="finger-print-outline" size={moderateScale(18)} color={Colors.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingSubtitle}>
                {isBiometricsAvailable ? 'Fingerprint / Face ID' : 'Hardware unavailable'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: Colors.cardBorder, true: Colors.primaryDark }}
              thumbColor={biometricEnabled ? Colors.primary : Colors.textMuted}
              disabled={!isBiometricsAvailable}
            />
          </View>
        </View>

        {/* Trading System & Engine */}
        <Text style={styles.sectionHeader}>System Architecture</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="server-outline" size={moderateScale(18)} color={Colors.accentGold} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Trading Engine API</Text>
              <Text style={styles.settingSubtitle}>trading-app-yfln.onrender.com</Text>
            </View>
            <View style={styles.liveServerBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveServerText}>Online</Text>
            </View>
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="swap-horizontal-outline" size={moderateScale(18)} color={Colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Session Security</Text>
              <Text style={styles.settingSubtitle}>Socket Token 2FA Authenticated</Text>
            </View>
            <Icon name="checkmark-circle-outline" size={moderateScale(18)} color={Colors.primary} />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="log-out-outline" size={moderateScale(18)} color={Colors.error} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(24),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  statusBadgeText: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '800',
    marginLeft: scale(4),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(100),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginTop: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  avatarCircle: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: scale(14),
  },
  avatarInitials: {
    color: Colors.primary,
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  userEmail: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    marginTop: verticalScale(1),
  },
  userIdBadge: {
    backgroundColor: Colors.backgroundSecondary,
    alignSelf: 'flex-start',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(5),
  },
  userIdText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  walletCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(18),
    marginTop: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: scale(6),
  },
  currencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  currencyText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  walletBalance: {
    color: Colors.textPrimary,
    fontSize: moderateScale(28),
    fontWeight: '800',
    marginTop: verticalScale(8),
  },
  walletSubtext: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  sectionHeader: {
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  settingsGroup: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
  settingIconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  settingSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
  },
  activePill: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  activePillText: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  liveServerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(8),
  },
  liveDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: Colors.primary,
    marginRight: scale(5),
  },
  liveServerText: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: scale(14),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(46),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    marginTop: verticalScale(24),
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginLeft: scale(8),
  },
});
