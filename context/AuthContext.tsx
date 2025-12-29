/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  signInWithApple,
  signInAnonymously,
  resetPassword,
  updateUserProfile,
  changePassword,
  deleteAccount,
  isEmailVerified,
  resendEmailVerification,
  getCurrentUser,
  AuthResult,
} from '@/services/auth';
import { isFirebaseConfigured } from '@/config/firebase';
import {
  syncAllDataToCloud,
  loadAllDataFromCloud,
  saveUserProfile,
} from '@/services/firestore';
import { registerForPushNotifications } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth context state
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isEmailVerified: boolean;
  isFirebaseReady: boolean;
  error: string | null;
}

// Auth context actions
interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signInWithApple: () => Promise<AuthResult>;
  continueAsGuest: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  deleteAccount: (password?: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult>;
  clearError: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Storage key for offline auth state
const AUTH_STATE_KEY = '@declutterly_auth_state';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isAnonymous: false,
    isEmailVerified: false,
    isFirebaseReady: isFirebaseConfigured(),
    error: null,
  });

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isFirebaseReady: false,
      }));
      return;
    }

    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          isAnonymous: user.isAnonymous,
          isEmailVerified: user.emailVerified,
          isFirebaseReady: true,
          error: null,
        });

        // Register for push notifications
        await registerForPushNotifications();

        // Save auth state for offline access
        await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAnonymous: user.isAnonymous,
        }));
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isAnonymous: false,
          isEmailVerified: false,
          isFirebaseReady: true,
          error: null,
        });

        // Clear auth state
        await AsyncStorage.removeItem(AUTH_STATE_KEY);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await signInWithEmail(email, password);

    if (!result.success) {
      setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    }

    return result;
  }, []);

  // Sign up with email
  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await signUpWithEmail(email, password, displayName);

    if (!result.success) {
      setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    } else if (result.user) {
      // Create initial user profile in Firestore
      await saveUserProfile({
        id: result.user.uid,
        name: displayName || 'Declutterer',
        createdAt: new Date(),
        onboardingComplete: false,
      });
    }

    return result;
  }, []);

  // Sign out
  const handleSignOut = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    await authSignOut();
  }, []);

  // Sign in with Apple
  const handleAppleSignIn = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await signInWithApple();

    if (!result.success) {
      setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    } else if (result.user) {
      // Create initial user profile if new user
      const profile = await loadAllDataFromCloud();
      if (!profile?.profile) {
        await saveUserProfile({
          id: result.user.uid,
          name: result.user.displayName || 'Declutterer',
          createdAt: new Date(),
          onboardingComplete: false,
        });
      }
    }

    return result;
  }, []);

  // Continue as guest (anonymous auth)
  const continueAsGuest = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await signInAnonymously();

    if (!result.success) {
      setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    }

    return result;
  }, []);

  // Reset password
  const handleResetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    setState(prev => ({ ...prev, error: null }));
    return resetPassword(email);
  }, []);

  // Update profile
  const handleUpdateProfile = useCallback(async (
    updates: { displayName?: string; photoURL?: string }
  ): Promise<AuthResult> => {
    setState(prev => ({ ...prev, error: null }));
    return updateUserProfile(updates);
  }, []);

  // Change password
  const handleChangePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> => {
    setState(prev => ({ ...prev, error: null }));
    return changePassword(currentPassword, newPassword);
  }, []);

  // Delete account
  const handleDeleteAccount = useCallback(async (password?: string): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await deleteAccount(password);

    if (!result.success) {
      setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    }

    return result;
  }, []);

  // Resend verification email
  const handleResendVerification = useCallback(async (): Promise<AuthResult> => {
    return resendEmailVerification();
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Sync local data to cloud
  const syncToCloud = useCallback(async (): Promise<void> => {
    // This will be called from DeclutterContext with the actual data
  }, []);

  // Load data from cloud
  const loadFromCloud = useCallback(async () => {
    if (!state.isAuthenticated) return null;
    return loadAllDataFromCloud();
  }, [state.isAuthenticated]);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut: handleSignOut,
    signInWithApple: handleAppleSignIn,
    continueAsGuest,
    resetPassword: handleResetPassword,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
    deleteAccount: handleDeleteAccount,
    resendVerification: handleResendVerification,
    clearError,
    syncToCloud,
    loadFromCloud,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check if user needs to complete profile
export function useNeedsProfile(): boolean {
  const { user, isAuthenticated, isAnonymous } = useAuth();
  return isAuthenticated && !isAnonymous && !!user;
}
