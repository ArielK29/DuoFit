import { Activity, Dumbbell, Waves, Bike, Goal, Flower2 } from 'lucide-react-native';
import { theme } from '@styles/theme';

// Maps the fixed activity list from ProfileSetupScreen to an icon + color,
// for colored badges on history/feed rows (visual only, no fabricated data).
export const ACTIVITY_STYLES: Record<string, { icon: typeof Activity; color: string }> = {
  ריצה: { icon: Activity, color: theme.colors.cyan },
  'כושר גופני': { icon: Dumbbell, color: theme.colors.magenta },
  יוגה: { icon: Flower2, color: theme.colors.warning },
  'רכיבה על אופניים': { icon: Bike, color: theme.colors.cyan },
  שחייה: { icon: Waves, color: theme.colors.magenta },
  כדורגל: { icon: Goal, color: theme.colors.warning },
};

export const DEFAULT_ACTIVITY_STYLE = { icon: Activity, color: theme.colors.textSecondary };

export function getActivityStyle(activity: string) {
  return ACTIVITY_STYLES[activity] ?? DEFAULT_ACTIVITY_STYLE;
}
