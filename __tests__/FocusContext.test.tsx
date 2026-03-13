import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { FocusProvider, useFocus } from '../context/FocusContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FocusProvider>{children}</FocusProvider>
);

describe('FocusContext', () => {
  describe('Initial State', () => {
    it('should start with null focus session', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });
      expect(result.current.focusSession).toBeNull();
    });
  });

  describe('startFocusSession', () => {
    it('should create a focus session with specified duration', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25);
      });

      expect(result.current.focusSession).not.toBeNull();
      expect(result.current.focusSession?.duration).toBe(25);
      expect(result.current.focusSession?.remainingSeconds).toBe(25 * 60);
      expect(result.current.focusSession?.isActive).toBe(true);
      expect(result.current.focusSession?.isPaused).toBe(false);
    });

    it('should associate session with room if provided', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25, 'room-123');
      });

      expect(result.current.focusSession?.roomId).toBe('room-123');
    });

    it('should initialize task counter to zero', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25);
      });

      expect(result.current.focusSession?.tasksCompletedDuringSession).toBe(0);
    });
  });

  describe('pauseFocusSession', () => {
    it('should pause an active session', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25);
      });

      act(() => {
        result.current.pauseFocusSession();
      });

      expect(result.current.focusSession?.isPaused).toBe(true);
      expect(result.current.focusSession?.pausedAt).toBeDefined();
    });
  });

  describe('resumeFocusSession', () => {
    it('should resume a paused session', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25);
        result.current.pauseFocusSession();
      });

      act(() => {
        result.current.resumeFocusSession();
      });

      expect(result.current.focusSession?.isPaused).toBe(false);
      expect(result.current.focusSession?.pausedAt).toBeUndefined();
    });
  });

  describe('endFocusSession', () => {
    it('should end session and return bonus XP', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25);
      });

      act(() => {
        result.current.updateFocusSession({ remainingSeconds: 0 });
      });

      let bonusXp = 0;
      act(() => {
        bonusXp = result.current.endFocusSession();
      });

      expect(result.current.focusSession).toBeNull();
      expect(bonusXp).toBe(50);
    });

    it('should calculate XP based on time spent', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(10);
      });

      act(() => {
        result.current.updateFocusSession({ remainingSeconds: 300 });
      });

      let bonusXp = 0;
      act(() => {
        bonusXp = result.current.endFocusSession();
      });

      expect(bonusXp).toBe(10);
    });
  });

  describe('incrementTasksCompleted', () => {
    it('should increment tasks completed counter', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25);
      });

      act(() => {
        result.current.incrementTasksCompleted();
      });

      expect(result.current.focusSession?.tasksCompletedDuringSession).toBe(1);

      act(() => {
        result.current.incrementTasksCompleted();
        result.current.incrementTasksCompleted();
      });

      expect(result.current.focusSession?.tasksCompletedDuringSession).toBe(3);
    });
  });

  describe('updateFocusSession', () => {
    it('should update session properties', () => {
      const { result } = renderHook(() => useFocus(), { wrapper });

      act(() => {
        result.current.startFocusSession(25);
      });

      act(() => {
        result.current.updateFocusSession({
          remainingSeconds: 500,
          distractionAttempts: 3,
        });
      });

      expect(result.current.focusSession?.remainingSeconds).toBe(500);
      expect(result.current.focusSession?.distractionAttempts).toBe(3);
    });
  });
});
