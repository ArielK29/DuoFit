import { useWindowDimensions } from 'react-native';

// Phones this narrow (iPhone SE / mini, small Androids) get tighter layouts.
export const SMALL_PHONE_WIDTH = 380;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  return { width, height, isSmall: width <= SMALL_PHONE_WIDTH };
}
