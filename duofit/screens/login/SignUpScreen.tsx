import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useAuth } from '@hooks/useAuth';
import { MIN_PASSWORD_LENGTH, isValidEmail } from '@lib/authErrors';
import { trackEvent } from '@lib/analytics';
import { useIntroStore } from '@hooks/useIntroStore';
import { birthProblem } from '@lib/signupFlow';
import { AuthLayout, authStyles } from '@screens/login/AuthLayout';

export const SignUpScreen: React.FC = () => {
  const router = useRouter();
  const signUp = useAuth((state) => state.signUp);
  const resendConfirmation = useAuth((state) => state.resendConfirmation);
  const isLoading = useAuth((state) => state.isLoading);
  const storeError = useAuth((state) => state.error);
  const setError = useAuth((state) => state.setError);

  const saveBirthDraft = useIntroStore((state) => state.saveBirthDraft);
  // Step 1 asks only the birth date (a member under 18 learns it before typing an e-mail), step 2 the account.
  const [step, setStep] = useState<'birth' | 'account'>('birth');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleBirth = () => {
    setLocalError(null);
    const problem = birthProblem(day, month, year);
    if (problem) {
      setLocalError(problem);
      return;
    }
    // Kept on this phone so the identity check can fill the date in; only an adult's date is ever saved.
    saveBirthDraft({ day: day.trim(), month: month.trim(), year: year.trim() });
    setStep('account');
  };

  const handleSignUp = async () => {
    setLocalError(null);
    setError(null);

    if (name.trim().length < 2) {
      setLocalError('הזן שם (לפחות 2 תווים)');
      return;
    }
    if (!isValidEmail(email)) {
      setLocalError('הזן כתובת אימייל תקינה');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`);
      return;
    }

    trackEvent('signup_started');
    const result = await signUp(email, password, name);
    if (!result) return;
    // Email confirmation is on: the account only works after the link in the email.
    if (result.needsEmailConfirmation) setSentTo(email.trim());
    // Otherwise a session exists and the root layout continues to profile setup.
  };

  const handleResend = async () => {
    if (!sentTo) return;
    const ok = await resendConfirmation(sentTo);
    setResent(ok);
  };

  if (sentTo) {
    return (
      <AuthLayout subtitle="כמעט סיימנו">
        <Text style={authStyles.successTitle}>בדוק את תיבת הדואר</Text>
        <Text style={authStyles.successText}>
          {`שלחנו קישור אימות אל ${sentTo}.\nלחץ עליו, ואחר כך חזור לכאן והתחבר.\nאם לא מצאת, בדוק גם בספאם.`}
        </Text>
        {resent && <Text style={authStyles.successText}>נשלח שוב. זה יכול לקחת דקה</Text>}
        {storeError && <Text style={authStyles.errorText}>{storeError}</Text>}
        <View style={authStyles.buttons}>
          <Button label="חזרה להתחברות" variant="primary" size="lg" onPress={() => router.replace('/login')} />
          <Button label="שלח שוב את המייל" variant="secondary" size="lg" loading={isLoading} onPress={handleResend} />
        </View>
      </AuthLayout>
    );
  }

  const error = localError ?? storeError;

  if (step === 'birth') {
    return (
      <AuthLayout subtitle="שלב 1 מתוך 2: מתי נולדת?" description="האפליקציה מיועדת לבני 18 ומעלה, כדי לשמור על כולם. התאריך לא מוצג בפרופיל.">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="יום" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder="חודש" value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder="שנה" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} onSubmitEditing={handleBirth} />
          </View>
        </View>

        {error && <Text style={authStyles.errorText}>{error}</Text>}

        <View style={authStyles.buttons}>
          <Button label="המשך" variant="primary" size="lg" onPress={handleBirth} />
        </View>

        <Pressable style={authStyles.linkRow} onPress={() => router.replace('/login')} accessibilityRole="link">
          <Text style={authStyles.linkText}>כבר יש לך חשבון? התחבר</Text>
        </Pressable>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle="שלב 2 מתוך 2: יוצרים חשבון" description="הרשמה עם אימייל. נשלח לך מייל לאימות החשבון">
      <Input
        label="שם"
        placeholder="איך יקראו לך באפליקציה"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        disabled={isLoading}
      />
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
        placeholder={`לפחות ${MIN_PASSWORD_LENGTH} תווים`}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        disabled={isLoading}
        onSubmitEditing={handleSignUp}
      />

      {error && <Text style={authStyles.errorText}>{error}</Text>}

      <View style={authStyles.buttons}>
        <Button label="הירשם" variant="primary" size="lg" loading={isLoading} disabled={isLoading} onPress={handleSignUp} />
      </View>

      <Pressable style={authStyles.linkRow} onPress={() => router.replace('/login')} accessibilityRole="link">
        <Text style={authStyles.linkText}>כבר יש לך חשבון? התחבר</Text>
      </Pressable>
      <Text style={authStyles.muted}>בהרשמה אתה מסכים לתנאי השימוש והפרטיות שלנו</Text>
      <Pressable style={authStyles.linkRow} onPress={() => router.push('/terms')} accessibilityRole="link">
        <Text style={authStyles.linkText}>קרא את תנאי השימוש והפרטיות</Text>
      </Pressable>
    </AuthLayout>
  );
};

export default SignUpScreen;
