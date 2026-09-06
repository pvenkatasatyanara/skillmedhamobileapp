import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, PageHeader, SectionHeader, ListCard, Chip, PrimaryButton } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function ResumeScreen() {
  const { token } = useAuth();
  const [creds, setCreds] = useState(null);

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
    { title: 'Personal Details', sub: d.email ? 'Complete' : 'Incomplete', done: !!d.email },
    { title: 'Education', sub: eduCount ? `${eduCount} added` : 'Not added', done: eduCount > 0 },
    { title: 'Projects', sub: projCount ? `${projCount} added` : 'Not added', done: projCount > 0 },
    { title: 'Experience', sub: expCount ? `${expCount} added` : 'Not added', done: expCount > 0 },
  ];

  return (
    <Screen edges={['top']}>
      <PageHeader title="Resume Builder" size="sm" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* ATS card */}
        <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.sm }}>
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

        <SectionHeader title="Sections" actionLabel="+ Add" onAction={() => Alert.alert('Add section')} />
        {sections.map((sec) => (
          <ListCard
            key={sec.title}
            title={sec.title}
            subtitle={sec.sub}
            iconVariant={sec.done ? 'green' : 'yellow'}
            renderIcon={(fg) => (
              <Ionicons name={sec.done ? 'checkmark' : 'ellipsis-horizontal'} size={s(20)} color={fg} />
            )}
            right={<Ionicons name="chevron-forward" size={s(18)} color="#cbd5e1" />}
            onPress={() => Alert.alert(sec.title, 'Edit this section.')}
          />
        ))}

        <View style={styles.actions}>
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    marginTop: spacing.lg,
  },
});