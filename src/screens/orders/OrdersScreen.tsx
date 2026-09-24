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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStockStore } from '../../store/stock/stockStore';
import { useAuthStore } from '../../store/auth/authStore';
import { OrderCard } from './components/OrderCard';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { Order } from '../../services/stock/stock.types';
import { Colors } from '../../theme/colors';
import { getSocketAccessToken, setSocketTokens } from '../../services/apiClient';
import { OrdersSkeleton } from '../../components/common/SkeletonLoader';
import { MainTabNavigationProp } from '../../navigation/types';

type OrderFilter = 'all' | 'executed' | 'pending_amo' | 'buy' | 'sell';

export const OrdersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp<'Orders'>>();
  const { orders, isLoadingOrders, error, fetchOrders } = useStockStore();

  const [filter, setFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch orders whenever user navigates to this tab
  useFocusEffect(
    useCallback(() => {
      const socketToken = getSocketAccessToken() || useAuthStore.getState().socketTokens?.socket_access_token;
      if (socketToken) {
        if (!getSocketAccessToken()) {
          const sTokens = useAuthStore.getState().socketTokens;
          if (sTokens) setSocketTokens(sTokens.socket_access_token, sTokens.socket_refresh_token);
        }
        fetchOrders();
      } else {
        fetchOrders();
      }
    }, [fetchOrders])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  }, [fetchOrders]);

  // Filter orders by search & category
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const symbol = order.stock?.symbol?.toLowerCase() || '';
      const name = order.stock?.companyName?.toLowerCase() || '';
      if (q && !symbol.includes(q) && !name.includes(q)) return false;

      const isAMO = order.status === 'PENDING_AMO' || (order as any).isAMO;
      const isExecuted = !order.status || order.status === 'EXECUTED';

      if (filter === 'buy') return order.type === 'buy';
      if (filter === 'sell') return order.type === 'sell';
      if (filter === 'pending_amo') return isAMO;
      if (filter === 'executed') return isExecuted;

      return true;
    });
  }, [orders, filter, searchQuery]);

  // Analytics
  const { buyCount, sellCount, amoCount, executedCount, totalVolume } = useMemo(() => {
    let buys = 0;
    let sells = 0;
    let amos = 0;
    let execs = 0;
    let volume = 0;

    orders.forEach((o) => {
      if (o.type === 'buy') buys++;
      if (o.type === 'sell') sells++;
      if (o.status === 'PENDING_AMO' || (o as any).isAMO) amos++;
      else execs++;
      volume += o.quantity * o.price;
    });

    return {
      buyCount: buys,
      sellCount: sells,
      amoCount: amos,
      executedCount: execs,
      totalVolume: volume,
    };
  }, [orders]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Screen Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.titleGroup}>
          <Text style={styles.screenTitle}>Orders</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{orders.length}</Text>
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
              size={moderateScale(17)}
              color={isSearchOpen || searchQuery.length > 0 ? Colors.primary : Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input (Expandable) */}
      {(isSearchOpen || searchQuery.length > 0) && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search-outline" size={moderateScale(16)} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ticker or company..."
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

      {/* Filter Tabs Strip */}
      <View style={styles.filterStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              All ({orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'executed' && styles.filterChipActive]}
            onPress={() => setFilter('executed')}
            activeOpacity={0.7}
          >
            <Icon
              name="checkmark-circle-outline"
              size={moderateScale(12)}
              color={filter === 'executed' ? Colors.primary : Colors.textMuted}
              style={{ marginRight: scale(4) }}
            />
            <Text style={[styles.filterChipText, filter === 'executed' && styles.filterChipTextActive]}>
              Executed ({executedCount})
            </Text>
          </TouchableOpacity>

          {amoCount > 0 && (
            <TouchableOpacity
              style={[styles.filterChip, filter === 'pending_amo' && styles.filterChipActiveAMO]}
              onPress={() => setFilter('pending_amo')}
              activeOpacity={0.7}
            >
              <Icon
                name="time-outline"
                size={moderateScale(12)}
                color={filter === 'pending_amo' ? '#FFD700' : Colors.textMuted}
                style={{ marginRight: scale(4) }}
              />
              <Text style={[styles.filterChipText, filter === 'pending_amo' && { color: '#FFD700', fontWeight: '800' }]}>
                Pending AMO ({amoCount})
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.filterChip, filter === 'buy' && styles.filterChipActive]}
            onPress={() => setFilter('buy')}
            activeOpacity={0.7}
          >
            <Icon
              name="arrow-down-circle"
              size={moderateScale(12)}
              color={filter === 'buy' ? Colors.primary : Colors.textMuted}
              style={{ marginRight: scale(4) }}
            />
            <Text style={[styles.filterChipText, filter === 'buy' && styles.filterChipTextActive]}>
              Buys ({buyCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'sell' && styles.filterChipActive]}
            onPress={() => setFilter('sell')}
            activeOpacity={0.7}
          >
            <Icon
              name="arrow-up-circle"
              size={moderateScale(12)}
              color={filter === 'sell' ? Colors.secondary : Colors.textMuted}
              style={{ marginRight: scale(4) }}
            />
            <Text style={[styles.filterChipText, filter === 'sell' && styles.filterChipTextActive]}>
              Sells ({sellCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Order List */}
      {isLoadingOrders && orders.length === 0 ? (
        <OrdersSkeleton />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => setSelectedOrder(item)} />
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
            orders.length > 0 ? (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>TURNOVER</Text>
                  <Text style={styles.statValue}>
                    ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>TRADES</Text>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>{orders.length}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>RATIO</Text>
                  <Text style={styles.statValue}>
                    {buyCount}B / {sellCount}S
                  </Text>
                </View>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {error ? (
                <>
                  <Icon name="alert-circle-outline" size={moderateScale(42)} color={Colors.error} />
                  <Text style={styles.emptyTitle}>Unable to Load Orders</Text>
                  <Text style={styles.emptySubtitle}>{error}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => fetchOrders()}
                    activeOpacity={0.7}
                  >
                    <Icon name="reload-outline" size={moderateScale(14)} color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.emptyIconCircle}>
                    <Icon name="receipt-outline" size={moderateScale(32)} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>No Orders Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? `No orders match "${searchQuery}".`
                      : filter === 'all'
                      ? 'Your executed and pending buy/sell trades will appear here.'
                      : `No ${filter} orders found in your history.`}
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
                    <Text style={styles.exploreButtonText}>Place First Trade</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
        />
      )}

      {/* Interactive Order Receipt Confirmation Modal */}
      <OrderReceiptModal
        visible={selectedOrder !== null}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
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
    paddingVertical: verticalScale(4),
  },
  filterScroll: {
    paddingHorizontal: scale(20),
    gap: scale(6),
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
  filterChipActiveAMO: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
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
  listContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(100),
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(9),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '800',
    marginTop: verticalScale(2),
    fontVariant: ['tabular-nums'],
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.cardBorder,
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    marginTop: verticalScale(14),
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  retryButtonText: {
    color: Colors.primary,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
});
