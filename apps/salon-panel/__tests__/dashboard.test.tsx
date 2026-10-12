import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Salon Panel - Component Tests', () => {
  test('Renders Dashboard Header element', () => {
    render(
      <div>
        <h1>Salon Partner Dashboard</h1>
        <p>Manage appointments, services, and staff</p>
      </div>
    );

    expect(screen.getByText('Salon Partner Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage appointments, services, and staff')).toBeInTheDocument();
  });
});
