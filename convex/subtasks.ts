import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return [];

    return await ctx.db
      .query("subtasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    estimatedSeconds: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    isCheckpoint: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Task not found");

    return await ctx.db.insert("subtasks", {
      taskId: args.taskId,
      userId,
      title: args.title,
      order: args.order ?? 0,
      completed: false,
      ...(args.estimatedSeconds !== undefined ? { estimatedSeconds: args.estimatedSeconds } : {}),
      ...(args.estimatedMinutes !== undefined ? { estimatedMinutes: args.estimatedMinutes } : {}),
      ...(args.isCheckpoint !== undefined ? { isCheckpoint: args.isCheckpoint } : {}),
    });
  },
});

export const createMany = mutation({
  args: {
    taskId: v.id("tasks"),
    subtasks: v.array(
      v.object({
        title: v.string(),
        estimatedSeconds: v.optional(v.number()),
        estimatedMinutes: v.optional(v.number()),
        isCheckpoint: v.optional(v.boolean()),
        order: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Task not found");

    const ids = [];
    for (let i = 0; i < args.subtasks.length; i++) {
      const subtask = args.subtasks[i];
      const id = await ctx.db.insert("subtasks", {
        taskId: args.taskId,
        userId,
        title: subtask.title,
        order: subtask.order ?? i,
        completed: false,
        ...(subtask.estimatedSeconds !== undefined ? { estimatedSeconds: subtask.estimatedSeconds } : {}),
        ...(subtask.estimatedMinutes !== undefined ? { estimatedMinutes: subtask.estimatedMinutes } : {}),
        ...(subtask.isCheckpoint !== undefined ? { isCheckpoint: subtask.isCheckpoint } : {}),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const toggle = mutation({
  args: { id: v.id("subtasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const subtask = await ctx.db.get(args.id);
    if (!subtask || subtask.userId !== userId)
      throw new Error("Subtask not found");

    const completed = !subtask.completed;
    await ctx.db.patch(args.id, {
      completed,
    });
    return { completed };
  },
});

export const remove = mutation({
  args: { id: v.id("subtasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const subtask = await ctx.db.get(args.id);
    if (!subtask || subtask.userId !== userId)
      throw new Error("Subtask not found");

    await ctx.db.delete(args.id);
  },
});
