/**
 * Convex Hooks
 * Convenience hooks for accessing Convex queries and mutations.
 *
 * Convention:
 * - useXxx()       = query (reactive, returns data | undefined while loading)
 * - useCreateXxx() = mutation
 * - useXxxAction() = action (server-side with side effects)
 *
 * All query hooks return `undefined` while loading. Check for `undefined`
 * to show a loading state, and handle `null` as "no data found".
 */

import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { toConvexId } from "@/utils/convexIds";

// Re-export auth hook
export { useConvexAuth };

// ==================
// USER HOOKS
// ==================

/** Reactive current user. Returns `undefined` while loading, `null` if not found. */
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
    roomId ? { id: toConvexId<'rooms'>(roomId) } : "skip"
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
    roomId ? { roomId: toConvexId<'rooms'>(roomId) } : "skip"
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
    roomId ? { roomId: toConvexId<'rooms'>(roomId) } : "skip"
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

// ==================
// STREAK / COMEBACK HOOKS
// ==================

export function useCheckComebackStatus() {
  return useQuery(api.stats.checkComebackStatus);
}

export function useRecordActivity() {
  return useMutation(api.stats.recordActivity);
}

export function useStreakInfo() {
  return useQuery(api.stats.getStreakInfo);
}

export function useStreakFreeze() {
  return useMutation(api.stats.useStreakFreeze);
}

export function useGrantStreakFreezes() {
  return useMutation(api.stats.grantStreakFreezes);
}

// ==================
// ACCOUNTABILITY HOOKS
// ==================

export function useMyPartner() {
  return useQuery(api.accountability.getMyPartner);
}

export function useInviteCode() {
  return useQuery(api.accountability.getInviteCode);
}

export function useBothActiveBonus() {
  return useQuery(api.accountability.getBothActiveBonus);
}

export function useCreatePair() {
  return useMutation(api.accountability.createPair);
}

export function useJoinPair() {
  return useMutation(api.accountability.joinPair);
}

export function useSendNudge() {
  return useMutation(api.accountability.sendNudge);
}

export function useEndPartnership() {
  return useMutation(api.accountability.endPartnership);
}

export function useUpdateActivity() {
  return useMutation(api.accountability.updateActivity);
}

// ==================
// ACTIVITY LOG HOOKS
// ==================

export function useCalendarData() {
  return useQuery(api.activityLog.getCalendarData);
}

export function useWeeklyActivity() {
  return useQuery(api.activityLog.getWeeklyActivity);
}

export function useRecordDailyActivity() {
  return useMutation(api.activityLog.recordDailyActivity);
}

// ==================
// LEADERBOARD HOOKS
// ==================

export function useWeeklyLeaderboard() {
  return useQuery(api.leaderboard.getWeeklyLeaderboard);
}

export function useUserLeague() {
  return useQuery(api.leaderboard.getUserLeague);
}

export function useUpdateWeeklyXP() {
  return useMutation(api.leaderboard.updateWeeklyXP);
}

// ==================
// NOTIFICATION HOOKS
// ==================

export function useSavePushToken() {
  return useMutation(api.notifications.savePushToken);
}

export function useRemovePushToken() {
  return useMutation(api.notifications.removePushToken);
}

export function useSendPushNotification() {
  return useAction(api.notifications.sendPushNotification);
}

// ==================
// VARIABLE REWARDS HOOKS
// ==================

export function useUnclaimedRewards() {
  return useQuery(api.variableRewards.getUnclaimedRewards);
}

export function useCheckForReward() {
  return useMutation(api.variableRewards.checkForReward);
}

export function useClaimReward() {
  return useMutation(api.variableRewards.claimReward);
}

// ==================
// TASK REORDER HOOKS
// ==================

export function useReorderTasks() {
  return useMutation(api.tasks.reorder);
}

// ==================
// STATS RESET HOOKS
// ==================

export function useResetStats() {
  return useMutation(api.stats.reset);
}
