import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, font, s } from '../theme';

/**
 * Sub-screen header with an optional back button and a title.
 * size controls the title font (prototype uses larger titles for top-level
 * pages and smaller ones for detail pages).
 */
export default function PageHeader({ title, showBack = true, right, size = 'lg' }) {
  const navigation = useNavigation();
  const titleSize = size === 'lg' ? font(22) : font(16);

  return (
    <View style={styles.wrap}>
      {showBack ? (
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={font(20)} color={colors.ink} />
        </TouchableOpacity>
      ) : null}
      <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: s(38),
    height: s(38),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800', color: colors.ink, flex: 1 },
  right: { marginLeft: 'auto' },
});