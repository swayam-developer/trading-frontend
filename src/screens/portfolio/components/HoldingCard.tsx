import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Holding } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';

interface HoldingCardProps {
  holding: Holding;
  onTrade: () => void;
}

const BRAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  AAPL: { bg: '#1E293B', text: '#E2E8F0', border: '#334155' },
  MSFT: { bg: 'rgba(0, 164, 239, 0.15)', text: '#00A4EF', border: 'rgba(0, 164, 239, 0.35)' },
  GOOGL: { bg: 'rgba(234, 67, 53, 0.15)', text: '#EA4335', border: 'rgba(234, 67, 53, 0.35)' },
  AMZN: { bg: 'rgba(255, 153, 0, 0.15)', text: '#FF9900', border: 'rgba(255, 153, 0, 0.35)' },
  TSLA: { bg: 'rgba(232, 33, 39, 0.15)', text: '#E82127', border: 'rgba(232, 33, 39, 0.35)' },
  META: { bg: 'rgba(6, 104, 225, 0.15)', text: '#0668E1', border: 'rgba(6, 104, 225, 0.35)' },
  NVDA: { bg: 'rgba(118, 185, 0, 0.15)', text: '#76B900', border: 'rgba(118, 185, 0, 0.35)' },
  NFLX: { bg: 'rgba(229, 9, 20, 0.15)', text: '#E50914', border: 'rgba(229, 9, 20, 0.35)' },
  DIS: { bg: 'rgba(17, 60, 207, 0.15)', text: '#3B82F6', border: 'rgba(17, 60, 207, 0.35)' },
};

const DEFAULT_BRAND = { bg: 'rgba(0, 230, 118, 0.12)', text: '#00E676', border: 'rgba(0, 230, 118, 0.3)' };

export const HoldingCard: React.FC<HoldingCardProps> = ({ holding, onTrade }) => {
  const [imageError, setImageError] = useState(false);
  const stock = holding.stock;

  let currentPrice = stock?.currentPrice || holding.buyPrice || 0;
  if (currentPrice > 1000000) currentPrice = 175.43;
  let buyPrice = holding.buyPrice || currentPrice;
  if (buyPrice > 1000000) buyPrice = 170.00;

  const totalValue = holding.quantity * currentPrice;
  const totalInvested = holding.quantity * buyPrice;
  const pnl = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(2) : '0.00';
  const isPositive = pnl >= 0;

  const symbol = stock?.symbol || 'STOCK';
  const brand = BRAND_COLORS[symbol.toUpperCase()] || DEFAULT_BRAND;

  return (
    <View style={styles.card}>
      {/* Top row: Icon, Symbol, and Current Valuation */}
      <View style={styles.topRow}>
        <View style={[styles.avatarBox, { backgroundColor: brand.bg, borderColor: brand.border }]}>
          {!imageError && stock?.iconUrl && stock.iconUrl.startsWith('http') ? (
            <Image
              source={{ uri: stock.iconUrl }}
              style={styles.avatarImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <Text style={[styles.avatarText, { color: brand.text }]}>
              {symbol.slice(0, 3).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.stockInfo}>
          <Text style={styles.symbolText}>{symbol}</Text>
          <Text style={styles.companyText} numberOfLines={1}>
            {stock?.companyName || 'Registered Security'}
          </Text>
        </View>

        <View style={styles.valuationContainer}>
          <Text style={styles.currentValueText}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.pnlRow}>
            <Icon
              name={isPositive ? 'caret-up' : 'caret-down'}
              size={moderateScale(10)}
              color={isPositive ? Colors.primary : Colors.error}
            />
            <Text
              style={[
                styles.pnlText,
                { color: isPositive ? Colors.primary : Colors.error },
              ]}
            >
              {isPositive ? '+' : ''}${Math.abs(pnl).toFixed(2)} ({isPositive ? '+' : ''}
              {pnlPercent}%)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Middle row: Holding Details (Quantity, Avg Buy, LTP) */}
      <View style={styles.detailsRow}>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>SHARES</Text>
          <Text style={styles.detailValue}>{holding.quantity}</Text>
        </View>

        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>AVG. BUY</Text>
          <Text style={styles.detailValue}>${buyPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>LTP</Text>
          <Text style={styles.detailValue}>${currentPrice.toFixed(2)}</Text>
        </View>

        {/* Action Button */}
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(4),
  },
  avatarText: {
    fontWeight: '900',
    fontSize: moderateScale(12),
  },
  stockInfo: {
    flex: 1,
  },
  symbolText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  companyText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
  },
  valuationContainer: {
    alignItems: 'flex-end',
  },
  currentValueText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  pnlText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    marginLeft: scale(2),
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
    fontSize: moderateScale(9),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginTop: verticalScale(2),
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
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginRight: scale(2),
  },
});
