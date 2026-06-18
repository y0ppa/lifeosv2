import { Colors } from '@/constants/theme';

// Brain is dark-only for now (see constants/theme.ts) — always resolve to
// the dark palette regardless of the device's system color scheme.
export function useTheme() {
  return Colors.dark;
}
