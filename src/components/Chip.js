import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, radius, font, s } from '../theme';

const VARIANTS = {
  default: { bg: colors.brand50, fg: colors.brand700 },
  green: { bg: colors.okBg, fg: colors.okText },
  yellow: { bg: colors.warnBg, fg: colors.warnText },
  red: { bg: colors.dangerBg, fg: colors.dangerText },
  pink: { bg: colors.pinkBg, fg: colors.pinkText },
  light: { bg: 'rgba(255,255,255,0.2)', fg: colors.white },
};

export function chipVariantForPriority(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'default';
  }
}

export default function Chip({ label, variant = 'default', style, textStyle }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <View style={[styles.chip, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.fg }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    alignSelf: 'flex-start',
  },
  text: { fontSize: font(11), fontWeight: '700' },
});