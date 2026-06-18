# iOS HealthKit setup

> **Status: Phase 2, not started — code-and-docs-only plan.** You confirmed
> no Apple Developer account yet, so nothing here can be built or tested
> until you have one. This is the exact plan for when you do.

## What this requires that only you can provide

- An **Apple Developer Program** membership ($99/yr) — required to sign any
  build that uses HealthKit, even for personal testing on your own iPhone.
- A **physical iPhone** — HealthKit is not available in the iOS Simulator at
  all; there is no way around this, mock data is the only option without one.
- Either a **Mac**, or **EAS Build's cloud macOS infrastructure** (works from
  Windows, but still needs your Apple credentials) — see `MOBILE_SETUP.md`.

## App configuration (`apps/mobile/app.json`, once the app exists)

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.brain",
      "infoPlist": {
        "NSHealthShareUsageDescription": "Brain reads your steps, workouts, heart rate, sleep, weight, water, and nutrition data from Health so your dashboard and assistant stay accurate without manual re-entry.",
        "NSHealthUpdateUsageDescription": "Brain does not currently write data back to Health."
      }
    },
    "plugins": [
      ["expo-health-connect"],
      ["@kingstinct/react-native-healthkit"]
    ]
  }
}
```

(`@kingstinct/react-native-healthkit` or `react-native-health` are the two
maintained community wrappers as of writing — pick one once you start this
phase and confirm it still supports your target Expo SDK version.)

## Data types this app will request — read-only, nothing else

Matches `HEALTH_DATA_TYPES` in `packages/shared/src/constants.ts` exactly,
so the same list drives both the HealthKit permission prompt and the
`health_permissions` rows:

- Steps (`HKQuantityTypeIdentifierStepCount`)
- Walking + running distance (`HKQuantityTypeIdentifierDistanceWalkingRunning`)
- Active energy / calories (`HKQuantityTypeIdentifierActiveEnergyBurned`)
- Workouts (`HKWorkoutType`)
- Exercise time (`HKQuantityTypeIdentifierAppleExerciseTime`)
- Heart rate (`HKQuantityTypeIdentifierHeartRate`)
- Resting heart rate (`HKQuantityTypeIdentifierRestingHeartRate`)
- Sleep analysis (`HKCategoryTypeIdentifierSleepAnalysis`)
- Body weight (`HKQuantityTypeIdentifierBodyMass`)
- Water (`HKQuantityTypeIdentifierDietaryWater`)
- Dietary energy + nutrients (`HKQuantityTypeIdentifierDietaryEnergyConsumed` and friends), only where the user has data from another app already

**Explicitly not requested**: clinical records (`HKClinicalType` — lab
results, medications, immunizations, etc.) or any other category outside
the list above, per your instruction.

## Permission flow (never assume granted)

1. Dedicated onboarding screen, shown before the first permission prompt,
   explaining in plain language what's read and why (re-using the
   `infoPlist` strings above as source copy, not duplicating different text).
2. Request permission **per data type** via the chosen wrapper's
   `requestAuthorization([...])`, write the result to `health_permissions`
   (one row per `data_type`, `granted` boolean).
3. HealthKit's API does not actually tell read-permission-denial apart from
   "no data exists yet" (a deliberate Apple privacy decision) — so the app
   must treat an empty query result as "could be denied or could be empty,"
   never claim certainty either way, and surface "no data found or
   permission not granted" rather than asserting one or the other.
4. Before every sync, do not re-prompt; just attempt the read and handle an
   empty/failed result gracefully (mark the relevant `health_sync_jobs`
   data type partial, not the whole job failed).

## Mock adapter for development without a device

`packages/integrations` (created when this phase starts) will export a
`HealthProvider` interface with two implementations:

- `HealthKitProvider` — real queries, only functions inside an iOS native
  build.
- `MockHealthProvider` — deterministic fake data (same shape as
  `HealthRecord` in `packages/shared`), used automatically when
  `Platform.OS !== 'ios'` or no native module is linked (e.g. Expo Go,
  Android, or this Windows dev machine). This is what makes Android-on-Windows
  development possible without ever touching HealthKit.

## Not built yet

No HealthKit code exists in this repo. This document is the spec it will
be built against.
