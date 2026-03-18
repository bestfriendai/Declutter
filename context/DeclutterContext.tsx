/**
 * Declutterly - App Context
 * Global state management for the declutter app
 */

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { convex } from '@/config/convex';
import { defaultCollectionStats, defaultSettings, defaultStats } from '@/constants/defaultState';
import { Time } from '@/constants/time';
import { SyncData, useAuth } from '@/context/AuthContext';
import { setForcedColorScheme } from '@/hooks/useColorScheme';
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
import {
  deleteSecureValue,
  loadSecureJson,
  saveSecureJson,
  SECURE_KEYS,
} from '@/services/secureStorage';
import { AppBootstrapScreen } from '@/components/ui/AppBootstrapScreen';
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
  SpawnEvent,
  UserProfile,
  UserStats,
} from '@/types/declutter';
import { toConvexId } from '@/utils/convexIds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Storage keys
const STORAGE_KEYS = {
  ROOMS: '@declutterly_rooms',
  STATS: '@declutterly_stats',
  SETTINGS: '@declutterly_settings',
  API_KEY: '@declutterly_api_key',
  MASCOT: '@declutterly_mascot',
  COLLECTION: '@declutterly_collection',
  COLLECTION_STATS: '@declutterly_collection_stats',
};

// Create context
export const DeclutterContext = createContext<DeclutterState | null>(null);

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Provider component
export function DeclutterProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<CleaningSession | null>(null);
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

  // Sync error state
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isHydratingCloud, setIsHydratingCloud] = useState(false);
  // Ref-based hydration guard: ensures the sync effect never fires in the same
  // React commit that applyCloudData set new state values, even if React
  // batches the setState(false) together with the data updates.
  const isHydratingCloudRef = useRef(false);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data when it changes (skip during cloud hydration to avoid
  // writing partially-applied cloud state to disk)
  useEffect(() => {
    if (isLoaded && !isHydratingCloudRef.current) {
      saveData();
    }
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

    return () => {
      cancelled = true;
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

      syncToCloud(syncData).catch(error => {
        if (__DEV__) console.error('Background sync failed:', error);
        setSyncError('Unable to sync your data. Changes saved locally.');
      });
    }, Time.CLOUD_SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, rooms, stats, settings, mascot, collection, collectionStats, isLoaded, isAuthenticated, isAnonymous, isHydratingCloud, syncToCloud]);

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
  }, []);

  const deleteRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    setActiveRoomId(prev => prev === roomId ? null : prev);
  }, []);

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
  }, []);

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

    // Reset activity after animation - with cleanup
    clearMascotActivityTimeout();
    mascotActivityTimeoutRef.current = setTimeout(() => {
      setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
    }, Time.MASCOT_SHORT_ACTIVITY_MS);
  }, [mascot, clearMascotActivityTimeout]);

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

    // Roll for spawn
    const roll = Math.random();
    let cumulative = 0;

    for (const collectible of eligible) {
      cumulative += collectible.spawnChance;
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

    setRooms(prev => {
      const room = prev.find(r => r.id === roomId);
      const task = room?.tasks.find(t => t.id === taskId);

      if (!task) return prev;

      const wasCompleted = task.completed;
      taskMinutes = task.estimatedMinutes;

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

          const newXp = prevStats.xp + 10 + (roomJustCompleted ? 50 : 0);
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
          }

          return updatedStats;
        });

        // Update current session if active
        if (currentSession) {
          setCurrentSession(prev => prev ? {
            ...prev,
            tasksCompletedIds: [...prev.tasksCompletedIds, taskId],
          } : null);
        }

        if (mascot) {
          feedMascotAction();
        }

        if (settings.arCollectionEnabled) {
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

        // Record daily activity for analytics (fire and forget)
        if (isAuthenticated && !isAnonymous) {
          convex.mutation(api.activityLog.recordDailyActivity, {
            tasksCompleted: 1,
            minutesCleaned: taskMinutes || 5,
          }).catch(() => {});
        }

        // Check for variable reward every 3rd task (fire and forget)
        if (isAuthenticated && !isAnonymous) {
          // Read the latest totalTasksCompleted from the stats update above
          setStats(prevStats => {
            const count = prevStats.totalTasksCompleted;
            if (count > 0 && count % 3 === 0) {
              convex.mutation(api.variableRewards.checkForReward, {
                taskCount: count,
              }).catch(() => {});
            }
            return prevStats; // no change, just reading
          });
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

        // Remove from current session if active
        if (currentSession) {
          setCurrentSession(prev => prev ? {
            ...prev,
            tasksCompletedIds: prev.tasksCompletedIds.filter(id => id !== taskId),
          } : null);
        }
      }
    });
  }, [mascot, focusSession?.isActive, settings.arCollectionEnabled, feedMascotAction, spawnCollectibleAction, currentSession, isAuthenticated, isAnonymous]);

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
  }, []);

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
  }, []);

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

  const startSession = useCallback((roomId: string, focusMode: boolean) => {
    const session: CleaningSession = {
      id: generateId(),
      roomId,
      startedAt: new Date(),
      tasksCompletedIds: [],
      focusMode,
    };
    setCurrentSession(session);
  }, []);

  const endSession = useCallback(() => {
    // Simply end the session - streak updates are now handled in toggleTask
    setCurrentSession(prevSession => {
      if (prevSession && prevSession.tasksCompletedIds.length > 0) {
        // Session had tasks completed - good job!
        // Streak was already updated when tasks were toggled
      }
      return null;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setUser(prev => prev ? { ...prev, onboardingComplete: true } : null);
  }, []);

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
  }, []);

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
        lastCollected: new Date(),
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

    // Mascot gets excited - with cleanup
    if (mascot) {
      setMascot(prev => prev ? { ...prev, activity: 'cheering', mood: 'excited' } : null);
      clearMascotActivityTimeout();
      mascotActivityTimeoutRef.current = setTimeout(() => {
        setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
      }, Time.MASCOT_SHORT_ACTIVITY_MS);
    }
  }, [mascot, clearMascotActivityTimeout]);

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

      // Reset all state to defaults
      setUser(null);
      setRooms([]);
      setStats(defaultStats);
      setSettingsState(defaultSettings);
      setActiveRoomId(null);
      setCurrentSession(null);
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
    pendingCelebration,
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
    pendingCelebration,
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
