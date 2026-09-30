import { Dumbbell, Footprints, Goal, Zap, type LucideIcon } from 'lucide-react-native';
import { theme } from '@styles/theme';
import type { Coordinates } from '@hooks/useLocation';

export interface Place {
  id: string;
  name: string;
  type: string;
  coords: Coordinates;
  icon: LucideIcon;
  color: string;
  // Example number — there's no live check-in data yet (#15).
  trainingNow: number;
}

// Real Tel Aviv venues with approximate coordinates. No promotions or
// partnership claims: DuoFit has no agreement with any of them.
export const PLACES: Place[] = [
  {
    id: 'holmes-dizengoff',
    name: 'הולמס פלייס דיזנגוף',
    type: 'חדר כושר',
    coords: { latitude: 32.0789, longitude: 34.7745 },
    icon: Dumbbell,
    color: theme.colors.text,
    trainingNow: 14,
  },
  {
    id: 'yarkon-calisthenics',
    name: 'פארק הירקון – מתקני קליסטניקס',
    type: 'פארק',
    coords: { latitude: 32.0995, longitude: 34.7968 },
    icon: Footprints,
    color: theme.colors.cyan,
    trainingNow: 9,
  },
  {
    id: 'gordon-court',
    name: 'מגרש כדורסל גורדון',
    type: 'מגרש',
    coords: { latitude: 32.0872, longitude: 34.7688 },
    icon: Goal,
    color: theme.colors.warning,
    trainingNow: 8,
  },
  {
    id: 'tayelet-running',
    name: 'טיילת – נקודת מפגש ריצה',
    type: 'מסלול ריצה',
    coords: { latitude: 32.0802, longitude: 34.7637 },
    icon: Footprints,
    color: theme.colors.magenta,
    trainingNow: 21,
  },
  {
    id: 'crossfit-florentin',
    name: 'CrossFit Florentin',
    type: 'סטודיו',
    coords: { latitude: 32.0567, longitude: 34.7701 },
    icon: Zap,
    color: theme.colors.warning,
    trainingNow: 6,
  },
];
