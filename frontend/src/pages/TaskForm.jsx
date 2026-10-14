import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { taskCreate } from '../api/client';

export default function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    try {
      await taskCreate({
        title: title.trim(),
        description: description.trim(),
        status: 'pending',
        priority,
        dueDate: dueDate || null,
        category: category.trim(),
      });
      navigate('/tasks');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">
            <Link to="/tasks">My Tasks</Link>
            <span aria-hidden="true"> / </span>
            New
          </p>
          <h1>Create task</h1>
          <p className="page-header-subtitle">
            Capture a task with its priority, due date, and category.
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/tasks" className="btn">
            Cancel
          </Link>
        </div>
      </header>

      <div className="card form-card">
        {error && (
          <div className="inline-alert" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="inline-alert-text">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add optional details…"
            />
          </div>

          <div className="grid two-column">
            <div className="form-field">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="task-due-date">Due date</label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="task-category">Category (optional)</label>
            <input
              id="task-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal, Shopping"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner spinner-inline" aria-hidden="true" />
                  Creating…
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
