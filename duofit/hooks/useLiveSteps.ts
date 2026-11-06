import { create } from 'zustand';
import { readSensorSteps, watchSensorSteps } from '@lib/pedometer';

// Today's steps straight from the phone's motion sensor, like a step counter app: one sensor subscription plus a quick read
// every second and a half, shared by every screen that shows steps (started when the first screen needs it, stopped when the
// last one leaves). Only ever goes up during a day and starts again from nothing at midnight.
const POLL_MS = 1500;

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
let poll: ReturnType<typeof setInterval> | null = null;
let generation = 0;

function raise(steps: number) {
  const current = useLiveSteps.getState().steps;
  if (current === null || steps > current) useLiveSteps.getState().setSteps(steps);
}

function begin() {
  const mine = ++generation;
  day = new Date().toDateString();
  watchSensorSteps((steps) => {
    if (mine === generation) raise(steps);
  }).then((remove) => {
    if (mine === generation && users > 0) removeWatcher = remove;
    else remove();
  });
  poll = setInterval(async () => {
    if (mine !== generation) return;
    const now = new Date();
    if (now.toDateString() !== day) {
      // A new day: forget yesterday and start over.
      end();
      useLiveSteps.getState().setSteps(null);
      begin();
      return;
    }
    const steps = await readSensorSteps(now);
    if (steps !== null && mine === generation) raise(steps);
  }, POLL_MS);
}

function end() {
  generation += 1;
  if (poll) clearInterval(poll);
  poll = null;
  removeWatcher?.();
  removeWatcher = null;
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
