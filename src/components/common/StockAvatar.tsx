import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import { getStockBrand, getStockLogoUrl } from '../../utils/stockUtils';

interface StockAvatarProps {
  symbol?: string;
  iconUrl?: string;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  showBorder?: boolean;
  fallbackText?: string;
}

export const StockAvatar: React.FC<StockAvatarProps> = ({
  symbol = 'STOCK',
  iconUrl,
  size = scale(44),
  borderRadius = scale(14),
  style,
  imageStyle,
  showBorder = true,
  fallbackText,
}) => {
  const [imageError, setImageError] = useState(false);
  const logoUri = getStockLogoUrl(symbol, iconUrl);
  const brand = getStockBrand(symbol);

  const displayMonogram = fallbackText || symbol.slice(0, 3).toUpperCase();
  const iconSize = Math.round(size * 0.68);
  const iconRadius = Math.max(4, Math.round(borderRadius * 0.6));

  const shouldRenderImage = !imageError && Boolean(logoUri && logoUri.startsWith('http'));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
          backgroundColor: '#161E2E',
          borderColor: showBorder ? brand.border : 'transparent',
          borderWidth: showBorder ? 1 : 0,
        },
        style,
      ]}
    >
      {shouldRenderImage ? (
        <View
          style={[
            styles.imageWrapper,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconRadius,
            },
          ]}
        >
          <Image
            source={{ uri: logoUri }}
            style={[
              styles.image,
              {
                width: iconSize,
                height: iconSize,
                borderRadius: iconRadius,
              },
              imageStyle,
            ]}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        </View>
      ) : (
        <View
          style={[
            styles.fallbackContainer,
            {
              backgroundColor: brand.bg,
              borderRadius: borderRadius,
            },
          ]}
        >
          <Text
            style={[
              styles.fallbackText,
              {
                color: brand.text,
                fontSize: moderateScale(Math.max(10, Math.round(size * 0.3))),
              },
            ]}
            numberOfLines={1}
          >
            {displayMonogram}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // High contrast backing for transparent company logos
    padding: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
