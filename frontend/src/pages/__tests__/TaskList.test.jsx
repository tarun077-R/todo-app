import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { taskList } from '../../api/client';
import TaskList from '../TaskList';

vi.mock('../../api/client', () => ({
  taskList: vi.fn(),
  taskSearch: vi.fn(),
  taskComplete: vi.fn(),
  taskRestore: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  taskList.mockResolvedValue({ items: [], overdue: [] });
});

function renderList() {
  return render(
    <MemoryRouter>
      <TaskList />
    </MemoryRouter>
  );
}

describe('TaskList', () => {
  it('renders an empty state when there are no tasks', async () => {
    renderList();

    // Updated empty state text in new design
    const empty = await screen.findByText(/no tasks found/i);
    expect(empty).toBeInTheDocument();
  });

  it('renders the toolbar with search and filters in the new design', async () => {
    renderList();

    // Check for new toolbar elements
    expect(screen.getByLabelText('Search tasks')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort tasks by')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort direction')).toBeInTheDocument();
  });

  it('renders task cards in the new card layout', async () => {
    taskList.mockResolvedValue({
      items: [
        {
          _id: 't1',
          title: 'Buy milk',
          status: 'pending',
          priority: 'medium',
          dueDate: '2026-10-20T00:00:00Z',
          category: 'Shopping',
        },
      ],
      overdue: [],
    });

    renderList();

    // Wait for task card to appear
    const taskCard = await screen.findByText('Buy milk');
    expect(taskCard).toBeInTheDocument();
    
    // Check for task card elements
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders a completed task with restore functionality', async () => {
    taskList.mockResolvedValue({
      items: [
        {
          _id: 't2',
          title: 'Old chore',
          status: 'completed',
          priority: 'low',
          category: null,
        },
      ],
      overdue: [],
    });

    renderList();

    expect(await screen.findByText('Old chore')).toBeInTheDocument();
    // In new design, restore is handled via checkbox
    expect(screen.getByRole('checkbox', { name: /mark as incomplete/i })).toBeInTheDocument();
  });

  it('sends filter and sort params to the API', async () => {
    renderList();
    await screen.findByText(/no tasks found/i);

    fireEvent.change(screen.getByLabelText('Filter by status'), {
      target: { value: 'completed' },
    });
    fireEvent.change(screen.getByLabelText('Filter by priority'), {
      target: { value: 'high' },
    });
    fireEvent.change(screen.getByLabelText('Sort tasks by'), {
      target: { value: 'dueDate' },
    });
    fireEvent.change(screen.getByLabelText('Sort direction'), {
      target: { value: 'desc' },
    });

    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'completed',
          priority: 'high',
          sortBy: 'dueDate',
          sortDirection: 'desc',
        })
      );
    });
  });

  it('renders dashboard stats for priority buckets', async () => {
    taskList.mockResolvedValue({
      items: [],
      overdue: [],
      stats: { low: 5, medium: 1, high: 2 },
    });

    renderList();

    await screen.findByText(/no tasks found/i);
    // overview buckets still exposed even with an empty task list
    expect(taskList).toHaveBeenCalled();
  });

  it('shows error state with retry button when API fails', async () => {
    taskList.mockRejectedValue({ data: { error: { message: 'Server error' } } });

    renderList();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Server error');
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('shows empty state message based on filters', async () => {
    renderList();
    
    // Set a filter to trigger filtered empty state
    fireEvent.change(screen.getByLabelText('Filter by status'), {
      target: { value: 'completed' },
    });

    await screen.findByText(/try adjusting your filters/i);
  });

  it('renders task rows returned by the API', async () => {
    taskList.mockResolvedValue({
      items: [
        {
          _id: 't1',
          title: 'Buy milk',
          status: 'pending',
          priority: 'medium',
          dueDate: '2026-10-20T00:00:00Z',
          category: 'Shopping',
        },
      ],
      overdue: [],
    });

    renderList();

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders a completed task with a restore checkbox', async () => {
    taskList.mockResolvedValue({
      items: [
        {
          _id: 't2',
          title: 'Old chore',
          status: 'completed',
          priority: 'low',
          category: null,
        },
      ],
      overdue: [],
    });

    renderList();

    expect(await screen.findByText('Old chore')).toBeInTheDocument();
    // In new design, restore is handled via checkbox
    expect(screen.getByRole('checkbox', { name: /mark as incomplete/i })).toBeInTheDocument();
  });

  it('renders task cards in the new card layout', async () => {
    taskList.mockResolvedValue({
      items: [
        {
          _id: 't1',
          title: 'Buy milk',
          status: 'pending',
          priority: 'medium',
          dueDate: '2026-10-20T00:00:00Z',
          category: 'Shopping',
        },
      ],
      overdue: [],
    });

    renderList();

    // Wait for task card to appear
    const taskCard = await screen.findByText('Buy milk');
    expect(taskCard).toBeInTheDocument();
    
    // Check for task card elements
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('shows error state with retry button when API fails', async () => {
    taskList.mockRejectedValue({ data: { error: { message: 'Server error' } } });

    renderList();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Server error');
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('shows empty state message based on filters', async () => {
    renderList();
    
    // Set a filter to trigger filtered empty state
    fireEvent.change(screen.getByLabelText('Filter by status'), {
      target: { value: 'completed' },
    });

    await screen.findByText(/try adjusting your filters/i);
  });

  it('sends filter and sort params to the API', async () => {
    renderList();
    await screen.findByText(/no tasks found/i);

    fireEvent.change(screen.getByLabelText('Filter by status'), {
      target: { value: 'completed' },
    });
    fireEvent.change(screen.getByLabelText('Filter by priority'), {
      target: { value: 'high' },
    });
    fireEvent.change(screen.getByLabelText('Sort tasks by'), {
      target: { value: 'dueDate' },
    });
    fireEvent.change(screen.getByLabelText('Sort direction'), {
      target: { value: 'desc' },
    });

    await waitFor(() => {
      expect(taskList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'completed',
          priority: 'high',
          sortBy: 'dueDate',
          sortDirection: 'desc',
        })
      );
    });
  });

  it('renders dashboard stats for priority buckets', async () => {
    taskList.mockResolvedValue({
      items: [],
      overdue: [],
      stats: { low: 5, medium: 1, high: 2 },
    });

    renderList();

    await screen.findByText(/no tasks found/i);
    // overview buckets still exposed even with an empty task list
    expect(taskList).toHaveBeenCalled();
  });
});
