// "No internet" detection without a native package: a tiny request to our own backend. Any HTTP answer (even an error status)
// means the server is reachable; a thrown error or a timeout means it is not. The banner needs several failures in a row, so one
// slow answer never flashes it.
export const OFFLINE_AFTER_FAILURES = 2;

export interface ConnectivityState { online: boolean; failures: number }
export const initialConnectivity: ConnectivityState = { online: true, failures: 0 };

export function nextConnectivity(state: ConnectivityState, reachable: boolean): ConnectivityState {
  if (reachable) return { online: true, failures: 0 };
  const failures = state.failures + 1;
  return { online: failures < OFFLINE_AFTER_FAILURES, failures };
}

// Checks gently while online and fine, quickly while offline or while a failure is being confirmed (to recover and to confirm fast).
export const probeDelayMs = (state: ConnectivityState): number => (state.online && state.failures === 0 ? 30000 : 5000);

export async function probeReachable(request: () => Promise<{ status: number }>, timeoutMs: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => { timer = setTimeout(() => resolve(false), timeoutMs); });
  const answer = request().then(() => true, () => false);
  try {
    return await Promise.race([answer, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
