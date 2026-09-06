import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, PageHeader, ListCard, Chip, ProgressBar } from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function PracticeScreen({ navigation }) {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.getSubjects(token);
      setSubjects(res?.data || []);
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
      <PageHeader title="Practice" showBack={false} />
      <FlatList
        data={loading || error ? [] : subjects}
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
          const isTech = (item.type || '').toLowerCase() === 'technical';
          return (
            <ListCard
              title={item.title}
              subtitle={`${isTech ? 'Coding & MCQ' : 'MCQ practice'} • ${item.type || 'general'}`}
              iconVariant={isTech ? 'yellow' : 'green'}
              renderIcon={(fg) => (
                <Ionicons
                  name={isTech ? 'code-slash-outline' : 'bar-chart-outline'}
                  size={s(20)}
                  color={fg}
                />
              )}
              right={<Chip label={isTech ? 'Code' : 'Easy'} variant={isTech ? 'yellow' : 'default'} />}
              onPress={() => (isTech ? navigation.navigate('Coding') : navigation.navigate('Coding'))}
            />
          );
        }}
        ListHeaderComponent={
          <View>
            {/* Daily challenge */}
            <LinearGradient colors={['#0ea5e9', '#0369a1']} style={styles.hero}>
              <Text style={styles.heroTitle}>Daily Challenge</Text>
              <Text style={styles.heroSub}>Solve 3 problems to keep your streak alive</Text>
              <ProgressBar progress={33} style={{ marginTop: s(12) }} />
              <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('Coding')}>
                <Text style={styles.heroBtnText}>Start (1/3)</Text>
              </TouchableOpacity>
            </LinearGradient>
            <View style={styles.secH}>
              <Text style={styles.secHTitle}>Practice by subject</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState emoji="⚡" title="No subjects yet" subtitle="Check back soon for practice sets." />
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
    marginBottom: spacing.sm,
  },
  heroTitle: { color: colors.white, fontSize: font(16), fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: font(12), marginTop: s(4) },
  heroBtn: {
    marginTop: s(14),
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: s(14),
    paddingVertical: s(9),
    borderRadius: radius.md,
  },
  heroBtnText: { color: '#0369a1', fontWeight: '800', fontSize: font(13) },
  secH: { paddingHorizontal: spacing.gutter, marginTop: spacing.lg, marginBottom: spacing.md },
  secHTitle: { fontSize: font(15), fontWeight: '800', color: colors.ink },
});