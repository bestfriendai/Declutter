/**
 * Cloud Storage Service
 * Handles photo uploads and downloads with Firebase Storage
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { firebaseStorage, isFirebaseConfigured } from '@/config/firebase';
import { getCurrentUser } from './auth';
import * as FileSystem from 'expo-file-system';

// Type assertion for FileSystem constants that may have incomplete types
const { cacheDirectory, documentDirectory, downloadAsync } = FileSystem as typeof FileSystem & {
  cacheDirectory: string | null;
  documentDirectory: string | null;
};
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Upload progress callback type
type ProgressCallback = (progress: number) => void;

// Maximum image dimensions for optimization
const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.8;

// Get storage reference for user photos
function getUserPhotosRef(roomId: string, photoId: string): StorageReference {
  const user = getCurrentUser();
  if (!user) throw new Error('No user signed in');
  return ref(firebaseStorage, `users/${user.uid}/rooms/${roomId}/${photoId}.jpg`);
}

// Optimize image before upload
async function optimizeImage(localUri: string): Promise<string> {
  try {
    const result = await manipulateAsync(
      localUri,
      [{ resize: { width: MAX_IMAGE_DIMENSION } }],
      { compress: IMAGE_QUALITY, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.warn('Image optimization failed, using original:', error);
    return localUri;
  }
}

// Convert local URI to blob for upload
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

// Upload a photo to cloud storage
export async function uploadPhoto(
  localUri: string,
  roomId: string,
  photoId: string,
  onProgress?: ProgressCallback
): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, skipping upload');
    return null;
  }

  const user = getCurrentUser();
  if (!user) {
    console.log('No user signed in, skipping upload');
    return null;
  }

  try {
    // Optimize image first
    const optimizedUri = await optimizeImage(localUri);

    // Convert to blob
    const blob = await uriToBlob(optimizedUri);

    // Get storage reference
    const storageRef = getUserPhotosRef(roomId, photoId);

    if (onProgress) {
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      // Simple upload without progress
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
}

// Upload multiple photos with batch progress
export async function uploadPhotos(
  photos: Array<{ localUri: string; roomId: string; photoId: string }>,
  onProgress?: (current: number, total: number, percent: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const total = photos.length;

  for (let i = 0; i < photos.length; i++) {
    const { localUri, roomId, photoId } = photos[i];

    const downloadUrl = await uploadPhoto(
      localUri,
      roomId,
      photoId,
      (percent) => {
        if (onProgress) {
          const overallPercent = ((i + percent / 100) / total) * 100;
          onProgress(i + 1, total, overallPercent);
        }
      }
    );

    if (downloadUrl) {
      results.set(photoId, downloadUrl);
    }
  }

  return results;
}

// Download a photo to local cache
export async function downloadPhoto(
  remoteUrl: string,
  localPath?: string
): Promise<string | null> {
  try {
    const cacheDir = cacheDirectory;
    if (!cacheDir) {
      console.error('Cache directory not available');
      return null;
    }

    const fileName = localPath || `photo_${Date.now()}.jpg`;
    const localUri = `${cacheDir}${fileName}`;

    const downloadResult = await downloadAsync(remoteUrl, localUri);

    if (downloadResult.status === 200) {
      return downloadResult.uri;
    }

    return null;
  } catch (error) {
    console.error('Error downloading photo:', error);
    return null;
  }
}

// Delete a photo from cloud storage
export async function deletePhoto(roomId: string, photoId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  const user = getCurrentUser();
  if (!user) return false;

  try {
    const storageRef = getUserPhotosRef(roomId, photoId);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
}

// Delete all photos for a room
export async function deleteRoomPhotos(roomId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  const user = getCurrentUser();
  if (!user) return false;

  try {
    const roomRef = ref(firebaseStorage, `users/${user.uid}/rooms/${roomId}`);
    const listResult = await listAll(roomRef);

    // Delete all items
    await Promise.all(listResult.items.map(item => deleteObject(item)));

    return true;
  } catch (error) {
    console.error('Error deleting room photos:', error);
    return false;
  }
}

// Get download URL for an existing photo
export async function getPhotoUrl(roomId: string, photoId: string): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const storageRef = getUserPhotosRef(roomId, photoId);
    return getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return null;
  }
}

// Check if a photo exists in cloud storage
export async function photoExists(roomId: string, photoId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const url = await getPhotoUrl(roomId, photoId);
    return url !== null;
  } catch {
    return false;
  }
}

// Get total storage used by user (in bytes)
export async function getUserStorageUsage(): Promise<number> {
  if (!isFirebaseConfigured()) return 0;

  const user = getCurrentUser();
  if (!user) return 0;

  try {
    const userRef = ref(firebaseStorage, `users/${user.uid}`);
    const listResult = await listAll(userRef);

    // Note: This is a simplified version - Firebase Storage doesn't provide
    // direct size info via listAll. In production, you'd track this in Firestore.
    return listResult.items.length * 500000; // Estimate ~500KB per photo
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return 0;
  }
}

// Upload avatar/profile photo
export async function uploadAvatar(
  localUri: string,
  onProgress?: ProgressCallback
): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    // Optimize and resize for avatar (smaller)
    const optimized = await manipulateAsync(
      localUri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );

    const blob = await uriToBlob(optimized.uri);
    const storageRef = ref(firebaseStorage, `users/${user.uid}/avatar.jpg`);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          reject,
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

// Delete avatar
export async function deleteAvatar(): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  const user = getCurrentUser();
  if (!user) return false;

  try {
    const storageRef = ref(firebaseStorage, `users/${user.uid}/avatar.jpg`);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }
}

// Get avatar URL
export async function getAvatarUrl(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const storageRef = ref(firebaseStorage, `users/${user.uid}/avatar.jpg`);
    return getDownloadURL(storageRef);
  } catch (error) {
    // Avatar doesn't exist
    return null;
  }
}
