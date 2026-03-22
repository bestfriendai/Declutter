/**
 * Declutterly -- Mascot Image Registry
 * Maps mood/activity states to the generated Dusty PNG illustrations.
 */

export const MascotImages = {
  happy: require('@/assets/generated/mascot/dusty_happy.png'),
  celebrating: require('@/assets/generated/mascot/dusty_celebrating.png'),
  sad: require('@/assets/generated/mascot/dusty_sad.png'),
  sleeping: require('@/assets/generated/mascot/dusty_sleeping.png'),
  cleaning: require('@/assets/generated/mascot/dusty_cleaning.png'),
  proud: require('@/assets/generated/mascot/dusty_proud.png'),
  waving: require('@/assets/generated/mascot/dusty_waving.png'),
  thinking: require('@/assets/generated/mascot/dusty_thinking.png'),
  encouraging: require('@/assets/generated/mascot/dusty_encouraging.png'),
  confused: require('@/assets/generated/mascot/dusty_confused.png'),
  hungry: require('@/assets/generated/mascot/dusty_hungry.png'),
  welcome: require('@/assets/generated/mascot/dusty_welcome.png'),
  splash: require('@/assets/generated/mascot/dusty_splash.png'),
} as const;

export type MascotImageKey = keyof typeof MascotImages;

/**
 * Resolve the best mascot illustration for a given mood + activity combo.
 */
export function getMascotImage(mood: string, activity: string): any {
  // Activity takes priority
  if (activity === 'cleaning') return MascotImages.cleaning;
  if (activity === 'celebrating' || activity === 'cheering' || activity === 'dancing')
    return MascotImages.celebrating;
  if (activity === 'sleeping') return MascotImages.sleeping;

  // Then mood
  switch (mood) {
    case 'happy':
    case 'content':
      return MascotImages.happy;
    case 'ecstatic':
    case 'excited':
      return MascotImages.celebrating;
    case 'sad':
      return MascotImages.sad;
    case 'sleepy':
      return MascotImages.sleeping;
    case 'neutral':
      return MascotImages.waving;
    default:
      return MascotImages.happy;
  }
}
