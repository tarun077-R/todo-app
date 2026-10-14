import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

// Mock the API client module 
vi.mock('../../api/client', () => ({
  authMe: vi.fn(() => Promise.resolve({ user: { id: 'u1' } })),
  authRegister: vi.fn(),
  authLogin: vi.fn(),
  taskList: vi.fn(),
  taskCreate: vi.fn(),
  taskGet: vi.fn(),
  taskUpdate: vi.fn(),
  taskDelete: vi.fn(),
  taskComplete: vi.fn(),
  taskRestore: vi.fn(),
  dashboard: vi.fn(() => Promise.resolve({
    total: 3,
    completed: 1,
    pending: 2,
    overdue: 0,
    byPriority: { low: 1, medium: 1, high: 1 },
  })),
  taskSearch: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset localStorage between tests
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});

function renderApp() {
  return render(<App />);
}

describe('App / PrivateRoute - auth failure modes', () => {
  it('redirects to login when authMe throws an error', async () => {
    // Override the mock to reject
    const { authMe } = await import('../../api/client');
    authMe.mockRejectedValue(new Error('Boom'));

    renderApp();

    // Should show login page with error
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('redirects to login when authMe returns data without user (e.g. 401)', async () => {
    const { authMe } = await import('../../api/client');
    // Simulate a 401 response where the API returns data without a user property
    authMe.mockResolvedValue({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });

    renderApp();

    // Should redirect to login, not show Dashboard
    await screen.findByRole('heading', { name: /sign in/i });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('redirects to login when authMe returns 401 data shape', async () => {
    const { authMe } = await import('../../api/client');
    // Simulate the exact shape returned by the API client on 401
    authMe.mockResolvedValue({
      status: 401,
      data: { error: { code: 'UNAUTHORIZED', message: 'Missing or malformed bearer token' } }
    });

    renderApp();

    await screen.findByRole('heading', { name: /sign in/i });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});

describe('App / PrivateRoute - regression: no infinite spinner', () => {
  it('does not show spinner forever when authMe resolves with 401 status', async () => {
    const { authMe } = await import('../../api/client');
    // This is the exact shape returned by the API client when the server returns 401
    authMe.mockResolvedValue({
      status: 401,
      data: { error: { code: 'UNAUTHORIZED', message: 'Missing or malformed bearer token' } }
    });

    renderApp();

    // The spinner should disappear (loading finishes) and login should appear
    await screen.findByRole('heading', { name: /sign in/i });
    // After redirect, no spinner should be visible
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('does not show spinner forever when authMe returns no user property', async () => {
    const { authMe } = await import('../../api/client');
    authMe.mockResolvedValue({}); // No user property

    renderApp();

    await screen.findByRole('heading', { name: /sign in/i });
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('redirects to login when authMe returns null', async () => {
    const { authMe } = await import('../../api/client');
    authMe.mockResolvedValue(null);

    renderApp();

    await screen.findByRole('heading', { name: /sign in/i });
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});
