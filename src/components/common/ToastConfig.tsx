import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface CustomToastProps {
  title?: string;
  message?: string;
  dateRange?: string;
  iconName: string;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  onPress?: () => void;
  onClose?: () => void;
}

const CustomToastCard: React.FC<CustomToastProps> = ({
  title,
  message,
  dateRange,
  iconName,
  iconColor,
  iconBg,
  borderColor,
  onPress,
  onClose,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.toastContainer, { borderColor }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={moderateScale(18)} color={iconColor} />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          {dateRange ? (
            <View style={[styles.dateBadge, { borderColor }]}>
              <Text style={[styles.dateBadgeText, { color: iconColor }]}>{dateRange}</Text>
            </View>
          ) : null}
        </View>

        {message ? (
          <Text style={styles.messageText} numberOfLines={3}>
            {message}
          </Text>
        ) : null}
      </View>

      {onClose ? (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close" size={moderateScale(14)} color={Colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

export const toastConfig: ToastConfig = {
  // Market is Open (Neon Emerald)
  market_open: ({ text1, text2, props, hide }: ToastConfigParams<any>) => (
    <CustomToastCard
      title={text1 || 'Market is Open 🟢'}
      message={text2 || 'Live trading is active.'}
      dateRange={props?.dateRange}
      iconName="trending-up-outline"
      iconColor={Colors.primary}
      iconBg="rgba(0, 230, 118, 0.15)"
      borderColor="rgba(0, 230, 118, 0.4)"
      onPress={props?.onPress}
      onClose={hide}
    />
  ),

  // Market is Closed (Crimson/Amber)
  market_closed: ({ text1, text2, props, hide }: ToastConfigParams<any>) => (
    <CustomToastCard
      title={text1 || 'Market is Closed 🔴'}
      message={text2 || 'Trading will resume during regular market hours.'}
      dateRange={props?.dateRange}
      iconName="time-outline"
      iconColor="#FFAB00"
      iconBg="rgba(255, 171, 0, 0.15)"
      borderColor="rgba(255, 171, 0, 0.4)"
      onPress={props?.onPress}
      onClose={hide}
    />
  ),

  // Market Holiday Today (Gold/Sun)
  market_holiday: ({ text1, text2, props, hide }: ToastConfigParams<any>) => (
    <CustomToastCard
      title={text1 || 'Market Holiday Today 🏖️'}
      message={text2 || 'Markets are closed in observance of a scheduled holiday.'}
      dateRange={props?.dateRange || 'Holiday'}
      iconName="calendar-outline"
      iconColor="#FFD700"
      iconBg="rgba(255, 215, 0, 0.15)"
      borderColor="rgba(255, 215, 0, 0.45)"
      onPress={props?.onPress}
      onClose={hide}
    />
  ),

  // Upcoming Closure / Date Range (Electric Cyan / Purple)
  market_closure_range: ({ text1, text2, props, hide }: ToastConfigParams<any>) => (
    <CustomToastCard
      title={text1 || 'Upcoming Market Closure ⏳'}
      message={text2 || 'Markets will be closed for the upcoming scheduled period.'}
      dateRange={props?.dateRange}
      iconName="calendar-number-outline"
      iconColor={Colors.secondary}
      iconBg="rgba(0, 229, 255, 0.15)"
      borderColor="rgba(0, 229, 255, 0.4)"
      onPress={props?.onPress}
      onClose={hide}
    />
  ),

  // Success Toast
  success: ({ text1, text2, props, hide }: ToastConfigParams<any>) => (
    <CustomToastCard
      title={text1 || 'Success'}
      message={text2}
      dateRange={props?.dateRange}
      iconName="checkmark-circle-outline"
      iconColor={Colors.primary}
      iconBg="rgba(0, 230, 118, 0.15)"
      borderColor="rgba(0, 230, 118, 0.3)"
      onPress={props?.onPress}
      onClose={hide}
    />
  ),

  // Error Toast
  error: ({ text1, text2, props, hide }: ToastConfigParams<any>) => (
    <CustomToastCard
      title={text1 || 'Error'}
      message={text2}
      dateRange={props?.dateRange}
      iconName="alert-circle-outline"
      iconColor={Colors.error}
      iconBg="rgba(255, 82, 82, 0.15)"
      borderColor="rgba(255, 82, 82, 0.4)"
      onPress={props?.onPress}
      onClose={hide}
    />
  ),

  // Info Toast
  info: ({ text1, text2, props, hide }: ToastConfigParams<any>) => (
    <CustomToastCard
      title={text1 || 'Information'}
      message={text2}
      dateRange={props?.dateRange}
      iconName="information-circle-outline"
      iconColor={Colors.secondary}
      iconBg="rgba(0, 229, 255, 0.15)"
      borderColor="rgba(0, 229, 255, 0.3)"
      onPress={props?.onPress}
      onClose={hide}
    />
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '92%',
    backgroundColor: '#161E2E',
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    marginTop: verticalScale(6),
  },
  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(2),
  },
  titleText: {
    fontSize: moderateScale(13.5),
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: 0.2,
  },
  dateBadge: {
    borderWidth: 1,
    borderRadius: moderateScale(6),
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    marginLeft: scale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dateBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  messageText: {
    fontSize: moderateScale(11.5),
    color: Colors.textSecondary,
    lineHeight: moderateScale(16),
    marginTop: verticalScale(1),
  },
  closeBtn: {
    padding: moderateScale(4),
    marginLeft: scale(6),
  },
});
