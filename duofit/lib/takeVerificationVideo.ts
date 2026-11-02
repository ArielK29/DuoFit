import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

// The identity check is a few seconds of live video: harder to fake than a photo, and the member cannot pick an old file.
export const MAX_VIDEO_SECONDS = 5;

export type VideoResult = { uri: string; contentType: string; extension: 'mp4' | 'mov' } | 'denied' | null;

function describe(uri: string): { contentType: string; extension: 'mp4' | 'mov' } {
  return /\.mov($|\?)/i.test(uri) ? { contentType: 'video/quicktime', extension: 'mov' } : { contentType: 'video/mp4', extension: 'mp4' };
}

// Opens the FRONT camera in video mode (the gallery is not offered). Returns 'denied' when the camera or microphone permission was
// refused, null when the member cancelled.
export async function recordVerificationVideo(): Promise<VideoResult> {
  if (Platform.OS === 'web') {
    // Browser preview only: there is no camera picker on the web, use a file instead.
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.6 });
    if (picked.canceled || picked.assets.length === 0) return null;
    return { uri: picked.assets[0].uri, ...describe(picked.assets[0].uri) };
  }

  const camera = await ImagePicker.requestCameraPermissionsAsync();
  if (!camera.granted) return 'denied';
  // The phone's camera screen records the sound together with the picture and asks for the microphone itself.

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    cameraType: ImagePicker.CameraType.front,
    videoMaxDuration: MAX_VIDEO_SECONDS,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Low,
    allowsEditing: false,
  });
  if (result.canceled || result.assets.length === 0) return null;

  // Copy out of the transient cache so the clip survives while the member checks it.
  const taken = new File(result.assets[0].uri);
  const info = describe(result.assets[0].uri);
  const destination = new File(Paths.document, `verify-${Date.now()}.${info.extension}`);
  await taken.copy(destination);
  return { uri: destination.uri, ...info };
}

// Removes a local copy (best effort).
export function discardLocalFile(uri: string | undefined): void {
  if (!uri || Platform.OS === 'web') return;
  try {
    new File(uri).delete();
  } catch {
    // already gone
  }
}
