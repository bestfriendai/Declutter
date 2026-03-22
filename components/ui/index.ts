/**
 * UI Components Index
 * Central export file for all UI components
 */

// Layout Components
export { ContentRow } from './ContentRow';
export { GlassCard } from './GlassCard';
export { ModernCard } from './ModernCard';
export { ScreenLayout } from './ScreenLayout';

// Interactive Components
export { Chip } from './Chip';
export { GlassButton } from './GlassButton';
export { SegmentedControl } from './SegmentedControl';
export { SwipeableTaskCard } from './SwipeableTaskCard';
export type { Task as SwipeableTask } from './SwipeableTaskCard';

// Input Components
export { FocusableInput } from './FocusableInput';
export type { FocusableInputRef } from './FocusableInput';
export { PasswordRequirements, PasswordStrengthBar } from './PasswordRequirements';

// Celebration Engine
export { CelebrationProvider, useCelebration } from './CelebrationEngine';

// Feedback Components
export { Banner, InlineBanner } from './Banner';
export { Confetti } from './Confetti';
export { EmptyStateCard } from './EmptyStateCard';
export { QueryErrorState } from './QueryErrorState';
export type { QueryErrorVariant } from './QueryErrorState';
export { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';
export { Toast } from './Toast';

// Modal Components
export { ActionSheet } from './ActionSheet';
export type { ActionSheetAction } from './ActionSheet';
export { BottomSheet } from './BottomSheet';
export type { BottomSheetRef } from './BottomSheet';
export { PromptModal } from './PromptModal';

// Progress Components
export { ActivityRings } from './ActivityRings';
export { ProgressComparison } from './ProgressComparison';
export type { ProgressComparisonProps } from './ProgressComparison';
export { ProgressSteps } from './ProgressSteps';
export type { Step as ProgressStep } from './ProgressSteps';
export { StatCard } from './StatCard';

// Media Components
export { BeforeAfterSlider, VerticalBeforeAfterSlider } from './BeforeAfterSlider';
export { HeroCarousel } from './HeroCarousel';

// Share Components
export { ShareableCard } from './ShareableCard';
export type { ShareableCardProps } from './ShareableCard';

// Animation Components
export { AnimatedListItem } from './AnimatedListItem';

// Reward Components
export { ComboCounter } from './ComboCounter';
export type { ComboCounterProps } from './ComboCounter';
export { MysteryReward } from './MysteryReward';
export type { MysteryRewardProps, RewardType } from './MysteryReward';
export { XPPopup } from './XPPopup';
export type { XPPopupProps } from './XPPopup';

// Contextual Components
export { CompactGreeting, ContextualGreeting } from './ContextualGreeting';
export { OfflineBanner } from './OfflineBanner';
export { OfflineIndicator } from './OfflineIndicator';
export {
    OnboardingTooltipProvider,
    useOnboardingTooltip,
    useTooltipTrigger
} from './OnboardingTooltip';
export type { TooltipId } from './OnboardingTooltip';

// Mascot Components
export { MascotAvatar } from './MascotAvatar';
export type { default as MascotAvatarComponent } from './MascotAvatar';

// Shared Action Components
export { CoralButton } from './CoralButton';
export { AnimatedInput } from './AnimatedInput';
export { ErrorBanner } from './ErrorBanner';
export { LoadingDots } from './LoadingDots';

// Section / Placeholder Components
export { SectionLabel } from './SectionLabel';
export { SkeletonShimmer } from './SkeletonShimmer';
export { CountUpStat } from './CountUpStat';

// Wizard Components
export { ApiKeySetupWizard } from './ApiKeySetupWizard';
