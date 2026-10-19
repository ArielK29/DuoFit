import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { initialConnectivity, nextConnectivity, probeDelayMs, probeReachable } from '@lib/connectivity';
import { theme } from '@styles/theme';

const PROBE_TIMEOUT_MS = 6000;
const HEALTH_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health` : '';

// True while the backend can be reached. Checks every 30 s (every 5 s while offline or confirming a failure) and whenever the app
// comes back to the foreground. Without a configured backend it never claims to be offline.
function useOnline(): boolean {
  const [state, setState] = useState(initialConnectivity);
  const online = state.online;
  const delay = state === initialConnectivity ? 3000 : probeDelayMs(state); // the first check comes soon after launch
  useEffect(() => {
    if (!HEALTH_URL) return;
    let stopped = false;
    const check = async () => {
      const reachable = await probeReachable(() => fetch(HEALTH_URL, { method: 'GET' }), PROBE_TIMEOUT_MS);
      if (!stopped) setState((previous) => nextConnectivity(previous, reachable));
    };
    const timer = setTimeout(check, delay);
    const subscription = AppState.addEventListener('change', (status) => { if (status === 'active') check(); });
    return () => { stopped = true; clearTimeout(timer); subscription.remove(); };
  }, [state, delay]);
  return online;
}

// Wraps the whole app. Offline: a slim banner on top (it takes the status-bar inset, so the screens below get it as 0 and nothing
// is covered). Online: renders the app untouched.
export function ConnectivityShell({ children }: { children: React.ReactNode }) {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return <>{children}</>;
  return (
    <View style={styles.shell}>
      <View style={[styles.banner, { paddingTop: insets.top + theme.spacing.xs }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Text style={styles.text}>אין חיבור לאינטרנט. חלק מהפעולות לא יעבדו עד שהחיבור יחזור.</Text>
      </View>
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
        <View style={styles.content}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: theme.colors.bg },
  content: { flex: 1 },
  banner: {
    backgroundColor: theme.colors.surfaceHover,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  text: {
    color: theme.colors.warning,
    fontFamily: theme.typography.bodySmall.fontFamily,
    fontSize: 13,
    textAlign: 'center',
  },
});
