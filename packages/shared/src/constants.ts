import type { HealthDataType, IntegrationProvider } from './types';

/** The full set of health data types Brain reads. Mirrors the spec exactly —
 * no clinical records or unrelated sensitive categories. */
export const HEALTH_DATA_TYPES: HealthDataType[] = [
  'steps',
  'distance_walking_running',
  'active_calories',
  'workouts',
  'exercise_time',
  'heart_rate',
  'resting_heart_rate',
  'sleep',
  'body_weight',
  'water_intake',
  'dietary_energy',
  'dietary_nutrients'
];

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  'apple_health',
  'health_connect',
  'google_calendar',
  'gmail',
  'github',
  'nutrition_usda',
  'nutrition_off',
  'push_notifications'
];

export const INTEGRATION_LABELS: Record<IntegrationProvider, string> = {
  apple_health: 'Apple Health',
  health_connect: 'Android Health Connect',
  google_calendar: 'Google Calendar',
  gmail: 'Gmail',
  github: 'GitHub',
  nutrition_usda: 'USDA FoodData Central',
  nutrition_off: 'Open Food Facts',
  push_notifications: 'Push Notifications'
};

export const SUPABASE_STORAGE_KEY_PREFIX = 'brain';
