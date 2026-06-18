# Android Health Connect setup

> **Status: Phase 2, not started.** This is the next concrete step after
> Phase 1 (recommended to build before iOS, since this machine is Windows
> and Android development works fully here).

## Prerequisites

- Android Studio (for the emulator) **or** a physical Android device with
  Health Connect installed (Android 14+ ships it built in; Android 9–13
  needs it installed from Play Store as a separate app).
- No Apple-equivalent account is required — Health Connect has no
  per-developer signing program comparable to Apple's.

## Install the SDK (once `apps/mobile` exists)

```bash
cd apps/mobile
npx expo install react-native-health-connect
```

## App configuration (`apps/mobile/app.json`)

```json
{
  "expo": {
    "android": {
      "package": "com.yourname.brain",
      "permissions": [
        "android.permission.health.READ_STEPS",
        "android.permission.health.READ_DISTANCE",
        "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
        "android.permission.health.READ_EXERCISE",
        "android.permission.health.READ_HEART_RATE",
        "android.permission.health.READ_RESTING_HEART_RATE",
        "android.permission.health.READ_SLEEP",
        "android.permission.health.READ_WEIGHT",
        "android.permission.health.READ_HYDRATION",
        "android.permission.health.READ_NUTRITION"
      ]
    },
    "plugins": ["react-native-health-connect"]
  }
}
```

Declare **only** the permissions actually used — matches
`HEALTH_DATA_TYPES` in `packages/shared/src/constants.ts`, same principle
as the iOS `infoPlist` strings.

## Availability check + install/update prompt

Health Connect isn't guaranteed to be present. Before requesting any
permission:

```ts
import { getSdkStatus, SdkAvailabilityStatus } from 'react-native-health-connect';

const status = await getSdkStatus();
if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
  // show: "Health Connect isn't available on this device."
} else if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
  // show an "Update Health Connect" button deep-linking to its Play Store page
}
```

## Permission flow (per data type, never assume granted)

1. Onboarding screen explaining what's read and why (same content
   principle as `IOS_HEALTHKIT_SETUP.md`'s onboarding screen, kept
   consistent across platforms).
2. `requestPermission([...])` per data type, write results to
   `health_permissions`.
3. Unlike HealthKit, Health Connect *does* tell you definitively whether a
   permission was granted or denied — surface that accurately rather than
   the "maybe" language iOS requires.
4. Provide a **"Manage Access"** button that opens Health Connect's own
   permission settings (`openHealthConnectSettings()` or the equivalent
   intent) so the user can review/revoke without leaving to the OS Settings
   app blindly.

## Historical read vs. background read

- **Historical read** (`READ_HEALTH_DATA_HISTORY` permission, requested
  separately from the per-type permissions above) is only needed for the
  initial import going back further than 30 days — request it only if the
  initial-import design actually needs that range, not by default.
- **Background read** (`READ_HEALTH_DATA_IN_BACKGROUND` permission) is only
  needed if a periodic background sync job is implemented; per
  `SYNC_ARCHITECTURE.md`, that's still a best-effort `WorkManager`-style
  task subject to OS battery scheduling, not continuous — request this
  permission only when that job actually exists, not speculatively.

## Mock adapter for development without invoking the real SDK

Same `HealthProvider` interface described in `IOS_HEALTHKIT_SETUP.md`:
a `HealthConnectProvider` (real) and `MockHealthProvider` (deterministic
fake data), selected automatically based on platform/module availability —
this is what lets Android development proceed on this Windows machine
using the emulator without Health Connect data actually present, by falling
back to the mock provider until you're testing on a real device with real
data.

## Not built yet

No Health Connect code exists in this repo yet. This is the spec the
Phase 2 implementation will follow, in this order (per your build order):
mock provider first, then real Health Connect integration, validated on
the Android emulator or a physical device before iOS work starts.
