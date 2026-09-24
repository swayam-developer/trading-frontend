import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Order } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';
import { StockAvatar } from '../../../components/common/StockAvatar';

interface OrderReceiptModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onTradeAgain?: (symbol: string) => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  visible,
  order,
  onClose,
  onTradeAgain,
}) => {
  if (!order) return null;

  const isBuy = order.type === 'buy';
  const totalAmount = order.quantity * order.price;
  const isAMO = order.status === 'PENDING_AMO' || (order as any).isAMO;
  const isCancelled = order.status === 'CANCELLED';

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
        second: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  }, [order.timestamp, (order as any).createdAt]);

  const orderId = order._id || 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top Drag Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trade Confirmation</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={moderateScale(22)} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Status Hero Badge */}
            <View style={styles.statusHero}>
              <View
                style={[
                  styles.statusCircle,
                  isAMO
                    ? styles.statusCircleAMO
                    : isCancelled
                    ? styles.statusCircleCancelled
                    : styles.statusCircleExecuted,
                ]}
              >
                <Icon
                  name={
                    isAMO
                      ? 'time-outline'
                      : isCancelled
                      ? 'close-circle-outline'
                      : isBuy
                      ? 'arrow-down'
                      : 'arrow-up'
                  }
                  size={moderateScale(28)}
                  color={
                    isAMO ? '#FFD700' : isCancelled ? Colors.error : isBuy ? Colors.primary : Colors.secondary
                  }
                />
              </View>

              <Text style={styles.statusTitle}>
                {isAMO ? 'After-Market Order Queued' : isCancelled ? 'Order Cancelled' : 'Order Executed'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isAMO
                  ? 'Your order is pending market open at 9:30 AM EST'
                  : `Successfully ${isBuy ? 'purchased' : 'sold'} on TradeVault`}
              </Text>
            </View>

            {/* Total Settlement Amount Card */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>TOTAL SETTLEMENT VALUE</Text>
              <Text style={styles.amountValue}>
                {isBuy ? '-' : '+'}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Security Identity Row */}
            <View style={styles.securityRow}>
              <StockAvatar
                symbol={order.stock?.symbol}
                iconUrl={order.stock?.iconUrl}
                size={scale(44)}
                borderRadius={scale(12)}
                style={{ marginRight: scale(12) }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.symbolText}>{order.stock?.symbol || 'STOCK'}</Text>
                <Text style={styles.companyText} numberOfLines={1}>
                  {order.stock?.companyName || 'Security'}
                </Text>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  isBuy ? styles.typeBadgeBuy : styles.typeBadgeSell,
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: isBuy ? Colors.primary : Colors.secondary },
                  ]}
                >
                  {order.type.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Detailed Transaction Breakdown Table */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shares Quantity</Text>
                <Text style={styles.detailValue}>{order.quantity} Shares</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Execution Price</Text>
                <Text style={styles.detailValue}>${order.price?.toFixed(2)} / Share</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brokerage & Fees</Text>
                <Text style={[styles.detailValue, { color: Colors.primary }]}>$0.00 (Zero Fee)</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Execution Timestamp</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>

              {order.remainingBalance !== undefined && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Settlement Balance</Text>
                    <Text style={[styles.detailValue, { color: Colors.secondary }]}>
                      ${order.remainingBalance.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValueCode}>{orderId.slice(0, 16)}</Text>
              </View>
            </View>

            {/* Close / Action Button */}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(30),
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
  },
  handleBar: {
    width: scale(36),
    height: verticalScale(4),
    backgroundColor: Colors.cardBorder,
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(14),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  content: {
    paddingBottom: verticalScale(20),
  },
  statusHero: {
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  statusCircle: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
  },
  statusCircleExecuted: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  statusCircleAMO: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  statusCircleCancelled: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  statusTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(17),
    fontWeight: '800',
  },
  statusSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(11.5),
    marginTop: verticalScale(3),
    textAlign: 'center',
  },
  amountCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(12),
    padding: scale(14),
    alignItems: 'center',
    marginVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  amountLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  amountValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(24),
    fontWeight: '900',
    marginTop: verticalScale(3),
    fontVariant: ['tabular-nums'],
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(12),
    padding: scale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
  typeBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  typeBadgeBuy: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  typeBadgeSell: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
  },
  typeBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(12),
    padding: scale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(11.5),
    fontWeight: '500',
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  detailValueCode: {
    color: Colors.textSecondary,
    fontSize: moderateScale(11),
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: verticalScale(6),
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(12),
    height: verticalScale(42),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
  },
  doneButtonText: {
    color: Colors.background,
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
});
