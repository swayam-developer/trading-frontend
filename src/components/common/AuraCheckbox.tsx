import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import { Colors } from '../../theme/colors';

interface AuraCheckboxProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  label?: React.ReactNode;
}

export const AuraCheckbox: React.FC<AuraCheckboxProps> = ({
  value,
  onValueChange,
  label,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      <View style={[styles.box, value && styles.boxChecked]}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && <View style={styles.labelContainer}>{label}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: scale(20),
    height: scale(20),
    borderRadius: moderateScale(4),
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  checkmark: {
    color: Colors.background,
    fontSize: moderateScale(13),
    fontWeight: '900',
    marginTop: -1,
  },
  labelContainer: {
    marginLeft: scale(10),
    flex: 1,
  },
});
