/**
 * Cloud Sync Hook
 * Manages bidirectional sync between local state and Firebase
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/config/firebase';
import {
  syncAllDataToCloud,
  loadAllDataFromCloud,
  subscribeToRooms,
  saveRoom,
  saveUserStats,
  saveMascot,
  saveCollection,
  saveAppSettings,
  logActivity,
} from '@/services/firestore';
import {
  Room,
  UserProfile,
  UserStats,
  AppSettings,
  Mascot,
  CollectedItem,
  CollectionStats,
} from '@/types/declutter';

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

// Sync queue item
interface SyncQueueItem {
  id: string;
  type: 'room' | 'stats' | 'settings' | 'mascot' | 'collection';
  data: any;
  timestamp: number;
  retries: number;
}

// Storage key for offline queue
const SYNC_QUEUE_KEY = '@declutterly_sync_queue';
const LAST_SYNC_KEY = '@declutterly_last_sync';

// Maximum retries for failed syncs
const MAX_RETRIES = 3;

// Debounce time for syncing (ms)
const SYNC_DEBOUNCE = 2000;

export function useCloudSync() {
  const { isAuthenticated, isFirebaseReady } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(0);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncQueueRef = useRef<SyncQueueItem[]>([]);

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
      if (state.isConnected && syncQueueRef.current.length > 0) {
        processSyncQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Load last sync time on mount
  useEffect(() => {
    loadLastSyncTime();
    loadSyncQueue();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && isOnline) {
      // App came to foreground - try to sync
      processSyncQueue();
    } else if (nextAppState === 'background') {
      // App going to background - save queue
      saveSyncQueue();
    }
  };

  const loadLastSyncTime = async () => {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (lastSync) {
        setLastSynced(new Date(lastSync));
      }
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const loadSyncQueue = async () => {
    try {
      const queue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queue) {
        syncQueueRef.current = JSON.parse(queue);
        setPendingChanges(syncQueueRef.current.length);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  };

  const saveSyncQueue = async () => {
    try {
      await AsyncStorage.setItem(
        SYNC_QUEUE_KEY,
        JSON.stringify(syncQueueRef.current)
      );
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  };

  // Add item to sync queue
  const queueSync = useCallback((
    type: SyncQueueItem['type'],
    data: any
  ) => {
    if (!isFirebaseReady || !isAuthenticated) return;

    const item: SyncQueueItem = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    // Remove existing item of same type (we only need the latest)
    syncQueueRef.current = syncQueueRef.current.filter(i => i.type !== type);
    syncQueueRef.current.push(item);
    setPendingChanges(syncQueueRef.current.length);

    // Debounced sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (isOnline) {
      syncTimeoutRef.current = setTimeout(() => {
        processSyncQueue();
      }, SYNC_DEBOUNCE);
    } else {
      // Save queue for later
      saveSyncQueue();
    }
  }, [isFirebaseReady, isAuthenticated, isOnline]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!isFirebaseReady || !isAuthenticated || !isOnline) return;
    if (syncQueueRef.current.length === 0) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');

    const failedItems: SyncQueueItem[] = [];

    for (const item of syncQueueRef.current) {
      try {
        switch (item.type) {
          case 'room':
            await saveRoom(item.data);
            break;
          case 'stats':
            await saveUserStats(item.data);
            break;
          case 'settings':
            await saveAppSettings(item.data);
            break;
          case 'mascot':
            await saveMascot(item.data);
            break;
          case 'collection':
            await saveCollection(item.data.items, item.data.stats);
            break;
        }
      } catch (error) {
        console.error(`Sync failed for ${item.type}:`, error);
        if (item.retries < MAX_RETRIES) {
          failedItems.push({ ...item, retries: item.retries + 1 });
        }
      }
    }

    syncQueueRef.current = failedItems;
    setPendingChanges(failedItems.length);
    await saveSyncQueue();

    if (failedItems.length === 0) {
      setSyncStatus('synced');
      const now = new Date();
      setLastSynced(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
    } else {
      setSyncStatus('error');
    }
  }, [isFirebaseReady, isAuthenticated, isOnline]);

  // Force full sync
  const forceSync = useCallback(async (data: {
    profile?: UserProfile;
    rooms: Room[];
    stats: UserStats;
    settings: AppSettings;
    mascot?: Mascot;
    collection: CollectedItem[];
    collectionStats: CollectionStats;
  }) => {
    if (!isFirebaseReady || !isAuthenticated) return;

    setSyncStatus('syncing');

    try {
      await syncAllDataToCloud(data);
      setSyncStatus('synced');
      const now = new Date();
      setLastSynced(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());

      // Clear queue
      syncQueueRef.current = [];
      setPendingChanges(0);
      await saveSyncQueue();
    } catch (error) {
      console.error('Force sync failed:', error);
      setSyncStatus('error');
    }
  }, [isFirebaseReady, isAuthenticated]);

  // Pull data from cloud
  const pullFromCloud = useCallback(async () => {
    if (!isFirebaseReady || !isAuthenticated) return null;

    setSyncStatus('syncing');

    try {
      const data = await loadAllDataFromCloud();
      setSyncStatus('synced');
      return data;
    } catch (error) {
      console.error('Pull from cloud failed:', error);
      setSyncStatus('error');
      return null;
    }
  }, [isFirebaseReady, isAuthenticated]);

  // Sync specific data types
  const syncRoom = useCallback((room: Room) => {
    queueSync('room', room);
  }, [queueSync]);

  const syncStats = useCallback((stats: UserStats) => {
    queueSync('stats', stats);
  }, [queueSync]);

  const syncSettings = useCallback((settings: AppSettings) => {
    queueSync('settings', settings);
  }, [queueSync]);

  const syncMascot = useCallback((mascot: Mascot) => {
    queueSync('mascot', mascot);
  }, [queueSync]);

  const syncCollection = useCallback((
    items: CollectedItem[],
    stats: CollectionStats
  ) => {
    queueSync('collection', { items, stats });
  }, [queueSync]);

  // Update status based on connectivity
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('offline');
    } else if (syncQueueRef.current.length > 0) {
      processSyncQueue();
    }
  }, [isOnline, processSyncQueue]);

  return {
    syncStatus,
    lastSynced,
    isOnline,
    pendingChanges,
    forceSync,
    pullFromCloud,
    syncRoom,
    syncStats,
    syncSettings,
    syncMascot,
    syncCollection,
    logActivity,
  };
}

// Utility to format last sync time
export function formatLastSyncTime(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
