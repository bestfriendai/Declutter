import * as FileSystem from 'expo-file-system/legacy';

const { documentDirectory } = FileSystem;
const PHOTOS_DIR = 'photos/';

async function ensurePhotosDirectory(): Promise<string | null> {
  if (!documentDirectory) return null;

  const photosPath = `${documentDirectory}${PHOTOS_DIR}`;
  const dirInfo = await FileSystem.getInfoAsync(photosPath);

  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(photosPath, { intermediates: true });
  }

  return photosPath;
}

export async function persistPhotoLocally(
  tempUri: string,
  photoId: string
): Promise<string> {
  const photosPath = await ensurePhotosDirectory();

  if (!photosPath) {
    console.warn('Document directory not available, using original URI');
    return tempUri;
  }

  const filename = `${photoId}.jpg`;
  const permanentUri = `${photosPath}${filename}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(tempUri);
    if (!fileInfo.exists) {
      console.warn('Source file does not exist:', tempUri);
      return tempUri;
    }

    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
    return permanentUri;
  } catch (error) {
    console.error('Failed to persist photo locally:', error);
    return tempUri;
  }
}
