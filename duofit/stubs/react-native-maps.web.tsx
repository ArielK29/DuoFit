// @ts-nocheck - web-only stand-in, see metro.config.js
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';

// The real map is native-only. In the browser preview show a placeholder.
const MapView = forwardRef(function MapView({ style, onMapReady, onMapLoaded }, ref) {
  useImperativeHandle(ref, () => ({ animateToRegion: () => {} }));
  // Report the placeholder as loaded so the "map failed to load" message does not cover it.
  useEffect(() => {
    onMapReady?.();
    onMapLoaded?.();
  }, []);
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#14301F' }, style]}>
      <Text style={{ color: '#F5F5F5', fontSize: 14, textAlign: 'center', padding: 16 }}>
        המפה זמינה באפליקציה בטלפון (בדפדפן זו תצוגה מקדימה בלבד)
      </Text>
    </View>
  );
});

export const Marker = () => null;
export const UrlTile = () => null;
export default MapView;
