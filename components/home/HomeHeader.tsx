/**
 * HomeHeader -- Greeting, mascot avatar, motivational quote
 * Smart greeting uses user's name + time-of-day context.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { MascotAvatar } from '@/components/ui/MascotAvatar';
import { BODY_FONT, DISPLAY_FONT, SPACING } from '@/constants/designTokens';

// ── Smart greeting helpers ──────────────────────────────────────────────────

const TIME_GREETINGS: Record<string, string[]> = {
  morning: ['Good morning', 'Rise and shine', 'Morning'],
  afternoon: ['Good afternoon', 'Hey there', 'Afternoon check-in'],
  evening: ['Good evening', 'Welcome back', 'Evening wind-down'],
};

function getSmartGreeting(userName: string): string {
  const hour = new Date().getHours();
  let period = 'morning';
  if (hour >= 12 && hour < 17) period = 'afternoon';
  else if (hour >= 17) period = 'evening';

  const options = TIME_GREETINGS[period];
  // Rotate based on day of year for variety
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const greeting = options[dayOfYear % options.length];
  return `${greeting}, ${userName}`;
}

function getTimeContext(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[now.getDay()];
  const hour = now.getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17) timeOfDay = 'evening';
  return `${day} ${timeOfDay}`;
}

// ── Motivational quotes ─────────────────────────────────────────────────────
const QUOTES = [
  'Small steps create big change',
  'Progress, not perfection',
  'Every tidy corner is a tiny victory',
  'You deserve a space that feels good',
  'One thing at a time, one room at a time',
];

function getQuote(): string {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % QUOTES.length;
  return QUOTES[idx];
}

// ── Props ───────────────────────────────────────────────────────────────────

interface HomeHeaderProps {
  userName: string;
  textColor: string;
  secondaryColor: string;
  mutedColor: string;
  reducedMotion: boolean;
  showMascot?: boolean;
}

export function HomeHeader({
  userName,
  textColor,
  secondaryColor,
  mutedColor,
  reducedMotion,
  showMascot = true,
}: HomeHeaderProps) {
  return (
    <>
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.duration(400)}
        style={styles.header}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: textColor }]}>
            {getSmartGreeting(userName)}
          </Text>
          <Text style={[styles.timeContext, { color: secondaryColor }]}>
            {getTimeContext()}
          </Text>
        </View>
        {showMascot && (
          <View style={{ minWidth: 44, minHeight: 44 }}>
            <MascotAvatar mood="happy" activity="idle" size={44} imageKey="happy" />
          </View>
        )}
      </Animated.View>

      <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(50).duration(400)}>
        <Text style={[styles.quote, { color: mutedColor }]}>{getQuote()}</Text>
      </Animated.View>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.4,
  },
  timeContext: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: BODY_FONT,
    marginTop: 2,
  },
  quote: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: BODY_FONT,
    marginBottom: 12,
    marginTop: 8,
  },
});
