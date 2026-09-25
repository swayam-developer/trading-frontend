import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootNavigationProp } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/auth/authStore';
import { StockAvatar } from '../../components/common/StockAvatar';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'Dashboard'>>();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await logout();
    Toast.show({
      type: 'info',
      text1: 'Signed Out',
      text2: 'You have been safely signed out.',
    });
    navigation.replace('EmailCheck');
  };

  const displayName = profile?.name || user?.name || user?.email?.split('@')[0] || 'Trader';
  const balance = profile?.balance || '50,000.00';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingText}>Welcome,</Text>
          <Text style={styles.userNameText}>{displayName}</Text>
        </View>
        <View style={styles.marketStatusBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.marketStatusText}>MARKETS OPEN</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Portfolio Balance Card */}
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>TOTAL PORTFOLIO VALUE</Text>
          <Text style={styles.portfolioBalance}>${balance}</Text>

          <View style={styles.pnlRow}>
            <Text style={styles.pnlPositive}>▲ +$1,245.80 (+2.49%)</Text>
            <Text style={styles.pnlSubtext}>Today</Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButtonDeposit} activeOpacity={0.8}>
              <Text style={styles.actionButtonDepositText}>+ Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonWithdraw} activeOpacity={0.8}>
              <Text style={styles.actionButtonWithdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Watchlist Preview */}
        <Text style={styles.sectionTitle}>Market Watchlist</Text>
        {[
          { symbol: 'AAPL', name: 'Apple Inc.', price: '$175.43', change: '+1.42%', up: true },
          { symbol: 'MSFT', name: 'Microsoft Corporation', price: '$338.11', change: '+0.85%', up: true },
          { symbol: 'TSLA', name: 'Tesla, Inc.', price: '$248.50', change: '-0.92%', up: false },
          { symbol: 'NVDA', name: 'Nvidia Corp.', price: '$485.09', change: '+4.12%', up: true },
        ].map((item, idx) => (
          <View key={idx} style={styles.stockItem}>
            <View style={styles.stockLeft}>
              <StockAvatar
                symbol={item.symbol}
                size={scale(36)}
                borderRadius={scale(10)}
                style={styles.stockAvatar}
              />
              <View>
                <Text style={styles.stockSymbol}>{item.symbol}</Text>
                <Text style={styles.stockName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.stockPriceContainer}>
              <Text style={styles.stockPrice}>{item.price}</Text>
              <Text style={item.up ? styles.stockChangeUp : styles.stockChangeDown}>
                {item.change}
              </Text>
            </View>
          </View>
        ))}

        {/* Account & Security Summary */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>Account & Security Status</Text>
          <View style={styles.securityRow}>
            <Text style={styles.securityItemLabel}>Email Verified:</Text>
            <Text style={styles.securityItemValue}>✓ Yes</Text>
          </View>
          <View style={styles.securityRow}>
            <Text style={styles.securityItemLabel}>4-Digit PIN Protection:</Text>
            <Text style={styles.securityItemValue}>
              {profile?.login_pin_exist ? '✓ Active' : '○ Pending'}
            </Text>
          </View>
          <View style={styles.securityRow}>
            <Text style={styles.securityItemLabel}>API Server:</Text>
            <Text style={styles.securityItemValue}>Connected (TradeVault)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(10),
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  greetingText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  userNameText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  marketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  liveDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: Colors.primary,
    marginRight: scale(6),
  },
  marketStatusText: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: scale(20),
  },
  portfolioCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(20),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  portfolioLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    letterSpacing: 1,
    fontWeight: '600',
  },
  portfolioBalance: {
    color: Colors.textPrimary,
    fontSize: moderateScale(30),
    fontWeight: '800',
    marginVertical: verticalScale(4),
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pnlPositive: {
    color: Colors.primary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  pnlSubtext: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    marginLeft: scale(6),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: verticalScale(18),
  },
  actionButtonDeposit: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: verticalScale(38),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
  },
  actionButtonDepositText: {
    color: Colors.background,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  actionButtonWithdraw: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    height: verticalScale(38),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginLeft: scale(8),
  },
  actionButtonWithdrawText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginTop: verticalScale(24),
    marginBottom: verticalScale(12),
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(12),
    padding: scale(14),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockAvatar: {
    marginRight: scale(10),
  },
  stockSymbol: {
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  stockName: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  stockChangeUp: {
    color: Colors.primary,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
  stockChangeDown: {
    color: Colors.error,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
  securityCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginTop: verticalScale(16),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  securityTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginBottom: verticalScale(10),
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(4),
  },
  securityItemLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  securityItemValue: {
    color: Colors.secondary,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(44),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: Colors.error,
    marginTop: verticalScale(24),
    marginBottom: verticalScale(20),
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});
