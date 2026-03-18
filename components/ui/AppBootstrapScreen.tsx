import { Colors } from '@/constants/Colors';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppBootstrapScreenProps {
  message?: string;
}

export function AppBootstrapScreen({
  message = 'Loading your rooms, progress, and settings…',
}: AppBootstrapScreenProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>Declutterly</Text>
          <Text style={[styles.title, { color: colors.text }]}>Setting up your calm.</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        </View>

        <View style={styles.heroCard}>
          <SkeletonCard />
        </View>

        <View style={styles.statsRow}>
          <Skeleton height={78} borderRadius={20} style={styles.statCard} />
          <Skeleton height={78} borderRadius={20} style={styles.statCard} />
        </View>

        <View style={styles.section}>
          <Skeleton height={16} width="38%" borderRadius={6} />
          <SkeletonText lines={3} style={styles.sectionText} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 24,
  },
  header: {
    gap: 10,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '90%',
  },
  heroCard: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statCard: {
    flex: 1,
  },
  section: {
    gap: 12,
  },
  sectionText: {
    marginTop: 2,
  },
});

export default AppBootstrapScreen;
