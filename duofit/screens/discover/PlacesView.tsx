import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert, Linking, Platform, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { CalendarPlus, MapPinOff, Zap } from 'lucide-react-native';
import { PLACES, Place } from '@constants/places';
import { darkMapStyle } from '@constants/mapStyle';
import { PartnerWithDistance, distanceKm } from '@hooks/usePartnerMatching';
import { Coordinates, useLocation } from '@hooks/useLocation';
import { getActivityStyle } from '@lib/activityStyles';
import { visualLeft, visualRight, visualRightText } from '@lib/rtl';
import { theme } from '@styles/theme';

const REGION_DELTA = 0.07;
const MAP_LOAD_TIMEOUT_MS = 10000;
// Backup base map, used only if Google's tiles never load on this device. Dark
// OpenStreetMap tiles from CARTO (free for development and light use; a
// production release needs a tile provider plan and the attribution below).
const FALLBACK_TILE_URL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const FALLBACK_PROBE_URL = 'https://basemaps.cartocdn.com/dark_all/0/0/0.png';

async function canReach(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
// Partners are people, not businesses: their pins are snapped to a ~500 m grid
// so the map never shows anyone's exact position.
const APPROXIMATE_GRID_DEGREES = 0.005;

function approximate(coords: Coordinates): Coordinates {
  const snap = (value: number) => Math.round(value / APPROXIMATE_GRID_DEGREES) * APPROXIMATE_GRID_DEGREES;
  return { latitude: snap(coords.latitude), longitude: snap(coords.longitude) };
}

interface PlacesViewProps {
  origin: Coordinates;
  partners: PartnerWithDistance[];
  onOpenPartner: (partner: PartnerWithDistance) => void;
  onInvitePartner: (partner: PartnerWithDistance) => void;
}

// Map view of Discover: partner pins (tap for a preview, then profile or an
// invite), numbered venue pins, and the list of venues. Venue names are real;
// the counts are example numbers (no live check-ins yet) and there are no
// promotions — DuoFit has no agreement with any of these businesses.
export const PlacesView: React.FC<PlacesViewProps> = ({ origin, partners, onOpenPartner, onInvitePartner }) => {
  const mapRef = useRef<MapView>(null);
  const { status } = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Partner pins and venue pins sit close together in central Tel Aviv, so each
  // layer can be hidden to keep the map readable.
  const [showPartners, setShowPartners] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [internetOk, setInternetOk] = useState<boolean | null>(null);
  const [fallback, setFallback] = useState(false);

  // If Google's tiles never arrive, find out why: no internet at all, or only
  // the map service is unreachable. In the second case switch once to the
  // backup tiles; either way show a plain message instead of a black box.
  useEffect(() => {
    if (mapLoaded) return;
    const timeout = setTimeout(async () => {
      setLoadFailed(true);
      const online = await canReach(FALLBACK_PROBE_URL);
      setInternetOk(online);
      if (online && !fallback) {
        setMapReady(false);
        setFallback(true);
      }
    }, MAP_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [mapLoaded, fallback]);

  const showLoadMessage = loadFailed && !mapLoaded && !(fallback && mapReady);
  const loadMessage =
    internetOk === false
      ? 'אין חיבור לאינטרנט בטלפון, והמפה צריכה אינטרנט'
      : `המפה לא נטענה (${mapReady ? 'המפה התחילה אבל האריחים לא הגיעו' : 'המפה לא התחילה'})`;

  const selected = showPartners ? partners.find((partner) => partner.id === selectedId) : undefined;

  const focusPlace = (place: Place) => {
    setSelectedId(null);
    mapRef.current?.animateToRegion(
      { ...place.coords, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      400
    );
  };

  return (
    <View>
      {status === 'denied' && (
        <View style={styles.permissionBanner}>
          <MapPinOff color={theme.colors.warning} size={20} strokeWidth={2} />
          <Text style={styles.permissionText}>המיקום שלך כבוי, אז המרחקים נמדדים ממרכז תל אביב</Text>
          <Pressable style={styles.permissionButton} onPress={() => Linking.openSettings()} accessibilityRole="button">
            <Text style={styles.permissionButtonText}>פתח הגדרות</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.layerRow}>
        <LayerChip label="שותפים" active={showPartners} onPress={() => setShowPartners((value) => !value)} />
        <LayerChip label="מקומות" active={showPlaces} onPress={() => setShowPlaces((value) => !value)} />
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          key={fallback ? 'fallback' : 'google'}
          mapType={fallback ? 'none' : 'standard'}
          customMapStyle={fallback ? undefined : darkMapStyle}
          onMapReady={() => setMapReady(true)}
          showsUserLocation={status === 'granted'}
          onPress={() => setSelectedId(null)}
          loadingEnabled
          loadingIndicatorColor={theme.colors.cyan}
          loadingBackgroundColor={theme.colors.surface}
          onMapLoaded={() => {
            setMapLoaded(true);
            setLoadFailed(false);
          }}
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: REGION_DELTA,
            longitudeDelta: REGION_DELTA,
          }}
        >
          {fallback && <UrlTile urlTemplate={FALLBACK_TILE_URL} maximumZ={19} tileSize={256} zIndex={-1} />}
          {showPlaces &&
            PLACES.map((place) => (
            <Marker key={place.id} coordinate={place.coords} onPress={() => focusPlace(place)}>
              <View style={[styles.pin, { backgroundColor: place.color }]}>
                <Text style={styles.pinText}>{place.trainingNow}</Text>
              </View>
            </Marker>
          ))}
          {showPartners &&
            partners.map((partner) => {
            const active = partner.id === selectedId;
            return (
              <Marker
                key={partner.id}
                coordinate={approximate(partner.coords)}
                onPress={() => setSelectedId(partner.id)}
                zIndex={active ? 10 : 5}
              >
                <View style={[styles.partnerPin, active && styles.partnerPinActive]}>
                  <Text style={styles.partnerPinText}>{partner.name[0]}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {showLoadMessage && (
          <View style={styles.loadFailed} pointerEvents="none">
            <Text style={styles.loadFailedText}>{loadMessage}</Text>
          </View>
        )}
        {fallback && (
          <View style={styles.attribution} pointerEvents="none">
            <Text style={styles.attributionText}>© OpenStreetMap · © CARTO</Text>
          </View>
        )}
        {showPartners && partners.length === 0 && (
          <View style={styles.emptyOverlay} pointerEvents="none">
            <Text style={styles.emptyText}>אין שותפים קרובים לפי הסינון</Text>
          </View>
        )}
        <View style={styles.caption} pointerEvents="none">
          <Text style={styles.captionText}>מספר = מתאמני DuoFit שם עכשיו (לדוגמה)</Text>
        </View>
      </View>

      {selected ? (
        <PartnerPreview
          partner={selected}
          onOpen={() => onOpenPartner(selected)}
          onInvite={() => onInvitePartner(selected)}
        />
      ) : (
        <Text style={styles.hint}>עיגול עם אות = שותף קרוב (מיקום מוצג בקירוב). לחץ עליו לתצוגה מקדימה</Text>
      )}

      {PLACES.map((place) => {
        const Icon = place.icon;
        const distance = distanceKm(origin, place.coords);
        return (
          <Pressable
            key={place.id}
            style={styles.card}
            onPress={() => focusPlace(place)}
            accessibilityRole="button"
            accessibilityLabel={`${place.name}, ${place.type}, ${distance.toFixed(1)} ק"מ, ${place.trainingNow} מתאמנים עכשיו`}
          >
            <Pressable
              style={styles.calendarButton}
              onPress={() => Alert.alert('בקרוב', 'תזמון אימון במקום מסוים יהיה זמין בקרוב')}
              accessibilityLabel={`תזמן אימון ב${place.name}`}
            >
              <CalendarPlus color={theme.colors.textSecondary} size={20} strokeWidth={2} />
            </Pressable>
            <View style={styles.cardText}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeMeta}>{`${place.type} · ${distance.toFixed(1)} ק"מ`}</Text>
              <Text style={styles.placeNow}>{place.trainingNow} מתאמנים עכשיו</Text>
            </View>
            <View style={[styles.iconTile, { backgroundColor: place.color }]}>
              <Icon color={theme.colors.black} size={24} strokeWidth={2} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const LayerChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
  <Pressable
    style={[styles.layerChip, active && styles.layerChipActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    accessibilityLabel={`${active ? 'הסתר' : 'הצג'} ${label} במפה`}
  >
    <Text style={[styles.layerChipText, active && styles.layerChipTextActive]}>{label}</Text>
  </Pressable>
);

interface PartnerPreviewProps {
  partner: PartnerWithDistance;
  onOpen: () => void;
  onInvite: () => void;
}

const PartnerPreview: React.FC<PartnerPreviewProps> = ({ partner, onOpen, onInvite }) => {
  const { icon: ActivityIcon } = getActivityStyle(partner.activities[0]);

  return (
    <View style={styles.preview}>
      <Pressable style={styles.previewMain} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`פרופיל של ${partner.name}`}>
        <View style={styles.previewAvatar}>
          <Text style={styles.previewAvatarText}>{partner.name[0]}</Text>
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewName}>{`${partner.name}, ${partner.age}`}</Text>
          <View style={styles.previewMetaRow}>
            <ActivityIcon color={theme.colors.textSecondary} size={14} strokeWidth={2} />
            <Text style={styles.previewMeta}>{`${partner.activities.join(' · ')} · ${partner.distanceKm.toFixed(1)} ק"מ`}</Text>
          </View>
          <Text style={styles.previewMatch}>{`${partner.matchPercent}% התאמה`}</Text>
        </View>
      </Pressable>
      <Pressable style={styles.inviteButton} onPress={onInvite} accessibilityRole="button" accessibilityLabel={`הזמן את ${partner.name} לאימון`}>
        <Zap color={theme.colors.black} size={18} strokeWidth={2} />
        <Text style={styles.inviteText}>הזמן</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  permissionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
  },
  permissionButton: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
  },
  permissionButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  layerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  layerChip: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
  },
  layerChipActive: {
    backgroundColor: theme.colors.cyan,
    borderColor: theme.colors.cyan,
  },
  layerChipText: {
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  layerChipTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  mapWrap: {
    height: 300,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    // Known react-native-maps bug on Android: a parent with borderRadius +
    // overflow: 'hidden' makes the map render blank (only the Google logo
    // shows). Rounded corners are therefore iOS-only.
    ...Platform.select({
      ios: { borderRadius: theme.borderRadius.xl * 1.5, overflow: 'hidden' as const },
      default: {},
    }),
  },
  map: {
    flex: 1,
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.full,
    borderWidth: 3,
    borderColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinText: {
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
  partnerPin: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 2,
    borderColor: theme.colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerPinActive: {
    width: 38,
    height: 38,
    backgroundColor: theme.colors.magenta,
    borderColor: theme.colors.text,
    borderWidth: 3,
  },
  partnerPinText: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  loadFailed: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  attribution: {
    position: 'absolute',
    bottom: theme.spacing.xs,
    ...visualLeft(theme.spacing.sm),
  },
  attributionText: {
    fontSize: 10,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  loadFailedText: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    overflow: 'hidden',
  },
  caption: {
    position: 'absolute',
    bottom: theme.spacing.md,
    ...visualRight(theme.spacing.md),
    backgroundColor: theme.colors.text,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  captionText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.black,
  },
  hint: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    ...visualRightText,
    marginBottom: theme.spacing.md,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  previewMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 56,
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarText: {
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.black,
  },
  previewText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  previewName: {
    fontSize: 17,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  previewMeta: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  previewMatch: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.cyan,
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
  },
  inviteText: {
    fontSize: 15,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  placeName: {
    fontSize: 16,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
  },
  placeMeta: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
  placeNow: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.cyan,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
