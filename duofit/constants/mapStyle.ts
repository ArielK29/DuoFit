// Google Maps dark-mode JSON style, per 04-DARK-MODE.md (no light-mode map
// tiles anywhere in the app). Passed to <MapView customMapStyle>.
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#171717' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#050505' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A8A8A8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#F5F5F5' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8C8C8C' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#14301F' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#3A3A3A' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#A8A8A8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#555555' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2A2A2A' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0B2A3D' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#00E5FF' }],
  },
];
