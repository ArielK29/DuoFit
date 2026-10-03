import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { SegmentedToggle } from '@components/SegmentedToggle';
import { Button } from '@components/Button';
import { getActivityStyle } from '@lib/activityStyles';
import {
  ACTIVITY_OPTIONS,
  DEFAULT_FILTERS,
  MAX_AGE,
  MAX_RADIUS_KM,
  MIN_AGE,
  MIN_RADIUS_KM,
  PartnerFilters,
  PartnerWithDistance,
  filterPartners,
} from '@hooks/usePartnerMatching';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

interface FilterSheetProps {
  visible: boolean;
  filters: PartnerFilters;
  partners: PartnerWithDistance[];
  onApply: (filters: PartnerFilters) => void;
  onClose: () => void;
}

const GENDER_OPTIONS: { value: PartnerFilters['gender']; label: string }[] = [
  { value: 'all', label: 'כולם' },
  { value: 'F', label: 'נשים בלבד' },
  { value: 'M', label: 'גברים בלבד' },
];

// Bottom sheet per the FitMatch reference: gender, age range, travel radius,
// activity chips, and a live "show N partners" button. The content mounts
// only while the sheet is open, so every opening starts from the applied
// filters without syncing state in an effect.
export const FilterSheet: React.FC<FilterSheetProps> = (props) => (
  <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
    {props.visible && <FilterSheetContent {...props} />}
  </Modal>
);

const FilterSheetContent: React.FC<FilterSheetProps> = ({ filters, partners, onApply, onClose }) => {
  const [draft, setDraft] = useState(filters);

  const matchCount = filterPartners(partners, draft).length;

  const toggleActivity = (activity: string) =>
    setDraft((prev) => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter((item) => item !== activity)
        : [...prev.activities, activity],
    }));

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="סגור" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.title}>סינון שותפים</Text>
          <Text style={styles.subtitle}>אתה בוחר את הקהל. ההגדרות חלות גם על מי שיכול לראות אותך.</Text>

          <Text style={styles.sectionLabel}>מי יופיע לי</Text>
          <SegmentedToggle
            options={GENDER_OPTIONS}
            value={draft.gender}
            onChange={(gender) => setDraft((prev) => ({ ...prev, gender }))}
          />

          <Text style={styles.sliderLabel}>
            טווח גילאים: {MIN_AGE}–{draft.maxAge}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_AGE}
            maximumValue={MAX_AGE}
            step={1}
            value={draft.maxAge}
            onValueChange={(maxAge) => setDraft((prev) => ({ ...prev, maxAge }))}
            minimumTrackTintColor={theme.colors.cyan}
            maximumTrackTintColor={theme.colors.surfaceHover}
            thumbTintColor={theme.colors.text}
          />
          <View style={styles.sliderEnds}>
            <Text style={styles.sliderEnd}>מ־{MIN_AGE}</Text>
            <Text style={styles.sliderEnd}>עד {MAX_AGE}</Text>
          </View>

          <Text style={styles.sliderLabel}>אזור נסיעה: {draft.radiusKm} ק״מ</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_RADIUS_KM}
            maximumValue={MAX_RADIUS_KM}
            step={1}
            value={draft.radiusKm}
            onValueChange={(radiusKm) => setDraft((prev) => ({ ...prev, radiusKm }))}
            minimumTrackTintColor={theme.colors.cyan}
            maximumTrackTintColor={theme.colors.surfaceHover}
            thumbTintColor={theme.colors.text}
          />

          <Text style={styles.sectionLabel}>סגנון אימון</Text>
          <View style={styles.chips}>
            {ACTIVITY_OPTIONS.map((activity) => {
              const active = draft.activities.includes(activity);
              const Icon = getActivityStyle(activity).icon;
              return (
                <Pressable
                  key={activity}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleActivity(activity)}
                  accessibilityState={{ selected: active }}
                >
                  <Icon color={active ? theme.colors.black : theme.colors.textSecondary} size={16} strokeWidth={2} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{activity}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Button
              label={matchCount > 0 ? `הצג ${matchCount} שותפים` : 'אין שותפים בסינון הזה'}
              variant="primary"
              size="lg"
              disabled={matchCount === 0}
              onPress={() => onApply(draft)}
            />
            <Pressable style={styles.reset} onPress={() => setDraft(DEFAULT_FILTERS)}>
              <Text style={styles.resetText}>נקה הכל</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl * 1.5,
    borderTopRightRadius: theme.borderRadius.xl * 1.5,
    paddingTop: theme.spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    marginBottom: theme.spacing.md,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    width: '100%',
    fontSize: 24,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    width: '100%',
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sliderLabel: {
    width: '100%',
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginTop: theme.spacing.lg,
  },
  slider: {
    width: '100%',
    height: 48,
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEnd: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
  },
  chipActive: {
    backgroundColor: theme.colors.cyan,
  },
  chipText: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  actions: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  reset: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.magenta,
  },
});
