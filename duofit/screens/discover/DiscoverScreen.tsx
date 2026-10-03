import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, SearchX, SlidersHorizontal, X, Zap } from 'lucide-react-native';
import {
  ACTIVITY_OPTIONS,
  DEFAULT_FILTERS,
  MAX_AGE,
  MAX_RADIUS_KM,
  PartnerFilters,
  PartnerWithDistance,
  usePartnerMatching,
} from '@hooks/usePartnerMatching';
import { useChatStore } from '@hooks/useChatStore';
import { PartnerCard, PartnerCardHandle } from '@screens/discover/PartnerCard';
import { PlacesView } from '@screens/discover/PlacesView';
import { EmptyState } from '@components/EmptyState';
import { FilterSheet } from '@components/FilterSheet';
import { SegmentedToggle } from '@components/SegmentedToggle';
import { SkeletonLoader } from '@components/SkeletonLoader';
import { theme } from '@styles/theme';
import { DEMO_DATA } from '@lib/demo';
import { visualRight } from '@lib/rtl';

type ViewMode = 'partners' | 'places';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'partners', label: 'שותפים' },
  { value: 'places', label: 'מקומות' },
];

const QUICK_AGE = 30;
const QUICK_RADIUS_KM = 5;

function isDefault(filters: PartnerFilters): boolean {
  return (
    filters.gender === DEFAULT_FILTERS.gender &&
    filters.maxAge === DEFAULT_FILTERS.maxAge &&
    filters.radiusKm === DEFAULT_FILTERS.radiusKm &&
    filters.activities.length === 0
  );
}

export function DiscoverScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('partners');
  const [filters, setFilters] = useState<PartnerFilters>(DEFAULT_FILTERS);
  const [sheetVisible, setSheetVisible] = useState(false);
  const cardRef = useRef<PartnerCardHandle>(null);
  const ensureConversation = useChatStore((state) => state.ensureConversation);

  const { allPartners, candidates, currentPartner, viewerOrigin, isLoading, isEmpty, interested, pass, refresh } =
    usePartnerMatching(filters);

  const handleInterested = () => {
    if (!currentPartner) return;
    const { id, name, activities } = currentPartner;
    interested();
    router.push({
      pathname: '/schedule-workout',
      params: { partnerId: id, partnerName: name, activity: activities[0] ?? 'אימון משותף' },
    });
  };

  const openPartnerProfile = (partner: PartnerWithDistance) =>
    router.push({
      pathname: '/partner-profile',
      params: { partnerId: partner.id, distanceKm: partner.distanceKm.toFixed(1) },
    });

  const invitePartner = (partner: PartnerWithDistance) =>
    router.push({
      pathname: '/schedule-workout',
      params: { partnerId: partner.id, partnerName: partner.name, activity: partner.activities[0] ?? 'אימון משותף' },
    });

  const openChat = () => {
    if (!currentPartner) return;
    ensureConversation(currentPartner.id, currentPartner.name);
    router.push({
      pathname: '/conversation',
      params: { partnerId: currentPartner.id, partnerName: currentPartner.name },
    });
  };

  const toggleQuickActivity = (activity: string) =>
    setFilters((prev) => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter((item) => item !== activity)
        : [...prev.activities, activity],
    }));

  // No one has signed up near you yet (real users only; see lib/demo.ts).
  const noPartnersYet = allPartners.length === 0;

  const ageChipActive = filters.maxAge === QUICK_AGE;
  const radiusChipActive = filters.radiusKm === QUICK_RADIUS_KM;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>התאמות</Text>
            <Text style={styles.subtitle}>{`${filters.radiusKm} ק"מ מתל אביב`}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.filterButton} onPress={() => setSheetVisible(true)} accessibilityLabel="סינון">
              <SlidersHorizontal color={theme.colors.text} size={20} strokeWidth={2} />
              {!isDefault(filters) && <View style={styles.filterDot} />}
            </Pressable>
            {DEMO_DATA && (
              <View style={styles.previewPill}>
                <Text style={styles.previewPillText}>תצוגה מקדימה</Text>
              </View>
            )}
          </View>
        </View>

        <SegmentedToggle options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />

        {viewMode === 'partners' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsScroll}
            >
              <QuickChip label="כולם" active={isDefault(filters)} onPress={() => setFilters(DEFAULT_FILTERS)} />
              <QuickChip
                label={`גיל 21–${QUICK_AGE}`}
                active={ageChipActive}
                onPress={() => setFilters((prev) => ({ ...prev, maxAge: ageChipActive ? MAX_AGE : QUICK_AGE }))}
              />
              <QuickChip
                label={`עד ${QUICK_RADIUS_KM} ק"מ`}
                active={radiusChipActive}
                onPress={() =>
                  setFilters((prev) => ({ ...prev, radiusKm: radiusChipActive ? MAX_RADIUS_KM : QUICK_RADIUS_KM }))
                }
              />
              {ACTIVITY_OPTIONS.map((activity) => (
                <QuickChip
                  key={activity}
                  label={activity}
                  active={filters.activities.includes(activity)}
                  onPress={() => toggleQuickActivity(activity)}
                />
              ))}
            </ScrollView>

            {isLoading ? (
              <SkeletonLoader style={styles.skeleton} />
            ) : isEmpty || !currentPartner ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon={
                    <View style={styles.emptyIconCircle}>
                      <SearchX color={theme.colors.cyan} size={24} strokeWidth={2} />
                    </View>
                  }
                  headline="אין שותפים קרובים"
                  subheading={
                    noPartnersYet
                      ? 'DuoFit רק התחילה. הזמן חברים להצטרף ותמצאו אחד את השני'
                      : 'נסה להרחיב את הסינון או לנסות שוב מאוחר יותר'
                  }
                  ctaLabel={noPartnersYet ? 'הזמן חברים' : isDefault(filters) ? 'רענן חיפוש' : 'נקה סינון'}
                  onCtaPress={() => {
                    if (noPartnersYet) {
                      Share.share({ message: 'אני מחפש שותף לאימונים ב-DuoFit. בוא להתאמן ביחד!' });
                      return;
                    }
                    setFilters(DEFAULT_FILTERS);
                    refresh();
                  }}
                />
              </View>
            ) : (
              <>
                <PartnerCard
                  ref={cardRef}
                  key={currentPartner.id}
                  partner={currentPartner}
                  onPass={pass}
                  onInterested={handleInterested}
                  onOpenProfile={() =>
                    router.push({
                      pathname: '/partner-profile',
                      params: { partnerId: currentPartner.id, distanceKm: currentPartner.distanceKm.toFixed(1) },
                    })
                  }
                />
                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.circleButton}
                    onPress={() => cardRef.current?.swipeLeft()}
                    accessibilityLabel="לא מתאים"
                  >
                    <X color={theme.colors.magenta} size={26} strokeWidth={2.5} />
                  </Pressable>
                  <Pressable
                    style={styles.inviteButton}
                    onPress={() => cardRef.current?.swipeRight()}
                    accessibilityLabel="הזמן לאימון"
                  >
                    <Zap color={theme.colors.black} size={20} strokeWidth={2} />
                    <Text style={styles.inviteText}>הזמן לאימון</Text>
                  </Pressable>
                  <Pressable style={styles.circleButton} onPress={openChat} accessibilityLabel="שלח הודעה">
                    <MessageCircle color={theme.colors.text} size={24} strokeWidth={2} />
                  </Pressable>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.placesWrap}>
            <PlacesView
              origin={viewerOrigin}
              partners={candidates}
              onOpenPartner={openPartnerProfile}
              onInvitePartner={invitePartner}
            />
          </View>
        )}
      </ScrollView>

      <FilterSheet
        visible={sheetVisible}
        filters={filters}
        partners={allPartners}
        onApply={(next) => {
          setFilters(next);
          setSheetVisible(false);
        }}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

function QuickChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  headerText: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 34,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    ...visualRight(12),
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
  },
  previewPill: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  previewPillText: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  chipsScroll: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    flexGrow: 0,
  },
  chipsRow: {
    gap: theme.spacing.sm,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
  },
  chipActive: {
    backgroundColor: theme.colors.cyan,
  },
  chipText: {
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  skeleton: {
    width: '100%',
    height: 520,
    borderRadius: theme.borderRadius.xl * 1.5,
  },
  emptyWrap: {
    paddingTop: theme.spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 64,
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
  },
  inviteText: {
    fontSize: 17,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  placesWrap: {
    marginTop: theme.spacing.lg,
  },
});
