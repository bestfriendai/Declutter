import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { CleaningTask, Priority, TaskDifficulty } from '@/types/declutter';
import { GlassButton } from '@/components/ui/GlassButton';

interface TaskModalProps {
  visible: boolean;
  task?: CleaningTask | null;
  colors: any;
  onClose: () => void;
  onSave: (task: Omit<CleaningTask, 'id'> | { id: string } & Partial<CleaningTask>) => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; emoji: string; color: string }[] = [
  { value: 'high', label: 'High', emoji: '🔴', color: '#FF453A' },
  { value: 'medium', label: 'Medium', emoji: '🟡', color: '#FFD60A' },
  { value: 'low', label: 'Low', emoji: '🟢', color: '#32D74B' },
];

const DIFFICULTY_OPTIONS: { value: TaskDifficulty; label: string; emoji: string; minutes: number }[] = [
  { value: 'quick', label: 'Quick', emoji: '⚡', minutes: 5 },
  { value: 'medium', label: 'Medium', emoji: '🔨', minutes: 15 },
  { value: 'challenging', label: 'Big', emoji: '💪', minutes: 30 },
];

const EMOJI_OPTIONS = ['🧹', '🗑️', '📦', '👕', '🛏️', '🧽', '🪣', '📚', '💡', '🚿', '🍽️', '🧺'];

export function TaskModal({ visible, task, colors, onClose, onSave }: TaskModalProps) {
  const isEditing = !!task;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🧹');
  const [priority, setPriority] = useState<Priority>('medium');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('quick');
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);

  useEffect(() => {
    if (visible) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setEmoji(task.emoji);
        setPriority(task.priority);
        setDifficulty(task.difficulty);
        setEstimatedMinutes(task.estimatedMinutes);
      } else {
        setTitle('');
        setDescription('');
        setEmoji('🧹');
        setPriority('medium');
        setDifficulty('quick');
        setEstimatedMinutes(5);
      }
    }
  }, [visible, task]);

  const handleDifficultyChange = (newDifficulty: TaskDifficulty) => {
    setDifficulty(newDifficulty);
    const option = DIFFICULTY_OPTIONS.find(d => d.value === newDifficulty);
    if (option) {
      setEstimatedMinutes(option.minutes);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && task) {
      onSave({
        id: task.id,
        title: title.trim(),
        description: description.trim(),
        emoji,
        priority,
        difficulty,
        estimatedMinutes,
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim(),
        emoji,
        priority,
        difficulty,
        estimatedMinutes,
        completed: false,
      });
    }

    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View
            entering={SlideInDown.duration(350).damping(20)}
            exiting={SlideOutDown.duration(350)}
            style={styles.modalContainer}
          >
            <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.header}>
                  <Pressable
                    onPress={onClose}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                  >
                    <Text style={[Typography.body, { color: colors.textSecondary }]}>Cancel</Text>
                  </Pressable>
                  <Text style={[Typography.headline, { color: colors.text }]}>
                    {isEditing ? 'Edit Task' : 'Add Task'}
                  </Text>
                  <Pressable
                    onPress={handleSave}
                    style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel="Save task"
                    accessibilityState={{ disabled: !title.trim() }}
                  >
                    <Text style={[
                      Typography.bodyMedium,
                      { color: title.trim() ? colors.primary : colors.textSecondary }
                    ]}>
                      Save
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.section}>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
                    Icon
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.emojiScroll}
                  >
                    {EMOJI_OPTIONS.map((e) => (
                      <Pressable
                        key={e}
                        onPress={() => {
                          setEmoji(e);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[
                          styles.emojiOption,
                          { 
                            backgroundColor: emoji === e ? colors.primaryMuted : colors.surfaceSecondary,
                            borderColor: emoji === e ? colors.primary : 'transparent',
                          }
                        ]}
                      >
                        <Text style={styles.emojiText}>{e}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.section}>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
                    What needs to be done?
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g., Clear off the desk"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.surfaceSecondary, 
                        color: colors.text,
                        borderColor: colors.border,
                      }
                    ]}
                    maxLength={100}
                    autoFocus={!isEditing}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
                    Notes (optional)
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Any helpful details..."
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      styles.textArea,
                      { 
                        backgroundColor: colors.surfaceSecondary, 
                        color: colors.text,
                        borderColor: colors.border,
                      }
                    ]}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
                    How big is this task?
                  </Text>
                  <View style={styles.optionRow}>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => handleDifficultyChange(option.value)}
                        style={[
                          styles.optionButton,
                          { 
                            backgroundColor: difficulty === option.value
                              ? colors.primaryMuted
                              : colors.surfaceSecondary,
                            borderColor: difficulty === option.value 
                              ? colors.primary 
                              : 'transparent',
                          }
                        ]}
                      >
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={[Typography.caption1, { color: colors.text }]}>
                          {option.label}
                        </Text>
                        <Text style={[Typography.caption2, { color: colors.textSecondary }]}>
                          ~{option.minutes} min
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
                    Priority
                  </Text>
                  <View style={styles.optionRow}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setPriority(option.value);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[
                          styles.optionButton,
                          { 
                            backgroundColor: priority === option.value
                              ? `${option.color}30`
                              : colors.surfaceSecondary,
                            borderColor: priority === option.value 
                              ? option.color 
                              : 'transparent',
                          }
                        ]}
                      >
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={[Typography.caption1, { color: colors.text }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={[styles.timeEstimate, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[Typography.body, { color: colors.text }]}>
                    ⏱️ Estimated time: {estimatedMinutes} minutes
                  </Text>
                </View>

                <GlassButton
                  title={isEditing ? '✓ Save Changes' : '+ Add Task'}
                  variant="primary"
                  onPress={handleSave}
                  disabled={!title.trim()}
                  style={styles.saveFullButton}
                />
              </ScrollView>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: BorderRadius.modal,
    borderTopRightRadius: BorderRadius.modal,
    overflow: 'hidden',
  },
  modalBlur: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing.ml,
    paddingBottom: Spacing.ml,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveButton: {
    padding: Spacing.xs,
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  emojiScroll: {
    gap: Spacing.xs,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emojiText: {
    fontSize: 24,
  },
  input: {
    borderRadius: BorderRadius.input,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    gap: Spacing.xxs,
    minHeight: 44,
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xxs,
  },
  timeEstimate: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  saveFullButton: {
    width: '100%',
  },
});
