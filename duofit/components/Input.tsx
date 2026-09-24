import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps
} from 'react-native';
import { theme } from '@styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  value,
  onChangeText,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: theme.spacing.sm,
      textAlign: 'right', // RTL
    },
    inputContainer: {
      flexDirection: 'row-reverse', // RTL
      alignItems: 'center',
      borderWidth: 1,
      borderColor: error ? theme.colors.error : focused ? theme.colors.cyan : theme.colors.surfaceHover,
      borderRadius: theme.borderRadius.md,
      backgroundColor: disabled ? theme.colors.surface : theme.colors.bg,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48, // Touch target
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 16,
      paddingVertical: theme.spacing.sm,
      textAlign: 'right', // RTL
      fontFamily: 'Heebo',
    },
    error: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: theme.spacing.xs,
      textAlign: 'right', // RTL
    },
    helperText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginTop: theme.spacing.xs,
      textAlign: 'right', // RTL
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          editable={!disabled}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};
