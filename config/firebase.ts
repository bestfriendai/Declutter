/**
 * Firebase Configuration
 * Initialize Firebase for authentication, database, and storage
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  Auth
} from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence is exported but types may be missing
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
// Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID',
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // Initialize auth with AsyncStorage persistence for React Native
    if (Platform.OS !== 'web') {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      auth = getAuth(app);
    }

    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }

  return { app, auth, db, storage };
}

// Initialize on import
const firebase = initializeFirebase();

export const firebaseApp = firebase.app;
export const firebaseAuth = firebase.auth;
export const firebaseDb = firebase.db;
export const firebaseStorage = firebase.storage;

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
         firebaseConfig.projectId !== 'YOUR_PROJECT_ID';
}

// Export config for debugging (without sensitive data)
export function getFirebaseConfigStatus() {
  return {
    isConfigured: isFirebaseConfigured(),
    projectId: firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
      ? firebaseConfig.projectId
      : 'Not configured',
    authDomain: firebaseConfig.authDomain !== 'YOUR_AUTH_DOMAIN'
      ? firebaseConfig.authDomain
      : 'Not configured',
  };
}
