import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, PageHeader, PrimaryButton } from '../components';
import { LoadingState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function TestResultScreen({ route, navigation }) {
  const { token } = useAuth();
  const progressId = route.params?.progressId;
  const testTitle = route.params?.testTitle || 'Test';
  const [loading, setLoading] = useState(!progressId);
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    if (!progressId) return;
    api
      .getResultsData(token, progressId)
      .then((r) => {
        const d = r?.data || r || {};
        setScoreData(d.scoreData || d.result?.scoreData || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, progressId]);

  const sd = scoreData || {};
  const correct = Number(sd.correctQues) || 0;
  const incorrect = Number(sd.incorrectQues) || 0;
  const notAnswered = (Number(sd.notAnswered) || 0) + (Number(sd.unattemptedQues) || 0);
  const total = correct + incorrect + notAnswered;
  const pct = total > 0 ? Math.round((correct / total) * 100) : null;
  const const_grade = pct == null ? colors.brand600 : pct >= 60 ? colors.ok : pct >= 40 ? colors.warn : colors.danger;

  return (
    <Screen edges={['top']}>
      <PageHeader title="Test Result" size="sm" showBack={false} />
      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.md }}>
            <LinearGradient colors={[colors.brand600, colors.brand900]} style={styles.hero}>
              <Ionicons name="checkmark-circle" size={s(40)} color={colors.white} />
              <Text style={styles.heroTitle}>Submitted!</Text>
              <Text style={styles.heroSub} numberOfLines={2}>
                {testTitle}
              </Text>
              {pct != null && (
                <View style={styles.scorePill}>
                  <Text style={styles.scorePillText}>{pct}%</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {scoreData ? (
            <View style={styles.stats}>
              <Stat value={correct} label="Correct" color={colors.ok} />
              <Stat value={incorrect} label="Incorrect" color={colors.danger} />
              <Stat value={notAnswered} label="Skipped" color={colors.muted} />
            </View>
          ) : (
            <Text style={styles.note}>
              Your response was submitted. Detailed results may be released by your institution.
            </Text>
          )}

          {scoreData && (
            <View style={styles.detailCard}>
              <Row label="Final score" value={`${sd.finalScore ?? 0}`} />
              <Row label="Total questions" value={`${total}`} />
              {sd.totalTimeTaken != null && <Row label="Time taken" value={`${Math.round(sd.totalTimeTaken)}s`} />}
            </View>
          )}

          <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.lg }}>
            <PrimaryButton
              title="Back to Assessments"
              onPress={() => navigation.navigate('MainTabs')}
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function Stat({ value, label, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xxl, padding: spacing.xl, alignItems: 'center' },
  heroTitle: { color: colors.white, fontSize: font(20), fontWeight: '900', marginTop: s(8) },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: font(13), marginTop: s(4), textAlign: 'center' },
  scorePill: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
    paddingHorizontal: s(18),
    paddingVertical: s(6),
  },
  scorePillText: { color: colors.white, fontSize: font(20), fontWeight: '900' },

  stats: { flexDirection: 'row', paddingHorizontal: spacing.gutter, gap: spacing.md, marginTop: spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: font(22), fontWeight: '900' },
  statLabel: { fontSize: font(11), color: colors.muted, marginTop: s(2) },

  note: { paddingHorizontal: spacing.xl, color: colors.muted, fontSize: font(13), textAlign: 'center', marginTop: spacing.lg, lineHeight: font(20) },

  detailCard: {
    marginHorizontal: spacing.gutter,
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: { fontSize: font(13), color: colors.muted },
  rowValue: { fontSize: font(13), fontWeight: '800', color: colors.ink },
});