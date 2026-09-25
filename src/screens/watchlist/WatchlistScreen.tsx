import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { useStockStore } from '../../store/stock/stockStore';
import { Stock } from '../../services/stock/stock.types';
import { StockCard } from './components/StockCard';
import { MarketIndicesStrip } from './components/MarketIndicesStrip';
import { RootNavigationProp } from '../../navigation/types';
import { socketService } from '../../services/socket/socket.service';
import { WatchlistSkeleton } from '../../components/common/SkeletonLoader';
import { marketAlertService } from '../../services/marketAlert/marketAlert.service';

type CategoryFilter = 'all' | 'gainers' | 'losers' | 'tech' | 'finance';
type SortOption = 'default' | 'change_desc' | 'change_asc' | 'price_desc' | 'price_asc' | 'symbol_asc';

const TECH_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX'];
const FINANCE_SYMBOLS = ['JPM', 'V', 'WMT', 'PG', 'HD', 'DIS', 'JNJ'];

export const WatchlistScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigationProp<'MainTabs'>>();

  // Fine-grained selectors to avoid re-renders when unrelated store data changes
  const stocks = useStockStore((s) => s.stocks);
  const isLoadingStocks = useStockStore((s) => s.isLoadingStocks);
  const fetchStocks = useStockStore((s) => s.fetchStocks);
  const setSelectedStock = useStockStore((s) => s.setSelectedStock);
  const initSocket = useStockStore((s) => s.initSocket);
  const marketStatus = useStockStore((s) => s.marketStatus);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('default');
  const [pillMode, setPillMode] = useState<'percent' | 'dollar'>('percent');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initSocket();

    const load = async () => {
      const data = await fetchStocks();
      if (data && data.length > 0) {
        socketService.subscribeToMultipleStocks(data.map((s) => s.symbol));
      }
    };
    load();
  }, [fetchStocks, initSocket]);

  useEffect(() => {
    if (stocks.length > 0) {
      socketService.subscribeToMultipleStocks(stocks.map((s) => s.symbol));
    }
  }, [stocks.length]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const data = await fetchStocks();
    if (data && data.length > 0) {
      socketService.subscribeToMultipleStocks(data.map((s) => s.symbol));
    }
    setIsRefreshing(false);
  }, [fetchStocks]);

  const handleStockPress = useCallback(
    (stock: Stock) => {
      setSelectedStock(stock);
      navigation.navigate('StockDetail', { stock });
    },
    [setSelectedStock, navigation]
  );

  const handleTogglePillMode = useCallback(() => {
    setPillMode((prev) => (prev === 'percent' ? 'dollar' : 'percent'));
  }, []);

  // Filter and sort stocks
  const processedStocks = useMemo(() => {
    let result = stocks.filter((stock) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        stock.symbol.toLowerCase().includes(q) ||
        stock.companyName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const diff = stock.currentPrice - stock.lastDayTradedPrice;
      if (activeCategory === 'gainers') return diff > 0;
      if (activeCategory === 'losers') return diff < 0;
      if (activeCategory === 'tech') return TECH_SYMBOLS.includes(stock.symbol.toUpperCase());
      if (activeCategory === 'finance') return FINANCE_SYMBOLS.includes(stock.symbol.toUpperCase());

      return true;
    });

    // Apply sorting
    if (activeSort === 'change_desc') {
      result = [...result].sort((a, b) => {
        const pA = a.lastDayTradedPrice > 0 ? (a.currentPrice - a.lastDayTradedPrice) / a.lastDayTradedPrice : 0;
        const pB = b.lastDayTradedPrice > 0 ? (b.currentPrice - b.lastDayTradedPrice) / b.lastDayTradedPrice : 0;
        return pB - pA;
      });
    } else if (activeSort === 'change_asc') {
      result = [...result].sort((a, b) => {
        const pA = a.lastDayTradedPrice > 0 ? (a.currentPrice - a.lastDayTradedPrice) / a.lastDayTradedPrice : 0;
        const pB = b.lastDayTradedPrice > 0 ? (b.currentPrice - b.lastDayTradedPrice) / b.lastDayTradedPrice : 0;
        return pA - pB;
      });
    } else if (activeSort === 'price_desc') {
      result = [...result].sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (activeSort === 'price_asc') {
      result = [...result].sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (activeSort === 'symbol_asc') {
      result = [...result].sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return result;
  }, [stocks, searchQuery, activeCategory, activeSort]);

  const isLive = !!marketStatus?.isOpen;
  const statusLabel = isLive ? 'NYSE OPEN' : 'CLOSED';

  const renderStockItem = useCallback(
    ({ item }: { item: Stock }) => (
      <StockCard
        stock={item}
        onPress={() => handleStockPress(item)}
        pillDisplayMode={pillMode}
        onTogglePillMode={handleTogglePillMode}
      />
    ),
    [handleStockPress, pillMode, handleTogglePillMode]
  );

  const keyExtractorStock = useCallback((item: Stock) => item._id || item.symbol, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* 1. Ultra-Clean Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.titleGroup}>
          <Text style={styles.screenTitle}>Watchlist</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{stocks.length}</Text>
          </View>
        </View>

        <View style={styles.topBarActions}>
          {/* Search Toggle Icon */}
          <TouchableOpacity
            style={[styles.iconButton, (isSearchOpen || searchQuery.length > 0) && styles.iconButtonActive]}
            onPress={() => setIsSearchOpen((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon
              name={isSearchOpen || searchQuery.length > 0 ? 'search' : 'search-outline'}
              size={moderateScale(18)}
              color={isSearchOpen || searchQuery.length > 0 ? Colors.primary : Colors.textPrimary}
            />
          </TouchableOpacity>

          {/* Sort Menu Button */}
          <TouchableOpacity
            style={[styles.iconButton, activeSort !== 'default' && styles.iconButtonActive]}
            onPress={() => setIsSortModalVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon
              name="swap-vertical"
              size={moderateScale(18)}
              color={activeSort !== 'default' ? Colors.primary : Colors.textPrimary}
            />
          </TouchableOpacity>

          {/* Market Status Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (marketStatus) {
                marketAlertService.showMarketAlert(marketStatus, true);
              }
            }}
            style={[
              styles.marketPill,
              !isLive && styles.marketPillClosed,
            ]}
          >
            <View
              style={[
                styles.marketDot,
                !isLive && styles.marketDotClosed,
              ]}
            />
            <Text
              style={[
                styles.marketPillText,
                !isLive && styles.marketPillTextClosed,
              ]}
            >
              {statusLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Micro Market Indices Strip */}
      <MarketIndicesStrip />

      {/* 3. Search Bar (Visible when toggled or search active) */}
      {(isSearchOpen || searchQuery.length > 0) && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search-outline" size={moderateScale(16)} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ticker, company name..."
              placeholderTextColor={Colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={isSearchOpen && searchQuery.length === 0}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close-circle" size={moderateScale(16)} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 4. Horizontal Category Filter Chips */}
      <View style={styles.filterStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'all' && styles.filterChipActive]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeCategory === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'gainers' && styles.filterChipActive]}
            onPress={() => setActiveCategory('gainers')}
            activeOpacity={0.7}
          >
            <Icon
              name="trending-up"
              size={moderateScale(12)}
              color={activeCategory === 'gainers' ? Colors.primary : Colors.textMuted}
              style={{ marginRight: scale(4) }}
            />
            <Text style={[styles.filterChipText, activeCategory === 'gainers' && styles.filterChipTextActive]}>
              Gainers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'losers' && styles.filterChipActive]}
            onPress={() => setActiveCategory('losers')}
            activeOpacity={0.7}
          >
            <Icon
              name="trending-down"
              size={moderateScale(12)}
              color={activeCategory === 'losers' ? Colors.error : Colors.textMuted}
              style={{ marginRight: scale(4) }}
            />
            <Text style={[styles.filterChipText, activeCategory === 'losers' && styles.filterChipTextActive]}>
              Losers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'tech' && styles.filterChipActive]}
            onPress={() => setActiveCategory('tech')}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiIcon}>💻</Text>
            <Text style={[styles.filterChipText, activeCategory === 'tech' && styles.filterChipTextActive]}>
              Tech
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'finance' && styles.filterChipActive]}
            onPress={() => setActiveCategory('finance')}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiIcon}>🏦</Text>
            <Text style={[styles.filterChipText, activeCategory === 'finance' && styles.filterChipTextActive]}>
              Finance
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Global Pill Toggle (% vs $) */}
        <TouchableOpacity
          style={styles.pillModeButton}
          onPress={() => setPillMode((prev) => (prev === 'percent' ? 'dollar' : 'percent'))}
          activeOpacity={0.7}
        >
          <Text style={styles.pillModeText}>
            {pillMode === 'percent' ? '%' : '$'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Stock List / Skeleton / Empty State */}
      {isLoadingStocks && stocks.length === 0 ? (
        <WatchlistSkeleton />
      ) : (
        <FlatList
          data={processedStocks}
          keyExtractor={keyExtractorStock}
          renderItem={renderStockItem}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="search-outline" size={moderateScale(28)} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Securities Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No stocks match "${searchQuery}".`
                  : 'No securities available in this category.'}
              </Text>
              {(searchQuery.length > 0 || activeCategory !== 'all' || activeSort !== 'default') && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                    setActiveCategory('all');
                    setActiveSort('default');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetButtonText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* 6. Sort Selection Modal Bottom Sheet */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSortModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sort By</Text>

            {[
              { key: 'default', label: 'Default Order', icon: 'reorder-two' },
              { key: 'change_desc', label: 'Top Gainers (% High to Low)', icon: 'trending-up' },
              { key: 'change_asc', label: 'Top Losers (% Low to High)', icon: 'trending-down' },
              { key: 'price_desc', label: 'Highest Price ($ High to Low)', icon: 'cash-outline' },
              { key: 'price_asc', label: 'Lowest Price ($ Low to High)', icon: 'wallet-outline' },
              { key: 'symbol_asc', label: 'Symbol (A to Z)', icon: 'text-outline' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortOptionRow,
                  activeSort === opt.key && styles.sortOptionRowActive,
                ]}
                onPress={() => {
                  setActiveSort(opt.key as SortOption);
                  setIsSortModalVisible(false);
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
    paddingBottom: verticalScale(6),
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
  badgeCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1.5),
    borderRadius: moderateScale(10),
    marginLeft: scale(8),
  },
  badgeCountText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontWeight: '800',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
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
  marketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  marketPillClosed: {
    backgroundColor: 'rgba(255, 171, 0, 0.1)',
    borderColor: 'rgba(255, 171, 0, 0.25)',
  },
  marketDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: Colors.primary,
    marginRight: scale(5),
  },
  marketDotClosed: {
    backgroundColor: '#FFAB00',
  },
  marketPillText: {
    color: Colors.primary,
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  marketPillTextClosed: {
    color: '#FFAB00',
  },
  searchContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(4),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(10),
    height: verticalScale(36),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: moderateScale(12.5),
    marginLeft: scale(8),
    paddingVertical: 0,
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(6),
  },
  filterScroll: {
    gap: scale(6),
    paddingRight: scale(10),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4.5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: Colors.primary,
  },
  emojiIcon: {
    fontSize: moderateScale(10),
    marginRight: scale(3),
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
  pillModeButton: {
    width: scale(28),
    height: scale(26),
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: moderateScale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginLeft: scale(6),
  },
  pillModeText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(100),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(40),
    paddingHorizontal: scale(30),
  },
  emptyIconCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(11.5),
    marginTop: verticalScale(3),
    textAlign: 'center',
  },
  resetButton: {
    marginTop: verticalScale(14),
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  resetButtonText: {
    color: Colors.primary,
    fontSize: moderateScale(11.5),
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
