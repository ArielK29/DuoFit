// Press and hold on a stepper (+ / -) repeats the step by itself, slowly at first and then faster, and stops the moment the
// finger lifts. A single tap is still exactly one step, so the member can tap to land on the exact number.

// How long the finger must stay down before the repeating starts.
export const HOLD_START_DELAY_MS = 400;

// The pause before the next step, shorter the longer the finger has been down.
export function nextRepeatDelay(heldMs: number): number {
  if (heldMs < 1000) return 160;
  if (heldMs < 2000) return 90;
  if (heldMs < 3500) return 55;
  return 35;
}

// One step up (direction 1) or down (-1), inside [min, max], rounded so 70.1 + 0.1 is 70.2 and not 70.19999999.
export function steppedValue(value: number, step: number, direction: 1 | -1, min: number, max: number): number {
  const next = Math.round((value + direction * step) * 1e6) / 1e6;
  return Math.min(max, Math.max(min, next));
}
