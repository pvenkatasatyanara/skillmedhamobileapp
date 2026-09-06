import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation switches automatically once the token is set.
    } catch (err) {
      Alert.alert('Sign in failed', err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.wrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandline}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SM</Text>
            </View>
            <Text style={styles.brandName}>SKILLMEDHA</Text>
          </View>

          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.lead}>
            Sign in to continue learning, practicing and landing placements.
          </Text>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inp}>
              <Text style={styles.inpIcon}>✉</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@college.edu"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inp}>
              <Text style={styles.inpIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row */}
          <View style={styles.between}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember((r) => !r)}
            >
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Forgot password', 'Please contact your TPO.')}>
              <Text style={styles.link}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in */}
          <TouchableOpacity
            style={[styles.prim, loading && styles.primDisabled]}
            onPress={onSignIn}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primText}>Sign in to SkillMedha</Text>
            )}
          </TouchableOpacity>

          {/* Promo */}
          <View style={styles.promo}>
            <Text style={styles.promoNum}>50k+</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>Students learning &amp; placed</Text>
              <Text style={styles.promoSub}>Courses • Assessments • Placements</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand50 },
  wrap: {
    flexGrow: 1,
    paddingHorizontal: s(26),
    paddingBottom: spacing.xxl,
    backgroundColor: colors.brand50,
  },
  brandline: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginTop: s(40) },
  logo: {
    width: s(40),
    height: s(40),
    borderRadius: radius.sm,
    backgroundColor: colors.brand700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.white, fontWeight: '900', fontSize: font(14) },
  brandName: { fontSize: font(20), fontWeight: '800', letterSpacing: -0.5, color: colors.ink },

  h1: {
    fontSize: font(27),
    marginTop: s(40),
    marginBottom: s(6),
    letterSpacing: -0.5,
    fontWeight: '800',
    color: colors.ink,
  },
  lead: { color: colors.muted, marginBottom: s(26), fontSize: font(14), lineHeight: font(20) },

  field: { marginBottom: s(14) },
  label: {
    fontSize: font(11),
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inp: {
    marginTop: s(6),
    height: s(52),
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    gap: s(10),
  },
  inpIcon: { fontSize: font(16) },
  input: { flex: 1, fontSize: font(15), color: colors.ink, paddingVertical: 0 },
  showText: { color: colors.brand600, fontWeight: '700', fontSize: font(13) },

  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: s(8),
    marginBottom: s(20),
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  checkbox: {
    width: s(18),
    height: s(18),
    borderRadius: s(5),
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  checkboxTick: { color: colors.white, fontSize: font(11), fontWeight: '900', lineHeight: font(14) },
  rememberText: { color: colors.muted, fontSize: font(12.5) },
  link: { color: colors.brand600, fontWeight: '700', fontSize: font(12.5) },

  prim: {
    height: s(54),
    borderRadius: radius.lg,
    backgroundColor: colors.brand900,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(8),
    shadowColor: colors.brand900,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  primDisabled: { opacity: 0.7 },
  primText: { color: colors.white, fontWeight: '800', fontSize: font(15) },

  promo: {
    marginTop: 'auto',
    marginBottom: s(8),
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
    borderRadius: radius.xl,
    padding: s(14),
    flexDirection: 'row',
    gap: s(12),
    alignItems: 'center',
  },
  promoNum: { fontSize: font(20), fontWeight: '900', color: colors.brand700 },
  promoTitle: { fontSize: font(12.5), fontWeight: '800', color: colors.ink },
  promoSub: { color: colors.muted, fontSize: font(11), marginTop: s(2) },
});