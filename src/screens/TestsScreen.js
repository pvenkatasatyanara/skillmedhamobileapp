import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader, SegmentedControl, ListCard, Chip, AssessmentCard } from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { formatScore, timeAgo } from '../utils/format';
import { testDurationLabel, testQuestionCount, isTestExpired, isTestActive } from '../utils/tests';

const TABS = ['My Tests', 'Job Assessments'];
const FILTERS = ['All', 'Active', 'Expired', 'Results'];

export default function MyAssessmentsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState('My Tests');
  const [filter, setFilter] = useState('All');
  const [tests, setTests] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tRes, aRes, rRes] = await Promise.allSettled([
        api.getAssignedTests(token, { limit: 30, studentId: user?._id }),
        api.getAssignedAssessments(token, { page: 1, limit: 20 }),
        user?._id ? api.getRecentTestResults(token, user._id) : Promise.resolve({ data: [] }),
      ]);
      if (tRes.status === 'fulfilled') setTests(tRes.value?.tests || []);
      if (aRes.status === 'fulfilled') setAssessments(aRes.value?.data || []);
      if (rRes.status === 'fulfilled') setResults(dedupeResults(rRes.value?.data || []));
      if (tRes.status === 'rejected' && aRes.status === 'rejected') {
        setError(tRes.reason?.message || 'Could not load assessments.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load]);

  const base = tab === 'My Tests' ? tests : assessments;

  const filtered = useMemo(() => {
    if (filter === 'Active') return base.filter(isTestActive);
    if (filter === 'Expired') return base.filter(isTestExpired);
    return base; // All
  }, [base, filter]);

  const counts = useMemo(
    () => ({
      All: base.length,
      Active: base.filter(isTestActive).length,
      Expired: base.filter(isTestExpired).length,
      Results: results.length,
    }),
    [base, results]
  );

  const startTest = (item, kind) => navigation.navigate('TestIntro', { test: item, kind });

  const renderCard = (item) => (
    <AssessmentCard
      title={item.title || item.jobTitle}
      description={item.shortDescription || item.longDescription}
      questions={testQuestionCount(item)}
      duration={testDurationLabel(item)}
      level={isTestExpired(item) ? 'Expired' : 'All Levels'}
      maxAttempts={item.honestRespondent?.maxAttempts || item.attemptGeneration}
      seed={item._id || item.title}
      onStart={() => startTest(item, tab === 'My Tests' ? 'test' : 'job')}
    />
  );

  const renderResult = (item) => {
    const { correct, total, final, pct } = formatScore(item);
    const scoreLabel = pct != null ? `${pct}%` : `${final ?? 0} pts`;
    const variant = pct == null ? 'default' : pct >= 60 ? 'green' : pct >= 40 ? 'yellow' : 'red';
    return (
      <ListCard
        title={item.testTitle || 'Test'}
        subtitle={`${total ? `${correct}/${total} correct` : `Score ${final ?? 0}`}${
          item.testEndedAt ? ` • ${timeAgo(item.testEndedAt)}` : ''
        }`}
        iconVariant={variant}
        renderIcon={(fg) => <Ionicons name="trophy-outline" size={s(20)} color={fg} />}
        right={<Chip label={scoreLabel} variant={variant} />}
      />
    );
  };

  const showResults = filter === 'Results';
  const data = loading || error ? [] : showResults ? results : filtered;

  return (
    <Screen edges={['top']}>
      <PageHeader title="My Assessments" size="lg" showBack={false} />
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.8}>
              <View style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f} {counts[f] != null ? counts[f] : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, i) => item._id || String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.xs, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        renderItem={({ item }) => (showResults ? renderResult(item) : renderCard(item))}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState
              emoji={showResults ? '🎯' : tab === 'Job Assessments' ? '💼' : '📝'}
              title={
                showResults
                  ? 'No results yet'
                  : tab === 'Job Assessments'
                  ? 'No job assessments'
                  : `No ${filter.toLowerCase()} tests`
              }
              subtitle={
                showResults
                  ? 'Your completed test results will show up here.'
                  : tab === 'Job Assessments'
                  ? 'Assessments assigned by recruiters will appear here.'
                  : 'Tests assigned to you will appear here.'
              }
            />
          )
        }
      />
    </Screen>
  );
}

function dedupeResults(list) {
  const seen = new Map();
  for (const r of list) {
    const key = r.testTitle || r.testId || r._id;
    const prev = seen.get(key);
    if (!prev || (r.testEndedAt || 0) > (prev.testEndedAt || 0)) seen.set(key, r);
  }
  return Array.from(seen.values()).sort((a, b) => (b.testEndedAt || 0) - (a.testEndedAt || 0));
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    paddingHorizontal: spacing.gutter,
    marginBottom: spacing.sm,
  },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: s(12),
    paddingVertical: s(6),
  },
  filterChipActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  filterText: { fontSize: font(11.5), fontWeight: '700', color: colors.muted },
  filterTextActive: { color: colors.white },
});