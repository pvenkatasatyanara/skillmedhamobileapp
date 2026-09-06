import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, font, s } from '../theme';

/**
 * Primary / secondary action button matching the prototype `_prim`.
 */
export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  height = 54,
}) {
  const isSecondary = variant === 'secondary';
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { height: s(height) },
        isSecondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.brand700 : colors.white} />
      ) : (
        <Text
          style={[styles.text, isSecondary ? styles.textSecondary : styles.textPrimary, textStyle]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.brand900,
    shadowColor: colors.brand900,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  disabled: { opacity: 0.7 },
  text: { fontWeight: '800', fontSize: font(15) },
  textPrimary: { color: colors.white },
  textSecondary: { color: colors.brand700 },
});