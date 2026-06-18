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
import { useAuth } from '@/lib/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';

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
          <ThemedText type="title" style={styles.title}>
            Brain
          </ThemedText>
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
          <ThemedText type="title" style={styles.title}>
            Brain
          </ThemedText>

          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tabButton, mode === 'signin' && styles.tabButtonActive]}
              onPress={() => setMode('signin')}>
              <ThemedText type="smallBold">Sign in</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.tabButton, mode === 'signup' && styles.tabButtonActive]}
              onPress={() => setMode('signup')}>
              <ThemedText type="smallBold">Sign up</ThemedText>
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
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText type="smallBold" style={styles.submitButtonText}>
                {mode === 'signup' ? 'Create account' : 'Sign in'}
              </ThemedText>
            )}
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  title: { textAlign: 'center', marginBottom: 24 },
  notConfigured: { textAlign: 'center', opacity: 0.7 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#1c1c1e' },
  tabButtonActive: { backgroundColor: '#0a84ff' },
  input: {
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#0a84ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#fff' },
  message: { textAlign: 'center', fontSize: 13 },
  error: { color: '#ff453a' },
  success: { color: '#30d158' },
});
