// Milliseconds from `now` to the next local 00:00 (a full day when `now` is exactly midnight). Calendar arithmetic, so the days
// the clocks change (23 or 25 hours) come out right.
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
