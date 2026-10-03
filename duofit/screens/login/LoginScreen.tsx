import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useAuth } from '@hooks/useAuth';
import { isValidEmail } from '@lib/authErrors';
import { trackEvent } from '@lib/analytics';
import { AuthLayout, authStyles } from '@screens/login/AuthLayout';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const signIn = useAuth((state) => state.signIn);
  const isLoading = useAuth((state) => state.isLoading);
  const storeError = useAuth((state) => state.error);
  const setError = useAuth((state) => state.setError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Start every visit with a clean error (the store keeps the last one).
  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleLogin = async () => {
    setLocalError(null);
    setError(null);

    if (!isValidEmail(email)) {
      setLocalError('הזן כתובת אימייל תקינה');
      return;
    }
    if (!password) {
      setLocalError('הזן סיסמה');
      return;
    }

    const ok = await signIn(email, password);
    if (ok) trackEvent('login_succeeded');
    // On success the root layout moves the user on (profile setup or the app).
  };

  const error = localError ?? storeError;

  return (
    <AuthLayout subtitle="למצוא את בן הזוג הבא שלך" description="התחבר עם האימייל והסיסמה שלך">
      <Input
        label="אימייל"
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        disabled={isLoading}
      />
      <Input
        label="סיסמה"
        placeholder="הסיסמה שלך"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        disabled={isLoading}
        onSubmitEditing={handleLogin}
      />

      {error && <Text style={authStyles.errorText}>{error}</Text>}

      <View style={authStyles.buttons}>
        <Button label="התחבר" variant="primary" size="lg" loading={isLoading} disabled={isLoading} onPress={handleLogin} />
      </View>

      <Pressable style={authStyles.linkRow} onPress={() => router.push('/forgot-password')} accessibilityRole="link">
        <Text style={authStyles.linkText}>שכחתי סיסמה</Text>
      </Pressable>
      <Pressable style={authStyles.linkRow} onPress={() => router.push('/sign-up')} accessibilityRole="link">
        <Text style={authStyles.linkText}>אין לך חשבון? הירשם</Text>
      </Pressable>
    </AuthLayout>
  );
};

export default LoginScreen;
