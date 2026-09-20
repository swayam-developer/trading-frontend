import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../../theme/colors';

interface PortfolioSummaryCardProps {
  totalCurrentValue: number;
  totalInvested: number;
  cashBalance: number;
  onDepositPress?: () => void;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({
  totalCurrentValue,
  totalInvested,
  cashBalance,
  onDepositPress,
}) => {
  const totalNetWorth = totalCurrentValue + cashBalance;
  const totalPnl = totalCurrentValue - totalInvested;
  const pnlPercent =
    totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : '0.00';
  const isPositive = totalPnl >= 0;

  return (
    <View style={styles.container}>
      {/* Label and Badge */}
      <View style={styles.topRow}>
        <Text style={styles.label}>TOTAL ASSET VALUE</Text>
        <View style={styles.shieldBadge}>
          <Icon name="shield-checkmark" size={moderateScale(11)} color={Colors.primary} />
          <Text style={styles.shieldText}>VERIFIED</Text>
        </View>
      </View>

      {/* Main Net Worth Amount */}
      <Text style={styles.netWorthText}>${totalNetWorth.toFixed(2)}</Text>

      {/* P&L Row */}
      <View style={styles.pnlRow}>
        <View
          style={[
            styles.pnlPill,
            isPositive ? styles.pnlPillUp : styles.pnlPillDown,
          ]}
        >
          <Icon
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={moderateScale(11)}
            color={isPositive ? Colors.primary : Colors.error}
          />
          <Text
            style={[
              styles.pnlValue,
              { color: isPositive ? Colors.primary : Colors.error },
            ]}
          >
            {isPositive ? '+' : ''}${Math.abs(totalPnl).toFixed(2)} ({isPositive ? '+' : ''}
            {pnlPercent}%)
          </Text>
        </View>
        <Text style={styles.pnlSubtext}>Total Returns</Text>
      </View>

      {/* Financial Breakdown Grid */}
      <View style={styles.breakdownGrid}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Invested</Text>
          <Text style={styles.breakdownValue}>${totalInvested.toFixed(2)}</Text>
        </View>

        <View style={styles.breakdownDivider} />

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Holdings Value</Text>
          <Text style={styles.breakdownValue}>${totalCurrentValue.toFixed(2)}</Text>
        </View>

        <View style={styles.breakdownDivider} />

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Available Cash</Text>
          <Text style={[styles.breakdownValue, { color: Colors.secondary }]}>
            ${cashBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Quick Deposit Banner */}
      {onDepositPress && (
        <TouchableOpacity
          style={styles.depositActionRow}
          onPress={onDepositPress}
          activeOpacity={0.8}
        >
          <View style={styles.depositIconCircle}>
            <Icon name="wallet-outline" size={moderateScale(14)} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: scale(10) }}>
            <Text style={styles.depositTitle}>Add Mock Trading Funds</Text>
            <Text style={styles.depositSubtitle}>Instant balance for buying stocks</Text>
          </View>
          <Icon name="chevron-forward" size={moderateScale(16)} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 1,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  shieldText: {
    color: Colors.primary,
    fontSize: moderateScale(9),
    fontWeight: '700',
    marginLeft: scale(4),
  },
  netWorthText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(28),
    fontWeight: '800',
    marginTop: verticalScale(4),
    letterSpacing: 0.3,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  pnlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  pnlPillUp: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  pnlPillDown: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  pnlValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginLeft: scale(3),
  },
  pnlSubtext: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginLeft: scale(8),
    fontWeight: '500',
  },
  breakdownGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    marginTop: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  breakdownValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginTop: verticalScale(2),
  },
  breakdownDivider: {
    width: 1,
    height: '70%',
    backgroundColor: Colors.cardBorder,
  },
  depositActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: moderateScale(10),
    padding: scale(10),
    marginTop: verticalScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  depositIconCircle: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  depositSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginTop: verticalScale(1),
  },
});
