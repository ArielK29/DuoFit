import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, LayoutChangeEvent, ViewToken } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ProgressRing } from '@components/ProgressRing';
import { theme } from '@styles/theme';

export interface RingStat {
  value: string;
  goal: string;
  label: string;
  progress: number;
  color: string;
  icon: LucideIcon;
}

export interface StatPage {
  key: string;
  badge?: string;
  stats: RingStat[];
}

const cardElevation = Platform.select({
  android: { elevation: 4 },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

// Swipeable pages of 3 stat rings with dot indicators, per the FitMatch home
// reference. FlatList + onViewableItemsChanged (not raw scroll offsets) so the
// active dot stays correct under forced RTL on Android.
export const StatCarousel: React.FC<{ pages: StatPage[] }> = ({ pages }) => {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // FlatList throws if this callback's identity changes between renders.
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const index = viewableItems[0]?.index;
    if (index != null) setActiveIndex(index);
  }, []);

  return (
    <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          data={pages}
          keyExtractor={(page) => page.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <View style={{ width }}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <View style={styles.row}>
                {item.stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <View key={stat.label} style={[styles.card, cardElevation]}>
                      <Text style={styles.value}>
                        {stat.value}
                        <Text style={styles.goal}>/{stat.goal}</Text>
                      </Text>
                      <Text style={styles.label}>{stat.label}</Text>
                      <ProgressRing
                        size={52}
                        strokeWidth={6}
                        progress={stat.progress}
                        color={stat.color}
                        trackColor={theme.colors.surfaceHover}
                      >
                        <Icon color={stat.color} size={18} strokeWidth={2} />
                      </ProgressRing>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}
      <View style={styles.dots}>
        {pages.map((page, index) => (
          <View key={page.key} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  value: {
    fontSize: 20,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  goal: {
    fontSize: 12,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.textTertiary,
  },
  label: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
  },
  dotActive: {
    width: 18,
    backgroundColor: theme.colors.text,
  },
});
