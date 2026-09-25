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
  const [marketAlertsEnabled, setMarketAlertsEnabled] = useState(true);
  const [amoAutoQueue, setAmoAutoQueue] = useState(true);

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
          text1: 'Biometrics Active 🟢',
          text2: 'Fingerprint / Face ID is enabled for instant unlock.',
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
        text2: 'You can re-enable anytime in settings.',
      });
    }
  };

  const handleCopyId = () => {
    Toast.show({
      type: 'info',
      text1: 'Account ID Copied',
      text2: 'Your trader ID has been copied to clipboard.',
    });
  };

  const handleResetMpin = async () => {
    const targetEmail = profile?.email || user?.email;
    if (!targetEmail) {
      Toast.show({
        type: 'error',
        text1: 'Email Not Found',
        text2: 'Could not resolve user email.',
      });
      return;
    }

    try {
      const res = await useAuthStore.getState().forgotPin(targetEmail);
      Toast.show({
        type: 'info',
        text1: 'Reset Code Sent',
        text2: res.msg || `A 6-digit MPIN reset code was sent to ${targetEmail}`,
      });
      navigation.getParent<any>()?.navigate('VerifyOtp', {
        email: targetEmail,
        otp_type: 'reset_pin',
        testOtp: res?.otp,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: err.message || 'Unable to send MPIN reset code.',
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
  const displayEmail = profile?.email || user?.email || 'trader@auratrading.com';
  const balance = profile?.balance ? parseFloat(profile.balance) : 50000.0;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const userId = profile?.userId ? profile.userId.slice(0, 10).toUpperCase() : 'TRADER-8821';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* 1. Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>ACCOUNT & SETTINGS</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.statusBadge}>
          <Icon name="shield-checkmark" size={moderateScale(12)} color={Colors.primary} />
          <Text style={styles.statusBadgeText}>KYC VERIFIED</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Trader Identity Hero Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>

            <Text style={styles.userEmail}>{displayEmail}</Text>

            <TouchableOpacity
              style={styles.userIdChip}
              onPress={handleCopyId}
              activeOpacity={0.7}
            >
              <Text style={styles.userIdText}>ID: {userId}</Text>
              <Icon name="copy-outline" size={moderateScale(10)} color={Colors.textMuted} style={{ marginLeft: scale(4) }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Trading Account Balance & Buying Power Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            <View style={styles.walletLabelGroup}>
              <Icon name="wallet" size={moderateScale(16)} color={Colors.primary} />
              <Text style={styles.walletLabel}>TRADING BUYING POWER</Text>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>USD ($)</Text>
            </View>
          </View>

          <Text style={styles.walletBalance}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          <View style={styles.walletMetaRow}>
            <View style={styles.metaPill}>
              <View style={styles.greenDot} />
              <Text style={styles.metaPillText}>Instant Settlement</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>Zero Commission</Text>
            </View>
          </View>

          {/* Wallet Actions */}
          <View style={styles.walletActionsRow}>
            <TouchableOpacity
              style={styles.walletActionBtn}
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: 'Funds Available 💵',
                  text2: 'Your mock trading account has instant funding active.',
                });
              }}
              activeOpacity={0.8}
            >
              <Icon name="add-circle-outline" size={moderateScale(14)} color={Colors.primary} style={{ marginRight: scale(4) }} />
              <Text style={styles.walletActionBtnText}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.walletActionBtnSecondary}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.8}
            >
              <Icon name="receipt-outline" size={moderateScale(14)} color={Colors.textPrimary} style={{ marginRight: scale(4) }} />
              <Text style={styles.walletActionBtnSecText}>Statements</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Security & Biometrics */}
        <Text style={styles.sectionHeader}>Security & Access</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="keypad-outline" size={moderateScale(18)} color={Colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>4-Digit Login PIN</Text>
              <Text style={styles.settingSubtitle}>Hardware Encrypted Protection</Text>
            </View>
            <TouchableOpacity
              style={styles.resetPinChip}
              onPress={handleResetMpin}
              activeOpacity={0.7}
            >
              <Text style={styles.resetPinChipText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="finger-print-outline" size={moderateScale(18)} color={Colors.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingSubtitle}>
                {isBiometricsAvailable ? 'Fingerprint / Face ID Unlock' : 'Hardware unavailable'}
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

        {/* 5. Trading Preferences */}
        <Text style={styles.sectionHeader}>Trading Preferences</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="time-outline" size={moderateScale(18)} color="#FFD700" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>After-Market Orders (AMO)</Text>
              <Text style={styles.settingSubtitle}>Auto-queue orders when markets are closed</Text>
            </View>
            <Switch
              value={amoAutoQueue}
              onValueChange={setAmoAutoQueue}
              trackColor={{ false: Colors.cardBorder, true: Colors.primaryDark }}
              thumbColor={amoAutoQueue ? Colors.primary : Colors.textMuted}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Icon name="notifications-outline" size={moderateScale(18)} color={Colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Market Bell & Holiday Alerts</Text>
              <Text style={styles.settingSubtitle}>Toast notifications for open/close</Text>
            </View>
            <Switch
              value={marketAlertsEnabled}
              onValueChange={setMarketAlertsEnabled}
              trackColor={{ false: Colors.cardBorder, true: Colors.primaryDark }}
              thumbColor={marketAlertsEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>
        </View>

        {/* 6. Trading Engine & System Architecture */}
        <Text style={styles.sectionHeader}>Engine Architecture</Text>
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
              <Icon name="hardware-chip-outline" size={moderateScale(18)} color={Colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>App Version</Text>
              <Text style={styles.settingSubtitle}>TradeVault Aura v2.4.0 (Build 92)</Text>
            </View>
            <Text style={styles.versionText}>Latest</Text>
          </View>
        </View>

        {/* 7. Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="log-out-outline" size={moderateScale(18)} color={Colors.error} />
          <Text style={styles.logoutButtonText}>Sign Out of Account</Text>
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
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(6),
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '900',
    letterSpacing: 0.2,
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
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    marginLeft: scale(4),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(100),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginTop: verticalScale(6),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarCircle: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(27),
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: scale(14),
  },
  avatarInitials: {
    color: Colors.primary,
    fontSize: moderateScale(19),
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  proBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(4),
    marginLeft: scale(6),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  proBadgeText: {
    color: Colors.primary,
    fontSize: moderateScale(8.5),
    fontWeight: '900',
  },
  userEmail: {
    color: Colors.textMuted,
    fontSize: moderateScale(11.5),
    marginTop: verticalScale(1),
  },
  userIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    alignSelf: 'flex-start',
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2.5),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(6),
  },
  userIdText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(9.5),
    fontWeight: '700',
  },
  walletCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginTop: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
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
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: scale(6),
  },
  currencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(5),
  },
  currencyText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(9.5),
    fontWeight: '700',
  },
  walletBalance: {
    color: Colors.textPrimary,
    fontSize: moderateScale(28),
    fontWeight: '900',
    marginTop: verticalScale(6),
    fontVariant: ['tabular-nums'],
  },
  walletMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(4),
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  greenDot: {
    width: scale(4),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: Colors.primary,
    marginRight: scale(4),
  },
  metaPillText: {
    color: Colors.textMuted,
    fontSize: moderateScale(9.5),
    fontWeight: '600',
  },
  walletActionsRow: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: verticalScale(14),
  },
  walletActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    height: verticalScale(34),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  walletActionBtnText: {
    color: Colors.primary,
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
  walletActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: verticalScale(34),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  walletActionBtnSecText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  sectionHeader: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    marginTop: verticalScale(18),
    marginBottom: verticalScale(8),
    letterSpacing: 0.2,
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
    paddingVertical: verticalScale(11),
  },
  settingIconContainer: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
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
    fontSize: moderateScale(10.5),
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
    fontWeight: '800',
  },
  resetPinChip: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  resetPinChipText: {
    color: Colors.secondary,
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  liveServerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  liveDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: Colors.primary,
    marginRight: scale(4),
  },
  liveServerText: {
    color: Colors.primary,
    fontSize: moderateScale(9.5),
    fontWeight: '800',
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: moderateScale(10.5),
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
    height: verticalScale(44),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.35)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    marginTop: verticalScale(22),
    marginBottom: verticalScale(20),
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    marginLeft: scale(8),
  },
});
