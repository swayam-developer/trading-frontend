import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetAllocationChart } from '../../components/common/AssetAllocationChart';
import { Colors } from '../../theme/colors';
import { useStockStore } from '../../store/stock/stockStore';
import { useAuthStore } from '../../store/auth/authStore';
import { Holding } from '../../services/stock/stock.types';
import { HoldingCard } from './components/HoldingCard';
import { PortfolioSummaryCard } from './components/PortfolioSummaryCard';
import { MainTabNavigationProp } from '../../navigation/types';
import { getSocketAccessToken } from '../../services/apiClient';

const PIE_COLORS = ['#00E676', '#00E5FF', '#FFD700', '#FF5252', '#9C27B0', '#FF9800', '#00B0FF'];

export const PortfolioScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp<'Portfolio'>>();
  const { holdings, isLoadingHoldings, fetchHoldings, fetchStocks, setSelectedStock } =
    useStockStore();
  const { profile, fetchProfile } = useAuthStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!getSocketAccessToken()) {
      navigation.getParent<any>()?.replace('VerifyPin');
      return;
    }
    fetchHoldings();
    fetchStocks();
    fetchProfile();
  }, [fetchHoldings, fetchStocks, fetchProfile, navigation]);

  const onRefresh = useCallback(async () => {
    if (!getSocketAccessToken()) {
      navigation.getParent<any>()?.replace('VerifyPin');
      return;
    }
    setIsRefreshing(true);
    await Promise.allSettled([fetchHoldings(), fetchStocks(), fetchProfile()]);
    setIsRefreshing(false);
  }, [fetchHoldings, fetchStocks, fetchProfile, navigation]);

  const handleTrade = (holding: Holding) => {
    if (holding.stock) {
      setSelectedStock(holding.stock);
      navigation.navigate('StockDetail', { stock: holding.stock });
    }
  };

  const cashBalance = profile?.balance ? parseFloat(profile.balance) : 0;

  const { totalCurrentValue, totalInvested } = useMemo(() => {
    let currentVal = 0;
    let investedVal = 0;

    holdings.forEach((h) => {
      const price = h.stock?.currentPrice || h.buyPrice;
      currentVal += h.quantity * price;
      investedVal += h.quantity * h.buyPrice;
    });

    return { totalCurrentValue: currentVal, totalInvested: investedVal };
  }, [holdings]);

  // Asset allocation slice data
  const allocationSlices = useMemo(() => {
    if (holdings.length === 0) return [];
    return holdings.map((h, idx) => ({
      value: h.quantity * (h.stock?.currentPrice || h.buyPrice),
      color: PIE_COLORS[idx % PIE_COLORS.length],
      symbol: h.stock?.symbol || `S${idx + 1}`,
      name: h.stock?.companyName,
    }));
  }, [holdings]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>INVESTMENTS</Text>
          <Text style={styles.headerTitle}>Portfolio</Text>
        </View>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.7}
        >
          <Icon name="receipt-outline" size={moderateScale(15)} color={Colors.textPrimary} />
          <Text style={styles.historyButtonText}>Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content List */}
      {isLoadingHoldings && holdings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading portfolio holdings...</Text>
        </View>
      ) : (
        <FlatList
          data={holdings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <HoldingCard holding={item} onTrade={() => handleTrade(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            <>
              {/* Summary Net Worth Card */}
              <PortfolioSummaryCard
                totalCurrentValue={totalCurrentValue}
                totalInvested={totalInvested}
                cashBalance={cashBalance}
              />

              {/* Asset Allocation Chart if multiple holdings */}
              {holdings.length > 0 && allocationSlices.length > 0 && (
                <AssetAllocationChart
                  slices={allocationSlices}
                  totalValue={totalCurrentValue}
                />
              )}

              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Your Holdings ({holdings.length})
                </Text>
                {holdings.length > 0 && (
                  <Text style={styles.sectionSubtitle}>Tap trade to buy/sell</Text>
                )}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="briefcase-outline" size={moderateScale(36)} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Holdings Yet</Text>
              <Text style={styles.emptySubtitle}>
                You have not purchased any stocks yet. Explore live stocks and start investing today!
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Markets')}
                activeOpacity={0.8}
              >
                <Icon name="trending-up" size={moderateScale(15)} color={Colors.background} style={{ marginRight: scale(6) }} />
                <Text style={styles.exploreButtonText}>Explore Markets</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyButtonText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: scale(4),
  },
  listContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(100),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: moderateScale(13),
    marginTop: verticalScale(12),
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(14),
    padding: scale(14),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chartTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginBottom: verticalScale(10),
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  chartCenterText: {
    color: Colors.primary,
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
  legendContainer: {
    flex: 1,
    marginLeft: scale(20),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(3),
  },
  legendDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(6),
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(6),
    marginBottom: verticalScale(10),
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(50),
    paddingHorizontal: scale(20),
  },
  emptyIconCircle: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: verticalScale(14),
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(17),
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    textAlign: 'center',
    marginTop: verticalScale(6),
    lineHeight: verticalScale(18),
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(18),
  },
  exploreButtonText: {
    color: Colors.background,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
});
