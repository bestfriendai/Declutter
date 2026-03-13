import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const priorityValidator = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

const difficultyValidator = v.union(
  v.literal("quick"),
  v.literal("medium"),
  v.literal("challenging")
);

export const listByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== userId) return [];

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    return tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
});

export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    title: v.string(),
    description: v.string(),
    emoji: v.string(),
    priority: priorityValidator,
    difficulty: difficultyValidator,
    estimatedMinutes: v.number(),
    completed: v.optional(v.boolean()),
    tips: v.optional(v.array(v.string())),
    zone: v.optional(v.string()),
    targetObjects: v.optional(v.array(v.string())),
    destinationLocation: v.optional(v.string()),
    destinationInstructions: v.optional(v.string()),
    destinationRequiresSetup: v.optional(v.string()),
    category: v.optional(v.string()),
    energyRequired: v.optional(v.string()),
    decisionLoad: v.optional(v.string()),
    visualImpact: v.optional(v.string()),
    whyThisMatters: v.optional(v.string()),
    resistanceHandler: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    enables: v.optional(v.array(v.string())),
    parallelWith: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== userId) throw new Error("Room not found");

    const completed = args.completed ?? false;
    return await ctx.db.insert("tasks", {
      roomId: args.roomId,
      userId,
      title: args.title,
      description: args.description,
      emoji: args.emoji,
      priority: args.priority,
      difficulty: args.difficulty,
      estimatedMinutes: args.estimatedMinutes,
      completed,
      ...(completed ? { completedAt: Date.now() } : {}),
      tips: args.tips,
      zone: args.zone,
      targetObjects: args.targetObjects,
      destinationLocation: args.destinationLocation,
      destinationInstructions: args.destinationInstructions,
      destinationRequiresSetup: args.destinationRequiresSetup,
      category: args.category,
      energyRequired: args.energyRequired,
      decisionLoad: args.decisionLoad,
      visualImpact: args.visualImpact,
      whyThisMatters: args.whyThisMatters,
      resistanceHandler: args.resistanceHandler,
      dependencies: args.dependencies,
      enables: args.enables,
      parallelWith: args.parallelWith,
      order: args.order ?? 0,
    });
  },
});

export const createMany = mutation({
  args: {
    roomId: v.id("rooms"),
    tasks: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        emoji: v.string(),
        priority: priorityValidator,
        difficulty: difficultyValidator,
        estimatedMinutes: v.number(),
        completed: v.optional(v.boolean()),
        tips: v.optional(v.array(v.string())),
        zone: v.optional(v.string()),
        targetObjects: v.optional(v.array(v.string())),
        destinationLocation: v.optional(v.string()),
        destinationInstructions: v.optional(v.string()),
        destinationRequiresSetup: v.optional(v.string()),
        category: v.optional(v.string()),
        energyRequired: v.optional(v.string()),
        decisionLoad: v.optional(v.string()),
        visualImpact: v.optional(v.string()),
        whyThisMatters: v.optional(v.string()),
        resistanceHandler: v.optional(v.string()),
        dependencies: v.optional(v.array(v.string())),
        enables: v.optional(v.array(v.string())),
        parallelWith: v.optional(v.array(v.string())),
        order: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== userId) throw new Error("Room not found");

    const ids = [];
    for (let i = 0; i < args.tasks.length; i++) {
      const task = args.tasks[i];
      const taskCompleted = task.completed ?? false;
      const id = await ctx.db.insert("tasks", {
        roomId: args.roomId,
        userId,
        title: task.title,
        description: task.description,
        emoji: task.emoji,
        priority: task.priority,
        difficulty: task.difficulty,
        estimatedMinutes: task.estimatedMinutes,
        completed: taskCompleted,
        ...(taskCompleted ? { completedAt: Date.now() } : {}),
        tips: task.tips,
        zone: task.zone,
        targetObjects: task.targetObjects,
        destinationLocation: task.destinationLocation,
        destinationInstructions: task.destinationInstructions,
        destinationRequiresSetup: task.destinationRequiresSetup,
        category: task.category,
        energyRequired: task.energyRequired,
        decisionLoad: task.decisionLoad,
        visualImpact: task.visualImpact,
        whyThisMatters: task.whyThisMatters,
        resistanceHandler: task.resistanceHandler,
        dependencies: task.dependencies,
        enables: task.enables,
        parallelWith: task.parallelWith,
        order: task.order ?? i,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    priority: v.optional(priorityValidator),
    difficulty: v.optional(difficultyValidator),
    estimatedMinutes: v.optional(v.number()),
    tips: v.optional(v.array(v.string())),
    zone: v.optional(v.string()),
    targetObjects: v.optional(v.array(v.string())),
    destinationLocation: v.optional(v.string()),
    destinationInstructions: v.optional(v.string()),
    destinationRequiresSetup: v.optional(v.string()),
    category: v.optional(v.string()),
    energyRequired: v.optional(v.string()),
    decisionLoad: v.optional(v.string()),
    visualImpact: v.optional(v.string()),
    whyThisMatters: v.optional(v.string()),
    resistanceHandler: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    enables: v.optional(v.array(v.string())),
    parallelWith: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) throw new Error("Task not found");

    const { id: _id, ...updates } = args;
    // Remove undefined values so we only patch fields that were provided
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    // Handle completedAt when completed changes
    if (args.completed !== undefined) {
      patch.completedAt = args.completed ? Date.now() : undefined;
    }

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) throw new Error("Task not found");

    const completed = !task.completed;
    await ctx.db.patch(args.id, {
      completed,
      completedAt: completed ? Date.now() : undefined,
    });
    return { completed };
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) throw new Error("Task not found");

    // Delete all subtasks
    const subtasks = await ctx.db
      .query("subtasks")
      .filter((q) => q.eq(q.field("taskId"), args.id))
      .collect();
    for (const subtask of subtasks) {
      await ctx.db.delete(subtask._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("tasks"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    for (const update of args.updates) {
      const task = await ctx.db.get(update.id);
      if (!task || task.userId !== userId) continue;
      await ctx.db.patch(update.id, {
        order: update.order,
      });
    }
  },
});
