import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing, font, s } from '../theme';
import { thumbColor, stripHtml } from '../utils/format';

/**
 * Job-assessment card mirroring the web "Job Assessments" tiles:
 * gradient banner with faded initials + "All Levels" badge, title,
 * short description, question / time meta, attempts and a Start button.
 */
export default function AssessmentCard({
  title,
  description,
  level = 'All Levels',
  questions,
  duration,
  attemptsUsed = 0,
  maxAttempts,
  seed,
  onStart,
}) {
  const initials = initialsFromTitle(title);
  const [c1, c2] = thumbColor(seed ?? title ?? 0);
  const desc = stripHtml(description);
  const attemptsLabel = `${attemptsUsed} / ${maxAttempts || '∞'}`;

  return (
    <View style={styles.card}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <Text style={styles.bannerInitials}>{initials}</Text>
        <View style={styles.levelChip}>
          <Text style={styles.levelChipText}>{level}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title || 'Assessment'}
        </Text>
        {!!desc && (
          <Text style={styles.desc} numberOfLines={2}>
            {desc}
          </Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="help-circle-outline" size={s(15)} color={colors.muted} />
            <Text style={styles.metaText}>{questions != null ? `${questions} QS` : '-'}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={s(15)} color={colors.muted} />
            <Text style={styles.metaText}>{duration || 'NA'}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.attemptsLabel}>ATTEMPTS</Text>
            <Text style={styles.attemptsValue}>{attemptsLabel} left</Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
            <Ionicons name="play" size={s(14)} color={colors.white} />
            <Text style={styles.startBtnText}>Start test</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function initialsFromTitle(title) {
  if (!title) return 'AS';
  const words = String(title).trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  banner: {
    height: s(96),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerInitials: {
    fontSize: font(40),
    fontWeight: '900',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
  },
  levelChip: {
    position: 'absolute',
    left: s(10),
    bottom: s(10),
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: s(10),
    paddingVertical: s(4),
  },
  levelChipText: { color: colors.white, fontSize: font(10.5), fontWeight: '700' },

  body: { padding: spacing.md },
  title: { fontSize: font(15), fontWeight: '800', color: colors.ink },
  desc: { fontSize: font(11.5), color: colors.muted, marginTop: s(4), lineHeight: font(17) },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: s(10),
    paddingHorizontal: s(12),
    marginTop: spacing.md,
  },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(6), justifyContent: 'center' },
  metaDivider: { width: 1, height: s(20), backgroundColor: colors.line },
  metaText: { fontSize: font(12), fontWeight: '700', color: colors.ink },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  attemptsLabel: { fontSize: font(9.5), fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  attemptsValue: { fontSize: font(12), fontWeight: '700', color: colors.ink, marginTop: s(2) },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: colors.brand600,
    borderRadius: radius.md,
    paddingHorizontal: s(16),
    paddingVertical: s(9),
  },
  startBtnText: { color: colors.white, fontSize: font(12.5), fontWeight: '800' },
});