export type ListState = 'loading' | 'failed' | 'empty' | 'content';

// Which of the four things a list screen should show. Items already on screen always win (a failed
// reload must not wipe them); an empty list is only "empty" once the server has really answered.
export function listState(input: { loading: boolean; loaded: boolean; failed: boolean; count: number }): ListState {
  if (input.count > 0) return 'content';
  if (input.loading) return 'loading';
  if (input.failed) return 'failed';
  return input.loaded ? 'empty' : 'loading';
}

// Lets one tap through and ignores any further tap for `windowMs`, so a double tap on "send" or
// "confirm" cannot create the same thing twice.
export function createSubmitGuard(windowMs = 2000, now: () => number = Date.now) {
  let last = -Infinity;
  return (action: () => void): boolean => {
    const t = now();
    if (t - last < windowMs) return false;
    last = t;
    action();
    return true;
  };
}
