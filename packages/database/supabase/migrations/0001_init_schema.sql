-- ============================================================================
-- Brain — initial schema (Phase 1)
-- Replaces the old single-blob app_state model with normalized, per-user
-- tables. Every user-owned table carries user_id, created_at, updated_at,
-- and is locked down with Row Level Security restricted to auth.uid().
--
-- Apply this once, in order, via the Supabase Dashboard SQL Editor
-- (Project -> SQL Editor -> paste -> Run), or via `supabase db push`
-- once the project is linked with an access token.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Generic "own rows only" RLS policy set, applied per table below.
-- (Written out per-table rather than via a loop so every policy is visible
-- and auditable directly in this file.)

-- ----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users. Holds identity + goals + app settings.
-- Goals/settings are kept as jsonb here rather than as separate tables to
-- avoid a sea of tiny single-row tables; everything else below is fully
-- normalized.
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'New User',
  initials text not null default 'U',
  email text,
  assistant_name text not null default 'ARIA',
  goals jsonb not null default '{
    "calories": 2000, "protein": 150, "carbs": 200, "fat": 70,
    "fiber": 30, "waterOz": 100, "steps": 10000, "sleepHours": 8,
    "weightGoalLb": null, "weeklyWorkouts": 4
  }'::jsonb,
  settings jsonb not null default '{
    "theme": "dark", "units": "imperial",
    "notifications": {"workouts": true, "meals": true, "habits": true, "deadlines": true, "applications": false},
    "quietHours": {"enabled": true, "start": "22:00", "end": "07:00"},
    "voice": {"enabled": true, "rate": 1, "volume": 0.8, "voiceName": "", "wakePhrase": true, "soundEnabled": false, "soundVolume": 0.4},
    "schedule": {"trainingDays": ["Mon","Tue","Thu","Fri","Sat"]}
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- No insert/delete policy: rows are created by the handle_new_user trigger
-- (security definer) and removed via auth.users cascade only.

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up (web or mobile,
-- same Supabase project -> same trigger covers both).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, initials)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- integrations — connection registry shown on the Integrations screen
-- (Apple Health, Health Connect, Google Calendar, Gmail, GitHub, nutrition
-- providers, push notifications). Health-specific permission granularity
-- lives in health_connections / health_permissions below; this table is the
-- simple "is it connected, when did it last sync" summary row per provider.
-- ----------------------------------------------------------------------------

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in (
    'apple_health', 'health_connect', 'google_calendar', 'gmail',
    'github', 'nutrition_usda', 'nutrition_off', 'push_notifications'
  )),
  connected boolean not null default false,
  external_account_id text,
  scopes text[] not null default '{}',
  last_sync_at timestamptz,
  last_sync_record_count integer not null default 0,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index integrations_user_id_idx on public.integrations (user_id);

alter table public.integrations enable row level security;
create policy "integrations_select_own" on public.integrations for select using (auth.uid() = user_id);
create policy "integrations_insert_own" on public.integrations for insert with check (auth.uid() = user_id);
create policy "integrations_update_own" on public.integrations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "integrations_delete_own" on public.integrations for delete using (auth.uid() = user_id);

create trigger integrations_set_updated_at before update on public.integrations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- health_connections — HealthKit / Health Connect specific connection state
-- ----------------------------------------------------------------------------

create table public.health_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('apple_health', 'health_connect')),
  status text not null default 'pending' check (status in ('connected', 'disconnected', 'error', 'pending')),
  platform_version text,
  last_sync_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index health_connections_user_id_idx on public.health_connections (user_id);

alter table public.health_connections enable row level security;
create policy "health_connections_select_own" on public.health_connections for select using (auth.uid() = user_id);
create policy "health_connections_insert_own" on public.health_connections for insert with check (auth.uid() = user_id);
create policy "health_connections_update_own" on public.health_connections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_connections_delete_own" on public.health_connections for delete using (auth.uid() = user_id);

create trigger health_connections_set_updated_at before update on public.health_connections
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- health_permissions — per data-type grant state for a health connection
-- ----------------------------------------------------------------------------

create table public.health_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid not null references public.health_connections (id) on delete cascade,
  data_type text not null check (data_type in (
    'steps', 'distance_walking_running', 'active_calories', 'workouts',
    'exercise_time', 'heart_rate', 'resting_heart_rate', 'sleep',
    'body_weight', 'water_intake', 'dietary_energy', 'dietary_nutrients'
  )),
  access text not null default 'read' check (access in ('read', 'write')),
  granted boolean not null default false,
  requested_at timestamptz not null default now(),
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, data_type, access)
);

create index health_permissions_user_id_idx on public.health_permissions (user_id);
create index health_permissions_connection_id_idx on public.health_permissions (connection_id);

alter table public.health_permissions enable row level security;
create policy "health_permissions_select_own" on public.health_permissions for select using (auth.uid() = user_id);
create policy "health_permissions_insert_own" on public.health_permissions for insert with check (auth.uid() = user_id);
create policy "health_permissions_update_own" on public.health_permissions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_permissions_delete_own" on public.health_permissions for delete using (auth.uid() = user_id);

create trigger health_permissions_set_updated_at before update on public.health_permissions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- health_sync_jobs — one row per sync run, for the Sync Status screen
-- ----------------------------------------------------------------------------

create table public.health_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid references public.health_connections (id) on delete cascade,
  job_type text not null check (job_type in ('initial_import', 'incremental', 'manual')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'partial')),
  data_types text[] not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_imported integer not null default 0,
  records_skipped integer not null default 0,
  error text,
  cursor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index health_sync_jobs_user_id_idx on public.health_sync_jobs (user_id, started_at desc);

alter table public.health_sync_jobs enable row level security;
create policy "health_sync_jobs_select_own" on public.health_sync_jobs for select using (auth.uid() = user_id);
create policy "health_sync_jobs_insert_own" on public.health_sync_jobs for insert with check (auth.uid() = user_id);
create policy "health_sync_jobs_update_own" on public.health_sync_jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- No delete policy: sync history is append-only / retained for audit.

-- ----------------------------------------------------------------------------
-- health_records — raw imported records with full source attribution.
-- Idempotency: (user_id, provider, external_id) is unique whenever the
-- source gives us a stable external id, so re-importing never duplicates.
-- ----------------------------------------------------------------------------

create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('apple_health', 'health_connect', 'manual')),
  source_app text,
  external_id text,
  record_type text not null check (record_type in (
    'steps', 'distance_walking_running', 'active_calories', 'exercise_time',
    'heart_rate', 'resting_heart_rate', 'sleep', 'body_weight',
    'water_intake', 'dietary_energy', 'dietary_nutrient'
  )),
  start_time timestamptz not null,
  end_time timestamptz not null,
  time_zone text not null default 'UTC',
  unit text not null,
  value numeric not null,
  data_origin text not null default 'measured' check (data_origin in ('measured', 'estimated', 'calculated', 'manual')),
  imported_at timestamptz not null default now(),
  source_modified_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create index health_records_user_time_idx on public.health_records (user_id, record_type, start_time desc);

alter table public.health_records enable row level security;
create policy "health_records_select_own" on public.health_records for select using (auth.uid() = user_id);
create policy "health_records_insert_own" on public.health_records for insert with check (auth.uid() = user_id);
create policy "health_records_update_own" on public.health_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_records_delete_own" on public.health_records for delete using (auth.uid() = user_id);

create trigger health_records_set_updated_at before update on public.health_records
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- daily_health_summaries — one rollup row per user per day, what the
-- Today screen actually reads (cheap to query vs. summing health_records).
-- ----------------------------------------------------------------------------

create table public.daily_health_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  steps integer,
  active_calories numeric,
  exercise_minutes numeric,
  distance_m numeric,
  resting_heart_rate numeric,
  sleep_minutes integer,
  water_ml numeric,
  weight_kg numeric,
  source_breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index daily_health_summaries_user_date_idx on public.daily_health_summaries (user_id, date desc);

alter table public.daily_health_summaries enable row level security;
create policy "daily_health_summaries_select_own" on public.daily_health_summaries for select using (auth.uid() = user_id);
create policy "daily_health_summaries_insert_own" on public.daily_health_summaries for insert with check (auth.uid() = user_id);
create policy "daily_health_summaries_update_own" on public.daily_health_summaries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_health_summaries_delete_own" on public.daily_health_summaries for delete using (auth.uid() = user_id);

create trigger daily_health_summaries_set_updated_at before update on public.daily_health_summaries
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- workouts / workout_exercises / workout_sets
-- ----------------------------------------------------------------------------

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'apple_health', 'health_connect')),
  external_id text,
  name text not null,
  workout_type text,
  scheduled_at timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes numeric,
  calories numeric,
  planned boolean not null default true,
  completed boolean not null default false,
  rescheduled boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);

create index workouts_user_id_idx on public.workouts (user_id, scheduled_at desc);

alter table public.workouts enable row level security;
create policy "workouts_select_own" on public.workouts for select using (auth.uid() = user_id);
create policy "workouts_insert_own" on public.workouts for insert with check (auth.uid() = user_id);
create policy "workouts_update_own" on public.workouts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts_delete_own" on public.workouts for delete using (auth.uid() = user_id);

create trigger workouts_set_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  target_sets integer,
  target_reps integer,
  target_weight numeric,
  unit text not null default 'lb',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_exercises_workout_id_idx on public.workout_exercises (workout_id, order_index);

alter table public.workout_exercises enable row level security;
create policy "workout_exercises_select_own" on public.workout_exercises for select using (auth.uid() = user_id);
create policy "workout_exercises_insert_own" on public.workout_exercises for insert with check (auth.uid() = user_id);
create policy "workout_exercises_update_own" on public.workout_exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_exercises_delete_own" on public.workout_exercises for delete using (auth.uid() = user_id);

create trigger workout_exercises_set_updated_at before update on public.workout_exercises
  for each row execute function public.set_updated_at();

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number integer not null default 1,
  weight numeric,
  reps integer,
  rpe numeric,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_sets_exercise_id_idx on public.workout_sets (workout_exercise_id, set_number);

alter table public.workout_sets enable row level security;
create policy "workout_sets_select_own" on public.workout_sets for select using (auth.uid() = user_id);
create policy "workout_sets_insert_own" on public.workout_sets for insert with check (auth.uid() = user_id);
create policy "workout_sets_update_own" on public.workout_sets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_sets_delete_own" on public.workout_sets for delete using (auth.uid() = user_id);

create trigger workout_sets_set_updated_at before update on public.workout_sets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- body_measurements
-- ----------------------------------------------------------------------------

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'manual' check (provider in ('manual', 'apple_health', 'health_connect')),
  external_id text,
  measurement_type text not null default 'weight' check (measurement_type in ('weight', 'body_fat', 'waist', 'lean_mass')),
  value numeric not null,
  unit text not null,
  measured_at timestamptz not null default now(),
  data_origin text not null default 'manual' check (data_origin in ('measured', 'estimated', 'calculated', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create index body_measurements_user_idx on public.body_measurements (user_id, measurement_type, measured_at desc);

alter table public.body_measurements enable row level security;
create policy "body_measurements_select_own" on public.body_measurements for select using (auth.uid() = user_id);
create policy "body_measurements_insert_own" on public.body_measurements for insert with check (auth.uid() = user_id);
create policy "body_measurements_update_own" on public.body_measurements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "body_measurements_delete_own" on public.body_measurements for delete using (auth.uid() = user_id);

create trigger body_measurements_set_updated_at before update on public.body_measurements
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- sleep_sessions
-- ----------------------------------------------------------------------------

create table public.sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'manual' check (provider in ('manual', 'apple_health', 'health_connect')),
  external_id text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  time_zone text not null default 'UTC',
  total_minutes integer not null,
  stages jsonb not null default '{}'::jsonb,
  data_origin text not null default 'measured' check (data_origin in ('measured', 'estimated', 'calculated', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create index sleep_sessions_user_idx on public.sleep_sessions (user_id, start_time desc);

alter table public.sleep_sessions enable row level security;
create policy "sleep_sessions_select_own" on public.sleep_sessions for select using (auth.uid() = user_id);
create policy "sleep_sessions_insert_own" on public.sleep_sessions for insert with check (auth.uid() = user_id);
create policy "sleep_sessions_update_own" on public.sleep_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sleep_sessions_delete_own" on public.sleep_sessions for delete using (auth.uid() = user_id);

create trigger sleep_sessions_set_updated_at before update on public.sleep_sessions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- nutrition_entries / nutrition_daily_totals
-- ----------------------------------------------------------------------------

create table public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'manual' check (source in (
    'apple_health', 'health_connect', 'usda_fdc', 'open_food_facts', 'manual', 'csv_import'
  )),
  external_id text,
  food_name text not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  consumed_at timestamptz not null default now(),
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  sodium_mg numeric,
  quantity numeric,
  unit text,
  data_origin text not null default 'manual' check (data_origin in ('measured', 'estimated', 'calculated', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);

create index nutrition_entries_user_idx on public.nutrition_entries (user_id, consumed_at desc);

alter table public.nutrition_entries enable row level security;
create policy "nutrition_entries_select_own" on public.nutrition_entries for select using (auth.uid() = user_id);
create policy "nutrition_entries_insert_own" on public.nutrition_entries for insert with check (auth.uid() = user_id);
create policy "nutrition_entries_update_own" on public.nutrition_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "nutrition_entries_delete_own" on public.nutrition_entries for delete using (auth.uid() = user_id);

create trigger nutrition_entries_set_updated_at before update on public.nutrition_entries
  for each row execute function public.set_updated_at();

create table public.nutrition_daily_totals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  fiber_g numeric not null default 0,
  water_ml numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index nutrition_daily_totals_user_idx on public.nutrition_daily_totals (user_id, date desc);

alter table public.nutrition_daily_totals enable row level security;
create policy "nutrition_daily_totals_select_own" on public.nutrition_daily_totals for select using (auth.uid() = user_id);
create policy "nutrition_daily_totals_insert_own" on public.nutrition_daily_totals for insert with check (auth.uid() = user_id);
create policy "nutrition_daily_totals_update_own" on public.nutrition_daily_totals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "nutrition_daily_totals_delete_own" on public.nutrition_daily_totals for delete using (auth.uid() = user_id);

create trigger nutrition_daily_totals_set_updated_at before update on public.nutrition_daily_totals
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- habits / habit_logs
-- ----------------------------------------------------------------------------

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'General',
  target_per_week integer not null default 7,
  paused boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index habits_user_idx on public.habits (user_id);

alter table public.habits enable row level security;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.set_updated_at();

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  log_date date not null default current_date,
  completed boolean not null default true,
  mood text check (mood in ('Great', 'Good', 'Okay', 'Rough')),
  note text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index habit_logs_user_idx on public.habit_logs (user_id, log_date desc);

alter table public.habit_logs enable row level security;
create policy "habit_logs_select_own" on public.habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs_update_own" on public.habit_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_logs_delete_own" on public.habit_logs for delete using (auth.uid() = user_id);

create trigger habit_logs_set_updated_at before update on public.habit_logs
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null default 'task' check (type in ('task', 'assignment', 'project')),
  course text,
  priority text not null default 'med' check (priority in ('high', 'med', 'low')),
  due_at timestamptz,
  due_label text,
  completed boolean not null default false,
  completed_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'email_insight')),
  source_email_insight_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_idx on public.tasks (user_id, completed, due_at);

alter table public.tasks enable row level security;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- calendar_events (Google Calendar import — references, not a full mirror)
-- ----------------------------------------------------------------------------

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  external_id text not null,
  calendar_id text,
  title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean not null default false,
  status text not null default 'confirmed' check (status in ('confirmed', 'tentative', 'cancelled')),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create index calendar_events_user_idx on public.calendar_events (user_id, start_time);

alter table public.calendar_events enable row level security;
create policy "calendar_events_select_own" on public.calendar_events for select using (auth.uid() = user_id);
create policy "calendar_events_insert_own" on public.calendar_events for insert with check (auth.uid() = user_id);
create policy "calendar_events_update_own" on public.calendar_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar_events_delete_own" on public.calendar_events for delete using (auth.uid() = user_id);

create trigger calendar_events_set_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- email_insights (Gmail — deterministic-filtered, minimal-AI-exposure insights)
-- ----------------------------------------------------------------------------

create table public.email_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  external_message_id text not null,
  insight_type text not null check (insight_type in ('job_application_update', 'interview_invite', 'assignment_deadline', 'work_deadline')),
  subject text,
  snippet text,
  detected_entities jsonb not null default '{}'::jsonb,
  confidence numeric,
  source_message_link text,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, external_message_id, insight_type)
);

create index email_insights_user_idx on public.email_insights (user_id, created_at desc);

alter table public.email_insights enable row level security;
create policy "email_insights_select_own" on public.email_insights for select using (auth.uid() = user_id);
create policy "email_insights_insert_own" on public.email_insights for insert with check (auth.uid() = user_id);
create policy "email_insights_update_own" on public.email_insights for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "email_insights_delete_own" on public.email_insights for delete using (auth.uid() = user_id);

create trigger email_insights_set_updated_at before update on public.email_insights
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- oauth_credentials — SERVER-SIDE ONLY. No RLS policies are created, so with
-- RLS enabled every role except service_role is denied by default. Only a
-- trusted server route (apps/api, using the service role key, never shipped
-- to web/mobile) may read or write this table. Tokens should additionally be
-- encrypted at rest via Supabase Vault (see SECURITY.md) before production use.
-- ----------------------------------------------------------------------------

create table public.oauth_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'gmail', 'github')),
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.oauth_credentials enable row level security;
-- Intentionally no policies: default-deny for anon/authenticated. Only
-- service_role (which bypasses RLS) can touch this table.

create trigger oauth_credentials_set_updated_at before update on public.oauth_credentials
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- audit_logs — append-only. Users can read their own; nothing can update or
-- delete a row (no policies for those actions), satisfying an audit trail.
-- ----------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_user_idx on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;
create policy "audit_logs_select_own" on public.audit_logs for select using (auth.uid() = user_id);
create policy "audit_logs_insert_own" on public.audit_logs for insert with check (auth.uid() = user_id);
-- No update/delete policy: audit trail is immutable from the client.
