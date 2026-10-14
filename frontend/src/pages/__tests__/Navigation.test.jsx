import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../../App';

vi.mock('../../api/client', () => ({
  authMe: vi.fn(() => Promise.resolve({ user: { id: 'u1', name: 'Test User', email: 't@example.com' } })),
  authRegister: vi.fn(),
  authLogin: vi.fn(),
  taskList: vi.fn(() => Promise.resolve({ items: [], pagination: { total: 0 } })),
  taskCreate: vi.fn(),
  taskGet: vi.fn(() =>
    Promise.resolve({
      id: 'abc123',
      title: 'Sample task',
      status: 'pending',
      priority: 'medium',
      dueDate: null,
      category: '',
    })
  ),
  taskUpdate: vi.fn(),
  taskDelete: vi.fn(),
  taskComplete: vi.fn(),
  taskRestore: vi.fn(),
  dashboard: vi.fn(() =>
    Promise.resolve({
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      byPriority: { low: 0, medium: 0, high: 0 },
    })
  ),
  taskSearch: vi.fn(),
  clearAuth: vi.fn(),
  setToken: vi.fn(),
}));

async function renderAt(path) {
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell />
    </MemoryRouter>
  );
  // Wait for PrivateRoute's auth check to finish and the sidebar to mount.
  await waitFor(() => {
    expect(document.querySelector('.sidebar')).toBeInTheDocument();
  });
  return utils;
}

function activeNavLinks() {
  return [...document.querySelectorAll('.sidebar-nav [aria-current="page"]')];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Sidebar active navigation (regression: My Tasks and Completed highlighted together)', () => {
  it('highlights exactly one item on the dashboard route', async () => {
    await renderAt('/');

    const active = activeNavLinks();
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('Dashboard');
  });

  it('highlights only My Tasks on /tasks (previously also Completed)', async () => {
    await renderAt('/tasks');

    const active = activeNavLinks();
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('My Tasks');
    expect(active[0]).not.toHaveTextContent('Completed');
  });

  it('highlights only Completed on /tasks/completed (previously both)', async () => {
    await renderAt('/tasks/completed');

    const active = activeNavLinks();
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('Completed');
    expect(active[0]).not.toHaveTextContent('My Tasks');
  });

  it('keeps My Tasks active on /tasks/new', async () => {
    await renderAt('/tasks/new');

    const active = activeNavLinks();
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('My Tasks');
  });

  it('keeps My Tasks active on a task detail route', async () => {
    await renderAt('/tasks/abc123');

    const active = activeNavLinks();
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('My Tasks');
  });

  it('gives My Tasks and Completed distinct destinations (no query-string links)', async () => {
    await renderAt('/tasks');

    const myTasks = screen.getByRole('link', { name: /my tasks/i });
    const completed = screen.getByRole('link', { name: /completed/i });

    expect(myTasks).toHaveAttribute('href', '/tasks');
    expect(completed).toHaveAttribute('href', '/tasks/completed');
  });

  it('moves the active state when navigating from My Tasks to Completed', async () => {
    const { taskList } = await import('../../api/client');
    await renderAt('/tasks');
    expect(taskList).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'pending' })
    );

    fireEvent.click(screen.getByRole('link', { name: /completed/i }));

    await waitFor(() => {
      const active = activeNavLinks();
      expect(active).toHaveLength(1);
      expect(active[0]).toHaveTextContent('Completed');
    });

    // The completed route must also fetch the completed task set.
    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });
  });

  it('fetches the pending task set on the My Tasks route', async () => {
    const { taskList } = await import('../../api/client');
    await renderAt('/tasks');

    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });
  });
});
