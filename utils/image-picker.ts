import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

const BUCKET = 'item-images';

/**
 * Request media library permissions (needed for launchImageLibraryAsync on iOS).
 * Returns true if granted.
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Precisamos de acesso à galeria para selecionar imagens dos seus itens.'
    );
    return false;
  }
  return true;
}

/**
 * Launch the image library picker, returning the selected asset or null if cancelled.
 */
export async function pickImageFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  // On iOS, media library permission is needed
  if (Platform.OS === 'ios') {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0];
}

/**
 * Upload an image (from URI) to Supabase Storage.
 * Returns the public URL of the uploaded image, or null if upload failed.
 *
 * Images are stored under: item-images/{userId}/{timestamp}.{ext}
 */
export async function uploadItemImage(
  uri: string,
  mimeType?: string
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para enviar imagens.');
      return null;
    }

    // Determine file extension from the mimeType or URI
    const mime = mimeType || 'image/jpeg';
    const ext = mime.split('/')[1] || 'jpeg';
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    // Fetch the image data from the URI
    let fileBody: Blob | ArrayBuffer;
    const response = await fetch(uri);

    if (Platform.OS === 'web') {
      fileBody = await response.blob();
    } else {
      fileBody = await response.arrayBuffer();
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, fileBody, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      Alert.alert('Erro ao enviar imagem', uploadError.message);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err: any) {
    console.error('Image upload failed:', err);
    Alert.alert('Erro ao enviar imagem', err.message || 'Tente novamente.');
    return null;
  }
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteItemImage(publicUrl: string): Promise<boolean> {
  try {
    // Extract the path from the public URL
    // URL format: https://{ref}.supabase.co/storage/v1/object/public/item-images/{path}
    const match = publicUrl.match(/\/item-images\/(.+)$/);
    if (!match) return false;

    const filePath = match[1];
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Image delete failed:', err);
    return false;
  }
}
