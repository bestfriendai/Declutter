import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CleaningTask,
  TaskCategory,
  EnergyLevel,
  RoomType,
  UserCleaningProfile,
  TaskPerformanceHistory,
} from '@/types/declutter';

const PROFILE_STORAGE_KEY = '@declutterly_user_cleaning_profile';
const TASK_HISTORY_KEY = '@declutterly_task_history';

interface TaskCompletionEvent {
  taskId: string;
  category?: TaskCategory;
  estimatedMinutes: number;
  actualMinutes?: number;
  energyRequired?: EnergyLevel;
  wasSkipped: boolean;
  timestamp: number;
  dayOfWeek: number;
  hourOfDay: number;
  roomType?: RoomType;
  difficultyFeedback?: 'easier' | 'accurate' | 'harder';
}

const defaultProfile: UserCleaningProfile = {
  taskHistory: [],
  energyPatterns: [],
  preferences: {
    preferredTaskSize: 'small',
    preferredSessionLength: 15,
    needsMoreBreakdown: false,
    respondsToGamification: true,
    prefersQuickWinsFirst: true,
    avoidsDecisionTasks: false,
  },
  roomInsights: [],
  motivationProfile: {
    respondsToChallenges: true,
    needsFrequentEncouragement: true,
    preferredEncouragementStyle: 'cheerful',
    celebrationPreference: 'moderate',
  },
};

export async function getUserCleaningProfile(): Promise<UserCleaningProfile> {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultProfile, ...JSON.parse(stored) };
      } catch {
        return defaultProfile;
      }
    }
  } catch (error) {
    if (__DEV__) console.error('Error loading user cleaning profile:', error);
  }
  return defaultProfile;
}

export async function saveUserCleaningProfile(profile: UserCleaningProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    if (__DEV__) console.error('Error saving user cleaning profile:', error);
  }
}

export async function recordTaskCompletion(
  task: CleaningTask,
  actualMinutes?: number,
  wasSkipped: boolean = false,
  roomType?: RoomType
): Promise<void> {
  const now = new Date();
  const event: TaskCompletionEvent = {
    taskId: task.id,
    category: task.category,
    estimatedMinutes: task.estimatedMinutes,
    actualMinutes,
    energyRequired: task.energyRequired,
    wasSkipped,
    timestamp: now.getTime(),
    dayOfWeek: now.getDay(),
    hourOfDay: now.getHours(),
    roomType,
    difficultyFeedback: task.difficultyFeedback,
  };

  try {
    const historyRaw = await AsyncStorage.getItem(TASK_HISTORY_KEY);
    let history: TaskCompletionEvent[] = [];
    if (historyRaw) {
      try {
        history = JSON.parse(historyRaw);
      } catch {
        // Corrupted history — start fresh
      }
    }
    
    history.push(event);
    
    const MAX_HISTORY = 500;
    const trimmedHistory = history.slice(-MAX_HISTORY);
    
    await AsyncStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(trimmedHistory));
    
    await updateProfileFromHistory(trimmedHistory);
  } catch (error) {
    if (__DEV__) console.error('Error recording task completion:', error);
  }
}

async function updateProfileFromHistory(history: TaskCompletionEvent[]): Promise<void> {
  const profile = await getUserCleaningProfile();
  
  const categoryStats = new Map<TaskCategory, { completed: number; skipped: number; totalTimeRatio: number }>();
  
  for (const event of history) {
    if (!event.category) continue;
    
    const stats = categoryStats.get(event.category) || { completed: 0, skipped: 0, totalTimeRatio: 0 };
    
    if (event.wasSkipped) {
      stats.skipped++;
    } else {
      stats.completed++;
      if (event.actualMinutes && event.estimatedMinutes > 0) {
        stats.totalTimeRatio += event.actualMinutes / event.estimatedMinutes;
      }
    }
    
    categoryStats.set(event.category, stats);
  }
  
  const taskHistory: TaskPerformanceHistory[] = [];
  categoryStats.forEach((stats, category) => {
    const total = stats.completed + stats.skipped;
    if (total > 0) {
      taskHistory.push({
        category,
        completionRate: stats.completed / total,
        averageTimeVsEstimate: stats.completed > 0 ? stats.totalTimeRatio / stats.completed : 1,
        skipRate: stats.skipped / total,
      });
    }
  });
  
  profile.taskHistory = taskHistory;
  
  const dayStats = new Map<number, { totalEnergy: number; count: number }>();
  for (const event of history) {
    if (event.wasSkipped || !event.energyRequired) continue;
    
    const energyValue = { minimal: 1, low: 2, moderate: 3, high: 4 }[event.energyRequired] || 2;
    const stats = dayStats.get(event.dayOfWeek) || { totalEnergy: 0, count: 0 };
    stats.totalEnergy += energyValue;
    stats.count++;
    dayStats.set(event.dayOfWeek, stats);
  }
  
  profile.energyPatterns = [];
  dayStats.forEach((stats, dayOfWeek) => {
    profile.energyPatterns.push({
      dayOfWeek,
      averageEnergy: stats.totalEnergy / stats.count,
    });
  });
  
  const recentHistory = history.slice(-50);
  const avgSessionLength = recentHistory.reduce((sum, e) => sum + (e.actualMinutes || e.estimatedMinutes), 0) / Math.max(recentHistory.length, 1);
  
  if (avgSessionLength < 10) {
    profile.preferences.preferredTaskSize = 'tiny';
    profile.preferences.preferredSessionLength = 5;
  } else if (avgSessionLength < 20) {
    profile.preferences.preferredTaskSize = 'small';
    profile.preferences.preferredSessionLength = 15;
  } else {
    profile.preferences.preferredTaskSize = 'medium';
    profile.preferences.preferredSessionLength = 30;
  }
  
  const decisionTaskHistory = taskHistory.filter(h => 
    h.category === 'donation_sorting' || h.category === 'organization'
  );
  if (decisionTaskHistory.length > 0) {
    const avgSkipRate = decisionTaskHistory.reduce((sum, h) => sum + h.skipRate, 0) / decisionTaskHistory.length;
    profile.preferences.avoidsDecisionTasks = avgSkipRate > 0.4;
  }
  
  const quickTasksFirst = recentHistory.slice(0, 10).filter(e => e.estimatedMinutes <= 5).length;
  profile.preferences.prefersQuickWinsFirst = quickTasksFirst > 5;
  
  await saveUserCleaningProfile(profile);
}

export function optimizeTaskOrder(
  tasks: CleaningTask[],
  profile: UserCleaningProfile,
  currentEnergy: EnergyLevel = 'moderate'
): CleaningTask[] {
  const energyValue = { minimal: 1, low: 2, moderate: 3, high: 4 };
  const userEnergy = energyValue[currentEnergy];
  
  const scored = tasks.map(task => {
    let score = 0;
    
    const taskEnergy = task.energyRequired ? energyValue[task.energyRequired] : 2;
    if (taskEnergy <= userEnergy) {
      score += 20;
    } else {
      score -= (taskEnergy - userEnergy) * 15;
    }
    
    if (profile.preferences.prefersQuickWinsFirst && task.estimatedMinutes <= 5) {
      score += 25;
    }
    
    if (task.visualImpact === 'high') {
      score += 15;
    } else if (task.visualImpact === 'medium') {
      score += 8;
    }
    
    if (profile.preferences.avoidsDecisionTasks) {
      if (task.decisionLoad === 'high') {
        score -= 20;
      } else if (task.decisionLoad === 'medium') {
        score -= 10;
      }
    }
    
    if (task.category) {
      const categoryHistory = profile.taskHistory.find(h => h.category === task.category);
      if (categoryHistory) {
        score += categoryHistory.completionRate * 10;
        score -= categoryHistory.skipRate * 15;
      }
    }
    
    if (task.priority === 'high') {
      score += 10;
    } else if (task.priority === 'low') {
      score -= 5;
    }
    
    if (task.dependencies && task.dependencies.length > 0) {
      score -= 10;
    }
    
    if (task.enables && task.enables.length > 0) {
      score += task.enables.length * 5;
    }
    
    return { task, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.map(s => s.task);
}

export function getPersonalizedEncouragement(
  profile: UserCleaningProfile,
  context: { tasksCompleted: number; streak: number; timeOfDay: string }
): string {
  const style = profile.motivationProfile.preferredEncouragementStyle;
  const { tasksCompleted, streak, timeOfDay } = context;
  
  const messages = {
    cheerful: {
      morning: [
        "Good morning! Let's start fresh! ✨",
        "Rise and shine! Your space is waiting! 🌅",
        "Morning energy is the best! Let's go! 💪",
      ],
      afternoon: [
        "Afternoon productivity mode: ON! 🚀",
        "Keep that momentum going! You're amazing! ⭐",
        "Halfway through the day - you've got this! 💫",
      ],
      evening: [
        "Evening declutter time - so relaxing! 🌙",
        "Wind down by tidying up - you're doing great! 🎉",
        "Perfect time for a quick win! ✨",
      ],
    },
    calm: {
      morning: [
        "Start your day with a clear space, clear mind.",
        "Take it one step at a time this morning.",
        "A peaceful start to your day.",
      ],
      afternoon: [
        "Steady progress throughout the day.",
        "You're making meaningful progress.",
        "Each task completed brings more calm.",
      ],
      evening: [
        "End your day with a sense of accomplishment.",
        "A tidy space for a restful night.",
        "You've done well today.",
      ],
    },
    'matter-of-fact': {
      morning: [
        `${tasksCompleted} tasks completed. Good start.`,
        "Morning session ready.",
        "Ready when you are.",
      ],
      afternoon: [
        `Progress: ${tasksCompleted} tasks done.`,
        "Continuing from where you left off.",
        "Afternoon session available.",
      ],
      evening: [
        `Day summary: ${tasksCompleted} tasks completed.`,
        "Evening tasks ready.",
        `Current streak: ${streak} days.`,
      ],
    },
  };
  
  const timeMessages = messages[style][timeOfDay as keyof typeof messages.cheerful] || messages[style].afternoon;
  return timeMessages[Math.floor(Math.random() * timeMessages.length)];
}

export function suggestSessionDuration(
  profile: UserCleaningProfile,
  currentEnergy: EnergyLevel,
  availableTasks: CleaningTask[]
): { minutes: number; taskCount: number; reason: string } {
  const baseMinutes = profile.preferences.preferredSessionLength;
  
  const energyMultiplier = {
    minimal: 0.5,
    low: 0.75,
    moderate: 1.0,
    high: 1.25,
  };
  
  const adjustedMinutes = Math.round(baseMinutes * energyMultiplier[currentEnergy]);
  
  let cumulativeTime = 0;
  let taskCount = 0;
  for (const task of availableTasks) {
    if (cumulativeTime + task.estimatedMinutes <= adjustedMinutes) {
      cumulativeTime += task.estimatedMinutes;
      taskCount++;
    } else {
      break;
    }
  }
  
  const reasons = {
    minimal: "Starting small - that's perfect for low energy days",
    low: "A gentle session to match your current energy",
    moderate: "A balanced session based on your usual pace",
    high: "You've got energy today - let's make the most of it!",
  };
  
  return {
    minutes: adjustedMinutes,
    taskCount,
    reason: reasons[currentEnergy],
  };
}

export async function clearTaskHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TASK_HISTORY_KEY);
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error clearing task history:', error);
  }
}
