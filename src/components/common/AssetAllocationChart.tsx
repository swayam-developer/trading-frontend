import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface SliceItem {
  value: number;
  color: string;
  symbol: string;
  name?: string;
}

interface AssetAllocationChartProps {
  slices: SliceItem[];
  totalValue: number;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  slices,
  totalValue,
}) => {
  const size = scale(110);
  const strokeWidth = scale(14);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentage and dash array/offsets for each slice
  const renderedSlices = useMemo(() => {
    if (!slices || slices.length === 0 || totalValue <= 0) return [];

    let currentAngle = -90; // Start at top
    return slices.map((slice) => {
      const percentage = (slice.value / totalValue) * 100;
      const strokeDasharray = `${(circumference * percentage) / 100} ${circumference}`;
      const rotation = currentAngle;
      currentAngle += (percentage / 100) * 360;

      return {
        ...slice,
        percentage: percentage.toFixed(1),
        strokeDasharray,
        rotation,
      };
    });
  }, [slices, totalValue, circumference]);

  if (!slices || slices.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Asset Allocation</Text>

      <View style={styles.contentRow}>
        {/* SVG Donut Chart */}
        <View style={styles.chartWrapper}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G transform={`translate(${size / 2}, ${size / 2})`}>
              {/* Background Track Circle */}
              <Circle
                r={radius}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Slices */}
              {renderedSlices.map((slice, index) => (
                <Circle
                  key={index}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={0}
                  fill="none"
                  transform={`rotate(${slice.rotation})`}
                  strokeLinecap="round"
                />
              ))}
            </G>
          </Svg>

          {/* Center Text inside Donut */}
          <View style={styles.centerLabel}>
            <Text style={styles.centerCount}>{slices.length}</Text>
            <Text style={styles.centerSub}>Assets</Text>
          </View>
        </View>

        {/* Legend / Breakdown List */}
        <View style={styles.legendContainer}>
          {renderedSlices.slice(0, 4).map((slice, idx) => (
            <View key={idx} style={styles.legendRow}>
              <View style={[styles.colorDot, { backgroundColor: slice.color }]} />
              <Text style={styles.symbolText} numberOfLines={1}>
                {slice.symbol}
              </Text>
              <Text style={styles.percentageText}>{slice.percentage}%</Text>
            </View>
          ))}
          {renderedSlices.length > 4 && (
            <Text style={styles.moreText}>
              +{renderedSlices.length - 4} other positions
            </Text>
          )}
        </View>
      </View>

      {/* Segmented Linear Allocation Progress Bar */}
      <View style={styles.progressBar}>
        {renderedSlices.map((slice, idx) => (
          <View
            key={idx}
            style={{
              flex: Math.max(0.01, parseFloat(slice.percentage)),
              backgroundColor: slice.color,
              height: '100%',
              marginRight: idx < renderedSlices.length - 1 ? scale(2) : 0,
              borderRadius: scale(2),
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginBottom: verticalScale(12),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartWrapper: {
    width: scale(110),
    height: scale(110),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCount: {
    color: Colors.textPrimary,
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  centerSub: {
    color: Colors.textMuted,
    fontSize: moderateScale(9),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  legendContainer: {
    flex: 1,
    marginLeft: scale(20),
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: verticalScale(4),
  },
  colorDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(8),
  },
  symbolText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  percentageText: {
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  moreText: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginTop: verticalScale(4),
    fontStyle: 'italic',
  },
  progressBar: {
    flexDirection: 'row',
    height: verticalScale(6),
    borderRadius: scale(3),
    overflow: 'hidden',
    marginTop: verticalScale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
