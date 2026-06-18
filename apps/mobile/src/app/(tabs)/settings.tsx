import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={styles.email}>{session?.user.email}</ThemedText>
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <ThemedText type="smallBold" style={styles.signOutText}>
            Sign out
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 16 },
  email: { opacity: 0.7 },
  signOutButton: {
    backgroundColor: '#ff453a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { color: '#fff' },
});
