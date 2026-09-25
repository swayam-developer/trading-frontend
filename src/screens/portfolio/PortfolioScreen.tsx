import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
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
import { getSocketAccessToken, setSocketTokens } from '../../services/apiClient';
import { PortfolioSkeleton } from '../../components/common/SkeletonLoader';

const PIE_COLORS = ['#00E676', '#00E5FF', '#FFD700', '#FF5252', '#9C27B0', '#FF9800', '#00B0FF'];

type HoldingFilter = 'all' | 'profit' | 'loss';
type HoldingSort = 'value_desc' | 'pnl_desc' | 'pnl_asc' | 'shares_desc' | 'symbol_asc';

export const PortfolioScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp<'Portfolio'>>();

  // Fine-grained selectors for optimal re-render performance
  const holdings = useStockStore((s) => s.holdings);
  const isLoadingHoldings = useStockStore((s) => s.isLoadingHoldings);
  const fetchHoldings = useStockStore((s) => s.fetchHoldings);
  const fetchStocks = useStockStore((s) => s.fetchStocks);
  const setSelectedStock = useStockStore((s) => s.setSelectedStock);

  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [holdingSearch, setHoldingSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<HoldingFilter>('all');
  const [activeSort, setActiveSort] = useState<HoldingSort>('value_desc');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [showAllocationChart, setShowAllocationChart] = useState(true);
  const [pillMode, setPillMode] = useState<'dollar' | 'percent'>('dollar');

  useEffect(() => {
    const socketToken = getSocketAccessToken() || useAuthStore.getState().socketTokens?.socket_access_token;
    if (socketToken) {
      if (!getSocketAccessToken()) {
        const sTokens = useAuthStore.getState().socketTokens;
        if (sTokens) setSocketTokens(sTokens.socket_access_token, sTokens.socket_refresh_token);
      }
      fetchHoldings();
      fetchStocks();
      fetchProfile();
    } else if (!useAuthStore.getState().isAuthenticated) {
      navigation.getParent<any>()?.replace('VerifyPin');
    } else {
      fetchHoldings();
      fetchStocks();
      fetchProfile();
    }
  }, [fetchHoldings, fetchStocks, fetchProfile, navigation]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchHoldings(), fetchStocks(), fetchProfile()]);
    setIsRefreshing(false);
  }, [fetchHoldings, fetchStocks, fetchProfile]);

  const handleTrade = useCallback(
    (holding: Holding) => {
      if (holding.stock) {
        setSelectedStock(holding.stock);
        navigation.navigate('StockDetail', { stock: holding.stock });
      }
    },
    [setSelectedStock, navigation]
  );

  const handleTogglePillMode = useCallback(() => {
    setPillMode((prev) => (prev === 'dollar' ? 'percent' : 'dollar'));
  }, []);

  const cashBalance = profile?.balance ? parseFloat(profile.balance) : 0;

  // Calculate Net Worth & P&L metrics
  const { totalCurrentValue, totalInvested, todayPnl, todayPnlPercent } = useMemo(() => {
    let currentVal = 0;
    let investedVal = 0;
    let dayPnlVal = 0;
    let prevDayVal = 0;

    holdings.forEach((h) => {
      const price = h.stock?.currentPrice || h.buyPrice;
      const ltp = h.stock?.lastDayTradedPrice || price;
      currentVal += h.quantity * price;
      investedVal += h.quantity * h.buyPrice;
      dayPnlVal += h.quantity * (price - ltp);
      prevDayVal += h.quantity * ltp;
    });

    const dayPct = prevDayVal > 0 ? ((dayPnlVal / prevDayVal) * 100).toFixed(2) : '0.00';

    return {
      totalCurrentValue: currentVal,
      totalInvested: investedVal,
      todayPnl: dayPnlVal,
      todayPnlPercent: dayPct,
    };
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

  // Filtered & Sorted Holdings
  const processedHoldings = useMemo(() => {
    let list = holdings.filter((h) => {
      const q = holdingSearch.toLowerCase().trim();
      const symbol = h.stock?.symbol?.toLowerCase() || '';
      const name = h.stock?.companyName?.toLowerCase() || '';
      if (q && !symbol.includes(q) && !name.includes(q)) return false;

      const price = h.stock?.currentPrice || h.buyPrice;
      const pnl = h.quantity * (price - h.buyPrice);

      if (activeFilter === 'profit') return pnl > 0;
      if (activeFilter === 'loss') return pnl < 0;
      return true;
    });

    if (activeSort === 'value_desc') {
      list = [...list].sort((a, b) => {
        const valA = a.quantity * (a.stock?.currentPrice || a.buyPrice);
        const valB = b.quantity * (b.stock?.currentPrice || b.buyPrice);
        return valB - valA;
      });
    } else if (activeSort === 'pnl_desc') {
      list = [...list].sort((a, b) => {
        const pnlA = a.quantity * ((a.stock?.currentPrice || a.buyPrice) - a.buyPrice);
        const pnlB = b.quantity * ((b.stock?.currentPrice || b.buyPrice) - b.buyPrice);
        return pnlB - pnlA;
      });
    } else if (activeSort === 'pnl_asc') {
      list = [...list].sort((a, b) => {
        const pnlA = a.quantity * ((a.stock?.currentPrice || a.buyPrice) - a.buyPrice);
        const pnlB = b.quantity * ((b.stock?.currentPrice || b.buyPrice) - b.buyPrice);
        return pnlA - pnlB;
      });
    } else if (activeSort === 'shares_desc') {
      list = [...list].sort((a, b) => b.quantity - a.quantity);
    } else if (activeSort === 'symbol_asc') {
      list = [...list].sort((a, b) => (a.stock?.symbol || '').localeCompare(b.stock?.symbol || ''));
    }

    return list;
  }, [holdings, holdingSearch, activeFilter, activeSort]);

  const profitCount = useMemo(
    () => holdings.filter((h) => (h.stock?.currentPrice || h.buyPrice) >= h.buyPrice).length,
    [holdings]
  );
  const lossCount = useMemo(
    () => holdings.filter((h) => (h.stock?.currentPrice || h.buyPrice) < h.buyPrice).length,
    [holdings]
  );

  const renderHoldingItem = useCallback(
    ({ item }: { item: Holding }) => (
      <HoldingCard
        holding={item}
        onTrade={() => handleTrade(item)}
        pillDisplayMode={pillMode}
        onTogglePillMode={handleTogglePillMode}
      />
    ),
    [handleTrade, pillMode, handleTogglePillMode]
  );

  const keyExtractorHolding = useCallback((item: Holding) => item._id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Screen Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.titleGroup}>
          <Text style={styles.screenTitle}>Portfolio</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{holdings.length}</Text>
          </View>
        </View>

        <View style={styles.topBarActions}>
          {/* Allocation Chart Toggle */}
          {holdings.length > 0 && (
            <TouchableOpacity
              style={[styles.iconButton, showAllocationChart && styles.iconButtonActive]}
              onPress={() => setShowAllocationChart((prev) => !prev)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon
                name={showAllocationChart ? 'pie-chart' : 'pie-chart-outline'}
                size={moderateScale(17)}
                color={showAllocationChart ? Colors.primary : Colors.textPrimary}
              />
            </TouchableOpacity>
          )}

          {/* Orders History Shortcut */}
          <TouchableOpacity
            style={styles.ordersButton}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.7}
          >
            <Icon name="receipt-outline" size={moderateScale(14)} color={Colors.textPrimary} />
            <Text style={styles.ordersButtonText}>Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
      {isLoadingHoldings && holdings.length === 0 ? (
        <PortfolioSkeleton />
      ) : (
        <FlatList
          data={processedHoldings}
          keyExtractor={keyExtractorHolding}
          renderItem={renderHoldingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          windowSize={7}
          initialNumToRender={8}
          updateCellsBatchingPeriod={50}
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
              {/* Summary Net Worth Dashboard Card */}
              <PortfolioSummaryCard
                totalCurrentValue={totalCurrentValue}
                totalInvested={totalInvested}
                cashBalance={cashBalance}
                todayPnl={todayPnl}
                todayPnlPercent={todayPnlPercent}
                onOrdersPress={() => navigation.navigate('Orders')}
              />

              {/* Asset Allocation Donut Chart */}
              {showAllocationChart && holdings.length > 0 && allocationSlices.length > 0 && (
                <AssetAllocationChart
                  slices={allocationSlices}
                  totalValue={totalCurrentValue}
                />
              )}

              {/* Holdings Section Controls Header */}
              {holdings.length > 0 && (
                <View style={styles.holdingsHeaderSection}>
                  <View style={styles.holdingsHeaderTopRow}>
                    <Text style={styles.sectionTitle}>
                      Your Holdings ({processedHoldings.length})
                    </Text>

                    <View style={styles.headerRightActions}>
                      {/* Sort Button */}
                      <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => setIsSortModalOpen(true)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name="swap-vertical"
                          size={moderateScale(12)}
                          color={Colors.primary}
                          style={{ marginRight: scale(4) }}
                        />
                        <Text style={styles.sortButtonText}>Sort</Text>
                      </TouchableOpacity>

                      {/* Global Pill Toggle */}
                      <TouchableOpacity
                        style={styles.pillToggleBtn}
                        onPress={() => setPillMode((prev) => (prev === 'dollar' ? 'percent' : 'dollar'))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pillToggleBtnText}>
                          {pillMode === 'dollar' ? '$ P&L' : '% P&L'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Filter Chips Strip */}
                  <View style={styles.filterRow}>
                    <TouchableOpacity
                      style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
                      onPress={() => setActiveFilter('all')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
                        All ({holdings.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterChip, activeFilter === 'profit' && styles.filterChipActive]}
                      onPress={() => setActiveFilter('profit')}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="trending-up"
                        size={moderateScale(12)}
                        color={activeFilter === 'profit' ? Colors.primary : Colors.textMuted}
                        style={{ marginRight: scale(4) }}
                      />
                      <Text style={[styles.filterChipText, activeFilter === 'profit' && styles.filterChipTextActive]}>
                        In Profit ({profitCount})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterChip, activeFilter === 'loss' && styles.filterChipActive]}
                      onPress={() => setActiveFilter('loss')}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="trending-down"
                        size={moderateScale(12)}
                        color={activeFilter === 'loss' ? Colors.error : Colors.textMuted}
                        style={{ marginRight: scale(4) }}
                      />
                      <Text style={[styles.filterChipText, activeFilter === 'loss' && styles.filterChipTextActive]}>
                        In Loss ({lossCount})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="briefcase-outline" size={moderateScale(32)} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Holdings Yet</Text>
              <Text style={styles.emptySubtitle}>
                You have not purchased any shares yet. Explore live stocks and build your portfolio!
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Markets')}
                activeOpacity={0.8}
              >
                <Icon
                  name="trending-up"
                  size={moderateScale(15)}
                  color={Colors.background}
                  style={{ marginRight: scale(6) }}
                />
                <Text style={styles.exploreButtonText}>Explore Markets</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Sort Selection Bottom Sheet Modal */}
      <Modal
        visible={isSortModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSortModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sort Holdings</Text>

            {[
              { key: 'value_desc', label: 'Highest Valuation ($)', icon: 'cash-outline' },
              { key: 'pnl_desc', label: 'Top Gainers (Highest Profit)', icon: 'trending-up' },
              { key: 'pnl_asc', label: 'Top Losers (Lowest Profit)', icon: 'trending-down' },
              { key: 'shares_desc', label: 'Most Shares Owned', icon: 'layers-outline' },
              { key: 'symbol_asc', label: 'Symbol (A to Z)', icon: 'text-outline' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortOptionRow,
                  activeSort === opt.key && styles.sortOptionRowActive,
                ]}
                onPress={() => {
                  setActiveSort(opt.key as HoldingSort);
                  setIsSortModalOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sortOptionLeft}>
                  <Icon
                    name={opt.icon}
                    size={moderateScale(18)}
                    color={activeSort === opt.key ? Colors.primary : Colors.textMuted}
                    style={{ marginRight: scale(10) }}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      activeSort === opt.key && styles.sortOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </View>
                {activeSort === opt.key && (
                  <Icon name="checkmark-circle" size={moderateScale(18)} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(8),
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1.5),
    borderRadius: moderateScale(10),
    marginLeft: scale(8),
  },
  countBadgeText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontWeight: '800',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  iconButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  ordersButtonText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    marginLeft: scale(4),
  },
  listContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(100),
  },
  holdingsHeaderSection: {
    marginTop: verticalScale(6),
    marginBottom: verticalScale(10),
  },
  holdingsHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3.5),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sortButtonText: {
    color: Colors.primary,
    fontSize: moderateScale(10.5),
    fontWeight: '700',
  },
  pillToggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(3.5),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  pillToggleBtnText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: scale(6),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(45),
    paddingHorizontal: scale(20),
  },
  emptyIconCircle: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: verticalScale(14),
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '800',
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
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(10),
    marginTop: verticalScale(18),
  },
  exploreButtonText: {
    color: Colors.background,
    fontSize: moderateScale(12.5),
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: moderateScale(22),
    borderTopRightRadius: moderateScale(22),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(30),
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHandle: {
    width: scale(36),
    height: verticalScale(4),
    backgroundColor: Colors.cardBorder,
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(14),
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(17),
    fontWeight: '800',
    marginBottom: verticalScale(14),
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sortOptionRowActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(8),
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortOptionText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(13.5),
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
