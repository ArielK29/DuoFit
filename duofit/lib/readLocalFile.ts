import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { assertLooksLikeImage } from './imageBytes.ts';

// The bytes of a picture the member picked (a file the picker copied into the app's folder). `fetch(file://...).arrayBuffer()` is not
// reliable on Android (it returned a few bytes instead of the photo), so the phone reads the file itself; the browser has no such file.
export async function readPickedImage(localUri: string): Promise<ArrayBuffer> {
  const bytes = Platform.OS === 'web' ? await (await fetch(localUri)).arrayBuffer() : await new File(localUri).arrayBuffer();
  assertLooksLikeImage(bytes);
  return bytes;
}
