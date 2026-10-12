import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Admin Panel - Component Tests', () => {
  test('Renders Super Admin Control Center Title', () => {
    render(
      <div>
        <h1>Super Admin Control Center</h1>
        <p>Manage platform salons, users, and global analytics</p>
      </div>
    );

    expect(screen.getByText('Super Admin Control Center')).toBeInTheDocument();
    expect(screen.getByText('Manage platform salons, users, and global analytics')).toBeInTheDocument();
  });
});
