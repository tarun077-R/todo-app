import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { taskCreate } from '../../api/client';
import TaskForm from '../TaskForm';

vi.mock('../../api/client', () => ({
  taskCreate: vi.fn(),
  taskList: vi.fn(() => Promise.resolve({ items: [] })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderForm() {
  return render(
    <MemoryRouter>
      <TaskForm />
    </MemoryRouter>
  );
}

describe('TaskForm', () => {
  it('renders the task creation form with accessible fields', () => {
    renderForm();

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toBeInTheDocument();
    // Updated label in new design
    expect(screen.getByLabelText('Category (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('validates that title is required', async () => {
    renderForm();

    // submit the form element directly so jsdom's native constraint
    // validation (the `required` attribute) doesn't swallow the event
    fireEvent.submit(screen.getByRole('button', { name: /create task/i }).closest('form'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
    expect(taskCreate).not.toHaveBeenCalled();
  });

  it('submits the task and sends the form values', async () => {
    taskCreate.mockResolvedValue({ id: '1' });
    renderForm();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Buy milk' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    expect(taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Buy milk', priority: 'high', status: 'pending' })
    );
  });
});
