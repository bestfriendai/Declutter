/**
 * Declutterly - Share Service
 * Utility functions for sharing room transformations, achievements, and streaks.
 */

import { Platform, Share } from 'react-native';

const APP_URL = 'https://declutterly.app';
const HASHTAGS = '#Declutterly #ADHDCleaning';

/**
 * Share a before/after transformation card image via native share sheet.
 * @param uri - Local file URI of the captured card image
 * @param roomName - Name of the room for the share message
 * @returns true if shared successfully
 */
export async function shareBeforeAfterCard(
  uri: string,
  roomName: string
): Promise<boolean> {
  try {
    const message = `Check out my ${roomName} transformation! Cleaned with Declutterly ${APP_URL}`;

    if (Platform.OS === 'ios') {
      const result = await Share.share({
        url: uri,
        message,
      });
      return result.action === Share.sharedAction;
    } else {
      const result = await Share.share({
        message: `${message}\n${uri}`,
        title: `${roomName} Transformation`,
      });
      return result.action === Share.sharedAction;
    }
  } catch (error) {
    if (__DEV__) console.log('Share card cancelled or failed:', error);
    return false;
  }
}

/**
 * Share an achievement/badge unlock.
 */
export async function shareAchievement(
  badgeName: string,
  badgeEmoji: string,
  level: number
): Promise<boolean> {
  try {
    const message = `I just earned the ${badgeEmoji} ${badgeName} badge on Declutterly! Level ${level} ${HASHTAGS}\n${APP_URL}`;
    const result = await Share.share({
      message,
      title: `${badgeEmoji} Badge Unlocked!`,
    });
    return result.action === Share.sharedAction;
  } catch (error) {
    if (__DEV__) console.log('Share achievement cancelled or failed:', error);
    return false;
  }
}

/**
 * Share a streak milestone.
 */
export async function shareStreakMilestone(streak: number): Promise<boolean> {
  try {
    const message = `${streak}-day cleaning streak on Declutterly! Organize your space, organize your mind. ${HASHTAGS}\n${APP_URL}`;
    const result = await Share.share({
      message,
      title: `${streak}-Day Streak!`,
    });
    return result.action === Share.sharedAction;
  } catch (error) {
    if (__DEV__) console.log('Share streak cancelled or failed:', error);
    return false;
  }
}

/**
 * Share a room completion with stats.
 */
export async function shareRoomCompletion(
  roomName: string,
  tasksCompleted: number,
  timeSpent: number
): Promise<boolean> {
  try {
    const message = getRoomShareMessage(roomName, tasksCompleted, timeSpent);
    const result = await Share.share({
      message,
      title: `${roomName} Complete!`,
    });
    return result.action === Share.sharedAction;
  } catch (error) {
    if (__DEV__) console.log('Share room completion cancelled or failed:', error);
    return false;
  }
}

/**
 * Generate a share message for room completion.
 */
export function getRoomShareMessage(
  roomName: string,
  tasksCompleted: number,
  timeSpent: number
): string {
  const taskWord = tasksCompleted === 1 ? 'task' : 'tasks';
  return `Just cleaned my ${roomName}! ${tasksCompleted} ${taskWord} done in ${timeSpent} minutes ${HASHTAGS}\n${APP_URL}`;
}

/**
 * Share an invite code for accountability partners.
 */
export async function shareInviteCode(inviteCode: string): Promise<boolean> {
  try {
    const message = `Join me on Declutterly! Use my invite code: ${inviteCode}\n\nWe can keep each other accountable and make cleaning fun.\n${APP_URL}`;
    const result = await Share.share({
      message,
      title: 'Join me on Declutterly!',
    });
    return result.action === Share.sharedAction;
  } catch (error) {
    if (__DEV__) console.log('Share invite code cancelled or failed:', error);
    return false;
  }
}
