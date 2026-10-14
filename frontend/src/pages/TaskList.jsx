import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  taskList,
  taskComplete,
  taskRestore,
} from '../api/client';

function TaskCard({ task, onToggleComplete, onToggleRestore, onOpen }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'pending';

  return (
    <div
      className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}
      onClick={() => onOpen(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(task.id);
        }
      }}
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-card-content">
        <div className="task-title-row">
          <input
            type="checkbox"
            className="task-checkbox"
            checked={task.status === 'completed'}
            onChange={() => {
              if (task.status === 'pending') {
                onToggleComplete(task.id);
              } else {
                onToggleRestore(task.id);
              }
            }}
            aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          />
          <h3 className="task-title">{task.title}</h3>
        </div>

        <div className="task-meta">
          {task.priority && (
            <span className={`task-badge priority-${task.priority}`}>
              {task.priority}
            </span>
          )}
          {task.status && (
            <span className={`task-badge status-${task.status}`}>
              {task.status}
            </span>
          )}
          {task.dueDate && (
            <span className={`task-meta-item ${isOverdue ? 'text-danger' : ''}`}>
              <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
              {isOverdue && ' (overdue)'}
            </span>
          )}
          {task.category && (
            <span className="category-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {task.category}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <Link
          to={`/tasks/${task.id}`}
          className="btn btn-ghost btn-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </Link>
      </div>
    </div>
  );
}

export default function TaskList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category.trim()) params.category = category.trim();
      if (sortBy) {
        params.sortBy = sortBy;
        params.sortDirection = sortDirection;
      }
      const data = await taskList(params);
      setItems(data.items || []);
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, status, priority, category, sortBy, sortDirection]);

  async function handleSearch(e) {
    e.preventDefault();
    await load();
  }

  async function handleToggleComplete(id, currentStatus) {
    try {
      if (currentStatus === 'pending') {
        await taskComplete(id);
      } else {
        await taskRestore(id);
      }
      load();
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to update task');
    }
  }

  function handleOpenTask(id) {
    navigate(`/tasks/${id}`);
  }

  return (
    <div className="app-shell">
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="text-secondary" style={{ marginTop: 'var(--space-1)' }}>
            Manage and track your tasks.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/tasks/new')}>
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </button>
      </div>

      {error && (
        <div className="error-state" style={{ marginBottom: 'var(--space-4)' }}>
          <svg className="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="error" role="alert">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={load}>
            Try again
          </button>
        </div>
      )}

      <div className="toolbar">
        <form onSubmit={handleSearch} className="toolbar-search">
          <svg className="toolbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tasks"
          />
        </form>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <label htmlFor="status-filter" className="visually-hidden">Filter by status</label>
          <select
            id="status-filter"
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label htmlFor="priority-filter" className="visually-hidden">Filter by priority</label>
          <select
            id="priority-filter"
            className="filter-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label htmlFor="sort-by" className="visually-hidden">Sort by</label>
          <select
            id="sort-by"
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort tasks by"
          >
            <option value="createdAt">Created date</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label htmlFor="sort-direction" className="visually-hidden">Sort direction</label>
          <select
            id="sort-direction"
            className="filter-select"
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
            aria-label="Sort direction"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      {loading && !error ? (
        <div className="loading-state">
          <div className="spinner spinner-large" role="status" aria-label="Loading tasks" />
          <p className="loading-state-text">Loading your tasks...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px' }}>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h3 className="empty-state-title">No tasks found</h3>
          <p className="empty-state-text">
            {search || status || priority || category
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first task.'}
          </p>
          {!search && !status && !priority && !category && (
            <>
              <button
                className="btn btn-primary"
                style={{ marginTop: 'var(--space-4)' }}
                onClick={() => navigate('/tasks/new')}
              >
                Create Task
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid" style={{ gap: 'var(--space-3)' }}>
          {items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={(id) => handleToggleComplete(id, task.status)}
              onToggleRestore={(id) => handleToggleComplete(id, task.status)}
              onOpen={handleOpenTask}
            />
          ))}
        </div>
      )}

      <div className="footer-nav">
        <Link to="/">
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
