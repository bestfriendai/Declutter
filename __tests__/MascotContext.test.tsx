import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { MascotProvider, useMascot } from '../context/MascotContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MascotProvider>{children}</MascotProvider>
);

describe('MascotContext', () => {
  describe('Initial State', () => {
    it('should start with null mascot', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });
      expect(result.current.mascot).toBeNull();
    });
  });

  describe('createMascot', () => {
    it('should create a mascot with the given name and personality', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.createMascot('Buddy', 'spark');
      });

      expect(result.current.mascot).not.toBeNull();
      expect(result.current.mascot?.name).toBe('Buddy');
      expect(result.current.mascot?.personality).toBe('spark');
    });

    it('should initialize mascot with default values', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.createMascot('Test', 'bubbles');
      });

      expect(result.current.mascot?.mood).toBe('happy');
      expect(result.current.mascot?.activity).toBe('idle');
      expect(result.current.mascot?.level).toBe(1);
      expect(result.current.mascot?.xp).toBe(0);
      expect(result.current.mascot?.hunger).toBe(100);
      expect(result.current.mascot?.energy).toBe(100);
      expect(result.current.mascot?.happiness).toBe(100);
      expect(result.current.mascot?.accessories).toEqual([]);
    });
  });

  describe('feedMascot', () => {
    it('should increase hunger and happiness when fed', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.createMascot('Buddy', 'spark');
      });

      const initialHunger = result.current.mascot?.hunger ?? 0;
      const initialHappiness = result.current.mascot?.happiness ?? 0;

      act(() => {
        result.current.updateMascot({ hunger: 50, happiness: 50 });
      });

      act(() => {
        result.current.feedMascot();
      });

      expect(result.current.mascot?.hunger).toBe(70);
      expect(result.current.mascot?.happiness).toBe(60);
      expect(result.current.mascot?.activity).toBe('cheering');
    });

    it('should cap hunger at 100', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.createMascot('Buddy', 'spark');
      });

      act(() => {
        result.current.feedMascot();
      });

      expect(result.current.mascot?.hunger).toBeLessThanOrEqual(100);
    });

    it('should do nothing when mascot is null', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.feedMascot();
      });

      expect(result.current.mascot).toBeNull();
    });
  });

  describe('interactWithMascot', () => {
    it('should increase happiness when interacting', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.createMascot('Buddy', 'spark');
        result.current.updateMascot({ happiness: 50 });
      });

      act(() => {
        result.current.interactWithMascot();
      });

      expect(result.current.mascot?.happiness).toBe(65);
      expect(result.current.mascot?.activity).toBe('dancing');
    });
  });

  describe('updateMascot', () => {
    it('should update mascot properties', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.createMascot('Buddy', 'spark');
      });

      act(() => {
        result.current.updateMascot({ mood: 'excited', level: 5 });
      });

      expect(result.current.mascot?.mood).toBe('excited');
      expect(result.current.mascot?.level).toBe(5);
    });
  });

  describe('setMascotActivity', () => {
    it('should change mascot activity', () => {
      const { result } = renderHook(() => useMascot(), { wrapper });

      act(() => {
        result.current.createMascot('Buddy', 'spark');
      });

      act(() => {
        result.current.setMascotActivity('cleaning');
      });

      expect(result.current.mascot?.activity).toBe('cleaning');
    });
  });
});
