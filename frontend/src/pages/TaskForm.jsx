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
      <div className="page-header">
        <div>
          <h1>Create New Task</h1>
          <p className="text-secondary" style={{ marginTop: 'var(--space-1)' }}>
            Add a new task to your list.
          </p>
        </div>
        <Link to="/tasks" className="btn btn-ghost">
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Cancel
        </Link>
      </div>

      <div className="card form-card" style={{ maxWidth: '640px' }}>
        {error && (
          <div className="error-state" style={{ marginBottom: 'var(--space-4)' }}>
            <p className="error" role="alert">{error}</p>
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
              placeholder="Add optional details..."
            />
          </div>

          <div className="grid two-column" style={{ marginTop: 'var(--space-4)' }}>
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

          <div className="form-field" style={{ marginTop: 'var(--space-4)' }}>
            <label htmlFor="task-category">Category (optional)</label>
            <input
              id="task-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal, Shopping"
            />
          </div>

          <div className="form-actions" style={{ marginTop: 'var(--space-6)' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
