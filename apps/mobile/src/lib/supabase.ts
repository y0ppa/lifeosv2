import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// EXPO_PUBLIC_* values are baked into the JS bundle at build time and are
// visible to anyone who inspects the app, same as on web — that's fine here
// because Supabase's anon key is meant to be public; real access control
// comes from Row Level Security, not key secrecy. Never put the
// service_role key behind this prefix.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
