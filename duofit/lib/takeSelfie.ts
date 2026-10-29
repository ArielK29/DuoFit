import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

export type SelfieResult = { uri: string } | 'denied' | null;

// Opens the FRONT camera for a live selfie (the gallery is not offered, so it cannot be an old photo).
// Returns 'denied' when the camera permission was refused, null when the member cancelled.
export async function takeSelfie(): Promise<SelfieResult> {
  if (Platform.OS === 'web') {
    // Browser preview only: there is no camera picker on the web, use a file instead.
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    return picked.canceled || picked.assets.length === 0 ? null : { uri: picked.assets[0].uri };
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return 'denied';

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    cameraType: ImagePicker.CameraType.front,
    quality: 0.6,
    allowsEditing: false,
  });
  if (result.canceled || result.assets.length === 0) return null;

  // Copy out of the transient cache so the picture survives while the member checks it.
  const taken = new File(result.assets[0].uri);
  const destination = new File(Paths.document, `selfie-${Date.now()}${taken.extension || '.jpg'}`);
  await taken.copy(destination);
  return { uri: destination.uri };
}

// Removes a local selfie copy (best effort).
export function discardSelfie(uri: string | undefined): void {
  if (!uri || Platform.OS === 'web') return;
  try {
    new File(uri).delete();
  } catch {
    // already gone
  }
}
