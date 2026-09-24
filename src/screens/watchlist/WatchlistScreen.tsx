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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { useStockStore } from '../../store/stock/stockStore';
import { useAuthStore } from '../../store/auth/authStore';
import { Stock } from '../../services/stock/stock.types';
import { StockCard } from './components/StockCard';
import { RootNavigationProp } from '../../navigation/types';
import { getSocketAccessToken, setSocketTokens } from '../../services/apiClient';


import { socketService } from '../../services/socket/socket.service';

type FilterType = 'all' | 'gainers' | 'losers';

export const WatchlistScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigationProp<'MainTabs'>>();
  const {
    stocks,
    isLoadingStocks,
    fetchStocks,
    setSelectedStock,
    initSocket,
    isSocketConnected,
    marketStatus,
  } = useStockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 1. Initialize socket connection
    initSocket();

    // 2. Fetch initial stocks
    const load = async () => {
      const data = await fetchStocks();
      if (data && data.length > 0) {
        // 3. Subscribe to real-time updates for all stock symbols
        socketService.subscribeToMultipleStocks(data.map((s) => s.symbol));
      }
    };
    load();
  }, [fetchStocks, initSocket]);

  // Subscribe whenever stocks list updates
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

  const handleStockPress = (stock: Stock) => {
    setSelectedStock(stock);
    navigation.navigate('StockDetail', { stock });
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const diff = stock.currentPrice - stock.lastDayTradedPrice;
      if (activeFilter === 'gainers') return diff > 0;
      if (activeFilter === 'losers') return diff < 0;
      return true;
    });
  }, [stocks, searchQuery, activeFilter]);

  const gainersCount = useMemo(
    () => stocks.filter((s) => s.currentPrice >= s.lastDayTradedPrice).length,
    [stocks]
  );
  const losersCount = useMemo(
    () => stocks.filter((s) => s.currentPrice < s.lastDayTradedPrice).length,
    [stocks]
  );

  const isLive = !!marketStatus?.isOpen;
  const statusLabel = marketStatus?.message?.toUpperCase() || (isLive ? 'MARKETS OPEN' : 'MARKET CLOSED');


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>GLOBAL MARKETS</Text>
          <Text style={styles.headerTitle}>Watchlist</Text>
        </View>

        <View
          style={[
            styles.marketStatusBadge,
            !isLive && { backgroundColor: 'rgba(255, 171, 0, 0.1)', borderColor: 'rgba(255, 171, 0, 0.25)' },
          ]}
        >
          <View
            style={[
              styles.liveIndicator,
              !isLive && { backgroundColor: '#FFAB00', shadowColor: '#FFAB00' },
            ]}
          />
          <Text
            style={[
              styles.marketStatusText,
              !isLive && { color: '#FFAB00' },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>


      {/* Market Indices Ticker */}
      <View style={styles.tickerContainer}>
        <View style={styles.tickerItem}>
          <Text style={styles.tickerName}>NIFTY 50</Text>
          <Text style={styles.tickerValue}>25,320.10</Text>
          <Text style={styles.tickerGain}>+0.84%</Text>
        </View>
        <View style={styles.tickerDivider} />
        <View style={styles.tickerItem}>
          <Text style={styles.tickerName}>S&P 500</Text>
          <Text style={styles.tickerValue}>5,688.20</Text>
          <Text style={styles.tickerGain}>+0.42%</Text>
        </View>
        <View style={styles.tickerDivider} />
        <View style={styles.tickerItem}>
          <Text style={styles.tickerName}>NASDAQ</Text>
          <Text style={styles.tickerValue}>17,948.30</Text>
          <Text style={styles.tickerLoss}>-0.18%</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={moderateScale(18)} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search symbol, company..."
            placeholderTextColor={Colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close-circle" size={moderateScale(16)} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            All ({stocks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'gainers' && styles.filterChipActive]}
          onPress={() => setActiveFilter('gainers')}
          activeOpacity={0.7}
        >
          <Icon
            name="trending-up"
            size={moderateScale(13)}
            color={activeFilter === 'gainers' ? Colors.primary : Colors.textMuted}
            style={styles.chipIcon}
          />
          <Text style={[styles.filterText, activeFilter === 'gainers' && styles.filterTextActive]}>
            Gainers ({gainersCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'losers' && styles.filterChipActive]}
          onPress={() => setActiveFilter('losers')}
          activeOpacity={0.7}
        >
          <Icon
            name="trending-down"
            size={moderateScale(13)}
            color={activeFilter === 'losers' ? Colors.error : Colors.textMuted}
            style={styles.chipIcon}
          />
          <Text style={[styles.filterText, activeFilter === 'losers' && styles.filterTextActive]}>
            Losers ({losersCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stock List */}
      {isLoadingStocks && stocks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching live market data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStocks}
          keyExtractor={(item) => item._id || item.symbol}
          renderItem={({ item }) => (
            <StockCard stock={item} onPress={() => handleStockPress(item)} />
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-outline" size={moderateScale(48)} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No stocks found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No results match "${searchQuery}"`
                  : 'No securities available in this category.'}
              </Text>
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
  marketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  liveIndicator: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: Colors.primary,
    marginRight: scale(6),
  },
  marketStatusText: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tickerContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: scale(20),
    marginVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tickerItem: {
    flex: 1,
    alignItems: 'center',
  },
  tickerName: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  tickerValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(11),
    fontWeight: '700',
    marginTop: verticalScale(1),
  },
  tickerGain: {
    color: Colors.primary,
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  tickerLoss: {
    color: Colors.error,
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  tickerDivider: {
    width: 1,
    height: '70%',
    backgroundColor: Colors.cardBorder,
  },
  searchSection: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(6),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(40),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    marginLeft: scale(8),
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
    marginBottom: verticalScale(8),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: Colors.primary,
  },
  chipIcon: {
    marginRight: scale(4),
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '700',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(60),
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginTop: verticalScale(12),
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
    textAlign: 'center',
    paddingHorizontal: scale(30),
  },
});
