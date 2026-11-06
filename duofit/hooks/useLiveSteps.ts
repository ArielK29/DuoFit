import { AppState, type NativeEventSubscription } from 'react-native';
import { create } from 'zustand';
import { watchAccelerometer } from '@lib/motionSamples';
import { readSensorSteps, watchSensorSteps } from '@lib/pedometer';
import { createStepDetector } from '@lib/stepDetector';

// Today's steps straight from the phone, like a step counter app: one subscription to each sensor, shared by every screen that
// shows steps (started when the first screen needs it, stopped when the last one leaves).
//
// Two sources are combined:
//  - Core Motion (the phone's step counter): accurate, but it hands the numbers over a few seconds late. Read by a live
//    subscription and by a quick read every second and a half.
//  - The accelerometer (lib/stepDetector.ts): reacts at once but only guesses. Its steps are shown right away as "pending" and
//    are taken off again as Core Motion catches up, so the shown number is always Core Motion's plus the steps it has not
//    reported yet. Pending steps that Core Motion never confirms (a shaken phone) are dropped after a few seconds.
const POLL_MS = 1500;
const MAX_PENDING = 25;
const PENDING_EXPIRES_MS = 8000;

interface LiveStepsState {
  steps: number | null;
  setSteps: (steps: number | null) => void;
}

export const useLiveSteps = create<LiveStepsState>((set) => ({
  steps: null,
  setSteps: (steps) => set({ steps }),
}));

let users = 0;
let day = '';
let removeWatcher: (() => void) | null = null;
let removeAccelerometer: (() => void) | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
let poll: ReturnType<typeof setInterval> | null = null;
let generation = 0;
// Core Motion's count of today, only ever going up during a day.
let confirmed: number | null = null;
// Steps seen by the accelerometer that Core Motion has not reported yet, and when the last one happened.
let pending = 0;
let lastPendingAt = 0;

function publish() {
  if (confirmed === null) return;
  useLiveSteps.getState().setSteps(confirmed + pending);
}

function confirm(steps: number) {
  if (confirmed === null) {
    confirmed = steps;
  } else if (steps > confirmed) {
    pending = Math.max(0, pending - (steps - confirmed));
    confirmed = steps;
  }
  publish();
}

function begin() {
  const mine = ++generation;
  day = new Date().toDateString();
  confirmed = null;
  pending = 0;
  const detector = createStepDetector();
  removeAccelerometer = watchAccelerometer((x, y, z, timeMs) => {
    if (mine !== generation) return;
    const added = detector.feed(x, y, z, timeMs);
    if (added > 0) {
      pending = Math.min(MAX_PENDING, pending + added);
      lastPendingAt = timeMs;
      publish();
    }
  });
  watchSensorSteps((steps) => {
    if (mine === generation) confirm(steps);
  }).then((remove) => {
    if (mine === generation && users > 0) removeWatcher = remove;
    else remove();
  });
  // A new day: forget yesterday and start over from zero. Checked every tick and the moment the app comes back to the front
  // (its timers sleep in the background, so midnight may have passed unnoticed).
  const rolledOver = () => {
    if (new Date().toDateString() === day) return false;
    end();
    useLiveSteps.getState().setSteps(null);
    begin();
    return true;
  };
  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active' && mine === generation) rolledOver();
  });
  poll = setInterval(async () => {
    if (mine !== generation) return;
    const now = new Date();
    if (rolledOver()) return;
    if (pending > 0 && now.getTime() - lastPendingAt > PENDING_EXPIRES_MS) {
      pending = 0;
      publish();
    }
    const steps = await readSensorSteps(now);
    if (steps !== null && mine === generation) confirm(steps);
  }, POLL_MS);
}

function end() {
  generation += 1;
  if (poll) clearInterval(poll);
  poll = null;
  removeWatcher?.();
  removeWatcher = null;
  removeAccelerometer?.();
  removeAccelerometer = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
}

// A screen that shows steps calls this and keeps the returned function to call when it goes away.
export function acquireLiveSteps(): () => void {
  users += 1;
  if (users === 1) begin();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    users -= 1;
    if (users === 0) end();
  };
}
