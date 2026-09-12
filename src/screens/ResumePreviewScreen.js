import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Screen, PageHeader, Chip, PrimaryButton } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { stripHtml } from '../utils/format';
import { buildResumeHtml } from '../utils/resumeHtml';

export default function ResumePreviewScreen({ route }) {
  const data = route.params?.data || {};
  const template = route.params?.template || 'modern';
  const [busy, setBusy] = useState(false);

  const name =
    [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ') || data.userName || 'Your Name';
  const contact = [data.email, data.phone, data.city].filter(Boolean).join(' • ');
  const skills = (data.technical || data.skills || []).map((sk) => (typeof sk === 'string' ? sk : sk.name)).filter(Boolean);
  const summary = stripHtml(data.professionalSummary);

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const html = buildResumeHtml(data, template);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share your resume', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Saved', `PDF generated at:\n${uri}`);
      }
    } catch (e) {
      Alert.alert('Export failed', e?.message || 'Could not generate the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <PageHeader title="Resume Preview" size="sm" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.sheet}>
          <Text style={styles.name}>{name}</Text>
          {!!contact && <Text style={styles.contact}>{contact}</Text>}

          {!!summary && (
            <Block title="Summary">
              <Text style={styles.body}>{summary}</Text>
            </Block>
          )}

          {skills.length > 0 && (
            <Block title="Skills">
              <View style={styles.chips}>
                {skills.map((sk, i) => (
                  <Chip key={i} label={sk} variant="default" />
                ))}
              </View>
            </Block>
          )}

          {(data.experiences || []).length > 0 && (
            <Block title="Experience">
              {data.experiences.map((x, i) => (
                <Entry
                  key={i}
                  title={x.role}
                  subtitle={[x.company, x.type].filter(Boolean).join(' • ')}
                  meta={[x.start || x.startDate, x.end || x.endDate].filter(Boolean).join(' - ')}
                  description={x.description}
                />
              ))}
            </Block>
          )}

          {(data.educationDetails || []).length > 0 && (
            <Block title="Education">
              {data.educationDetails.map((e, i) => (
                <Entry
                  key={i}
                  title={e.degreeName || e.type || e.school}
                  subtitle={e.school || e.board}
                  meta={[e.startDate, e.endDate || e.yearOfPass].filter(Boolean).join(' - ')}
                  description={e.grade ? `Grade: ${e.grade}` : ''}
                />
              ))}
            </Block>
          )}

          {(data.projects || []).length > 0 && (
            <Block title="Projects">
              {data.projects.map((p, i) => (
                <Entry
                  key={i}
                  title={p.project || p.title}
                  subtitle={p.company}
                  meta={[p.start, p.end].filter(Boolean).join(' - ')}
                  description={p.description}
                />
              ))}
            </Block>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.lg }}>
          <PrimaryButton title="Download / Share PDF" loading={busy} onPress={downloadPdf} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Block({ title, children }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Entry({ title, subtitle, meta, description }) {
  const desc = stripHtml(description);
  return (
    <View style={styles.entry}>
      {!!title && <Text style={styles.entryTitle}>{title}</Text>}
      {!!subtitle && <Text style={styles.entrySub}>{subtitle}</Text>}
      {!!meta && <Text style={styles.entryMeta}>{meta}</Text>}
      {!!desc && <Text style={styles.entryDesc}>{desc}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: spacing.gutter,
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  name: { fontSize: font(22), fontWeight: '900', color: colors.brand700 },
  contact: { fontSize: font(12), color: colors.muted, marginTop: s(4) },
  block: { marginTop: spacing.lg },
  blockTitle: {
    fontSize: font(12.5),
    fontWeight: '800',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 2,
    borderBottomColor: colors.brand600,
    paddingBottom: s(3),
    marginBottom: spacing.sm,
  },
  body: { fontSize: font(13), color: '#374151', lineHeight: font(20) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6) },
  entry: { marginBottom: spacing.md },
  entryTitle: { fontSize: font(13.5), fontWeight: '700', color: colors.ink },
  entrySub: { fontSize: font(12), color: colors.muted, marginTop: s(1) },
  entryMeta: { fontSize: font(11), color: '#94a3b8', marginTop: s(1) },
  entryDesc: { fontSize: font(12.5), color: '#374151', marginTop: s(3), lineHeight: font(19) },
});