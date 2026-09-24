import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../../theme/colors';

interface MarketIndexItem {
  id: string;
  name: string;
  value: string;
  changePercent: string;
  isPositive: boolean;
}

const INDICES_DATA: MarketIndexItem[] = [
  {
    id: 'sp500',
    name: 'S&P 500',
    value: '5,688.20',
    changePercent: '+0.42%',
    isPositive: true,
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    value: '17,948.30',
    changePercent: '-0.18%',
    isPositive: false,
  },
  {
    id: 'dow',
    name: 'DOW 30',
    value: '41,980.50',
    changePercent: '+0.55%',
    isPositive: true,
  },
  {
    id: 'russell',
    name: 'RUSSELL',
    value: '2,215.80',
    changePercent: '+1.12%',
    isPositive: true,
  },
  {
    id: 'nifty',
    name: 'NIFTY 50',
    value: '25,320.10',
    changePercent: '+0.84%',
    isPositive: true,
  },
];

export const MarketIndicesStrip: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {INDICES_DATA.map((idx) => (
          <View key={idx.id} style={styles.indexChip}>
            <Text style={styles.indexName}>{idx.name}</Text>
            <Text style={styles.indexValue}>{idx.value}</Text>
            <View
              style={[
                styles.changeBadge,
                idx.isPositive ? styles.changeBadgeUp : styles.changeBadgeDown,
              ]}
            >
              <Icon
                name={idx.isPositive ? 'caret-up' : 'caret-down'}
                size={moderateScale(8)}
                color={idx.isPositive ? Colors.primary : Colors.error}
                style={styles.caret}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: idx.isPositive ? Colors.primary : Colors.error },
                ]}
              >
                {idx.changePercent}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: verticalScale(4),
  },
  scrollContainer: {
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  indexChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  indexName: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '700',
    marginRight: scale(6),
  },
  indexValue: {
    color: Colors.textPrimary,
    fontSize: moderateScale(11.5),
    fontWeight: '800',
    marginRight: scale(6),
    fontVariant: ['tabular-nums'],
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(4),
    paddingVertical: verticalScale(1.5),
    borderRadius: moderateScale(4),
  },
  changeBadgeUp: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  changeBadgeDown: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  caret: {
    marginRight: scale(2),
  },
  changeText: {
    fontSize: moderateScale(9.5),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
