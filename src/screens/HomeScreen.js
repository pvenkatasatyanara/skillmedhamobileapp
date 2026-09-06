import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, SectionHeader, ListCard, CourseCard, Chip, ProgressBar } from '../components';
import { chipVariantForPriority } from '../components/Chip';
import { LoadingState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { fullNameOf, initialsOf, greeting } from '../utils/format';

const QUICK_ACTIONS = [
  { icon: 'library', label: 'Courses', route: 'Learn' },
  { icon: 'flash', label: 'Practice', route: 'Practice' },
  { icon: 'document-text', label: 'Tests', route: 'Tests' },
  { icon: 'briefcase', label: 'Jobs', route: 'Jobs' },
  { icon: 'reader', label: 'Resume', route: 'Resume' },
  { icon: 'school', label: 'Internships', route: 'Learn' },
  { icon: 'book', label: 'Library', route: 'Learn' },
  { icon: 'sparkles', label: 'Ask AI', route: 'AI' },
];

export default function HomeScreen({ navigation }) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, coursesRes] = await Promise.allSettled([
        api.getDashboardStats(token),
        api.getCoursesCombo(token, { pageNo: 1 }),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value?.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const notifications = stats?.recentNotifications ?? [];
  const notificationsCount = stats?.notificationsCount ?? 0;
  const streak = user?.loginStreak ?? 0;
  const featured = courses[0];

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.apphead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hi}>{greeting()}</Text>
            <Text style={styles.nm} numberOfLines={1}>
              {fullNameOf(user)}
            </Text>
          </View>
          <View style={styles.headActions}>
            <TouchableOpacity
              style={styles.iconbtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              {notificationsCount > 0 && <View style={styles.dot} />}
              <Ionicons name="notifications-outline" size={s(20)} color="#334155" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.avatarText}>{initialsOf(user)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <LinearGradient
          colors={[colors.brand600, colors.brand900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Chip label="Continue Learning" variant="light" />
          <Text style={styles.heroTitle} numberOfLines={1}>
            {featured?.title || 'Full-Stack Web Development'}
          </Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            {featured?.category || 'React State Management'} · 12 min left
          </Text>
          <ProgressBar progress={68} style={{ marginTop: s(14) }} />
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() =>
              featured
                ? navigation.navigate('CourseDetail', { course: featured })
                : navigation.navigate('Learn')
            }
          >
            <Text style={styles.heroBtnText}>Resume ▶</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.grid4}>
          {QUICK_ACTIONS.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              style={styles.qa}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(qa.route)}
            >
              <View style={styles.qaIc}>
                <Ionicons name={`${qa.icon}-outline`} size={s(24)} color={colors.brand700} />
              </View>
              <Text style={styles.qaLabel}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress stats */}
        <SectionHeader title="Your progress" />
        {loading ? (
          <LoadingState style={{ paddingVertical: spacing.xl }} />
        ) : (
          <View style={styles.stat3}>
            <StatBox value={stats?.coursesCount ?? '-'} label={'Courses\navailable'} />
            <StatBox value={stats?.internshipsCount ?? '-'} label={'Internships\nopen'} />
            <StatBox value={`${streak} 🔥`} label={'Day\nstreak'} />
          </View>
        )}

        {/* Notifications */}
        <SectionHeader
          title="Recent notifications"
          actionLabel={notificationsCount > 0 ? 'See all' : undefined}
          onAction={() => navigation.navigate('Notifications')}
        />
        {!loading && notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>You're all caught up 🎉</Text>
          </View>
        ) : (
          notifications.slice(0, 3).map((n) => (
            <ListCard
              key={n._id}
              title={n.title || 'Notice'}
              subtitle={n.message || n.type}
              iconVariant={chipVariantForPriority(n.priority)}
              renderIcon={(fg) => (
                <Ionicons name={iconFor(n.type)} size={s(20)} color={fg} />
              )}
              right={n.priority ? <Chip label={n.priority} variant={chipVariantForPriority(n.priority)} /> : null}
              onPress={() => navigation.navigate('Notifications')}
            />
          ))
        )}

        {/* Recommended courses */}
        <SectionHeader
          title="Recommended courses"
          actionLabel="See all"
          onAction={() => navigation.navigate('Learn')}
        />
        {loading ? (
          <LoadingState style={{ paddingVertical: spacing.lg }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hscroll}
          >
            {(courses.length ? courses : []).slice(0, 6).map((c, i) => (
              <CourseCard
                key={c._id || i}
                course={c}
                index={i}
                variant="horizontal"
                onPress={() => navigation.navigate('CourseDetail', { course: c })}
              />
            ))}
            {courses.length === 0 && (
              <Text style={[styles.emptyText, { marginLeft: spacing.gutter }]}>
                No courses yet.
              </Text>
            )}
          </ScrollView>
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AI')}
        >
          <Ionicons name="sparkles" size={s(24)} color={colors.white} />
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function StatBox({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statB}>{value}</Text>
      <Text style={styles.statSpan}>{label}</Text>
    </View>
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
      return 'pricetag-outline';
  }
}

const styles = StyleSheet.create({
  apphead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  hi: { fontSize: font(13), color: colors.muted },
  nm: { fontSize: font(19), fontWeight: '800', color: colors.ink },
  headActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  iconbtn: {
    width: s(40),
    height: s(40),
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: s(8),
    right: s(9),
    width: s(8),
    height: s(8),
    backgroundColor: colors.danger,
    borderRadius: s(4),
    borderWidth: 2,
    borderColor: colors.white,
    zIndex: 2,
  },
  avatar: {
    width: s(42),
    height: s(42),
    borderRadius: radius.md,
    backgroundColor: colors.brand700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: font(15) },

  hero: {
    marginHorizontal: spacing.gutter,
    marginTop: spacing.xs,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  heroTitle: { color: colors.white, fontSize: font(16), fontWeight: '700', marginTop: s(10) },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: font(12), marginTop: s(4) },
  heroBtn: {
    marginTop: s(14),
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: s(14),
    paddingVertical: s(9),
    borderRadius: radius.md,
  },
  heroBtnText: { color: colors.brand700, fontWeight: '800', fontSize: font(13) },

  grid4: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  qa: { width: '25%', alignItems: 'center', paddingVertical: s(8), gap: s(7) },
  qaIc: {
    width: s(54),
    height: s(54),
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: { fontSize: font(11), fontWeight: '600', color: '#334155' },

  stat3: { flexDirection: 'row', paddingHorizontal: spacing.gutter, gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statB: { fontSize: font(18), fontWeight: '800', color: colors.ink },
  statSpan: { fontSize: font(10.5), color: colors.muted, textAlign: 'center', marginTop: s(2) },

  emptyCard: {
    marginHorizontal: spacing.gutter,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: { color: colors.muted, fontSize: font(13) },

  hscroll: { paddingHorizontal: spacing.gutter, gap: spacing.md, paddingBottom: s(6) },
  
  fab: {
    position: 'absolute',
    bottom: s(20),
    right: spacing.lg,
    width: s(56),
    height: s(56),
    borderRadius: radius.xl,
    backgroundColor: colors.brand700,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand600,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});