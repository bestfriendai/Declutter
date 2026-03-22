/**
 * RoomActions — CTA buttons for Room Detail
 * "One Tiny Thing", "Start Blitz", "Focus Mode", and "Good Enough" button.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flame, Sparkles, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { V1, BODY_FONT, DISPLAY_FONT, RADIUS } from '@/constants/designTokens';
import { CleaningTask } from '@/types/declutter';

interface RoomActionsProps {
  isDark: boolean;
  progress: number;
  hasIncompleteTasks: boolean;
  firstIncompleteTask?: CleaningTask | null;
  onStartBlitz: () => void;
  onOneTinyThing: () => void;
  onGoodEnough: () => void;
}

export function RoomActions({
  isDark,
  progress,
  hasIncompleteTasks,
  firstIncompleteTask,
  onStartBlitz,
  onOneTinyThing,
  onGoodEnough,
}: RoomActionsProps) {
  const t = isDark ? V1.dark : V1.light;

  if (!hasIncompleteTasks) return null;

  return (
    <View style={styles.container}>
      {/* One Tiny Thing — prominent quick-start */}
      {firstIncompleteTask && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onOneTinyThing();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Start one tiny thing: ${firstIncompleteTask.title}`}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
        >
          <View style={[styles.tinyThingCard, {
            backgroundColor: isDark ? 'rgba(102,187,106,0.08)' : 'rgba(102,187,106,0.06)',
            borderColor: isDark ? 'rgba(102,187,106,0.2)' : 'rgba(102,187,106,0.15)',
          }]}>
            <View style={styles.tinyThingLeft}>
              <Target size={18} color={V1.green} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.tinyThingLabel, { color: V1.green }]}>
                  ONE TINY THING
                </Text>
                <Text style={[styles.tinyThingTitle, { color: t.text }]} numberOfLines={1}>
                  {firstIncompleteTask.title}
                </Text>
                <Text style={[styles.tinyThingTime, { color: t.textMuted }]}>
                  ~{firstIncompleteTask.estimatedMinutes || 3} min
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      )}

      {/* Good Enough button — for ADHD perfectionism */}
      {progress >= 20 && progress < 90 && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onGoodEnough();
          }}
          accessibilityRole="button"
          accessibilityLabel="Declare this room good enough for now"
          style={({ pressed }) => [{
            opacity: pressed ? 0.8 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(102,187,106,0.3)' : 'rgba(102,187,106,0.25)',
            backgroundColor: isDark ? 'rgba(102,187,106,0.08)' : 'rgba(102,187,106,0.06)',
          }]}
        >
          <Sparkles size={16} color={V1.green} />
          <Text style={{
            fontFamily: BODY_FONT,
            fontSize: 14,
            fontWeight: '600',
            color: V1.green,
          }}>
            Good enough for today!
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
    paddingTop: 4,
  },
  tinyThingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  tinyThingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tinyThingLabel: {
    fontFamily: BODY_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tinyThingTitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },
  tinyThingTime: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    marginTop: 2,
  },
});
