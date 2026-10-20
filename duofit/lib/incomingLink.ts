import { useSyncExternalStore } from 'react';
import { Linking as ReactNativeLinking, Platform } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { createLinkStore } from '@lib/linkStore';

// The link that opened the app or arrived while it was running (the "reset password" and "confirm e-mail" links). It is captured at
// app start, not inside the screen: the router opens the screen only after the link event, and Expo's newer
// `useLinkingURL` hook returns nothing on Android Expo Go, where the older React Native API is the one that delivers the address.
const store = createLinkStore();
let started = false;

export function startLinkCapture(): void {
  if (started || Platform.OS === 'web') return;
  started = true;
  ReactNativeLinking.addEventListener('url', ({ url }) => store.set(url));
  ReactNativeLinking.getInitialURL().then((url) => {
    if (url) store.set(url);
  }).catch(() => {});
  try {
    const first = ExpoLinking.getLinkingURL();
    if (first) store.set(first);
  } catch {
    // an older runtime without this call: the two paths above cover it
  }
}

// Called once a link has been used, so opening the screen again later never replays an old one-time link.
export const clearIncomingLink = (): void => store.clear();

export function useIncomingLink(): string | null {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
