import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Stock, Holding } from '../../../services/stock/stock.types';
import { Colors } from '../../../theme/colors';
import { useStockStore } from '../../../store/stock/stockStore';
import { useAuthStore } from '../../../store/auth/authStore';
import { StockAvatar } from '../../../components/common/StockAvatar';

interface TradeModalProps {
  visible: boolean;
  stock: Stock;
  initialType?: 'buy' | 'sell';
  holding?: Holding | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  visible,
  stock,
  initialType = 'buy',
  holding,
  onClose,
  onSuccess,
}) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>(initialType);
  const [quantityStr, setQuantityStr] = useState('1');

  const { buyStock, sellStock, isTrading, marketStatus } = useStockStore();
  const { profile } = useAuthStore();

  const isMarketOpen = !!marketStatus?.isOpen;

  let currentPrice = typeof stock.currentPrice === 'number' ? stock.currentPrice : parseFloat(stock.currentPrice as any) || 0;
  if (currentPrice > 1000000) currentPrice = 175.43;

  const cashBalance = profile?.balance ? parseFloat(profile.balance) : 0;
  const sharesOwned = holding?.quantity || 0;
  const quantity = parseInt(quantityStr, 10) || 0;
  const totalCost = quantity * currentPrice;

  // Max calculations
  const maxBuyQuantity = currentPrice > 0 ? Math.floor(cashBalance / currentPrice) : 0;
  const maxSellQuantity = sharesOwned;

  const canExecute = useMemo(() => {
    if (quantity <= 0) return false;
    if (tradeType === 'buy') {
      return totalCost <= cashBalance;
    } else {
      return holding !== null && quantity <= sharesOwned;
    }
  }, [tradeType, quantity, totalCost, cashBalance, holding, sharesOwned]);

  const handleQuickAdd = (amount: number) => {
    const next = Math.max(1, quantity + amount);
    setQuantityStr(String(next));
  };

  const handleMax = () => {
    const max = tradeType === 'buy' ? maxBuyQuantity : maxSellQuantity;
    setQuantityStr(String(Math.max(1, max)));
  };

  const handleTrade = async () => {
    if (!canExecute || isTrading) return;

    try {
      if (tradeType === 'buy') {
        await buyStock(stock._id, quantity);
        if (isMarketOpen) {
          Toast.show({
            type: 'success',
            text1: 'Order Executed 🟢',
            text2: `Successfully purchased ${quantity} shares of ${stock.symbol}!`,
          });
        } else {
          Toast.show({
            type: 'market_holiday',
            text1: 'After-Market Order (AMO) Placed ⏳',
            text2: `Your buy order for ${quantity} shares of ${stock.symbol} is queued for market open at 9:30 AM.`,
          });
        }
      } else {
        if (!holding) {
          Toast.show({
            type: 'error',
            text1: 'Holdings Error',
            text2: 'You do not own any shares of this stock to sell.',
          });
          return;
        }
        await sellStock(holding._id, quantity);
        if (isMarketOpen) {
          Toast.show({
            type: 'success',
            text1: 'Order Executed 🟢',
            text2: `Successfully sold ${quantity} shares of ${stock.symbol}!`,
          });
        } else {
          Toast.show({
            type: 'market_holiday',
            text1: 'After-Market Sell Order Placed ⏳',
            text2: `Your sell order for ${quantity} shares of ${stock.symbol} is queued for execution at 9:30 AM.`,
          });
        }
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Trade Failed',
        text2: err.message || 'Could not complete transaction.',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <StockAvatar
                symbol={stock.symbol}
                iconUrl={stock.iconUrl}
                size={scale(38)}
                borderRadius={scale(10)}
                style={styles.headerAvatar}
              />
              <View>
                <Text style={styles.headerTitle}>{stock.symbol}</Text>
                <Text style={styles.headerSubtitle}>
                  Market Price: ${currentPrice.toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={moderateScale(22)} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Buy / Sell Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabButton, tradeType === 'buy' && styles.tabButtonActiveBuy]}
              onPress={() => setTradeType('buy')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  tradeType === 'buy' && styles.tabButtonTextActiveBuy,
                ]}
              >
                BUY
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, tradeType === 'sell' && styles.tabButtonActiveSell]}
              onPress={() => setTradeType('sell')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  tradeType === 'sell' && styles.tabButtonTextActiveSell,
                ]}
              >
                SELL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Balance / Position Context */}
          <View style={styles.balanceInfoCard}>
            {tradeType === 'buy' ? (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Available Cash Balance:</Text>
                <Text style={styles.balanceValue}>${cashBalance.toFixed(2)}</Text>
              </View>
            ) : (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Shares Owned:</Text>
                <Text style={styles.balanceValue}>{sharesOwned} shares</Text>
              </View>
            )}
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantitySectionTitle}>QUANTITY (SHARES)</Text>
            <View style={styles.quantityControlRow}>
              <TouchableOpacity
                style={styles.qtyStepButton}
                onPress={() => setQuantityStr(String(Math.max(1, quantity - 1)))}
                activeOpacity={0.7}
              >
                <Icon name="remove" size={moderateScale(18)} color={Colors.textPrimary} />
              </TouchableOpacity>

              <TextInput
                style={styles.qtyInput}
                keyboardType="numeric"
                value={quantityStr}
                onChangeText={(val) => setQuantityStr(val.replace(/[^0-9]/g, ''))}
                selectTextOnFocus
              />

              <TouchableOpacity
                style={styles.qtyStepButton}
                onPress={() => setQuantityStr(String(quantity + 1))}
                activeOpacity={0.7}
              >
                <Icon name="add" size={moderateScale(18)} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick Chips */}
            <View style={styles.quickChipsRow}>
              {[1, 5, 10, 25].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.chipButton}
                  onPress={() => handleQuickAdd(amt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipButtonText}>+{amt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chipButton, styles.chipMaxButton]}
                onPress={handleMax}
                activeOpacity={0.7}
              >
                <Text style={styles.chipMaxText}>MAX</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Summary breakdown */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Share Price</Text>
              <Text style={styles.summaryValue}>${stock.currentPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Shares</Text>
              <Text style={styles.summaryValue}>{quantity}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>
                {tradeType === 'buy' ? 'Total Required' : 'Estimated Return'}
              </Text>
              <Text style={styles.summaryTotalValue}>${totalCost.toFixed(2)}</Text>
            </View>
          </View>

          {/* After-Market Order Notice when Market is Closed */}
          {!isMarketOpen && (
            <View style={styles.amoBanner}>
              <Icon name="time-outline" size={moderateScale(16)} color="#FFD700" />
              <View style={styles.amoBannerTextContainer}>
                <Text style={styles.amoBannerTitle}>After-Market Order (AMO)</Text>
                <Text style={styles.amoBannerSubtitle}>
                  Markets are closed. This order will be queued and executed automatically when the market opens at 9:30 AM.
                </Text>
              </View>
            </View>
          )}

          {/* Validation Warning if unable */}
          {!canExecute && quantity > 0 && (
            <View style={styles.warningBox}>
              <Icon name="alert-circle-outline" size={moderateScale(14)} color={Colors.error} />
              <Text style={styles.warningText}>
                {tradeType === 'buy'
                  ? `Insufficient cash. Need $${(totalCost - cashBalance).toFixed(2)} more.`
                  : sharesOwned === 0
                  ? 'You do not hold any shares of this stock.'
                  : `Cannot sell more than ${sharesOwned} owned shares.`}
              </Text>
            </View>
          )}

          {/* Execute Trade Button */}
          <TouchableOpacity
            style={[
              styles.executeButton,
              tradeType === 'buy' ? styles.executeBuy : styles.executeSell,
              (!canExecute || isTrading) && styles.executeDisabled,
            ]}
            onPress={handleTrade}
            disabled={!canExecute || isTrading}
            activeOpacity={0.8}
          >
            {isTrading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.executeButtonText}>
                {isMarketOpen
                  ? (tradeType === 'buy'
                    ? `Confirm Buy • $${totalCost.toFixed(2)}`
                    : `Confirm Sell • $${totalCost.toFixed(2)}`)
                  : (tradeType === 'buy'
                    ? `Place AMO Buy • $${totalCost.toFixed(2)}`
                    : `Place AMO Sell • $${totalCost.toFixed(2)}`)}
              </Text>
            )}
          </TouchableOpacity>
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
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
  },
  handleBar: {
    width: scale(36),
    height: verticalScale(4),
    backgroundColor: Colors.cardBorder,
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    marginRight: scale(10),
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(20),
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(12),
    padding: scale(3),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: verticalScale(14),
  },
  tabButton: {
    flex: 1,
    paddingVertical: verticalScale(8),
    alignItems: 'center',
    borderRadius: moderateScale(9),
  },
  tabButtonActiveBuy: {
    backgroundColor: Colors.primary,
  },
  tabButtonActiveSell: {
    backgroundColor: Colors.secondary,
  },
  tabButtonText: {
    color: Colors.textMuted,
    fontSize: moderateScale(13),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabButtonTextActiveBuy: {
    color: Colors.background,
  },
  tabButtonTextActiveSell: {
    color: Colors.background,
  },
  balanceInfoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(10),
    padding: scale(12),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  balanceValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  quantitySection: {
    marginBottom: verticalScale(14),
  },
  quantitySectionTitle: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: verticalScale(8),
  },
  quantityControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    overflow: 'hidden',
  },
  qtyStepButton: {
    width: scale(48),
    height: verticalScale(44),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  qtyInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: moderateScale(18),
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 0,
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
  },
  chipButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(6),
    alignItems: 'center',
    marginHorizontal: scale(3),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipButtonText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  chipMaxButton: {
    borderColor: Colors.primary,
  },
  chipMaxText: {
    color: Colors.primary,
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: moderateScale(10),
    padding: scale(12),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(3),
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: verticalScale(6),
  },
  summaryTotalLabel: {
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  summaryTotalValue: {
    color: Colors.primary,
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  amoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: moderateScale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    marginBottom: verticalScale(12),
  },
  amoBannerTextContainer: {
    flex: 1,
    marginLeft: scale(8),
  },
  amoBannerTitle: {
    color: '#FFD700',
    fontSize: moderateScale(11.5),
    fontWeight: '700',
  },
  amoBannerSubtitle: {
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    lineHeight: moderateScale(14),
    marginTop: verticalScale(2),
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: moderateScale(8),
    padding: scale(8),
    marginBottom: verticalScale(12),
  },
  warningText: {
    color: Colors.error,
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginLeft: scale(6),
    flex: 1,
  },
  executeButton: {
    height: verticalScale(46),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeBuy: {
    backgroundColor: Colors.primary,
  },
  executeSell: {
    backgroundColor: Colors.secondary,
  },
  executeDisabled: {
    opacity: 0.4,
  },
  executeButtonText: {
    color: Colors.background,
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
