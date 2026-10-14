import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  taskList,
  taskCreate,
  taskComplete,
  taskRestore,
} from '../api/client';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dueInfo(dueDate) {
  if (!dueDate) return null;
  const due = startOfDay(dueDate);
  const today = startOfDay(new Date());
  const diffDays = Math.round((due - today) / DAY_MS);

  let label;
  if (diffDays === 0) label = 'Today';
  else if (diffDays === 1) label = 'Tomorrow';
  else if (diffDays === -1) label = 'Yesterday';
  else {
    label = due.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(due.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
    });
  }

  return { label, overdue: diffDays < 0, soon: diffDays >= 0 && diffDays <= 1 };
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TaskRow({ task, onToggle, onOpen }) {
  const completed = task.status === 'completed';
  const due = dueInfo(task.dueDate);

  return (
    <li className={`task-row${completed ? ' is-completed' : ''}${due?.overdue && !completed ? ' is-overdue' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
        aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
      />

      <div
        className="task-row-body"
        onClick={() => onOpen(task.id)}
        role="presentation"
      >
        <span className="task-row-title">{task.title}</span>
        {(due || task.category) && (
          <span className="task-row-meta">
            {due && (
              <span className={`due-chip${due.overdue ? ' is-overdue' : ''}${due.soon && !completed ? ' is-soon' : ''}`}>
                <CalendarIcon />
                {due.label}
                {due.overdue && !completed && ' · overdue'}
              </span>
            )}
            {task.category && (
              <span className="category-tag">
                <FolderIcon />
                {task.category}
              </span>
            )}
          </span>
        )}
      </div>

      <span className={`task-priority priority-${task.priority}`}>
        <span className="task-priority-dot" aria-hidden="true" />
        {task.priority}
      </span>

      <Link
        to={`/tasks/${task.id}`}
        className="task-row-edit"
        aria-label={`Edit task: ${task.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </Link>
    </li>
  );
}

export default function TaskList({ view = 'active' }) {
  const isCompletedView = view === 'completed';
  const defaultStatus = isCompletedView ? 'completed' : 'pending';

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();

  // The route decides which task set this view shows. Sibling routes reuse the
  // same component instance, so status must be re-synced when the view changes
  // instead of relying on initial state alone.
  useEffect(() => {
    setStatus(isCompletedView ? 'completed' : 'pending');
  }, [isCompletedView]);

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
      const nextItems = data.items || [];
      setItems(nextItems);
      setTotal(data.pagination?.total ?? nextItems.length);
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority, category, sortBy, sortDirection]);

  async function handleSearch(e) {
    e.preventDefault();
    await load();
  }

  async function handleToggle(task) {
    const nextStatus = task.status === 'pending' ? 'completed' : 'pending';
    // Optimistic update: the checkbox is controlled, so without flipping the
    // row immediately the box visually snaps back until the server responds.
    setItems((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
    try {
      if (nextStatus === 'completed') {
        await taskComplete(task.id);
      } else {
        await taskRestore(task.id);
      }
      await load();
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to update task');
      await load(); // roll back the optimistic change
    }
  }

  async function handleQuickAdd(e) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setAdding(true);
    setAddError('');
    try {
      await taskCreate({ title, status: 'pending', priority: 'medium' });
      setDraft('');
      await load();
    } catch (err) {
      setAddError(err?.data?.error?.message || 'Failed to add task');
    } finally {
      setAdding(false);
    }
  }

  function handleOpenTask(id) {
    navigate(`/tasks/${id}`);
  }

  const hasCustomFilters =
    Boolean(search.trim() || priority || category) || status !== defaultStatus;
  const countLabel =
    total === null
      ? ''
      : hasCustomFilters
        ? `${items.length} of ${total} ${total === 1 ? 'task' : 'tasks'}`
        : `${total} ${total === 1 ? 'task' : 'tasks'}${isCompletedView ? ' completed' : ' open'}`;

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <h1>{isCompletedView ? 'Completed' : 'My Tasks'}</h1>
          <p className="page-header-subtitle">
            {loading && total === null ? 'Loading tasks…' : countLabel}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add task
          </button>
        </div>
      </header>

      {error && (
        <div className="inline-alert" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="inline-alert-text">{error}</span>
          <button className="btn btn-sm" onClick={load}>Try again</button>
        </div>
      )}

      {!isCompletedView && (
        <form className="quick-add" onSubmit={handleQuickAdd}>
          <span className="quick-add-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          <input
            type="text"
            className="quick-add-input"
            placeholder="Add a task and press Enter…"
            aria-label="Quick add task"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={adding}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={adding || !draft.trim()}
          >
            {adding ? 'Adding…' : 'Add task'}
          </button>
          {addError && <span className="quick-add-error" role="alert">{addError}</span>}
        </form>
      )}

      <div className="toolbar">
        <form onSubmit={handleSearch} className="toolbar-search">
          <svg className="toolbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tasks"
          />
        </form>

        <div className="toolbar-filters">
          <label htmlFor="status-filter" className="visually-hidden">Filter by status</label>
          <select
            id="status-filter"
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            disabled={isCompletedView}
            title={isCompletedView ? 'This view always shows completed tasks' : undefined}
          >
            {isCompletedView ? (
              <option value="completed">Completed</option>
            ) : (
              <>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </>
            )}
          </select>

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

          <input
            type="text"
            id="category-filter"
            className="filter-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            placeholder="Category"
          />

          <div className="toolbar-divider" aria-hidden="true" />

          <label htmlFor="sort-by" className="visually-hidden">Sort tasks by</label>
          <select
            id="sort-by"
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort tasks by"
          >
            <option value="createdAt">Created</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </select>

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

      {loading && total === null ? (
        <div className="task-skeleton" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="task-skeleton-row" key={i}>
              <span className="task-skeleton-check" />
              <span className="task-skeleton-line" />
            </div>
          ))}
          <span className="visually-hidden" role="status">Loading tasks</span>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="loading-state">
          <div className="spinner" role="status" aria-label="Loading tasks" />
        </div>
      ) : error && items.length === 0 ? (
        // The alert above already explains the failure; don't also show a
        // misleading "no tasks" empty state.
        null
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h3 className="empty-state-title">
            {isCompletedView ? 'Nothing completed yet' : 'No tasks found'}
          </h3>
          <p className="empty-state-text">
            {hasCustomFilters
              ? 'Try adjusting your filters or search terms.'
              : isCompletedView
                ? 'Tasks you complete will show up here.'
                : 'Get started by creating your first task.'}
          </p>
          {!hasCustomFilters && !isCompletedView && (
            <button
              className="btn btn-primary empty-state-cta"
              onClick={() => navigate('/tasks/new')}
            >
              Create Task
            </button>
          )}
          {hasCustomFilters && (
            <button
              className="btn empty-state-cta"
              onClick={() => {
                setSearch('');
                setPriority('');
                setCategory('');
                setStatus(defaultStatus);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="task-list">
          {items.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onOpen={handleOpenTask}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
