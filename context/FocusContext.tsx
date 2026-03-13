/**
 * Declutterly - Focus Context
 * State management for focus/pomodoro sessions
 */

import { FocusSession } from '@/types/declutter';
import React, { createContext, ReactNode, useCallback, useMemo, useState } from 'react';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface FocusContextType {
  focusSession: FocusSession | null;
  startFocusSession: (duration: number, roomId?: string) => void;
  pauseFocusSession: () => void;
  resumeFocusSession: () => void;
  endFocusSession: () => number;
  updateFocusSession: (updates: Partial<FocusSession>) => void;
  incrementTasksCompleted: () => void;
}

export const FocusContext = createContext<FocusContextType | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);

  const startFocusSession = useCallback((duration: number, roomId?: string) => {
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
  }, []);

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

  const endFocusSession = useCallback((): number => {
    const session = focusSession;
    const bonusXp = session
      ? Math.floor((session.duration * 60 - session.remainingSeconds) / 60) * 2
      : 0;
    setFocusSession(null);
    return bonusXp;
  }, [focusSession]);

  const updateFocusSession = useCallback((updates: Partial<FocusSession>) => {
    setFocusSession(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const incrementTasksCompleted = useCallback(() => {
    setFocusSession(prev => prev ? {
      ...prev,
      tasksCompletedDuringSession: prev.tasksCompletedDuringSession + 1,
    } : null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<FocusContextType>(() => ({
    focusSession,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    endFocusSession,
    updateFocusSession,
    incrementTasksCompleted,
  }), [focusSession, startFocusSession, pauseFocusSession, resumeFocusSession, endFocusSession, updateFocusSession, incrementTasksCompleted]);

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = React.useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
