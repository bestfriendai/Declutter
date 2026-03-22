/**
 * Authentication Context
 * Manages user authentication state across the app using Convex Auth.
 */

import { api } from '@/convex/_generated/api';
import { convex } from '@/config/convex';
import { registerForPushNotifications } from '@/services/notifications';
import { Notifications, notificationsAvailable } from '@/services/notificationsRuntime';
import {
  deleteSecureValue,
  SECURE_KEYS,
  saveSecureJson,
} from '@/services/secureStorage';
import {
  AppSettings,
  CollectedItem,
  CollectionStats,
  Mascot,
  Room,
  UserProfile,
  UserStats,
} from '@/types/declutter';
import { useAuthActions } from '@convex-dev/auth/react';
import NetInfo from '@react-native-community/netinfo';
import { useConvexAuth, useQuery } from 'convex/react';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isEmailVerified: boolean;
  isAuthReady: boolean;
  error: string | null;
}

export interface SyncData {
  profile?: UserProfile;
  rooms: Room[];
  stats: UserStats;
  settings: AppSettings;
  mascot?: Mascot;
  collection: CollectedItem[];
  collectionStats: CollectionStats;
}

interface CloudUserState {
  profile?: UserProfile | null;
  rooms: Room[];
  stats: UserStats;
  settings: AppSettings;
  mascot?: Mascot | null;
  collection: CollectedItem[];
  collectionStats: CollectionStats;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<AuthResult>;
  upgradeFromGuest: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<AuthResult>;
  updateProfile: (updates: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<AuthResult>;
  deleteAccount: (password?: string) => Promise<AuthResult>;
  clearError: () => void;
  syncToCloud: (data: SyncData) => Promise<void>;
  loadFromCloud: () => Promise<CloudUserState | null>;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'An unexpected authentication error occurred.';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const MIN_PASSWORD_LENGTH = 8;

function toSerializableData<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function mapUser(user: unknown): AuthUser | null {
  if (!isRecord(user) || !user._id) return null;
  return {
    uid: String(user._id),
    email: typeof user.email === 'string' ? user.email : null,
    displayName: typeof user.name === 'string' ? user.name : null,
    photoURL: typeof user.avatar === 'string' ? user.avatar : null,
    isAnonymous: !!user.isAnonymous,
    emailVerified: !!user.emailVerificationTime || !user.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { signIn: authSignIn, signOut: authSignOut } = useAuthActions();
  const { isAuthenticated, isLoading: authIsLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.get, isAuthenticated ? {} : 'skip');

  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingAuthAction, setPendingAuthAction] = useState(false);

  const user = useMemo(() => mapUser(currentUser), [currentUser]);
  const isResolvingUser = isAuthenticated && currentUser === undefined;
  const isLoading = authIsLoading || pendingAuthAction || isResolvingUser;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      void deleteSecureValue(SECURE_KEYS.AUTH_STATE);
      return;
    }

    void (async () => {
      await saveSecureJson(SECURE_KEYS.AUTH_STATE, user);

      try {
        if (!notificationsAvailable) {
          return;
        }

        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const token = await registerForPushNotifications();
        if (token) {
          await convex.mutation(api.notifications.savePushToken, { token });
        }
      } catch (pushError) {
        if (__DEV__) console.error('Failed to sync push token after auth:', pushError);
      }
    })();
  }, [isAuthenticated, user]);

  const runAuthFlow = useCallback(
    async (
      provider: string,
      params?: Record<string, string | boolean | number | undefined>
    ): Promise<AuthResult> => {
      setPendingAuthAction(true);
      setError(null);

      try {
        const cleanedParams = Object.fromEntries(
          Object.entries(params ?? {}).filter(([, value]) => value !== undefined)
        ) as Record<string, string | boolean | number>;
        const result = await authSignIn(provider, cleanedParams);
        if (!result.signingIn) {
          throw new Error('Additional verification is not configured for this sign-in flow.');
        }
        return { success: true };
      } catch (authError) {
        const message = getErrorMessage(authError);
        setError(message);
        return { success: false, error: message };
      } finally {
        setPendingAuthAction(false);
      }
    },
    [authSignIn]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
      }
      return runAuthFlow('password', {
        flow: 'signIn',
        email: normalizeEmail(email),
        password,
      });
    },
    [runAuthFlow]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<AuthResult> => {
      if (!isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
      }
      return runAuthFlow('password', {
        flow: 'signUp',
        email: normalizeEmail(email),
        password,
        name: displayName?.trim() || undefined,
      });
    },
    [runAuthFlow]
  );

  const signOut = useCallback(async (): Promise<void> => {
    setPendingAuthAction(true);
    setError(null);

    try {
      // Remove push token from backend before signing out
      try {
        await convex.mutation(api.notifications.removePushToken, {});
      } catch {
        // Best-effort: don't block sign out if token removal fails
      }
      await authSignOut();
      await deleteSecureValue(SECURE_KEYS.AUTH_STATE);
    } finally {
      setPendingAuthAction(false);
    }
  }, [authSignOut]);

  const continueAsGuest = useCallback(
    async (): Promise<AuthResult> => runAuthFlow('anonymous'),
    [runAuthFlow]
  );

  const upgradeFromGuest = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<AuthResult> => {
      if (!user?.isAnonymous) {
        return { success: false, error: 'Current user is not a guest account.' };
      }

      setPendingAuthAction(true);
      setError(null);

      try {
        // 1. Snapshot current user data from the cloud before switching accounts
        let existingData: CloudUserState | null = null;
        try {
          existingData = await convex.query(api.sync.getUserState, {}) as CloudUserState | null;
        } catch {
          // Best-effort: if snapshot fails we still proceed with upgrade
        }

        // 2. Sign out the anonymous session
        await authSignOut();

        // 3. Create the new account with email + password
        const signUpResult = await authSignIn('password', {
          flow: 'signUp',
          email: normalizeEmail(email),
          password,
          name: displayName?.trim() || '',
        });

        if (!signUpResult.signingIn) {
          throw new Error('Failed to create account during upgrade.');
        }

        // 4. Migrate the guest data to the new account
        // TODO: Backend needs a `sync.migrateFromGuest` mutation that accepts
        // the snapshotted data and merges it into the newly created user.
        // For now, re-upload via replaceUserState if we have data.
        if (existingData) {
          try {
            await convex.mutation(api.sync.replaceUserState, {
              profile: existingData.profile,
              rooms: existingData.rooms,
              stats: existingData.stats,
              settings: existingData.settings,
              mascot: existingData.mascot,
              collection: existingData.collection,
              collectionStats: existingData.collectionStats,
            });
          } catch {
            // Best-effort migration; user can re-sync later
          }
        }

        return { success: true };
      } catch (upgradeError) {
        const message = getErrorMessage(upgradeError);
        setError(message);
        return { success: false, error: message };
      } finally {
        setPendingAuthAction(false);
      }
    },
    [authSignIn, authSignOut, user]
  );

  const updateProfile = useCallback(
    async (updates: { displayName?: string; photoURL?: string }): Promise<AuthResult> => {
      if (!user) {
        return { success: false, error: 'No user signed in.' };
      }

      try {
        await convex.mutation(api.users.update, {
          name: updates.displayName,
          avatar: updates.photoURL,
        });
        return {
          success: true,
          user: {
            ...user,
            displayName: updates.displayName ?? user.displayName,
            photoURL: updates.photoURL ?? user.photoURL,
          },
        };
      } catch (updateError) {
        const message = getErrorMessage(updateError);
        setError(message);
        return { success: false, error: message };
      }
    },
    [user]
  );

  const deleteAccount = useCallback(
    async (_password?: string): Promise<AuthResult> => {
      if (!user) {
        return { success: false, error: 'No user signed in.' };
      }

      setPendingAuthAction(true);
      setError(null);

      try {
        await convex.mutation(api.users.deleteAccount, {});
        await authSignOut();
        await deleteSecureValue(SECURE_KEYS.AUTH_STATE);
        return { success: true };
      } catch (deleteError) {
        const message = getErrorMessage(deleteError);
        setError(message);
        return { success: false, error: message };
      } finally {
        setPendingAuthAction(false);
      }
    },
    [authSignOut, user]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const syncStatusRef = useRef<SyncStatus>('idle');
  const syncToCloud = useCallback(async (_data: SyncData): Promise<void> => {
    if (!isAuthenticated) return;

    syncStatusRef.current = 'syncing';

    try {
      const data = toSerializableData(_data);
      await convex.mutation(api.sync.replaceUserState, {
        profile: data.profile,
        rooms: data.rooms,
        stats: data.stats,
        settings: data.settings,
        mascot: data.mascot,
        collection: data.collection,
        collectionStats: data.collectionStats,
      });
      syncStatusRef.current = 'success';
      setLastSyncTime(new Date());
    } catch (syncError) {
      const message = getErrorMessage(syncError);
      if (__DEV__) console.error('Convex sync failed:', syncError);
      setError(message);
      syncStatusRef.current = 'error';
    }
  }, [isAuthenticated]);

  const loadFromCloud = useCallback(async (): Promise<CloudUserState | null> => {
    if (!isAuthenticated) return null;
    return convex.query(api.sync.getUserState, {}) as Promise<CloudUserState | null>;
  }, [isAuthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isAnonymous: !!user?.isAnonymous,
      isEmailVerified: !!user?.emailVerified,
      isAuthReady: !authIsLoading,
      error,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      upgradeFromGuest,
      updateProfile,
      deleteAccount,
      clearError,
      syncToCloud,
      loadFromCloud,
      syncStatus: syncStatusRef.current,
      lastSyncTime,
      isOnline,
    }),
    [
      authIsLoading,
      clearError,
      continueAsGuest,
      deleteAccount,
      error,
      isAuthenticated,
      isLoading,
      isOnline,
      lastSyncTime,
      loadFromCloud,
      signIn,
      signOut,
      signUp,
      syncToCloud,
      updateProfile,
      upgradeFromGuest,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useNeedsProfile(): boolean {
  const { user, isAuthenticated, isAnonymous } = useAuth();
  return isAuthenticated && !isAnonymous && !!user;
}
