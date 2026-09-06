import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader, Chip, SectionHeader, ListCard, PrimaryButton } from '../components';
import { colors, spacing, radius, font, s } from '../theme';

const TEST_CASES = [
  { name: 'Test 1', io: '[2,7,11,15], t=9 -> [0,1]', pass: true },
  { name: 'Test 2', io: '[3,2,4], t=6 -> [1,2]', pass: true },
  { name: 'Test 3', io: '[3,3], t=6 -> [0,1]', pass: false },
];

export default function CodingScreen() {
  const [ran, setRan] = useState(false);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Two Sum" size="sm" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.gutter }}>
          <View style={styles.tagRow}>
            <Chip label="Easy" variant="green" />
            <Chip label="Arrays" variant="default" />
          </View>
          <Text style={styles.desc}>
            Given an array of integers, return indices of the two numbers that add up to a target.
          </Text>
        </View>

        {/* Code editor mock */}
        <View style={styles.editor}>
          <Text style={styles.codeKeyword}>
            def <Text style={styles.codeFn}>two_sum</Text>(nums, target):
          </Text>
          <Text style={styles.codeLine}>  for i, n in enumerate(nums):</Text>
          <Text style={styles.codeComment}>    # your code here</Text>
          <Text style={styles.codeLine}>    pass</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Run"
            variant="secondary"
            height={46}
            style={{ flex: 1 }}
            onPress={() => setRan(true)}
          />
          <PrimaryButton
            title="Submit"
            height={46}
            style={{ flex: 1 }}
            onPress={() => setRan(true)}
          />
        </View>

        <SectionHeader title="Test cases" actionLabel={ran ? '2/3 passed' : undefined} />
        {TEST_CASES.map((t) => (
          <ListCard
            key={t.name}
            title={t.name}
            subtitle={t.io}
            iconVariant={!ran ? 'default' : t.pass ? 'green' : 'red'}
            renderIcon={(fg) => (
              <Ionicons
                name={!ran ? 'ellipse-outline' : t.pass ? 'checkmark' : 'close'}
                size={s(20)}
                color={fg}
              />
            )}
            right={
              ran ? (
                <Chip label={t.pass ? 'Pass' : 'Fail'} variant={t.pass ? 'green' : 'red'} />
              ) : null
            }
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tagRow: { flexDirection: 'row', gap: s(6), marginTop: spacing.sm },
  desc: { fontSize: font(13.5), lineHeight: font(21), color: '#475569', marginTop: spacing.md },
  editor: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: '#0f172a',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  codeKeyword: { color: '#7dd3fc', fontFamily: fontMono(), fontSize: font(12.5), lineHeight: font(22) },
  codeFn: { color: '#fde047' },
  codeLine: { color: '#e2e8f0', fontFamily: fontMono(), fontSize: font(12.5), lineHeight: font(22) },
  codeComment: { color: '#64748b', fontFamily: fontMono(), fontSize: font(12.5), lineHeight: font(22) },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    marginTop: spacing.md,
  },
});

function fontMono() {
  return require('react-native').Platform.OS === 'ios' ? 'Menlo' : 'monospace';
}