import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

// Opens the photo library and returns a durable local URI (or null if cancelled).
//
// Expo: "No permissions request is necessary for launching the image library"
// (iOS PHPicker / Android photo picker). Gating the picker on a permission request
// is what used to stop the gallery from opening when access was limited/denied.
export async function pickImage(prefix: string, options: { square?: boolean } = {}): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    ...(options.square ? { allowsEditing: true, aspect: [1, 1] as [number, number] } : {}),
  });
  if (result.canceled || result.assets.length === 0) return null;

  const uri = result.assets[0].uri;
  // The picker's uri points to a transient cache location; copy it into the app's
  // document directory so it survives restarts. The browser has no such folder.
  if (Platform.OS === 'web') return uri;
  const picked = new File(uri);
  const destination = new File(Paths.document, `${prefix}-${Date.now()}${picked.extension}`);
  await picked.copy(destination);
  return destination.uri;
}
