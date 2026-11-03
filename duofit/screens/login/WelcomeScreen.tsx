import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, ShieldCheck, Users, type LucideIcon } from 'lucide-react-native';
import { Button } from '@components/Button';
import { Logo } from '@components/Logo';
import { useIntroStore } from '@hooks/useIntroStore';
import { INTRO_SLIDES } from '@lib/signupFlow';
import { theme } from '@styles/theme';

const ICONS: LucideIcon[] = [Users, ShieldCheck, Dumbbell];

// The three screens a new member sees first. "Start" goes to sign-up, "I have an account" to sign-in; both remember that the
// intro was seen, so it never shows again on this phone.
export const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const markIntroSeen = useIntroStore((state) => state.markIntroSeen);
  const [index, setIndex] = useState(0);
  const slide = INTRO_SLIDES[index];
  const Icon = ICONS[index];
  const isLast = index === INTRO_SLIDES.length - 1;

  const goTo = (path: '/sign-up' | '/login') => {
    markIntroSeen();
    router.replace(path);
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Logo width={200} />
      </View>

      <View style={styles.middle}>
        <View style={styles.iconTile}>
          <Icon color={theme.colors.cyan} size={56} strokeWidth={1.75} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
        <View style={styles.dots} accessibilityLabel={`שלב ${index + 1} מתוך ${INTRO_SLIDES.length}`}>
          {INTRO_SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        {isLast ? (
          <Button label="בואו נתחיל" variant="primary" size="lg" onPress={() => goTo('/sign-up')} />
        ) : (
          <Button label="הבא" variant="primary" size="lg" onPress={() => setIndex(index + 1)} />
        )}
        <Pressable style={styles.link} onPress={() => goTo('/login')} accessibilityRole="link">
          <Text style={styles.linkText}>יש לי כבר חשבון</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  top: {
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  iconTile: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.xl * 1.5,
    backgroundColor: 'rgba(0,229,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.cyan,
  },
  bottom: {
    gap: theme.spacing.sm,
  },
  link: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: theme.colors.cyan,
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
  },
});
