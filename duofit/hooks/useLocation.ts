import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationState {
  status: LocationPermissionStatus;
  coords: Coordinates | null;
  error: string | null;
  requestPermission: () => Promise<void>;
}

export function useLocation(): LocationState {
  const [status, setStatus] = useState<LocationPermissionStatus>('undetermined');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    setError(null);
    const { status: permission } = await Location.requestForegroundPermissionsAsync();

    if (permission !== 'granted') {
      setStatus('denied');
      return;
    }

    setStatus('granted');

    try {
      const position = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      // Device has no location fix available (e.g. simulator without a mocked
      // location) — matching still works using distances derived from mock
      // partner data, so this isn't surfaced as a blocking error.
      setError('לא הצלחנו לאתר את המיקום שלך');
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return { status, coords, error, requestPermission };
}
