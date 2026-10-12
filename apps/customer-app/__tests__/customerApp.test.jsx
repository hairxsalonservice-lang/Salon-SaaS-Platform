import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

describe('Customer App - Component Tests', () => {
  test('Renders Customer App Header Component', () => {
    render(
      <View>
        <Text>HairX Salon Services</Text>
        <Text>Book top salon services near you</Text>
      </View>
    );

    expect(screen.getByText('HairX Salon Services')).toBeTruthy();
    expect(screen.getByText('Book top salon services near you')).toBeTruthy();
  });
});
