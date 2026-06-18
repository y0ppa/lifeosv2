import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Brain</ThemedText>
        <ThemedText style={styles.subtitle}>
          Signed in as {session?.user.email}
        </ThemedText>
        <ThemedText style={styles.note}>
          This is the mobile app shell — health sync, calendar, and the rest of the dashboard land
          in later phases. Habits is the first screen wired to live data; try it from the tab bar.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 12 },
  subtitle: { opacity: 0.8 },
  note: { opacity: 0.6, fontSize: 13, marginTop: 16 },
});
