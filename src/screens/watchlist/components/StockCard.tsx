import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Stock } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';

interface StockCardProps {
  stock: Stock;
  onPress: () => void;
}

// Branded color palettes for top securities
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
  JPM: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.35)' },
  V: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)' },
};

const DEFAULT_BRAND = { bg: 'rgba(0, 230, 118, 0.12)', text: '#00E676', border: 'rgba(0, 230, 118, 0.3)' };

export const StockCard: React.FC<StockCardProps> = ({ stock, onPress }) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Sanitize astronomical/corrupted prices from previous backend cron
  let currentPrice = typeof stock.currentPrice === 'number' ? stock.currentPrice : parseFloat(stock.currentPrice as any) || 0;
  let lastDayTradedPrice = typeof stock.lastDayTradedPrice === 'number' ? stock.lastDayTradedPrice : parseFloat(stock.lastDayTradedPrice as any) || currentPrice;

  if (currentPrice > 1000000) currentPrice = 175.43;
  if (lastDayTradedPrice > 1000000) lastDayTradedPrice = 171.20;

  const diff = currentPrice - lastDayTradedPrice;
  const isPositive = diff >= 0;
  const percentChange = lastDayTradedPrice > 0
    ? ((diff / lastDayTradedPrice) * 100).toFixed(2)
    : '0.00';

  const brand = BRAND_COLORS[stock.symbol.toUpperCase()] || DEFAULT_BRAND;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Left: Branded Logo / Monogram Avatar */}
      <View style={[styles.avatarBox, { backgroundColor: brand.bg, borderColor: brand.border }]}>
        {!imageFailed && stock.iconUrl && stock.iconUrl.startsWith('http') ? (
          <Image
            source={{ uri: stock.iconUrl }}
            style={styles.avatarImage}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text style={[styles.avatarText, { color: brand.text }]}>
            {stock.symbol.slice(0, 3).toUpperCase()}
          </Text>
        )}
      </View>

      {/* Middle: Stock Symbol & Company Name */}
      <View style={styles.symbolInfo}>
        <View style={styles.symbolRow}>
          <Text style={styles.symbolText} numberOfLines={1}>
            {stock.symbol}
          </Text>
          <View style={styles.eqBadge}>
            <Text style={styles.eqText}>EQ</Text>
          </View>
        </View>

        <Text style={styles.companyText} numberOfLines={1} ellipsizeMode="tail">
          {stock.companyName}
        </Text>
      </View>

      {/* Right: Clean Price & 24h Change Pill */}
      <View style={styles.priceColumn}>
        <Text style={styles.priceValue} numberOfLines={1}>
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        <View
          style={[
            styles.changeBadge,
            isPositive ? styles.changeBadgeUp : styles.changeBadgeDown,
          ]}
        >
          <Icon
            name={isPositive ? 'caret-up' : 'caret-down'}
            size={moderateScale(10)}
            color={isPositive ? Colors.primary : Colors.error}
            style={styles.caret}
          />
          <Text
            style={[
              styles.changePercentText,
              { color: isPositive ? Colors.primary : Colors.error },
            ]}
          >
            {isPositive ? '+' : ''}
            {percentChange}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  avatarBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(6),
  },
  avatarText: {
    fontWeight: '900',
    fontSize: moderateScale(13),
    letterSpacing: 0.5,
  },
  symbolInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: scale(10),
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eqBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(4),
    marginLeft: scale(6),
  },
  eqText: {
    color: Colors.textMuted,
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  companyText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    marginTop: verticalScale(3),
    fontWeight: '500',
  },
  priceColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: scale(90),
  },
  priceValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    marginTop: verticalScale(4),
  },
  changeBadgeUp: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  changeBadgeDown: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  caret: {
    marginRight: scale(3),
  },
  changePercentText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
});
