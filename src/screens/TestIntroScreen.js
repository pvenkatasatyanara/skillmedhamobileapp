import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader, Card, SectionHeader, ListCard, PrimaryButton } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { formatTestDuration, countTestQuestions, stripHtml } from '../utils/format';

export default function TestIntroScreen({ route, navigation }) {
  const test = route.params?.test || {};
  const proctored = test.liveProctoring === 'Enable';
  const duration = formatTestDuration(test);
  const qCount = countTestQuestions(test);
  const meta =
    test.meta ||
    [duration, qCount ? `${qCount} questions` : null, proctored ? 'Proctored' : 'Not proctored']
      .filter(Boolean)
      .join(' • ');
  const description = stripHtml(test.shortDescription);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Before you start" size="sm" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {proctored && (
          <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.sm }}>
            <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <View style={styles.camBox}>
                <Ionicons name="videocam-outline" size={s(40)} color="#94a3b8" />
              </View>
              <Text style={styles.title}>Camera check (KYC)</Text>
              <Text style={styles.sub}>
                This test is proctored. Please allow camera access and stay in frame.
              </Text>
            </Card>
          </View>
        )}

        {(test.title || test.jobTitle) && (
          <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.md }}>
            <Text style={styles.testName}>{test.title || test.jobTitle}</Text>
            {!!meta && <Text style={styles.testMeta}>{meta}</Text>}
            {!!description && (
              <Text style={styles.testDesc} numberOfLines={4}>
                {description}
              </Text>
            )}
          </View>
        )}

        <SectionHeader title="Test rules" />
        <ListCard
          title="Strict monitoring"
          subtitle={
            proctored
              ? '3 tab-switches will auto-submit your test'
              : 'Stay on the test screen until you submit'
          }
          iconVariant="yellow"
          renderIcon={(fg) => <Ionicons name="warning-outline" size={s(20)} color={fg} />}
        />
        <ListCard
          title="Timed test"
          subtitle={`${duration || 'Timed'} limit • Auto-submit on timeout`}
          iconVariant="yellow"
          renderIcon={(fg) => <Ionicons name="timer-outline" size={s(20)} color={fg} />}
        />
        <ListCard
          title="Stay connected"
          subtitle="Ensure a stable internet connection throughout"
          iconVariant="default"
          renderIcon={(fg) => <Ionicons name="wifi-outline" size={s(20)} color={fg} />}
        />

        <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.lg }}>
          <PrimaryButton title="I understand - Start test" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  camBox: {
    width: s(120),
    height: s(120),
    borderRadius: radius.xl,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font(16), fontWeight: '800', color: colors.ink, marginTop: spacing.md },
  sub: { fontSize: font(12.5), color: colors.muted, textAlign: 'center', marginTop: s(4) },
  testName: { fontSize: font(15), fontWeight: '800', color: colors.ink },
  testMeta: { fontSize: font(12.5), color: colors.muted, marginTop: s(3) },
  testDesc: { fontSize: font(12.5), color: '#475569', marginTop: s(8), lineHeight: font(19) },
});