/**
 * Convex Hooks
 * Convenience hooks for accessing Convex queries and mutations
 */

import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";

// Re-export auth hook
export { useConvexAuth };

// ==================
// USER HOOKS
// ==================

export function useCurrentUser() {
  return useQuery(api.users.get);
}

export function useCreateUser() {
  return useMutation(api.users.create);
}

export function useUpdateUser() {
  return useMutation(api.users.update);
}

export function useDeleteAccount() {
  return useMutation(api.users.deleteAccount);
}

// ==================
// ROOM HOOKS
// ==================

export function useRooms() {
  return useQuery(api.rooms.list);
}

export function useRoom(roomId: string | undefined) {
  return useQuery(
    api.rooms.get,
    roomId ? { id: roomId as any } : "skip"
  );
}

export function useCreateRoom() {
  return useMutation(api.rooms.create);
}

export function useUpdateRoom() {
  return useMutation(api.rooms.update);
}

export function useDeleteRoom() {
  return useMutation(api.rooms.remove);
}

// ==================
// TASK HOOKS
// ==================

export function useTasks(roomId: string | undefined) {
  return useQuery(
    api.tasks.listByRoom,
    roomId ? { roomId: roomId as any } : "skip"
  );
}

export function useCreateTask() {
  return useMutation(api.tasks.create);
}

export function useCreateManyTasks() {
  return useMutation(api.tasks.createMany);
}

export function useUpdateTask() {
  return useMutation(api.tasks.update);
}

export function useToggleTask() {
  return useMutation(api.tasks.toggle);
}

export function useDeleteTask() {
  return useMutation(api.tasks.remove);
}

// ==================
// PHOTO HOOKS
// ==================

export function usePhotos(roomId: string | undefined) {
  return useQuery(
    api.photos.listByRoom,
    roomId ? { roomId: roomId as any } : "skip"
  );
}

export function useCreatePhoto() {
  return useMutation(api.photos.create);
}

export function useDeletePhoto() {
  return useMutation(api.photos.remove);
}

export function useGenerateUploadUrl() {
  return useMutation(api.photos.generateUploadUrl);
}

// ==================
// STATS HOOKS
// ==================

export function useStats() {
  return useQuery(api.stats.get);
}

export function useUpsertStats() {
  return useMutation(api.stats.upsert);
}

export function useIncrementTask() {
  return useMutation(api.stats.incrementTask);
}

export function useDecrementTask() {
  return useMutation(api.stats.decrementTask);
}

export function useIncrementRoom() {
  return useMutation(api.stats.incrementRoom);
}

export function useAddXp() {
  return useMutation(api.stats.addXp);
}

// ==================
// BADGE HOOKS
// ==================

export function useBadges() {
  return useQuery(api.badges.listByUser);
}

export function useCheckAndUnlockBadges() {
  return useMutation(api.badges.checkAndUnlock);
}

// ==================
// SETTINGS HOOKS
// ==================

export function useSettings() {
  return useQuery(api.settings.get);
}

export function useUpsertSettings() {
  return useMutation(api.settings.upsert);
}

// ==================
// MASCOT HOOKS
// ==================

export function useMascot() {
  return useQuery(api.mascots.get);
}

export function useCreateMascot() {
  return useMutation(api.mascots.create);
}

export function useUpdateMascot() {
  return useMutation(api.mascots.update);
}

export function useFeedMascot() {
  return useMutation(api.mascots.feed);
}

export function useInteractWithMascot() {
  return useMutation(api.mascots.interact);
}

// ==================
// COLLECTION HOOKS
// ==================

export function useCollectedItems() {
  return useQuery(api.collection.listItems);
}

export function useCollectionStats() {
  return useQuery(api.collection.getStats);
}

export function useCollectItem() {
  return useMutation(api.collection.collect);
}

// ==================
// SOCIAL HOOKS
// ==================

export function useChallenges() {
  return useQuery(api.social.listChallenges);
}

export function useCreateChallenge() {
  return useMutation(api.social.createChallenge);
}

export function useJoinChallenge() {
  return useMutation(api.social.joinChallenge);
}

export function useConnections() {
  return useQuery(api.social.listConnections);
}

export function useAddConnection() {
  return useMutation(api.social.addConnection);
}

export function useUpdateConnection() {
  return useMutation(api.social.updateConnection);
}

// ==================
// GEMINI AI HOOKS
// ==================

export function useGeminiConfigured() {
  return useQuery(api.gemini.isConfigured);
}

export function useAnalyzeRoom() {
  return useAction(api.gemini.analyzeRoom);
}

export function useAnalyzeProgress() {
  return useAction(api.gemini.analyzeProgress);
}

export function useGetMotivation() {
  return useAction(api.gemini.getMotivation);
}
