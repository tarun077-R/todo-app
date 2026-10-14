import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { taskGet, taskUpdate, taskDelete, taskComplete, taskRestore } from '../api/client';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    taskGet(id)
      .then((data) => {
        if (!cancelled) setTask(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.data?.error?.message || 'Task not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    setError('');
    try {
      const updated = await taskUpdate(id, {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        category: task.category,
      });
      setTask(updated);
      setNotice('Changes saved');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!task) return;
    setError('');
    try {
      const updated =
        task.status === 'pending'
          ? await taskComplete(task.id)
          : await taskRestore(task.id);
      setTask(updated);
      setNotice(updated.status === 'completed' ? 'Task completed' : 'Task restored to pending');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to update task');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    try {
      await taskDelete(id);
      navigate('/tasks');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to delete task');
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="loading-state">
          <div className="spinner spinner-large" role="status" aria-label="Loading task" />
          <p className="loading-state-text">Loading task…</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="app-shell">
        <div className="error-state">
          <svg className="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 className="error-state-title">Task not found</h2>
          <p className="error" role="alert">{error}</p>
          <Link to="/tasks" className="btn btn-primary">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'pending';

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">
            <Link to="/tasks">My Tasks</Link>
            <span aria-hidden="true"> / </span>
            Edit
          </p>
          <h1>{task.title}</h1>
          <p className="page-header-subtitle">
            {task.status === 'completed' ? 'Completed' : 'Pending'}
            {task.priority && ` · ${task.priority} priority`}
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/tasks" className="btn">
            Back to Tasks
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

        {notice && (
          <div className="inline-notice" role="status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="inline-notice-text">{notice}</span>
            <button type="button" className="inline-notice-close" onClick={() => setNotice('')} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              rows={4}
              placeholder="Add details…"
            />
          </div>

          <div className="grid two-column">
            <div className="form-field">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={task.status}
                onChange={(e) => setTask({ ...task, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={task.priority}
                onChange={(e) => setTask({ ...task, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="task-due-date">Due date</label>
            <input
              id="task-due-date"
              type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
            />
            {isOverdue && (
              <p className="field-hint text-danger">This task is overdue</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="task-category">Category</label>
            <input
              id="task-category"
              type="text"
              value={task.category || ''}
              onChange={(e) => setTask({ ...task, category: e.target.value })}
              placeholder="e.g., Work, Personal"
            />
          </div>

          <div className="form-actions form-actions-split">
            <div className="form-actions-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner spinner-inline" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                className={`btn ${task.status === 'pending' ? 'btn-success' : ''}`}
                onClick={handleToggleStatus}
              >
                {task.status === 'pending' ? 'Mark Complete' : 'Restore'}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              Delete Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
