import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface AuraLogoProps {
  size?: number;
  showTagline?: boolean;
}

export const AuraLogo: React.FC<AuraLogoProps> = ({ size = 64, showTagline = true }) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoCircle,
          {
            width: scale(size),
            height: scale(size),
            borderRadius: scale(size) / 2,
          },
        ]}
      >
        {/* Futuristic Stylized Candlestick Monogram Icon */}
        <View style={styles.symbolContainer}>
          <View style={styles.candlestickBarLeft} />
          <View style={styles.candlestickBarCenter} />
          <View style={styles.candlestickBarRight} />
          <View style={styles.breakoutArrow} />
        </View>
      </View>

      <Text style={styles.brandTitle}>
        AURA <Text style={styles.brandSubtitle}>TRADING</Text>
      </Text>

      {showTagline && (
        <Text style={styles.tagline}>Institutional Power at Your Fingertips</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(16),
  },
  logoCircle: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '55%',
    width: '55%',
  },
  candlestickBarLeft: {
    width: scale(4),
    height: '45%',
    backgroundColor: Colors.secondary,
    borderRadius: 2,
    marginRight: scale(4),
  },
  candlestickBarCenter: {
    width: scale(5),
    height: '80%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginRight: scale(4),
  },
  candlestickBarRight: {
    width: scale(5),
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginRight: scale(4),
  },
  breakoutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: scale(4),
    borderRightWidth: scale(4),
    borderBottomWidth: scale(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.secondary,
    alignSelf: 'flex-start',
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: moderateScale(22),
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: verticalScale(12),
  },
  brandSubtitle: {
    color: Colors.primary,
    fontWeight: '300',
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: moderateScale(12),
    letterSpacing: 0.5,
    marginTop: verticalScale(4),
  },
});
