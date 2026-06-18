/**
 * Hand-written types mirroring packages/database/supabase/migrations/0001_init_schema.sql.
 *
 * Once a real Supabase project is linked, prefer generating precise types with
 * `npm run gen-types --workspace packages/database` (writes
 * packages/database/types/database.types.ts) and re-exporting those instead —
 * they'll stay in sync with the live schema automatically. These hand-written
 * types exist so mobile/app code has something to import before that's wired up.
 */

export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;

export type DataOrigin = 'measured' | 'estimated' | 'calculated' | 'manual';

export interface Profile {
  id: UUID;
  display_name: string;
  initials: string;
  email: string | null;
  assistant_name: string;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    waterOz: number;
    steps: number;
    sleepHours: number;
    weightGoalLb: number | null;
    weeklyWorkouts: number;
  };
  settings: {
    theme: 'dark' | 'light';
    units: 'imperial' | 'metric';
    notifications: Record<'workouts' | 'meals' | 'habits' | 'deadlines' | 'applications', boolean>;
    quietHours: { enabled: boolean; start: string; end: string };
    voice: {
      enabled: boolean;
      rate: number;
      volume: number;
      voiceName: string;
      wakePhrase: boolean;
      soundEnabled: boolean;
      soundVolume: number;
    };
    schedule: { trainingDays: string[] };
  };
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type IntegrationProvider =
  | 'apple_health'
  | 'health_connect'
  | 'google_calendar'
  | 'gmail'
  | 'github'
  | 'nutrition_usda'
  | 'nutrition_off'
  | 'push_notifications';

export interface Integration {
  id: UUID;
  user_id: UUID;
  provider: IntegrationProvider;
  connected: boolean;
  external_account_id: string | null;
  scopes: string[];
  last_sync_at: ISODateTime | null;
  last_sync_record_count: number;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type HealthProvider = 'apple_health' | 'health_connect';
export type HealthConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface HealthConnection {
  id: UUID;
  user_id: UUID;
  provider: HealthProvider;
  status: HealthConnectionStatus;
  platform_version: string | null;
  last_sync_at: ISODateTime | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type HealthDataType =
  | 'steps'
  | 'distance_walking_running'
  | 'active_calories'
  | 'workouts'
  | 'exercise_time'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'sleep'
  | 'body_weight'
  | 'water_intake'
  | 'dietary_energy'
  | 'dietary_nutrients';

export interface HealthPermission {
  id: UUID;
  user_id: UUID;
  connection_id: UUID;
  data_type: HealthDataType;
  access: 'read' | 'write';
  granted: boolean;
  requested_at: ISODateTime;
  granted_at: ISODateTime | null;
  revoked_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type SyncJobType = 'initial_import' | 'incremental' | 'manual';
export type SyncJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'partial';

export interface HealthSyncJob {
  id: UUID;
  user_id: UUID;
  connection_id: UUID | null;
  job_type: SyncJobType;
  status: SyncJobStatus;
  data_types: HealthDataType[];
  started_at: ISODateTime;
  finished_at: ISODateTime | null;
  records_imported: number;
  records_skipped: number;
  error: string | null;
  cursor: Record<string, unknown>;
  created_at: ISODateTime;
}

export type HealthRecordType =
  | 'steps'
  | 'distance_walking_running'
  | 'active_calories'
  | 'exercise_time'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'sleep'
  | 'body_weight'
  | 'water_intake'
  | 'dietary_energy'
  | 'dietary_nutrient';

export interface HealthRecord {
  id: UUID;
  user_id: UUID;
  provider: HealthProvider | 'manual';
  source_app: string | null;
  external_id: string | null;
  record_type: HealthRecordType;
  start_time: ISODateTime;
  end_time: ISODateTime;
  time_zone: string;
  unit: string;
  value: number;
  data_origin: DataOrigin;
  imported_at: ISODateTime;
  source_modified_at: ISODateTime | null;
  raw: Record<string, unknown> | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface DailyHealthSummary {
  id: UUID;
  user_id: UUID;
  date: ISODate;
  steps: number | null;
  active_calories: number | null;
  exercise_minutes: number | null;
  distance_m: number | null;
  resting_heart_rate: number | null;
  sleep_minutes: number | null;
  water_ml: number | null;
  weight_kg: number | null;
  source_breakdown: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Workout {
  id: UUID;
  user_id: UUID;
  source: 'manual' | HealthProvider;
  external_id: string | null;
  name: string;
  workout_type: string | null;
  scheduled_at: ISODateTime | null;
  start_time: ISODateTime | null;
  end_time: ISODateTime | null;
  duration_minutes: number | null;
  calories: number | null;
  planned: boolean;
  completed: boolean;
  rescheduled: boolean;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface WorkoutExercise {
  id: UUID;
  user_id: UUID;
  workout_id: UUID;
  name: string;
  order_index: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  unit: string;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface WorkoutSet {
  id: UUID;
  user_id: UUID;
  workout_exercise_id: UUID;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  completed_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface BodyMeasurement {
  id: UUID;
  user_id: UUID;
  provider: 'manual' | HealthProvider;
  external_id: string | null;
  measurement_type: 'weight' | 'body_fat' | 'waist' | 'lean_mass';
  value: number;
  unit: string;
  measured_at: ISODateTime;
  data_origin: DataOrigin;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface SleepSession {
  id: UUID;
  user_id: UUID;
  provider: 'manual' | HealthProvider;
  external_id: string | null;
  start_time: ISODateTime;
  end_time: ISODateTime;
  time_zone: string;
  total_minutes: number;
  stages: Record<string, unknown>;
  data_origin: DataOrigin;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type NutritionSource = 'apple_health' | 'health_connect' | 'usda_fdc' | 'open_food_facts' | 'manual' | 'csv_import';

export interface NutritionEntry {
  id: UUID;
  user_id: UUID;
  source: NutritionSource;
  external_id: string | null;
  food_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
  consumed_at: ISODateTime;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  quantity: number | null;
  unit: string | null;
  data_origin: DataOrigin;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface NutritionDailyTotal {
  id: UUID;
  user_id: UUID;
  date: ISODate;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  water_ml: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Habit {
  id: UUID;
  user_id: UUID;
  name: string;
  category: string;
  target_per_week: number;
  paused: boolean;
  archived_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface HabitLog {
  id: UUID;
  user_id: UUID;
  habit_id: UUID;
  log_date: ISODate;
  completed: boolean;
  mood: 'Great' | 'Good' | 'Okay' | 'Rough' | null;
  note: string | null;
  logged_at: ISODateTime;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Task {
  id: UUID;
  user_id: UUID;
  title: string;
  type: 'task' | 'assignment' | 'project';
  course: string | null;
  priority: 'high' | 'med' | 'low';
  due_at: ISODateTime | null;
  due_label: string | null;
  completed: boolean;
  completed_at: ISODateTime | null;
  source: 'manual' | 'email_insight';
  source_email_insight_id: UUID | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface CalendarEvent {
  id: UUID;
  user_id: UUID;
  external_id: string;
  calendar_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_time: ISODateTime;
  end_time: ISODateTime | null;
  all_day: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  raw: Record<string, unknown> | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type EmailInsightType = 'job_application_update' | 'interview_invite' | 'assignment_deadline' | 'work_deadline';

export interface EmailInsight {
  id: UUID;
  user_id: UUID;
  external_message_id: string;
  insight_type: EmailInsightType;
  subject: string | null;
  snippet: string | null;
  detected_entities: Record<string, unknown>;
  confidence: number | null;
  source_message_link: string | null;
  dismissed: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Server-only. Never fetch this table from web or mobile clients. */
export interface OAuthCredential {
  id: UUID;
  user_id: UUID;
  provider: 'google_calendar' | 'gmail' | 'github';
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  expires_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AuditLog {
  id: UUID;
  user_id: UUID;
  action: string;
  resource_type: string;
  resource_id: UUID | null;
  metadata: Record<string, unknown>;
  created_at: ISODateTime;
}
