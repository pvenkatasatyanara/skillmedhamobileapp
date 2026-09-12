import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, PageHeader, SectionHeader, PrimaryButton } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { stripHtml } from '../utils/format';

export default function ResumeEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? s(16) : 0) + spacing.md;
  const { token } = useAuth();
  const template = route.params?.template || 'modern';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    professionalSummary: '',
    technical: [],
    languages: [],
    educationDetails: [],
    experiences: [],
    projects: [],
    links: [],
  });

  useEffect(() => {
    api
      .getStudentCreds(token)
      .then((res) => {
        const d = res?.data || {};
        setForm((prev) => ({
          ...prev,
          firstName: d.firstName || '',
          middleName: d.middleName || '',
          lastName: d.lastName || '',
          email: d.email || '',
          phone: d.phone || '',
          city: d.addresses?.currentAddress?.cityName || d.city || '',
          professionalSummary: stripHtml(d.professionalSummary) || '',
          technical: normalizeSkills(d.technical),
          languages: Array.isArray(d.languages) ? d.languages : [],
          educationDetails: Array.isArray(d.educationDetails) ? d.educationDetails : [],
          experiences: Array.isArray(d.experiences) ? d.experiences : [],
          projects: Array.isArray(d.projects) ? d.projects : [],
          links: Array.isArray(d.links) ? d.links : [],
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const addEntry = (key, blank) => set(key, [...(form[key] || []), blank]);
  const updateEntry = (key, idx, field, val) =>
    set(
      key,
      form[key].map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    );
  const removeEntry = (key, idx) => set(key, form[key].filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        phone: form.phone,
        city: form.city,
        professionalSummary: form.professionalSummary,
        technical: form.technical,
        languages: form.languages,
        educationDetails: form.educationDetails,
        experiences: form.experiences,
        projects: form.projects,
        links: form.links,
      };
      await api.updateStudent(token, payload);
      Alert.alert('Saved', 'Your resume details were saved.');
    } catch (e) {
      Alert.alert('Save failed', e?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const preview = () => navigation.navigate('ResumePreview', { data: form, template });

  return (
    <Screen edges={['top']}>
      <PageHeader title="Edit Resume" size="sm" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      >
        <SectionHeader title="Personal details" />
        <View style={styles.group}>
          <Row>
            <Field label="First name" value={form.firstName} onChange={(v) => set('firstName', v)} />
            <Field label="Last name" value={form.lastName} onChange={(v) => set('lastName', v)} />
          </Row>
          <Field label="Email" value={form.email} editable={false} />
          <Row>
            <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} keyboardType="phone-pad" />
            <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
          </Row>
          <Field
            label="Professional summary"
            value={form.professionalSummary}
            onChange={(v) => set('professionalSummary', v)}
            multiline
          />
        </View>

        <SectionHeader title="Skills" />
        <View style={styles.group}>
          <Field
            label="Skills (comma separated)"
            value={(form.technical || []).map((t) => (typeof t === 'string' ? t : t.name)).join(', ')}
            onChange={(v) => set('technical', v.split(',').map((x) => x.trim()).filter(Boolean))}
          />
          <Field
            label="Languages (comma separated)"
            value={(form.languages || []).join(', ')}
            onChange={(v) => set('languages', v.split(',').map((x) => x.trim()).filter(Boolean))}
          />
        </View>

        <EntryEditor
          title="Education"
          items={form.educationDetails}
          onAdd={() => addEntry('educationDetails', { school: '', degreeName: '', startDate: '', endDate: '', grade: '' })}
          onRemove={(i) => removeEntry('educationDetails', i)}
          fields={[
            { key: 'degreeName', label: 'Degree / Qualification' },
            { key: 'school', label: 'Institution' },
            { key: 'startDate', label: 'Start', half: true },
            { key: 'endDate', label: 'End', half: true },
            { key: 'grade', label: 'Grade' },
          ]}
          onChange={(i, f, v) => updateEntry('educationDetails', i, f, v)}
        />

        <EntryEditor
          title="Experience"
          items={form.experiences}
          onAdd={() => addEntry('experiences', { role: '', company: '', start: '', end: '', description: '' })}
          onRemove={(i) => removeEntry('experiences', i)}
          fields={[
            { key: 'role', label: 'Role' },
            { key: 'company', label: 'Company' },
            { key: 'start', label: 'Start', half: true },
            { key: 'end', label: 'End', half: true },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          onChange={(i, f, v) => updateEntry('experiences', i, f, v)}
        />

        <EntryEditor
          title="Projects"
          items={form.projects}
          onAdd={() => addEntry('projects', { project: '', description: '', start: '', end: '' })}
          onRemove={(i) => removeEntry('projects', i)}
          fields={[
            { key: 'project', label: 'Project name' },
            { key: 'start', label: 'Start', half: true },
            { key: 'end', label: 'End', half: true },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          onChange={(i, f, v) => updateEntry('projects', i, f, v)}
        />

      </ScrollView>

      <View style={[styles.actions, { paddingBottom: bottomPad }]}>
        <PrimaryButton title="Preview" variant="secondary" height={48} style={{ flex: 1 }} onPress={preview} />
        <PrimaryButton title="Save" height={48} style={{ flex: 1 }} loading={saving} onPress={save} />
      </View>
    </Screen>
  );
}

function normalizeSkills(technical) {
  if (!Array.isArray(technical)) return [];
  return technical.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean);
}

function Row({ children }) {
  return <View style={styles.row}>{children}</View>;
}

function Field({ label, value, onChange, editable = true, multiline = false, keyboardType }) {
  return (
    <View style={[styles.field, { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChange}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function EntryEditor({ title, items, fields, onAdd, onRemove, onChange }) {
  return (
    <>
      <SectionHeader title={title} actionLabel="+ Add" onAction={onAdd} />
      {!(items || []).length ? (
        <Text style={styles.empty}>No {title.toLowerCase()} added yet.</Text>
      ) : (
        items.map((item, i) => (
          <View key={i} style={styles.entryCard}>
            <View style={styles.entryHead}>
              <Text style={styles.entryHeadText}>
                {title} {i + 1}
              </Text>
              <TouchableOpacity onPress={() => onRemove(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={s(18)} color={colors.dangerText} />
              </TouchableOpacity>
            </View>
            <View style={styles.rowWrap}>
              {fields.map((f) => (
                <View key={f.key} style={{ width: f.half ? '48%' : '100%' }}>
                  <Field
                    label={f.label}
                    value={item[f.key] || ''}
                    onChange={(v) => onChange(i, f.key, v)}
                    multiline={f.multiline}
                  />
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  group: { paddingHorizontal: spacing.gutter, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  field: { marginBottom: spacing.sm },
  label: { fontSize: font(11.5), fontWeight: '700', color: colors.muted, marginBottom: s(4) },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: s(10),
    fontSize: font(13.5),
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputMultiline: { minHeight: s(70), textAlignVertical: 'top' },
  inputDisabled: { backgroundColor: colors.bg, color: colors.muted },
  empty: { paddingHorizontal: spacing.gutter, color: colors.muted, fontSize: font(12.5), marginBottom: spacing.sm },
  entryCard: {
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  entryHeadText: { fontSize: font(13), fontWeight: '800', color: colors.ink },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});