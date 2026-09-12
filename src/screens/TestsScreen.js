import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Screen,
  PageHeader,
  SegmentedControl,
  ListCard,
  Chip,
  AssessmentCard,
} from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { spacing, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { formatTestDuration, countTestQuestions, formatScore, timeAgo } from '../utils/format';

const TABS = ['My Tests', 'Job Assessments'];

export default function MyAssessmentsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState('My Tests');
  const [assigned, setAssigned] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [aRes, cRes] = await Promise.allSettled([
        api.getAssignedAssessments(token, { page: 1, limit: 20 }),
        user?._id ? api.getRecentTestResults(token, user._id) : Promise.resolve({ data: [] }),
      ]);
      if (aRes.status === 'fulfilled') setAssigned(aRes.value?.data || []);
      if (cRes.status === 'fulfilled') setCompleted(dedupeResults(cRes.value?.data || []));
      if (aRes.status === 'rejected' && cRes.status === 'rejected') {
        setError(aRes.reason?.message || 'Could not load assessments.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load]);

  const data = tab === 'Job Assessments' ? assigned : completed;

  const renderJobAssessment = (item) => (
    <AssessmentCard
      title={item.title || item.jobTitle}
      description={item.shortDescription}
      questions={countTestQuestions(item)}
      duration={formatTestDuration(item)}
      maxAttempts={item.honestRespondent?.maxAttempts || item.hrt?.maxLeaves}
      seed={item._id || item.title}
      onStart={() => navigation.navigate('TestIntro', { test: item })}
    />
  );

  const renderMyTest = (item) => {
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

  return (
    <Screen edges={['top']}>
      <PageHeader title="My Assessments" size="lg" showBack={false} />
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      <FlatList
        data={loading || error ? [] : data}
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
        renderItem={({ item }) =>
          tab === 'Job Assessments' ? renderJobAssessment(item) : renderMyTest(item)
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState
              emoji={tab === 'Job Assessments' ? '💼' : '📝'}
              title={tab === 'Job Assessments' ? 'No job assessments' : 'No tests yet'}
              subtitle={
                tab === 'Job Assessments'
                  ? 'Assessments assigned by recruiters will appear here.'
                  : 'Your practice and completed tests will show up here.'
              }
            />
          )
        }
      />
    </Screen>
  );
}

// the results feed can contain many attempts of the same test; keep the most
// recent attempt per test title for a cleaner "My Tests" list.
function dedupeResults(list) {
  const seen = new Map();
  for (const r of list) {
    const key = r.testTitle || r.testId || r._id;
    const prev = seen.get(key);
    if (!prev || (r.testEndedAt || 0) > (prev.testEndedAt || 0)) seen.set(key, r);
  }
  return Array.from(seen.values()).sort((a, b) => (b.testEndedAt || 0) - (a.testEndedAt || 0));
}