import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Order } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';
import { StockAvatar } from '../../../components/common/StockAvatar';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const isBuy = order.type === 'buy';
  const totalAmount = order.quantity * order.price;
  const isAMO = order.status === 'PENDING_AMO' || (order as any).isAMO;
  const isCancelled = order.status === 'CANCELLED';

  // Format date
  const formattedDate = React.useMemo(() => {
    try {
      const raw = order.timestamp || (order as any).createdAt;
      if (!raw) return 'Recent';
      const date = new Date(raw);
      if (isNaN(date.getTime())) return 'Recent';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  }, [order.timestamp, (order as any).createdAt]);

  const symbol = order.stock?.symbol || 'STOCK';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.typeBadgeContainer}>
          <View
            style={[
              styles.typeBadge,
              isBuy ? styles.buyBadge : styles.sellBadge,
            ]}
          >
            <Icon
              name={isBuy ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={moderateScale(12)}
              color={isBuy ? Colors.primary : Colors.secondary}
              style={{ marginRight: scale(4) }}
            />
            <Text
              style={[
                styles.typeBadgeText,
                { color: isBuy ? Colors.primary : Colors.secondary },
              ]}
            >
              {order.type.toUpperCase()}
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              isAMO
                ? styles.statusAmo
                : isCancelled
                ? styles.statusCancelled
                : styles.statusExecuted,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isAMO
                  ? { color: '#FFD700' }
                  : isCancelled
                  ? { color: Colors.error }
                  : { color: Colors.primary },
              ]}
            >
              {isAMO
                ? 'AMO QUEUED'
                : isCancelled
                ? 'CANCELLED'
                : 'EXECUTED'}
            </Text>
          </View>
        </View>

        <Text style={styles.totalAmountText}>
          {isBuy ? '-' : '+'}${totalAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      {/* Middle Row: Stock Symbol & Execution Details */}
      <View style={styles.middleRow}>
        <View style={styles.stockIdentityRow}>
          <StockAvatar
            symbol={symbol}
            iconUrl={order.stock?.iconUrl}
            size={scale(38)}
            borderRadius={scale(11)}
            style={styles.avatarSpacing}
          />
          <View style={styles.symbolTextContainer}>
            <Text style={styles.symbolText}>{symbol}</Text>
            <Text style={styles.companyText} numberOfLines={1}>
              {order.stock?.companyName || 'Security'}
            </Text>
          </View>
        </View>

        <View style={styles.executionContainer}>
          <Text style={styles.sharesText}>
            {order.quantity} {order.quantity === 1 ? 'Share' : 'Shares'}
          </Text>
          <Text style={styles.unitPriceText}>
            @ ${order.price ? order.price.toFixed(2) : '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom Row: Timestamp & Remaining Balance */}
      <View style={styles.bottomRow}>
        <View style={styles.timeContainer}>
          <Icon name="time-outline" size={moderateScale(12)} color={Colors.textMuted} />
          <Text style={styles.timeText}>{formattedDate}</Text>
        </View>

        <View style={styles.bottomRight}>
          {order.remainingBalance !== undefined && (
            <Text style={styles.balanceText}>
              Bal: ${order.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          )}
          <Icon
            name="chevron-forward"
            size={moderateScale(12)}
            color={Colors.textMuted}
            style={{ marginLeft: scale(4) }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const OrderCard = React.memo<OrderCardProps>(
  OrderCardComponent,
  (prev, next) => {
    return (
      prev.order._id === next.order._id &&
      prev.order.status === next.order.status &&
      prev.order.price === next.order.price &&
      prev.order.quantity === next.order.quantity &&
      prev.order.type === next.order.type &&
      prev.order.remainingBalance === next.order.remainingBalance &&
      prev.order.timestamp === next.order.timestamp
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  buyBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  sellBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
  },
  typeBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
    marginLeft: scale(8),
  },
  statusExecuted: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  statusAmo: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  statusPillText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  totalAmountText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  stockIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: scale(10),
  },
  avatarSpacing: {
    marginRight: scale(10),
  },
  symbolTextContainer: {
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
  executionContainer: {
    alignItems: 'flex-end',
  },
  sharesText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  unitPriceText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: verticalScale(10),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginLeft: scale(4),
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
