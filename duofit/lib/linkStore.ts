// Holds the link that opened (or was sent to) the app, so a screen that appears AFTER the link arrived can still read it. On a phone
// where the app was already running, the link event comes first and the router opens the screen a moment later: a hook that
// only listens from inside the screen misses it.
export interface LinkStore {
  get: () => string | null;
  set: (url: string) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
}

export function createLinkStore(): LinkStore {
  let current: string | null = null;
  const listeners = new Set<() => void>();
  const tell = () => listeners.forEach((listener) => listener());
  return {
    get: () => current,
    set: (url) => {
      if (typeof url !== 'string' || !url || url === current) return;
      current = url;
      tell();
    },
    clear: () => {
      if (current === null) return;
      current = null;
      tell();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
