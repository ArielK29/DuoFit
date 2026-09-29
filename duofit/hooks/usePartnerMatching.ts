import { useEffect, useMemo, useState } from 'react';
import { useAuth, User } from '@hooks/useAuth';
import { useLocation, Coordinates } from '@hooks/useLocation';

export interface Partner {
  id: string;
  name: string;
  age: number;
  bio: string;
  fitnessLevel: User['fitnessLevel'];
  activities: string[];
  coords: Coordinates;
}

// Mock candidate pool (no backend yet — see issue #15). Coordinates are
// offset from central Tel Aviv so a real distance can still be computed
// against the signed-in user's actual location when permission is granted.
const MOCK_PARTNERS: Partner[] = [
  {
    id: 'p1',
    name: 'דניאל',
    age: 27,
    bio: 'רץ כל בוקר לפני העבודה, מחפש שותף/ה לריצות סוף שבוע',
    fitnessLevel: 'Intermediate',
    activities: ['ריצה', 'שחייה'],
    coords: { latitude: 32.0809, longitude: 34.7806 },
  },
  {
    id: 'p2',
    name: 'נועה',
    age: 24,
    bio: 'אוהבת אימוני כוח, מתאמנת 4 פעמים בשבוע בחדר כושר',
    fitnessLevel: 'Advanced',
    activities: ['כושר גופני', 'יוגה'],
    coords: { latitude: 32.0742, longitude: 34.7924 },
  },
  {
    id: 'p3',
    name: 'תומר',
    age: 31,
    bio: 'מתחיל את המסע שלי בכושר, מחפש מוטיבציה ושותפים תומכים',
    fitnessLevel: 'Beginner',
    activities: ['כושר גופני', 'ריצה'],
    coords: { latitude: 32.0853, longitude: 34.7718 },
  },
  {
    id: 'p4',
    name: 'מאיה',
    age: 29,
    bio: 'מדריכת יוגה בחופשי, מחפשת שותפים לתרגול בוקר',
    fitnessLevel: 'Advanced',
    activities: ['יוגה'],
    coords: { latitude: 32.0668, longitude: 34.7758 },
  },
  {
    id: 'p5',
    name: 'איתי',
    age: 26,
    bio: 'שוחה 3 פעמים בשבוע, מחפש שותף לתחרות ידידותית',
    fitnessLevel: 'Intermediate',
    activities: ['שחייה', 'כושר גופני'],
    coords: { latitude: 32.0891, longitude: 34.7699 },
  },
];

// Haversine formula — sufficient for city-scale distances, no external
// geo library needed for a mock candidate pool this size.
function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Falls back to a central Tel Aviv point when the device has no location fix,
// so distances still render instead of being hidden.
const FALLBACK_ORIGIN: Coordinates = { latitude: 32.0809, longitude: 34.7806 };

export interface PartnerWithDistance extends Partner {
  distanceKm: number;
}

// Used by PartnerProfileScreen to look up a candidate's static details by id
// (distance travels separately as a route param since it depends on the
// viewer's own location, not the partner's).
export function findPartnerById(id: string): Partner | undefined {
  return MOCK_PARTNERS.find((partner) => partner.id === id);
}

interface PartnerMatchingState {
  candidates: PartnerWithDistance[];
  currentPartner: PartnerWithDistance | undefined;
  isLoading: boolean;
  isEmpty: boolean;
  interested: () => void;
  pass: () => void;
  refresh: () => void;
}

export function usePartnerMatching(): PartnerMatchingState {
  const user = useAuth((state) => state.user);
  const { coords } = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchCycle, setFetchCycle] = useState(0);

  // Simulates a network fetch of nearby candidates, per issue #5's
  // "loading skeleton while fetching matches" requirement.
  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timeout);
  }, [fetchCycle]);

  const candidates = useMemo(() => {
    const origin = coords ?? FALLBACK_ORIGIN;
    const favoriteActivities = user?.favoriteActivities ?? [];

    const pool =
      favoriteActivities.length > 0
        ? MOCK_PARTNERS.filter((partner) =>
            partner.activities.some((activity) => favoriteActivities.includes(activity))
          )
        : MOCK_PARTNERS;

    return pool
      .map((partner) => ({ ...partner, distanceKm: distanceKm(origin, partner.coords) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [coords, user?.favoriteActivities]);

  const advance = () => setCurrentIndex((i) => i + 1);

  return {
    candidates,
    currentPartner: candidates[currentIndex],
    isLoading,
    isEmpty: !isLoading && currentIndex >= candidates.length,
    interested: advance,
    pass: advance,
    refresh: () => {
      setCurrentIndex(0);
      setFetchCycle((c) => c + 1);
    },
  };
}
