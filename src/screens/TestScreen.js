import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  AppState,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Screen, PageHeader, PrimaryButton, Chip } from '../components';
import { LoadingState, ErrorState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { normalizeQuestions, LANGUAGES } from '../utils/questions';
import { testDurationSeconds } from '../utils/tests';
import useLiveProctoring from '../proctoring/useLiveProctoring';

export default function TestScreen({ route, navigation }) {
  const { token, user } = useAuth();
  const listItem = route.params?.test || {};
  const kind = route.params?.kind || 'test';

  const cameraRef = useRef(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { qid: string[] }
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [codeLang, setCodeLang] = useState(71);
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState('');

  const startedAtRef = useRef(new Date().toISOString());
  const tabSwitchRef = useRef(0);
  const timerRef = useRef(null);
  const [violation, setViolation] = useState(null);

  const proctored = test?.snapshotTechnology === 'Enable';
  const companyOrg = test?.companyOrg || test?.sourceOrgId || test?.orgId || null;
  const liveEnabled = proctored && !!companyOrg;

  // Frame source for Expo Go fallback (Agora uses its own camera in dev builds).
  const captureFrame = useCallback(async () => {
    try {
      if (!cameraRef.current) return null;
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true, skipProcessing: true });
      return pic?.base64 || null;
    } catch (_) {
      return null;
    }
  }, []);

  const proctoring = useLiveProctoring({
    enabled: liveEnabled,
    testId: test?._id || listItem._id,
    token,
    studentId: user?._id,
    companyOrg,
    captureFrame,
    onViolation: (d) => setViolation(d?.message || d?.reason || 'Proctoring alert'),
    onProctorMessage: () => {},
  });
  const { LocalVideo, latestMessage, mode: proctorMode, agoraAvailable } = proctoring;

  // ---- Load the full test with questions ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let full;
        if (kind === 'job') {
          const res = await api.getOneAssessment(token, listItem._id);
          full = res?.data || res;
        } else {
          full = await api.getOneTest(token, listItem._id);
        }
        if (!alive) return;
        const qs = normalizeQuestions(full || {});
        if (!qs.length) throw new Error('This test has no questions available.');
        setTest(full);
        setQuestions(qs);
        setTimeLeft(testDurationSeconds(full));
      } catch (e) {
        if (alive) setError(e.message || 'Could not load the test.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, listItem._id, kind]);

  // ---- Countdown timer ----
  useEffect(() => {
    if (loading || error || !questions.length) return undefined;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, questions.length]);

  // ---- HRT: count app backgrounding as "tab switches" ----
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        tabSwitchRef.current += 1;
      }
    });
    return () => sub.remove();
  }, []);

  // ---- Proctoring: request camera + start live proctoring session ----
  useEffect(() => {
    if (!proctored) return undefined;
    if (!agoraAvailable && !camPerm?.granted) requestCamPerm();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctored, camPerm?.granted, agoraAvailable]);

  useEffect(() => {
    if (!liveEnabled || loading || error || !questions.length) return undefined;
    const t = setTimeout(() => proctoring.start(), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveEnabled, loading, error, questions.length]);

  const current = questions[idx];

  const setAnswer = (qid, value) => setAnswers((p) => ({ ...p, [qid]: value }));

  const toggleOption = (qid, optKey, multiple) => {
    setAnswers((p) => {
      const prev = p[qid] || [];
      if (multiple) {
        return { ...p, [qid]: prev.includes(optKey) ? prev.filter((k) => k !== optKey) : [...prev, optKey] };
      }
      return { ...p, [qid]: [optKey] };
    });
  };

  const clearResponse = () => {
    if (!current) return;
    setAnswers((p) => {
      const c = { ...p };
      delete c[current._id];
      return c;
    });
  };

  const runCode = async () => {
    if (!current) return;
    setRunning(true);
    setRunOutput('');
    try {
      const res = await api.runCode({ languageId: codeLang, sourceCode: answers[current._id]?.[0] || '' });
      const out = res?.stdout || res?.compile_output || res?.stderr || res?.message || 'No output';
      setRunOutput(decodeB64(out));
    } catch (e) {
      setRunOutput(e?.message || 'Run failed.');
    } finally {
      setRunning(false);
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a && a.length).length;

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    clearInterval(timerRef.current);
    proctoring.stop();
    setSubmitting(true);
    try {
      const response = {};
      questions.forEach((q) => {
        const a = answers[q._id];
        if (a && a.length) response[q._id] = { answers: a, timeTaken: 0 };
      });
      const body = {
        studentId: user?._id,
        testId: test?._id || listItem._id,
        testTitle: test?.title || listItem.title || listItem.jobTitle,
        response,
        marked: Object.keys(marked).filter((k) => marked[k]),
        flagged: [],
        studentData: {
          'Full Name': `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.userName,
          Email: user?.email,
          capturedImage: null,
          tabswitchCount: tabSwitchRef.current,
          proctoringSession: proctorMode,
        },
        testStartedAt: startedAtRef.current,
        testEndedAt: new Date().toISOString(),
      };
      const res = await api.saveTestProgress(token, body);
      navigation.replace('TestResult', {
        progressId: res?.progressId,
        testTitle: body.testTitle,
      });
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Submit failed', e?.message || 'Could not submit your test.');
    }
  };

  const confirmSubmit = () => {
    Alert.alert(
      'Submit test?',
      `You answered ${answeredCount} of ${questions.length} questions.`,
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Submit', style: 'destructive', onPress: () => handleSubmit(false) },
      ],
    );
  };

  if (loading) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Loading test..." size="sm" />
        <LoadingState />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Test" size="sm" />
        <ErrorState message={error} onRetry={() => navigation.goBack()} />
      </Screen>
    );
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const lowTime = timeLeft <= 60;

  return (
    <Screen edges={['top']}>
      {/* Header with timer */}
      <View style={styles.head}>
        <Text style={styles.headTitle} numberOfLines={1}>
          {test?.title || listItem.title || listItem.jobTitle || 'Test'}
        </Text>
        <View style={[styles.timer, lowTime && styles.timerLow]}>
          <Ionicons name="time-outline" size={s(14)} color={lowTime ? colors.dangerText : colors.brand700} />
          <Text style={[styles.timerText, lowTime && { color: colors.dangerText }]}>
            {mm}:{ss}
          </Text>
        </View>
      </View>

      {/* Proctoring preview */}
      {proctored && (
        <>
          <View style={styles.proctorBar}>
            {proctorMode === 'agora' ? (
              <LocalVideo style={styles.proctorCam} />
            ) : camPerm?.granted ? (
              <CameraView ref={cameraRef} style={styles.proctorCam} facing="front" />
            ) : (
              <View style={[styles.proctorCam, styles.proctorCamOff]}>
                <Ionicons name="videocam-off-outline" size={s(16)} color="#94a3b8" />
              </View>
            )}
            <Text style={styles.proctorText}>
              {liveEnabled
                ? proctorMode === 'agora'
                  ? 'Live proctored • a proctor may be watching.'
                  : 'Proctored (AI) • stay in frame.'
                : 'Proctored test • stay in frame.'}{' '}
              Leaving the app is recorded ({tabSwitchRef.current}).
            </Text>
          </View>
          {(violation || latestMessage) && (
            <View style={styles.violationBar}>
              <Ionicons name="warning-outline" size={s(15)} color={colors.dangerText} />
              <Text style={styles.violationText} numberOfLines={2}>
                {latestMessage?.message
                  ? `Proctor: ${typeof latestMessage.message === 'string' ? latestMessage.message : ''}`
                  : violation}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Progress row */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Question {idx + 1} / {questions.length}
        </Text>
        <TouchableOpacity style={styles.gridBtn} onPress={() => setShowGrid((v) => !v)}>
          <Ionicons name="grid-outline" size={s(15)} color={colors.brand700} />
          <Text style={styles.gridBtnText}>{answeredCount} answered</Text>
        </TouchableOpacity>
      </View>

      {showGrid && (
        <View style={styles.grid}>
          {questions.map((q, i) => {
            const done = (answers[q._id] || []).length > 0;
            const isMark = marked[q._id];
            return (
              <TouchableOpacity
                key={q._id}
                style={[
                  styles.gridCell,
                  done && styles.gridCellDone,
                  isMark && styles.gridCellMarked,
                  i === idx && styles.gridCellCurrent,
                ]}
                onPress={() => {
                  setIdx(i);
                  setShowGrid(false);
                }}
              >
                <Text style={[styles.gridCellText, (done || isMark) && { color: colors.white }]}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {!!current?.comprehension && (
          <View style={styles.passage}>
            <Text style={styles.passageLabel}>Passage</Text>
            <Text style={styles.passageText}>{current.comprehension}</Text>
          </View>
        )}

        <View style={styles.qBox}>
          <Text style={styles.qText}>{current?.question || 'Question'}</Text>

          {!!current?.resources?.url && (current.kind === 'audio' || current.kind === 'video') && (
            <View style={styles.resourceBox}>
              <Ionicons name={current.kind === 'audio' ? 'musical-notes-outline' : 'videocam-outline'} size={s(16)} color={colors.brand700} />
              <Text style={styles.resourceText} numberOfLines={1}>
                {current.kind} resource attached
              </Text>
            </View>
          )}
        </View>

        {/* Answer input by kind */}
        {renderAnswer(current, answers[current?._id] || [], {
          toggleOption,
          setAnswer,
          codeLang,
          setCodeLang,
          runCode,
          running,
          runOutput,
        })}

        {/* Per-question actions */}
        <View style={styles.qActions}>
            <TouchableOpacity
  style={styles.qActionBtn}
  onPress={() => setMarked((p) => ({ ...p, [current._id]: !p[current._id] }))}
>
  <Ionicons
    name={marked[current?._id] ? 'bookmark' : 'bookmark-outline'}
    size={s(16)}
    color={colors.warn}
  />
  <Text style={styles.qActionText}>{marked[current?._id] ? 'Marked' : 'Mark for review'}</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.qActionBtn} onPress={clearResponse}>
  <Ionicons name="close-circle-outline" size={s(16)} color={colors.muted} />
  <Text style={styles.qActionText}>Clear</Text>
</TouchableOpacity>
</View>
</ScrollView>

{/* Footer nav */}
<View style={styles.footer}>
  <PrimaryButton
    title="Previous"
    variant="secondary"
    height={46}
    style={{ flex: 1 }}
    disabled={idx === 0}
    onPress={() => setIdx((i) => Math.max(0, i - 1))}
  />
  {idx < questions.length - 1 ? (
    <PrimaryButton
      title="Save & Next"
      height={46}
      style={{ flex: 1 }}
      onPress={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
    />
  ) : (
    <PrimaryButton
      title="Submit"
      height={46}
      style={{ flex: 1 }}
      loading={submitting}
      onPress={confirmSubmit}
    />
  )}
</View>
</Screen>
);
}

function renderAnswer(q, selected, helpers) {
  if (!q) return null;
  const { toggleOption, setAnswer, codeLang, setCodeLang, runCode, running, runOutput } = helpers;

  if (q.kind === 'single' || q.kind === 'multiple' || q.kind === 'audio' || q.kind === 'video') {
    const multiple = q.kind === 'multiple';
    if (!q.options.length) {
      return <TextAnswer q={q} value={selected[0] || ''} onChange={(t) => setAnswer(q._id, t ? [t] : [])} />;
    }
    return (
      <View style={styles.options}>
        {q.options.map((opt) => {
          const on = selected.includes(opt.key);
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.option, on && styles.optionOn]}
              onPress={() => toggleOption(q._id, opt.key, multiple)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  multiple
                    ? on
                      ? 'checkbox'
                      : 'square-outline'
                    : on
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={s(20)}
                color={on ? colors.brand600 : '#94a3b8'}
              />
              <Text style={[styles.optionText, on && { color: colors.ink, fontWeight: '700' }]}>{opt.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (q.kind === 'truefalse') {
    return (
      <View style={styles.options}>
        {['true', 'false'].map((v) => {
          const on = (selected[0] || '').toLowerCase() === v;
          return (
            <TouchableOpacity
              key={v}
              style={[styles.option, on && styles.optionOn]}
              onPress={() => setAnswer(q._id, [v])}
              activeOpacity={0.8}
            >
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={s(20)} color={on ? colors.brand600 : '#94a3b8'} />
              <Text style={[styles.optionText, on && { color: colors.ink, fontWeight: '700' }]}>
                {v === 'true' ? 'True' : 'False'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (q.kind === 'coding') {
    return (
      <View style={styles.codingWrap}>
        <View style={styles.langRow}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[styles.langChip, codeLang === l.id && styles.langChipOn]}
              onPress={() => setCodeLang(l.id)}
            >
              <Text style={[styles.langChipText, codeLang === l.id && { color: colors.white }]}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.codeInput}
          value={selected[0] || ''}
          onChangeText={(t) => setAnswer(q._id, t ? [t] : [])}
          placeholder="// write your solution here"
          placeholderTextColor="#64748b"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton title={running ? 'Running...' : 'Run'} variant="secondary" height={42} loading={running} onPress={runCode} />
        {!!runOutput && (
          <View style={styles.outputBox}>
            <Text style={styles.outputText}>{runOutput}</Text>
          </View>
        )}
      </View>
    );
  }

  // text / fill / short paragraph
  return <TextAnswer q={q} value={selected[0] || ''} onChange={(t) => setAnswer(q._id, t ? [t] : [])} />;
}

function TextAnswer({ value, onChange }) {
  return (
    <View style={{ paddingHorizontal: spacing.gutter }}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder="Type your answer..."
        placeholderTextColor={colors.muted}
        multiline
      />
    </View>
  );
}

function decodeB64(str) {
  if (!str) return '';
  try {
    if (typeof atob === 'function') return decodeURIComponent(escape(atob(str)));
  } catch (_) {}
  return str;
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headTitle: { flex: 1, fontSize: font(16), fontWeight: '800', color: colors.ink },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: colors.brand50,
    borderRadius: radius.pill,
    paddingHorizontal: s(10),
    paddingVertical: s(5),
  },
  timerLow: { backgroundColor: colors.dangerBg },
  timerText: { fontSize: font(13), fontWeight: '800', color: colors.brand700 },

  proctorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.sm,
    backgroundColor: '#0f172a',
    borderRadius: radius.md,
    padding: s(8),
  },
  proctorCam: { width: s(46), height: s(36), borderRadius: s(6), overflow: 'hidden', backgroundColor: '#1e293b' },
  proctorCamOff: { alignItems: 'center', justifyContent: 'center' },
  proctorText: { flex: 1, color: '#cbd5e1', fontSize: font(10.5) },
  violationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: s(8),
  },
  violationText: { flex: 1, color: colors.dangerText, fontSize: font(11), fontWeight: '600' },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    marginBottom: spacing.sm,
  },
  progressText: { fontSize: font(12.5), fontWeight: '700', color: colors.muted },
  gridBtn: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
  gridBtnText: { fontSize: font(11.5), fontWeight: '700', color: colors.brand700 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), paddingHorizontal: spacing.gutter, marginBottom: spacing.md },
  gridCell: {
    width: s(34),
    height: s(34),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  gridCellDone: { backgroundColor: colors.ok, borderColor: colors.ok },
  gridCellMarked: { backgroundColor: colors.warn, borderColor: colors.warn },
  gridCellCurrent: { borderColor: colors.brand600, borderWidth: 2 },
  gridCellText: { fontSize: font(12), fontWeight: '700', color: colors.ink },

  passage: {
    marginHorizontal: spacing.gutter,
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  passageLabel: { fontSize: font(10.5), fontWeight: '800', color: colors.brand700, textTransform: 'uppercase', letterSpacing: 1 },
  passageText: { fontSize: font(13), color: colors.ink, lineHeight: font(20), marginTop: s(4) },

  qBox: { paddingHorizontal: spacing.gutter, marginBottom: spacing.md },
  qText: { fontSize: font(15), fontWeight: '700', color: colors.ink, lineHeight: font(22) },
  resourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginTop: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: s(8),
  },
  resourceText: { fontSize: font(11.5), color: colors.brand700, fontWeight: '600' },

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
  optionText: { flex: 1, fontSize: font(13.5), color: '#334155' },

  textInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: s(90),
    textAlignVertical: 'top',
    fontSize: font(14),
    color: colors.ink,
    backgroundColor: colors.white,
  },

  codingWrap: { paddingHorizontal: spacing.gutter, gap: spacing.sm },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6) },
  langChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: s(10), paddingVertical: s(4) },
  langChipOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  langChipText: { fontSize: font(11.5), fontWeight: '700', color: colors.muted },
  codeInput: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: s(140),
    textAlignVertical: 'top',
    fontSize: font(12.5),
    fontFamily: monoFont(),
  },
  outputBox: { backgroundColor: '#1e293b', borderRadius: radius.md, padding: spacing.md },
  outputText: { color: '#cbd5e1', fontSize: font(12), fontFamily: monoFont() },

  qActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.gutter,
    marginTop: spacing.lg,
  },
  qActionBtn: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  qActionText: { fontSize: font(12.5), fontWeight: '700', color: colors.muted },

  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
});

function monoFont() {
  return require('react-native').Platform.OS === 'ios' ? 'Menlo' : 'monospace';
}