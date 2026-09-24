import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue, StyleProp, ViewStyle, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface SkeletonItemProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonItem: React.FC<SkeletonItemProps> = ({
  width = '100%',
  height = verticalScale(16),
  borderRadius = moderateScale(8),
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

// =========================================================================
// SCREEN SPECIFIC SKELETON PRESETS
// =========================================================================

/**
 * Watchlist Screen Skeleton - Stock list items perfectly aligned with screen bounds
 */
export const WatchlistSkeleton: React.FC = () => {
  return (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.stockCardSkeleton}>
          {/* Avatar / Logo Box */}
          <SkeletonItem
            width={scale(44)}
            height={scale(44)}
            borderRadius={scale(14)}
            style={styles.mr12}
          />

          {/* Symbol & Company Name */}
          <View style={styles.flex1}>
            <SkeletonItem width="45%" height={verticalScale(15)} style={styles.mb8} />
            <SkeletonItem width="70%" height={verticalScale(11)} />
          </View>

          {/* Price & Change Pill */}
          <View style={styles.alignEnd}>
            <SkeletonItem width={scale(72)} height={verticalScale(16)} style={styles.mb8} />
            <SkeletonItem
              width={scale(58)}
              height={verticalScale(20)}
              borderRadius={moderateScale(8)}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Portfolio Screen Skeleton - Summary hero, donut chart, and holding positions
 */
export const PortfolioSkeleton: React.FC = () => {
  return (
    <ScrollView
      style={styles.flex1}
      contentContainerStyle={styles.portfolioScrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Portfolio Summary Card */}
      <View style={styles.portfolioSummaryCard}>
        <View style={styles.rowBetween}>
          <SkeletonItem width="35%" height={verticalScale(12)} />
          <SkeletonItem width={scale(60)} height={verticalScale(18)} borderRadius={moderateScale(6)} />
        </View>
        <SkeletonItem width="65%" height={verticalScale(34)} style={styles.mv12} />
        <View style={styles.rowBetween}>
          <SkeletonItem width="40%" height={verticalScale(14)} />
          <SkeletonItem width="30%" height={verticalScale(20)} borderRadius={moderateScale(6)} />
        </View>
      </View>

      {/* Allocation Chart Placeholder */}
      <View style={styles.allocationCard}>
        <SkeletonItem width="40%" height={verticalScale(14)} style={styles.mb14} />
        <View style={styles.center}>
          <SkeletonItem
            width={scale(130)}
            height={scale(130)}
            borderRadius={scale(65)}
            style={styles.mb12}
          />
          <SkeletonItem width="45%" height={verticalScale(12)} />
        </View>
      </View>

      {/* Holdings Section Header */}
      <SkeletonItem width="35%" height={verticalScale(16)} style={styles.mv12} />

      {/* Holding Item Cards */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.holdingCardSkeleton}>
          <View style={styles.rowAlign}>
            <SkeletonItem
              width={scale(42)}
              height={scale(42)}
              borderRadius={scale(14)}
              style={styles.mr12}
            />
            <View style={styles.flex1}>
              <SkeletonItem width="45%" height={verticalScale(14)} style={styles.mb6} />
              <SkeletonItem width="65%" height={verticalScale(11)} />
            </View>
            <View style={styles.alignEnd}>
              <SkeletonItem width={scale(70)} height={verticalScale(15)} style={styles.mb6} />
              <SkeletonItem width={scale(55)} height={verticalScale(18)} borderRadius={moderateScale(6)} />
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.rowBetween}>
            <SkeletonItem width="22%" height={verticalScale(14)} />
            <SkeletonItem width="22%" height={verticalScale(14)} />
            <SkeletonItem width="22%" height={verticalScale(14)} />
            <SkeletonItem width={scale(55)} height={verticalScale(22)} borderRadius={moderateScale(12)} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

/**
 * Orders Screen Skeleton - List of order execution card skeletons
 */
export const OrdersSkeleton: React.FC = () => {
  return (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.orderCardSkeleton}>
          {/* Top Row: Type & Value */}
          <View style={styles.rowBetween}>
            <View style={styles.rowAlign}>
              <SkeletonItem
                width={scale(50)}
                height={verticalScale(22)}
                borderRadius={moderateScale(6)}
                style={styles.mr8}
              />
              <SkeletonItem width={scale(60)} height={verticalScale(16)} />
            </View>
            <SkeletonItem width={scale(75)} height={verticalScale(16)} />
          </View>

          {/* Stock Info */}
          <View style={[styles.rowAlign, styles.mv10]}>
            <SkeletonItem
              width={scale(36)}
              height={scale(36)}
              borderRadius={scale(10)}
              style={styles.mr12}
            />
            <View style={styles.flex1}>
              <SkeletonItem width="40%" height={verticalScale(14)} style={styles.mb4} />
              <SkeletonItem width="60%" height={verticalScale(11)} />
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Bottom Row: Date & Status */}
          <View style={styles.rowBetween}>
            <SkeletonItem width="35%" height={verticalScale(12)} />
            <SkeletonItem width="30%" height={verticalScale(12)} />
          </View>
        </View>
      ))}
    </View>
  );
};

interface StockDetailSkeletonProps {
  onBack?: () => void;
}

/**
 * Stock Detail Screen Skeleton - Pixel-matched full screen placeholder
 */
export const StockDetailScreenSkeleton: React.FC<StockDetailSkeletonProps> = ({ onBack }) => {
  return (
    <View style={styles.flex1}>
      {/* Top App Bar */}
      <View style={styles.detailTopBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.detailBackBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="chevron-back" size={moderateScale(24)} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <SkeletonItem width={scale(36)} height={scale(36)} borderRadius={moderateScale(10)} />
        )}

        <View style={styles.detailHeaderCenter}>
          <SkeletonItem width={scale(75)} height={verticalScale(18)} style={styles.mb4} />
          <SkeletonItem width={scale(130)} height={verticalScale(11)} />
        </View>

        <SkeletonItem width={scale(44)} height={scale(44)} borderRadius={scale(14)} />
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.stockDetailContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Price & Change Banner */}
        <View style={styles.detailPriceSection}>
          <SkeletonItem width={scale(110)} height={verticalScale(11)} style={styles.mb8} />
          <SkeletonItem width={scale(160)} height={verticalScale(34)} style={styles.mb8} />
          <SkeletonItem width={scale(120)} height={verticalScale(22)} borderRadius={moderateScale(12)} />
        </View>

        {/* Timeframe Chips */}
        <View style={styles.detailTimeframeRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonItem
              key={i}
              width={scale(52)}
              height={verticalScale(30)}
              borderRadius={moderateScale(10)}
            />
          ))}
        </View>

        {/* Interactive Price Chart Card */}
        <View style={styles.detailChartCard}>
          <SkeletonItem width="100%" height={verticalScale(185)} borderRadius={moderateScale(12)} />
        </View>

        {/* Statistics Insights Card */}
        <SkeletonItem width={scale(120)} height={verticalScale(16)} style={styles.mv12} />
        <View style={styles.detailStatsCard}>
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <View style={styles.rowBetween}>
                <SkeletonItem width="40%" height={verticalScale(13)} />
                <SkeletonItem width="30%" height={verticalScale(14)} />
              </View>
              {i < 4 && <View style={styles.cardDivider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Floating Trading Bar */}
      <View style={styles.detailBottomBar}>
        <SkeletonItem width="48%" height={verticalScale(46)} borderRadius={moderateScale(14)} />
        <SkeletonItem width="48%" height={verticalScale(46)} borderRadius={moderateScale(14)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(4),
  },
  portfolioScrollContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(100),
  },
  stockDetailContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(60),
  },
  skeletonBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  mb4: {
    marginBottom: verticalScale(4),
  },
  mb6: {
    marginBottom: verticalScale(6),
  },
  mb8: {
    marginBottom: verticalScale(8),
  },
  mb10: {
    marginBottom: verticalScale(10),
  },
  mb12: {
    marginBottom: verticalScale(12),
  },
  mb14: {
    marginBottom: verticalScale(14),
  },
  mr8: {
    marginRight: scale(8),
  },
  mr12: {
    marginRight: scale(12),
  },
  mv10: {
    marginVertical: verticalScale(10),
  },
  mv12: {
    marginVertical: verticalScale(12),
  },
  mv14: {
    marginVertical: verticalScale(14),
  },
  mv16: {
    marginVertical: verticalScale(16),
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: verticalScale(10),
  },
  stockCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  portfolioSummaryCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  allocationCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  holdingCardSkeleton: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  orderCardSkeleton: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(14),
    padding: scale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chartBox: {
    height: verticalScale(190),
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(10),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: verticalScale(12),
  },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailBackBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: moderateScale(12),
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderCenter: {
    flex: 1,
    marginHorizontal: scale(12),
  },
  detailPriceSection: {
    marginVertical: verticalScale(14),
  },
  detailTimeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(14),
  },
  detailChartCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(12),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailStatsCard: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(14),
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
