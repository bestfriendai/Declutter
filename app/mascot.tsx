/**
 * Declutterly - Mascot Screen
 * Full mascot view with speech bubbles, animated stats, adventure timer,
 * floating feedback, and interaction improvements.
 */

import { V1, BODY_FONT, DISPLAY_FONT, RADIUS, SPACING, cardStyle, getTheme } from '@/constants/designTokens';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MASCOT_PERSONALITIES, COLLECTIBLES as COLLECTIBLES_IMPORTED } from '@/types/declutter';
import { Mascot } from '@/components/features/Mascot';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Pressable,
  Text as RNText,
  ScrollView,
} from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Adventure system
import { STORAGE_KEYS } from '@/constants/storageKeys';
const ADVENTURE_DURATION_MS = 8 * 60 * 60 * 1000;

// Speech bubble messages based on mood, personality, streak, hunger
function getMascotSpeech(
  mood: string,
  personality: string,
  streak: number,
  hunger: number,
  name: string,
): string {
  if (hunger < 20) return "I'm so hungry... complete a task to feed me!";
  if (mood === 'sad') return "I miss cleaning together. Wanna do one tiny thing?";
  if (streak >= 7) return "A whole week together! We're unstoppable!";
  if (mood === 'ecstatic') return "I'm SO proud of us! Look how clean everything is!";
  if (personality === 'dusty') return "Slow and steady, friend. Every small step counts.";
  if (personality === 'spark') return "LET'S GO! I can feel the energy today!";
  if (personality === 'bubbles') return "Hehe, cleaning is so much fun with you!";
  if (streak >= 3) return `${streak} days in a row! You're on fire!`;
  return "Hey there! Ready for another adventure?";
}

// Speech Bubble Component
function SpeechBubble({ message, isDark }: { message: string; isDark: boolean }) {
  const t = getTheme(isDark);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={{
        backgroundColor: t.card,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: t.border,
        padding: 14,
        marginHorizontal: 32,
        marginTop: 12,
        alignItems: 'center',
        position: 'relative',
      }}
      accessibilityLiveRegion="polite"
    >
      {/* Tail triangle */}
      <View style={{
        position: 'absolute',
        top: -8,
        width: 16,
        height: 16,
        backgroundColor: t.card,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: t.border,
        transform: [{ rotate: '45deg' }],
      }} />
      <RNText style={{
        fontFamily: BODY_FONT,
        fontSize: 14,
        lineHeight: 20,
        color: t.text,
        textAlign: 'center',
        fontStyle: 'italic',
      }}>
        "{message}"
      </RNText>
    </Animated.View>
  );
}

// Floating feedback component for actions
function FloatingFeedback({ text, visible, onDone }: {
  text: string;
  visible: boolean;
  onDone: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 300 })
      );
      translateY.value = withTiming(-60, { duration: 950 }, () => {
        runOnJS(onDone)();
      });
    } else {
      opacity.value = 0;
      translateY.value = 0;
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[{
      position: 'absolute',
      alignSelf: 'center',
      top: '40%',
      zIndex: 10,
    }, animStyle]}>
      <RNText style={{ color: V1.green, fontWeight: '700', fontSize: 18, textAlign: 'center' }}>
        {text}
      </RNText>
    </Animated.View>
  );
}

// Animated stat bar
function AnimatedStatBar({
  label,
  value,
  color,
  isDark,
}: {
  label: string;
  value: number;
  color: string;
  isDark: boolean;
}) {
  const st = getTheme(isDark);
  const widthValue = useSharedValue(0);

  useEffect(() => {
    widthValue.value = withTiming(value, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
    height: '100%',
    borderRadius: 4,
    backgroundColor: color,
  }));

  return (
    <View style={styles.statBarContainer} accessibilityLabel={`${label}: ${value} percent`}>
      <View style={styles.statBarHeader}>
        <RNText style={[styles.statBarLabel, { color: st.textSecondary }]}>
          {label}
        </RNText>
        <RNText style={[styles.statBarValue, { color: st.text }]}>
          {value}%
        </RNText>
      </View>
      <View style={[styles.statBarBg, { backgroundColor: st.border }]}>
        <Animated.View style={fillStyle} />
      </View>
    </View>
  );
}

// Adventure Timer
function AdventureTimer({ isDark, mascotName }: { isDark: boolean; mascotName: string }) {
  const t = getTheme(isDark);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ADVENTURE_END).then((val) => {
      if (val) {
        const end = parseInt(val, 10);
        if (end > Date.now()) {
          setEndTime(end);
        } else {
          setIsReady(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!endTime) return;
    const update = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setIsReady(true);
        setEndTime(null);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [endTime]);

  const startAdventure = useCallback(async () => {
    const end = Date.now() + ADVENTURE_DURATION_MS;
    await AsyncStorage.setItem(STORAGE_KEYS.ADVENTURE_END, String(end));
    setEndTime(end);
    setIsReady(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  return (
    <View style={[styles.adventureCard, {
      backgroundColor: isDark ? 'rgba(255,213,79,0.08)' : 'rgba(255,213,79,0.06)',
      borderColor: isDark ? 'rgba(255,213,79,0.15)' : 'rgba(255,213,79,0.2)',
    }]}>
      <RNText style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
        ADVENTURE
      </RNText>

      {isReady ? (
        <Pressable
          onPress={startAdventure}
          accessibilityRole="button"
          accessibilityLabel={`${mascotName} returned from adventure. Tap to send on another.`}
          style={({ pressed }) => [{
            backgroundColor: V1.gold,
            borderRadius: RADIUS.md, padding: 14,
            opacity: pressed ? 0.85 : 1,
            alignItems: 'center',
          }]}
        >
          <RNText style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
            {mascotName} is back! Send on adventure
          </RNText>
        </Pressable>
      ) : remaining ? (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <RNText style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '600', color: V1.gold }}>
            {mascotName} is exploring...
          </RNText>
          <RNText style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary }}>
            Returns in {remaining}
          </RNText>
        </View>
      ) : (
        <Pressable
          onPress={startAdventure}
          accessibilityRole="button"
          accessibilityLabel={`Send ${mascotName} on an 8-hour adventure`}
          style={({ pressed }) => [{
            backgroundColor: isDark ? 'rgba(255,213,79,0.15)' : 'rgba(255,213,79,0.12)',
            borderRadius: RADIUS.md, padding: 14,
            opacity: pressed ? 0.85 : 1,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: V1.gold + '30',
          }]}
        >
          <RNText style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '600', color: V1.gold }}>
            Send {mascotName} on an adventure
          </RNText>
          <RNText style={{ fontFamily: BODY_FONT, fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
            Returns in 8 hours with a surprise!
          </RNText>
        </Pressable>
      )}
    </View>
  );
}

function getMoodEmoji(mood: string): string {
  switch (mood) {
    case 'ecstatic': return '\u{1F929}';
    case 'happy': return '\u{1F60A}';
    case 'excited': return '\u{1F604}';
    case 'content': return '\u{1F642}';
    case 'neutral': return '\u{1F610}';
    case 'sad': return '\u{1F622}';
    case 'sleepy': return '\u{1F634}';
    default: return '\u{1F60A}';
  }
}

export default function MascotScreen() {
  return (
    <ScreenErrorBoundary screenName="mascot">
      <MascotScreenContent />
    </ScreenErrorBoundary>
  );
}

function MascotScreenContent() {
  const rawColorScheme = useColorScheme();
  const isDark = rawColorScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();

  const { mascot, interactWithMascot, feedMascot, stats } = useDeclutter();
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  // Loading state
  if (mascot === undefined) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
        style={styles.container}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </View>
      </LinearGradient>
    );
  }

  if (!mascot) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
        style={styles.container}
      >
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <RNText style={[styles.backText, { color: V1.coral }]}>Back</RNText>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="CLEANING BUDDY"
            emoji="\u{1F97A}"
            title="No buddy yet"
            description="Finish onboarding to choose the guide who matches your energy, tone, and cleaning style."
            primaryLabel="Choose Your Buddy"
            onPrimary={() => router.push('/onboarding')}
            accentColors={['#D9C9A8', '#C4A87A', '#A8895C'] as const}
            style={styles.emptyCard}
          />
        </View>
      </LinearGradient>
    );
  }

  const personalityInfo = MASCOT_PERSONALITIES[mascot.personality];
  const xpToNextLevel = (mascot.level * 50) - mascot.xp;

  // Memoize days together
  const daysTogether = useMemo(() =>
    Math.floor((Date.now() - new Date(mascot.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1,
  [mascot.createdAt]);

  // Speech message
  const speechMessage = useMemo(() =>
    getMascotSpeech(mascot.mood, mascot.personality, stats?.currentStreak ?? 0, mascot.hunger, mascot.name),
  [mascot.mood, mascot.personality, stats?.currentStreak, mascot.hunger, mascot.name]);

  const handlePet = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    interactWithMascot();
    setFeedbackText('+15 Happy');
  };

  const handleFeed = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    feedMascot();
    setFeedbackText('+20 Hunger');
  };

  return (
    <LinearGradient
      colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
      style={styles.container}
    >
      {/* Floating feedback */}
      <FloatingFeedback
        text={feedbackText ?? ''}
        visible={!!feedbackText}
        onDone={() => setFeedbackText(null)}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <RNText style={[styles.backText, { color: V1.coral }]}>Back</RNText>
        </Pressable>
        <RNText style={[styles.title, { color: t.text }]} accessibilityRole="header">Your Buddy</RNText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Display */}
        <View
          style={[styles.mascotSection, { backgroundColor: personalityInfo.color + '20' }]}
          accessibilityLabel="Interact with mascot, tap to pet"
        >
          <Mascot size="large" showStats interactive onPress={handlePet} />
          <RNText style={[styles.tapHint, { color: t.textSecondary }]}>
            Tap to interact!
          </RNText>
        </View>

        {/* Speech Bubble */}
        <SpeechBubble message={speechMessage} isDark={isDark} />

        {/* Stats Card */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(60).duration(350)} style={[styles.statsCard, {
          backgroundColor: t.card,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        }]}>
          <RNText style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>STATS</RNText>

          {/* Level Progress */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <RNText style={[styles.levelText, { color: t.text }]}>
                Level {mascot.level}
              </RNText>
              <RNText style={[styles.xpText, { color: t.textSecondary }]}>
                {mascot.xp} / {mascot.level * 50} XP
              </RNText>
            </View>
            <View style={[styles.xpBar, { backgroundColor: t.border }]}>
              <View
                style={[
                  styles.xpFill,
                  {
                    width: `${(mascot.xp / (mascot.level * 50)) * 100}%`,
                    backgroundColor: personalityInfo.color,
                  },
                ]}
              />
            </View>
            <RNText style={[styles.xpHint, { color: t.textSecondary }]}>
              {xpToNextLevel} XP to next level
            </RNText>
          </View>

          {/* Animated Stat Bars */}
          <View style={styles.statBars}>
            <AnimatedStatBar label="Hunger" value={mascot.hunger} color={V1.green} isDark={isDark} />
            <AnimatedStatBar label="Energy" value={mascot.energy} color={V1.blue} isDark={isDark} />
            <AnimatedStatBar label="Happiness" value={mascot.happiness} color={V1.amber} isDark={isDark} />
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(120).duration(350)} style={styles.actionsSection}>
          <RNText style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>ACTIONS</RNText>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: V1.green }]}
              onPress={handleFeed}
              accessibilityRole="button"
              accessibilityLabel="Feed your buddy"
              accessibilityHint="Increases hunger by 20 points"
            >
              <RNText style={styles.actionEmoji} accessibilityElementsHidden>{'\u{1F34E}'}</RNText>
              <RNText style={[styles.actionText, { color: '#FFFFFF' }]}>Feed</RNText>
              <RNText style={[styles.actionHint, { color: '#FFFFFF' }]} accessibilityElementsHidden>+20 Hunger</RNText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: V1.coral }]}
              onPress={handlePet}
              accessibilityRole="button"
              accessibilityLabel="Pet your buddy"
              accessibilityHint="Increases happiness by 15 points"
            >
              <RNText style={styles.actionEmoji} accessibilityElementsHidden>{'\u{1F44B}'}</RNText>
              <RNText style={[styles.actionText, { color: '#FFFFFF' }]}>Pet</RNText>
              <RNText style={[styles.actionHint, { color: '#FFFFFF' }]} accessibilityElementsHidden>+15 Happy</RNText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: isDark ? '#BF5AF2' : '#AF52DE' }]}
              onPress={() => router.push('/focus?duration=25')}
              accessibilityRole="button"
              accessibilityLabel="Clean together"
              accessibilityHint="Start a 25 minute focus cleaning session"
            >
              <RNText style={styles.actionEmoji} accessibilityElementsHidden>{'\u{1F9F9}'}</RNText>
              <RNText style={[styles.actionText, { color: '#FFFFFF' }]}>Clean</RNText>
              <RNText style={[styles.actionHint, { color: '#FFFFFF' }]} accessibilityElementsHidden>Together!</RNText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Adventure Timer */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(160).duration(350)}>
          <AdventureTimer isDark={isDark} mascotName={mascot.name} />
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(350)} style={[styles.infoCard, {
          backgroundColor: t.card,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        }]}>
          <RNText style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>ABOUT</RNText>
          <View style={[styles.infoRow, { borderBottomColor: t.border }]}>
            <RNText style={[styles.infoLabel, { color: t.textSecondary }]}>
              Personality
            </RNText>
            <RNText style={[styles.infoValue, { color: t.text }]}>
              {personalityInfo.emoji} {personalityInfo.name}
            </RNText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: t.border }]}>
            <RNText style={[styles.infoLabel, { color: t.textSecondary }]}>
              Current Mood
            </RNText>
            <RNText style={[styles.infoValue, { color: t.text }]}>
              {getMoodEmoji(mascot.mood)} {mascot.mood}
            </RNText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: t.border }]}>
            <RNText style={[styles.infoLabel, { color: t.textSecondary }]}>
              Tasks Together
            </RNText>
            <RNText style={[styles.infoValue, { color: t.text }]}>
              {stats?.totalTasksCompleted ?? 0}
            </RNText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: t.border }]}>
            <RNText style={[styles.infoLabel, { color: t.textSecondary }]}>
              Days Together
            </RNText>
            <RNText style={[styles.infoValue, { color: t.text }]}>
              {daysTogether}
            </RNText>
          </View>
        </Animated.View>

        {/* Wardrobe / Customize Section */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(240).duration(350)} style={[styles.wardrobeCard, {
          backgroundColor: t.card,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        }]}>
          <RNText style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>WARDROBE</RNText>
          <View style={styles.equippedRow}>
            {mascot.accessories && mascot.accessories.length > 0 ? (
              mascot.accessories.slice(0, 4).map((accId, i) => {
                const collectible = COLLECTIBLES_IMPORTED.find(c => c.id === accId);
                return (
                  <View key={accId + i} style={[styles.equippedItem, { backgroundColor: personalityInfo.color + '20' }]}>
                    <RNText style={{ fontSize: 24 }}>{collectible?.emoji ?? '?'}</RNText>
                  </View>
                );
              })
            ) : (
              <RNText style={[styles.noAccessoriesText, { color: t.textSecondary }]}>
                No accessories equipped yet
              </RNText>
            )}
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/wardrobe');
            }}
            style={[styles.customizeButton, { backgroundColor: personalityInfo.color }]}
            accessibilityRole="button"
            accessibilityLabel="Customize your buddy's wardrobe"
          >
            <RNText style={[styles.customizeButtonText, { color: '#FFFFFF' }]}>Customize</RNText>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/collection');
            }}
            style={styles.collectionLink}
            accessibilityRole="button"
            accessibilityLabel="Browse your collection"
          >
            <RNText style={[styles.collectionLinkText, { color: personalityInfo.color }]}>
              Get more in Collection
            </RNText>
          </Pressable>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(280).duration(350)} style={[styles.tipsCard, { backgroundColor: personalityInfo.color + '20' }]}>
          <RNText style={styles.tipsEmoji}>{'\u{1F4A1}'}</RNText>
          <RNText style={[styles.tipsText, { color: t.text }]}>
            {mascot.happiness < 30
              ? `${mascot.name} is feeling a bit down. A quick cleaning session or a pet can lift their mood!`
              : mascot.hunger < 30
              ? `${mascot.name} is getting hungry! Complete a task to fill them up with energy.`
              : `${mascot.name} is doing great! Keep up the rhythm and you will both level up together.`}
          </RNText>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 20, fontWeight: '600', lineHeight: 25,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  mascotSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: RADIUS.xl,
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 13,
    marginTop: 8,
  },
  statsCard: {
    padding: 20,
    borderRadius: RADIUS.md,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  levelSection: {
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  xpText: {
    fontSize: 15, fontWeight: '400', lineHeight: 20,
  },
  xpBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  statBars: {
    gap: 12,
  },
  statBarContainer: {
    gap: 4,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBarLabel: {
    fontSize: 13,
  },
  statBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  actionHint: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
  adventureCard: {
    padding: 20,
    borderRadius: RADIUS.md,
    marginBottom: 20,
    borderWidth: 1,
    gap: 12,
  },
  infoCard: {
    padding: 20,
    borderRadius: RADIUS.md,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.md,
    gap: 12,
  },
  tipsEmoji: {
    fontSize: 24,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCard: {
    width: '100%',
  },
  wardrobeCard: {
    padding: 20,
    borderRadius: RADIUS.md,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  equippedRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    minHeight: 50,
    alignItems: 'center',
  },
  equippedItem: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAccessoriesText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontStyle: 'italic',
  },
  customizeButton: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 10,
  },
  customizeButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '600',
  },
  collectionLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  collectionLinkText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
});
