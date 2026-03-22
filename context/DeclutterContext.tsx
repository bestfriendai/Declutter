/**
 * Declutterly - App Context
 * Global state management for the declutter app
 */

import { AppBootstrapScreen } from '@/components/ui/AppBootstrapScreen';
import { convex } from '@/config/convex';
import { defaultCollectionStats, defaultSettings, defaultStats } from '@/constants/defaultState';
import { Time } from '@/constants/time';
import { SyncData, useAuth } from '@/context/AuthContext';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { setForcedColorScheme } from '@/hooks/useColorScheme';
import { getComebackBonusXP } from '@/services/comebackEngine';
import { notifyLevelUp, notifyRoomComplete } from '@/services/notifications';
import { setHapticsEnabled } from '@/services/haptics';
import {
    hydrateCloudState,
    hydrateCollection,
    hydrateCollectionStats,
    hydrateMascot,
    hydrateRooms,
    hydrateSettings,
    hydrateStats,
    hydrateUserProfile,
} from '@/services/hydration';
import { persistPhotoLocally } from '@/services/localPhotos';
import { recordTaskCompletion, clearTaskHistory } from '@/services/taskOptimizer';
import {
    deleteSecureValue,
    loadSecureJson,
    saveSecureJson,
    SECURE_KEYS,
} from '@/services/secureStorage';
import {
    AppSettings,
    Badge,
    BADGES,
    CleaningSession,
    CleaningTask,
    CollectedItem,
    COLLECTIBLES,
    CollectionStats,
    DeclutterState,
    FocusSession,
    Mascot,
    MascotMood,
    MascotPersonality,
    PhotoCapture,
    Room,
    RoomType,
    SpawnEvent,
    UserProfile,
    UserStats,
} from '@/types/declutter';
import { toConvexId } from '@/utils/convexIds';
import { generateId } from '@/utils/id';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storageKeys';

// Create context
export const DeclutterContext = createContext<DeclutterState | null>(null);

// Provider component
export function DeclutterProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  // Ref always reflects the latest committed stats so callbacks can read the
  // current value without causing stale-closure bugs or nested setState calls.
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  // Dead session code removed — session tracking is now handled by focus mode.
  // Keep a static null value to satisfy the DeclutterState interface.
  const currentSession: CleaningSession | null = null;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mascot state
  const [mascot, setMascot] = useState<Mascot | null>(null);

  // Focus mode state
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);

  // Collection state
  const [collection, setCollection] = useState<CollectedItem[]>([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>(defaultCollectionStats);
  const [activeSpawn, setActiveSpawn] = useState<SpawnEvent | null>(null);

  // Celebration state for achievements
  const [pendingCelebration, setPendingCelebration] = useState<Badge[]>([]);

  // Comeback bonus multiplier — applies extra XP for returning users
  const [comebackMultiplier, setComebackMultiplier] = useState<number>(1);

  // Sync error state
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isHydratingCloud, setIsHydratingCloud] = useState(false);
  // Ref-based hydration guard: ensures the sync effect never fires in the same
  // React commit that applyCloudData set new state values, even if React
  // batches the setState(false) together with the data updates.
  const isHydratingCloudRef = useRef(false);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Check for comeback multiplier on initial load.
  // Wait until cloud hydration finishes (so stats reflect server data) or
  // fall back after 3 seconds for offline / anonymous users.
  const comebackCheckedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || comebackCheckedRef.current) return;

    // If cloud hydration is still in progress, wait for it to complete
    // (or time out after 3 seconds so offline users still get comeback bonuses).
    if (isHydratingCloud) {
      const timeout = setTimeout(() => {
        if (!comebackCheckedRef.current) {
          comebackCheckedRef.current = true;
          const lastActivity = stats.lastActivityDate;
          if (!lastActivity) return;
          const lastDate = new Date(lastActivity);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 2) {
            const { multiplier } = getComebackBonusXP(10, diffDays);
            setComebackMultiplier(multiplier);
          }
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }

    // Cloud hydration complete (or user is not authenticated) — check now
    comebackCheckedRef.current = true;
    if (!stats.lastActivityDate) return;
    const lastDate = new Date(stats.lastActivityDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 2) {
      const { multiplier } = getComebackBonusXP(10, diffDays);
      setComebackMultiplier(multiplier);
    }
  }, [isLoaded, isHydratingCloud]); // re-run when hydration completes

  // Save data when it changes (skip during cloud hydration to avoid
  // writing partially-applied cloud state to disk). Debounced to avoid
  // hammering AsyncStorage on every rapid state change.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (isLoaded && !isHydratingCloudRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveData(), 2000);
    }
    return () => clearTimeout(saveTimerRef.current);
  }, [user, rooms, stats, settings, mascot, collection, collectionStats, isLoaded]);

  useEffect(() => {
    setForcedColorScheme(settings.theme === 'auto' ? null : settings.theme);
  }, [settings.theme]);

  // Cloud sync with debouncing
  const { syncToCloud, loadFromCloud, isAuthenticated, isAnonymous } = useAuth();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Mascot activity timeout refs - for cleanup
  const mascotActivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Clear mascot activity timeout helper
  const clearMascotActivityTimeout = useCallback(() => {
    if (mascotActivityTimeoutRef.current) {
      clearTimeout(mascotActivityTimeoutRef.current);
      mascotActivityTimeoutRef.current = null;
    }
  }, []);
  
  // Cleanup mascot activity timeouts on unmount
  useEffect(() => {
    return () => {
      if (mascotActivityTimeoutRef.current) {
        clearTimeout(mascotActivityTimeoutRef.current);
      }
    };
  }, []);

  const applyCloudData = useCallback((cloudData: unknown) => {
    const hydrated = hydrateCloudState(cloudData);

    setUser(hydrated.user);
    setRooms(hydrated.rooms);
    setStats(hydrated.stats);
    setSettingsState(hydrated.settings);
    setHapticsEnabled(hydrated.settings.hapticFeedback);
    setMascot(hydrated.mascot);
    setCollection(hydrated.collection);
    setCollectionStats(hydrated.collectionStats);
    setSyncError(null);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isAuthenticated || isAnonymous) {
      isHydratingCloudRef.current = false;
      setIsHydratingCloud(false);
      return;
    }

    let cancelled = false;
    isHydratingCloudRef.current = true;
    setIsHydratingCloud(true);

    // Safety timeout: force-clear hydrating flag if hydration hasn't
    // completed after 5 seconds (e.g. app backgrounded during hydration,
    // network stall, or promise never settling).
    const hydrationTimeout = setTimeout(() => {
      if (isHydratingCloudRef.current) {
        if (__DEV__) console.warn('Hydration timed out after 5s — force-clearing hydrating flag');
        isHydratingCloudRef.current = false;
        setIsHydratingCloud(false);
      }
    }, 5000);

    void (async () => {
      try {
        const cloudData = await loadFromCloud();
        if (!cancelled && cloudData) {
          applyCloudData(cloudData);
        }
      } catch (error) {
        if (__DEV__) console.error('Error loading cloud data from Convex:', error);
        if (!cancelled) {
          setSyncError('Unable to load your latest synced data.');
        }
      } finally {
        clearTimeout(hydrationTimeout);
        if (!cancelled) {
          setIsHydratingCloud(false);
          // Delay clearing the ref so the sync effect that runs in the same
          // React commit (after applyCloudData batched state updates) still
          // sees hydrating === true and bails out.
          setTimeout(() => {
            isHydratingCloudRef.current = false;
          }, 0);
        }
      }
    })();

    // AppState listener: reset hydrating flag if app goes to background
    // during hydration so it doesn't get stuck.
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if ((nextAppState === 'background' || nextAppState === 'inactive') && isHydratingCloudRef.current) {
        if (__DEV__) console.warn('App backgrounded during hydration — clearing hydrating flag');
        isHydratingCloudRef.current = false;
        setIsHydratingCloud(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(hydrationTimeout);
      appStateSubscription.remove();
    };
  }, [applyCloudData, isAuthenticated, isAnonymous, isLoaded, loadFromCloud]);

  useEffect(() => {
    // Only sync if loaded, authenticated, not anonymous, and not hydrating.
    // Check both the state flag and the ref — the ref survives React batching
    // so that cloud-hydration state updates don't immediately trigger a sync.
    if (!isLoaded || !isAuthenticated || isAnonymous || isHydratingCloud || isHydratingCloudRef.current) return;

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce sync by 5 seconds to avoid excessive API calls
    syncTimeoutRef.current = setTimeout(() => {
      // Double-check hydration ref inside the timeout as well
      if (isHydratingCloudRef.current) return;

      const syncData: SyncData = {
        profile: user || undefined,
        rooms,
        stats,
        settings,
        mascot: mascot || undefined,
        collection,
        collectionStats,
      };

      setSyncStatus('syncing');
      syncToCloud(syncData).then(() => {
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      }).catch(error => {
        if (__DEV__) console.error('Background sync failed:', error);
        setSyncError('Unable to sync your data. Changes saved locally.');
        setSyncStatus('error');
      });
    }, Time.CLOUD_SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, rooms, stats, settings, mascot, collection, collectionStats, isLoaded, isAuthenticated, isAnonymous, isHydratingCloud, syncToCloud]);

  // Flush pending sync immediately when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Immediately sync when going to background
        if (isLoaded && isAuthenticated && !isAnonymous && !isHydratingCloudRef.current) {
          // Cancel any pending debounced sync
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = null;
          }

          const syncData: SyncData = {
            profile: user || undefined,
            rooms,
            stats,
            settings,
            mascot: mascot || undefined,
            collection,
            collectionStats,
          };

          syncToCloud(syncData).catch(error => {
            if (__DEV__) console.error('Background sync failed:', error);
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isLoaded, isAuthenticated, isAnonymous, user, rooms, stats, settings, mascot, collection, collectionStats, syncToCloud]);

  const updateMascotStatusRef = useRef<() => void>(() => {});

  updateMascotStatusRef.current = () => {
    if (!mascot) return;

    const now = new Date();
    const hoursSinceInteraction = (now.getTime() - new Date(mascot.lastInteraction).getTime()) / Time.MS_PER_HOUR;
    const hoursSinceFed = (now.getTime() - new Date(mascot.lastFed).getTime()) / Time.MS_PER_HOUR;

    let newMood: MascotMood = mascot.mood;
    let newHunger = Math.max(0, mascot.hunger - hoursSinceFed * 5);
    let newEnergy = Math.min(100, mascot.energy + 2);
    let newHappiness = mascot.happiness;

    if (hoursSinceInteraction > 24) {
      newMood = 'sad';
      newHappiness = Math.max(0, newHappiness - 10);
    } else if (newHunger < 20) {
      newMood = 'sad';
    } else if (hoursSinceInteraction > 12) {
      newMood = 'neutral';
    } else if (newHunger > 80 && newHappiness > 80) {
      newMood = 'ecstatic';
    } else if (newHunger > 60) {
      newMood = 'happy';
    }

    if (newMood !== mascot.mood || newHunger !== mascot.hunger) {
      setMascot(prev => prev ? {
        ...prev,
        mood: newMood,
        hunger: newHunger,
        energy: newEnergy,
        happiness: newHappiness,
      } : null);
    }
  };

  useEffect(() => {
    if (!mascot) return;

    const interval = setInterval(() => {
      updateMascotStatusRef.current();
    }, Time.MASCOT_STATUS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [!!mascot]);

  async function loadData() {
    try {
      const [secureUser, roomsStr, statsStr, settingsStr, apiKey, mascotStr, collectionStr, collectionStatsStr] = await Promise.all([
        loadSecureJson<unknown>(SECURE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.ROOMS),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.MASCOT),
        AsyncStorage.getItem(STORAGE_KEYS.COLLECTION),
        AsyncStorage.getItem(STORAGE_KEYS.COLLECTION_STATS),
      ]);

      if (secureUser) {
        setUser(hydrateUserProfile(secureUser));
      }

      if (roomsStr) {
        try { setRooms(hydrateRooms(JSON.parse(roomsStr))); } catch { /* corrupted */ }
      }

      if (statsStr) {
        try { setStats(hydrateStats(JSON.parse(statsStr))); } catch { /* corrupted */ }
      }

      if (settingsStr) {
        try {
          const mergedSettings = hydrateSettings(JSON.parse(settingsStr));
          setSettingsState(mergedSettings);
          setHapticsEnabled(mergedSettings.hapticFeedback);
        } catch { /* corrupted */ }
      }

      // API key is now server-side in Convex env vars — nothing to load here.
      // Clean up any old locally-stored key (migration step, runs once).
      if (apiKey) {
        await AsyncStorage.removeItem(STORAGE_KEYS.API_KEY);
      }

      if (mascotStr) {
        try { setMascot(hydrateMascot(JSON.parse(mascotStr))); } catch { /* corrupted */ }
      }

      if (collectionStr) {
        try { setCollection(hydrateCollection(JSON.parse(collectionStr))); } catch { /* corrupted */ }
      }

      if (collectionStatsStr) {
        try { setCollectionStats(hydrateCollectionStats(JSON.parse(collectionStatsStr))); } catch { /* corrupted */ }
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading data:', error);
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveData() {
    try {
      await Promise.all([
        user
          ? saveSecureJson(SECURE_KEYS.USER_PROFILE, user)
          : deleteSecureValue(SECURE_KEYS.USER_PROFILE),
        AsyncStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms)),
        AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)),
        AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)),
        mascot ? AsyncStorage.setItem(STORAGE_KEYS.MASCOT, JSON.stringify(mascot)) : null,
        AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection)),
        AsyncStorage.setItem(STORAGE_KEYS.COLLECTION_STATS, JSON.stringify(collectionStats)),
      ]);
    } catch (error) {
      if (__DEV__) console.error('Error saving data:', error);
    }
  }

  // Check and unlock badges
  function checkBadges(updatedStats: UserStats): Badge[] {
    const newBadges: Badge[] = [];

    BADGES.forEach(badge => {
      if (updatedStats.badges.some(b => b.id === badge.id)) return;

      let shouldUnlock = false;
      switch (badge.type) {
        case 'tasks':
          shouldUnlock = updatedStats.totalTasksCompleted >= badge.requirement;
          break;
        case 'rooms':
          shouldUnlock = updatedStats.totalRoomsCleaned >= badge.requirement;
          break;
        case 'streak':
          shouldUnlock = updatedStats.currentStreak >= badge.requirement;
          break;
        case 'time':
          shouldUnlock = updatedStats.totalMinutesCleaned >= badge.requirement;
          break;
        case 'comeback':
          shouldUnlock = (updatedStats.comebackCount ?? 0) >= badge.requirement;
          break;
        case 'longComeback':
          // longComeback badges unlock when the user has returned after 7+ days away.
          // The comeback engine validates the gap length before incrementing comebackCount,
          // so any comeback qualifies once comebackCount >= 1.
          shouldUnlock = (updatedStats.comebackCount ?? 0) >= 1;
          break;
        case 'sessions':
          shouldUnlock = (updatedStats.totalCleaningSessions ?? 0) >= badge.requirement;
          break;
      }

      if (shouldUnlock) {
        newBadges.push({ ...badge, unlockedAt: new Date() });
      }
    });

    return newBadges;
  }

  // Calculate level from XP
  function calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1;
  }

  // =====================
  // BASIC ACTIONS
  // =====================

  const setUserAction = useCallback((newUser: UserProfile) => {
    setUser(newUser);
  }, []);

  const addRoom = useCallback(async (roomData: Omit<Room, 'id' | 'createdAt' | 'photos' | 'tasks' | 'currentProgress'>) => {
    let roomId = generateId();

    if (isAuthenticated && !isAnonymous) {
      try {
        roomId = await convex.mutation(api.rooms.create, {
          name: roomData.name,
          type: roomData.type,
          emoji: roomData.emoji,
        });
      } catch (error) {
        if (__DEV__) console.error('Failed to create room in Convex:', error);
      }
    }

    const newRoom: Room = {
      ...roomData,
      id: roomId,
      createdAt: new Date(),
      photos: [],
      tasks: [],
      currentProgress: 0,
    };
    setRooms(prev => [...prev, newRoom]);
    return newRoom;
  }, [isAnonymous, isAuthenticated]);

  const updateRoom = useCallback((roomId: string, updates: Partial<Room>) => {
    setRooms(prev =>
      prev.map(room => (room.id === roomId ? { ...room, ...updates } : room))
    );

    // Sync room update to Convex
    if (isAuthenticated && !isAnonymous) {
      const convexUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) convexUpdates.name = updates.name;
      if (updates.type !== undefined) convexUpdates.type = updates.type;
      if (updates.emoji !== undefined) convexUpdates.emoji = updates.emoji;
      if (updates.messLevel !== undefined) convexUpdates.messLevel = updates.messLevel;
      if (updates.currentProgress !== undefined) convexUpdates.currentProgress = updates.currentProgress;
      if (updates.aiSummary !== undefined) convexUpdates.aiSummary = updates.aiSummary;
      if (updates.motivationalMessage !== undefined) convexUpdates.motivationalMessage = updates.motivationalMessage;
      if (Object.keys(convexUpdates).length > 0) {
        convex.mutation(api.rooms.update, {
          id: toConvexId<'rooms'>(roomId),
          ...convexUpdates,
        }).catch((error) => {
          if (__DEV__) console.error('Failed to update room in Convex:', error);
        });
      }
    }
  }, [isAnonymous, isAuthenticated]);

  const deleteRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    setActiveRoomId(prev => prev === roomId ? null : prev);

    // Sync deletion to Convex
    if (isAuthenticated && !isAnonymous) {
      void convex.mutation(api.rooms.remove, { id: toConvexId<'rooms'>(roomId) }).catch((error) => {
        if (__DEV__) console.error('Failed to delete room in Convex:', error);
      });
    }
  }, [isAuthenticated, isAnonymous]);

  const addPhotoToRoom = useCallback(async (roomId: string, photoData: Omit<PhotoCapture, 'id'>) => {
    const photoId = generateId();

    const persistedUri = await persistPhotoLocally(photoData.uri, photoId);

    const photo: PhotoCapture = {
      ...photoData,
      id: photoId,
      uri: persistedUri,
    };

    setRooms(prev =>
      prev.map(room =>
        room.id === roomId
          ? { ...room, photos: [...room.photos, photo] }
          : room
      )
    );

    if (!isAuthenticated || isAnonymous) {
      return;
    }

    try {
      const uploadUrl = await convex.mutation(api.photos.generateUploadUrl, {});
      const localResponse = await fetch(persistedUri);
      if (!localResponse.ok) {
        if (__DEV__) console.error('Failed to read local photo file');
        return;
      }
      const blob = await localResponse.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      if (!uploadResponse.ok) {
        if (__DEV__) console.error('Photo upload failed with status:', uploadResponse.status);
        return;
      }
      let storageId: string;
      try {
        const uploadJson = await uploadResponse.json();
        storageId = uploadJson.storageId;
      } catch {
        if (__DEV__) console.error('Failed to parse photo upload response');
        return;
      }
      if (!storageId) {
        if (__DEV__) console.error('No storageId returned from upload');
        return;
      }
      const remotePhotoId = await convex.mutation(api.photos.create, {
        roomId: toConvexId<'rooms'>(roomId),
        uri: persistedUri,
        type: photoData.type,
        storageId: storageId as unknown as Id<'_storage'>,
        timestamp: photoData.timestamp.getTime(),
      });
      const remotePhotos = await convex.query(api.photos.listByRoom, {
        roomId: toConvexId<'rooms'>(roomId),
      });
      const remotePhoto = remotePhotos.find(
        (candidate) => String(candidate._id) === String(remotePhotoId)
      );

      if (remotePhoto?.uri) {
        setRooms(prev =>
          prev.map(room =>
            room.id === roomId
              ? {
                  ...room,
                  photos: room.photos.map(existingPhoto =>
                    existingPhoto.id === photoId
                      ? {
                          ...existingPhoto,
                          id: String(remotePhotoId),
                          uri: remotePhoto.uri,
                        }
                      : existingPhoto
                  ),
                }
              : room
          )
        );
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to upload photo to Convex storage:', error);
    }
  }, [isAnonymous, isAuthenticated]);

  const deletePhotoFromRoom = useCallback((roomId: string, photoId: string) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId
          ? { ...room, photos: room.photos.filter(p => p.id !== photoId) }
          : room
      )
    );

    if (isAuthenticated && !isAnonymous) {
      void convex.mutation(api.photos.remove, { id: toConvexId<'photos'>(photoId) }).catch((error) => {
        if (__DEV__) console.error('Failed to delete photo from Convex:', error);
      });
    }
  }, [isAnonymous, isAuthenticated]);

  const setTasksForRoom = useCallback((roomId: string, tasks: CleaningTask[]) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId ? { ...room, tasks } : room
      )
    );

    // Persist tasks to Convex backend
    if (isAuthenticated && !isAnonymous) {
      const convexTasks = tasks.map((t, i) => ({
        title: t.title,
        description: t.description || '',
        emoji: t.emoji || '📋',
        priority: t.priority || 'medium' as const,
        difficulty: t.difficulty || 'medium' as const,
        estimatedMinutes: t.estimatedMinutes || 5,
        completed: t.completed || false,
        tips: t.tips,
        zone: t.zone,
        targetObjects: t.targetObjects,
        destinationLocation: t.destination?.location,
        destinationInstructions: t.destination?.instructions,
        category: t.category,
        energyRequired: t.energyRequired,
        decisionLoad: t.decisionLoad,
        visualImpact: t.visualImpact,
        whyThisMatters: t.whyThisMatters,
        resistanceHandler: t.resistanceHandler,
        suppliesNeeded: t.suppliesNeeded,
        dependencies: t.dependencies,
        enables: t.enables,
        parallelWith: t.parallelWith,
        order: i,
      }));
      convex.mutation(api.tasks.createMany, {
        roomId: toConvexId<'rooms'>(roomId),
        tasks: convexTasks,
      }).catch((error) => {
        if (__DEV__) console.error('Failed to persist tasks to Convex:', error);
      });
    }
  }, [isAnonymous, isAuthenticated]);

  const addTaskToRoom = useCallback((roomId: string, task: Omit<CleaningTask, 'id'>) => {
    const newTask: CleaningTask = {
      ...task,
      id: generateId(),
    };
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId 
          ? { ...room, tasks: [...room.tasks, newTask] } 
          : room
      )
    );
  }, []);

  // Moved before toggleTask to avoid temporal dead zone
  const feedMascotAction = useCallback(() => {
    if (!mascot) return;

    const newHunger = Math.min(100, mascot.hunger + 20);
    const newHappiness = Math.min(100, mascot.happiness + 10);
    const newXp = mascot.xp + 5;
    const newLevel = Math.floor(newXp / 50) + 1;

    setMascot(prev => prev ? {
      ...prev,
      hunger: newHunger,
      happiness: newHappiness,
      xp: newXp,
      level: newLevel,
      lastFed: new Date(),
      mood: newHunger > 80 ? 'happy' : prev.mood,
      activity: 'cheering',
    } : null);

    // Sync mascot feeding to Convex
    if (isAuthenticated && !isAnonymous) {
      convex.mutation(api.mascots.feed, {}).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });
    }

    // Reset activity after animation - with cleanup
    clearMascotActivityTimeout();
    mascotActivityTimeoutRef.current = setTimeout(() => {
      setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
    }, Time.MASCOT_SHORT_ACTIVITY_MS);
  }, [mascot, clearMascotActivityTimeout, isAnonymous, isAuthenticated]);

  // Moved before toggleTask to avoid temporal dead zone
  const spawnCollectibleAction = useCallback((): SpawnEvent | null => {
    if (!settings.arCollectionEnabled) return null;

    // Get eligible collectibles based on tasks completed
    const eligible = COLLECTIBLES.filter(c =>
      !c.isSpecial &&
      c.requiredTasks <= stats.totalTasksCompleted &&
      c.spawnChance > 0
    );

    if (eligible.length === 0) return null;

    // Normalize spawn chances so they sum to 1.0
    // Without normalization, cumulative probability exceeds 1.0 and rare/legendary
    // items at the end of the array can never spawn.
    const totalChance = eligible.reduce((sum, c) => sum + c.spawnChance, 0);
    const roll = Math.random();
    let cumulative = 0;

    for (const collectible of eligible) {
      cumulative += collectible.spawnChance / totalChance;
      if (roll <= cumulative) {
        const spawn: SpawnEvent = {
          collectible,
          position: {
            x: Math.random() * 0.6 + 0.2, // 20-80% of screen
            y: Math.random() * 0.4 + 0.3, // 30-70% of screen
          },
          expiresAt: new Date(Date.now() + Time.COLLECTIBLE_SPAWN_WINDOW_MS),
          collected: false,
        };
        return spawn;
      }
    }

    return null;
  }, [settings.arCollectionEnabled, stats.totalTasksCompleted]);

  const toggleTask = useCallback((roomId: string, taskId: string) => {
    let taskJustCompleted = false;
    let taskJustUncompleted = false;
    let taskMinutes = 0;
    let roomJustCompleted = false;
    let roomWasCompleted = false;
    let completedTaskRef: CleaningTask | null = null;
    let roomTypeRef: RoomType | undefined;
    let completedRoomName: string | undefined;

    setRooms(prev => {
      const room = prev.find(r => r.id === roomId);
      const task = room?.tasks.find(t => t.id === taskId);

      if (!task) return prev;

      const wasCompleted = task.completed;
      taskMinutes = task.estimatedMinutes;
      // Capture task + room data for the learning system
      completedTaskRef = task;
      roomTypeRef = room?.type;
      completedRoomName = room?.name;

      // Check if room was 100% before this change
      const prevCompletedCount = room?.tasks.filter(t => t.completed).length || 0;
      const totalCount = room?.tasks.length || 0;
      roomWasCompleted = totalCount > 0 && prevCompletedCount === totalCount;

      const newRooms = prev.map(r => {
        if (r.id !== roomId) return r;

        const updatedTasks = r.tasks.map(t => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date() : undefined,
          };
        });

        const completedCount = updatedTasks.filter(t => t.completed).length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        taskJustCompleted = !wasCompleted;
        taskJustUncompleted = wasCompleted;
        roomJustCompleted = !wasCompleted && completedCount === totalCount && totalCount > 0;

        return {
          ...r,
          tasks: updatedTasks,
          currentProgress: newProgress,
          // Update lastCleanedAt when a task is completed (freshness decay system)
          ...(taskJustCompleted ? { lastCleanedAt: Date.now() } : {}),
        };
      });

      return newRooms;
    });

    requestAnimationFrame(() => {
      if (taskJustCompleted) {
        // Update stats when completing a task
        setStats(prevStats => {
          const today = new Date().toDateString();
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const wasYesterday = prevStats.lastActivityDate === yesterday.toDateString();
          const isNewDay = prevStats.lastActivityDate !== today;

          // Calculate new streak
          let newStreak = prevStats.currentStreak;
          if (isNewDay) {
            newStreak = wasYesterday ? prevStats.currentStreak + 1 : 1;
          }

          const baseXp = 10 + (roomJustCompleted ? 50 : 0);
          const newXp = prevStats.xp + Math.round(baseXp * comebackMultiplier);
          let updatedStats: UserStats = {
            ...prevStats,
            totalTasksCompleted: prevStats.totalTasksCompleted + 1,
            totalMinutesCleaned: prevStats.totalMinutesCleaned + taskMinutes,
            totalRoomsCleaned: prevStats.totalRoomsCleaned + (roomJustCompleted ? 1 : 0),
            xp: newXp,
            level: calculateLevel(newXp),
            currentStreak: newStreak,
            longestStreak: Math.max(prevStats.longestStreak, newStreak),
            lastActivityDate: today,
          };

          const newBadges = checkBadges(updatedStats);
          if (newBadges.length > 0) {
            updatedStats = { ...updatedStats, badges: [...updatedStats.badges, ...newBadges] };
            setPendingCelebration(prev => [...prev, ...newBadges]);
            // Push notifications for badges are handled server-side by
            // badges._checkAndUnlockInternal to avoid duplicate notifications.
            // Client-side checkBadges() is only for instant UI celebration.
          }

          // Notify on level up
          const prevLevel = calculateLevel(prevStats.xp);
          const newLevel = updatedStats.level;
          if (newLevel > prevLevel) {
            notifyLevelUp(newLevel).catch(() => {});
          }

          // Reset comeback multiplier after first task completion with bonus
          if (comebackMultiplier > 1) {
            setComebackMultiplier(1);
          }

          return updatedStats;
        });

        if (mascot) {
          feedMascotAction();
        }

        // Notify when a room is fully completed
        if (roomJustCompleted && completedRoomName) {
          notifyRoomComplete(completedRoomName, roomId).catch(() => {});
        }

        // 25% chance to spawn a collectible on task completion
        if (settings.arCollectionEnabled && Math.random() < 0.25) {
          const spawn = spawnCollectibleAction();
          if (spawn) {
            setActiveSpawn(spawn);
          }
        }

        if (focusSession?.isActive) {
          setFocusSession(prev => prev ? {
            ...prev,
            tasksCompletedDuringSession: prev.tasksCompletedDuringSession + 1,
          } : null);
        }

        // Feed task completion data to the learning system (fire and forget)
        if (completedTaskRef) {
          recordTaskCompletion(
            completedTaskRef,
            undefined, // actualMinutes not tracked yet
            false, // wasSkipped = false (completed)
            roomTypeRef,
          ).catch(() => {});
        }

        // Sync task completion to Convex backend
        if (isAuthenticated && !isAnonymous) {
          convex.mutation(api.tasks.toggle, {
            id: toConvexId<'tasks'>(taskId),
          }).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });

          // Trigger server-side stats update (badges, leaderboard, variable rewards)
          convex.mutation(api.stats.incrementTask, {
            minutesCleaned: taskMinutes || 5,
          }).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });

          // If room just completed, record it server-side
          if (roomJustCompleted) {
            convex.mutation(api.stats.incrementRoom, {}).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });
          }
        }

        // Record daily activity for analytics (fire and forget)
        if (isAuthenticated && !isAnonymous) {
          const taskXpEarned = Math.round((10 + (roomJustCompleted ? 50 : 0)) * comebackMultiplier);
          convex.mutation(api.activityLog.recordDailyActivity, {
            tasksCompleted: 1,
            minutesCleaned: taskMinutes || 5,
            xpEarned: taskXpEarned,
          }).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });
        }

        // Variable rewards are now generated automatically inside stats.incrementTask.
        // No need to call checkForReward from the client.

        // Update challenge progress (fire and forget)
        if (isAuthenticated && !isAnonymous) {
          convex.mutation(api.social.incrementMyProgress, {
            increment: 1,
          }).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });
        }
      } else if (taskJustUncompleted) {
        // Decrement stats when uncompleting a task (but never go below 0)
        setStats(prevStats => {
          const newXp = Math.max(0, prevStats.xp - 10 - (roomWasCompleted ? 50 : 0));
          return {
            ...prevStats,
            totalTasksCompleted: Math.max(0, prevStats.totalTasksCompleted - 1),
            totalMinutesCleaned: Math.max(0, prevStats.totalMinutesCleaned - taskMinutes),
            totalRoomsCleaned: roomWasCompleted ? Math.max(0, prevStats.totalRoomsCleaned - 1) : prevStats.totalRoomsCleaned,
            xp: newXp,
            level: calculateLevel(newXp),
            // Note: We don't decrement streak when uncompleting - that would be frustrating for users
          };
        });

        // Sync un-completion to Convex
        if (isAuthenticated && !isAnonymous) {
          convex.mutation(api.tasks.toggle, {
            id: toConvexId<'tasks'>(taskId),
          }).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });

          convex.mutation(api.stats.decrementTask, {}).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });
        }

      }
    });
  }, [mascot, focusSession?.isActive, settings.arCollectionEnabled, feedMascotAction, spawnCollectibleAction, isAuthenticated, isAnonymous, comebackMultiplier]);

  const toggleSubTask = useCallback((roomId: string, taskId: string, subTaskId: string) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;

        const updatedTasks = room.tasks.map(task => {
          if (task.id !== taskId || !task.subtasks) return task;

          const updatedSubtasks = task.subtasks.map(st =>
            st.id === subTaskId ? { ...st, completed: !st.completed } : st
          );

          return { ...task, subtasks: updatedSubtasks };
        });

        return { ...room, tasks: updatedTasks };
      })
    );
  }, []);

  const deleteTask = useCallback((roomId: string, taskId: string) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;

        const updatedTasks = room.tasks.filter(task => task.id !== taskId);
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const totalCount = updatedTasks.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          ...room,
          tasks: updatedTasks,
          currentProgress: newProgress,
        };
      })
    );

    // Sync deletion to Convex
    if (isAuthenticated && !isAnonymous) {
      convex.mutation(api.tasks.remove, { id: toConvexId<'tasks'>(taskId) }).catch((error) => {
        if (__DEV__) console.error('Failed to delete task from Convex:', error);
      });
    }
  }, [isAnonymous, isAuthenticated]);

  const restoreTask = useCallback((roomId: string, task: CleaningTask, originalIndex?: number) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;

        // Insert at original position if provided, otherwise append
        let updatedTasks: CleaningTask[];
        if (originalIndex !== undefined && originalIndex >= 0 && originalIndex <= room.tasks.length) {
          updatedTasks = [
            ...room.tasks.slice(0, originalIndex),
            task,
            ...room.tasks.slice(originalIndex),
          ];
        } else {
          updatedTasks = [...room.tasks, task];
        }

        const completedCount = updatedTasks.filter(t => t.completed).length;
        const totalCount = updatedTasks.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          ...room,
          tasks: updatedTasks,
          currentProgress: newProgress,
        };
      })
    );
  }, []);

  const updateTask = useCallback((roomId: string, taskId: string, updates: Partial<CleaningTask>) => {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== roomId) return room;

        const updatedTasks = room.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        );

        // Recalculate difficulty based on estimated minutes if it changed
        if (updates.estimatedMinutes !== undefined) {
          const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
          if (taskIndex !== -1) {
            const minutes = updates.estimatedMinutes;
            updatedTasks[taskIndex] = {
              ...updatedTasks[taskIndex],
              difficulty: minutes <= 5 ? 'quick' : minutes <= 15 ? 'medium' : 'challenging',
            };
          }
        }

        return {
          ...room,
          tasks: updatedTasks,
        };
      })
    );

    // Sync task update to Convex (only send fields the mutation accepts)
    if (isAuthenticated && !isAnonymous) {
      const patch: Record<string, unknown> = { id: toConvexId<'tasks'>(taskId) };
      if (updates.title !== undefined) patch.title = updates.title;
      if (updates.description !== undefined) patch.description = updates.description;
      if (updates.emoji !== undefined) patch.emoji = updates.emoji;
      if (updates.priority !== undefined) patch.priority = updates.priority;
      if (updates.difficulty !== undefined) patch.difficulty = updates.difficulty;
      if (updates.estimatedMinutes !== undefined) patch.estimatedMinutes = updates.estimatedMinutes;
      if (updates.completed !== undefined) patch.completed = updates.completed;
      if (updates.visualImpact !== undefined) patch.visualImpact = updates.visualImpact;
      if (updates.energyRequired !== undefined) patch.energyRequired = updates.energyRequired;
      convex.mutation(api.tasks.update, patch as Parameters<typeof convex.mutation<typeof api.tasks.update>>[1]).catch((error) => {
        if (__DEV__) console.error('Failed to update task in Convex:', error);
      });
    }
  }, [isAnonymous, isAuthenticated]);

  const setActiveRoom = useCallback((roomId: string | null) => {
    setActiveRoomId(roomId);
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const newSettings = { ...prev, ...updates };
      if (updates.hapticFeedback !== undefined) {
        setHapticsEnabled(updates.hapticFeedback);
      }
      return newSettings;
    });
  }, []);

  const updateStats = useCallback((updates: Partial<UserStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  }, []);

  // startSession / endSession stubs — dead code removed, kept as no-ops for interface compat
  const startSession = useCallback((_roomId: string, _focusMode: boolean) => {}, []);
  const endSession = useCallback(() => {}, []);

  const completeOnboarding = useCallback(() => {
    setUser(prev => prev ? { ...prev, onboardingComplete: true } : null);

    // Sync onboarding completion to Convex
    if (isAuthenticated && !isAnonymous) {
      convex.mutation(api.users.update, {
        onboardingComplete: true,
      }).catch((err) => { if (__DEV__) console.warn('Sync failed:', err?.message); });
    }
  }, [isAnonymous, isAuthenticated]);

  // =====================
  // MASCOT ACTIONS
  // =====================

  const createMascot = useCallback((name: string, personality: MascotPersonality) => {
    const newMascot: Mascot = {
      name,
      personality,
      mood: 'happy',
      activity: 'idle',
      level: 1,
      xp: 0,
      hunger: 100,
      energy: 100,
      happiness: 100,
      lastFed: new Date(),
      lastInteraction: new Date(),
      createdAt: new Date(),
      accessories: [],
    };
    setMascot(newMascot);

    // Sync mascot creation to Convex
    if (isAuthenticated && !isAnonymous) {
      convex.mutation(api.mascots.create, {
        name,
        personality,
      }).catch((error) => {
        if (__DEV__) console.error('Failed to create mascot in Convex:', error);
      });
    }
  }, [isAnonymous, isAuthenticated]);

  const updateMascotAction = useCallback((updates: Partial<Mascot>) => {
    setMascot(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const interactWithMascot = useCallback(() => {
    if (!mascot) return;

    const newHappiness = Math.min(100, mascot.happiness + 15);

    setMascot(prev => prev ? {
      ...prev,
      happiness: newHappiness,
      lastInteraction: new Date(),
      activity: 'dancing',
      mood: newHappiness > 70 ? 'excited' : prev.mood,
    } : null);

    // Reset activity after animation - with cleanup
    clearMascotActivityTimeout();
    mascotActivityTimeoutRef.current = setTimeout(() => {
      setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
    }, Time.MASCOT_LONG_ACTIVITY_MS);
  }, [mascot, clearMascotActivityTimeout]);

  // =====================
  // FOCUS MODE ACTIONS
  // =====================

  const startFocusSession = useCallback((duration: number, roomId?: string) => {
    // Validate inputs
    if (duration <= 0) {
      if (__DEV__) console.warn('Focus session duration must be > 0');
      return;
    }
    if (roomId !== undefined) {
      const roomExists = rooms.some(r => r.id === roomId);
      if (!roomExists) {
        if (__DEV__) console.warn('Room not found for focus session:', roomId);
        // Allow starting without a room instead of failing
      }
    }

    const session: FocusSession = {
      id: generateId(),
      roomId,
      startedAt: new Date(),
      duration,
      remainingSeconds: duration * 60,
      isActive: true,
      isPaused: false,
      tasksCompletedDuringSession: 0,
      blockedApps: [],
      distractionAttempts: 0,
    };
    setFocusSession(session);

    // Update mascot to cleaning mode
    if (mascot) {
      setMascot(prev => prev ? { ...prev, activity: 'cleaning' } : null);
    }
  }, [mascot, rooms]);

  const pauseFocusSession = useCallback(() => {
    setFocusSession(prev => prev ? {
      ...prev,
      isPaused: true,
      pausedAt: new Date(),
    } : null);
  }, []);

  const resumeFocusSession = useCallback(() => {
    setFocusSession(prev => prev ? {
      ...prev,
      isPaused: false,
      pausedAt: undefined,
    } : null);
  }, []);

  const endFocusSession = useCallback(() => {
    setFocusSession(prevSession => {
      if (prevSession) {
        // Grant bonus XP for focus sessions
        const bonusXp = Math.floor((prevSession.duration * 60 - prevSession.remainingSeconds) / 60) * 2;
        setStats(prev => ({
          ...prev,
          xp: prev.xp + bonusXp,
          level: calculateLevel(prev.xp + bonusXp),
        }));

        // Mascot celebrates - with cleanup
        if (mascot) {
          setMascot(prev => prev ? { ...prev, activity: 'celebrating' } : null);
          clearMascotActivityTimeout();
          mascotActivityTimeoutRef.current = setTimeout(() => {
          setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
          }, Time.MASCOT_LONG_ACTIVITY_MS);
        }
      }
      return null;
    });
  }, [mascot, clearMascotActivityTimeout]);

  const updateFocusSessionAction = useCallback((updates: Partial<FocusSession>) => {
    setFocusSession(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // =====================
  // COLLECTION ACTIONS
  // =====================

  const collectItem = useCallback((collectibleId: string, roomId?: string, taskId?: string) => {
    const collectible = COLLECTIBLES.find(c => c.id === collectibleId);
    if (!collectible) return;

    const newItem: CollectedItem = {
      collectibleId,
      collectedAt: new Date(),
      roomId,
      taskId,
    };

    // Use functional update to check if first of kind
    setCollection(prev => {
      const isFirstOfKind = !prev.some(c => c.collectibleId === collectibleId);

      // Update collection stats using functional update
      setCollectionStats(prevStats => ({
        ...prevStats,
        totalCollected: prevStats.totalCollected + 1,
        uniqueCollected: isFirstOfKind ? prevStats.uniqueCollected + 1 : prevStats.uniqueCollected,
        commonCount: collectible.rarity === 'common' ? prevStats.commonCount + 1 : prevStats.commonCount,
        uncommonCount: collectible.rarity === 'uncommon' ? prevStats.uncommonCount + 1 : prevStats.uncommonCount,
        rareCount: collectible.rarity === 'rare' ? prevStats.rareCount + 1 : prevStats.rareCount,
        epicCount: collectible.rarity === 'epic' ? prevStats.epicCount + 1 : prevStats.epicCount,
        legendaryCount: collectible.rarity === 'legendary' ? prevStats.legendaryCount + 1 : prevStats.legendaryCount,
        lastCollected: Date.now(),
      }));

      return [...prev, newItem];
    });

    // Grant XP using functional update
    setStats(prev => ({
      ...prev,
      xp: prev.xp + collectible.xpValue,
      level: calculateLevel(prev.xp + collectible.xpValue),
    }));

    // Clear active spawn
    setActiveSpawn(null);

    // Sync collection to Convex
    if (isAuthenticated && !isAnonymous) {
      convex.mutation(api.collection.collect, {
        collectibleId,
        rarity: collectible.rarity,
        ...(roomId ? { roomId: toConvexId<'rooms'>(roomId) } : {}),
        ...(taskId ? { taskId: toConvexId<'tasks'>(taskId) } : {}),
      }).catch((error) => {
        if (__DEV__) console.error('Failed to sync collection to Convex:', error);
      });
    }

    // Mascot gets excited - with cleanup
    if (mascot) {
      setMascot(prev => prev ? { ...prev, activity: 'cheering', mood: 'excited' } : null);
      clearMascotActivityTimeout();
      mascotActivityTimeoutRef.current = setTimeout(() => {
        setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
      }, Time.MASCOT_SHORT_ACTIVITY_MS);
    }
  }, [mascot, clearMascotActivityTimeout, isAnonymous, isAuthenticated]);

  const dismissSpawn = useCallback(() => {
    setActiveSpawn(null);
  }, []);

  // =====================
  // DATA MANAGEMENT ACTIONS
  // =====================

  const clearAllData = useCallback(async () => {
    try {
      // Clear all AsyncStorage keys
      await Promise.all([
        deleteSecureValue(SECURE_KEYS.USER_PROFILE),
        AsyncStorage.removeItem(STORAGE_KEYS.ROOMS),
        AsyncStorage.removeItem(STORAGE_KEYS.STATS),
        AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.removeItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.removeItem(STORAGE_KEYS.MASCOT),
        AsyncStorage.removeItem(STORAGE_KEYS.COLLECTION),
        AsyncStorage.removeItem(STORAGE_KEYS.COLLECTION_STATS),
      ]);

      // Clear task optimizer history
      await clearTaskHistory();

      // Reset all state to defaults
      setUser(null);
      setRooms([]);
      setStats(defaultStats);
      setSettingsState(defaultSettings);
      setActiveRoomId(null);
      setMascot(null);
      setFocusSession(null);
      setCollection([]);
      setCollectionStats(defaultCollectionStats);
      setActiveSpawn(null);
      setIsAnalyzing(false);
      setAnalysisError(null);
    } catch (error) {
      if (__DEV__) console.error('Error clearing data:', error);
      throw error;
    }
  }, []);

  const resetStats = useCallback(() => {
    setStats(defaultStats);
  }, []);

  const clearCelebration = useCallback(() => {
    setPendingCelebration([]);
  }, []);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: DeclutterState = React.useMemo(() => ({
    isLoaded,
    user,
    stats,
    rooms,
    activeRoomId,
    currentSession,
    settings,
    mascot,
    focusSession,
    collection,
    collectionStats,
    activeSpawn,
    isAnalyzing,
    analysisError,
    syncError,
    syncStatus,
    pendingCelebration,
    comebackMultiplier,
    setUser: setUserAction,
    addRoom,
    updateRoom,
    deleteRoom,
    addPhotoToRoom,
    deletePhotoFromRoom,
    setTasksForRoom,
    addTaskToRoom,
    toggleTask,
    toggleSubTask,
    deleteTask,
    restoreTask,
    updateTask,
    setActiveRoom,
    updateSettings,
    updateStats,
    startSession,
    endSession,
    setAnalyzing: setIsAnalyzing,
    setAnalysisError,
    completeOnboarding,
    createMascot,
    updateMascot: updateMascotAction,
    feedMascot: feedMascotAction,
    interactWithMascot,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    endFocusSession,
    updateFocusSession: updateFocusSessionAction,
    collectItem,
    spawnCollectible: spawnCollectibleAction,
    dismissSpawn,
    clearAllData,
    resetStats,
    clearCelebration,
    clearSyncError,
  // eslint-disable-next-line react-hooks/exhaustive-deps -- callbacks are stable useCallback refs
  }), [
    isLoaded,
    user,
    stats,
    rooms,
    activeRoomId,
    currentSession,
    settings,
    mascot,
    focusSession,
    collection,
    collectionStats,
    activeSpawn,
    isAnalyzing,
    analysisError,
    syncError,
    syncStatus,
    pendingCelebration,
    comebackMultiplier,
  ]);

  if (!isLoaded) {
    return (
      <AppBootstrapScreen
        message={
          isAuthenticated && !isAnonymous
            ? 'Loading your latest rooms, progress, and synced settings…'
            : 'Loading your rooms, progress, and settings…'
        }
      />
    );
  }

  return (
    <DeclutterContext.Provider value={value}>
      {children}
    </DeclutterContext.Provider>
  );
}

// Hook to use the context
export function useDeclutter() {
  const context = useContext(DeclutterContext);
  if (!context) {
    throw new Error('useDeclutter must be used within a DeclutterProvider');
  }
  return context;
}

// API key management — key now lives in Convex server env vars (GEMINI_API_KEY).
// These stubs are kept so existing call sites don't break.
// Run: npx convex env set GEMINI_API_KEY your_key_here

/** @deprecated — API key is server-side only; this is a no-op */
export async function saveApiKey(_apiKey: string): Promise<void> {
  // no-op — set key in Convex env vars instead
}

/** @deprecated — API key is server-side only */
export async function loadApiKey(): Promise<string | null> {
  return null;
}

/** @deprecated — API key is server-side only; this is a no-op */
export async function deleteApiKey(): Promise<void> {
  // no-op
}
