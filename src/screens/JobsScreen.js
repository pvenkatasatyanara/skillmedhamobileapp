import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader, SegmentedControl, ListCard, Chip } from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { colors, spacing, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { formatCtc } from '../utils/format';

const TABS = ['Openings', 'Applied', 'Drives'];

export default function JobsScreen({ navigation }) {
  const { token } = useAuth();
  const [tab, setTab] = useState('Openings');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.getAllJobs(token, { page: 1, limit: 30 });
      setJobs(res?.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openings = jobs.filter((j) => (j.status || 'active') === 'active');
  const applied = jobs.filter((j) => j.isAssignedJob);
  const data = tab === 'Openings' ? openings : tab === 'Applied' ? applied : [];

  const subtitleFor = (j) =>
    [j.city, formatCtc(j.ctc), j.jobType].filter(Boolean).join(' • ');

  return (
    <Screen edges={['top']}>
      <PageHeader title="Jobs & Placements" showBack={false} />
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
        renderItem={({ item }) => (
          <ListCard
            title={item.jobTitle || 'Job opening'}
            subtitle={`${item.companyName || 'Company'}${subtitleFor(item) ? ` • ${subtitleFor(item)}` : ''}`}
            iconVariant="green"
            renderIcon={(fg) => <Ionicons name="business-outline" size={s(20)} color={fg} />}
            right={<Chip label={item.isAssignedJob ? 'Applied' : 'View'} variant="green" />}
            onPress={() => navigation.navigate('JobDetail', { job: item })}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState
              emoji={tab === 'Drives' ? '🏫' : '💼'}
              title={tab === 'Drives' ? 'No drives scheduled' : `No ${tab.toLowerCase()}`}
              subtitle={
                tab === 'Applied'
                  ? "You haven't applied to any jobs yet."
                  : tab === 'Drives'
                  ? 'On-campus drives will show up here.'
                  : 'Check back soon for new openings.'
              }
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});