import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { Camera, X } from 'lucide-react-native';
import { POST_ACTIVITIES } from '@constants/community';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { theme } from '@styles/theme';
import { visualLeft } from '@lib/rtl';

interface ComposeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    {visible && <ComposeContent onClose={onClose} />}
  </Modal>
);

const ComposeContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const addPost = useCommunityStore((state) => state.addPost);
  const [text, setText] = useState('');
  const [activity, setActivity] = useState(POST_ACTIVITIES[0]);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('נדרשת הרשאת גישה לתמונות כדי לצרף תמונה');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled || result.assets.length === 0) return;

      // The picker's uri is a transient cache path — copy it into the app's
      // document directory so the photo survives restarts (same as the avatar).
      const picked = new File(result.assets[0].uri);
      const destination = new File(Paths.document, `post-${new Date().getTime()}${picked.extension}`);
      await picked.copy(destination);
      setImageUri(destination.uri);
    } catch {
      setError('לא הצלחנו לצרף את התמונה, נסה שוב');
    }
  };

  const canPost = text.trim().length > 0;

  const publish = () => {
    if (!canPost) return;
    addPost({ text: text.trim(), activity, imageUri });
    onClose();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="סגור" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>איך היה האימון היום?</Text>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="ספר לקהילה על האימון, שיא חדש או שותף שעזר לך"
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={280}
          textAlignVertical="top"
        />

        {imageUri && (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <Pressable style={styles.removeImage} onPress={() => setImageUri(undefined)} accessibilityLabel="הסר תמונה">
              <X color={theme.colors.text} size={16} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        <View style={styles.chipsRow}>
          {POST_ACTIVITIES.map((item) => (
            <Pressable
              key={item}
              style={[styles.chip, activity === item && styles.chipActive]}
              onPress={() => setActivity(item)}
              accessibilityState={{ selected: activity === item }}
            >
              <Text style={[styles.chipText, activity === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Pressable
            style={[styles.publish, !canPost && styles.publishDisabled]}
            onPress={publish}
            disabled={!canPost}
            accessibilityRole="button"
          >
            <Text style={[styles.publishText, !canPost && styles.publishTextDisabled]}>פרסם</Text>
          </Pressable>
          <Pressable style={styles.cameraButton} onPress={pickImage} accessibilityLabel="צרף תמונה">
            <Camera color={theme.colors.text} size={22} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl * 1.5,
    borderTopRightRadius: theme.borderRadius.xl * 1.5,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    marginBottom: theme.spacing.lg,
  },
  title: {
    width: '100%',
    fontSize: 22,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  input: {
    minHeight: 110,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: 16,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  previewWrap: {
    marginBottom: theme.spacing.md,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surfaceHover,
  },
  removeImage: {
    position: 'absolute',
    top: theme.spacing.sm,
    ...visualLeft(theme.spacing.sm),
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(5,5,5,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
  },
  chipActive: {
    backgroundColor: theme.colors.cyan,
  },
  chipText: {
    fontSize: 15,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.black,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
  },
  error: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.magenta,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  publish: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.magenta,
    borderRadius: theme.borderRadius.full,
  },
  publishDisabled: {
    backgroundColor: theme.colors.surfaceHover,
  },
  publishText: {
    fontSize: 17,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
  publishTextDisabled: {
    color: theme.colors.textTertiary,
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
