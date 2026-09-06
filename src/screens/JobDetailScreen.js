import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader, Card, SectionHeader, Chip, ProgressBar, PrimaryButton } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { formatCtc, stripHtml } from '../utils/format';

export default function JobDetailsScreen({ route }) {
  const job = route.params?.job || {};
  const [applied, setApplied] = useState(!!job.isAssignedJob);

  const meta = [job.city, formatCtc(job.ctc), job.jobType].filter(Boolean).join(' • ');
  const description = stripHtml(job.jobDescription) || 'No description provided.';
  const rounds = Array.isArray(job.interviewRounds) ? job.interviewRounds : [];
  const perks = Array.isArray(job.supplementalPay) ? job.supplementalPay : [];
  const eligibility = Array.isArray(job.eligibilityCriteria) ? job.eligibilityCriteria : [];

  return (
    <Screen edges={['top']}>
      <PageHeader title="Job details" size="sm" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.sm }}>
          <Card>
            <Text style={styles.title}>{job.jobTitle || 'Job'}</Text>
            <Text style={styles.company}>
              {[job.companyName, meta].filter(Boolean).join(' • ')}
            </Text>
            <View style={styles.badges}>
              {!!job.sector && <Chip label={job.sector} variant="default" />}
              {job.remoteWorkAllowed === 'yes' && <Chip label="Remote OK" variant="green" />}
            </View>
          </Card>
        </View>

        {/* AI fit */}
        <SectionHeader title="AI resume match" />
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.fitLabel}>Your fit score</Text>
              <Chip label="Strong" variant="green" />
            </View>
            <ProgressBar
              progress={88}
              track={colors.brand50}
              fill={colors.ok}
              style={{ marginTop: s(10) }}
            />
            <Text style={styles.fitNote}>
              React, Java & DSA matched. Add "System Design" to improve your score.
            </Text>
          </Card>
        </View>

        {/* Description */}
        <SectionHeader title="About the role" />
        <Text style={[styles.body]}>{description}</Text>

        {/* Eligibility */}
        {eligibility.length > 0 && (
          <>
            <SectionHeader title="Eligibility" />
            {eligibility.map((e, i) => (
              <View key={i} style={styles.bullet}>
                <Ionicons name="checkmark-circle-outline" size={s(18)} color={colors.ok} />
                <Text style={styles.bulletText}>
                  {e.educationLevel}
                  {e.minMarksPercentage ? ` • min ${e.minMarksPercentage}%` : ''}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Interview rounds */}
        {rounds.length > 0 && (
          <>
            <SectionHeader title="Interview process" />
            {rounds.map((r, i) => (
              <View key={r.id || i} style={styles.bullet}>
                <View style={styles.roundNum}>
                  <Text style={styles.roundNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roundTitle}>{r.roundName || r.type || `Round ${i + 1}`}</Text>
                  <Text style={styles.roundSub}>
                    {[r.type, r.mode, r.venue].filter(Boolean).join(' • ')}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Perks */}
        {perks.length > 0 && (
          <>
            <SectionHeader title="Perks & benefits" />
            <View style={styles.perksWrap}>
              {perks.map((p) => (
                <Chip key={p} label={p} variant="default" style={{ marginBottom: s(8) }} />
              ))}
            </View>
          </>
        )}

        <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.lg }}>
          <PrimaryButton
            title={applied ? 'Applied ✓' : 'Apply Now'}
            disabled={applied}
            onPress={() => {
              setApplied(true);
              Alert.alert('Application submitted', 'Your application has been sent.');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font(17), fontWeight: '800', color: colors.ink },
  company: { fontSize: font(12.5), color: colors.muted, marginTop: s(3) },
  badges: { flexDirection: 'row', gap: s(6), marginTop: spacing.md, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fitLabel: { fontSize: font(13), fontWeight: '700', color: colors.ink },
  fitNote: { fontSize: font(12), color: colors.muted, marginTop: s(10), lineHeight: font(18) },
  body: {
    fontSize: font(13.5),
    lineHeight: font(21),
    color: '#475569',
    paddingHorizontal: spacing.gutter,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    paddingVertical: s(8),
  },
  bulletText: { flex: 1, fontSize: font(13), color: colors.ink },
  roundNum: {
    width: s(26),
    height: s(26),
    borderRadius: s(8),
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNumText: { color: colors.brand700, fontWeight: '800', fontSize: font(12) },
  roundTitle: { fontSize: font(13.5), fontWeight: '700', color: colors.ink },
  roundSub: { fontSize: font(11.5), color: colors.muted, marginTop: s(2) },
  perksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    paddingHorizontal: spacing.gutter,
  },
});