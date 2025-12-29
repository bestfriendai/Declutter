/**
 * Audio Service for Focus Mode
 * Manages ambient sounds and white noise for focus sessions
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import { FocusModeSettings } from '@/types/declutter';

// Audio instance for ambient sounds
let ambientSound: Audio.Sound | null = null;
let isPlaying = false;

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
    console.error('Error initializing audio:', error);
  }
}

/**
 * Play ambient sound based on type
 */
export async function playAmbientSound(type: FocusModeSettings['whiteNoiseType']): Promise<void> {
  // Stop any existing sound first
  await stopAmbientSound();

  if (type === 'none') {
    return;
  }

  const soundUrl = AMBIENT_SOUNDS[type];
  if (!soundUrl) {
    console.warn(`No sound URL for type: ${type}`);
    return;
  }

  try {
    await initializeAudio();

    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUrl },
      {
        isLooping: true,
        volume: 0.5,
        shouldPlay: true,
      }
    );

    ambientSound = sound;
    isPlaying = true;

    // Listen for playback status updates
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        isPlaying = status.isPlaying;
      }
    });
  } catch (error) {
    console.error('Error playing ambient sound:', error);
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
    console.error('Error stopping ambient sound:', error);
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
    console.error('Error pausing ambient sound:', error);
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
    console.error('Error resuming ambient sound:', error);
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
    console.error('Error setting volume:', error);
  }
}

/**
 * Get current playback state
 */
export function isAmbientPlaying(): boolean {
  return isPlaying;
}

/**
 * Play a short notification/success sound
 */
export async function playSuccessSound(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2002/2002-preview.mp3' },
      { shouldPlay: true, volume: 0.3 }
    );

    // Unload after playing
    sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
}

/**
 * Play timer complete sound
 */
export async function playTimerCompleteSound(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' },
      { shouldPlay: true, volume: 0.5 }
    );

    sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing timer complete sound:', error);
  }
}

/**
 * Play break start sound
 */
export async function playBreakSound(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3' },
      { shouldPlay: true, volume: 0.4 }
    );

    sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing break sound:', error);
  }
}
