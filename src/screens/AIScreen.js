import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radius, font, s } from '../theme';
import { useAuth } from '../context/AuthContext';
import { fullNameOf } from '../utils/format';

export default function AIScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'ai',
      text: `Hi ${fullNameOf(user).split(' ')[0]}! I can help with your current course, explain questions, or review your code. What do you need?`,
    },
  ]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const mine = { id: String(Date.now()), role: 'me', text: t };
    const reply = {
      id: String(Date.now() + 1),
      role: 'ai',
      text: "Great question! Here's a simple explanation: think of it step by step, and practice with a small example first. Want me to generate a practice problem?",
    };
    setMessages((m) => [...m, mine, reply]);
    setText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={s(20)} color={colors.ink} />
        </TouchableOpacity>
        <LinearGradient colors={[colors.brand600, colors.brand800]} style={styles.aiIcon}>
          <Ionicons name="sparkles" size={s(18)} color={colors.white} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>SkillMedha AI</Text>
          <Text style={styles.subtitle}>Course assistant • Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.bubbles}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bub, m.role === 'me' ? styles.bubMe : styles.bubAi]}
            >
              <Text style={m.role === 'me' ? styles.bubMeText : styles.bubAiText}>{m.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your course..."
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={s(18)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  back: {
    width: s(38),
    height: s(38),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    width: s(34),
    height: s(34),
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font(15), fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: font(11), color: colors.muted, marginTop: s(1) },

  bubbles: { flex: 1 },
  bub: { maxWidth: '82%', padding: spacing.md, borderRadius: radius.lg },
  bubAi: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: s(5),
    alignSelf: 'flex-start',
  },
  bubMe: {
    backgroundColor: colors.brand600,
    borderBottomRightRadius: s(5),
    alignSelf: 'flex-end',
  },
  bubAiText: { fontSize: font(13.5), color: colors.ink, lineHeight: font(20) },
  bubMeText: { fontSize: font(13.5), color: colors.white, lineHeight: font(20) },
  
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    height: s(44),
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font(14),
    color: colors.ink,
  },
  sendBtn: {
    width: s(44),
    height: s(44),
    borderRadius: radius.md,
    backgroundColor: colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
});