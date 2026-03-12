/**
 * Declutterly - Mascot Context
 * State management for the virtual pet mascot companion
 */

import {
    Mascot,
    MascotMood,
    MascotPersonality,
} from '@/types/declutter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = '@declutterly_mascot';

interface MascotContextType {
  mascot: Mascot | null;
  createMascot: (name: string, personality: MascotPersonality) => void;
  updateMascot: (updates: Partial<Mascot>) => void;
  feedMascot: () => void;
  interactWithMascot: () => void;
  setMascotActivity: (activity: Mascot['activity']) => void;
}

export const MascotContext = createContext<MascotContextType | null>(null);

export function MascotProvider({ children }: { children: ReactNode }) {
  const [mascot, setMascot] = useState<Mascot | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Refs for timeout cleanup
  const feedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadMascot();
  }, []);

  useEffect(() => {
    if (isLoaded && mascot) {
      saveMascot();
    }
  }, [mascot, isLoaded]);

  const updateMascotStatusRef = useRef<() => void>(() => {});

  updateMascotStatusRef.current = () => {
    if (!mascot) return;

    const now = new Date();
    const hoursSinceInteraction = (now.getTime() - new Date(mascot.lastInteraction).getTime()) / (1000 * 60 * 60);
    const hoursSinceFed = (now.getTime() - new Date(mascot.lastFed).getTime()) / (1000 * 60 * 60);

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
    }, 60000);

    return () => clearInterval(interval);
  }, [!!mascot]);

  const loadMascot = async () => {
    try {
      const mascotStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (mascotStr) {
        const mascotData = JSON.parse(mascotStr);
        mascotData.lastFed = new Date(mascotData.lastFed);
        mascotData.lastInteraction = new Date(mascotData.lastInteraction);
        mascotData.createdAt = new Date(mascotData.createdAt);
        setMascot(mascotData);
      }
    } catch (error) {
      console.error('Error loading mascot:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveMascot = async () => {
    try {
      if (mascot) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mascot));
      }
    } catch (error) {
      console.error('Error saving mascot:', error);
    }
  };

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

  const updateMascot = useCallback((updates: Partial<Mascot>) => {
    setMascot(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const feedMascot = useCallback(() => {
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

    // Clear existing timeout before setting new one
    if (feedTimeoutRef.current) {
      clearTimeout(feedTimeoutRef.current);
    }
    feedTimeoutRef.current = setTimeout(() => {
      setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
    }, 2000);
  }, [mascot]);

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

    // Clear existing timeout before setting new one
    if (interactTimeoutRef.current) {
      clearTimeout(interactTimeoutRef.current);
    }
    interactTimeoutRef.current = setTimeout(() => {
      setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
    }, 3000);
  }, [mascot]);

  const setMascotActivity = useCallback((activity: Mascot['activity']) => {
    setMascot(prev => prev ? { ...prev, activity } : null);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (feedTimeoutRef.current) {
        clearTimeout(feedTimeoutRef.current);
      }
      if (interactTimeoutRef.current) {
        clearTimeout(interactTimeoutRef.current);
      }
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<MascotContextType>(() => ({
    mascot,
    createMascot,
    updateMascot,
    feedMascot,
    interactWithMascot,
    setMascotActivity,
  }), [mascot, createMascot, updateMascot, feedMascot, interactWithMascot, setMascotActivity]);

  return (
    <MascotContext.Provider value={value}>
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  const context = React.useContext(MascotContext);
  if (!context) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
}
