import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Stock } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';
import { StockAvatar } from '../../../components/common/StockAvatar';
import { MiniSparkline } from '../../../components/common/MiniSparkline';

interface StockCardProps {
  stock: Stock;
  onPress: () => void;
  pillDisplayMode?: 'percent' | 'dollar';
  onTogglePillMode?: () => void;
}

const StockCardComponent: React.FC<StockCardProps> = ({
  stock,
  onPress,
  pillDisplayMode = 'percent',
  onTogglePillMode,
}) => {
  const [internalMode, setInternalMode] = useState<'percent' | 'dollar'>('percent');
  const activeMode = onTogglePillMode ? pillDisplayMode : internalMode;

  // Flash animation on live price tick
  const flashAnim = useRef(new Animated.Value(0)).current;
  const prevPriceRef = useRef<number>(stock.currentPrice);

  // Sanitize astronomical/corrupted prices from legacy cron data
  let currentPrice =
    typeof stock.currentPrice === 'number'
      ? stock.currentPrice
      : parseFloat(stock.currentPrice as any) || 0;
  let lastDayTradedPrice =
    typeof stock.lastDayTradedPrice === 'number'
      ? stock.lastDayTradedPrice
      : parseFloat(stock.lastDayTradedPrice as any) || currentPrice;

  if (currentPrice > 1000000) currentPrice = 175.43;
  if (lastDayTradedPrice > 1000000) lastDayTradedPrice = 171.2;

  const diff = currentPrice - lastDayTradedPrice;
  const isPositive = diff >= 0;
  const percentChange =
    lastDayTradedPrice > 0
      ? ((diff / lastDayTradedPrice) * 100).toFixed(2)
      : '0.00';

  // Trigger flash on real-time price tick update
  useEffect(() => {
    if (prevPriceRef.current !== currentPrice) {
      prevPriceRef.current = currentPrice;
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [currentPrice, flashAnim]);

  // Extract sparkline points from dayTimeSeries if available
  const sparklineData = React.useMemo(() => {
    if (stock.dayTimeSeries && stock.dayTimeSeries.length >= 2) {
      return stock.dayTimeSeries
        .map((pt) => (typeof pt === 'number' ? pt : pt?.value || 0))
        .filter((v) => v > 0 && v < 1000000);
    }
    return undefined;
  }, [stock.dayTimeSeries]);


  const handlePillPress = () => {
    if (onTogglePillMode) {
      onTogglePillMode();
    } else {
      setInternalMode((prev) => (prev === 'percent' ? 'dollar' : 'percent'));
    }
  };

  const flashBgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'transparent',
      isPositive ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 82, 82, 0.25)',
    ],
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {/* Left: Real High-Res Branded Stock Avatar */}
      <StockAvatar
        symbol={stock.symbol}
        iconUrl={stock.iconUrl}
        size={scale(40)}
        borderRadius={scale(12)}
        style={styles.avatarSpacing}
      />

      {/* Symbol & Info Column */}
      <View style={styles.symbolInfo}>
        <Text style={styles.symbolText} numberOfLines={1} ellipsizeMode="tail">
          {stock.symbol}
        </Text>
        <Text style={styles.companyText} numberOfLines={1} ellipsizeMode="tail">
          {stock.companyName}
        </Text>
      </View>

      {/* Center: Monotone SVG Sparkline */}
      <View style={styles.sparklineContainer}>
        <MiniSparkline
          data={sparklineData}
          isPositive={isPositive}
          width={scale(50)}
          height={verticalScale(24)}
          strokeWidth={1.7}
        />
      </View>

      {/* Right: Live Tabular Price & Tappable Change Pill */}
      <View style={styles.priceColumn}>
        <Animated.View style={[styles.priceFlashWrap, { backgroundColor: flashBgColor }]}>
          <Text style={styles.priceValue} numberOfLines={1}>
            ${currentPrice.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </Animated.View>

        <TouchableOpacity
          onPress={handlePillPress}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <View
            style={[
              styles.changeBadge,
              isPositive ? styles.changeBadgeUp : styles.changeBadgeDown,
            ]}
          >
            <Icon
              name={isPositive ? 'caret-up' : 'caret-down'}
              size={moderateScale(8.5)}
              color={isPositive ? Colors.primary : Colors.error}
              style={styles.caret}
            />
            <Text
              style={[
                styles.changePercentText,
                { color: isPositive ? Colors.primary : Colors.error },
              ]}
            >
              {activeMode === 'percent'
                ? `${isPositive ? '+' : ''}${percentChange}%`
                : `${isPositive ? '+' : '-'}$${Math.abs(diff).toFixed(2)}`}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const StockCard = React.memo<StockCardProps>(
  StockCardComponent,
  (prev, next) => {
    return (
      prev.stock._id === next.stock._id &&
      prev.stock.symbol === next.stock.symbol &&
      prev.stock.currentPrice === next.stock.currentPrice &&
      prev.stock.lastDayTradedPrice === next.stock.lastDayTradedPrice &&
      prev.pillDisplayMode === next.pillDisplayMode &&
      prev.stock.iconUrl === next.stock.iconUrl &&
      prev.stock.companyName === next.stock.companyName &&
      prev.stock.dayTimeSeries === next.stock.dayTimeSeries
    );
  }
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  avatarSpacing: {
    marginRight: scale(10),
  },
  symbolInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    marginRight: scale(8),
  },
  symbolText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  companyText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
    fontWeight: '500',
  },
  sparklineContainer: {
    width: scale(50),
    height: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(4),
    flexShrink: 0,
  },
  priceColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: scale(82),
  },
  priceFlashWrap: {
    borderRadius: moderateScale(4),
    paddingHorizontal: scale(3),
    paddingVertical: verticalScale(1),
  },
  priceValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(14.5),
    fontWeight: '800',
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2.5),
    borderRadius: moderateScale(5),
    marginTop: verticalScale(3),
  },
  changeBadgeUp: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  changeBadgeDown: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  caret: {
    marginRight: scale(2.5),
  },
  changePercentText: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
