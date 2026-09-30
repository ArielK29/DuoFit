import { Activity, Dumbbell, Waves, Bike, Goal, Flower2, Zap } from 'lucide-react-native';
import { theme } from '@styles/theme';

// Maps activity names (onboarding list + Discover filter list) to an icon and
// color, for colored badges on history/feed/match rows. Visual only.
export const ACTIVITY_STYLES: Record<string, { icon: typeof Activity; color: string }> = {
  ריצה: { icon: Activity, color: theme.colors.cyan },
  'כושר גופני': { icon: Dumbbell, color: theme.colors.magenta },
  כוח: { icon: Dumbbell, color: theme.colors.magenta },
  קליסטניקס: { icon: Dumbbell, color: theme.colors.cyan },
  קרוספיט: { icon: Zap, color: theme.colors.warning },
  יוגה: { icon: Flower2, color: theme.colors.warning },
  'רכיבה על אופניים': { icon: Bike, color: theme.colors.cyan },
  שחייה: { icon: Waves, color: theme.colors.magenta },
  כדורגל: { icon: Goal, color: theme.colors.warning },
  כדורסל: { icon: Goal, color: theme.colors.warning },
};

export const DEFAULT_ACTIVITY_STYLE = { icon: Activity, color: theme.colors.textSecondary };

export function getActivityStyle(activity: string) {
  return ACTIVITY_STYLES[activity] ?? DEFAULT_ACTIVITY_STYLE;
}
