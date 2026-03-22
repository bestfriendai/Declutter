/**
 * useTimer — Shared timer hook for Blitz, Focus, and Single Task screens
 *
 * Provides consistent timer behavior:
 * - Auto-pause on app background
 * - Start/pause/toggle/reset/extend controls
 * - Completion detection with callback
 * - Progress calculation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface TimerOptions {
  initialSeconds: number;
  autoStart?: boolean;
  pauseOnBackground?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

export function useTimer({
  initialSeconds,
  autoStart = false,
  pauseOnBackground = true,
  onComplete,
  onTick,
}: TimerOptions) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const initialSecondsRef = useRef(initialSeconds);
  initialSecondsRef.current = initialSeconds;

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev <= 1 ? 0 : prev - 1;
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Completion detection
  useEffect(() => {
    if (isRunning && remaining === 0) {
      setIsRunning(false);
      setIsComplete(true);
      onCompleteRef.current?.();
    }
  }, [remaining, isRunning]);

  // Tick callback
  useEffect(() => {
    if (isRunning) {
      onTickRef.current?.(remaining);
    }
  }, [remaining, isRunning]);

  // Background handling
  useEffect(() => {
    if (!pauseOnBackground) return;
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        if (isRunningRef.current) setIsRunning(false);
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [pauseOnBackground]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsComplete(false);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);

  const toggle = useCallback(() => setIsRunning(r => !r), []);

  const reset = useCallback((newSeconds?: number) => {
    setIsRunning(false);
    setIsComplete(false);
    setRemaining(newSeconds ?? initialSecondsRef.current);
  }, []);

  const extend = useCallback((seconds: number) => {
    setRemaining(r => r + seconds);
    setIsComplete(false);
  }, []);

  const setSeconds = useCallback((seconds: number) => {
    setRemaining(seconds);
    setIsComplete(false);
  }, []);

  return {
    remaining,
    isRunning,
    isComplete,
    progress: initialSeconds > 0 ? remaining / initialSeconds : 0,
    elapsed: initialSeconds - remaining,
    start,
    pause,
    toggle,
    reset,
    extend,
    setSeconds,
    setIsRunning,
  };
}
