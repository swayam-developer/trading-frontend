import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  Rect,
} from 'react-native-svg';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface ChartPoint {
  value: number;
  label?: string;
}

interface PriceAreaChartProps {
  data: ChartPoint[];
  height?: number;
  width?: number;
  isPositive?: boolean;
  color?: string;
  onScrub?: (point: ChartPoint | null) => void;
}

export const PriceAreaChart: React.FC<PriceAreaChartProps> = ({
  data,
  height = verticalScale(190),
  width: propWidth,
  isPositive = true,
  color,
  onScrub,
}) => {
  const windowWidth = Dimensions.get('window').width;
  const chartWidth = propWidth || windowWidth - scale(40);
  const chartHeight = height;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeColor = color || (isPositive ? '#00C853' : '#FF5252');
  const activeGradientId = useMemo(
    () => `chartGrad_${Math.random().toString(36).substring(2, 9)}`,
    []
  );

  // Top and bottom padding for points inside SVG
  const paddingTop = verticalScale(16);
  const paddingBottom = verticalScale(20);
  const paddingLeft = scale(12);
  const paddingRight = scale(12);

  const plotWidth = Math.max(10, chartWidth - paddingLeft - paddingRight);
  const plotHeight = Math.max(10, chartHeight - paddingTop - paddingBottom);

  const { minVal, maxVal, coordinates } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minVal: 0, maxVal: 100, coordinates: [] };
    }

    const values = data.map((d) => d.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (min === max) {
      min -= 1;
      max += 1;
    }

    const range = max - min;
    const len = data.length;

    const coords = data.map((d, i) => {
      const x = paddingLeft + (len === 1 ? plotWidth / 2 : (i / (len - 1)) * plotWidth);
      const y = paddingTop + (1 - (d.value - min) / range) * plotHeight;
      return { x, y, value: d.value, label: d.label };
    });

    return { minVal: min, maxVal: max, coordinates: coords };
  }, [data, plotWidth, plotHeight, paddingTop, paddingLeft]);

  // Generate smooth cubic bezier SVG path
  const { linePath, fillPath } = useMemo(() => {
    if (coordinates.length === 0) return { linePath: '', fillPath: '' };
    if (coordinates.length === 1) {
      const pt = coordinates[0];
      return {
        linePath: `M ${pt.x},${pt.y}`,
        fillPath: `M ${pt.x},${pt.y} L ${pt.x},${chartHeight} Z`,
      };
    }

    let d = `M ${coordinates[0].x.toFixed(1)},${coordinates[0].y.toFixed(1)}`;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const p0 = coordinates[Math.max(0, i - 1)];
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      const p3 = coordinates[Math.min(coordinates.length - 1, i + 2)];

      const tension = 0.2;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const firstPt = coordinates[0];
    const lastPt = coordinates[coordinates.length - 1];
    const fPath = `${d} L ${lastPt.x.toFixed(1)},${(chartHeight - 4).toFixed(1)} L ${firstPt.x.toFixed(1)},${(chartHeight - 4).toFixed(1)} Z`;

    return { linePath: d, fillPath: fPath };
  }, [coordinates, chartHeight]);

  // Touch scrubbing handler
  const handleTouch = (evt: GestureResponderEvent) => {
    if (coordinates.length === 0) return;
    const touchX = evt.nativeEvent.locationX;

    let closestIdx = 0;
    let minDist = Infinity;

    coordinates.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - touchX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    setActiveIndex(closestIdx);
    if (onScrub) onScrub(data[closestIdx]);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => handleTouch(evt),
        onPanResponderMove: (evt) => handleTouch(evt),
        onPanResponderRelease: () => {
          setActiveIndex(null);
          if (onScrub) onScrub(null);
        },
        onPanResponderTerminate: () => {
          setActiveIndex(null);
          if (onScrub) onScrub(null);
        },
      }),
    [coordinates, data, onScrub]
  );

  const activeCoord =
    activeIndex !== null && coordinates[activeIndex]
      ? coordinates[activeIndex]
      : coordinates[coordinates.length - 1];

  return (
    <View style={[styles.container, { width: chartWidth, height: chartHeight }]}>
      {/* Interactive Tooltip if scrubbed */}
      {activeIndex !== null && activeCoord && (
        <View style={[styles.scrubPill, { left: Math.min(Math.max(scale(10), activeCoord.x - scale(55)), chartWidth - scale(115)) }]}>
          <Text style={styles.scrubPrice}>${activeCoord.value.toFixed(2)}</Text>
          {activeCoord.label ? (
            <Text style={styles.scrubLabel}>{activeCoord.label}</Text>
          ) : null}
        </View>
      )}

      {/* SVG Canvas */}
      <View {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id={activeGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={activeColor} stopOpacity="0.32" />
              <Stop offset="70%" stopColor={activeColor} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={activeColor} stopOpacity="0.00" />
            </LinearGradient>
          </Defs>

          {/* Reference Horizontal Gridlines */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotHeight * 0.25}
            x2={chartWidth - paddingRight}
            y2={paddingTop + plotHeight * 0.25}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotHeight * 0.5}
            x2={chartWidth - paddingRight}
            y2={paddingTop + plotHeight * 0.5}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotHeight * 0.75}
            x2={chartWidth - paddingRight}
            y2={paddingTop + plotHeight * 0.75}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* Gradient Fill Under Curve */}
          {fillPath ? <Path d={fillPath} fill={`url(#${activeGradientId})`} /> : null}

          {/* Continuous Bézier Stroke Line */}
          {linePath ? (
            <Path
              d={linePath}
              fill="none"
              stroke={activeColor}
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Scrubber Vertical Line */}
          {activeIndex !== null && activeCoord && (
            <Line
              x1={activeCoord.x}
              y1={paddingTop}
              x2={activeCoord.x}
              y2={chartHeight - 4}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
          )}

          {/* Active / Current Point Glowing Indicator */}
          {activeCoord && (
            <>
              <Circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r={moderateScale(7)}
                fill={activeColor}
                fillOpacity={0.25}
              />
              <Circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r={moderateScale(3.5)}
                fill={activeColor}
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
            </>
          )}
        </Svg>
      </View>

      {/* Min & Max Price Watermark Labels */}
      <View style={[styles.minMaxRow, { paddingHorizontal: paddingLeft }]}>
        <Text style={styles.minMaxText}>Low: ${minVal.toFixed(2)}</Text>
        <Text style={styles.minMaxText}>High: ${maxVal.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  scrubPill: {
    position: 'absolute',
    top: -verticalScale(18),
    backgroundColor: '#1E293B',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
    alignItems: 'center',
    minWidth: scale(80),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  scrubPrice: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
  scrubLabel: {
    color: Colors.textMuted,
    fontSize: moderateScale(9),
    fontWeight: '600',
    marginTop: verticalScale(1),
  },
  minMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(4),
  },
  minMaxText: {
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
});
