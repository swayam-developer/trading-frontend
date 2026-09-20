import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Order } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const isBuy = order.type === 'buy';
  const totalAmount = order.quantity * order.price;

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

  return (
    <View style={styles.card}>
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
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>EXECUTED</Text>
          </View>
        </View>

        <Text style={styles.totalAmountText}>
          {isBuy ? '-' : '+'}${totalAmount.toFixed(2)}
        </Text>
      </View>

      {/* Middle Row: Stock Symbol & Execution Details */}
      <View style={styles.middleRow}>
        <View>
          <Text style={styles.symbolText}>{order.stock?.symbol || 'STOCK'}</Text>
          <Text style={styles.companyText} numberOfLines={1}>
            {order.stock?.companyName || 'Security'}
          </Text>
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

        {order.remainingBalance !== undefined && (
          <Text style={styles.balanceText}>
            Bal: ${order.remainingBalance.toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(14),
    padding: scale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
    marginLeft: scale(8),
  },
  statusPillText: {
    color: Colors.textMuted,
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  totalAmountText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  symbolText: {
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '700',
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
    fontWeight: '700',
  },
  unitPriceText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
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
  balanceText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
});
