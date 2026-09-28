import React from 'react';
import { Image } from 'expo-image';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 160 }) => {
  return (
    <Image
      source={require('../assets/images/duofit-logo.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
};
