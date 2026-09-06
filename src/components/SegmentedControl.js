import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, s } from '../theme';

/**
 * iOS-style segmented control matching the prototype's `.segment`.
 * `options` is an array of strings; `value` is the selected string.
 */
export default function SegmentedControl({ options, value, onChange, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.btn, active && styles.btnActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#eceefb',
    borderRadius: radius.md,
    padding: s(4),
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: s(8),
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: { fontWeight: '700', fontSize: font(12.5), color: colors.muted },
  textActive: { color: colors.brand700 },
});