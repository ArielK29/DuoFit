import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react-native';
import { PartnerWithDistance } from '@hooks/usePartnerMatching';
import { getActivityStyle } from '@lib/activityStyles';
import { theme } from '@styles/theme';
import { visualLeft, visualRight } from '@lib/rtl';

const SWIPE_THRESHOLD = 120;
// Per 05-MOTION-SPECS.md "Partner Card Swipe": rotate 45°, translateX 200px, fade,
// 300ms ease-in. The drag itself maps 500px of finger travel to the full rotation.
const DRAG_ROTATION_RANGE_PX = 500;
const EXIT_TRANSLATE_X = 200;
const EXIT_ROTATION_DEG = 45;
const EXIT_DURATION_MS = 300;

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

export interface PartnerCardHandle {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface PartnerCardProps {
  partner: PartnerWithDistance;
  onPass: () => void;
  onInterested: () => void;
  onOpenProfile: () => void;
}

export const PartnerCard = React.forwardRef<PartnerCardHandle, PartnerCardProps>(function PartnerCard(
  { partner, onPass, onInterested, onOpenProfile },
  ref
) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const exit = (direction: 'left' | 'right', onDone: () => void) => {
    const sign = direction === 'left' ? -1 : 1;
    const timing = { duration: EXIT_DURATION_MS, easing: Easing.in(Easing.ease) };
    translateX.value = withTiming(sign * EXIT_TRANSLATE_X, timing);
    rotate.value = withTiming(sign * EXIT_ROTATION_DEG, timing);
    opacity.value = withTiming(0, timing, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  };

  React.useImperativeHandle(ref, () => ({
    swipeLeft: () => exit('left', onPass),
    swipeRight: () => exit('right', onInterested),
  }));

  // Horizontal swipes only, so vertical drags still scroll the screen.
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = (event.translationX / DRAG_ROTATION_RANGE_PX) * EXIT_ROTATION_DEG;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        exit('left', onPass);
      } else if (event.translationX > SWIPE_THRESHOLD) {
        exit('right', onInterested);
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  const mainActivity = partner.activities[0];
  const ActivityIcon = getActivityStyle(mainActivity).icon;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Pressable
          style={styles.pressable}
          onPress={onOpenProfile}
          accessibilityRole="button"
          accessibilityLabel={`${partner.name}, ${partner.age}, ${partner.activities.join(' ו')}, ${partner.distanceKm.toFixed(1)} ק"מ, ${partner.matchPercent}% התאמה. לחץ לפרופיל`}
        >
          <LinearGradient
            colors={[theme.colors.magenta, theme.colors.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.distancePill}>
              <MapPin color={theme.colors.black} size={13} strokeWidth={2} />
              <Text style={styles.pillText}>{`${partner.distanceKm.toFixed(1)} ק"מ`}</Text>
            </View>
            <View style={styles.matchPill}>
              <Sparkles color={theme.colors.black} size={13} strokeWidth={2} />
              <Text style={styles.pillText}>{partner.matchPercent}% התאמה</Text>
            </View>
            <Text style={styles.initial}>{partner.name[0]}</Text>
            <View style={styles.activityPill}>
              <ActivityIcon color={theme.colors.text} size={14} strokeWidth={2} />
              <Text style={styles.activityPillText}>{mainActivity}</Text>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.nameRow}>
              <View style={styles.ratingPill}>
                <Star color={theme.colors.warning} size={13} strokeWidth={2} fill={theme.colors.warning} />
                <Text style={styles.ratingText}>
                  {partner.sessions} · {partner.rating.toFixed(1)}
                </Text>
              </View>
              <View style={styles.nameGroup}>
                {partner.verified && <BadgeCheck color={theme.colors.cyan} size={20} strokeWidth={2} />}
                <Text style={styles.name}>
                  {partner.name}, {partner.age}
                </Text>
              </View>
            </View>

            <Text style={styles.bio}>{partner.bio}</Text>

            <Text style={styles.availabilityLabel}>
              זמינות · {partner.availableFrom}–{partner.availableTo}
            </Text>
            <View style={styles.daysRow}>
              {WEEKDAY_LETTERS.map((letter, index) => {
                const available = partner.availableDays.includes(index);
                return (
                  <View key={letter} style={[styles.dayChip, available && styles.dayChipActive]}>
                    <Text style={[styles.dayText, available && styles.dayTextActive]}>{letter}</Text>
                  </View>
                );
              })}
            </View>

            {partner.verified && (
              <View style={styles.verifiedBanner}>
                <ShieldCheck color={theme.colors.cyan} size={18} strokeWidth={2} />
                <Text style={styles.verifiedText}>{'טלפון ות״ז מאומתים · מתחילים באימון אונליין משותף'}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    overflow: 'hidden',
  },
  pressable: {
    width: '100%',
  },
  hero: {
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distancePill: {
    position: 'absolute',
    top: theme.spacing.md,
    ...visualLeft(theme.spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(245,245,245,0.85)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  matchPill: {
    position: 'absolute',
    top: theme.spacing.md,
    ...visualRight(theme.spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.text,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  pillText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
  initial: {
    fontSize: 88,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  activityPill: {
    position: 'absolute',
    bottom: theme.spacing.md,
    ...visualRight(theme.spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(5,5,5,0.45)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  activityPillText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  body: {
    padding: theme.spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: 24,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  bio: {
    width: '100%',
    fontSize: 15,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  availabilityLabel: {
    width: '100%',
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  dayChip: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
  },
  dayChipActive: {
    backgroundColor: theme.colors.cyan,
  },
  dayText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  dayTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  verifiedText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.cyan,
    textAlign: 'right',
  },
});
