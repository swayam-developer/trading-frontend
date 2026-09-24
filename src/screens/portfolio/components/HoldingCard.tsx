import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Holding } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';
import { StockAvatar } from '../../../components/common/StockAvatar';
import { MiniSparkline } from '../../../components/common/MiniSparkline';

interface HoldingCardProps {
  holding: Holding;
  onTrade: () => void;
  pillDisplayMode?: 'dollar' | 'percent';
  onTogglePillMode?: () => void;
}

export const HoldingCard: React.FC<HoldingCardProps> = ({
  holding,
  onTrade,
  pillDisplayMode = 'dollar',
  onTogglePillMode,
}) => {
  const [internalMode, setInternalMode] = useState<'dollar' | 'percent'>('dollar');
  const activeMode = onTogglePillMode ? pillDisplayMode : internalMode;

  const stock = holding.stock;

  let currentPrice = stock?.currentPrice || holding.buyPrice || 0;
  if (currentPrice > 1000000) currentPrice = 175.43;
  let buyPrice = holding.buyPrice || currentPrice;
  if (buyPrice > 1000000) buyPrice = 170.0;

  const totalValue = holding.quantity * currentPrice;
  const totalInvested = holding.quantity * buyPrice;
  const pnl = totalValue - totalInvested;
  const pnlPercent =
    totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(2) : '0.00';
  const isPositive = pnl >= 0;

  const symbol = stock?.symbol || 'STOCK';

  // Extract sparkline points if available
  const sparklineData = React.useMemo(() => {
    if (stock?.dayTimeSeries && stock.dayTimeSeries.length >= 2) {
      return stock.dayTimeSeries
        .map((pt) => (typeof pt === 'number' ? pt : pt?.value || 0))
        .filter((v) => v > 0 && v < 1000000);
    }
    return undefined;
  }, [stock?.dayTimeSeries]);

  const handlePillPress = () => {
    if (onTogglePillMode) {
      onTogglePillMode();
    } else {
      setInternalMode((prev) => (prev === 'dollar' ? 'percent' : 'dollar'));
    }
  };

  return (
    <View style={styles.card}>
      {/* Top row: Avatar, Identity, Sparkline, and Valuation */}
      <View style={styles.topRow}>
        <StockAvatar
          symbol={symbol}
          iconUrl={stock?.iconUrl}
          size={scale(42)}
          borderRadius={scale(14)}
          style={styles.avatarSpacing}
        />

        {/* Security Name & Shares */}
        <View style={styles.stockInfo}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbolText}>{symbol}</Text>
            <View style={styles.sharesBadge}>
              <Text style={styles.sharesBadgeText}>{holding.quantity} Shs</Text>
            </View>
          </View>
          <Text style={styles.companyText} numberOfLines={1}>
            {stock?.companyName || 'Registered Security'}
          </Text>
        </View>

        {/* Mini Sparkline Curve */}
        <View style={styles.sparklineWrap}>
          <MiniSparkline
            data={sparklineData}
            isPositive={isPositive}
            width={scale(50)}
            height={verticalScale(22)}
            strokeWidth={1.6}
          />
        </View>

        {/* Current Valuation & Tappable P&L Pill */}
        <View style={styles.valuationContainer}>
          <Text style={styles.currentValueText}>
            ${totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>

          <TouchableOpacity
            onPress={handlePillPress}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View
              style={[
                styles.pnlBadge,
                isPositive ? styles.pnlBadgeUp : styles.pnlBadgeDown,
              ]}
            >
              <Icon
                name={isPositive ? 'caret-up' : 'caret-down'}
                size={moderateScale(9)}
                color={isPositive ? Colors.primary : Colors.error}
              />
              <Text
                style={[
                  styles.pnlText,
                  { color: isPositive ? Colors.primary : Colors.error },
                ]}
              >
                {activeMode === 'dollar'
                  ? `${isPositive ? '+' : '-'}$${Math.abs(pnl).toFixed(2)}`
                  : `${isPositive ? '+' : ''}${pnlPercent}%`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom row: Detailed Cost Basis & Quick Trade Action */}
      <View style={styles.detailsRow}>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>AVG COST</Text>
          <Text style={styles.detailValue}>${buyPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>LTP</Text>
          <Text style={styles.detailValue}>${currentPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>INVESTED</Text>
          <Text style={styles.detailValue}>${totalInvested.toFixed(2)}</Text>
        </View>

        {/* Quick Trade Button */}
        <TouchableOpacity style={styles.tradeButton} onPress={onTrade} activeOpacity={0.8}>
          <Text style={styles.tradeButtonText}>Trade</Text>
          <Icon name="chevron-forward" size={moderateScale(12)} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSpacing: {
    marginRight: scale(10),
  },
  stockInfo: {
    flex: 1.2,
    justifyContent: 'center',
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sharesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(4),
    marginLeft: scale(6),
  },
  sharesBadgeText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  companyText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  sparklineWrap: {
    marginHorizontal: scale(4),
  },
  valuationContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: scale(88),
  },
  currentValueText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pnlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2.5),
    borderRadius: moderateScale(5),
    marginTop: verticalScale(3),
  },
  pnlBadgeUp: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  pnlBadgeDown: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  pnlText: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    marginLeft: scale(2),
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: verticalScale(10),
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailColumn: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(8.5),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '800',
    marginTop: verticalScale(2),
    fontVariant: ['tabular-nums'],
  },
  tradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  tradeButtonText: {
    color: Colors.primary,
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    marginRight: scale(2),
  },
});
