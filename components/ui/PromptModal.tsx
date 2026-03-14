import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface PromptModalProps {
  visible: boolean;
  title: string;
  description?: string;
  value: string;
  placeholder?: string;
  submitLabel: string;
  cancelLabel?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitDisabled?: boolean;
}

export function PromptModal({
  visible,
  title,
  description,
  value,
  placeholder,
  submitLabel,
  cancelLabel = 'Cancel',
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  onChangeText,
  onSubmit,
  onCancel,
  submitDisabled = false,
}: PromptModalProps) {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.scrim} onPress={onCancel} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#141414' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E8E8E8',
            },
          ]}
        >
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
            {title}
          </Text>
          {description ? (
            <Text style={[styles.description, { color: '#707070' }]}>
              {description}
            </Text>
          ) : null}

          <TextInput
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            keyboardType={keyboardType}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#5C5C5C' : '#A0A0A0'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#0F0F0F' : '#F5F5F5',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#DDDDDD',
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              },
            ]}
            value={value}
          />

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={[
                styles.button,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#F0F0F0',
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={submitDisabled}
              onPress={onSubmit}
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: submitDisabled
                    ? (isDark ? '#2A2A2A' : '#D6D6D6')
                    : (isDark ? '#FFFFFF' : '#1A1A1A'),
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: submitDisabled ? '#707070' : (isDark ? '#0A0A0A' : '#FFFFFF'),
                  },
                ]}
              >
                {submitLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButton: {
    flex: 1.2,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
