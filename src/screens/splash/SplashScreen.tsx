import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Svg, { Circle, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import { RootNavigationProp } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/auth/authStore';
import { storageService } from '../../services/storage/storage.service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp<'Splash'>>();
  const [statusText, setStatusText] = useState('Initializing Secure Vault Engine...');

  // Animation values
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGlowPulse = useRef(new Animated.Value(1)).current;

  // Candlestick bar heights (for sequential rise)
  const barLeftHeight = useRef(new Animated.Value(0)).current;
  const barCenterHeight = useRef(new Animated.Value(0)).current;
  const barRightHeight = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;

  // Ripple halo rings
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0.7)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0.5)).current;

  // Typography & UI
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance Animation Sequence
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Sequential Candlestick Growth
      Animated.stagger(120, [
        Animated.timing(barLeftHeight, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(barCenterHeight, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(barRightHeight, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // 3. Typography Reveal
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 700,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 600,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Continuous Pulsing Halo Loop
    const haloLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1Scale, {
            toValue: 1.7,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring1Scale, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ring2Scale, {
            toValue: 2.1,
            duration: 2000,
            delay: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Scale, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 2000,
            delay: 400,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(logoGlowPulse, {
            toValue: 1.06,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoGlowPulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    haloLoop.start();

    // 5. Dynamic Progress Animation & Live Status Updates
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    const t1 = setTimeout(() => {
      setStatusText('Connecting to Global Liquidity Streams...');
    }, 700);

    const t2 = setTimeout(() => {
      setStatusText('Synchronizing Real-Time Market Feeds...');
    }, 1400);

    const t3 = setTimeout(() => {
      setStatusText('Ready.');
    }, 2000);

    return () => {
      haloLoop.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // 6. Navigation routing on completion
  useEffect(() => {
    let isCancelled = false;

    const routeUser = async () => {
      await storageService.init();
      const rawSession = storageService.getItem('aura_auth_session');
      if (rawSession && !useAuthStore.getState().isAuthenticated) {
        try {
          const session = JSON.parse(rawSession);
          if (session?.tokens?.access_token) {
            useAuthStore.getState().restoreSession(session);
          }
        } catch (e) {
          console.warn('[SplashScreen] Session parse error:', e);
        }
      }

      await new Promise<void>((resolve) => setTimeout(() => resolve(), 2400));
      if (isCancelled) return;

      const auth = useAuthStore.getState();
      if (auth.isAuthenticated) {
        navigation.replace('VerifyPin');
      } else {
        navigation.replace('EmailCheck');
      }
    };

    routeUser();

    return () => {
      isCancelled = true;
    };
  }, [navigation]);

  // Interpolated progress width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const bar1H = barLeftHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, verticalScale(18)],
  });
  const bar2H = barCenterHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, verticalScale(30)],
  });
  const bar3H = barRightHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, verticalScale(38)],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ambient Radial Background Glow */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <RadialGradient
              id="bgGlow"
              cx="50%"
              cy="45%"
              rx="50%"
              ry="45%"
              fx="50%"
              fy="45%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#00E676" stopOpacity="0.12" />
              <Stop offset="40%" stopColor="#00E5FF" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#0B0E14" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={SCREEN_WIDTH / 2}
            cy={SCREEN_HEIGHT * 0.45}
            r={SCREEN_WIDTH * 0.75}
            fill="url(#bgGlow)"
          />
        </Svg>
      </View>

      {/* Center Cinematic Hero Content */}
      <View style={styles.centerContent}>
        {/* Animated Ripple Halo Rings */}
        <Animated.View
          style={[
            styles.haloRing,
            {
              transform: [{ scale: ring1Scale }],
              opacity: ring1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.haloRing,
            styles.haloRing2,
            {
              transform: [{ scale: ring2Scale }],
              opacity: ring2Opacity,
            },
          ]}
        />

        {/* Animated Main Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: Animated.multiply(logoScale, logoGlowPulse) }],
            },
          ]}
        >
          {/* Futuristic Candlestick Monogram */}
          <View style={styles.candlestickBox}>
            <Animated.View style={[styles.barLeft, { height: bar1H }]} />
            <Animated.View style={[styles.barCenter, { height: bar2H }]} />
            <Animated.View style={[styles.barRight, { height: bar3H }]} />
            <Animated.View style={[styles.arrowHead, { opacity: arrowOpacity }]} />
          </View>
        </Animated.View>

        {/* Brand Title & Tagline with Smooth Slide-Up */}
        <Animated.View
          style={[
            styles.textGroup,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>
            AURA <Text style={styles.brandHighlight}>TRADING</Text>
          </Text>

          <View style={styles.taglineBadge}>
            <Text style={styles.taglineText}>INSTITUTIONAL POWER • ZERO COMMISSION</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer: Dynamic Glowing Loading Bar & Status */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>

        <Text style={styles.statusText}>{statusText}</Text>

        <View style={styles.securityPill}>
          <Icon name="shield-checkmark" size={moderateScale(11)} color={Colors.primary} />
          <Text style={styles.securityPillText}>256-BIT ENCRYPTED • SOC-2 COMPLIANT</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(36),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  haloRing: {
    position: 'absolute',
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    backgroundColor: 'rgba(0, 230, 118, 0.05)',
  },
  haloRing2: {
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  logoContainer: {
    width: scale(88),
    height: scale(88),
    borderRadius: scale(44),
    backgroundColor: '#121824',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
  },
  candlestickBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: verticalScale(42),
    width: scale(48),
    paddingBottom: verticalScale(2),
  },
  barLeft: {
    width: scale(5),
    backgroundColor: Colors.secondary,
    borderRadius: moderateScale(2.5),
    marginRight: scale(4),
  },
  barCenter: {
    width: scale(6),
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(3),
    marginRight: scale(4),
  },
  barRight: {
    width: scale(6),
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(3),
    marginRight: scale(4),
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: scale(4.5),
    borderRightWidth: scale(4.5),
    borderBottomWidth: scale(9),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.secondary,
    alignSelf: 'flex-start',
    marginTop: verticalScale(2),
  },
  textGroup: {
    alignItems: 'center',
    marginTop: verticalScale(22),
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(26),
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandHighlight: {
    color: Colors.primary,
    fontWeight: '300',
  },
  taglineBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
    marginTop: verticalScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  taglineText: {
    color: Colors.textSecondary,
    fontSize: moderateScale(9.5),
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  footer: {
    alignItems: 'center',
    width: '82%',
  },
  progressBarWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: verticalScale(4),
    backgroundColor: '#161E2E',
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(2),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(10),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(14),
  },
  securityPillText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: moderateScale(8.5),
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: scale(4),
  },
});
