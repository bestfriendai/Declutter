/**
 * Audio Service for Focus Mode
 * Manages ambient sounds and white noise for focus sessions
 *
 * Respects the global sound-effects toggle from settings.
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import type { FocusModeSettings } from '@/types/declutter';
import { retry, isNetworkError } from '@/utils/retry';

// Audio instance for ambient sounds
let ambientSound: Audio.Sound | null = null;
let isPlaying = false;

// Global sound-effects toggle — set from settings
let soundEffectsEnabled = true;

export function setSoundEffectsEnabled(enabled: boolean) {
  soundEffectsEnabled = enabled;
  // If sound was just disabled, stop any playing ambient sound
  if (!enabled) {
    stopAmbientSound();
  }
}

export function isSoundEffectsEnabled(): boolean {
  return soundEffectsEnabled;
}

// White noise type mapping to actual sound files/URLs
// Using free ambient sounds from reliable sources
const AMBIENT_SOUNDS: Record<string, string> = {
  rain: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  ocean: 'https://assets.mixkit.co/active_storage/sfx/669/669-preview.mp3',
  forest: 'https://assets.mixkit.co/active_storage/sfx/3052/3052-preview.mp3',
  cafe: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
};

// Sound descriptors for UI
export const SOUND_INFO: Record<string, { label: string; emoji: string; description: string }> = {
  none: { label: 'No Sound', emoji: '🔇', description: 'Pure silence' },
  rain: { label: 'Rain', emoji: '🌧️', description: 'Gentle rain sounds' },
  ocean: { label: 'Ocean', emoji: '🌊', description: 'Calming ocean waves' },
  forest: { label: 'Forest', emoji: '🌲', description: 'Peaceful forest ambience' },
  cafe: { label: 'Cafe', emoji: '☕', description: 'Cozy cafe background' },
};

/**
 * Initialize audio mode for background playback
 */
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    if (__DEV__) console.error('Error initializing audio:', error);
  }
}

/**
 * Load a sound with retry logic for network failures
 */
async function loadSoundWithRetry(
  uri: string,
  options: { isLooping?: boolean; volume?: number; shouldPlay?: boolean } = {}
): Promise<Audio.Sound> {
  const { sound } = await retry(
    async () => {
      return Audio.Sound.createAsync(
        { uri },
        {
          isLooping: options.isLooping ?? false,
          volume: options.volume ?? 0.5,
          shouldPlay: options.shouldPlay ?? true,
        }
      );
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      isRetryable: (error) => isNetworkError(error),
      onRetry: (attempt, error, nextDelayMs) => {
        if (__DEV__) {
          console.log(`Audio load retry ${attempt}: ${error.message}. Retrying in ${nextDelayMs}ms`);
        }
      },
    }
  );

  return sound;
}

/**
 * Play ambient sound based on type
 */
export async function playAmbientSound(type: FocusModeSettings['whiteNoiseType']): Promise<void> {
  if (!soundEffectsEnabled) return;

  // Stop any existing sound first
  await stopAmbientSound();

  if (type === 'none') {
    return;
  }

  const soundUrl = AMBIENT_SOUNDS[type];
  if (!soundUrl) {
    if (__DEV__) {
      console.warn(`No sound URL for type: ${type}`);
    }
    return;
  }

  try {
    await initializeAudio();

    const sound = await loadSoundWithRetry(soundUrl, {
      isLooping: true,
      volume: 0.5,
      shouldPlay: true,
    });

    ambientSound = sound;
    isPlaying = true;

    // Listen for playback status updates
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        isPlaying = status.isPlaying;

        // Handle playback errors and attempt recovery
        if ('error' in status && status.error) {
          if (__DEV__) {
            console.warn('Playback error detected:', status.error);
          }
          // Attempt to recover by reloading the sound
          handlePlaybackError(type);
        }
      }
    });
  } catch (error) {
    if (__DEV__) console.error('Error playing ambient sound after retries:', error);
    // Reset state on failure
    ambientSound = null;
    isPlaying = false;
  }
}

/**
 * Handle playback errors by attempting to recover
 */
async function handlePlaybackError(type: FocusModeSettings['whiteNoiseType']): Promise<void> {
  // Wait a moment before attempting recovery
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Only attempt recovery if we still expect to be playing
  if (isPlaying) {
    if (__DEV__) {
      console.log('Attempting audio recovery...');
    }
    try {
      await playAmbientSound(type);
    } catch (error) {
      if (__DEV__) console.error('Audio recovery failed:', error);
    }
  }
}

/**
 * Stop ambient sound
 */
export async function stopAmbientSound(): Promise<void> {
  try {
    if (ambientSound) {
      await ambientSound.stopAsync();
      await ambientSound.unloadAsync();
      ambientSound = null;
      isPlaying = false;
    }
  } catch (error) {
    if (__DEV__) console.error('Error stopping ambient sound:', error);
  }
}

/**
 * Pause ambient sound
 */
export async function pauseAmbientSound(): Promise<void> {
  try {
    if (ambientSound && isPlaying) {
      await ambientSound.pauseAsync();
      isPlaying = false;
    }
  } catch (error) {
    if (__DEV__) console.error('Error pausing ambient sound:', error);
  }
}

/**
 * Resume ambient sound
 */
export async function resumeAmbientSound(): Promise<void> {
  try {
    if (ambientSound && !isPlaying) {
      await ambientSound.playAsync();
      isPlaying = true;
    }
  } catch (error) {
    if (__DEV__) console.error('Error resuming ambient sound:', error);
  }
}

/**
 * Set volume (0-1)
 */
export async function setVolume(volume: number): Promise<void> {
  try {
    if (ambientSound) {
      await ambientSound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    }
  } catch (error) {
    if (__DEV__) console.error('Error setting volume:', error);
  }
}

/**
 * Get current playback state
 */
export function isAmbientPlaying(): boolean {
  return isPlaying;
}

/**
 * Helper to play a one-shot sound with retry and auto-cleanup.
 * Respects the global sound-effects toggle.
 */
async function playOneShotSound(uri: string, volume: number = 0.5): Promise<void> {
  if (!soundEffectsEnabled) return;
  try {
    const sound = await loadSoundWithRetry(uri, {
      shouldPlay: true,
      volume,
      isLooping: false,
    });

    // Unload after playing
    sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    // One-shot sounds are non-critical, just log the error
    if (__DEV__) {
      console.warn('Error playing one-shot sound:', error);
    }
  }
}

/**
 * Play a short notification/success sound
 */
export async function playSuccessSound(): Promise<void> {
  await playOneShotSound(
    'https://assets.mixkit.co/active_storage/sfx/2002/2002-preview.mp3',
    0.3
  );
}

/**
 * Play timer complete sound
 */
export async function playTimerCompleteSound(): Promise<void> {
  await playOneShotSound(
    'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    0.5
  );
}

/**
 * Play break start sound
 */
export async function playBreakSound(): Promise<void> {
  await playOneShotSound(
    'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3',
    0.4
  );
}

// ============================================
// GAMIFICATION SOUNDS
// ============================================

// Sound URLs for gamification (using free sound effects)
const GAMIFICATION_SOUNDS = {
  taskComplete: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Satisfying ding
  combo: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Combo flourish
  milestone: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Achievement
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Level up fanfare
  streak: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3', // Streak sound
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // Tick
  launch: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Whoosh/launch
  encouragement: 'https://assets.mixkit.co/active_storage/sfx/2007/2007-preview.mp3', // Soft chime
};

/**
 * Play task completion sound - satisfying "ding!"
 */
export async function playTaskCompleteSound(): Promise<void> {
  await playOneShotSound(GAMIFICATION_SOUNDS.taskComplete, 0.5);
}

/**
 * Play combo sound - for consecutive task completions
 */
export async function playComboSound(): Promise<void> {
  await playOneShotSound(GAMIFICATION_SOUNDS.combo, 0.6);
}

/**
 * Play milestone sound - for 25%, 50%, 75%, 100% progress
 */
export async function playMilestoneSound(): Promise<void> {
  await playOneShotSound(GAMIFICATION_SOUNDS.milestone, 0.6);
}

/**
 * Play level up sound
 */
export async function playLevelUpSound(): Promise<void> {
  await playOneShotSound(GAMIFICATION_SOUNDS.levelUp, 0.7);
}

/**
 * Play countdown tick sound
 */
export async function playCountdownSound(): Promise<void> {
  await playOneShotSound(GAMIFICATION_SOUNDS.countdown, 0.3);
}

/**
 * Play launch/start sound
 */
export async function playLaunchSound(): Promise<void> {
  await playOneShotSound(GAMIFICATION_SOUNDS.launch, 0.5);
}

/**
 * Play soft encouragement chime
 */
export async function playEncouragementSound(): Promise<void> {
  await playOneShotSound(GAMIFICATION_SOUNDS.encouragement, 0.25);
}
