import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

import { VideoPlayer } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { localInterviewAnalysis } from '../utils/interview';

const MAX_SECONDS = 60;

const QUESTIONS = [
  'What is your biggest weakness?',
  'Tell me about yourself.',
  'Why do you want to work here?',
  'Describe a challenge you overcame.',
  'Where do you see yourself in 5 years?',
  'Why should we hire you?',
  'Tell me about a time you worked in a team.',
];

const TABS = ['Your Answer', 'AI Report', 'Suggestions'];

export default function TalkToAIScreen() {
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const [qIndex, setQIndex] = useState(0);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const [status, setStatus] = useState('ready'); // ready | recording | recorded
  const [seconds, setSeconds] = useState(0);
  const [videoUri, setVideoUri] = useState(null);
  const [replaying, setReplaying] = useState(false);

  const [tab, setTab] = useState('Your Answer');
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const question = showCustom && customQuestion ? customQuestion : QUESTIONS[qIndex];

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      try {
        cameraRef.current?.stopRecording();
      } catch (_) {}
    },
    []
  );

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev + 1 >= MAX_SECONDS) {
          clearInterval(timerRef.current);
          try {
            cameraRef.current?.stopRecording();
          } catch (_) {}
          return MAX_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const ensurePermissions = async () => {
    let cam = camPerm;
    if (!cam?.granted) cam = await requestCamPerm();
    if (!cam?.granted) {
      Alert.alert('Camera needed', 'Enable camera access to record your interview answer.');
      return false;
    }
    let mic = micPerm;
    if (!mic?.granted) mic = await requestMicPerm();
    if (!mic?.granted) {
      Alert.alert(
        'Microphone needed',
        'Enable microphone access so your spoken answer can be recorded and transcribed.'
      );
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    if (status === 'recording') return;
    const ok = await ensurePermissions();
    if (!ok || !cameraRef.current) return;

    setReplaying(false);
    setVideoUri(null);
    setFeedback(null);
    setTab('Your Answer');
    setSeconds(0);
    setStatus('recording');
    startTimer();

    try {
      const rec = await cameraRef.current.recordAsync({ maxDuration: MAX_SECONDS });
      setVideoUri(rec?.uri || null);
      setStatus(rec?.uri ? 'recorded' : 'ready');
    } catch (e) {
      setStatus('ready');
      Alert.alert('Recording error', e?.message || 'Could not record. Please try again.');
    } finally {
      clearInterval(timerRef.current);
    }
  };

  const stopRecording = () => {
    if (status !== 'recording') return;
    clearInterval(timerRef.current);
    try {
      cameraRef.current?.stopRecording(); // resolves the recordAsync promise
    } catch (_) {}
  };

  const replay = () => {
    if (!videoUri || status !== 'recorded') return;
    setReplaying(true);
  };

  const getFeedback = async () => {
    if (status !== 'recorded' || !videoUri || analyzing) return;
    setAnalyzing(true);
    try {
      const result = await api.analyzeInterviewAnswer({
        token,
        videoUri,
        question,
        studentId: user?._id,
      });
      setFeedback(result);
    } catch (e) {
      // No backend configured (or the upload failed) -> on-device fallback so the
      // user still gets actionable feedback.
      const fb = localInterviewAnalysis({ seconds });
      if (e?.code !== 'NOT_CONFIGURED') fb.error = e?.message;
      setFeedback(fb);
    } finally {
      setAnalyzing(false);
      setTab('AI Report');
    }
  };

  const newQuestion = () => {
    setShowCustom(false);
    setCustomQuestion('');
    setQIndex((i) => (i + 1) % QUESTIONS.length);
    resetAnswer();
  };

  const resetAnswer = () => {
    clearInterval(timerRef.current);
    try {
      cameraRef.current?.stopRecording();
    } catch (_) {}
    setStatus('ready');
    setSeconds(0);
    setVideoUri(null);
    setReplaying(false);
    setFeedback(null);
    setTab('Your Answer');
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={s(20)} color={colors.ink} />
        </TouchableOpacity>
        <LinearGradient colors={[colors.brand600, colors.brand800]} style={styles.aiIcon}>
          <Ionicons name="chatbubbles" size={s(18)} color={colors.white} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Talk to AI</Text>
          <Text style={styles.subtitle}>Your personal AI Interview Assistant</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      >
        {/* Recorder */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: status === 'recording' ? colors.danger : colors.ok },
                ]}
              />
              <Text style={styles.statusText}>
                {status === 'recording' ? 'Recording' : status === 'recorded' ? 'Recorded' : 'Ready'}
              </Text>
            </View>
            <View style={styles.timerPill}>
              <Ionicons name="time-outline" size={s(14)} color={colors.muted} />
              <Text style={styles.timerText}>
                {mm}:{ss} / 01:00
              </Text>
            </View>
          </View>

          <View style={styles.videoBox}>
            {replaying && videoUri ? (
              <>
                <VideoPlayer uri={videoUri} autoPlay style={StyleSheet.absoluteFill} />
                <TouchableOpacity style={styles.backToCam} onPress={() => setReplaying(false)}>
                  <Ionicons name="camera-reverse-outline" size={s(14)} color={colors.white} />
                  <Text style={styles.backToCamText}>Back to camera</Text>
                </TouchableOpacity>
              </>
            ) : camPerm?.granted ? (
              <>
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing="front"
                  mode="video"
                />
                {status === 'recording' && (
                  <View style={styles.recBadge}>
                    <View style={styles.recDot} />
                    <Text style={styles.recBadgeText}>REC</Text>
                  </View>
                )}
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoHint}>
                    {status === 'recording'
                      ? 'Recording... answer the question aloud'
                      : status === 'recorded'
                      ? 'Recorded - tap Replay or Get AI Feedback'
                      : 'Front camera ready'}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="videocam-off-outline" size={s(40)} color="#94a3b8" />
                <Text style={styles.videoHint}>Camera access is required for mock interviews</Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestCamPerm}>
                  <Ionicons name="videocam-outline" size={s(15)} color={colors.white} />
                  <Text style={styles.permBtnText}>Enable camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.ctrl, styles.ctrlPrimary, status === 'recording' && styles.ctrlDisabled]}
              onPress={startRecording}
              disabled={status === 'recording' || analyzing}
            >
              <Ionicons name="radio-button-on" size={s(16)} color={colors.white} />
              <Text style={styles.ctrlPrimaryText}>Start Recording</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctrl, styles.ctrlGhost, status !== 'recording' && styles.ctrlDisabled]}
              onPress={stopRecording}
              disabled={status !== 'recording'}
            >
              <Ionicons name="stop" size={s(15)} color={colors.ink} />
              <Text style={styles.ctrlGhostText}>Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctrl, styles.ctrlGhost, (status !== 'recorded' || !videoUri) && styles.ctrlDisabled]}
              onPress={replay}
              disabled={status !== 'recorded' || !videoUri}
            >
              <Ionicons name="play" size={s(15)} color={colors.ink} />
              <Text style={styles.ctrlGhostText}>Replay</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.feedbackBtn, (status !== 'recorded' || !videoUri || analyzing) && styles.ctrlDisabled]}
            onPress={getFeedback}
            disabled={status !== 'recorded' || !videoUri || analyzing}
            activeOpacity={0.85}
          >
            {analyzing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="sparkles" size={s(16)} color={colors.white} />
                <Text style={styles.feedbackBtnText}>Get AI Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Interview question */}
        <View style={styles.card}>
          <View style={styles.qHead}>
            <Ionicons name="help-circle-outline" size={s(18)} color={colors.brand600} />
            <Text style={styles.qHeadText}>Interview Question</Text>
          </View>
          <View style={styles.qBox}>
            <Text style={styles.qText}>{question}</Text>
          </View>

          {showCustom && (
            <TextInput
              style={styles.customInput}
              placeholder="Type your own interview question..."
              placeholderTextColor={colors.muted}
              value={customQuestion}
              onChangeText={setCustomQuestion}
              multiline
            />
          )}

          <View style={styles.qActions}>
            <TouchableOpacity style={styles.qBtn} onPress={newQuestion}>
              <Ionicons name="refresh" size={s(14)} color={colors.brand700} />
              <Text style={styles.qBtnText}>New Question</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.qBtn}
              onPress={() => {
                setShowCustom((v) => !v);
                resetAnswer();
              }}
            >
              <Ionicons name="create-outline" size={s(14)} color={colors.brand700} />
              <Text style={styles.qBtnText}>Custom Question</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Answer / Report / Suggestions tabs */}
        <View style={styles.card}>
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
                  {active && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tabBody}>
            {tab === 'Your Answer' && (
              analyzing ? (
                <Loading text="Transcribing & analyzing your answer..." />
        ) : feedback?.transcript ? (
          <Text style={styles.bodyText}>{feedback.transcript}</Text>
        ) : videoUri ? (
          <Placeholder
            icon="checkmark-circle-outline"
            text={`Answer recorded (${seconds}s). Tap "Get AI Feedback" to transcribe & analyze.`}
          />
        ) : (
          <Placeholder icon="mic-outline" text="Start recording to capture your answer" />
        ))}

        {tab === 'AI Report' &&
          (analyzing ? (
            <Loading text="Analyzing..." />
          ) : feedback ? (
            <>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Overall score</Text>
                <Text style={styles.scoreValue}>
                  {feedback.score != null ? `${feedback.score}/100` : '-'}
                </Text>
              </View>
              {!!feedback.report && <Text style={styles.bodyText}>{feedback.report}</Text>}
              {feedback.offline && (
                <View style={styles.noteBox}>
                  <Ionicons name="information-circle-outline" size={s(15)} color={colors.warnText} />
                  <Text style={styles.noteText}>
                    Offline coaching (no AI backend configured). Transcription needs a connected
                    transcription service.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Placeholder icon="document-text-outline" text="Get AI feedback to see your report" />
          ))}

        {tab === 'Suggestions' &&
          (analyzing ? (
            <Loading text="Preparing suggestions..." />
          ) : feedback?.suggestions?.length ? (
            feedback.suggestions.map((sug, i) => (
              <View key={i} style={styles.sugRow}>
                <Ionicons name="bulb-outline" size={s(16)} color={colors.warn} />
                <Text style={styles.sugText}>{sug}</Text>
              </View>
            ))
          ) : (
            <Placeholder icon="bulb-outline" text="Suggestions appear after AI feedback" />
          ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Placeholder({ icon, text }) {
  return (
    <View style={styles.placeholder}>
      <Ionicons name={icon} size={s(30)} color="#cbd5e1" />
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

function Loading({ text }) {
  return (
    <View style={styles.placeholder}>
      <ActivityIndicator color={colors.brand600} />
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  back: {
    width: s(38),
    height: s(38),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    width: s(34),
    height: s(34),
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font(15), fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: font(11), color: colors.muted, marginTop: s(1) },

  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  statusDot: { width: s(8), height: s(8), borderRadius: s(4) },
  statusText: { fontSize: font(12.5), fontWeight: '700', color: colors.ink },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: s(10),
    paddingVertical: s(4),
  },
  timerText: { fontSize: font(11.5), fontWeight: '700', color: colors.muted },

  videoBox: {
    height: s(180),
    borderRadius: radius.md,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    overflow: 'hidden',
  },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: s(8), padding: spacing.md },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: s(6),
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },

  videoHint: { color: '#cbd5e1', fontSize: font(11.5), textAlign: 'center' },
  recBadge: {
    position: 'absolute',
    top: s(10),
    left: s(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: radius.pill,
    paddingHorizontal: s(8),
    paddingVertical: s(3),
  },
  recDot: { width: s(7), height: s(7), borderRadius: s(4), backgroundColor: colors.white },
  recBadgeText: { color: colors.white, fontSize: font(10), fontWeight: '800', letterSpacing: 1 },
  backToCam: {
    position: 'absolute',
    top: s(10),
    right: s(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderRadius: radius.pill,
    paddingHorizontal: s(10),
    paddingVertical: s(4),
  },
  backToCamText: { color: colors.white, fontSize: font(10.5), fontWeight: '700' },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: colors.brand600,
    borderRadius: radius.md,
    paddingHorizontal: s(14),
    paddingVertical: s(8),
    marginTop: s(4),
  },
  permBtnText: { color: colors.white, fontWeight: '800', fontSize: font(12) },

  controls: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  ctrl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(5),
    height: s(42),
    borderRadius: radius.md,
  },
  ctrlPrimary: { backgroundColor: colors.brand600 },
  ctrlPrimaryText: { color: colors.white, fontWeight: '800', fontSize: font(12) },
  ctrlGhost: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  ctrlGhostText: { color: colors.ink, fontWeight: '700', fontSize: font(12) },
  ctrlDisabled: { opacity: 0.45 },

  feedbackBtn: {
    marginTop: spacing.md,
    height: s(48),
    borderRadius: radius.md,
    backgroundColor: colors.brand900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
  },
  feedbackBtnText: { color: colors.white, fontWeight: '800', fontSize: font(14) },

  qHead: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  qHeadText: { fontSize: font(13.5), fontWeight: '800', color: colors.ink },
  qBox: {
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand600,
    backgroundColor: colors.brand50,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  qText: { fontSize: font(14), fontWeight: '700', color: colors.ink },
  customInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font(13.5),
    color: colors.ink,
    minHeight: s(60),
    textAlignVertical: 'top',
  },
  qActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  qBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(5),
    height: s(38),
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  qBtnText: { color: colors.brand700, fontWeight: '700', fontSize: font(11.5) },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, alignItems: 'center', paddingBottom: spacing.sm },
  tabText: { fontSize: font(12.5), fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.brand700 },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    width: '70%',
    backgroundColor: colors.brand600,
    borderRadius: 2,
  },
  tabBody: { paddingTop: spacing.md, minHeight: s(120) },
  bodyText: { fontSize: font(13.5), color: colors.ink, lineHeight: font(21) },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  scoreLabel: { fontSize: font(13), fontWeight: '700', color: colors.ink },
  scoreValue: { fontSize: font(16), fontWeight: '900', color: colors.ok },

  noteBox: {
    flexDirection: 'row',
    gap: s(6),
    alignItems: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.warnBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  noteText: { flex: 1, fontSize: font(11.5), color: colors.warnText, lineHeight: font(17) },

  sugRow: { flexDirection: 'row', gap: s(8), alignItems: 'flex-start', marginBottom: spacing.sm },
  sugText: { flex: 1, fontSize: font(13), color: colors.ink, lineHeight: font(19) },

  placeholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: s(8) },
  placeholderText: { fontSize: font(12.5), color: colors.muted, textAlign: 'center' },
});