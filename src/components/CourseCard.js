import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, font, s } from '../theme';
import Thumb from './Thumb';
import ProgressBar from './ProgressBar';
import Chip from './Chip';

/**
 * Course card with two layouts:
 *  - variant="horizontal": fixed-width card for horizontal carousels (Home)
 *  - variant="list": full-width row card with optional progress (Learn)
 */
export default function CourseCard({ course, index = 0, variant = 'horizontal', onPress }) {
  const title = course?.title || 'untitled course';
  const thumbUri = course?.media?.thumbnailImage || course?.media?.coverImage;
  const tag = course?.type || course?.category || 'course';
  const lessons = course?.sections?.length
    ? `${course.sections.length} lessons`
    : course?.duration || '';
  const rating = course?.rating || '4.8';
  const progress = course?.progress ?? course?.totalProgress ?? null;

  if (variant === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.85}>
        <Thumb uri={thumbUri} seed={course?._id || index} style={styles.listThumb} />
        <View style={styles.listBody}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.listMeta} numberOfLines={1}>
            {[course?.category, lessons].filter(Boolean).join(' • ')}
          </Text>
          {progress !== null ? (
            <>
              <ProgressBar
                progress={progress}
                track={colors.brand50}
                fill={colors.brand600}
                style={{ marginTop: s(10) }}
              />
              <View style={styles.listRow}>
                <Text style={styles.metaText}>{Math.round(progress)}% complete</Text>
                <Chip
                  label={progress > 0 ? 'In progress' : 'Not started'}
                  variant={progress > 0 ? 'green' : 'default'}
                />
              </View>
            </>
          ) : (
            <View style={styles.listRow}>
              <Chip label={course?.difficulty || 'All levels'} variant="default" />
              {!!course?.price && <Text style={styles.metaText}>₹{course.price}</Text>}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Thumb uri={thumbUri} seed={course?._id || index} style={styles.thumb}>
        <View style={styles.tag}>
          <Text style={styles.tagText} numberOfLines={1}>
            {tag}
          </Text>
        </View>
      </Thumb>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>⭐ {rating}</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {lessons}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: s(220),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  thumb: { height: s(104), justifyContent: 'flex-start' },
  tag: {
    position: 'absolute',
    top: s(10),
    left: s(10),
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    maxWidth: '80%',
  },
  tagText: { color: colors.white, fontSize: font(10) },
  body: { padding: s(11) },
  title: { fontSize: font(13.5), fontWeight: '700', color: colors.ink, lineHeight: font(18) },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: s(8), gap: s(8) },
  metaText: { fontSize: font(11), color: colors.muted },

  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
  },
  listThumb: { width: s(110) },
  listBody: { flex: 1, padding: spacing.md },
  listTitle: { fontSize: font(14), fontWeight: '700', color: colors.ink, lineHeight: font(19) },
  listMeta: { fontSize: font(11.5), color: colors.muted, marginTop: s(6) },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s(8),
  },
});