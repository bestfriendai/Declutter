/**
 * useTodaysTasks — Curates 5-7 daily tasks from multiple sources
 *
 * Sources (in priority order):
 * 1. Incomplete tasks from rooms with lowest freshness scores
 * 2. Quick wins (tasks under 3 minutes) from any active room
 * 3. A "One Tiny Thing" micro-task from the comeback engine
 *
 * Capped at 7 to prevent overwhelm (ADHD-friendly).
 */

import { useMemo } from 'react';
import { Room, CleaningTask } from '@/types/declutter';
import { getMostUrgentRoom } from '@/hooks/useRoomFreshness';
import { getOneTinyThingTask, type OneTinyThingTask } from '@/services/comebackEngine';

export interface TodayTask {
  id: string;
  title: string;
  emoji: string;
  roomId: string;
  roomName: string;
  estimatedMinutes: number;
  completed: boolean;
  source: 'freshness' | 'quick-win' | 'tiny-thing';
  originalTask?: CleaningTask;
  tinyTask?: OneTinyThingTask;
}

const MAX_DAILY_TASKS = 7;
const MIN_DAILY_TASKS = 5;

export function useTodaysTasks(rooms: Room[]): TodayTask[] {
  return useMemo(() => {
    if (rooms.length === 0) return [];

    const tasks: TodayTask[] = [];
    const usedTaskIds = new Set<string>();

    // --- Source 1: Tasks from rooms with lowest freshness ---
    // Sort rooms by urgency (lowest freshness first)
    const urgentRoom = getMostUrgentRoom(rooms);
    const roomsByUrgency = [...rooms].sort((a, b) => {
      // Simple sort: rooms with more incomplete tasks and lower progress first
      const aScore = (100 - a.currentProgress) + ((a.tasks || []).filter(t => !t.completed).length * 5);
      const bScore = (100 - b.currentProgress) + ((b.tasks || []).filter(t => !t.completed).length * 5);
      return bScore - aScore;
    });

    // Prioritize the most urgent room
    if (urgentRoom) {
      const urgentRoomData = rooms.find(r => r.id === urgentRoom.roomId);
      if (urgentRoomData) {
        const incompleteTasks = (urgentRoomData.tasks || [])
          .filter(t => !t.completed)
          .sort((a, b) => {
            // Prioritize high visual impact, then low estimated time
            const aImpact = a.visualImpact === 'high' ? 0 : a.visualImpact === 'medium' ? 1 : 2;
            const bImpact = b.visualImpact === 'high' ? 0 : b.visualImpact === 'medium' ? 1 : 2;
            if (aImpact !== bImpact) return aImpact - bImpact;
            return (a.estimatedMinutes || 5) - (b.estimatedMinutes || 5);
          })
          .slice(0, 3);

        for (const task of incompleteTasks) {
          if (usedTaskIds.has(task.id)) continue;
          usedTaskIds.add(task.id);
          tasks.push({
            id: task.id,
            title: task.title,
            emoji: task.emoji,
            roomId: urgentRoomData.id,
            roomName: urgentRoomData.name,
            estimatedMinutes: task.estimatedMinutes || 5,
            completed: false,
            source: 'freshness',
            originalTask: task,
          });
        }
      }
    }

    // Add from other rooms if we need more
    for (const room of roomsByUrgency) {
      if (tasks.length >= MIN_DAILY_TASKS) break;
      const incompleteTasks = (room.tasks || [])
        .filter(t => !t.completed && !usedTaskIds.has(t.id))
        .slice(0, 2);

      for (const task of incompleteTasks) {
        if (tasks.length >= MIN_DAILY_TASKS) break;
        usedTaskIds.add(task.id);
        tasks.push({
          id: task.id,
          title: task.title,
          emoji: task.emoji,
          roomId: room.id,
          roomName: room.name,
          estimatedMinutes: task.estimatedMinutes || 5,
          completed: false,
          source: 'freshness',
          originalTask: task,
        });
      }
    }

    // --- Source 2: Quick wins (under 3 minutes) from any room ---
    if (tasks.length < MAX_DAILY_TASKS) {
      const quickWins: TodayTask[] = [];
      for (const room of rooms) {
        const quick = (room.tasks || [])
          .filter(t => !t.completed && !usedTaskIds.has(t.id) && (t.estimatedMinutes || 5) <= 3)
          .slice(0, 2);

        for (const task of quick) {
          quickWins.push({
            id: task.id,
            title: task.title,
            emoji: task.emoji,
            roomId: room.id,
            roomName: room.name,
            estimatedMinutes: task.estimatedMinutes || 2,
            completed: false,
            source: 'quick-win',
            originalTask: task,
          });
        }
      }

      // Sort quick wins by time (fastest first) and add up to the cap
      quickWins.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
      for (const qw of quickWins) {
        if (tasks.length >= MAX_DAILY_TASKS) break;
        if (usedTaskIds.has(qw.id)) continue;
        usedTaskIds.add(qw.id);
        tasks.push(qw);
      }
    }

    // --- Source 3: Daily maintenance tasks (universal recurring tasks) ---
    const dailyMaintenance: TodayTask[] = [
      {
        id: 'daily-dishes',
        title: 'Quick kitchen check (2 min)',
        emoji: '🍽️',
        roomId: '',
        roomName: 'Kitchen',
        estimatedMinutes: 2,
        completed: false,
        source: 'tiny-thing' as const,
      },
      {
        id: 'daily-pickup',
        title: 'Pick up 5 things from the floor',
        emoji: '🧹',
        roomId: '',
        roomName: 'Any Room',
        estimatedMinutes: 2,
        completed: false,
        source: 'tiny-thing' as const,
      },
      {
        id: 'daily-surfaces',
        title: 'Clear one surface for 60 seconds',
        emoji: '✨',
        roomId: '',
        roomName: 'Any Room',
        estimatedMinutes: 1,
        completed: false,
        source: 'tiny-thing' as const,
      },
    ];

    for (const mTask of dailyMaintenance) {
      if (tasks.length >= MAX_DAILY_TASKS) break;
      if (!usedTaskIds.has(mTask.id)) {
        usedTaskIds.add(mTask.id);
        tasks.push(mTask);
      }
    }

    // --- Source 4: One Tiny Thing micro-task ---
    // Use a date-based seed so the tiny thing is stable for the whole day
    if (tasks.length < MAX_DAILY_TASKS) {
      const daySeed = Math.floor(Date.now() / 86400000);
      const tinyTask = getOneTinyThingTask(daySeed);
      tasks.push({
        id: `tiny-${tinyTask.id}`,
        title: tinyTask.title,
        emoji: tinyTask.emoji,
        roomId: 'tiny',
        roomName: 'Anywhere',
        estimatedMinutes: Math.ceil(tinyTask.estimatedSeconds / 60),
        completed: false,
        source: 'tiny-thing',
        tinyTask,
      });
    }

    return tasks.slice(0, MAX_DAILY_TASKS);
  }, [rooms]);
}
