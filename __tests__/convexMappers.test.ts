import {
  mapConvexRoomToRoom,
  mapConvexSettingsToAppSettings,
  mapConvexStatsToUserStats,
} from '@/services/convexMappers';

describe('convex mappers', () => {
  test('maps flat Convex settings into nested app settings', () => {
    const settings = mapConvexSettingsToAppSettings({
      notifications: false,
      reminderTime: '08:30',
      theme: 'dark',
      hapticFeedback: false,
      encouragementLevel: 'maximum',
      taskBreakdownLevel: 'ultra',
      focusDefaultDuration: 45,
      focusBreakDuration: 10,
      focusAutoStartBreak: false,
      focusBlockNotifications: false,
      focusPlayWhiteNoise: true,
      focusWhiteNoiseType: 'rain',
      focusShowMotivationalQuotes: false,
      focusStrictMode: true,
      arCollectionEnabled: false,
      collectibleNotifications: false,
    });

    expect(settings).toEqual({
      notifications: false,
      reminderTime: '08:30',
      theme: 'dark',
      hapticFeedback: false,
      encouragementLevel: 'maximum',
      taskBreakdownLevel: 'ultra',
      focusMode: {
        defaultDuration: 45,
        breakDuration: 10,
        autoStartBreak: false,
        blockNotifications: false,
        playWhiteNoise: true,
        whiteNoiseType: 'rain',
        showMotivationalQuotes: false,
        strictMode: true,
      },
      arCollectionEnabled: false,
      collectibleNotifications: false,
    });
  });

  test('maps Convex room, photos, tasks, and subtasks into room state', () => {
    const room = mapConvexRoomToRoom(
      {
        _id: 'room_1',
        name: 'Kitchen',
        type: 'kitchen',
        emoji: '🍳',
        createdAt: 1000,
        messLevel: 82,
        currentProgress: 25,
        lastAnalyzedAt: 2000,
        aiSummary: 'Counter clutter and dishes',
        motivationalMessage: 'Start with the sink.',
      },
      [
        {
          _id: 'photo_1',
          roomId: 'room_1',
          uri: 'file:///before.jpg',
          type: 'before',
          timestamp: 3000,
        },
      ],
      [
        {
          _id: 'task_2',
          roomId: 'room_1',
          title: 'Wipe counters',
          description: 'Clear and wipe the main counter',
          emoji: '🧽',
          priority: 'medium',
          difficulty: 'quick',
          estimatedMinutes: 5,
          completed: false,
          order: 1,
        },
        {
          _id: 'task_1',
          roomId: 'room_1',
          title: 'Wash dishes',
          description: 'Start with the sink',
          emoji: '🍽️',
          priority: 'high',
          difficulty: 'medium',
          estimatedMinutes: 15,
          completed: true,
          completedAt: 4000,
          order: 0,
        },
      ],
      {
        task_1: [
          {
            _id: 'subtask_1',
            taskId: 'task_1',
            title: 'Rinse plates',
            completed: true,
            estimatedSeconds: 45,
            isCheckpoint: true,
            order: 0,
          },
        ],
      }
    );

    expect(room.id).toBe('room_1');
    expect(room.lastAnalyzedAt).toEqual(new Date(2000));
    expect(room.photos[0]).toEqual({
      id: 'photo_1',
      uri: 'file:///before.jpg',
      timestamp: new Date(3000),
      type: 'before',
    });
    expect(room.tasks.map((task) => task.id)).toEqual(['task_1', 'task_2']);
    expect(room.tasks[0].completedAt).toEqual(new Date(4000));
    expect(room.tasks[0].subtasks).toEqual([
      {
        id: 'subtask_1',
        title: 'Rinse plates',
        completed: true,
        estimatedSeconds: 45,
        isCheckpoint: true,
      },
    ]);
  });

  test('maps Convex stats and badges into user stats', () => {
    const stats = mapConvexStatsToUserStats(
      {
        totalTasksCompleted: 12,
        totalRoomsCleaned: 3,
        currentStreak: 4,
        longestStreak: 6,
        totalMinutesCleaned: 95,
        level: 2,
        xp: 140,
        lastActivityDate: '2026-03-13',
        weeklyTaskGoal: 20,
      },
      [
        {
          badgeId: 'first-task',
          name: 'First Step',
          description: 'Complete your first task',
          emoji: '🌱',
          unlockedAt: 5000,
          requirement: 1,
          type: 'tasks',
        },
      ]
    );

    expect(stats.totalTasksCompleted).toBe(12);
    expect(stats.badges).toEqual([
      {
        id: 'first-task',
        name: 'First Step',
        description: 'Complete your first task',
        emoji: '🌱',
        unlockedAt: new Date(5000),
        requirement: 1,
        type: 'tasks',
      },
    ]);
    expect(stats.weeklyTaskGoal).toBe(20);
  });
});
