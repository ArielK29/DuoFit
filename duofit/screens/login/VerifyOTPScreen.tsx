import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  I18nManager,
  TextInput,
} from 'react-native';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

I18nManager.forceRTL(true);

export const VerifyOTPScreen: React.FC<{ onNavigate?: (screen: string) => void; phoneNumber?: string }> = ({
  onNavigate,
  phoneNumber = '054-XXX-XXXX',
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('הזן קוד 6 ספרות'); // Enter 6-digit code
      return;
    }

    setLoading(true);

    // Simulate API verification
    setTimeout(() => {
      setLoading(false);
      if (otp === '123456') {
        // Demo code
        Alert.alert('הצלחה', 'אתה התחברת בהצלחה!');
        if (onNavigate) {
          onNavigate('Profile');
        }
      } else {
        setError('קוד OTP שגוי'); // Invalid OTP
      }
    }, 1500);
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp('');
    Alert.alert('הצלחה', 'קוד OTP חדש נשלח');
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
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    phone: {
      fontSize: 14,
      color: theme.colors.cyan,
      textAlign: 'center',
      fontWeight: '600',
    },
    form: {
      marginVertical: theme.spacing.xl,
    },
    otpContainer: {
      marginBottom: theme.spacing.lg,
    },
    otpLabel: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: theme.spacing.sm,
      textAlign: 'right',
    },
    otpInput: {
      borderWidth: 2,
      borderColor: theme.colors.surfaceHover,
      borderRadius: theme.borderRadius.md,
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
      letterSpacing: 8,
      minHeight: 60,
    },
    timer: {
      textAlign: 'center',
      marginTop: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    timerActive: {
      color: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginVertical: theme.spacing.md,
      fontSize: 14,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
    },
    resendContainer: {
      marginTop: theme.spacing.lg,
    },
    resendText: {
      textAlign: 'center',
      color: theme.colors.textTertiary,
      fontSize: 14,
      marginBottom: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>אימות קוד OTP</Text>
          <Text style={styles.subtitle}>הזנו את הקוד שנשלח ל:</Text>
          <Text style={styles.phone}>{phoneNumber}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>קוד OTP (6 ספרות)</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={theme.colors.textTertiary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              selectTextOnFocus
            />
            <Text style={[styles.timer, !canResend && styles.timerActive]}>
              {!canResend ? `שלח מחדש בעוד ${timer}s` : 'לחץ כדי לשלוח מחדש'}
            </Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Button
              label={loading ? 'אימות...' : 'אמת קוד'}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              onPress={handleVerify}
            />
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>לא קיבלת קוד?</Text>
            <Button
              label="שלח קוד חדש"
              variant="secondary"
              disabled={!canResend || loading}
              onPress={handleResend}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default VerifyOTPScreen;
