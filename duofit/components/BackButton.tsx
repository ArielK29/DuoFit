import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '@styles/theme';

// A visible way out of a screen that has no header. On an iPhone the only other way is the edge swipe, which nobody is told about.
export function BackButton({ label = 'חזרה' }: { label?: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} style={styles.button} accessibilityRole="button" accessibilityLabel={label}>
      <ArrowLeft color={theme.colors.magenta} size={20} strokeWidth={2} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    minHeight: 48,
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  text: {
    color: theme.colors.magenta,
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
  },
});
