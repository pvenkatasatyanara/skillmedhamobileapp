import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, PageHeader, SegmentedControl, ListCard, Chip } from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const TABS = ['Non-Technical', 'Technical', 'Company-wise'];
const TYPE_MAP = { 'Non-Technical': 'nontechnical', Technical: 'technical' };

export default function PracticeScreen({ navigation }) {
  const { token } = useAuth();
  const [tab, setTab] = useState('Non-Technical');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'Company-wise') {
        const res = await api.getCompanyTests(token);
        setItems(res?.data || []);
      } else {
        const res = await api.getSubjectsByType(token, TYPE_MAP[tab]);
        setItems(res?.data || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, token]);

  useEffect(() => {
    load();
  }, [load]);

  const openSubject = (subject) =>
    navigation.navigate('PracticeSession', {
      refId: subject._id,
      type: 'subjectId',
      title: subject.title || subject.name,
      difficulty: null,
    });

  const openCompany = (test) =>
    navigation.navigate('PracticeSession', {
      refId: test._id,
      type: test.refType || 'subjectId',
      title: test.title || test.companyName || 'Company test',
      difficulty: null,
      company: true,
    });

  return (
    <Screen edges={['top']}>
      <PageHeader title="Practice" showBack={false} />
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

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
        ListHeaderComponent={
          <LinearGradient colors={['#0ea5e9', '#0369a1']} style={styles.hero}>
            <Text style={styles.heroTitle}>Sharpen your skills</Text>
            <Text style={styles.heroSub}>
              Practice topic-wise questions and company patterns. Answers are revealed with
              explanations.
            </Text>
          </LinearGradient>
        }
        renderItem={({ item }) => {
          const company = tab === 'Company-wise';
          return (
            <ListCard
              title={item.title || item.name || item.companyName || 'Practice set'}
              subtitle={
                company
                  ? [item.companyName, item.duration ? `${item.duration} min` : null, item.totalQuestions ? `${item.totalQuestions} Q` : null]
                      .filter(Boolean)
                      .join(' • ') || 'Company pattern'
                  : `${item.questionCount ?? item.count ?? ''} questions • ${item.type || tab}`
              }
              iconVariant={company ? 'pink' : 'green'}
              renderIcon={(fg) => (
                <Ionicons name={company ? 'business-outline' : 'flash-outline'} size={s(20)} color={fg} />
              )}
              right={<Chip label="Start" variant={company ? 'pink' : 'green'} />}
              onPress={() => (company ? openCompany(item) : openSubject(item))}
            />
          );
        }}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState emoji="⚡" title="Nothing here yet" subtitle={`No ${tab.toLowerCase()} practice sets found.`} />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: spacing.gutter,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  heroTitle: { color: colors.white, fontSize: font(16), fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: font(12), marginTop: s(4), lineHeight: font(18) },
});