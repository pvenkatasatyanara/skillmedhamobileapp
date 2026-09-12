import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Screen, PageHeader, SegmentedControl, JobCard } from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { isNewJob, buildAppliedJobs, appliedJobId, applicationStatusOf } from '../utils/jobs';

const TABS = ['All Jobs', 'Applied Jobs', 'New Jobs'];

export default function JobsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState('All Jobs');
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState([]);
  const [appliedRaw, setAppliedRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [jobsRes, profRes] = await Promise.allSettled([
        api.getAllJobs(token, { page: 1, limit: 50 }),
        api.getStudentProfile(token, { includeJobs: true }),
      ]);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value?.data || []);
      if (profRes.status === 'fulfilled') setAppliedRaw(profRes.value?.data?.appliedJobs || []);
      if (jobsRes.status === 'rejected') setError(jobsRes.reason?.message || 'Could not load jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh applied state when returning from JobDetail (after applying).
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        api
          .getStudentProfile(token, { includeJobs: true })
          .then((r) => setAppliedRaw(r?.data?.appliedJobs || []))
          .catch(() => {});
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])
  );

  const appliedIds = useMemo(
    () => new Set((appliedRaw || []).map(appliedJobId).filter(Boolean).map(String)),
    [appliedRaw]
  );
  const appliedList = useMemo(() => buildAppliedJobs(appliedRaw, jobs), [appliedRaw, jobs]);
  const newJobs = useMemo(() => jobs.filter((j) => isNewJob(j)), [jobs]);

  const data = useMemo(() => {
    const base = tab === 'Applied Jobs' ? appliedList : tab === 'New Jobs' ? newJobs : jobs;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (j) =>
        (j.jobTitle || '').toLowerCase().includes(q) ||
        (j.companyName || '').toLowerCase().includes(q)
    );
  }, [tab, jobs, appliedList, newJobs, search]);

  const statusFor = (job) =>
    job.applicationStatus ? applicationStatusOf(job) : { key: 'applied', label: 'Applied', variant: 'default' };

  return (
    <Screen edges={['top']}>
      <PageHeader title="Job Openings" showBack={false} />

      <View style={styles.stats}>
        <Stat value={jobs.length} label="Total jobs" />
        <View style={styles.statDivider} />
        <Stat value={newJobs.length} label="New" />
        <View style={styles.statDivider} />
        <Stat value={appliedList.length} label="Applied" />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={s(18)} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by job position, company..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      <FlatList
        data={loading || error ? [] : data}
        keyExtractor={(item, i) => item._id || String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        renderItem={({ item }) => {
          const applied = tab === 'Applied Jobs' || appliedIds.has(String(item._id));
          return (
            <JobCard
              job={item}
              applied={applied}
              statusInfo={applied ? statusFor(item) : null}
              onPress={() =>
                navigation.navigate('JobDetail', {
                  job: item,
                  applied,
                  studentId: user?._id,
                })
              }
            />
          );
        }}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState
              emoji={tab === 'Applied Jobs' ? '📋' : '💼'}
              title={`No ${tab.toLowerCase()}`}
              subtitle={
                tab === 'Applied Jobs'
                  ? "You haven't applied to any jobs yet."
                  : tab === 'New Jobs'
                  ? 'No new openings in the last 24 hours.'
                  : 'Check back soon for new openings.'
              }
            />
          )
        }
      />
    </Screen>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: font(18), fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: font(10.5), color: colors.muted, marginTop: s(2) },
  statDivider: { width: 1, height: s(28), backgroundColor: colors.line },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: s(46),
  },
  searchInput: { flex: 1, fontSize: font(13.5), color: colors.ink, paddingVertical: 0 },
});