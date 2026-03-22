import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

function toTimestamp(value: unknown, fallback = Date.now()): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}


async function clearUserState(ctx: MutationCtx, userId: Id<"users">) {
  const rooms = await ctx.db
    .query("rooms")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  for (const room of rooms) {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .collect();

    for (const task of tasks) {
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .collect();

      for (const subtask of subtasks) {
        await ctx.db.delete(subtask._id);
      }

      await ctx.db.delete(task._id);
    }

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .collect();

    for (const photo of photos) {
      if (photo.storageId) {
        await ctx.storage.delete(photo.storageId);
      }
      await ctx.db.delete(photo._id);
    }

    await ctx.db.delete(room._id);
  }

  const stats = await ctx.db
    .query("stats")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (stats) {
    await ctx.db.delete(stats._id);
  }

  const settings = await ctx.db
    .query("settings")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (settings) {
    await ctx.db.delete(settings._id);
  }

  const mascot = await ctx.db
    .query("mascots")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (mascot) {
    await ctx.db.delete(mascot._id);
  }

  const badges = await ctx.db
    .query("badges")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  for (const badge of badges) {
    await ctx.db.delete(badge._id);
  }

  const collectedItems = await ctx.db
    .query("collectedItems")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  for (const item of collectedItems) {
    await ctx.db.delete(item._id);
  }

  const collectionStats = await ctx.db
    .query("collectionStats")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (collectionStats) {
    await ctx.db.delete(collectionStats._id);
  }
}

// Validate and sanitize sync data to prevent malicious/corrupt payloads
function validateSyncData(args: Record<string, unknown>) {
  // Validate stats
  if (args.stats && typeof args.stats === "object") {
    const s = args.stats as Record<string, unknown>;
    if (typeof s.xp === "number") s.xp = Math.max(0, Math.min(s.xp, 1000000));
    if (typeof s.level === "number")
      s.level = Math.max(1, Math.min(s.level, 1000));
    if (typeof s.totalTasksCompleted === "number")
      s.totalTasksCompleted = Math.max(
        0,
        Math.min(s.totalTasksCompleted, 100000)
      );
    if (typeof s.totalRoomsCleaned === "number")
      s.totalRoomsCleaned = Math.max(0, Math.min(s.totalRoomsCleaned, 10000));
    if (typeof s.currentStreak === "number")
      s.currentStreak = Math.max(0, Math.min(s.currentStreak, 3650));
    if (typeof s.longestStreak === "number")
      s.longestStreak = Math.max(0, Math.min(s.longestStreak, 3650));
    if (typeof s.totalMinutesCleaned === "number")
      s.totalMinutesCleaned = Math.max(
        0,
        Math.min(s.totalMinutesCleaned, 10000000)
      );
  }

  // Validate rooms array
  if (Array.isArray(args.rooms)) {
    if (args.rooms.length > 50) {
      args.rooms = args.rooms.slice(0, 50);
    }
    for (const room of args.rooms as Record<string, unknown>[]) {
      if (typeof room.name === "string") {
        room.name = (room.name as string).slice(0, 200).replace(/<[^>]*>/g, "");
      }
      if (typeof room.currentProgress === "number") {
        room.currentProgress = Math.max(
          0,
          Math.min(room.currentProgress as number, 100)
        );
      }
      // Validate tasks within rooms
      if (Array.isArray(room.tasks) && room.tasks.length > 200) {
        room.tasks = room.tasks.slice(0, 200);
      }
      for (const task of (room.tasks ?? []) as Record<string, unknown>[]) {
        if (typeof task.title === "string") {
          task.title = (task.title as string)
            .slice(0, 500)
            .replace(/<[^>]*>/g, "");
        }
        if (typeof task.description === "string") {
          task.description = (task.description as string)
            .slice(0, 2000)
            .replace(/<[^>]*>/g, "");
        }
        if (typeof task.estimatedMinutes === "number") {
          task.estimatedMinutes = Math.max(
            0,
            Math.min(task.estimatedMinutes as number, 1440)
          );
        }
      }
    }
  }

  // Validate collection array
  if (Array.isArray(args.collection) && args.collection.length > 10000) {
    args.collection = args.collection.slice(0, 10000);
  }

  // Sanitize profile name
  if (
    args.profile &&
    typeof args.profile === "object" &&
    typeof (args.profile as Record<string, unknown>).name === "string"
  ) {
    (args.profile as Record<string, unknown>).name = (
      (args.profile as Record<string, unknown>).name as string
    )
      .slice(0, 100)
      .replace(/<[^>]*>/g, "");
  }
}

export const replaceUserState = mutation({
  args: {
    profile: v.optional(v.any()),
    rooms: v.array(v.any()),
    stats: v.any(),
    settings: v.any(),
    mascot: v.optional(v.any()),
    badges: v.optional(v.array(v.any())),
    collection: v.array(v.any()),
    collectionStats: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db.get(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Validate and sanitize incoming data
    validateSyncData(args as unknown as Record<string, unknown>);

    const profile = args.profile ?? {};
    await ctx.db.patch(userId, {
      name: profile.name ?? existingUser.name ?? "Declutterer",
      avatar: profile.avatar ?? existingUser.avatar,
      onboardingComplete:
        profile.onboardingComplete ?? existingUser.onboardingComplete ?? false,
      createdAt: toTimestamp(
        profile.createdAt,
        existingUser.createdAt ?? existingUser._creationTime ?? Date.now()
      ),
    });

    await clearUserState(ctx, userId);

    const stats = args.stats ?? {};
    await ctx.db.insert("stats", {
      userId,
      totalTasksCompleted: stats.totalTasksCompleted ?? 0,
      totalRoomsCleaned: stats.totalRoomsCleaned ?? 0,
      currentStreak: stats.currentStreak ?? 0,
      longestStreak: stats.longestStreak ?? 0,
      totalMinutesCleaned: stats.totalMinutesCleaned ?? 0,
      level: stats.level ?? 1,
      xp: stats.xp ?? 0,
      ...(stats.lastActivityDate ? { lastActivityDate: stats.lastActivityDate } : {}),
      ...(stats.weeklyTaskGoal !== undefined
        ? { weeklyTaskGoal: stats.weeklyTaskGoal }
        : {}),
      ...(stats.weeklyTimeGoal !== undefined
        ? { weeklyTimeGoal: stats.weeklyTimeGoal }
        : {}),
      ...(stats.streakFreezesAvailable !== undefined
        ? { streakFreezesAvailable: stats.streakFreezesAvailable }
        : {}),
      ...(stats.streakFreezesUsedThisMonth !== undefined
        ? { streakFreezesUsedThisMonth: stats.streakFreezesUsedThisMonth }
        : {}),
      ...(stats.lastStreakFreezeUsed
        ? { lastStreakFreezeUsed: stats.lastStreakFreezeUsed }
        : {}),
    });

    for (const badge of args.badges ?? stats.badges ?? []) {
      await ctx.db.insert("badges", {
        userId,
        badgeId: badge.id,
        name: badge.name,
        description: badge.description,
        emoji: badge.emoji,
        unlockedAt: toTimestamp(badge.unlockedAt),
        requirement: badge.requirement,
        type: badge.type,
      });
    }

    const settings = args.settings ?? {};
    const focusMode = settings.focusMode ?? {};
    await ctx.db.insert("settings", {
      userId,
      notifications: settings.notifications ?? true,
      ...(settings.reminderTime ? { reminderTime: settings.reminderTime } : {}),
      theme: settings.theme ?? "auto",
      hapticFeedback: settings.hapticFeedback ?? true,
      soundFX: settings.soundFX ?? true,
      reducedMotion: settings.reducedMotion ?? false,
      encouragementLevel: settings.encouragementLevel ?? "moderate",
      taskBreakdownLevel: settings.taskBreakdownLevel ?? "detailed",
      focusDefaultDuration: focusMode.defaultDuration ?? 25,
      focusBreakDuration: focusMode.breakDuration ?? 5,
      focusAutoStartBreak: focusMode.autoStartBreak ?? true,
      focusBlockNotifications: focusMode.blockNotifications ?? true,
      focusPlayWhiteNoise: focusMode.playWhiteNoise ?? false,
      focusWhiteNoiseType: focusMode.whiteNoiseType ?? "none",
      focusShowMotivationalQuotes: focusMode.showMotivationalQuotes ?? true,
      focusStrictMode: focusMode.strictMode ?? false,
      arCollectionEnabled: settings.arCollectionEnabled ?? true,
      collectibleNotifications: settings.collectibleNotifications ?? true,
    });

    if (args.mascot) {
      const mascot = args.mascot;
      await ctx.db.insert("mascots", {
        userId,
        name: mascot.name,
        personality: mascot.personality,
        mood: mascot.mood,
        activity: mascot.activity,
        level: mascot.level,
        xp: mascot.xp,
        hunger: mascot.hunger,
        energy: mascot.energy,
        happiness: mascot.happiness,
        lastFed: toTimestamp(mascot.lastFed),
        lastInteraction: toTimestamp(mascot.lastInteraction),
        createdAt: toTimestamp(mascot.createdAt),
        accessories: mascot.accessories ?? [],
        ...(mascot.currentAccessory
          ? { currentAccessory: mascot.currentAccessory }
          : {}),
      });
    }

    for (const item of args.collection ?? []) {
      await ctx.db.insert("collectedItems", {
        userId,
        collectibleId: item.collectibleId,
        collectedAt: toTimestamp(item.collectedAt),
        ...(item.roomId ? { roomId: item.roomId } : {}),
        ...(item.taskId ? { taskId: item.taskId } : {}),
      });
    }

    const collectionStats = args.collectionStats ?? {};
    await ctx.db.insert("collectionStats", {
      userId,
      totalCollected: collectionStats.totalCollected ?? 0,
      uniqueCollected: collectionStats.uniqueCollected ?? 0,
      commonCount: collectionStats.commonCount ?? 0,
      uncommonCount: collectionStats.uncommonCount ?? 0,
      rareCount: collectionStats.rareCount ?? 0,
      epicCount: collectionStats.epicCount ?? 0,
      legendaryCount: collectionStats.legendaryCount ?? 0,
      ...(collectionStats.lastCollected
        ? { lastCollected: toTimestamp(collectionStats.lastCollected) }
        : {}),
    });

    for (const room of args.rooms ?? []) {
      const roomId = await ctx.db.insert("rooms", {
        userId,
        name: room.name,
        type: room.type,
        emoji: room.emoji ?? "🏠",
        createdAt: toTimestamp(room.createdAt),
        messLevel: room.messLevel ?? 0,
        currentProgress: room.currentProgress ?? 0,
        ...(room.lastAnalyzedAt
          ? { lastAnalyzedAt: toTimestamp(room.lastAnalyzedAt) }
          : {}),
        ...(room.aiSummary ? { aiSummary: room.aiSummary } : {}),
        ...(room.motivationalMessage
          ? { motivationalMessage: room.motivationalMessage }
          : {}),
      });

      for (const photo of room.photos ?? []) {
        await ctx.db.insert("photos", {
          roomId,
          userId,
          uri: photo.uri,
          type: photo.type,
          timestamp: toTimestamp(photo.timestamp),
        });
      }

      for (const task of room.tasks ?? []) {
        const taskId = await ctx.db.insert("tasks", {
          roomId,
          userId,
          title: task.title,
          description: task.description,
          emoji: task.emoji,
          priority: task.priority,
          difficulty: task.difficulty,
          estimatedMinutes: task.estimatedMinutes,
          completed: task.completed ?? false,
          ...(task.completedAt
            ? { completedAt: toTimestamp(task.completedAt) }
            : {}),
          ...(task.tips ? { tips: task.tips } : {}),
          ...(task.zone ? { zone: task.zone } : {}),
          ...(task.targetObjects ? { targetObjects: task.targetObjects } : {}),
          ...(task.destination?.location
            ? { destinationLocation: task.destination.location }
            : {}),
          ...(task.destination?.instructions
            ? { destinationInstructions: task.destination.instructions }
            : {}),
          ...(task.destination?.requiresSetup
            ? { destinationRequiresSetup: task.destination.requiresSetup }
            : {}),
          ...(task.phase !== undefined ? { phase: task.phase } : {}),
          ...(task.phaseName ? { phaseName: task.phaseName } : {}),
          ...(task.mentalBenefit ? { mentalBenefit: task.mentalBenefit } : {}),
          ...(task.category ? { category: task.category } : {}),
          ...(task.energyRequired ? { energyRequired: task.energyRequired } : {}),
          ...(task.decisionLoad ? { decisionLoad: task.decisionLoad } : {}),
          ...(task.visualImpact ? { visualImpact: task.visualImpact } : {}),
          ...(task.whyThisMatters
            ? { whyThisMatters: task.whyThisMatters }
            : {}),
          ...(task.resistanceHandler
            ? { resistanceHandler: task.resistanceHandler }
            : {}),
          ...(task.suppliesNeeded ? { suppliesNeeded: task.suppliesNeeded } : {}),
          ...(task.dependencies ? { dependencies: task.dependencies } : {}),
          ...(task.enables ? { enables: task.enables } : {}),
          ...(task.parallelWith ? { parallelWith: task.parallelWith } : {}),
          order: task.order ?? 0,
        });

        for (const [index, subtask] of (task.subtasks ?? []).entries()) {
          await ctx.db.insert("subtasks", {
            taskId,
            userId,
            title: subtask.title,
            completed: subtask.completed ?? false,
            ...(subtask.estimatedSeconds !== undefined
              ? { estimatedSeconds: subtask.estimatedSeconds }
              : {}),
            ...(subtask.estimatedMinutes !== undefined
              ? { estimatedMinutes: subtask.estimatedMinutes }
              : {}),
            ...(subtask.isCheckpoint !== undefined
              ? { isCheckpoint: subtask.isCheckpoint }
              : {}),
            order: index,
          });
        }
      }
    }

    return { success: true };
  },
});

export const getUserState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Batch-fetch all user data in parallel to avoid N+1 query patterns.
    // Previously: for each room -> fetch photos + tasks; for each task -> fetch subtasks.
    // This caused O(rooms * tasks) database queries. Now we use 3 parallel queries
    // via by_userId indexes, then fetch subtasks in a single parallel batch.
    const [rooms, allPhotos, allTasks] = await Promise.all([
      ctx.db
        .query("rooms")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("photos")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("tasks")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    // Batch-fetch all subtasks in parallel (one query per task, but all concurrent)
    const subtaskResults = await Promise.all(
      allTasks.map((task) =>
        ctx.db
          .query("subtasks")
          .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
          .collect()
      )
    );

    // Group photos by roomId
    const photosByRoom = new Map<string, typeof allPhotos>();
    for (const photo of allPhotos) {
      const key = photo.roomId.toString();
      const existing = photosByRoom.get(key) || [];
      existing.push(photo);
      photosByRoom.set(key, existing);
    }

    // Group tasks by roomId
    const tasksByRoom = new Map<string, typeof allTasks>();
    for (const task of allTasks) {
      const key = task.roomId.toString();
      const existing = tasksByRoom.get(key) || [];
      existing.push(task);
      tasksByRoom.set(key, existing);
    }

    // Map subtasks by taskId
    const subtasksByTask = new Map<string, (typeof subtaskResults)[number]>();
    for (let i = 0; i < allTasks.length; i++) {
      subtasksByTask.set(allTasks[i]._id.toString(), subtaskResults[i]);
    }

    const hydratedRooms = rooms.map((room) => {
      const photos = photosByRoom.get(room._id.toString()) || [];
      const tasks = tasksByRoom.get(room._id.toString()) || [];

      const hydratedTasks = tasks
        .sort((left, right) => left.order - right.order)
        .map((task) => {
          const subtasks = subtasksByTask.get(task._id.toString()) || [];
          return {
            id: task._id,
            title: task.title,
            description: task.description,
            emoji: task.emoji,
            priority: task.priority,
            difficulty: task.difficulty,
            estimatedMinutes: task.estimatedMinutes,
            completed: task.completed,
            completedAt: task.completedAt,
            tips: task.tips,
            zone: task.zone,
            targetObjects: task.targetObjects,
            destination: task.destinationLocation
              ? {
                  location: task.destinationLocation,
                  instructions: task.destinationInstructions,
                  requiresSetup: task.destinationRequiresSetup,
                }
              : undefined,
            phase: task.phase,
            phaseName: task.phaseName,
            mentalBenefit: task.mentalBenefit,
            category: task.category,
            energyRequired: task.energyRequired,
            decisionLoad: task.decisionLoad,
            visualImpact: task.visualImpact,
            whyThisMatters: task.whyThisMatters,
            resistanceHandler: task.resistanceHandler,
            suppliesNeeded: task.suppliesNeeded,
            dependencies: task.dependencies,
            enables: task.enables,
            parallelWith: task.parallelWith,
            order: task.order,
            subtasks: subtasks
              .sort((left, right) => left.order - right.order)
              .map((subtask) => ({
                id: subtask._id,
                title: subtask.title,
                completed: subtask.completed,
                estimatedSeconds: subtask.estimatedSeconds,
                estimatedMinutes: subtask.estimatedMinutes,
                isCheckpoint: subtask.isCheckpoint,
              })),
          };
        });

      return {
        id: room._id,
        name: room.name,
        type: room.type,
        emoji: room.emoji,
        createdAt: room.createdAt,
        messLevel: room.messLevel,
        currentProgress: room.currentProgress,
        lastAnalyzedAt: room.lastAnalyzedAt,
        aiSummary: room.aiSummary,
        motivationalMessage: room.motivationalMessage,
        photos: photos
          .sort((left, right) => left.timestamp - right.timestamp)
          .map((photo) => ({
            id: photo._id,
            uri: photo.uri,
            timestamp: photo.timestamp,
            type: photo.type,
          })),
        tasks: hydratedTasks,
      };
    });

    const stats = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const badges = await ctx.db
      .query("badges")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const mascot = await ctx.db
      .query("mascots")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const collection = await ctx.db
      .query("collectedItems")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const collectionStats = await ctx.db
      .query("collectionStats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return {
      profile: {
        id: user._id,
        name: user.name ?? "Declutterer",
        avatar: user.avatar,
        createdAt: user.createdAt ?? user._creationTime,
        onboardingComplete: user.onboardingComplete ?? false,
      },
      rooms: hydratedRooms,
      stats: {
        totalTasksCompleted: stats?.totalTasksCompleted ?? 0,
        totalRoomsCleaned: stats?.totalRoomsCleaned ?? 0,
        currentStreak: stats?.currentStreak ?? 0,
        longestStreak: stats?.longestStreak ?? 0,
        totalMinutesCleaned: stats?.totalMinutesCleaned ?? 0,
        level: stats?.level ?? 1,
        xp: stats?.xp ?? 0,
        lastActivityDate: stats?.lastActivityDate,
        weeklyTaskGoal: stats?.weeklyTaskGoal,
        weeklyTimeGoal: stats?.weeklyTimeGoal,
        streakFreezesAvailable: stats?.streakFreezesAvailable,
        streakFreezesUsedThisMonth: stats?.streakFreezesUsedThisMonth,
        lastStreakFreezeUsed: stats?.lastStreakFreezeUsed,
        badges: badges.map((badge) => ({
          id: badge.badgeId,
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
          unlockedAt: badge.unlockedAt,
          requirement: badge.requirement,
          type: badge.type,
        })),
      },
      settings: settings
        ? {
            notifications: settings.notifications,
            reminderTime: settings.reminderTime,
            theme: settings.theme,
            hapticFeedback: settings.hapticFeedback,
            soundFX: settings.soundFX,
            reducedMotion: settings.reducedMotion,
            encouragementLevel: settings.encouragementLevel,
            taskBreakdownLevel: settings.taskBreakdownLevel,
            focusMode: {
              defaultDuration: settings.focusDefaultDuration,
              breakDuration: settings.focusBreakDuration,
              autoStartBreak: settings.focusAutoStartBreak,
              blockNotifications: settings.focusBlockNotifications,
              playWhiteNoise: settings.focusPlayWhiteNoise,
              whiteNoiseType: settings.focusWhiteNoiseType,
              showMotivationalQuotes: settings.focusShowMotivationalQuotes,
              strictMode: settings.focusStrictMode,
            },
            arCollectionEnabled: settings.arCollectionEnabled,
            collectibleNotifications: settings.collectibleNotifications,
          }
        : null,
      mascot: mascot
        ? {
            name: mascot.name,
            personality: mascot.personality,
            mood: mascot.mood,
            activity: mascot.activity,
            level: mascot.level,
            xp: mascot.xp,
            hunger: mascot.hunger,
            energy: mascot.energy,
            happiness: mascot.happiness,
            lastFed: mascot.lastFed,
            lastInteraction: mascot.lastInteraction,
            createdAt: mascot.createdAt,
            accessories: mascot.accessories,
            currentAccessory: mascot.currentAccessory,
          }
        : null,
      collection: collection.map((item) => ({
        collectibleId: item.collectibleId,
        collectedAt: item.collectedAt,
        roomId: item.roomId,
        taskId: item.taskId,
      })),
      collectionStats: collectionStats
        ? {
            totalCollected: collectionStats.totalCollected,
            uniqueCollected: collectionStats.uniqueCollected,
            commonCount: collectionStats.commonCount,
            uncommonCount: collectionStats.uncommonCount,
            rareCount: collectionStats.rareCount,
            epicCount: collectionStats.epicCount,
            legendaryCount: collectionStats.legendaryCount,
            lastCollected: collectionStats.lastCollected,
          }
        : null,
    };
  },
});
