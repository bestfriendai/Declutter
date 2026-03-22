/**
 * useConsistencyScore — Rolling 7-day consistency score
 *
 * Supplements (not replaces) streaks. Shows "X of last 7 days active"
 * which is more encouraging than a binary streak that can break.
 * Philosophy: celebrate showing up, not perfect attendance.
 */

import { useMemo } from 'react';
import { Room } from '@/types/declutter';
import { UserStats } from '@/types/declutter';

export interface ConsistencyResult {
  activeDays: number;
  windowDays: number;
  percentage: number;
  label: string;
}

function getConsistencyLabel(percentage: number): string {
  if (percentage >= 85) return 'On fire!';
  if (percentage >= 60) return 'Solid consistency';
  if (percentage >= 40) return 'Getting there';
  return 'Building momentum';
}

/**
 * Calculate active days in the last 7 days based on task completion dates.
 */
export function useConsistencyScore(rooms: Room[], stats: UserStats): ConsistencyResult {
  return useMemo(() => {
    const windowDays = 7;
    const now = new Date();
    const activeDateSet = new Set<string>();

    // Gather all task completion dates from the last 7 days
    for (const room of rooms) {
      for (const task of room.tasks || []) {
        if (task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          const daysDiff = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff <= windowDays) {
            activeDateSet.add(completedDate.toDateString());
          }
        }
      }
    }

    // Also check the lastActivityDate from stats (covers today if tasks were done)
    if (stats.lastActivityDate) {
      const lastActivity = new Date(stats.lastActivityDate);
      const daysDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= windowDays) {
        activeDateSet.add(lastActivity.toDateString());
      }
    }

    const activeDays = activeDateSet.size;
    const percentage = Math.round((activeDays / windowDays) * 100);

    return {
      activeDays,
      windowDays,
      percentage,
      label: getConsistencyLabel(percentage),
    };
  }, [rooms, stats]);
}
