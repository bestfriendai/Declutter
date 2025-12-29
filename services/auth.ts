/**
 * Authentication Service
 * Handles user authentication with Firebase Auth
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '@/config/firebase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Auth error codes for user-friendly messages
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
};

// Get user-friendly error message
function getAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  return AUTH_ERROR_MESSAGES[code] || error?.message || 'An unexpected error occurred.';
}

// Auth result type
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Current user
export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured()) return null;
  return firebaseAuth.currentUser;
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );

    // Update display name if provided
    if (displayName && credential.user) {
      await updateProfile(credential.user, { displayName });
    }

    // Send email verification
    if (credential.user) {
      await sendEmailVerification(credential.user);
    }

    return { success: true, user: credential.user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Sign in with email and password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    return { success: true, user: credential.user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Sign out
export async function signOut(): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    await firebaseSignOut(firebaseAuth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Reset password
export async function resetPassword(email: string): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    await sendPasswordResetEmail(firebaseAuth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Update user profile
export async function updateUserProfile(updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  const user = firebaseAuth.currentUser;
  if (!user) {
    return { success: false, error: 'No user signed in' };
  }

  try {
    await updateProfile(user, updates);
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Change password
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  const user = firebaseAuth.currentUser;
  if (!user || !user.email) {
    return { success: false, error: 'No user signed in' };
  }

  try {
    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Delete user account
export async function deleteAccount(password?: string): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  const user = firebaseAuth.currentUser;
  if (!user) {
    return { success: false, error: 'No user signed in' };
  }

  try {
    // Re-authenticate if email user
    if (password && user.email) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }

    await deleteUser(user);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Sign in with Apple (iOS only)
export async function signInWithApple(): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Apple Sign-In is only available on iOS' };
  }

  try {
    // Check if Apple Sign-In is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'Apple Sign-In is not available on this device' };
    }

    // Get Apple credentials
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    // Create Firebase credential
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: appleCredential.identityToken!,
    });

    // Sign in with Firebase
    const userCredential = await signInWithCredential(firebaseAuth, credential);

    // Update display name if available (Apple only provides name on first sign-in)
    if (appleCredential.fullName?.givenName && userCredential.user) {
      const displayName = [
        appleCredential.fullName.givenName,
        appleCredential.fullName.familyName,
      ].filter(Boolean).join(' ');

      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
    }

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    // Handle user cancellation
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'Sign-in cancelled' };
    }
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Subscribe to auth state changes
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(firebaseAuth, callback);
}

// Check if user email is verified
export function isEmailVerified(): boolean {
  const user = firebaseAuth.currentUser;
  return user?.emailVerified ?? false;
}

// Resend email verification
export async function resendEmailVerification(): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  const user = firebaseAuth.currentUser;
  if (!user) {
    return { success: false, error: 'No user signed in' };
  }

  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Get user ID token for backend calls
export async function getUserIdToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  const user = firebaseAuth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

// Anonymous sign-in for users who don't want to create an account
export async function signInAnonymously(): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const { signInAnonymously: firebaseSignInAnonymously } = await import('firebase/auth');
    const credential = await firebaseSignInAnonymously(firebaseAuth);
    return { success: true, user: credential.user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}

// Link anonymous account to email
export async function linkAnonymousToEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  const user = firebaseAuth.currentUser;
  if (!user || !user.isAnonymous) {
    return { success: false, error: 'No anonymous user to link' };
  }

  try {
    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(user, credential);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
}
