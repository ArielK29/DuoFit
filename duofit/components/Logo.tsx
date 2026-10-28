import React from 'react';
import { Image } from 'expo-image';

interface LogoProps {
  width?: number;
}

// Full FitFriend logo (emblem + wordmark + tagline) on a transparent background, 780x645.
const LOGO_ASPECT_RATIO = 780 / 645;

export const Logo: React.FC<LogoProps> = ({ width = 260 }) => {
  return (
    <Image
      source={require('../assets/images/fitfriend-logo-full.png')}
      style={{ width, aspectRatio: LOGO_ASPECT_RATIO }}
      contentFit="contain"
      accessibilityLabel="FitFriend"
    />
  );
};
