import { render } from '@testing-library/react-native';
import React from 'react';

import RoomCompleteScreen from '@/app/room-complete';
import SessionCompleteScreen from '@/app/session-complete';

const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUpdateStats = jest.fn();
const mockNotificationAsync = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: mockReplace,
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('@/context/DeclutterContext', () => ({
  useDeclutter: () => ({
    rooms: [
      {
        id: 'room-1',
        name: 'Kitchen',
        photos: [],
        tasks: [
          { id: 'task-1', title: 'Clear counter', completed: true },
          { id: 'task-2', title: 'Load dishwasher', completed: true },
        ],
      },
    ],
    stats: {
      xp: 120,
      totalMinutesCleaned: 45,
      totalRoomsCleaned: 2,
    },
    updateStats: mockUpdateStats,
  }),
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

jest.mock('@/components/ui', () => ({
  MascotAvatar: () => null,
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('lucide-react-native', () => ({
  Upload: () => null,
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/hooks/useConvex', () => ({
  useAnalyzeProgress: () => jest.fn().mockResolvedValue({}),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'test-token' }),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
}));

describe('completion screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not award stats again on session complete render', () => {
    mockUseLocalSearchParams.mockReturnValue({
      tasksCompleted: '2',
      timeSpent: '15',
      xpEarned: '50',
      roomId: 'room-1',
      roomName: 'Kitchen',
    });

    render(<SessionCompleteScreen />);

    expect(mockUpdateStats).not.toHaveBeenCalled();
  });

  it('does not award stats again on room complete render', () => {
    mockUseLocalSearchParams.mockReturnValue({
      roomId: 'room-1',
      roomName: 'Kitchen',
      tasksCompleted: '2',
      timeSpent: '15',
    });

    render(<RoomCompleteScreen />);

    expect(mockUpdateStats).not.toHaveBeenCalled();
    expect(mockNotificationAsync).toHaveBeenCalled();
  });
});