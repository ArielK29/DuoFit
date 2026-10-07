import { useEffect } from 'react';
import { ActivityIndicator, I18nManager, Platform, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Heebo_400Regular, Heebo_500Medium, Heebo_700Bold, Heebo_800ExtraBold } from '@expo-google-fonts/heebo';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PostHogErrorBoundary } from 'posthog-react-native';
import { ErrorFallback } from '@components/ErrorFallback';
import { AccountSheet } from '@components/AccountSheet';
import { NotificationWatcher } from '@components/NotificationWatcher';
import { ChatSync } from '@components/ChatSync';
import { ProgressSync } from '@components/ProgressSync';
import { WorkoutSync } from '@components/WorkoutSync';
import { NotificationSync } from '@components/NotificationSync';
import { useAuth, isProfileComplete } from '@hooks/useAuth';
import { startSessionSync } from '@lib/session';
import { AnalyticsProvider } from '@lib/analytics';
import { theme } from '@styles/theme';

// Force RTL layout for Hebrew
I18nManager.forceRTL(true);

// Browser preview: forceRTL does nothing on the web, so set the page direction
// directly (rows, alignment and text then mirror like they do on the phone).
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'he');
}

// Keep the native splash screen up until fonts have finished loading (or
// failed), so there's no flash-of-unstyled-content moment where UI briefly
// renders with the OS default font. Must be called at module scope,
// unawaited, before the splash screen would otherwise auto-hide.
SplashScreen.preventAutoHideAsync();

// Shared loading view for both the zustand-hydration gate and the
// font-loading gate below, so the spinner isn't duplicated in two places.
function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={theme.colors.cyan} size="large" />
    </View>
  );
}

// The navigator lives in its own component so it can read the device's safe-area
// insets (status bar / Dynamic Island on top, home indicator on the bottom).
// Every screen gets the top inset as padding, so headers never sit under the
// status bar. Non-tab screens also keep clear of the home indicator; the tab bar
// handles its own bottom inset (see (tabs)/_layout.tsx).
function AppStack({ isAuthenticated, profileComplete }: { isAuthenticated: boolean; profileComplete: boolean }) {
  const insets = useSafeAreaInsets();
  const screenStyle = { backgroundColor: theme.colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: screenStyle,
        // 05-MOTION-SPECS.md: screens fade in while sliding up, 300ms ease-out.
        animation: 'fade_from_bottom',
        animationDuration: 300,
      }}
    >
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated && !profileComplete}>
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated && profileComplete}>
        <Stack.Screen name="(tabs)" options={{ contentStyle: { ...screenStyle, paddingBottom: 0 } }} />
        <Stack.Screen name="partner-profile" />
        <Stack.Screen name="schedule-workout" />
        <Stack.Screen name="check-in" />
        <Stack.Screen name="conversation" />
        <Stack.Screen name="invite-to-workout" />
        <Stack.Screen name="notifications" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // The saved Supabase session is restored asynchronously on launch; wait for it
  // before picking a screen so a signed-in user never flashes the login screen.
  const isReady = useAuth((state) => state.isReady);
  const user = useAuth((state) => state.user);
  const initialize = useAuth((state) => state.initialize);
  const hasHydrated = isReady;
  const isAuthenticated = !!user;
  const profileComplete = isProfileComplete(user);

  useEffect(() => {
    const stopAuth = initialize();
    const stopSync = startSessionSync();
    return () => {
      stopAuth();
      stopSync();
    };
  }, [initialize]);

  // Custom fonts referenced throughout constants/typography.ts (Anton, Heebo,
  // Space Grotesk, JetBrains Mono). Weight-specific constants are loaded
  // individually since each Google Fonts weight ships as its own family name.
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    SpaceGrotesk_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (hasHydrated && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [hasHydrated, fontsReady]);

  // Don't render the app until both zustand hydration and font loading have
  // settled — otherwise UI could briefly commit with the OS default font
  // before swapping to the custom typefaces once they finish loading.
  // AnalyticsProvider wraps both the loading state and the real navigator so
  // PostHog is initialized as early as possible, without changing this gate.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnalyticsProvider>
        {!hasHydrated || !fontsReady ? (
          <LoadingScreen />
        ) : (
          <PostHogErrorBoundary fallback={ErrorFallback}>
            <AppStack isAuthenticated={isAuthenticated} profileComplete={profileComplete} />
            {isAuthenticated && profileComplete && <AccountSheet />}
            {isAuthenticated && profileComplete && <NotificationWatcher />}
            {isAuthenticated && profileComplete && <ChatSync />}
            {isAuthenticated && profileComplete && <ProgressSync />}
            {isAuthenticated && profileComplete && <WorkoutSync />}
            {isAuthenticated && profileComplete && <NotificationSync />}
          </PostHogErrorBoundary>
        )}
      </AnalyticsProvider>
    </GestureHandlerRootView>
  );
}
