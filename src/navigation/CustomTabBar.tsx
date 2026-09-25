import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Markets: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Portfolio: { active: 'pie-chart', inactive: 'pie-chart-outline' },
  Orders: { active: 'receipt', inactive: 'receipt-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

const CustomTabBarComponent: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const tabCount = state.routes.length;
  const tabWidth = SCREEN_WIDTH / tabCount;
  const indicatorWidth = scale(44);

  // Animated value for the sliding green indicator bar
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Calculate center of the active tab
    const targetX = state.index * tabWidth + (tabWidth - indicatorWidth) / 2;
    Animated.spring(indicatorTranslateX, {
      toValue: targetX,
      useNativeDriver: true,
      tension: 68,
      friction: 10,
    }).start();
  }, [state.index, tabWidth, indicatorWidth, indicatorTranslateX]);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, verticalScale(8)) }]}>
      {/* Moving Green Line Bar Above Selected Tab */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: indicatorWidth,
            transform: [{ translateX: indicatorTranslateX }],
          },
        ]}
      />

      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const icons = TAB_ICONS[route.name] || {
            active: 'ellipse',
            inactive: 'ellipse-outline',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const activeColor = Colors.primary; // Neon emerald (#00E676)
          const inactiveColor = Colors.textMuted; // Slate muted (#64748B)

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, isFocused && styles.iconBoxFocused]}>
                <Icon
                  name={isFocused ? icons.active : icons.inactive}
                  size={moderateScale(21)}
                  color={isFocused ? activeColor : inactiveColor}
                />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontWeight: isFocused ? '800' : '600',
                  },
                ]}
              >
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const CustomTabBar = React.memo<BottomTabBarProps>(CustomTabBarComponent);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.card, // #161E2E perfectly blends with dark UI theme
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: verticalScale(4),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.cardBorder, // #232F46
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: verticalScale(3.5),
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(2),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: verticalScale(54),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(4),
  },
  iconBox: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxFocused: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderRadius: scale(16),
  },
  tabLabel: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
    letterSpacing: 0.2,
  },
});
