import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

/**
 * Base screen wrapper: applies safe-area insets and the app background.
 * Pass `edges` to control which insets are applied (defaults to top).
 */
export default function Screen({
  children,
  style,
  edges = ['top'],
  background = colors.bg,
  statusBarStyle = 'dark',
}) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }, style]} edges={edges}>
      <StatusBar style={statusBarStyle} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});