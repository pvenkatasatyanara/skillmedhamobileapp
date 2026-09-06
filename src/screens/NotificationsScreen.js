import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader, ListCard, Chip } from '../components';
import { chipVariantForPriority } from '../components/Chip';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { spacing, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { stripHtml, timeAgo } from '../utils/format';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.getNotices(token);
      setItems(res?.data || []);
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

  return (
    <Screen edges={['top']}>
      <PageHeader title="Notifications" size="sm" />
      <FlatList
        data={loading || error ? [] : items}
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
            title={item.title || 'Notice'}
            subtitle={stripHtml(item.message) || item.type}
            iconVariant={chipVariantForPriority(item.priority)}
            renderIcon={(fg) => <Ionicons name={iconFor(item.type)} size={s(20)} color={fg} />}
            right={
              item.createdAt ? (
                <Chip label={timeAgo(item.createdAt)} variant="default" />
              ) : null
            }
            subtitleLines={3}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState emoji="🔔" title="No notifications" subtitle="You're all caught up." />
          )
        }
      />
    </Screen>
  );
}

function iconFor(type) {
  switch ((type || '').toLowerCase()) {
    case 'placement':
      return 'trophy-outline';
    case 'internship':
      return 'briefcase-outline';
    case 'workshop':
      return 'construct-outline';
    case 'test':
      return 'document-text-outline';
    default:
      return 'notifications-outline';
  }
}