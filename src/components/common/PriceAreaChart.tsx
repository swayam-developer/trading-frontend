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
} from 'react-native-svg';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

export interface ChartPoint {
  value: number;
  label?: string;
  timeStamp?: string;
}

interface PriceAreaChartProps {
  data: ChartPoint[];
  height?: number;
  width?: number;
  isPositive?: boolean;
  color?: string;
  prevClosePrice?: number;
  onScrub?: (point: ChartPoint | null) => void;
}

const PriceAreaChartComponent: React.FC<PriceAreaChartProps> = ({
  data,
  height = verticalScale(195),
  width: propWidth,
  isPositive = true,
  color,
  prevClosePrice,
  onScrub,
}) => {
  const windowWidth = Dimensions.get('window').width;
  // Fit nicely inside chart card with padding accounted for
  const chartWidth = propWidth || Math.max(100, windowWidth - scale(40) - scale(24));
  const chartHeight = height;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeColor = color || (isPositive ? Colors.primary : Colors.error);
  const activeGradientId = isPositive ? 'mainChartGrad_pos' : 'mainChartGrad_neg';

  // SVG inner chart margins
  const paddingTop = verticalScale(18);
  const paddingBottom = verticalScale(28);
  const paddingLeft = scale(10);
  const paddingRight = scale(10);

  const plotWidth = Math.max(10, chartWidth - paddingLeft - paddingRight);
  const plotHeight = Math.max(10, chartHeight - paddingTop - paddingBottom);

  const { minVal, maxVal, coordinates, timeLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minVal: 0, maxVal: 100, coordinates: [], timeLabels: [] };
    }

    const values = data.map((d) => d.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Expand bounds slightly to prevent clipping at the exact edge
    const paddingBuffer = (max - min) * 0.08 || 1;
    min = Math.max(0, min - paddingBuffer);
    max = max + paddingBuffer;

    const range = max - min || 1;
    const len = data.length;

    const coords = data.map((d, i) => {
      const x = paddingLeft + (len === 1 ? plotWidth / 2 : (i / (len - 1)) * plotWidth);
      const y = paddingTop + (1 - (d.value - min) / range) * plotHeight;
      return { x, y, value: d.value, label: d.label, timeStamp: d.timeStamp };
    });

    // Extract 4-5 evenly distributed time labels for the X-axis
    const labels: Array<{ label: string; x: number }> = [];
    if (len > 1) {
      const step = Math.max(1, Math.floor((len - 1) / 3));
      for (let i = 0; i < len; i += step) {
        if (data[i]?.label) {
          labels.push({
            label: data[i].label!,
            x: coords[i].x,
          });
        }
      }
      // Ensure the last label is included if available
      if (data[len - 1]?.label && !labels.some((l) => l.x === coords[len - 1].x)) {
        labels.push({
          label: data[len - 1].label!,
          x: coords[len - 1].x,
        });
      }
    }

    return { minVal: min, maxVal: max, coordinates: coords, timeLabels: labels };
  }, [data, plotWidth, plotHeight, paddingTop, paddingLeft]);

  // Calculate previous close Y coordinate if provided
  const prevCloseY = useMemo(() => {
    if (prevClosePrice === undefined || minVal === undefined || maxVal === undefined) return null;
    if (prevClosePrice < minVal || prevClosePrice > maxVal) return null;
    const range = maxVal - minVal;
    return paddingTop + (1 - (prevClosePrice - minVal) / range) * plotHeight;
  }, [prevClosePrice, minVal, maxVal, paddingTop, plotHeight]);

  // Generate smooth Monotone cubic SVG path
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

      const tension = 0.22;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const firstPt = coordinates[0];
    const lastPt = coordinates[coordinates.length - 1];
    const baselineY = chartHeight - paddingBottom + 8;
    const fPath = `${d} L ${lastPt.x.toFixed(1)},${baselineY.toFixed(1)} L ${firstPt.x.toFixed(1)},${baselineY.toFixed(1)} Z`;

    return { linePath: d, fillPath: fPath };
  }, [coordinates, chartHeight, paddingBottom]);

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
      : null;

  return (
    <View style={[styles.container, { width: chartWidth, height: chartHeight }]}>
      {/* Interactive Tooltip Badge when Scrubbed */}
      {activeCoord && (
        <View
          style={[
            styles.scrubPill,
            {
              left: Math.min(
                Math.max(scale(4), activeCoord.x - scale(50)),
                chartWidth - scale(105)
              ),
            },
          ]}
        >
          <Text style={styles.scrubPrice}>${activeCoord.value.toFixed(2)}</Text>
          {activeCoord.label ? (
            <Text style={styles.scrubLabel}>{activeCoord.label}</Text>
          ) : null}
        </View>
      )}

      {/* SVG Interactive Canvas */}
      <View {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={chartHeight - paddingBottom + 10}>
          <Defs>
            <LinearGradient id={activeGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={activeColor} stopOpacity="0.38" />
              <Stop offset="50%" stopColor={activeColor} stopOpacity="0.12" />
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

          {/* Previous Close Reference Line */}
          {prevCloseY !== null && (
            <Line
              x1={paddingLeft}
              y1={prevCloseY}
              x2={chartWidth - paddingRight}
              y2={prevCloseY}
              stroke="rgba(148, 163, 184, 0.3)"
              strokeDasharray="3 3"
              strokeWidth={1.2}
            />
          )}

          {/* Gradient Area Fill Under Curve */}
          {fillPath ? <Path d={fillPath} fill={`url(#${activeGradientId})`} /> : null}

          {/* Glowing Bézier Line */}
          {linePath ? (
            <Path
              d={linePath}
              fill="none"
              stroke={activeColor}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Vertical Scrubber Crosshair Line */}
          {activeCoord && (
            <Line
              x1={activeCoord.x}
              y1={paddingTop}
              x2={activeCoord.x}
              y2={chartHeight - paddingBottom + 4}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
          )}

          {/* Glowing Cursor Circle at active point */}
          {activeCoord ? (
            <>
              <Circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r={moderateScale(8)}
                fill={activeColor}
                fillOpacity={0.25}
              />
              <Circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r={moderateScale(4)}
                fill={activeColor}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </>
          ) : coordinates.length > 0 ? (
            // Live point beacon on the right-most point
            <>
              <Circle
                cx={coordinates[coordinates.length - 1].x}
                cy={coordinates[coordinates.length - 1].y}
                r={moderateScale(6)}
                fill={activeColor}
                fillOpacity={0.3}
              />
              <Circle
                cx={coordinates[coordinates.length - 1].x}
                cy={coordinates[coordinates.length - 1].y}
                r={moderateScale(3.5)}
                fill={activeColor}
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
            </>
          ) : null}
        </Svg>
      </View>

      {/* X-Axis Time / Date Scale */}
      <View style={[styles.timeAxisRow, { paddingHorizontal: paddingLeft }]}>
        {timeLabels.length > 0 ? (
          timeLabels.map((t, idx) => (
            <Text key={idx} style={styles.timeAxisText}>
              {t.label}
            </Text>
          ))
        ) : (
          <>
            <Text style={styles.timeAxisText}>09:30 AM</Text>
            <Text style={styles.timeAxisText}>12:00 PM</Text>
            <Text style={styles.timeAxisText}>03:30 PM</Text>
          </>
        )}
      </View>
    </View>
  );
};

export const PriceAreaChart = React.memo<PriceAreaChartProps>(PriceAreaChartComponent);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  scrubPill: {
    position: 'absolute',
    top: -verticalScale(14),
    backgroundColor: '#161E2E',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
    alignItems: 'center',
    minWidth: scale(76),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  scrubPrice: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
  scrubLabel: {
    color: Colors.textSecondary,
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    marginTop: verticalScale(1),
  },
  timeAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  timeAxisText: {
    color: Colors.textMuted,
    fontSize: moderateScale(9.5),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
