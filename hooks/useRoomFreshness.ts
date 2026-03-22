/**
 * useRoomFreshness — Calculates room freshness based on time since last activity
 *
 * Different room types decay at different rates because some rooms
 * get messy faster than others (kitchens > garages).
 * Freshness: 0 = needs urgent attention, 100 = recently cleaned.
 */

import { useMemo } from 'react';
import { Room, RoomType } from '@/types/declutter';

// Points of freshness lost per day, by room type
const DECAY_RATES: Record<RoomType, number> = {
  kitchen: 15,
  bathroom: 12,
  livingRoom: 10,
  bedroom: 8,
  office: 7,
  closet: 3,
  garage: 2,
  other: 5,
};

export interface RoomFreshness {
  roomId: string;
  roomName: string;
  freshness: number; // 0-100
  decayRate: number;
  daysSinceClean: number;
  color: string;
  label: string;
}

function getFreshnessColor(freshness: number): string {
  if (freshness >= 80) return '#66BB6A'; // green
  if (freshness >= 50) return '#FFB74D'; // yellow/amber
  if (freshness >= 25) return '#FF9800'; // orange
  return '#FF5252'; // red
}

function getFreshnessLabelText(freshness: number): string {
  if (freshness >= 80) return 'Fresh';
  if (freshness >= 50) return 'Getting stale';
  if (freshness >= 25) return 'Could use some love';
  return 'Ready for a refresh';
}

function calculateRoomFreshness(room: Room): RoomFreshness {
  const decayRate = room.freshnessDecayRate ?? DECAY_RATES[room.type] ?? 5;

  // Use lastCleanedAt if available, otherwise fall back to the most recent
  // task completion time, or the room creation date
  let lastActivityTimestamp = room.lastCleanedAt;

  if (!lastActivityTimestamp) {
    const completedTasks = (room.tasks || [])
      .filter(t => t.completed && t.completedAt)
      .map(t => new Date(t.completedAt!).getTime());

    if (completedTasks.length > 0) {
      lastActivityTimestamp = Math.max(...completedTasks);
    } else {
      lastActivityTimestamp = new Date(room.createdAt).getTime();
    }
  }

  const now = Date.now();
  const daysSinceClean = (now - lastActivityTimestamp) / (1000 * 60 * 60 * 24);
  const freshness = Math.max(0, Math.min(100, 100 - daysSinceClean * decayRate));

  return {
    roomId: room.id,
    roomName: room.name,
    freshness: Math.round(freshness),
    decayRate,
    daysSinceClean: Math.round(daysSinceClean * 10) / 10,
    color: getFreshnessColor(freshness),
    label: getFreshnessLabelText(freshness),
  };
}

export function useRoomFreshness(rooms: Room[]): RoomFreshness[] {
  return useMemo(() => {
    return rooms.map(calculateRoomFreshness);
  }, [rooms]);
}

/**
 * Returns the room with the lowest freshness score (most urgently needs cleaning).
 */
export function getMostUrgentRoom(rooms: Room[]): RoomFreshness | null {
  if (rooms.length === 0) return null;

  const freshnesses = rooms.map(calculateRoomFreshness);
  return freshnesses.reduce((most, current) =>
    current.freshness < most.freshness ? current : most
  );
}
