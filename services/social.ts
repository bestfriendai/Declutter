/**
 * Social Features Service
 * Convex-backed challenge and connection flows.
 */

import { api } from '@/convex/_generated/api';
import { convex } from '@/config/convex';

export type ChallengeType =
  | 'tasks_count'
  | 'time_spent'
  | 'room_complete'
  | 'streak'
  | 'collectibles';

export type ChallengeStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'expired';

export interface ChallengeParticipant {
  userId: string;
  displayName: string;
  progress: number;
  joined: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface Challenge {
  id: string;
  creatorId: string;
  creatorName: string;
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  startDate: Date;
  endDate: Date;
  participants: ChallengeParticipant[];
  status: ChallengeStatus;
  createdAt: Date;
  inviteCode?: string;
}

export interface Connection {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  addedAt: Date;
  mutualChallenges: number;
  lastActive?: Date;
}

type ConvexChallengeDoc = {
  _id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  startDate: number;
  endDate: number;
  status: ChallengeStatus;
  createdAt: number;
  inviteCode: string;
  participants: Array<{
    userId: string;
    displayName: string;
    progress: number;
    joined: number;
    completed: boolean;
    completedAt?: number;
  }>;
};

function toDate(value?: number): Date | undefined {
  return value === undefined ? undefined : new Date(value);
}

function mapChallenge(challenge: ConvexChallengeDoc | null): Challenge | null {
  if (!challenge) return null;

  return {
    id: challenge._id,
    creatorId: challenge.creatorId,
    creatorName: challenge.creatorName,
    type: challenge.type,
    title: challenge.title,
    description: challenge.description,
    target: challenge.target,
    startDate: new Date(challenge.startDate),
    endDate: new Date(challenge.endDate),
    status: challenge.status,
    createdAt: new Date(challenge.createdAt),
    inviteCode: challenge.inviteCode,
    participants: (challenge.participants ?? []).map((participant) => ({
      userId: participant.userId,
      displayName: participant.displayName,
      progress: participant.progress,
      joined: new Date(participant.joined),
      completed: participant.completed,
      completedAt: toDate(participant.completedAt),
    })),
  };
}

export async function createChallenge(
  type: ChallengeType,
  title: string,
  description: string,
  target: number,
  durationDays: number
): Promise<Challenge | null> {
  try {
    const challengeId = await convex.mutation(api.social.createChallenge, {
      type,
      title,
      description,
      target,
      durationDays,
    });
    const challenge = await convex.query(api.social.getChallenge, {
      id: challengeId,
    });
    return mapChallenge(challenge as ConvexChallengeDoc | null);
  } catch (error) {
    console.error('Error creating challenge:', error);
    return null;
  }
}

export async function joinChallenge(inviteCode: string): Promise<Challenge | null> {
  try {
    const challengeId = await convex.mutation(api.social.joinChallenge, {
      inviteCode: inviteCode.trim().toUpperCase(),
    });
    const challenge = await convex.query(api.social.getChallenge, {
      id: challengeId,
    });
    return mapChallenge(challenge as ConvexChallengeDoc | null);
  } catch (error) {
    console.error('Error joining challenge:', error);
    return null;
  }
}

export async function updateChallengeProgress(
  challengeId: string,
  progress: number
): Promise<boolean> {
  try {
    await convex.mutation(api.social.updateChallengeProgress, {
      id: challengeId as any,
      progress,
      completed: progress >= 100,
    });
    return true;
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return false;
  }
}

export async function getChallengeById(
  challengeId: string
): Promise<Challenge | null> {
  try {
    const challenge = await convex.query(api.social.getChallenge, {
      id: challengeId as any,
    });
    return mapChallenge(challenge as ConvexChallengeDoc | null);
  } catch (error) {
    console.error('Error loading challenge:', error);
    return null;
  }
}

export async function getMyChallenges(): Promise<Challenge[]> {
  try {
    const challenges = await convex.query(api.social.listChallenges, {});
    return (challenges as ConvexChallengeDoc[]).map((challenge) =>
      mapChallenge(challenge)
    ).filter(Boolean) as Challenge[];
  } catch (error) {
    console.error('Error loading challenges:', error);
    return [];
  }
}

export async function addConnection(targetUserId: string): Promise<boolean> {
  try {
    await convex.mutation(api.social.addConnection, {
      friendId: targetUserId as any,
    });
    return true;
  } catch (error) {
    console.error('Error adding connection:', error);
    return false;
  }
}

export async function getConnections(): Promise<Connection[]> {
  try {
    const connections = await convex.query(api.social.listConnections, {});
    return (connections as Array<any>).map((connection) => {
      const otherUserId =
        typeof connection.friendId === 'string'
          ? connection.friendId
          : String(connection.friendId);

      return {
        userId: otherUserId,
        displayName: 'Connection',
        addedAt: new Date(connection.createdAt),
        mutualChallenges: 0,
      };
    });
  } catch (error) {
    console.error('Error loading connections:', error);
    return [];
  }
}

export async function removeConnection(_targetUserId: string): Promise<boolean> {
  return false;
}
