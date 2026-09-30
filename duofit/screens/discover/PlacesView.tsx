import React, { useRef } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { CalendarPlus } from 'lucide-react-native';
import { PLACES, Place } from '@constants/places';
import { darkMapStyle } from '@constants/mapStyle';
import { distanceKm } from '@hooks/usePartnerMatching';
import type { Coordinates } from '@hooks/useLocation';
import { theme } from '@styles/theme';

const REGION_DELTA = 0.07;

interface PlacesViewProps {
  origin: Coordinates;
}

// "מקומות" view per the FitMatch reference: a map of numbered pins (people
// training there right now) and a list of the venues. Venue names are real;
// the counts are example numbers (no live check-ins yet) and there are no
// promotions — DuoFit has no agreement with any of these businesses.
export const PlacesView: React.FC<PlacesViewProps> = ({ origin }) => {
  const mapRef = useRef<MapView>(null);

  const focusPlace = (place: Place) => {
    mapRef.current?.animateToRegion(
      { ...place.coords, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      400
    );
  };

  return (
    <View>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          customMapStyle={darkMapStyle}
          showsUserLocation
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: REGION_DELTA,
            longitudeDelta: REGION_DELTA,
          }}
        >
          {PLACES.map((place) => (
            <Marker key={place.id} coordinate={place.coords} onPress={() => focusPlace(place)}>
              <View style={[styles.pin, { backgroundColor: place.color }]}>
                <Text style={styles.pinText}>{place.trainingNow}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
        <View style={styles.caption} pointerEvents="none">
          <Text style={styles.captionText}>מספר = מתאמני DuoFit שם עכשיו (לדוגמה)</Text>
        </View>
      </View>

      {PLACES.map((place) => {
        const Icon = place.icon;
        const distance = distanceKm(origin, place.coords);
        return (
          <Pressable key={place.id} style={styles.card} onPress={() => focusPlace(place)}>
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

const styles = StyleSheet.create({
  mapWrap: {
    height: 300,
    borderRadius: theme.borderRadius.xl * 1.5,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  map: {
    flex: 1,
  },
  pin: {
    width: 40,
    height: 40,
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
  caption: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
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
