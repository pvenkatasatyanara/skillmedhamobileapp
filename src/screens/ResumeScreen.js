import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';

import { Screen, PageHeader, SectionHeader, ListCard, Chip, PrimaryButton } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The three entry points shown on the web Resume Builder landing.
const START_OPTIONS = [
  {
    key: 'scratch',
    icon: 'document-text',
    color: colors.brand600,
    title: 'Create from Scratch',
    sub: 'Use professional templates and a step-by-step builder to craft a perfect resume in minutes.',
    action: 'Get Started',
  },
  {
    key: 'upload',
    icon: 'cloud-upload',
    color: '#a855f7',
    title: 'Upload & Enhance',
    sub: 'Already have a resume? Upload it and let our AI suggest powerful improvements to make it stand out.',
    action: 'Upload File',
  },
  {
    key: 'ats',
    icon: 'bar-chart',
    color: colors.ok,
    title: 'ATS Score Check',
    sub: 'Scan your resume against job descriptions to ensure it passes through Applicant Tracking Systems.',
    action: 'Check Score',
  },
];

const TEMPLATES = [
  { key: 'modern', name: 'Modern', color: colors.brand600 },
  { key: 'classic', name: 'Classic', color: '#0ea5e9' },
  { key: 'minimal', name: 'Minimal', color: '#64748b' },
  { key: 'professional', name: 'Professional', color: colors.ok },
  { key: 'creative', name: 'Creative', color: '#ec4899' },
];

export default function ResumeScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? s(16) : 0) + spacing.md;
  const [creds, setCreds] = useState(null);
  const [mode, setMode] = useState(null); // null | 'scratch' | 'upload' | 'ats'
  const [template, setTemplate] = useState('modern');
  const [uploaded, setUploaded] = useState(null);

  useEffect(() => {
    api
      .getStudentCreds(token)
      .then((res) => setCreds(res?.data || null))
      .catch(() => ({}));
  }, [token]);

  const d = creds || {};
  const eduCount = Array.isArray(d.educationDetails) ? d.educationDetails.length : 0;
  const projCount = Array.isArray(d.projects) ? d.projects.length : 0;
  const expCount = Array.isArray(d.experiences) ? d.experiences.length : 0;
  const atsScore = 72 + Math.min(eduCount + projCount, 3) * 3;

  const sections = [
    { title: 'Personal Details', sub: d.email ? 'Complete' : 'Incomplete', done: !d.email },
    { title: 'Education', sub: eduCount ? `${eduCount} added` : 'Not added', done: eduCount > 0 },
    { title: 'Projects', sub: projCount ? `${projCount} added` : 'Not added', done: projCount > 0 },
    { title: 'Experience', sub: expCount ? `${expCount} added` : 'Not added', done: expCount > 0 },
  ];

  const pickResume = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please choose a file up to 5 MB.');
        return;
      }
      setUploaded(asset);
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not open the file picker.');
    }
  };

  const onOption = (key) => {
    setMode(key);
    if (key === 'upload') pickResume();
  };

  return (
    <Screen edges={['top']}>
      <PageHeader title="Resume Builder" size="sm" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.md }}
      >
        <Text style={styles.intro}>
          Choose how you want to start. Create from scratch, enhance an existing resume, or check
          your ATS score instantly.
        </Text>

        {/* Start options (Create / Upload / ATS) */}
        {START_OPTIONS.map((opt) => {
          const active = mode === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.85}
              onPress={() => onOption(opt.key)}
              style={[styles.optCard, active && { borderColor: opt.color, borderWidth: 1.5 }]}
            >
              <View style={[styles.optIcon, { backgroundColor: opt.color }]}>
                <Ionicons name={opt.icon} size={s(22)} color={colors.white} />
              </View>
              <Text style={styles.optTitle}>{opt.title}</Text>
              <Text style={styles.optSub}>{opt.sub}</Text>
              <View style={styles.optAction}>
                <Text style={[styles.optActionText, { color: opt.color }]}>{opt.action}</Text>
                <Ionicons name="arrow-forward" size={s(15)} color={opt.color} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Create from scratch -> template selection */}
        {mode === 'scratch' && (
          <>
            <SectionHeader title="Choose a template" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateRow}
            >
              {TEMPLATES.map((t) => {
                const selected = template === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    activeOpacity={0.85}
                    onPress={() => setTemplate(t.key)}
                    style={[styles.template, selected && { borderColor: t.color, borderWidth: 2 }]}
                  >
                    <View style={[styles.templatePreview]}>
                      <View style={[styles.tpBar, { backgroundColor: t.color, width: '70%' }]} />
                      <View style={[styles.tpBar, { width: '90%' }]} />
                      <View style={[styles.tpBar, { width: '80%' }]} />
                      <View style={[styles.tpBar, { width: '85%' }]} />
                      <View style={[styles.tpBar, { width: '60%' }]} />
                    </View>
                    <View style={styles.templateFooter}>
                      <Text style={styles.templateName}>{t.name}</Text>
                      {selected && (
                        <Ionicons name="checkmark-circle" size={s(16)} color={t.color} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Upload & enhance -> uploaded file state */}
        {mode === 'upload' && (
          <>
            <SectionHeader title="Uploaded resume" />
            <View style={{ paddingHorizontal: spacing.gutter }}>
              {uploaded ? (
                <ListCard
                  title={uploaded.name}
                  subtitle={
                    [formatBytes(uploaded.size), 'Ready to enhance with AI']
                      .filter(Boolean)
                      .join(' • ')
                  }
                  iconVariant="green"
                  renderIcon={(fg) => (
                    <Ionicons name="document-attach-outline" size={s(20)} color={fg} />
                  )}
                  right={<Chip label="Enhance" variant="green" />}
                  onPress={() => Alert.alert('AI Enhance', 'Analyzing and improving your resume...')}
                />
              ) : (
                <TouchableOpacity style={styles.dropzone} activeOpacity={0.85} onPress={pickResume}>
                  <Ionicons name="cloud-upload-outline" size={s(30)} color={colors.brand600} />
                  <Text style={styles.dropTitle}>Tap to upload</Text>
                  <Text style={styles.dropSub}>PDF or DOCX, up to 5 MB</Text>
                </TouchableOpacity>
              )}
              {uploaded && (
                <TouchableOpacity style={styles.replaceBtn} onPress={pickResume}>
                  <Ionicons name="swap-horizontal" size={s(15)} color={colors.brand700} />
                  <Text style={styles.replaceText}>Choose a different file</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* ATS score card (also shown for the ATS option) */}
        {(mode === 'ats' || mode === 'scratch') && (
          <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.md }}>
            <LinearGradient colors={[colors.brand50, colors.white]} style={styles.atsCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.atsLabel}>ATS Score</Text>
                  <Text style={styles.atsSub}>AI analyzed</Text>
                </View>
                <Text style={styles.atsScore}>
                  {atsScore}
                  <Text style={styles.atsMax}>/100</Text>
                </Text>
              </View>
              <PrimaryButton
                title="Re-run AI Check"
                height={44}
                style={{ marginTop: spacing.md }}
                onPress={() => Alert.alert('AI ATS check', 'Analyzing your resume...')}
              />
            </LinearGradient>
          </View>
        )}

        {/* Editing sections - always available */}
        <SectionHeader
          title="Edit your resume"
          actionLabel="+ Add"
          onAction={() => Alert.alert('Add section', 'Add a new resume section.')}
        />
        {sections.map((sec) => (
          <ListCard
            key={sec.title}
            title={sec.title}
            subtitle={sec.sub}
            iconVariant={sec.done ? 'green' : 'yellow'}
            renderIcon={(fg) => (
              <Ionicons
                name={sec.done ? 'checkmark' : 'ellipsis-horizontal'}
                size={s(20)}
                color={fg}
              />
            )}
            right={<Ionicons name="chevron-forward" size={s(18)} color="#cbd5e1" />}
            onPress={() => Alert.alert(sec.title, 'Edit this section.')}
          />
        ))}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: bottomPad }]}>
        <PrimaryButton
          title="Preview"
          variant="secondary"
          height={48}
          style={{ flex: 1 }}
          onPress={() => Alert.alert('Preview', 'Opening resume preview...')}
        />
        <PrimaryButton
          title="Download PDF"
          height={48}
          style={{ flex: 1 }}
          onPress={() => Alert.alert('Download', 'Downloading PDF...')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: font(13),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: font(19),
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  optCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  optIcon: {
    width: s(52),
    height: s(52),
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  optTitle: { fontSize: font(15), fontWeight: '800', color: colors.ink },
  optSub: {
    fontSize: font(12),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: font(18),
    marginTop: s(6),
  },
  optAction: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: spacing.md },
  optActionText: { fontSize: font(13), fontWeight: '800' },
  
  templateRow: { paddingHorizontal: spacing.gutter, gap: spacing.md, paddingBottom: s(4) },
  template: {
    width: s(120),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: s(8),
  },
  templatePreview: {
    height: s(130),
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: s(10),
    gap: s(6),
  },
  tpBar: { height: s(7), borderRadius: s(4), backgroundColor: '#d7dce6' },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s(8),
  },
templateName: { fontSize: font(12.5), fontWeight: '700', color: colors.ink },

dropzone: {
  borderWidth: 1.5,
  borderColor: colors.brand100,
  borderStyle: 'dashed',
  borderRadius: radius.lg,
  paddingVertical: spacing.xxl,
  alignItems: 'center',
  backgroundColor: colors.white,
  gap: s(4),
},
dropTitle: { fontSize: font(14), fontWeight: '800', color: colors.ink, marginTop: s(6) },
dropSub: { fontSize: font(11.5), color: colors.muted },
replaceBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: s(6),
  marginTop: spacing.sm,
},
replaceText: { fontSize: font(12.5), fontWeight: '700', color: colors.brand700 },

atsCard: {
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.line,
  padding: spacing.lg,
},
rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
atsLabel: { fontSize: font(14), fontWeight: '800', color: colors.ink },
atsSub: { fontSize: font(12), color: colors.muted, marginTop: s(3) },
atsScore: { fontSize: font(30), fontWeight: '900', color: colors.ok },
atsMax: { fontSize: font(14), color: colors.ok },

actions: {
  flexDirection: 'row',
  gap: spacing.md,
  paddingHorizontal: spacing.gutter,
  paddingTop: spacing.md,
  backgroundColor: colors.bg,
  borderTopWidth: 1,
  borderTopColor: colors.line,
},
});