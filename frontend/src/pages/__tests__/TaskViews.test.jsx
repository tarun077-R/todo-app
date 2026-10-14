import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { taskList } from '../../api/client';
import TaskList from '../TaskList';

vi.mock('../../api/client', () => ({
  taskList: vi.fn(),
  taskCreate: vi.fn(),
  taskComplete: vi.fn(),
  taskRestore: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  taskList.mockResolvedValue({ items: [], pagination: { total: 0 } });
});

function renderView(view) {
  return render(
    <MemoryRouter>
      <TaskList view={view} />
    </MemoryRouter>
  );
}

describe('TaskList views (regression: My Tasks and Completed showed the same tasks)', () => {
  it('the active view fetches pending tasks by default', async () => {
    renderView('active');

    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    const statusSelect = screen.getByLabelText('Filter by status');
    expect(statusSelect).not.toBeDisabled();
    expect(statusSelect.value).toBe('pending');
  });

  it('the completed view fetches completed tasks and locks the status filter', async () => {
    renderView('completed');

    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    const statusSelect = screen.getByLabelText('Filter by status');
    expect(statusSelect).toBeDisabled();
    expect(statusSelect.value).toBe('completed');
  });

  it('shows the completed heading on the completed view', async () => {
    renderView('completed');

    expect(await screen.findByRole('heading', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'My Tasks' })).not.toBeInTheDocument();
  });

  it('shows the My Tasks heading on the active view', async () => {
    renderView('active');

    expect(await screen.findByRole('heading', { name: 'My Tasks' })).toBeInTheDocument();
  });

  it('re-fetches with the other status when the view prop switches on the same instance', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <TaskList view="active" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    // Sibling routes reuse the component instance, so the view prop changes
    // without a remount — status must still follow the route.
    rerender(
      <MemoryRouter>
        <TaskList view="completed" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });
  });
});
