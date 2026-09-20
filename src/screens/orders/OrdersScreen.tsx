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
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { useStockStore } from '../../store/stock/stockStore';
import { OrderCard } from './components/OrderCard';
import { getSocketAccessToken } from '../../services/apiClient';

type OrderFilter = 'all' | 'buy' | 'sell';

export const OrdersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { orders, isLoadingOrders, error, fetchOrders } = useStockStore();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch orders whenever the user focuses/switches to this tab
  useFocusEffect(
    useCallback(() => {
      if (getSocketAccessToken()) {
        fetchOrders();
      }
    }, [fetchOrders])
  );

  const onRefresh = useCallback(async () => {
    if (!getSocketAccessToken()) {
      navigation.getParent<any>()?.replace('VerifyPin');
      return;
    }
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  }, [fetchOrders, navigation]);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.type === filter);
  }, [orders, filter]);

  const { buyCount, sellCount, totalVolume } = useMemo(() => {
    let buys = 0;
    let sells = 0;
    let volume = 0;

    orders.forEach((o) => {
      if (o.type === 'buy') buys++;
      if (o.type === 'sell') sells++;
      volume += o.quantity * o.price;
    });

    return { buyCount: buys, sellCount: sells, totalVolume: volume };
  }, [orders]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>EXECUTION HISTORY</Text>
          <Text style={styles.headerTitle}>Order Book</Text>
        </View>

        <View style={styles.orderCountBadge}>
          <Text style={styles.orderCountText}>{orders.length} Executed</Text>
        </View>
      </View>

      {/* Order Stats Overview */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>BUY TRADES</Text>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{buyCount}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>SELL TRADES</Text>
          <Text style={[styles.statValue, { color: Colors.secondary }]}>{sellCount}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TOTAL TURNOVER</Text>
          <Text style={styles.statValue}>${totalVolume.toFixed(2)}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'buy' && styles.filterChipActive]}
          onPress={() => setFilter('buy')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'buy' && styles.filterTextActive]}>
            Buys ({buyCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'sell' && styles.filterChipActive]}
          onPress={() => setFilter('sell')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'sell' && styles.filterTextActive]}>
            Sells ({sellCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order List */}
      {isLoadingOrders && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching order log...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <OrderCard order={item} />}
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
              {error ? (
                <>
                  <Icon name="alert-circle-outline" size={moderateScale(48)} color={Colors.error} />
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
                  <Icon name="receipt-outline" size={moderateScale(48)} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Orders Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    {filter === 'all'
                      ? 'Your executed buy and sell orders will be displayed here.'
                      : `No ${filter} orders found in your history.`}
                  </Text>
                </>
              )}
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
  orderCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  orderCountText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: scale(20),
    marginVertical: verticalScale(10),
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
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
    fontSize: moderateScale(14),
    fontWeight: '800',
    marginTop: verticalScale(3),
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.cardBorder,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    marginTop: verticalScale(6),
    marginBottom: verticalScale(10),
  },
  filterChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: scale(14),
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
    paddingTop: verticalScale(4),
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
