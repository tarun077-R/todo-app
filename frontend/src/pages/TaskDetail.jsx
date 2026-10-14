import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { taskGet, taskUpdate, taskDelete, taskComplete, taskRestore } from '../api/client';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    taskGet(id)
      .then((data) => setTask(data))
      .catch((err) => setError(err?.data?.error?.message || 'Task not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    try {
      await taskUpdate(id, {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        category: task.category,
      });
      setError('');
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
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
          <p className="loading-state-text">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="app-shell">
        <div className="error-state">
          <svg className="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'pending';

  return (
    <div className="app-shell">
      <div className="page-header">
        <Link to="/tasks" className="btn btn-ghost">
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Tasks
        </Link>
        <div style={{ flex: 1 }} />
      </div>

      <div className="card form-card" style={{ maxWidth: '640px' }}>
        {error && (
          <div className="error-state" style={{ marginBottom: 'var(--space-4)' }}>
            <p className="error" role="alert">{error}</p>
          </div>
        )}

        {task && (
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="task-title">Title</label>
              <input
                id="task-title"
                type="text"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                value={task.description || ''}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                rows={4}
                placeholder="Add details..."
              />
            </div>

            <div className="grid two-column" style={{ marginTop: 'var(--space-4)' }}>
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

            <div className="form-field" style={{ marginTop: 'var(--space-4)' }}>
              <label htmlFor="task-due-date">Due date</label>
              <input
                id="task-due-date"
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''}
                onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              />
              {isOverdue && (
                <p className="text-danger" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
                  This task is overdue!
                </p>
              )}
            </div>

            <div className="form-field" style={{ marginTop: 'var(--space-4)' }}>
              <label htmlFor="task-category">Category</label>
              <input
                id="task-category"
                type="text"
                value={task.category || ''}
                onChange={(e) => setTask({ ...task, category: e.target.value })}
                placeholder="e.g., Work, Personal"
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
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>

              <div className="form-actions-right">
                {task.status === 'pending' ? (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => taskComplete(task.id)}
                  >
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Mark Complete
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => taskRestore(task.id)}
                  >
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V12" />
                      <path d="M15 8a2 2 0 0 0 0 4" />
                    </svg>
                    Restore
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Task
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
