import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, X, MapPin, SearchX, Dumbbell } from 'lucide-react-native';
import { usePartnerMatching, PartnerWithDistance } from '@hooks/usePartnerMatching';
import { EmptyState } from '@components/EmptyState';
import { SkeletonLoader } from '@components/SkeletonLoader';
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
        <Pressable style={styles.cardPressable} onPress={onOpenProfile}>
          <LinearGradient
            colors={[theme.colors.magenta, theme.colors.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBand}
          >
            <View style={styles.distanceBadge}>
              <MapPin color={theme.colors.black} size={14} strokeWidth={2} />
              <Text style={styles.distanceBadgeText}>{partner.distanceKm.toFixed(1)} ק"מ</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{partner.name[0]}</Text>
            </View>
          </LinearGradient>

          <View style={styles.cardBody}>
            <Text style={styles.partnerName}>
              {partner.name}, {partner.age}
            </Text>
            <Text style={styles.bio}>{partner.bio}</Text>
            <View style={styles.tagsRow}>
              {partner.activities.map((activity) => (
                <View key={activity} style={styles.tag}>
                  <Dumbbell color={theme.colors.cyan} size={16} strokeWidth={2} />
                  <Text style={styles.tagText}>{activity}</Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

function LoadingSkeleton() {
  return <SkeletonLoader style={styles.card} />;
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
    overflow: 'hidden',
  },
  cardPressable: {
    flex: 1,
  },
  heroBand: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.text,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bg,
    borderWidth: 3,
    borderColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  partnerName: {
    fontSize: 22,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
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
