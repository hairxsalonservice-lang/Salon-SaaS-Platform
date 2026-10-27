import React from 'react';
import { render, screen } from '@testing-library/react-native';
import SwipeableNotificationItem from '../src/components/SwipeableNotificationItem';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-navigation-bar', () => ({
  setBackgroundColorAsync: jest.fn(),
  setButtonStyleAsync: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('SwipeableNotificationItem', () => {
  const baseItem = {
    _id: 'notification-1',
    type: 'appointment.confirmed',
    title: 'Appointment CONFIRMED',
    body: 'Your haircut booking at Luxe Studio has been confirmed.',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  test('renders a readable title, body, timestamp and action', () => {
    render(
      <SwipeableNotificationItem
        item={baseItem}
        onPress={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('Appointment Confirmed')).toBeTruthy();
    expect(screen.getByText(baseItem.body)).toBeTruthy();
    expect(screen.getByText('Just now')).toBeTruthy();
    expect(screen.getByText('View booking')).toBeTruthy();
  });

  test('hides the action for a generic notification', () => {
    render(
      <SwipeableNotificationItem
        item={{
          _id: 'notification-2',
          type: 'system',
          title: 'Welcome to HairX',
          body: 'Thanks for joining us.',
          isRead: true,
          createdAt: new Date().toISOString(),
        }}
        onPress={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.queryByText('View booking')).toBeNull();
  });
});
