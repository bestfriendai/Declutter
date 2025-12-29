/**
 * Firestore Service
 * Handles cloud data storage and sync for rooms, tasks, and user data
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { firebaseDb, isFirebaseConfigured } from '@/config/firebase';
import { getCurrentUser } from './auth';
import {
  Room,
  UserProfile,
  UserStats,
  AppSettings,
  Mascot,
  CollectedItem,
  CollectionStats,
  CleaningTask,
  Badge,
  PhotoCapture,
} from '@/types/declutter';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  ROOMS: 'rooms',
  STATS: 'stats',
  SETTINGS: 'settings',
  MASCOTS: 'mascots',
  COLLECTIONS: 'collections',
  COLLECTION_STATS: 'collectionStats',
  FOCUS_SESSIONS: 'focusSessions',
  ACTIVITIES: 'activities',
};

// Helper to convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
}

// Helper to convert Date to Firestore-safe format
function dateToTimestamp(date: Date | undefined): Timestamp | null {
  if (!date) return null;
  return Timestamp.fromDate(date);
}

// Helper to get user document reference
function getUserDocRef(collectionName: string) {
  const user = getCurrentUser();
  if (!user) throw new Error('No user signed in');
  return doc(firebaseDb, collectionName, user.uid);
}

// Helper to get subcollection reference
function getSubcollectionRef(collectionName: string, subcollection: string) {
  const user = getCurrentUser();
  if (!user) throw new Error('No user signed in');
  return collection(firebaseDb, collectionName, user.uid, subcollection);
}

// =====================
// USER PROFILE
// =====================

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    await setDoc(doc(firebaseDb, COLLECTIONS.USERS, user.uid), {
      ...profile,
      createdAt: dateToTimestamp(profile.createdAt),
      updatedAt: serverTimestamp(),
      firebaseUid: user.uid,
      email: user.email,
    });
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const docSnap = await getDoc(doc(firebaseDb, COLLECTIONS.USERS, user.uid));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      ...data,
      id: data.id || user.uid,
      createdAt: timestampToDate(data.createdAt),
    } as UserProfile;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

// =====================
// ROOMS
// =====================

export async function saveRoom(room: Room): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const roomData = {
      ...room,
      userId: user.uid,
      createdAt: dateToTimestamp(room.createdAt),
      lastAnalyzedAt: room.lastAnalyzedAt ? dateToTimestamp(room.lastAnalyzedAt) : null,
      updatedAt: serverTimestamp(),
      photos: room.photos.map(p => ({
        ...p,
        timestamp: dateToTimestamp(p.timestamp),
      })),
      tasks: room.tasks.map(t => ({
        ...t,
        completedAt: t.completedAt ? dateToTimestamp(t.completedAt) : null,
      })),
    };

    await setDoc(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'rooms', room.id),
      roomData
    );
  } catch (error) {
    console.error('Error saving room:', error);
    throw error;
  }
}

export async function saveAllRooms(rooms: Room[]): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const batch = writeBatch(firebaseDb);

    rooms.forEach(room => {
      const roomRef = doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'rooms', room.id);
      batch.set(roomRef, {
        ...room,
        userId: user.uid,
        createdAt: dateToTimestamp(room.createdAt),
        lastAnalyzedAt: room.lastAnalyzedAt ? dateToTimestamp(room.lastAnalyzedAt) : null,
        updatedAt: serverTimestamp(),
        photos: room.photos.map(p => ({
          ...p,
          timestamp: dateToTimestamp(p.timestamp),
        })),
        tasks: room.tasks.map(t => ({
          ...t,
          completedAt: t.completedAt ? dateToTimestamp(t.completedAt) : null,
        })),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving all rooms:', error);
    throw error;
  }
}

export async function loadAllRooms(): Promise<Room[]> {
  if (!isFirebaseConfigured()) return [];

  const user = getCurrentUser();
  if (!user) return [];

  try {
    const roomsRef = collection(firebaseDb, COLLECTIONS.USERS, user.uid, 'rooms');
    const q = query(roomsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToDate(data.createdAt),
        lastAnalyzedAt: data.lastAnalyzedAt ? timestampToDate(data.lastAnalyzedAt) : undefined,
        photos: (data.photos || []).map((p: any) => ({
          ...p,
          timestamp: timestampToDate(p.timestamp),
        })),
        tasks: (data.tasks || []).map((t: any) => ({
          ...t,
          completedAt: t.completedAt ? timestampToDate(t.completedAt) : undefined,
        })),
      } as Room;
    });
  } catch (error) {
    console.error('Error loading rooms:', error);
    return [];
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    await deleteDoc(doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'rooms', roomId));
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

// Subscribe to room changes for real-time sync
export function subscribeToRooms(
  callback: (rooms: Room[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  const roomsRef = collection(firebaseDb, COLLECTIONS.USERS, user.uid, 'rooms');
  const q = query(roomsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToDate(data.createdAt),
        lastAnalyzedAt: data.lastAnalyzedAt ? timestampToDate(data.lastAnalyzedAt) : undefined,
        photos: (data.photos || []).map((p: any) => ({
          ...p,
          timestamp: timestampToDate(p.timestamp),
        })),
        tasks: (data.tasks || []).map((t: any) => ({
          ...t,
          completedAt: t.completedAt ? timestampToDate(t.completedAt) : undefined,
        })),
      } as Room;
    });
    callback(rooms);
  });
}

// =====================
// USER STATS
// =====================

export async function saveUserStats(stats: UserStats): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    await setDoc(doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'stats'), {
      ...stats,
      badges: stats.badges.map(b => ({
        ...b,
        unlockedAt: b.unlockedAt ? dateToTimestamp(b.unlockedAt) : null,
      })),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving user stats:', error);
    throw error;
  }
}

export async function loadUserStats(): Promise<UserStats | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const docSnap = await getDoc(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'stats')
    );
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      ...data,
      badges: (data.badges || []).map((b: any) => ({
        ...b,
        unlockedAt: b.unlockedAt ? timestampToDate(b.unlockedAt) : undefined,
      })),
    } as UserStats;
  } catch (error) {
    console.error('Error loading user stats:', error);
    return null;
  }
}

// =====================
// APP SETTINGS
// =====================

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    await setDoc(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'settings'),
      {
        ...settings,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error('Error saving app settings:', error);
    throw error;
  }
}

export async function loadAppSettings(): Promise<AppSettings | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const docSnap = await getDoc(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'settings')
    );
    if (!docSnap.exists()) return null;

    return docSnap.data() as AppSettings;
  } catch (error) {
    console.error('Error loading app settings:', error);
    return null;
  }
}

// =====================
// MASCOT
// =====================

export async function saveMascot(mascot: Mascot): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    await setDoc(doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'mascot'), {
      ...mascot,
      lastFed: dateToTimestamp(mascot.lastFed),
      lastInteraction: dateToTimestamp(mascot.lastInteraction),
      createdAt: dateToTimestamp(mascot.createdAt),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving mascot:', error);
    throw error;
  }
}

export async function loadMascot(): Promise<Mascot | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const docSnap = await getDoc(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'mascot')
    );
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      ...data,
      lastFed: timestampToDate(data.lastFed),
      lastInteraction: timestampToDate(data.lastInteraction),
      createdAt: timestampToDate(data.createdAt),
    } as Mascot;
  } catch (error) {
    console.error('Error loading mascot:', error);
    return null;
  }
}

// =====================
// COLLECTION (Collectibles)
// =====================

export async function saveCollection(
  items: CollectedItem[],
  stats: CollectionStats
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const batch = writeBatch(firebaseDb);

    // Save collection items
    batch.set(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'collection'),
      {
        items: items.map(item => ({
          ...item,
          collectedAt: dateToTimestamp(item.collectedAt),
        })),
        updatedAt: serverTimestamp(),
      }
    );

    // Save collection stats
    batch.set(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'collectionStats'),
      {
        ...stats,
        lastCollected: stats.lastCollected
          ? dateToTimestamp(stats.lastCollected)
          : null,
        updatedAt: serverTimestamp(),
      }
    );

    await batch.commit();
  } catch (error) {
    console.error('Error saving collection:', error);
    throw error;
  }
}

export async function loadCollection(): Promise<{
  items: CollectedItem[];
  stats: CollectionStats;
} | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const [collectionSnap, statsSnap] = await Promise.all([
      getDoc(doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'collection')),
      getDoc(doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'data', 'collectionStats')),
    ]);

    const collectionData = collectionSnap.exists() ? collectionSnap.data() : null;
    const statsData = statsSnap.exists() ? statsSnap.data() : null;

    return {
      items: collectionData?.items?.map((item: any) => ({
        ...item,
        collectedAt: timestampToDate(item.collectedAt),
      })) || [],
      stats: statsData ? {
        ...statsData,
        lastCollected: statsData.lastCollected
          ? timestampToDate(statsData.lastCollected)
          : undefined,
      } as CollectionStats : {
        totalCollected: 0,
        uniqueCollected: 0,
        commonCount: 0,
        uncommonCount: 0,
        rareCount: 0,
        epicCount: 0,
        legendaryCount: 0,
      },
    };
  } catch (error) {
    console.error('Error loading collection:', error);
    return null;
  }
}

// =====================
// ACTIVITY TRACKING
// =====================

export interface ActivityEntry {
  id: string;
  type: 'task_completed' | 'room_added' | 'room_completed' | 'focus_session' | 'collectible_found';
  timestamp: Date;
  data?: Record<string, any>;
}

export async function logActivity(
  type: ActivityEntry['type'],
  data?: Record<string, any>
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const activityId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(
      doc(firebaseDb, COLLECTIONS.USERS, user.uid, 'activities', activityId),
      {
        id: activityId,
        type,
        data: data || {},
        timestamp: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getRecentActivities(
  limitCount: number = 50
): Promise<ActivityEntry[]> {
  if (!isFirebaseConfigured()) return [];

  const user = getCurrentUser();
  if (!user) return [];

  try {
    const activitiesRef = collection(
      firebaseDb,
      COLLECTIONS.USERS,
      user.uid,
      'activities'
    );
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        timestamp: timestampToDate(data.timestamp),
        data: data.data,
      } as ActivityEntry;
    });
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

// Get activity counts by date for weekly chart
export async function getWeeklyActivityCounts(): Promise<Record<string, number>> {
  if (!isFirebaseConfigured()) return {};

  const user = getCurrentUser();
  if (!user) return {};

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activitiesRef = collection(
      firebaseDb,
      COLLECTIONS.USERS,
      user.uid,
      'activities'
    );
    const q = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);

    const counts: Record<string, number> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize all days to 0
    days.forEach(day => {
      counts[day] = 0;
    });

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = timestampToDate(data.timestamp);
      const dayName = days[date.getDay()];
      counts[dayName] = (counts[dayName] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error getting weekly activity counts:', error);
    return {};
  }
}

// =====================
// SYNC ALL DATA
// =====================

export async function syncAllDataToCloud(data: {
  profile?: UserProfile;
  rooms: Room[];
  stats: UserStats;
  settings: AppSettings;
  mascot?: Mascot;
  collection: CollectedItem[];
  collectionStats: CollectionStats;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const batch = writeBatch(firebaseDb);
    const userRef = doc(firebaseDb, COLLECTIONS.USERS, user.uid);

    // Save user profile
    if (data.profile) {
      batch.set(userRef, {
        ...data.profile,
        createdAt: dateToTimestamp(data.profile.createdAt),
        updatedAt: serverTimestamp(),
        firebaseUid: user.uid,
        email: user.email,
      });
    }

    await batch.commit();

    // Save other data in parallel
    await Promise.all([
      saveAllRooms(data.rooms),
      saveUserStats(data.stats),
      saveAppSettings(data.settings),
      data.mascot ? saveMascot(data.mascot) : Promise.resolve(),
      saveCollection(data.collection, data.collectionStats),
    ]);
  } catch (error) {
    console.error('Error syncing all data to cloud:', error);
    throw error;
  }
}

export async function loadAllDataFromCloud(): Promise<{
  profile: UserProfile | null;
  rooms: Room[];
  stats: UserStats | null;
  settings: AppSettings | null;
  mascot: Mascot | null;
  collection: CollectedItem[];
  collectionStats: CollectionStats | null;
} | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const [profile, rooms, stats, settings, mascot, collectionData] = await Promise.all([
      loadUserProfile(),
      loadAllRooms(),
      loadUserStats(),
      loadAppSettings(),
      loadMascot(),
      loadCollection(),
    ]);

    return {
      profile,
      rooms,
      stats,
      settings,
      mascot,
      collection: collectionData?.items || [],
      collectionStats: collectionData?.stats || null,
    };
  } catch (error) {
    console.error('Error loading all data from cloud:', error);
    return null;
  }
}
