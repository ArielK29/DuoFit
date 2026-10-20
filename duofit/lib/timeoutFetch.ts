// A request that never gets an answer (a captive Wi-Fi, a dead connection that still looks connected) must fail after a while, so
// the screens show their "could not load" state instead of an endless spinner. Wraps fetch for the Supabase client.
export interface TimeoutOptions {
  defaultMs: number; // ordinary data calls
  longMs: number; // uploads and Edge Functions
  longPath: RegExp;
}

export const TIMEOUTS: TimeoutOptions = { defaultMs: 20000, longMs: 60000, longPath: /\/(storage|functions)\/v1\// };

export const timeoutFor = (url: string, options: TimeoutOptions): number => (options.longPath.test(url) ? options.longMs : options.defaultMs);

export function createTimeoutFetch(base: typeof fetch, options: TimeoutOptions = TIMEOUTS): typeof fetch {
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The race also covers a fetch that ignores the abort signal.
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Request timed out')); // first, so the timeout (not the abort it causes) is what the caller sees
        controller.abort();
      }, timeoutFor(url, options));
    });
    // The caller's own abort (supabase-js uses it) still works.
    const callerSignal = init?.signal;
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    return Promise.race([base(input, { ...init, signal: controller.signal }), timeout]).finally(() => clearTimeout(timer));
  }) as typeof fetch;
}
