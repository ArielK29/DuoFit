import { useEffect, useMemo, useState } from 'react';
import { useAuth, User, FitnessLevel } from '@hooks/useAuth';
import { useLocation, Coordinates } from '@hooks/useLocation';
import { DEMO_DATA } from '@lib/demo';

export type Gender = 'M' | 'F';

export interface Partner {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  bio: string;
  fitnessLevel: FitnessLevel;
  activities: string[];
  coords: Coordinates;
  // Example data — no review, verification or availability system exists
  // yet (#15). The Discover screen is labeled "תצוגה מקדימה" because of it.
  verified: boolean;
  rating: number;
  sessions: number;
  availableDays: number[]; // 0 = Sunday
  availableFrom: string;
  availableTo: string;
}

// Mock candidate pool (no backend yet — see issue #15).
const DEMO_PARTNERS: Partner[] = [
  {
    id: 'p6',
    name: 'יונתן',
    age: 22,
    gender: 'M',
    bio: 'חודש שלישי באימוני כוח. מחפש שותף מנוסה שידחוף אותי ויעמוד מאחוריי בבנץ׳.',
    fitnessLevel: 'Beginner',
    activities: ['כוח'],
    coords: { latitude: 32.0838, longitude: 34.7838 },
    verified: true,
    rating: 4.8,
    sessions: 12,
    availableDays: [1, 3, 5],
    availableFrom: '18:00',
    availableTo: '19:30',
  },
  {
    id: 'p1',
    name: 'דניאל',
    age: 27,
    gender: 'M',
    bio: 'רץ כל בוקר לפני העבודה, מחפש שותף/ה לריצות סוף שבוע.',
    fitnessLevel: 'Intermediate',
    activities: ['ריצה', 'קרוספיט'],
    coords: { latitude: 32.0809, longitude: 34.7906 },
    verified: true,
    rating: 4.9,
    sessions: 31,
    availableDays: [0, 2, 4, 6],
    availableFrom: '06:00',
    availableTo: '08:00',
  },
  {
    id: 'p2',
    name: 'נועה',
    age: 24,
    gender: 'F',
    bio: 'אוהבת אימוני כוח, מתאמנת 4 פעמים בשבוע בחדר כושר.',
    fitnessLevel: 'Advanced',
    activities: ['כוח', 'יוגה'],
    coords: { latitude: 32.0742, longitude: 34.7924 },
    verified: true,
    rating: 4.7,
    sessions: 24,
    availableDays: [0, 1, 3],
    availableFrom: '17:00',
    availableTo: '20:00',
  },
  {
    id: 'p7',
    name: 'שיר',
    age: 25,
    gender: 'F',
    bio: 'ריצות בטיילת וקליסטניקס בפארק. מחפשת קבוצה קבועה לסופי שבוע.',
    fitnessLevel: 'Intermediate',
    activities: ['ריצה', 'קליסטניקס'],
    coords: { latitude: 32.0878, longitude: 34.7688 },
    verified: false,
    rating: 4.5,
    sessions: 9,
    availableDays: [4, 5, 6],
    availableFrom: '07:00',
    availableTo: '09:00',
  },
  {
    id: 'p3',
    name: 'תומר',
    age: 31,
    gender: 'M',
    bio: 'מתחיל את המסע שלי בכושר, מחפש מוטיבציה ושותפים תומכים.',
    fitnessLevel: 'Beginner',
    activities: ['כוח', 'ריצה'],
    coords: { latitude: 32.0853, longitude: 34.7718 },
    verified: false,
    rating: 4.3,
    sessions: 4,
    availableDays: [1, 2, 3],
    availableFrom: '19:00',
    availableTo: '21:00',
  },
  {
    id: 'p5',
    name: 'איתי',
    age: 26,
    gender: 'M',
    bio: 'קליסטניקס בפארק הירקון 3 פעמים בשבוע, מחפש שותף לאתגרים.',
    fitnessLevel: 'Intermediate',
    activities: ['קליסטניקס', 'כוח'],
    coords: { latitude: 32.0991, longitude: 34.7899 },
    verified: true,
    rating: 4.6,
    sessions: 18,
    availableDays: [0, 2, 4],
    availableFrom: '16:00',
    availableTo: '18:00',
  },
  {
    id: 'p4',
    name: 'מאיה',
    age: 29,
    gender: 'F',
    bio: 'מדריכת יוגה בחופשי, מחפשת שותפים לתרגול בוקר.',
    fitnessLevel: 'Advanced',
    activities: ['יוגה'],
    coords: { latitude: 32.0668, longitude: 34.7758 },
    verified: true,
    rating: 4.9,
    sessions: 40,
    availableDays: [0, 1, 2, 3, 4],
    availableFrom: '07:00',
    availableTo: '09:00',
  },
  {
    id: 'p8',
    name: 'עומר',
    age: 33,
    gender: 'M',
    bio: 'כדורסל 3 על 3 בגורדון וקרוספיט בפלורנטין. תמיד מחפש עוד שחקן.',
    fitnessLevel: 'Advanced',
    activities: ['כדורסל', 'קרוספיט'],
    coords: { latitude: 32.0566, longitude: 34.7705 },
    verified: false,
    rating: 4.4,
    sessions: 15,
    availableDays: [2, 3, 4],
    availableFrom: '20:00',
    availableTo: '22:00',
  },
];

// Invented people exist only in demo mode (see lib/demo.ts); real partners will
// come from the database.
const MOCK_PARTNERS: Partner[] = DEMO_DATA ? DEMO_PARTNERS : [];

// The whole mock pool, for screens that need partners outside the swipe deck
// (Chat: start a conversation, suggest a group).
export const PARTNER_POOL = MOCK_PARTNERS;

export interface PartnerFilters {
  gender: 'all' | Gender;
  maxAge: number;
  radiusKm: number;
  activities: string[];
}

export const MIN_AGE = 21;
export const MAX_AGE = 40;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 15;

export const DEFAULT_FILTERS: PartnerFilters = {
  gender: 'all',
  maxAge: MAX_AGE,
  radiusKm: MAX_RADIUS_KM,
  activities: [],
};

export const ACTIVITY_OPTIONS = ['כוח', 'קליסטניקס', 'ריצה', 'קרוספיט', 'יוגה', 'כדורסל'];

// Haversine formula — sufficient for city-scale distances.
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Search anchor for the mock pool. Candidates are fixed points in Tel Aviv,
// so distances only make sense from inside the city: the device's GPS fix is
// used when it's in the Tel Aviv area, otherwise the city center. The cutoff
// must stay well under MAX_RADIUS_KM minus the pool's own spread (~3 km): a
// fix 20-40 km out would put every mock partner outside the default radius and
// empty Home's suggested/nearby sections.
export const TEL_AVIV_CENTER: Coordinates = { latitude: 32.0809, longitude: 34.7806 };
const LOCAL_RADIUS_KM = 10;

export interface PartnerWithDistance extends Partner {
  distanceKm: number;
  matchPercent: number;
}

// Compatibility score from real data: shared activities, similar fitness
// level, and distance. Clamped so it always reads as a plausible percentage.
function computeMatchPercent(partner: Partner, distance: number, user: User | null): number {
  const shared = partner.activities.filter((activity) => user?.favoriteActivities.includes(activity)).length;
  const levels: FitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  const levelGap = user?.fitnessLevel
    ? Math.abs(levels.indexOf(user.fitnessLevel) - levels.indexOf(partner.fitnessLevel))
    : 1;

  let score = 60 + Math.min(shared, 2) * 12;
  score += levelGap === 0 ? 8 : levelGap === 1 ? 4 : 0;
  score += distance < 2 ? 6 : distance < 5 ? 3 : 0;
  return Math.max(60, Math.min(99, score));
}

export function filterPartners<T extends Partner & { distanceKm: number }>(
  partners: T[],
  filters: PartnerFilters
): T[] {
  return partners.filter(
    (partner) =>
      (filters.gender === 'all' || partner.gender === filters.gender) &&
      partner.age <= filters.maxAge &&
      partner.distanceKm <= filters.radiusKm &&
      (filters.activities.length === 0 ||
        partner.activities.some((activity) => filters.activities.includes(activity)))
  );
}

// Used by PartnerProfileScreen to look up a candidate's static details by id
// (distance travels separately as a route param).
export function findPartnerById(id: string): Partner | undefined {
  return MOCK_PARTNERS.find((partner) => partner.id === id);
}

interface PartnerMatchingState {
  allPartners: PartnerWithDistance[];
  candidates: PartnerWithDistance[];
  currentPartner: PartnerWithDistance | undefined;
  viewerOrigin: Coordinates;
  isLoading: boolean;
  isEmpty: boolean;
  interested: () => void;
  pass: () => void;
  refresh: () => void;
}

export function usePartnerMatching(filters: PartnerFilters = DEFAULT_FILTERS): PartnerMatchingState {
  const user = useAuth((state) => state.user);
  const { coords } = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [fetchCycle, setFetchCycle] = useState(0);
  const [position, setPosition] = useState({ index: 0, key: '' });

  // Simulates a network fetch of nearby candidates, per issue #5's
  // "loading skeleton while fetching matches" requirement.
  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timeout);
  }, [fetchCycle]);

  const viewerOrigin =
    coords && distanceKm(coords, TEL_AVIV_CENTER) <= LOCAL_RADIUS_KM ? coords : TEL_AVIV_CENTER;

  const allPartners = useMemo(
    () =>
      MOCK_PARTNERS.map((partner) => {
        const distance = distanceKm(viewerOrigin, partner.coords);
        return { ...partner, distanceKm: distance, matchPercent: computeMatchPercent(partner, distance, user) };
      }).sort((a, b) => a.distanceKm - b.distanceKm),
    [viewerOrigin, user]
  );

  const filtersKey = JSON.stringify(filters);
  const candidates = useMemo(() => filterPartners(allPartners, filters), [allPartners, filters]);

  // The swipe position resets whenever the filters change.
  const currentIndex = position.key === filtersKey ? position.index : 0;
  const advance = () => setPosition({ index: currentIndex + 1, key: filtersKey });

  return {
    allPartners,
    candidates,
    currentPartner: candidates[currentIndex],
    viewerOrigin,
    isLoading,
    isEmpty: !isLoading && currentIndex >= candidates.length,
    interested: advance,
    pass: advance,
    refresh: () => {
      setPosition({ index: 0, key: filtersKey });
      setFetchCycle((c) => c + 1);
    },
  };
}
