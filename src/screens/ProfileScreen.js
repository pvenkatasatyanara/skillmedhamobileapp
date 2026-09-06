import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Chip, ProgressBar } from '../components';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { fullNameOf, initialsOf } from '../utils/format';

const MENU = [
  { icon: 'document-text-outline', title: 'My Resume', sub: 'ATS score & builder', route: 'Resume' },
  { icon: 'school-outline', title: 'Education & Academics', sub: 'Marks, backlogs, batch' },
  { icon: 'analytics-outline', title: 'Analytics', sub: 'Tests • Placements • Academics' },
  { icon: 'settings-outline', title: 'Settings', sub: 'Account, notifications' },
  { icon: 'help-circle-outline', title: 'Help & Support', sub: 'FAQs, contact' },
];

export default function ProfileScreen({ navigation }) {
  const { user, token, signOut } = useAuth();
  const [creds, setCreds] = useState(null);

  useEffect(() => {
    api
      .getStudentCreds(token)
      .then((res) => setCreds(res?.data || null))
      .catch(() => {});
  }, [token]);

  const d = creds || user || {};
  const completeness = computeCompleteness(d);

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const onMenu = (item) => {
    if (item.route) navigation.navigate(item.route);
    else Alert.alert(item.title, 'Coming soon.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Header */}
        <LinearGradient colors={[colors.brand700, colors.brand900]} style={styles.phead}>
          <View style={styles.pa}>
            <Text style={styles.paText}>{initialsOf(d)}</Text>
          </View>
          <Text style={styles.name}>{fullNameOf(d)}</Text>
          <Text style={styles.sub}>
            {[d.collegeName, d.yearOfPassing && `Batch ${d.yearOfPassing}`]
              .filter(Boolean)
              .join(' • ') || d.email}
          </Text>
        </LinearGradient>

        {/* Completeness */}
        <View style={styles.completeness}>
          <View style={styles.rowBetween}>
            <Text style={styles.compLabel}>Profile completeness</Text>
            <Chip label={`${completeness}%`} variant="default" />
          </View>
          <ProgressBar
            progress={completeness}
            track={colors.brand50}
            fill={colors.brand600}
            style={{ marginTop: s(10) }}
          />
        </View>

        {/* Contact quick facts */}
        <View style={styles.facts}>
          <Fact icon="mail-outline" text={d.email} />
          <Fact icon="call-outline" text={d.phone} />
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU.map((m, i) => (
            <TouchableOpacity
              key={m.title}
              style={[styles.mi, i === MENU.length - 1 && styles.miLast]}
              onPress={() => onMenu(m)}
              activeOpacity={0.7}
            >
              <View style={styles.mic}>
                <Ionicons name={m.icon} size={s(18)} color={colors.brand700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.miTitle}>{m.title}</Text>
                <Text style={styles.miSub}>{m.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={s(18)} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.mi, styles.miLast]} onPress={onLogout} activeOpacity={0.7}>
          <View style={[styles.mic, { backgroundColor: colors.dangerBg }]}>
            <Ionicons name="log-out-outline" size={s(18)} color={colors.dangerText} />
          </View>
          <Text style={[styles.miTitle, { color: colors.dangerText }]}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ icon, text }) {
  if (!text) return null;
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={s(16)} color={colors.muted} />
      <Text style={styles.factText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function computeCompleteness(d) {
  const checks = [
    d.firstName,
    d.lastName,
    d.email,
    d.phone,
    d.collegeName,
    Array.isArray(d.educationDetails) && d.educationDetails.length,
    Array.isArray(d.projects) && d.projects.length,
    d.professionalSummary,
    Array.isArray(d.experiences) && d.experiences.length,
    d.resumeDoc,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  phead: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + s(8),
    alignItems: 'center',
  },
  pa: {
    width: s(78),
    height: s(78),
    borderRadius: radius.xxl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(10),
  },
  paText: { color: colors.white, fontSize: font(28), fontWeight: '800' },
  name: { color: colors.white, fontSize: font(19), fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: font(12.5), marginTop: s(3), textAlign: 'center' },

  completeness: {
    marginHorizontal: spacing.gutter,
    marginTop: -s(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compLabel: { fontSize: font(13), fontWeight: '700', color: colors.ink },

  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    marginTop: spacing.md,
  },
  fact: { flexDirection: 'row', alignItems: 'center', gap: s(6), maxWidth: '100%' },
  factText: { fontSize: font(12.5), color: colors.muted },

  menu: {
    marginHorizontal: spacing.gutter,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  mi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  miLast: { borderBottomWidth: 0 },
  mic: {
    width: s(38),
    height: s(38),
    borderRadius: radius.sm,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miTitle: { fontSize: font(14), fontWeight: '700', color: colors.ink },
  miSub: { fontSize: font(11), color: colors.muted, marginTop: s(2) },
});