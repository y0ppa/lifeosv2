import type { Habit, HabitLog } from '@brain/shared';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type HabitRow = Habit & { completedToday: boolean; streak: number };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function computeStreakAndToday(logs: HabitLog[]) {
  const byDate: Record<string, HabitLog> = {};
  logs.forEach((l) => {
    byDate[l.log_date] = l;
  });
  const completedToday = !!byDate[todayISO()]?.completed;
  let streak = 0;
  const offset = completedToday ? 0 : 1;
  for (let n = offset; n < 60; n++) {
    const entry = byDate[daysAgoISO(n)];
    if (entry?.completed) streak++;
    else break;
  }
  return { completedToday, streak };
}

export default function HabitsScreen() {
  const { session } = useAuth();
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase || !session) return;
    setLoading(true);
    const { data: rawHabits, error } = await supabase
      .from('habits')
      .select('*')
      .is('archived_at', null)
      .order('created_at');
    if (error || !rawHabits) {
      setLoading(false);
      return;
    }
    if (rawHabits.length === 0) {
      setHabits([]);
      setLoading(false);
      return;
    }
    const ids = rawHabits.map((h) => h.id);
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*')
      .in('habit_id', ids)
      .gte('log_date', daysAgoISO(59));
    const logsByHabit: Record<string, HabitLog[]> = {};
    (logs ?? []).forEach((l) => {
      (logsByHabit[l.habit_id] ??= []).push(l);
    });
    setHabits(
      rawHabits.map((h) => ({ ...h, ...computeStreakAndToday(logsByHabit[h.id] ?? []) }))
    );
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleHabit(habit: HabitRow) {
    if (!supabase || !session) return;
    const nextCompleted = !habit.completedToday;
    await supabase.from('habit_logs').upsert(
      {
        habit_id: habit.id,
        user_id: session.user.id,
        log_date: todayISO(),
        completed: nextCompleted,
      },
      { onConflict: 'habit_id,log_date' }
    );
    refresh();
  }

  async function createHabit() {
    if (!supabase || !session || !newHabitName.trim()) return;
    setCreating(true);
    await supabase
      .from('habits')
      .insert({ name: newHabitName.trim(), category: 'Growth', user_id: session.user.id });
    setNewHabitName('');
    setCreating(false);
    refresh();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Habits
        </ThemedText>

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="New habit name"
            placeholderTextColor="#888"
            value={newHabitName}
            onChangeText={setNewHabitName}
            onSubmitEditing={createHabit}
          />
          <Pressable style={styles.addButton} onPress={createHabit} disabled={creating}>
            {creating ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.addButtonText}>Add</ThemedText>}
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(h) => h.id}
            ListEmptyComponent={<ThemedText style={styles.empty}>No habits yet — add one above.</ThemedText>}
            renderItem={({ item }) => (
              <Pressable style={styles.habitRow} onPress={() => toggleHabit(item)}>
                <View style={[styles.checkbox, item.completedToday && styles.checkboxDone]}>
                  {item.completedToday && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                </View>
                <View style={styles.habitInfo}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" style={styles.category}>
                    {item.category}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={styles.streak}>
                  {item.streak}d streak
                </ThemedText>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  title: { marginBottom: 4 },
  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#0a84ff',
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  loading: { marginTop: 24 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 24 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2c',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0a84ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#0a84ff' },
  checkmark: { color: '#fff' },
  habitInfo: { flex: 1 },
  category: { opacity: 0.6 },
  streak: { opacity: 0.7 },
});
