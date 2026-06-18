import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';

const C = Colors.dark;

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: 'error' | 'success' } | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <BrandMark />
          <ThemedText style={styles.notConfigured}>
            Supabase isn&apos;t configured yet. Copy apps/mobile/.env.example to .env and add your
            project URL + anon key, then restart the dev server.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  async function handleSubmit() {
    setMessage(null);
    setBusy(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setMessage({ text: result.error.message, kind: 'error' });
      return;
    }
    if (mode === 'signup' && 'needsConfirmation' in result && result.needsConfirmation) {
      setMessage({ text: 'Check your email to confirm your account, then sign in.', kind: 'success' });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <BrandMark />

          <View style={styles.card}>
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tabButton, mode === 'signin' && styles.tabButtonActive]}
                onPress={() => setMode('signin')}>
                <ThemedText
                  type="smallBold"
                  style={mode === 'signin' ? styles.tabTextActive : styles.tabText}>
                  Sign in
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.tabButton, mode === 'signup' && styles.tabButtonActive]}
                onPress={() => setMode('signup')}>
                <ThemedText
                  type="smallBold"
                  style={mode === 'signup' ? styles.tabTextActive : styles.tabText}>
                  Sign up
                </ThemedText>
              </Pressable>
            </View>

            {message && (
              <ThemedText
                style={[styles.message, message.kind === 'error' ? styles.error : styles.success]}>
                {message.text}
              </ThemedText>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={C.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={C.textOnAccent} />
              ) : (
                <ThemedText type="smallBold" style={styles.submitButtonText}>
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                </ThemedText>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandChip} />
      <ThemedText type="title" style={styles.brandName}>
        Br<ThemedText type="title" style={styles.brandAccent}>ain</ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  brandChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.accentCyan,
    shadowColor: C.accentCyan,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  brandName: { fontSize: 28 },
  brandAccent: { fontSize: 28, color: C.accentCyan },
  notConfigured: { textAlign: 'center', opacity: 0.7, color: C.textSecondary },
  card: {
    backgroundColor: C.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 12,
  },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: C.backgroundSelected,
  },
  tabButtonActive: { backgroundColor: C.accentCyan },
  tabText: { color: C.textSecondary },
  tabTextActive: { color: C.textOnAccent },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 16,
    backgroundColor: C.background,
  },
  submitButton: {
    backgroundColor: C.accentCyan,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonText: { color: C.textOnAccent },
  message: { textAlign: 'center', fontSize: 13 },
  error: { color: C.accentRed },
  success: { color: C.accentGreen },
});
