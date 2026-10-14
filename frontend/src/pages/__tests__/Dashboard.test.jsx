import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { dashboard } from '../../api/client';
import Dashboard from '../Dashboard';

vi.mock('../../api/client', () => ({
  dashboard: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  it('renders dashboard statistics', async () => {
    dashboard.mockResolvedValue({
      total: 3,
      completed: 1,
      pending: 2,
      overdue: 0,
      byPriority: { low: 1, medium: 1, high: 1 },
    });

    renderDashboard();

    // Check for new stat card labels (PascalCase in new design)
    expect(await screen.findByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    
    // Verify values are displayed
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows an error state when stats fail to load', async () => {
    dashboard.mockRejectedValue({
      data: { error: { message: 'Boom' } },
    });

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });
});
