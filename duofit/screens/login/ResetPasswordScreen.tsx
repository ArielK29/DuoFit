import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useAuth } from '@hooks/useAuth';
import { MIN_PASSWORD_LENGTH } from '@lib/authErrors';
import { parseAuthLink, recoveryLinkMessage, validateNewPassword } from '@lib/authLinks';
import { AuthLayout, authStyles } from '@screens/login/AuthLayout';

type Phase = 'checking' | 'ready' | 'invalid' | 'done';

// How long to wait for the phone to hand over the link that opened the app before giving up.
const LINK_WAIT_MS = 2000;

// The screen the "reset password" email opens. It is open to everyone (see _layout.tsx): the link
// itself signs the member in, and then they choose a new password.
export const ResetPasswordScreen: React.FC = () => {
  const router = useRouter();
  const completeAuthLink = useAuth((state) => state.completeAuthLink);
  const updatePassword = useAuth((state) => state.updatePassword);
  const isLoading = useAuth((state) => state.isLoading);
  const storeError = useAuth((state) => state.error);
  const setError = useAuth((state) => state.setError);

  // On the phone the link arrives asynchronously; on the web it is simply the page address.
  const nativeUrl = Linking.useURL();
  const url = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : nativeUrl;

  const [phase, setPhase] = useState<Phase>('checking');
  const [problem, setProblem] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const handledUrl = useRef<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (!url) {
      const timer = setTimeout(() => {
        setProblem(recoveryLinkMessage({ kind: 'none' }));
        setPhase((current) => (current === 'checking' ? 'invalid' : current));
      }, LINK_WAIT_MS);
      return () => clearTimeout(timer);
    }
    // Each link can be used once; the same address showing up again must not be redeemed twice.
    if (handledUrl.current === url) return undefined;
    handledUrl.current = url;

    const link = parseAuthLink(url);
    const message = recoveryLinkMessage(link);
    if (message) {
      setProblem(message);
      setPhase('invalid');
      return undefined;
    }
    completeAuthLink(link).then((ok) => {
      if (ok) {
        // Keep the one-time tokens out of the address bar and the browser history.
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }
        setPhase('ready');
      } else {
        setProblem(recoveryLinkMessage({ kind: 'error', code: 'otp_expired', expired: true }));
        setPhase('invalid');
      }
    });
    return undefined;
  }, [url, completeAuthLink]);

  const handleSave = async () => {
    setLocalError(null);
    setError(null);
    const mistake = validateNewPassword(password, confirm);
    if (mistake) {
      setLocalError(mistake);
      return;
    }
    if (await updatePassword(password)) setPhase('done');
  };

  if (phase === 'checking') {
    return (
      <AuthLayout subtitle="איפוס סיסמה">
        <Text style={authStyles.successText}>בודקים את הקישור...</Text>
      </AuthLayout>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthLayout subtitle="איפוס סיסמה">
        <Text style={authStyles.successTitle}>הקישור לא עובד</Text>
        <Text style={authStyles.successText}>{problem}</Text>
        <Button label="בקש קישור חדש" variant="primary" size="lg" onPress={() => router.replace('/forgot-password')} />
        <Button label="חזרה להתחברות" variant="secondary" size="lg" onPress={() => router.replace('/login')} />
      </AuthLayout>
    );
  }

  if (phase === 'done') {
    return (
      <AuthLayout subtitle="איפוס סיסמה">
        <Text style={authStyles.successTitle}>הסיסמה עודכנה</Text>
        <Text style={authStyles.successText}>מעכשיו מתחברים עם הסיסמה החדשה.</Text>
        <Button label="המשך" variant="primary" size="lg" onPress={() => router.replace('/')} />
      </AuthLayout>
    );
  }

  const error = localError ?? storeError;

  return (
    <AuthLayout subtitle="בחירת סיסמה חדשה" description={`לפחות ${MIN_PASSWORD_LENGTH} תווים`}>
      <Input
        label="סיסמה חדשה"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        disabled={isLoading}
      />
      <Input
        label="הקלד שוב את הסיסמה"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        disabled={isLoading}
        onSubmitEditing={handleSave}
      />

      {error && <Text style={authStyles.errorText}>{error}</Text>}

      <View style={authStyles.buttons}>
        <Button label="שמור סיסמה" variant="primary" size="lg" loading={isLoading} disabled={isLoading} onPress={handleSave} />
      </View>
    </AuthLayout>
  );
};

export default ResetPasswordScreen;
