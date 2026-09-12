import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';

import { Screen, PageHeader, SectionHeader, Chip, PrimaryButton, ProgressBar } from '../components';
import { LoadingState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { stripHtml } from '../utils/format';

export default function ATSScreen() {
  const { token, user } = useAuth();
  const studentId = user?._id;
  const [current, setCurrent] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    api
      .atsGetCurrentResume(token, studentId)
      .then((res) => setCurrent(res?.data || res || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, studentId]);

  const runAnalyze = async (resumeInfo) => {
    setBusy(true);
    setAnalysis(null);
    try {
      const res = await api.atsAnalyze(token, {
        blobName: resumeInfo?.blobName || resumeInfo?.fileKey,
        fileUrl: resumeInfo?.fileUrl || resumeInfo?.url,
        resumeId: resumeInfo?.resumeId || resumeInfo?._id,
        studentId,
        jobDescription,
      });
      setAnalysis(normalizeAnalysis(res));
    } catch (e) {
      Alert.alert('Analysis failed', e?.message || 'Could not analyze the resume right now.');
    } finally {
      setBusy(false);
    }
  };

  const uploadAndAnalyze = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please choose a file up to 5 MB.');
        return;
      }
      setBusy(true);
      const up = await api.atsUploadResume(token, {
        file: { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/pdf' },
        studentId,
      });
      const info = up?.data || up || {};
      setCurrent(info);
      await runAnalyze(info);
    } catch (e) {
      setBusy(false);
      Alert.alert('Upload failed', e?.message || 'Could not upload the resume.');
    }
  };

  return (
    <Screen edges={['top']}>
      <PageHeader title="ATS Score Check" size="sm" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={styles.intro}>
          Scan your resume against a job description to see how well it passes Applicant Tracking Systems.
        </Text>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <SectionHeader title="Your resume" />
            <View style={{ paddingHorizontal: spacing.gutter }}>
              {current?.fileUrl || current?.url || current?.blobName ? (
                <View style={styles.fileRow}>
                  <Ionicons name="document-text-outline" size={s(22)} color={colors.brand600} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {current.fileName || current.name || 'Resume on file'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.muted}>No resume on file. Upload one to analyze.</Text>
              )}
            </View>

            <SectionHeader title="Target job description (optional)" />
            <View style={{ paddingHorizontal: spacing.gutter }}>
              <TextInput
                style={styles.jd}
                placeholder="Paste a job description to match keywords..."
                placeholderTextColor={colors.muted}
                value={jobDescription}
                onChangeText={setJobDescription}
                multiline
                maxLength={5000}
              />
            </View>

            <View style={styles.actions}>
              <PrimaryButton
                title="Upload & Analyze"
                variant="secondary"
                height={48}
                style={{ flex: 1 }}
                onPress={uploadAndAnalyze}
                disabled={busy}
              />
              <PrimaryButton
                title="Analyze"
                height={48}
                style={{ flex: 1 }}
                loading={busy}
                disabled={busy || !(current?.fileUrl || current?.url || current?.blobName)}
                onPress={() => runAnalyze(current)}
              />
            </View>

            {analysis && <Report analysis={analysis} />}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Report({ analysis }) {
  const grade = gradeFor(analysis.score);
  return (
    <>
      <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.lg }}>
        <LinearGradient colors={[colors.brand50, colors.white]} style={styles.scoreCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.scoreLabel}>ATS Score</Text>
              <Text style={styles.scoreSub}>{grade.label}</Text>
            </View>
            <Text style={[styles.scoreValue, { color: grade.color }]}>
              {analysis.score != null ? analysis.score : '-'}
              <Text style={styles.scoreMax}>/100</Text>
            </Text>
          </View>
          {analysis.score != null && (
            <ProgressBar progress={analysis.score} fill={grade.color} track={colors.white} style={{ marginTop: s(10) }} />
          )}
        </LinearGradient>
      </View>

      {analysis.categories.length > 0 && (
        <>
          <SectionHeader title="Category scores" />
          <View style={{ paddingHorizontal: spacing.gutter, gap: spacing.md }}>
            {analysis.categories.map((c, i) => (
              <View key={i}>
                <View style={styles.rowBetween}>
                  <Text style={styles.catName}>{c.name}</Text>
                  <Text style={styles.catScore}>{c.score}%</Text>
                </View>
                <ProgressBar progress={c.score} style={{ marginTop: s(4) }} />
              </View>
            ))}
          </View>
        </>
      )}

      {analysis.strengths.length > 0 && (
        <>
          <SectionHeader title="Strengths" />
          {analysis.strengths.map((x, i) => (
            <Bullet key={i} icon="checkmark-circle-outline" color={colors.ok} text={x} />
          ))}
        </>
      )}

      {analysis.issues.length > 0 && (
        <>
          <SectionHeader title="Critical issues" />
          {analysis.issues.map((x, i) => (
            <Bullet key={i} icon="alert-circle-outline" color={colors.danger} text={x} />
          ))}
        </>
      )}

      {analysis.suggestions.length > 0 && (
        <>
          <SectionHeader title="Suggestions" />
          {analysis.suggestions.map((x, i) => (
            <View key={i} style={styles.sugRow}>
              <Ionicons name="bulb-outline" size={s(16)} color={colors.warn} />
              <View style={{ flex: 1 }}>
                {!!x.priority && <Chip label={x.priority} variant={priorityVariant(x.priority)} />}
                <Text style={styles.sugText}>{x.text}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </>
  );
}

function Bullet({ icon, color, text }) {
  return (
    <View style={styles.bullet}>
      <Ionicons name={icon} size={s(18)} color={color} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function normalizeAnalysis(res) {
  const a = res?.data || res?.analysis || res || {};
  let score = a.overallScore ?? a.score ?? a.atsScore ?? null;
  if (typeof score === 'string') score = parseInt(score, 10);
  if (Number.isNaN(score)) score = null;

  let categories = [];
  const cs = a.categoryScores || a.categories;
  if (Array.isArray(cs)) {
    categories = cs.map((c) => ({ name: c.name || c.category || 'Category', score: num(c.score ?? c.value) }));
  } else if (cs && typeof cs === 'object') {
    categories = Object.entries(cs).map(([name, v]) => ({ name, score: num(typeof v === 'object' ? v.score : v) }));
  }

  const strengths = (a.strengths || []).map((x) => stripHtml(typeof x === 'string' ? x : x.text || x.title)).filter(Boolean);
  const issues = (a.criticalIssues || a.issues || []).map((x) => stripHtml(typeof x === 'string' ? x : x.text || x.title)).filter(Boolean);
  const suggestions = (a.suggestions || a.recommendations || []).map((x) => ({
    text: stripHtml(typeof x === 'string' ? x : x.suggestion || x.text || x.title),
    priority: typeof x === 'object' ? x.priority : null,
  })).filter((x) => x.text);

  return { score, categories, strengths, issues, suggestions };
}

function num(v) {
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return Number.isNaN(n) || n == null ? 0 : Math.max(0, Math.min(100, n));
}

function gradeFor(score) {
  if (score == null) return { label: 'Not analyzed', color: colors.muted };
  if (score >= 85) return { label: 'Excellent', color: colors.ok };
  if (score >= 70) return { label: 'Good', color: colors.ok };
  if (score >= 50) return { label: 'Needs work', color: colors.warn };
  return { label: 'Poor', color: colors.danger };
}

function priorityVariant(p) {
  const s2 = String(p).toLowerCase();
  if (s2.includes('high')) return 'red';
  if (s2.includes('med')) return 'yellow';
  return 'green';
}

const styles = StyleSheet.create({
  intro: {
    fontSize: font(13),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: font(19),
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  muted: { color: colors.muted, fontSize: font(13) },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  fileName: { flex: 1, fontSize: font(13.5), fontWeight: '700', color: colors.ink },
  jd: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font(13),
    color: colors.ink,
    minHeight: s(90),
    textAlignVertical: 'top',
    backgroundColor: colors.white,
  },
  actions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.gutter, marginTop: spacing.lg },
  scoreCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.lg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: font(14), fontWeight: '800', color: colors.ink },
  scoreSub: { fontSize: font(12), color: colors.muted, marginTop: s(2) },
  scoreValue: { fontSize: font(30), fontWeight: '900' },
  scoreMax: { fontSize: font(14), color: colors.muted },
  catName: { fontSize: font(12.5), fontWeight: '600', color: colors.ink },
  catScore: { fontSize: font(12.5), fontWeight: '700', color: colors.brand700 },
  bullet: { flexDirection: 'row', gap: s(8), alignItems: 'flex-start', paddingHorizontal: spacing.gutter, paddingVertical: s(6) },
  bulletText: { flex: 1, fontSize: font(13), color: colors.ink, lineHeight: font(19) },
  sugRow: { flexDirection: 'row', gap: s(8), alignItems: 'flex-start', paddingHorizontal: spacing.gutter, paddingVertical: s(6) },
  sugText: { fontSize: font(13), color: colors.ink, lineHeight: font(19), marginTop: s(2) },
});