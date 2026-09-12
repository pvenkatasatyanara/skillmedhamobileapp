import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, PageHeader, PrimaryButton } from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { normalizeQuestions, correctAnswer, isAnswerCorrect } from '../utils/questions';

export default function PracticeSessionScreen({ route, navigation }) {
  const { token, user } = useAuth();
  const { refId, type = 'subjectId', title = 'Practice', difficulty } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const pracIdRef = useRef(null);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.startPractice(token, {
          userId: user?.globalId || user?._id,
          refId,
          type,
          limit: 15,
          difficulty: difficulty || undefined,
        });
        if (!alive) return;
        const qs = normalizeQuestions({ questionsData: res?.questionsData || [] });
        if (!qs.length) throw new Error('No practice questions available for this set.');
        pracIdRef.current = res?.data?.insertedId || res?.data?._id;
        setQuestions(qs);
      } catch (e) {
        if (alive) setError(e.message || 'Could not start practice.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, refId, type, difficulty]);

  const current = questions[idx];
  const correct = current ? correctAnswer(current) : [];
  const autoScorable = correct.length > 0;

  const choose = (key, multiple) => {
    if (revealed) return;
    setSelected((prev) => {
      if (multiple) return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      return [key];
    });
  };

  const check = () => {
    if (!selected.length && autoScorable) return;
    setRevealed(true);
    if (autoScorable && isAnswerCorrect(current, selected)) setCorrectCount((c) => c + 1);
  };

  const next = async () => {
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
      setSelected([]);
      setRevealed(false);
      return;
    }
    // finished -> save
    setSaving(true);
    try {
      if (pracIdRef.current) {
        await api.savePracResults(token, pracIdRef.current, {
          score: correctCount,
          correct: correctCount,
          total: questions.length,
          completedAt: new Date().getTime(),
          difficulty: difficulty || null,
        });
      }
    } catch (_) {}
    setSaving(false);
    setFinished(true);
  };

  if (loading) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={title} size="sm" />
        <LoadingState />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={title} size="sm" />
        <ErrorState message={error} onRetry={() => navigation.goBack()} />
      </Screen>
    );
  }
  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <Screen edges={['top']}>
        <PageHeader title="Practice complete" size="sm" showBack={false} />
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.md }}>
          <LinearGradient colors={[colors.brand600, colors.brand900]} style={styles.doneHero}>
            <Ionicons name="ribbon" size={s(40)} color={colors.white} />
            <Text style={styles.doneScore}>{pct}%</Text>
            <Text style={styles.doneSub}>
              {correctCount} / {questions.length} correct
            </Text>
          </LinearGradient>
          <PrimaryButton title="Done" style={{ marginTop: spacing.lg }} onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  if (!current) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={title} size="sm" />
        <EmptyState emoji="⚡" title="No questions" />
      </Screen>
    );
  }

  const multiple = current.kind === 'multiple';

  return (
    <Screen edges={['top']}>
      <PageHeader title={title} size="sm" />
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Question {idx + 1} / {questions.length}
        </Text>
        <Text style={styles.scoreText}>Score {correctCount}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.qBox}>
          <Text style={styles.qText}>{current.question}</Text>
        </View>

        {autoScorable ? (
          <View style={styles.options}>
            {(current.kind === 'truefalse' ? [{ key: 'true', text: 'True' }, { key: 'false', text: 'False' }] : current.options).map(
              (opt) => {
                const on = selected.includes(opt.key);
                const isCorrect = correct.includes(opt.key.toLowerCase());
                let style = styles.option;
                if (revealed && isCorrect) style = [styles.option, styles.optionCorrect];
                else if (revealed && on && !isCorrect) style = [styles.option, styles.optionWrong];
                else if (on) style = [styles.option, styles.optionOn];
                return (
                  <TouchableOpacity key={opt.key} style={style} onPress={() => choose(opt.key, multiple)} activeOpacity={0.8}>
                    <Ionicons
                      name={
                        revealed && isCorrect
                          ? 'checkmark-circle'
                          : revealed && on && !isCorrect
                          ? 'close-circle'
                          : multiple
                          ? on
                            ? 'checkbox'
                            : 'square-outline'
                          : on
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={s(20)}
                      color={revealed && isCorrect ? colors.ok : revealed && on ? colors.danger : on ? colors.brand600 : '#94a3b8'}
                    />
                    <Text style={styles.optionText}>{opt.text}</Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        ) : (
            <Text style={styles.note}>
                This question type isn&apos;t auto-scored. Review the explanation after revealing.
            </Text>
        )}

{revealed && !!current.explanation && (
    <View style={styles.explain}>
      <Text style={styles.explainLabel}>Explanation</Text>
      <Text style={styles.explainText}>{current.explanation}</Text>
    </View>
)}
</ScrollView>

<View style={styles.footer}>
  {!revealed ? (
    <PrimaryButton
      title={autoScorable ? 'Check answer' : 'Reveal'}
      onPress={check}
      disabled={autoScorable && !selected.length}
    />
  ) : (
    <PrimaryButton
      title={idx < questions.length - 1 ? 'Next question' : 'Finish'}
      loading={saving}
      onPress={next}
    />
  )}
</View>
</Screen>
);
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    marginBottom: spacing.sm,
  },
  progressText: { fontSize: font(12.5), fontWeight: '700', color: colors.muted },
  scoreText: { fontSize: font(12.5), fontWeight: '800', color: colors.brand700 },
  qBox: { paddingHorizontal: spacing.gutter, marginBottom: spacing.md },
  qText: { fontSize: font(15), fontWeight: '700', color: colors.ink, lineHeight: font(22) },
  options: { paddingHorizontal: spacing.gutter, gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  optionOn: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
  optionCorrect: { borderColor: colors.ok, backgroundColor: colors.okBg },
  optionWrong: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  optionText: { flex: 1, fontSize: font(13.5), color: '#334155' },
  note: { paddingHorizontal: spacing.gutter, color: colors.muted, fontSize: font(13), lineHeight: font(19) },
  explain: {
    marginHorizontal: spacing.gutter,
    marginTop: spacing.lg,
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  explainLabel: { fontSize: font(11), fontWeight: '800', color: colors.brand700, textTransform: 'uppercase', letterSpacing: 1 },
  explainText: { fontSize: font(13), color: colors.ink, lineHeight: font(20), marginTop: s(4) },
  doneHero: { borderRadius: radius.xxl, padding: spacing.xl, alignItems: 'center' },
  doneScore: { color: colors.white, fontSize: font(34), fontWeight: '900', marginTop: s(8) },
  doneSub: { color: 'rgba(255,255,255,0.85)', fontSize: font(13), marginTop: s(2) },
  footer: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
});