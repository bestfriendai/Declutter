/**
 * Authentication Context
 * Manages user authentication state across the app using Convex Auth.
 */

import { api } from '@/convex/_generated/api';
import { convex } from '@/config/convex';
import { registerForPushNotifications } from '@/services/notifications';
import { Notifications, notificationsAvailable } from '@/services/notificationsRuntime';
import { useAuthActions } from '@convex-dev/auth/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useConvexAuth, useQuery } from 'convex/react';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  profile?: any;
  rooms: any[];
  stats: any;
  settings: any;
  mascot?: any;
  collection: any[];
  collectionStats: any;
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
  updateProfile: (updates: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<AuthResult>;
  deleteAccount: (password?: string) => Promise<AuthResult>;
  clearError: () => void;
  syncToCloud: (data: SyncData) => Promise<void>;
  loadFromCloud: () => Promise<any>;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_STATE_KEY = '@declutterly_auth_state';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'An unexpected authentication error occurred.';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSerializableData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function mapUser(user: any | null | undefined): AuthUser | null {
  if (!user?._id) return null;
  return {
    uid: String(user._id),
    email: user.email ?? null,
    displayName: user.name ?? null,
    photoURL: user.avatar ?? null,
    isAnonymous: !!user.isAnonymous,
    emailVerified: !!user.emailVerificationTime || !user.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { signIn: authSignIn, signOut: authSignOut } = useAuthActions();
  const { isAuthenticated, isLoading: authIsLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.get, isAuthenticated ? {} : 'skip');

  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
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
      void AsyncStorage.removeItem(AUTH_STATE_KEY);
      return;
    }

    void (async () => {
      await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(user));

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
        console.error('Failed to sync push token after auth:', pushError);
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
    async (email: string, password: string): Promise<AuthResult> =>
      runAuthFlow('password', {
        flow: 'signIn',
        email: normalizeEmail(email),
        password,
      }),
    [runAuthFlow]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<AuthResult> =>
      runAuthFlow('password', {
        flow: 'signUp',
        email: normalizeEmail(email),
        password,
        name: displayName?.trim() || undefined,
      }),
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
      await AsyncStorage.removeItem(AUTH_STATE_KEY);
    } finally {
      setPendingAuthAction(false);
    }
  }, [authSignOut]);

  const continueAsGuest = useCallback(
    async (): Promise<AuthResult> => runAuthFlow('anonymous'),
    [runAuthFlow]
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
        await AsyncStorage.removeItem(AUTH_STATE_KEY);
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

  const syncToCloud = useCallback(async (_data: SyncData): Promise<void> => {
    if (!isAuthenticated) return;

    setSyncStatus('syncing');

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
      setSyncStatus('success');
      setLastSyncTime(new Date());

      setTimeout(() => {
        setSyncStatus('idle');
      }, 1000);
    } catch (syncError) {
      const message = getErrorMessage(syncError);
      console.error('Convex sync failed:', syncError);
      setError(message);
      setSyncStatus('error');

      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    }
  }, [isAuthenticated]);

  const loadFromCloud = useCallback(async () => {
    if (!isAuthenticated) return null;
    return convex.query(api.sync.getUserState, {});
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
      updateProfile,
      deleteAccount,
      clearError,
      syncToCloud,
      loadFromCloud,
      syncStatus,
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
      syncStatus,
      syncToCloud,
      updateProfile,
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
