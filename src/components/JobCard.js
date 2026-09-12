import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Chip from './Chip';
import { colors, radius, spacing, font, s } from '../theme';
import { formatCtc, timeAgo, initialsOf } from '../utils/format';
import { isPlacementDrive } from '../utils/jobs';

/**
 * Single job tile used across the merged jobs list. Placement drives (created by
 * TPO) and company openings are shown in one list and told apart with a label.
 */
export default function JobCard({ job, applied, statusInfo, onPress }) {
  const drive = isPlacementDrive(job);
  const meta = [job.city, formatCtc(job.ctc), job.jobType || job.workModel].filter(Boolean).join(' • ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.logo, drive ? styles.logoDrive : styles.logoCompany]}>
        <Text style={styles.logoText}>{initialsOf(job.companyName || job.jobTitle || 'J')}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {job.jobTitle || 'Job opening'}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {job.companyName || 'Company'}
          {meta ? ` • ${meta}` : ''}
        </Text>

        <View style={styles.chipsRow}>
          <Chip label={drive ? 'Created by TPO' : 'Company'} variant={drive ? 'default' : 'green'} />
          {applied && statusInfo ? (
            <Chip label={statusInfo.label} variant={statusInfo.variant} />
          ) : (
            <Chip label="Not Applied" variant="yellow" />
          )}
          {job.createdAt ? <Text style={styles.time}>{timeAgo(job.createdAt)}</Text> : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={s(18)} color="#cbd5e1" />
    </TouchableOpacity>
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
  logo: {
    width: s(46),
    height: s(46),
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDrive: { backgroundColor: colors.brand50 },
  logoCompany: { backgroundColor: colors.okBg },
  logoText: { fontSize: font(15), fontWeight: '800', color: colors.brand700 },
  body: { flex: 1 },
  title: { fontSize: font(14), fontWeight: '700', color: colors.ink },
  company: { fontSize: font(11.5), color: colors.muted, marginTop: s(3) },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(8), flexWrap: 'wrap' },
  time: { fontSize: font(10.5), color: colors.muted },
});