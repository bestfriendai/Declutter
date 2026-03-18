export interface FallbackMotivation {
  message: string;
  emoji: string;
  tone: string;
}

export const FALLBACK_MOTIVATIONS: FallbackMotivation[] = [
  { message: "You don't have to do everything today. Just start with one small thing.", emoji: '💛', tone: 'supportive' },
  { message: 'Progress over perfection. Every item you put away is a win!', emoji: '🌟', tone: 'cheerful' },
  { message: 'Your future self will thank you for whatever you do right now.', emoji: '💪', tone: 'encouraging' },
  { message: "It's okay if it's not perfect. Done is better than perfect.", emoji: '✨', tone: 'calm' },
  { message: '10 minutes is better than 0 minutes. What can you do in just 10 minutes?', emoji: '⏰', tone: 'supportive' },
  { message: "The hardest part is starting. You've already done that by being here!", emoji: '🎉', tone: 'cheerful' },
  { message: "Celebrate every small win. You're making progress!", emoji: '🏆', tone: 'cheerful' },
  { message: "Remember: you don't have to feel motivated to start. Motivation often follows action.", emoji: '🧠', tone: 'calm' },
];

export const ROOM_ENCOURAGEMENT_MESSAGES = [
  "That's one less thing on your plate.",
  'Look at you actually doing it.',
  "One task at a time. That's the whole strategy.",
  'Progress, not perfection. You get it.',
  'Your space is literally getting calmer.',
  'Small wins add up faster than you think.',
  "Your brain just got a little dopamine. You're welcome.",
  'Your future self is already thanking you.',
  'This is what momentum feels like.',
  "See? Not as bad as the anxiety said it would be.",
  "Another one down. You're on a roll.",
  'The hardest part was starting. You already did that.',
] as const;

export const OFFLINE_STATUS_COPY = {
  offlineTitle: "You're offline",
  offlineMessage: 'Sync, AI analysis, and social features will resume when your connection comes back.',
  reconnectedTitle: 'Back online',
  reconnectedMessage: 'Your latest data, AI tools, and social features are available again.',
} as const;
