import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { clearIncomingLink, useIncomingLink } from '@lib/incomingLink';
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { confirmationLinkMessage, invalidLinkExits, parseAuthLink } from '@lib/authLinks';
import { AuthLayout, authStyles } from '@screens/login/AuthLayout';

type Phase = 'checking' | 'confirmed' | 'invalid';

// How long to wait for the phone to hand over the link that opened the app before giving up.
const LINK_WAIT_MS = 2000;

// The screen the sign-up confirmation email opens. Open to everyone (see _layout.tsx): the link
// itself signs the new member in, and the root layout then continues to the profile setup.
export const EmailConfirmedScreen: React.FC = () => {
  const router = useRouter();
  const completeAuthLink = useAuth((state) => state.completeAuthLink);
  const signedIn = useAuth((state) => state.isAuthenticated);

  // On the phone the link can arrive before this screen exists (the app was already running when the mail link
  // was tapped), so use the hook that keeps the latest link; on the web it is simply the page address.
  const nativeUrl = useIncomingLink();
  const url = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : nativeUrl;

  const [phase, setPhase] = useState<Phase>('checking');
  const [problem, setProblem] = useState('');
  const handledUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      const timer = setTimeout(() => {
        setProblem(confirmationLinkMessage({ kind: 'none' }));
        setPhase((current) => (current === 'checking' ? 'invalid' : current));
      }, LINK_WAIT_MS);
      return () => clearTimeout(timer);
    }
    // Each link can be used once; the same address showing up again must not be redeemed twice.
    if (handledUrl.current === url) return undefined;
    handledUrl.current = url;

    const link = parseAuthLink(url);
    const message = confirmationLinkMessage(link);
    if (message) {
      setProblem(message);
      setPhase('invalid');
      return undefined;
    }
    completeAuthLink(link).then((ok) => {
      clearIncomingLink(); // a one-time link is used up either way
      if (ok) {
        // Keep the one-time tokens out of the address bar and the browser history.
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }
        setPhase('confirmed');
      } else {
        setProblem(confirmationLinkMessage({ kind: 'error', code: 'otp_expired', expired: true }));
        setPhase('invalid');
      }
    });
    return undefined;
  }, [url, completeAuthLink]);

  if (phase === 'checking') {
    return (
      <AuthLayout subtitle="אימות אימייל">
        <Text style={authStyles.successText}>בודקים את הקישור...</Text>
      </AuthLayout>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthLayout subtitle="אימות אימייל">
        <Text style={authStyles.successTitle}>הקישור לא עובד</Text>
        <Text style={authStyles.successText}>{problem}</Text>
        {invalidLinkExits(signedIn, 'confirm').map((exit) => (
          <Button key={exit.href} label={exit.label} variant="primary" size="lg" onPress={() => router.replace(exit.href)} />
        ))}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle="אימות אימייל">
      <Text style={authStyles.successTitle}>האימייל אומת</Text>
      <Text style={authStyles.successText}>החשבון שלך מוכן. נשאר רק להשלים את הפרופיל.</Text>
      <Button label="המשך" variant="primary" size="lg" onPress={() => router.replace('/')} />
    </AuthLayout>
  );
};

export default EmailConfirmedScreen;
