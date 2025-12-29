/**
 * Social Features Service
 * Room sharing, challenges, and body doubling features
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { firebaseDb, isFirebaseConfigured } from '@/config/firebase';
import { getCurrentUser } from './auth';
import { Room, UserStats, Mascot } from '@/types/declutter';

// Challenge types
export type ChallengeType =
  | 'tasks_count'    // Complete X tasks
  | 'time_spent'     // Clean for X minutes
  | 'room_complete'  // Complete a room
  | 'streak'         // Maintain streak for X days
  | 'collectibles';  // Collect X items

// Challenge status
export type ChallengeStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'expired';

// Challenge participant
export interface ChallengeParticipant {
  oderId: string;
  displayName: string;
  progress: number;
  joined: Date;
  completed: boolean;
  completedAt?: Date;
}

// Challenge data
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

// Shared room data
export interface SharedRoom {
  id: string;
  roomId: string;
  ownerId: string;
  ownerName: string;
  roomName: string;
  roomEmoji: string;
  roomType: string;
  sharedWith: string[]; // User IDs
  sharedAt: Date;
  inviteCode: string;
  isPublic: boolean;
}

// Body doubling session
export interface BodyDoublingSession {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration: number; // minutes
  maxParticipants: number;
  participants: {
    userId: string;
    displayName: string;
    joinedAt: Date;
    isActive: boolean;
  }[];
  status: 'scheduled' | 'active' | 'ended';
  inviteCode: string;
}

// Friend/connection
export interface Connection {
  oderId: string;
  displayName: string;
  avatarUrl?: string;
  addedAt: Date;
  mutualChallenges: number;
  lastActive?: Date;
}

// Generate invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to convert timestamps
function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

// =====================
// CHALLENGES
// =====================

export async function createChallenge(
  type: ChallengeType,
  title: string,
  description: string,
  target: number,
  durationDays: number
): Promise<Challenge | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const challengeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const challenge: Challenge = {
      id: challengeId,
      creatorId: user.uid,
      creatorName: user.displayName || 'Anonymous',
      type,
      title,
      description,
      target,
      startDate: now,
      endDate,
      participants: [{
        oderId: user.uid,
        displayName: user.displayName || 'Anonymous',
        progress: 0,
        joined: now,
        completed: false,
      }],
      status: 'in_progress',
      createdAt: now,
      inviteCode: generateInviteCode(),
    };

    await setDoc(doc(firebaseDb, 'challenges', challengeId), {
      ...challenge,
      startDate: Timestamp.fromDate(challenge.startDate),
      endDate: Timestamp.fromDate(challenge.endDate),
      createdAt: serverTimestamp(),
      participants: challenge.participants.map(p => ({
        ...p,
        joined: Timestamp.fromDate(p.joined),
      })),
    });

    return challenge;
  } catch (error) {
    console.error('Error creating challenge:', error);
    return null;
  }
}

export async function joinChallenge(inviteCode: string): Promise<Challenge | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    // Find challenge by invite code
    const challengesRef = collection(firebaseDb, 'challenges');
    const q = query(challengesRef, where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    // Check if already joined
    const isAlreadyParticipant = data.participants?.some(
      (p: any) => p.oderId === user.uid
    );
    if (isAlreadyParticipant) return null;

    // Check if challenge is still active
    const endDate = timestampToDate(data.endDate);
    if (new Date() > endDate) return null;

    // Add participant
    await updateDoc(doc(firebaseDb, 'challenges', docSnap.id), {
      participants: arrayUnion({
        oderId: user.uid,
        displayName: user.displayName || 'Anonymous',
        progress: 0,
        joined: Timestamp.now(),
        completed: false,
      }),
    });

    return {
      ...data,
      id: docSnap.id,
      startDate: timestampToDate(data.startDate),
      endDate: timestampToDate(data.endDate),
      createdAt: timestampToDate(data.createdAt),
      participants: data.participants.map((p: any) => ({
        ...p,
        joined: timestampToDate(p.joined),
        completedAt: p.completedAt ? timestampToDate(p.completedAt) : undefined,
      })),
    } as Challenge;
  } catch (error) {
    console.error('Error joining challenge:', error);
    return null;
  }
}

export async function updateChallengeProgress(
  challengeId: string,
  progress: number
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const docRef = doc(firebaseDb, 'challenges', challengeId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const participants = data.participants || [];
    const updatedParticipants = participants.map((p: any) => {
      if (p.oderId === user.uid) {
        const completed = progress >= data.target;
        return {
          ...p,
          progress,
          completed,
          completedAt: completed ? Timestamp.now() : null,
        };
      }
      return p;
    });

    await updateDoc(docRef, { participants: updatedParticipants });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
}

export async function getMyChallenges(): Promise<Challenge[]> {
  if (!isFirebaseConfigured()) return [];

  const user = getCurrentUser();
  if (!user) return [];

  try {
    const challengesRef = collection(firebaseDb, 'challenges');
    const snapshot = await getDocs(challengesRef);

    const challenges: Challenge[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const isParticipant = data.participants?.some(
        (p: any) => p.oderId === user.uid
      );

      if (isParticipant) {
        challenges.push({
          ...data,
          id: doc.id,
          startDate: timestampToDate(data.startDate),
          endDate: timestampToDate(data.endDate),
          createdAt: timestampToDate(data.createdAt),
          participants: data.participants.map((p: any) => ({
            ...p,
            joined: timestampToDate(p.joined),
            completedAt: p.completedAt ? timestampToDate(p.completedAt) : undefined,
          })),
        } as Challenge);
      }
    });

    return challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting challenges:', error);
    return [];
  }
}

// =====================
// ROOM SHARING
// =====================

export async function shareRoom(
  room: Room,
  isPublic: boolean = false
): Promise<SharedRoom | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const sharedRoom: SharedRoom = {
      id: shareId,
      roomId: room.id,
      ownerId: user.uid,
      ownerName: user.displayName || 'Anonymous',
      roomName: room.name,
      roomEmoji: room.emoji,
      roomType: room.type,
      sharedWith: [],
      sharedAt: new Date(),
      inviteCode: generateInviteCode(),
      isPublic,
    };

    await setDoc(doc(firebaseDb, 'sharedRooms', shareId), {
      ...sharedRoom,
      sharedAt: serverTimestamp(),
    });

    return sharedRoom;
  } catch (error) {
    console.error('Error sharing room:', error);
    return null;
  }
}

export async function joinSharedRoom(inviteCode: string): Promise<SharedRoom | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const roomsRef = collection(firebaseDb, 'sharedRooms');
    const q = query(roomsRef, where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    // Add user to sharedWith
    if (!data.sharedWith?.includes(user.uid)) {
      await updateDoc(doc(firebaseDb, 'sharedRooms', docSnap.id), {
        sharedWith: arrayUnion(user.uid),
      });
    }

    return {
      ...data,
      id: docSnap.id,
      sharedAt: timestampToDate(data.sharedAt),
    } as SharedRoom;
  } catch (error) {
    console.error('Error joining shared room:', error);
    return null;
  }
}

export async function getSharedWithMe(): Promise<SharedRoom[]> {
  if (!isFirebaseConfigured()) return [];

  const user = getCurrentUser();
  if (!user) return [];

  try {
    const roomsRef = collection(firebaseDb, 'sharedRooms');
    const q = query(
      roomsRef,
      where('sharedWith', 'array-contains', user.uid)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      sharedAt: timestampToDate(doc.data().sharedAt),
    } as SharedRoom));
  } catch (error) {
    console.error('Error getting shared rooms:', error);
    return [];
  }
}

// =====================
// BODY DOUBLING
// =====================

export async function createBodyDoublingSession(
  title: string,
  duration: number,
  maxParticipants: number = 10,
  description?: string,
  scheduledAt?: Date
): Promise<BodyDoublingSession | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: BodyDoublingSession = {
      id: sessionId,
      hostId: user.uid,
      hostName: user.displayName || 'Anonymous',
      title,
      description,
      scheduledAt,
      duration,
      maxParticipants,
      participants: [{
        oderId: user.uid,
        displayName: user.displayName || 'Anonymous',
        joinedAt: new Date(),
        isActive: true,
      }],
      status: scheduledAt ? 'scheduled' : 'active',
      inviteCode: generateInviteCode(),
    };

    if (!scheduledAt) {
      session.startedAt = new Date();
    }

    await setDoc(doc(firebaseDb, 'bodyDoublingSessions', sessionId), {
      ...session,
      scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : null,
      startedAt: session.startedAt ? Timestamp.fromDate(session.startedAt) : null,
      createdAt: serverTimestamp(),
      participants: session.participants.map(p => ({
        ...p,
        joinedAt: Timestamp.fromDate(p.joinedAt),
      })),
    });

    return session;
  } catch (error) {
    console.error('Error creating body doubling session:', error);
    return null;
  }
}

export async function joinBodyDoublingSession(
  inviteCode: string
): Promise<BodyDoublingSession | null> {
  if (!isFirebaseConfigured()) return null;

  const user = getCurrentUser();
  if (!user) return null;

  try {
    const sessionsRef = collection(firebaseDb, 'bodyDoublingSessions');
    const q = query(sessionsRef, where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    // Check if already joined
    const isAlreadyParticipant = data.participants?.some(
      (p: any) => p.oderId === user.uid
    );
    if (isAlreadyParticipant) {
      // Just return the session
      return {
        ...data,
        id: docSnap.id,
        scheduledAt: data.scheduledAt ? timestampToDate(data.scheduledAt) : undefined,
        startedAt: data.startedAt ? timestampToDate(data.startedAt) : undefined,
        endedAt: data.endedAt ? timestampToDate(data.endedAt) : undefined,
        participants: data.participants.map((p: any) => ({
          ...p,
          joinedAt: timestampToDate(p.joinedAt),
        })),
      } as BodyDoublingSession;
    }

    // Check capacity
    if (data.participants?.length >= data.maxParticipants) return null;

    // Check if ended
    if (data.status === 'ended') return null;

    // Add participant
    await updateDoc(doc(firebaseDb, 'bodyDoublingSessions', docSnap.id), {
      participants: arrayUnion({
        oderId: user.uid,
        displayName: user.displayName || 'Anonymous',
        joinedAt: Timestamp.now(),
        isActive: true,
      }),
    });

    return {
      ...data,
      id: docSnap.id,
      scheduledAt: data.scheduledAt ? timestampToDate(data.scheduledAt) : undefined,
      startedAt: data.startedAt ? timestampToDate(data.startedAt) : undefined,
      participants: data.participants.map((p: any) => ({
        ...p,
        joinedAt: timestampToDate(p.joinedAt),
      })),
    } as BodyDoublingSession;
  } catch (error) {
    console.error('Error joining body doubling session:', error);
    return null;
  }
}

export async function leaveBodyDoublingSession(sessionId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const docRef = doc(firebaseDb, 'bodyDoublingSessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const updatedParticipants = data.participants
      .map((p: any) => {
        if (p.oderId === user.uid) {
          return { ...p, isActive: false };
        }
        return p;
      });

    await updateDoc(docRef, { participants: updatedParticipants });
  } catch (error) {
    console.error('Error leaving body doubling session:', error);
  }
}

export async function endBodyDoublingSession(sessionId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const user = getCurrentUser();
  if (!user) return;

  try {
    const docRef = doc(firebaseDb, 'bodyDoublingSessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const data = docSnap.data();

    // Only host can end
    if (data.hostId !== user.uid) return;

    await updateDoc(docRef, {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error ending body doubling session:', error);
  }
}

export async function getActiveSessions(): Promise<BodyDoublingSession[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const sessionsRef = collection(firebaseDb, 'bodyDoublingSessions');
    const q = query(
      sessionsRef,
      where('status', 'in', ['scheduled', 'active']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        scheduledAt: data.scheduledAt ? timestampToDate(data.scheduledAt) : undefined,
        startedAt: data.startedAt ? timestampToDate(data.startedAt) : undefined,
        participants: data.participants.map((p: any) => ({
          ...p,
          joinedAt: timestampToDate(p.joinedAt),
        })),
      } as BodyDoublingSession;
    });
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

// =====================
// CONNECTIONS
// =====================

export async function addConnection(targetUserId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  const user = getCurrentUser();
  if (!user) return false;

  try {
    const connectionId = [user.uid, targetUserId].sort().join('_');

    await setDoc(doc(firebaseDb, 'connections', connectionId), {
      users: [user.uid, targetUserId],
      createdAt: serverTimestamp(),
      initiatedBy: user.uid,
    });

    return true;
  } catch (error) {
    console.error('Error adding connection:', error);
    return false;
  }
}

export async function getConnections(): Promise<Connection[]> {
  if (!isFirebaseConfigured()) return [];

  const user = getCurrentUser();
  if (!user) return [];

  try {
    const connectionsRef = collection(firebaseDb, 'connections');
    const q = query(
      connectionsRef,
      where('users', 'array-contains', user.uid)
    );
    const snapshot = await getDocs(q);

    const connections: Connection[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const otherUserId = data.users.find((id: string) => id !== user.uid);

      if (otherUserId) {
        // Get other user's profile
        const userDoc = await getDoc(doc(firebaseDb, 'users', otherUserId));
        const userData = userDoc.data();

        connections.push({
          oderId: otherUserId,
          displayName: userData?.name || 'Anonymous',
          avatarUrl: userData?.avatar,
          addedAt: timestampToDate(data.createdAt),
          mutualChallenges: 0, // Would need to calculate
        });
      }
    }

    return connections;
  } catch (error) {
    console.error('Error getting connections:', error);
    return [];
  }
}

export async function removeConnection(targetUserId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  const user = getCurrentUser();
  if (!user) return false;

  try {
    const connectionId = [user.uid, targetUserId].sort().join('_');
    await deleteDoc(doc(firebaseDb, 'connections', connectionId));
    return true;
  } catch (error) {
    console.error('Error removing connection:', error);
    return false;
  }
}
