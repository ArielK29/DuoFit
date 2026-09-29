import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { MapPin, X, SearchX } from 'lucide-react-native';
import { PartnerWithDistance } from '@hooks/usePartnerMatching';
import { Coordinates } from '@hooks/useLocation';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { EmptyState } from '@components/EmptyState';
import { darkMapStyle } from '@constants/mapStyle';
import { theme } from '@styles/theme';

// City-block-scale zoom — tight enough to tell nearby pins apart, wide
// enough to show the whole mock candidate pool at once.
const REGION_DELTA = 0.05;

interface PartnerMapViewProps {
  candidates: PartnerWithDistance[];
  viewerOrigin: Coordinates;
  isLoading: boolean;
  isEmpty: boolean;
  onRefresh: () => void;
}

export function PartnerMapView({ candidates, viewerOrigin, isLoading, isEmpty, onRefresh }: PartnerMapViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.cyan} size="large" />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon={
            <View style={styles.emptyIconCircle}>
              <SearchX color={theme.colors.cyan} size={24} strokeWidth={2} />
            </View>
          }
          headline="אין שותפים קרובים"
          subheading="נסה שוב מאוחר יותר או הרחב את ההרשאות"
          ctaLabel="רענן חיפוש"
          onCtaPress={onRefresh}
        />
      </View>
    );
  }

  const selectedPartner = candidates.find((partner) => partner.id === selectedId);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: viewerOrigin.latitude,
          longitude: viewerOrigin.longitude,
          latitudeDelta: REGION_DELTA,
          longitudeDelta: REGION_DELTA,
        }}
        onPress={() => setSelectedId(null)}
      >
        {candidates.map((partner) => (
          <Marker
            key={partner.id}
            coordinate={partner.coords}
            onPress={(event) => {
              event.stopPropagation();
              setSelectedId(partner.id);
            }}
          >
            <View style={[styles.pin, selectedId === partner.id && styles.pinSelected]}>
              <Text style={styles.pinInitial}>{partner.name[0]}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedPartner && (
        <Card style={styles.previewCard}>
          <Pressable
            style={styles.previewClose}
            onPress={() => setSelectedId(null)}
            accessibilityLabel="סגור"
            hitSlop={8} // Extends the 32px visual icon to a 48px effective touch target
          >
            <X color={theme.colors.textSecondary} size={18} strokeWidth={2} />
          </Pressable>
          <Text style={styles.previewName}>
            {selectedPartner.name}, {selectedPartner.age}
          </Text>
          <View style={styles.previewDistanceRow}>
            <MapPin color={theme.colors.textTertiary} size={14} strokeWidth={2} />
            <Text style={styles.previewDistanceText}>{selectedPartner.distanceKm.toFixed(1)} ק"מ ממך</Text>
          </View>
          <Text style={styles.previewBio} numberOfLines={2}>
            {selectedPartner.bio}
          </Text>
          <Button
            label="צפה בפרופיל"
            variant="primary"
            onPress={() =>
              router.push({
                pathname: '/partner-profile',
                params: {
                  partnerId: selectedPartner.id,
                  distanceKm: String(selectedPartner.distanceKm.toFixed(1)),
                },
              })
            }
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pin: {
    // Map pins are exempt from the app's usual 48px touch-target minimum —
    // matches standard map UX (Google/Apple Maps pins are smaller too),
    // and users already expect precision tapping when zoomed into a map.
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinSelected: {
    borderColor: theme.colors.magenta,
  },
  pinInitial: {
    fontSize: 14,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.cyan,
  },
  previewCard: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  previewClose: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.xs,
  },
  previewDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  previewDistanceText: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
  },
  previewBio: {
    fontSize: 13,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
});
