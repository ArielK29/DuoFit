import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { theme } from '@styles/theme';

// Ensure RTL layout
I18nManager.forceRTL(true);

export const LoginScreen: React.FC<{ onNavigate?: (screen: string) => void }> = ({
  onNavigate,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhone = (phone: string): boolean => {
    // Israeli phone format: 05x-xxxx-xxxx or similar
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phone.length >= 9 && phoneRegex.test(phone);
  };

  const handleLogin = async () => {
    setError(null);

    if (!phoneNumber.trim()) {
      setError('הזן מספר טלפון'); // Enter phone number
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setError('מספר טלפון לא תקין'); // Invalid phone number
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('הצלחה', `קוד OTP נשלח ל-${phoneNumber}`);
      if (onNavigate) {
        onNavigate('VerifyOTP');
      }
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
    },
    header: {
      textAlign: 'center',
      marginBottom: theme.spacing.xxl,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
    form: {
      marginVertical: theme.spacing.xl,
    },
    inputWrapper: {
      marginBottom: theme.spacing.lg,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginVertical: theme.spacing.md,
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.surfaceHover,
      marginVertical: theme.spacing.lg,
    },
    footer: {
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
    footerText: {
      color: theme.colors.textTertiary,
      fontSize: 12,
      lineHeight: 18,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏋️ DuoFit</Text>
          <Text style={styles.subtitle}>למצוא את בן הזוג הבא שלך</Text>
          <Text style={styles.description}>
            התחברות מדויקת כדי לקבל OTP קוד בטלפון שלך
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Input
              label="מספר טלפון"
              placeholder="05X-XXXX-XXXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              disabled={loading}
              error={error ? undefined : undefined}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Button
              label={loading ? 'שליחה...' : 'קבל קוד OTP'}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              onPress={handleLogin}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            בלחיצה על "קבל קוד OTP" אתה מסכים{'\n'}לתנאי השירות שלנו
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;
