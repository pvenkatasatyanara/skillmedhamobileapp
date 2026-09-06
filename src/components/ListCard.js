import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, s } from '../theme';

const ICON_VARIANTS = {
  default: { bg: colors.brand50, fg: colors.brand700 },
  green: { bg: colors.okBg, fg: colors.okText },
  yellow: { bg: colors.warnBg, fg: colors.warnText },
  red: { bg: colors.dangerBg, fg: colors.dangerText },
  pink: { bg: colors.pinkBg, fg: colors.pinkText },
};

/**
 * Horizontal list row: leading icon, title + subtitle, optional trailing node.
 * `renderIcon` receives the resolved foreground colour so vector icons match.
 */
export default function ListCard({
  title,
  subtitle,
  iconEmoji,
  renderIcon,
  iconVariant = 'default',
  right,
  onPress,
  style,
  subtitleLines = 2,
}) {
  const v = ICON_VARIANTS[iconVariant] || ICON_VARIANTS.default;
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity= {0.7}>
      <View style={[styles.lic, { backgroundColor: v.bg }]}>
        {renderIcon ? renderIcon(v.fg) : <Text style={styles.emoji}>{iconEmoji}</Text>}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.sub} numberOfLines={subtitleLines}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
  },
  lic: {
    width: s(46),
    height: s(46),
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: font(18) },
  body: { flex: 1 },
  title: { fontSize: font(14), fontWeight: '700', color: colors.ink },
  sub: { fontSize: font(11.5), color: colors.muted, marginTop: s(3) },
  right: { marginLeft: spacing.sm },
});