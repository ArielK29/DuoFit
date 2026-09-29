import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { Heart, X, MapPin, SearchX, Dumbbell } from 'lucide-react-native';
import { usePartnerMatching, PartnerWithDistance } from '@hooks/usePartnerMatching';
import { EmptyState } from '@components/EmptyState';
import { theme } from '@styles/theme';

const SWIPE_THRESHOLD = 120;
// Per 05-MOTION-SPECS.md "Partner Card Swipe": rotate -45°, translateX(-200px), fade, 300ms ease-in.
const EXIT_TRANSLATE_X = 500;
const EXIT_ROTATION_DEG = 45;
const EXIT_DURATION_MS = 300;

export function DiscoverScreen() {
  const router = useRouter();
  const { currentPartner, isLoading, isEmpty, interested, pass, refresh } = usePartnerMatching();
  const cardRef = useRef<PartnerCardHandle>(null);

  const handleInterested = () => {
    if (!currentPartner) return;
    const { id, name, activities } = currentPartner;
    interested();
    router.push({
      pathname: '/schedule-workout',
      params: { partnerId: id, partnerName: name, activity: activities[0] ?? 'אימון משותף' },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewBadge}>
        <Text style={styles.previewBadgeText}>תצוגה מקדימה — נתוני דוגמה</Text>
      </View>
      <Text style={styles.title}>גלה שותפים</Text>

      <View style={styles.stage}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={
                <View style={styles.emptyIconCircle}>
                  <SearchX color={theme.colors.cyan} size={24} strokeWidth={2} />
                </View>
              }
              headline="אין שותפים קרובים"
              subheading="נסה שוב מאוחר יותר או הרחב את ההרשאות"
              ctaLabel="רענן חיפוש"
              onCtaPress={refresh}
            />
          </View>
        ) : (
          currentPartner && (
            <PartnerCard
              ref={cardRef}
              key={currentPartner.id}
              partner={currentPartner}
              onPass={pass}
              onInterested={handleInterested}
              onOpenProfile={() =>
                router.push({
                  pathname: '/partner-profile',
                  params: { partnerId: currentPartner.id, distanceKm: String(currentPartner.distanceKm.toFixed(1)) },
                })
              }
            />
          )
        )}
      </View>

      {!isLoading && !isEmpty && currentPartner && (
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, styles.passButton]}
            onPress={() => cardRef.current?.swipeLeft()}
            accessibilityLabel="לא מתאים"
          >
            <X color={theme.colors.textSecondary} size={24} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.interestedButton]}
            onPress={() => cardRef.current?.swipeRight()}
            accessibilityLabel="מעניין"
          >
            <Heart color={theme.colors.black} size={24} strokeWidth={2} fill={theme.colors.black} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

interface PartnerCardProps {
  partner: PartnerWithDistance;
  onPass: () => void;
  onInterested: () => void;
  onOpenProfile: () => void;
}

interface PartnerCardHandle {
  swipeLeft: () => void;
  swipeRight: () => void;
}

const PartnerCard = React.forwardRef<PartnerCardHandle, PartnerCardProps>(function PartnerCard(
  { partner, onPass, onInterested, onOpenProfile },
  ref
) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const exit = (direction: 'left' | 'right', onDone: () => void) => {
    const sign = direction === 'left' ? -1 : 1;
    translateX.value = withTiming(sign * EXIT_TRANSLATE_X, { duration: EXIT_DURATION_MS });
    rotate.value = withTiming(sign * EXIT_ROTATION_DEG, { duration: EXIT_DURATION_MS });
    opacity.value = withTiming(0, { duration: EXIT_DURATION_MS }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  };

  React.useImperativeHandle(ref, () => ({
    swipeLeft: () => exit('left', onPass),
    swipeRight: () => exit('right', onInterested),
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = (event.translationX / EXIT_TRANSLATE_X) * EXIT_ROTATION_DEG;
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

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Pressable style={styles.cardContent} onPress={onOpenProfile}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{partner.name[0]}</Text>
          </View>
          <Text style={styles.partnerName}>
            {partner.name}, {partner.age}
          </Text>
          <View style={styles.distanceRow}>
            <MapPin color={theme.colors.textTertiary} size={16} strokeWidth={2} />
            <Text style={styles.distanceText}>{partner.distanceKm.toFixed(1)} ק"מ ממך</Text>
          </View>
          <Text style={styles.bio}>{partner.bio}</Text>
          <View style={styles.tagsRow}>
            {partner.activities.map((activity) => (
              <View key={activity} style={styles.tag}>
                <Dumbbell color={theme.colors.cyan} size={16} strokeWidth={2} />
                <Text style={styles.tagText}>{activity}</Text>
              </View>
            ))}
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

function LoadingSkeleton() {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return <Animated.View style={[styles.card, styles.skeleton, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  previewBadge: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewBadgeText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
  },
  title: {
    width: '100%',
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.lg,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    width: '100%',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    minHeight: 420,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl,
  },
  skeleton: {
    backgroundColor: theme.colors.surfaceHover,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarInitial: {
    fontSize: 36,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.cyan,
  },
  partnerName: {
    fontSize: 22,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  distanceText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
  },
  bio: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  tagText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xxl,
    paddingVertical: theme.spacing.xl,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
  },
  interestedButton: {
    backgroundColor: theme.colors.magenta,
  },
});
