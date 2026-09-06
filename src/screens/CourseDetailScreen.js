import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Screen,
  PageHeader,
  SegmentedControl,
  Chip,
  SectionHeader,
  PrimaryButton,
  VideoPlayer,
} from '../components';
import { LoadingState } from '../components/StatePlaceholder';
import { colors, spacing, radius, font, s, screenWidth } from '../theme';
import { stripHtml } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const SEG = ['Overview', 'Lessons', 'Resources'];

// Pull the first playable video URI out of a topic.
function topicVideo(topic) {
  const v = topic?.videos;
  if (Array.isArray(v)) return v.find((x) => typeof x === 'string' && x) || null;
  if (typeof v === 'string') return v;
  return null;
}

export default function CourseDetailScreen({ route }) {
  const { token } = useAuth();
  const course = route.params?.course || {};
  const [seg, setSeg] = useState('Lessons');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.getCourseDetail(token, course._id);
        if (alive) setDetail(res || null);
      } catch (_) {
        if (alive) setDetail(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, course._id]);

  // Flatten sections -> topics, tagging which have a playable video.
  const { topics, completedIds } = useMemo(() => {
    const d = detail?.data || {};
    const list = [];
    (d.sections || []).forEach((sec) => {
      (sec.topics || []).forEach((t) => {
        list.push({
          id: t._id,
          title: t.title || 'Untitled lesson',
          sectionTitle: sec.title,
          about: t.about,
          video: topicVideo(t),
          hasMeeting: !!t.meetings || !!t.meetingId,
          resources: Array.isArray(t.resources) ? t.resources : [],
          sourceCode: Array.isArray(t.sourceCode) ? t.sourceCode : [],
        });
      });
    });
    return { topics: list, completedIds: new Set(detail?.completedTopicIds || []) };
  }, [detail]);

  // Default selection: first lesson that actually has a video.
  useEffect(() => {
    if (selectedId || topics.length === 0) return;
    const firstWithVideo = topics.find((t) => t.video);
    setSelectedId((firstWithVideo || topics[0]).id);
  }, [topics, selectedId]);

  const selected = topics.find((t) => t.id === selectedId) || null;
  const videoHeight = Math.round((screenWidth - s(32)) * (9 / 16));

  const title = course.title || detail?.data?.title || 'Course';
  const description =
    stripHtml(course.description) || 'No description available for this course.';
  const includes = course.courseIncludes || {};
  const skills = Array.isArray(course.skills) ? course.skills : [];
  const allResources = topics.flatMap((t) => [...t.resources, ...t.sourceCode]);

  return (
    <Screen edges={['top']}>
      <PageHeader title={title} size="sm" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Player */}
        <View style={[styles.playerWrap, { height: videoHeight }]}>
          {loading ? (
            <View style={styles.playerPlaceholder}>
              <LoadingState style={{ paddingVertical: 0 }} />
            </View>
          ) : selected?.video ? (
            <VideoPlayer
              key={selected.id}
              uri={selected.video}
              autoPlay={false}
              style={{ height: videoHeight, borderRadius: radius.xl }}
            />
          ) : (
            <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.playerPlaceholder}>
              <Ionicons
                name={selected?.hasMeeting ? 'people-outline' : 'videocam-off-outline'}
                size={s(38)}
                color="#94a3b8"
              />
              <Text style={styles.placeholderText}>
                {selected?.hasMeeting
                  ? 'This lesson is a live/recorded session'
                  : topics.length
                  ? 'No video uploaded for this lesson yet'
                  : 'No lessons available yet'}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Now playing */}
        {selected && (
          <View style={styles.nowPlaying}>
            <Text style={styles.nowTitle} numberOfLines={2}>
              {selected.title}
            </Text>
            {!!selected.sectionTitle && (
              <Text style={styles.nowSection} numberOfLines={1}>
                {selected.sectionTitle}
              </Text>
            )}
          </View>
        )}

        <View style={styles.metaRow}>
          {!!course.difficulty && <Chip label={course.difficulty} variant="green" />}
          {!!course.category && <Chip label={course.category} variant="default" />}
          {!!course.duration && <Chip label={course.duration} variant="yellow" />}
        </View>

        <SegmentedControl options={SEG} value={seg} onChange={setSeg} style={{ marginTop: spacing.md }} />

        {seg === 'Overview' && (
          <View>
            <Text style={styles.body}>{description}</Text>
            {skills.length > 0 && (
              <>
                <SectionHeader title="Skills you'll gain" />
                <View style={styles.skillswrap}>
                  {skills.map((sk) => (
                    <Chip key={sk} label={sk} variant="default" style={{ marginBottom: s(8) }} />
                  ))}
                </View>
              </>
            )}
            <SectionHeader title="This course includes" />
            <View style={styles.includes}>
              <IncludeRow icon="videocam-outline" label="Video" value={includes.videoDuration} />
              <IncludeRow icon="albums-outline" label="Lessons" value={topics.length || includes.articles} />
              <IncludeRow icon="code-slash-outline" label="Coding exercises" value={includes.codingExercises} />
              <IncludeRow icon="help-circle-outline" label="Quizzes" value={includes.quizzes} />
              <IncludeRow icon="cloud-download-outline" label="Resources" value={includes.downloadableResources} />
              <IncludeRow
                icon="ribbon-outline"
                label="Certificate"
                value={includes.certificateOfCompletion ? 'Yes' : undefined}
              />
            </View>
          </View>
        )}

        {seg === 'Lessons' && (
          <View style={{ marginTop: spacing.sm }}>
            <SectionHeader
              title="Lessons"
              actionLabel={topics.length ? `${completedIds.size}/${topics.length} done` : undefined}
            />
            {loading ? (
              <LoadingState />
            ) : topics.length === 0 ? (
              <Text style={styles.body}>No lessons available for this course yet.</Text>
            ) : (
              topics.map((l, i) => {
                const done = completedIds.has(l.id);
                const active = l.id === selectedId;
                return (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.lesson, active && styles.lessonActive]}
                    onPress={() => setSelectedId(l.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.lessonNum, done && styles.lessonNumDone]}>
                      {done ? (
                        <Ionicons name="checkmark" size={s(15)} color={colors.white} />
                      ) : (
                        <Text style={styles.lessonNumText}>{i + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lessonTitle, active && { color: colors.brand700 }]} numberOfLines={2}>
                        {l.title}
                      </Text>
                      <Text style={styles.lessonSub}>
                        {l.video ? 'Video lesson' : l.hasMeeting ? 'Live session' : 'Reading'}
                      </Text>
                    </View>
                    <Ionicons
                      name={active ? 'pause-circle' : l.video ? 'play-circle-outline' : 'document-text-outline'}
                      size={s(22)}
                      color={active ? colors.brand600 : l.video ? colors.brand600 : colors.muted}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {seg === 'Resources' && (
          <View style={{ marginTop: spacing.sm }}>
            {allResources.length === 0 ? (
              <Text style={styles.body}>No downloadable resources for this course yet.</Text>
            ) : (
              allResources.map((url, i) => (
                <TouchableOpacity
                  key={`${url}-${i}`}
                  style={styles.resource}
                  onPress={() => Linking.openURL(encodeURI(url))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-attach-outline" size={s(20)} color={colors.brand700} />
                  <Text style={styles.resourceText} numberOfLines={1}>
                    {decodeURIComponent(url.split('/').pop()) || 'Resource'}
                  </Text>
                  <Ionicons name="download-outline" size={s(18)} color={colors.muted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {selected?.video && (
          <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.lg }}>
            <PrimaryButton
              title="Mark lesson complete"
              variant="secondary"
              onPress={() => {}}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function IncludeRow({ icon, label, value }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.includeRow}>
      <Ionicons name={icon} size={s(18)} color={colors.brand700} />
      <Text style={styles.includeLabel}>{label}</Text>
      <Text style={styles.includeValue}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  playerWrap: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  playerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {color: '#cbd5e1',fontSize: font(12.5),textAlign: 'center',paddingHorizontal: spacing.lg },
  
  nowPlaying: {paddingHorizontal: spacing.gutter,marginTop: spacing.md},
  nowTitle: {fontSize: font(16),fontWeight: '800',color: colors.ink},
  nowSection: {fontSize: font(12),color: colors.muted,marginTop: s(2)},

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginTop: s(10),
    paddingHorizontal: spacing.gutter,
  },

  body: {
    fontSize: font(13.5),
    lineHeight: font(21),
    color: '#475569',
    paddingHorizontal: spacing.gutter,
    marginTop: spacing.md,
  },
  skillswrap: {flexDirection: 'row',flexWrap: 'wrap',gap: s(8),paddingHorizontal: spacing.gutter},
  includes: {paddingHorizontal: spacing.gutter,gap: s(2)},
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: s(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  includeLabel: {flex: 1,fontSize: font(13.5),color: colors.ink},
  includeValue: {fontSize: font(13),fontWeight: '700',color: colors.muted},

  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lessonActive: {backgroundColor: colors.brand50},
  lessonNum: {
    width: s(30),
    height: s(30),
    borderRadius: s(9),
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumDone: {backgroundColor: colors.ok},
  lessonNumText: {color: colors.brand700,fontWeight: '800',fontSize: font(13)},
  lessonTitle: {fontSize: font(13.5),fontWeight: '600',color: colors.ink},
  lessonSub: {fontSize: font(11),color: colors.muted,marginTop: s(2)},

  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  resourceText: {flex: 1,fontSize: font(13),color: colors.ink},
});