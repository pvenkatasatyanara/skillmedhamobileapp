import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader, SegmentedControl, CourseCard, Chip } from '../components';
import { LoadingState, ErrorState, EmptyState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const TABS = ['Courses', 'Internships', 'Workshops'];
const CATEGORIES = ['All', 'Programming', 'Data', 'Mobile', 'Soft Skills'];

export default function LearnScreen({ navigation }) {
  const { token } = useAuth();
  const [tab, setTab] = useState('Courses');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (tab === 'Courses') res = await api.getCoursesCombo(token, { pageNo: 1 });
      else if (tab === 'Internships') res = await api.getAllInternships();
      else res = await api.getAllWorkshops();
      setItems(res?.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, token]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((it) => {
    const matchCat =
      category === 'All' ||
      (it.category || '').toLowerCase().includes(category.toLowerCase());
    const matchSearch =
      !search || (it.title || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <Screen edges={['top']}>
      <PageHeader title="Learn" showBack={false} />
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      <FlatList
        data={loading || error ? [] : filtered}
        keyExtractor={(item, i) => item._id || String(i)}
        renderItem={({ item, index }) => (
          <CourseCard
            course={item}
            index={index}
            variant="list"
            onPress={() => navigation.navigate('CourseDetail', { course: item })}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ListHeaderComponent={
          <View>
            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={s(18)} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search courses, skills, topics..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            {/* Category chips */}
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              renderItem={({ item: c }) => (
                <TouchableOpacity onPress={() => setCategory(c)} activeOpacity={0.8}>
                  <Chip
                    label={c}
                    variant={c === category ? 'default' : 'default'}
                    style={c === category ? styles.chipActive : styles.chipIdle}
                    textStyle={c === category ? styles.chipActiveText : undefined}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <EmptyState
              emoji="🔍"
              title="Nothing found"
              subtitle={`No ${tab.toLowerCase()} match your filters.`}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.gutter,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: s(46),
  },
  searchInput: { flex: 1, fontSize: font(13.5), color: colors.ink, paddingVertical: 0 },
  chipsRow: { paddingHorizontal: spacing.gutter, gap: spacing.sm, paddingVertical: spacing.md },
  chipIdle: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.brand600 },
  chipActiveText: { color: colors.white },
});