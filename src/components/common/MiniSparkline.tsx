import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { scale, verticalScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface MiniSparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  isPositive?: boolean;
  strokeWidth?: number;
  showGradient?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = scale(64),
  height = verticalScale(26),
  isPositive = true,
  strokeWidth = 1.8,
  showGradient = true,
}) => {
  const strokeColor = isPositive ? Colors.primary : Colors.error;
  const gradId = useMemo(
    () => `spark_${Math.random().toString(36).substring(2, 8)}`,
    []
  );

  // Generate synthetic points if data is empty or < 2 items
  const points = useMemo(() => {
    if (data && data.length >= 2) {
      return data;
    }
    // Realistic standard 8-point micro trend
    const base = isPositive ? 100 : 105;
    const diff = isPositive ? 5 : -5;
    return [
      base,
      base + diff * 0.15 + (isPositive ? -0.5 : 0.5),
      base + diff * 0.4 + (isPositive ? 0.8 : -0.8),
      base + diff * 0.35,
      base + diff * 0.7 + (isPositive ? -0.3 : 0.3),
      base + diff * 0.65,
      base + diff * 0.88,
      base + diff,
    ];
  }, [data, isPositive]);

  const { linePath, areaPath } = useMemo(() => {
    if (points.length < 2) return { linePath: '', areaPath: '' };

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const padTop = 3;
    const padBottom = 3;
    const availableHeight = height - padTop - padBottom;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const normalized = (val - min) / range;
      const y = height - padBottom - normalized * availableHeight;
      return { x, y };
    });

    // Build Monotone / Smooth Bezier Path
    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const areaD = `${d} L ${width.toFixed(1)} ${height.toFixed(1)} L 0 ${height.toFixed(1)} Z`;

    return { linePath: d, areaPath: areaD };
  }, [points, width, height]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={strokeColor}
              stopOpacity={showGradient ? '0.35' : '0'}
            />
            <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {showGradient && areaPath ? (
          <Path d={areaPath} fill={`url(#${gradId})`} />
        ) : null}

        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
