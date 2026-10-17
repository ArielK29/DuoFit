import type { FitnessLevel, User } from '@hooks/useAuth';
import type { Partner, PartnerFilters } from '@hooks/usePartnerMatching';

// Compatibility score from real data: shared activities, similar fitness
// level, and distance. Clamped so it always reads as a plausible percentage.
export function computeMatchPercent(partner: Partner, distance: number | null, user: User | null): number {
  const shared = partner.activities.filter((activity) => user?.favoriteActivities.includes(activity)).length;
  const levels: FitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  const levelGap = user?.fitnessLevel
    ? Math.abs(levels.indexOf(user.fitnessLevel) - levels.indexOf(partner.fitnessLevel))
    : 1;

  let score = 60 + Math.min(shared, 2) * 12;
  score += levelGap === 0 ? 8 : levelGap === 1 ? 4 : 0;
  if (distance !== null) score += distance < 2 ? 6 : distance < 5 ? 3 : 0;
  return Math.max(60, Math.min(99, score));
}

export function filterPartners<T extends Partner & { distanceKm: number | null }>(
  partners: T[],
  filters: PartnerFilters
): T[] {
  return partners.filter(
    (partner) =>
      (filters.gender === 'all' || partner.gender === filters.gender) &&
      (partner.age === undefined || partner.age <= filters.maxAge) &&
      (partner.distanceKm === null || partner.distanceKm <= filters.radiusKm) &&
      (filters.activities.length === 0 ||
        partner.activities.some((activity) => filters.activities.includes(activity)))
  );
}
