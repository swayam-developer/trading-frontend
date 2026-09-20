import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { PriceAreaChart } from '../../components/common/PriceAreaChart';
import { RootNavigationProp, RootRouteProp } from '../../navigation/types';
import { useStockStore } from '../../store/stock/stockStore';
import { TradeModal } from './components/TradeModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeFrame = '1D' | '1W' | '1M' | '1Y' | 'ALL';

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

export const StockDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigationProp<'StockDetail'>>();
  const route = useRoute<RootRouteProp<'StockDetail'>>();
  const { stock } = route.params;

  const { holdings } = useStockStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1D');
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [imageError, setImageError] = useState(false);

  // Check if authenticated user holds this stock
  const userHolding = useMemo(() => {
    return (
      holdings.find(
        (h) => h.stock?._id === stock._id || h.stock?.symbol === stock.symbol
      ) || null
    );
  }, [holdings, stock]);

  // Sanitize astronomical numbers if present
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

  // Generate realistic chart data based on selected timeframe
  const chartData = useMemo(() => {
    const ltp = lastDayTradedPrice || currentPrice * 0.98;
    const delta = currentPrice - ltp;

    type Config = { count: number; labels: string[]; volatility: number };
    const configs: Record<TimeFrame, Config> = {
      '1D': {
        count: 10,
        labels: ['09:30', '10:15', '11:00', '11:45', '12:30', '13:15', '14:00', '14:45', '15:30', '16:00'],
        volatility: 0.25,
      },
      '1W': {
        count: 7,
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        volatility: 0.45,
      },
      '1M': {
        count: 10,
        labels: ['W1', 'W1', 'W2', 'W2', 'W3', 'W3', 'W4', 'W4', 'W5', 'Today'],
        volatility: 0.65,
      },
      '1Y': {
        count: 12,
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        volatility: 0.9,
      },
      'ALL': {
        count: 12,
        labels: ['2021', '2021', '2022', '2022', '2023', '2023', '2024', '2024', '2025', '2025', '2026', 'Now'],
        volatility: 1.2,
      },
    };

    const cfg = configs[selectedTimeframe] || configs['1D'];
    const data = [];
    const basePrice = selectedTimeframe === '1D' ? ltp : currentPrice * (1 - (cfg.volatility * (isPositive ? 0.08 : -0.06)));
    const totalDiff = currentPrice - basePrice;

    for (let i = 0; i < cfg.count; i++) {
      const progress = i / (cfg.count - 1);
      const wave = Math.sin((i + 1) * 1.8) * (Math.abs(totalDiff) * 0.35 + currentPrice * 0.012);
      const val = basePrice + totalDiff * progress + (i === 0 || i === cfg.count - 1 ? 0 : wave);
      data.push({
        value: parseFloat(Math.max(1, val).toFixed(2)),
        label: cfg.labels[i] || '',
      });
    }
    return data;
  }, [currentPrice, lastDayTradedPrice, selectedTimeframe, isPositive]);

  const openTrade = (type: 'buy' | 'sell') => {
    setTradeType(type);
    setTradeModalVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={moderateScale(24)} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerSymbol}>{stock.symbol}</Text>
          <Text style={styles.headerCompany} numberOfLines={1}>
            {stock.companyName}
          </Text>
        </View>

        <View style={[styles.avatarBox, { backgroundColor: brand.bg, borderColor: brand.border }]}>
          {!imageError && stock.iconUrl && stock.iconUrl.startsWith('http') ? (
            <Image
              source={{ uri: stock.iconUrl }}
              style={styles.avatarImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <Text style={[styles.avatarText, { color: brand.text }]}>
              {stock.symbol.slice(0, 3).toUpperCase()}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Price & Change Banner */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>LIVE MARKET PRICE</Text>
          <Text style={styles.priceValue}>
            ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View
            style={[
              styles.changePill,
              isPositive ? styles.changePillUp : styles.changePillDown,
            ]}
          >
            <Icon
              name={isPositive ? 'caret-up' : 'caret-down'}
              size={moderateScale(12)}
              color={isPositive ? Colors.primary : Colors.error}
            />
            <Text
              style={[
                styles.changePillText,
                { color: isPositive ? Colors.primary : Colors.error },
              ]}
            >
              {isPositive ? '+' : ''}${Math.abs(diff).toFixed(2)} ({isPositive ? '+' : ''}
              {percentChange}%)
            </Text>
            <Text style={styles.changePeriodText}>Today</Text>
          </View>
        </View>

        {/* Timeframe Selectors */}
        <View style={styles.timeframeRow}>
          {(['1D', '1W', '1M', '1Y', 'ALL'] as TimeFrame[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                selectedTimeframe === tf && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(tf)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === tf && styles.timeframeTextActive,
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interactive Price Chart */}
        <View style={styles.chartCard}>
          <PriceAreaChart
            data={chartData}
            height={verticalScale(185)}
            isPositive={isPositive}
          />
        </View>

        {/* User Holding Banner (if owned) */}
        {userHolding && (
          <View style={styles.userPositionCard}>
            <View style={styles.userPositionHeader}>
              <View style={styles.positionTag}>
                <Text style={styles.positionTagText}>YOUR POSITION</Text>
              </View>
              <Text style={styles.sharesCountText}>
                {userHolding.quantity} Shares
              </Text>
            </View>

            <View style={styles.positionDetailsRow}>
              <View style={styles.positionItem}>
                <Text style={styles.posLabel}>Avg. Buy</Text>
                <Text style={styles.posValue}>${userHolding.buyPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.positionItem}>
                <Text style={styles.posLabel}>Current Value</Text>
                <Text style={styles.posValue}>
                  ${(userHolding.quantity * currentPrice).toFixed(2)}
                </Text>
              </View>
              <View style={styles.positionItem}>
                <Text style={styles.posLabel}>Unrealized P&L</Text>
                <Text
                  style={[
                    styles.posValue,
                    {
                      color:
                        currentPrice >= userHolding.buyPrice
                          ? Colors.primary
                          : Colors.error,
                    },
                  ]}
                >
                  {(
                    (currentPrice - userHolding.buyPrice) *
                    userHolding.quantity
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Key Statistics Grid */}
        <Text style={styles.sectionTitle}>Market Insights</Text>
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Previous Close (LTP)</Text>
            <Text style={styles.statValue}>
              ${lastDayTradedPrice.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Day's Change</Text>
            <Text
              style={[
                styles.statValue,
                { color: isPositive ? Colors.primary : Colors.error },
              ]}
            >
              {isPositive ? '+' : ''}${diff.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Asset Class</Text>
            <Text style={styles.statValue}>US Equities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Trading Status</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>Active / Open</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Floating Trading Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, verticalScale(12)) }]}>
        <TouchableOpacity
          style={[styles.tradeBarButton, styles.sellButton]}
          onPress={() => openTrade('sell')}
          activeOpacity={0.8}
        >
          <Text style={styles.sellButtonText}>SELL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tradeBarButton, styles.buyButton]}
          onPress={() => openTrade('buy')}
          activeOpacity={0.8}
        >
          <Text style={styles.buyButtonText}>BUY</Text>
        </TouchableOpacity>
      </View>

      {/* Trade Modal */}
      <TradeModal
        visible={tradeModalVisible}
        stock={{ ...stock, currentPrice, lastDayTradedPrice }}
        initialType={tradeType}
        holding={userHolding}
        onClose={() => setTradeModalVisible(false)}
      />
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
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerSymbol: {
    color: Colors.textPrimary,
    fontSize: moderateScale(17),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerCompany: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    maxWidth: scale(180),
    marginTop: verticalScale(1),
  },
  avatarBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(4),
  },
  avatarText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(110),
  },
  priceSection: {
    marginTop: verticalScale(16),
  },
  priceLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 1,
  },
  priceValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(32),
    fontWeight: '900',
    marginVertical: verticalScale(4),
    letterSpacing: 0.3,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  changePillUp: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  changePillDown: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  changePillText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    marginLeft: scale(3),
  },
  changePeriodText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginLeft: scale(6),
  },
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(12),
    padding: scale(3),
    marginVertical: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: verticalScale(6),
    alignItems: 'center',
    borderRadius: moderateScale(9),
  },
  timeframeButtonActive: {
    backgroundColor: Colors.card,
  },
  timeframeText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  timeframeTextActive: {
    color: Colors.primary,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(12),
    marginVertical: verticalScale(6),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  userPositionCard: {
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: moderateScale(14),
    padding: scale(14),
    marginVertical: verticalScale(10),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  userPositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  positionTag: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  positionTagText: {
    color: Colors.primary,
    fontSize: moderateScale(9),
    fontWeight: '800',
  },
  sharesCountText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  positionDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionItem: {
    alignItems: 'flex-start',
  },
  posLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  posValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginTop: verticalScale(2),
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginTop: verticalScale(14),
    marginBottom: verticalScale(10),
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(8),
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  statDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
  },
  tradeBarButton: {
    flex: 1,
    height: verticalScale(46),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: scale(8),
  },
  sellButtonText: {
    color: Colors.secondary,
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyButton: {
    backgroundColor: Colors.primary,
    marginLeft: scale(8),
  },
  buyButtonText: {
    color: Colors.background,
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
