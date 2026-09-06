import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';

/**
 * Unified loading / error / empty placeholder for list & data screens.
 */
export function LoadingState({ style }) {
  return (
    <View style={[styles.box, style]}>
      <ActivityIndicator color={colors.brand600} size="large" />
    </View>
  );
}

export function ErrorState({ message, onRetry, style }) {
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.text}>{message || 'Something went wrong.'}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function EmptyState({ emoji = '📭', title, subtitle, style }) {
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.text}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 1.5,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emoji: { fontSize: font(34) },
  title: { fontSize: font(15), fontWeight: '800', color: colors.ink },
  text: { fontSize: font(13), color: colors.muted, textAlign: 'center' },
  retry: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { color: colors.brand700, fontWeight: '700', fontSize: font(13) },
});

export default { LoadingState, ErrorState, EmptyState };