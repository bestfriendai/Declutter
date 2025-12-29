/**
 * Declutterly - Screen Layout Component
 * Provides consistent safe area handling and screen structure
 */

import { Colors } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
  StyleProp,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeAreaEdge = 'top' | 'bottom' | 'left' | 'right';

interface ScreenLayoutProps {
  children: React.ReactNode;
  /** Additional styles for the content container */
  style?: StyleProp<ViewStyle>;
  /** Which edges to apply safe area padding to */
  edges?: SafeAreaEdge[];
  /** Background color override */
  backgroundColor?: string;
  /** Whether content should be scrollable */
  scrollable?: boolean;
  /** Enable keyboard avoiding behavior */
  keyboardAvoiding?: boolean;
  /** Status bar style override */
  statusBarStyle?: 'auto' | 'light' | 'dark';
  /** Accessibility label for the screen */
  accessibilityLabel?: string;
  /** Additional padding beyond safe area */
  contentPadding?: number;
  /** Header component to render above safe area */
  headerComponent?: React.ReactNode;
  /** Footer component to render below safe area */
  footerComponent?: React.ReactNode;
}

export function ScreenLayout({
  children,
  style,
  edges = ['top'],
  backgroundColor,
  scrollable = false,
  keyboardAvoiding = false,
  statusBarStyle,
  accessibilityLabel,
  contentPadding = 0,
  headerComponent,
  footerComponent,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  // Calculate padding based on edges prop
  const safeAreaStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? Math.max(insets.left, contentPadding) : contentPadding,
    paddingRight: edges.includes('right') ? Math.max(insets.right, contentPadding) : contentPadding,
  };

  const bgColor = backgroundColor || colors.background;
  const computedStatusBarStyle = statusBarStyle || (colorScheme === 'dark' ? 'light' : 'dark');

  const contentElement = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, safeAreaStyle, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, safeAreaStyle, style]}>
      {children}
    </View>
  );

  const mainContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {contentElement}
    </KeyboardAvoidingView>
  ) : (
    contentElement
  );

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="none"
    >
      <StatusBar style={computedStatusBarStyle} />
      {headerComponent}
      {mainContent}
      {footerComponent}
    </View>
  );
}

/**
 * Preset layout for screens with tab bar
 * Automatically handles bottom safe area for tab bar
 */
export function TabScreenLayout(
  props: Omit<ScreenLayoutProps, 'edges'>
) {
  return <ScreenLayout {...props} edges={['top']} />;
}

/**
 * Preset layout for modal screens
 * No top safe area (modal handles it), includes bottom
 */
export function ModalScreenLayout(
  props: Omit<ScreenLayoutProps, 'edges'>
) {
  return <ScreenLayout {...props} edges={['bottom']} />;
}

/**
 * Preset layout for full-screen content (camera, video, etc.)
 * No safe area padding
 */
export function FullScreenLayout(
  props: Omit<ScreenLayoutProps, 'edges'>
) {
  return <ScreenLayout {...props} edges={[]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
});

export default ScreenLayout;
