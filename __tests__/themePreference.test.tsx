import React from 'react';
import * as ReactNative from 'react-native';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { setForcedColorScheme, useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function HookProbe() {
  const scheme = useColorScheme();
  return <Text testID="hook-scheme">{scheme}</Text>;
}

function ThemeProbe() {
  const { colorScheme } = useTheme();
  return <Text testID="theme-scheme">{colorScheme}</Text>;
}

describe('theme preference overrides', () => {
  let colorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    colorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    setForcedColorScheme(null);
  });

  afterEach(() => {
    act(() => {
      setForcedColorScheme(null);
    });
    colorSchemeSpy.mockRestore();
  });

  it('updates hook subscribers when a forced scheme is set', () => {
    const { getByTestId } = render(<HookProbe />);

    expect(getByTestId('hook-scheme').props.children).toBe('light');

    act(() => {
      setForcedColorScheme('dark');
    });

    expect(getByTestId('hook-scheme').props.children).toBe('dark');
  });

  it('updates ThemeProvider consumers when a forced scheme is set', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(getByTestId('theme-scheme').props.children).toBe('light');

    act(() => {
      setForcedColorScheme('dark');
    });

    expect(getByTestId('theme-scheme').props.children).toBe('dark');
  });
});
