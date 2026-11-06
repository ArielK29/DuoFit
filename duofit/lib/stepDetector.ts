// Counts steps straight from the phone's accelerometer, so the number moves while the member is still walking.
// Core Motion (the phone's own step counter) is accurate but hands its numbers over in batches a few seconds late; this
// detector reacts at once and the screen then replaces its guess with the Core Motion number when that arrives.
//
// Input: samples of the accelerometer in g (about 25 per second) with a time in milliseconds.
// Output of feed(): how many new steps to add (0 most of the time).

const BASELINE_ALPHA = 0.02; // slow average = gravity and slow movement of the phone
const SMOOTH_ALPHA = 0.4; // quick average = removes the shaking noise
const STEP_THRESHOLD_G = 0.07; // how far above the slow average the signal must rise to count as a step
const REARM_FRACTION = 0.3; // the signal must fall below this part of the threshold before the next step can count
const MIN_STEP_GAP_MS = 250; // nobody walks faster than four steps a second
const MAX_STEP_GAP_MS = 900; // a longer pause means the walk stopped
const STEPS_TO_CONFIRM_WALK = 3; // single bumps (a phone put down, one shake) are not steps

export interface StepDetector {
  feed(x: number, y: number, z: number, timeMs: number): number;
}

export function createStepDetector(): StepDetector {
  let baseline: number | null = null;
  let smooth = 0;
  let previousDeviation = 0;
  let armed = true;
  let lastCandidateAt = Number.NEGATIVE_INFINITY;
  let streak = 0;

  return {
    feed(x, y, z, timeMs) {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (!Number.isFinite(magnitude) || !Number.isFinite(timeMs)) return 0;
      if (baseline === null) {
        baseline = magnitude;
        smooth = magnitude;
        return 0;
      }
      baseline += BASELINE_ALPHA * (magnitude - baseline);
      smooth += SMOOTH_ALPHA * (magnitude - smooth);
      const deviation = smooth - baseline;

      let added = 0;
      if (!armed && deviation < STEP_THRESHOLD_G * REARM_FRACTION) armed = true;
      const risingThroughThreshold = previousDeviation < STEP_THRESHOLD_G && deviation >= STEP_THRESHOLD_G;
      if (armed && risingThroughThreshold && timeMs - lastCandidateAt >= MIN_STEP_GAP_MS) {
        armed = false;
        streak = timeMs - lastCandidateAt <= MAX_STEP_GAP_MS ? streak + 1 : 1;
        lastCandidateAt = timeMs;
        if (streak === STEPS_TO_CONFIRM_WALK) added = STEPS_TO_CONFIRM_WALK;
        else if (streak > STEPS_TO_CONFIRM_WALK) added = 1;
      }
      previousDeviation = deviation;
      return added;
    },
  };
}
