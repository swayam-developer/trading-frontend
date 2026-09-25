import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../../theme/colors';

interface PortfolioSummaryCardProps {
  totalCurrentValue: number;
  totalInvested: number;
  cashBalance: number;
  todayPnl?: number;
  todayPnlPercent?: string;
  onDepositPress?: () => void;
  onOrdersPress?: () => void;
}

const PortfolioSummaryCardComponent: React.FC<PortfolioSummaryCardProps> = ({
  totalCurrentValue,
  totalInvested,
  cashBalance,
  todayPnl = 0,
  todayPnlPercent = '0.00',
  onDepositPress,
  onOrdersPress,
}) => {
  const [pnlViewMode, setPnlViewMode] = useState<'overall' | 'today'>('overall');

  const totalNetWorth = totalCurrentValue + cashBalance;
  const totalPnl = totalCurrentValue - totalInvested;
  const overallPnlPercent =
    totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : '0.00';

  const activePnl = pnlViewMode === 'overall' ? totalPnl : todayPnl;
  const activePnlPercent = pnlViewMode === 'overall' ? overallPnlPercent : todayPnlPercent;
  const isPositive = activePnl >= 0;

  return (
    <View style={styles.container}>
      {/* Top Header: Label and Live Security Tag */}
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>NET ASSET VALUE</Text>
          <View style={styles.verifiedBadge}>
            <Icon name="shield-checkmark" size={moderateScale(10)} color={Colors.primary} />
            <Text style={styles.verifiedText}>REAL-TIME</Text>
          </View>
        </View>

        {onOrdersPress && (
          <TouchableOpacity
            style={styles.ordersButton}
            onPress={onOrdersPress}
            activeOpacity={0.7}
          >
            <Icon name="receipt-outline" size={moderateScale(12)} color={Colors.textSecondary} />
            <Text style={styles.ordersButtonText}>Orders</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Net Worth Large Number */}
      <Text style={styles.netWorthText}>
        ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>

      {/* P&L Row with Switchable Overall / Today Mode */}
      <View style={styles.pnlRow}>
        <TouchableOpacity
          onPress={() => setPnlViewMode((prev) => (prev === 'overall' ? 'today' : 'overall'))}
          activeOpacity={0.7}
        >
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
              {isPositive ? '+' : ''}${Math.abs(activePnl).toFixed(2)} ({isPositive ? '+' : ''}
              {activePnlPercent}%)
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPnlViewMode((prev) => (prev === 'overall' ? 'today' : 'overall'))}
          activeOpacity={0.7}
          style={styles.pnlModeSwitch}
        >
          <Text style={styles.pnlSubtext}>
            {pnlViewMode === 'overall' ? 'Total Returns' : "Today's Return"}
          </Text>
          <Icon name="swap-horizontal" size={moderateScale(12)} color={Colors.textMuted} style={{ marginLeft: scale(3) }} />
        </TouchableOpacity>
      </View>

      {/* 3-Column Financial Breakdown */}
      <View style={styles.breakdownGrid}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Invested</Text>
          <Text style={styles.breakdownValue}>
            ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.breakdownDivider} />

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Holdings Value</Text>
          <Text style={styles.breakdownValue}>
            ${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.breakdownDivider} />

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Available Cash</Text>
          <Text style={[styles.breakdownValue, { color: Colors.secondary }]}>
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <Icon name="add-circle" size={moderateScale(16)} color={Colors.primary} />
          </View>
          <View style={styles.depositTextWrap}>
            <Text style={styles.depositTitle}>Add Mock Trading Balance</Text>
            <Text style={styles.depositSubtitle}>Instant cash funds for buying shares</Text>
          </View>
          <Icon name="chevron-forward" size={moderateScale(15)} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const PortfolioSummaryCard = React.memo<PortfolioSummaryCardProps>(PortfolioSummaryCardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1.5),
    borderRadius: moderateScale(4),
    marginLeft: scale(8),
  },
  verifiedText: {
    color: Colors.primary,
    fontSize: moderateScale(8.5),
    fontWeight: '800',
    marginLeft: scale(3),
    letterSpacing: 0.3,
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  ordersButtonText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(11),
    fontWeight: '700',
    marginLeft: scale(4),
  },
  netWorthText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(28),
    fontWeight: '900',
    marginTop: verticalScale(4),
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(5),
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
    fontWeight: '800',
    marginLeft: scale(3),
    fontVariant: ['tabular-nums'],
  },
  pnlModeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scale(8),
  },
  pnlSubtext: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  breakdownGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(12),
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
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    marginTop: verticalScale(2),
    fontVariant: ['tabular-nums'],
  },
  breakdownDivider: {
    width: 1,
    height: '65%',
    backgroundColor: Colors.cardBorder,
  },
  depositActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.07)',
    borderRadius: moderateScale(12),
    padding: scale(10),
    marginTop: verticalScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  depositIconCircle: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositTextWrap: {
    flex: 1,
    marginLeft: scale(10),
  },
  depositTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
  depositSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginTop: verticalScale(1),
  },
});
