import * as FileSystem from 'expo-file-system/legacy';

const { documentDirectory } = FileSystem;
const PHOTOS_DIR = 'photos/';

async function ensurePhotosDirectory(): Promise<string | null> {
  if (!documentDirectory) return null;

  const photosPath = `${documentDirectory}${PHOTOS_DIR}`;
  try {
    const dirInfo = await FileSystem.getInfoAsync(photosPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosPath, { intermediates: true });
    }
  } catch (error) {
    if (__DEV__) console.error('Failed to create photos directory:', error);
    return null;
  }

  return photosPath;
}

/**
 * Persist a photo from a temporary URI to a permanent local path.
 * Returns the permanent URI, or the original tempUri if persistence fails.
 */
export async function persistPhotoLocally(
  tempUri: string,
  photoId: string
): Promise<string> {
  const photosPath = await ensurePhotosDirectory();

  if (!photosPath) {
    if (__DEV__) {
      console.warn('Document directory not available, using original URI');
    }
    return tempUri;
  }

  // Sanitize photoId to prevent path traversal
  const safeId = photoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeId}.jpg`;
  const permanentUri = `${photosPath}${filename}`;

  try {
    // Check if already persisted (idempotent)
    const existingInfo = await FileSystem.getInfoAsync(permanentUri);
    if (existingInfo.exists) {
      return permanentUri;
    }

    const fileInfo = await FileSystem.getInfoAsync(tempUri);
    if (!fileInfo.exists) {
      if (__DEV__) {
        console.warn('Source file does not exist:', tempUri);
      }
      return tempUri;
    }

    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
    return permanentUri;
  } catch (error) {
    if (__DEV__) console.error('Failed to persist photo locally:', error);
    return tempUri;
  }
}

/**
 * Delete a locally persisted photo.
 */
export async function deleteLocalPhoto(photoId: string): Promise<void> {
  const photosPath = await ensurePhotosDirectory();
  if (!photosPath) return;

  const safeId = photoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `${photosPath}${safeId}.jpg`;

  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (error) {
    if (__DEV__) console.warn('Failed to delete local photo:', error);
  }
}

/**
 * Get the total disk space used by locally stored photos (in bytes).
 */
export async function getLocalPhotoStorageSize(): Promise<number> {
  const photosPath = await ensurePhotosDirectory();
  if (!photosPath) return 0;

  try {
    const files = await FileSystem.readDirectoryAsync(photosPath);
    let totalSize = 0;
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${photosPath}${file}`);
      if (info.exists && 'size' in info && typeof info.size === 'number') {
        totalSize += info.size;
      }
    }
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Clear all locally cached photos. Cloud-stored photos are unaffected.
 */
export async function clearLocalPhotoCache(): Promise<number> {
  const photosPath = await ensurePhotosDirectory();
  if (!photosPath) return 0;

  try {
    const files = await FileSystem.readDirectoryAsync(photosPath);
    let deleted = 0;
    for (const file of files) {
      try {
        await FileSystem.deleteAsync(`${photosPath}${file}`, { idempotent: true });
        deleted++;
      } catch {
        // Best-effort cleanup
      }
    }
    return deleted;
  } catch {
    return 0;
  }
}
