const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web preview only: these libraries are native-only (they crash the browser
// build at import time), so the browser gets simple stand-ins from ./stubs.
// Phones (Android/iOS) are untouched and use the real libraries.
const webStubs = {
  'react-native-maps': path.resolve(__dirname, 'stubs/react-native-maps.web.tsx'),
  '@react-native-community/slider': path.resolve(__dirname, 'stubs/slider.web.tsx'),
  '@react-native-community/datetimepicker': path.resolve(__dirname, 'stubs/datetimepicker.web.tsx'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webStubs[moduleName]) {
    return { type: 'sourceFile', filePath: webStubs[moduleName] };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
