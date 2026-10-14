import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboard, taskList } from '../api/client';

function dueLabel(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / (24 * 60 * 60 * 1000));
  if (diff < 0) return { text: 'Overdue', tone: 'overdue' };
  if (diff === 0) return { text: 'Today', tone: 'soon' };
  if (diff === 1) return { text: 'Tomorrow', tone: 'soon' };
  return {
    text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    tone: 'plain',
  };
}

function StatStrip({ stats }) {
  const cells = [
    { key: 'total', label: 'Total Tasks', value: stats?.total ?? 0 },
    { key: 'pending', label: 'Pending', value: stats?.pending ?? 0 },
    { key: 'completed', label: 'Completed', value: stats?.completed ?? 0 },
    { key: 'overdue', label: 'Overdue', value: stats?.overdue ?? 0, tone: 'danger' },
  ];

  return (
    <section className="stat-strip" aria-label="Task statistics">
      {cells.map((cell) => (
        <div
          className={`stat-cell${cell.tone === 'danger' && cell.value > 0 ? ' is-danger' : ''}`}
          key={cell.key}
        >
          <span className="stat-value">{cell.value}</span>
          <span className="stat-label">{cell.label}</span>
        </div>
      ))}
    </section>
  );
}

function PriorityBreakdown({ byPriority }) {
  const buckets = [
    { key: 'high', label: 'High', count: byPriority?.high || 0 },
    { key: 'medium', label: 'Medium', count: byPriority?.medium || 0 },
    { key: 'low', label: 'Low', count: byPriority?.low || 0 },
  ];
  const total = buckets.reduce((sum, b) => sum + b.count, 0);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Priority breakdown</h2>
        <span className="panel-hint">{total} {total === 1 ? 'task' : 'tasks'}</span>
      </div>
      {total === 0 ? (
        <p className="panel-empty">No tasks yet.</p>
      ) : (
        <>
          <div
            className="priority-bar"
            role="img"
            aria-label={`Priority breakdown: ${buckets.map((b) => `${b.count} ${b.label.toLowerCase()}`).join(', ')}`}
          >
            {buckets.map((b) => (
              b.count > 0 && (
                <span
                  key={b.key}
                  className={`priority-seg seg-${b.key}`}
                  style={{ flexGrow: b.count }}
                />
              )
            ))}
          </div>
          <ul className="priority-legend">
            {buckets.map((b) => (
              <li key={b.key} className={`legend-${b.key}`}>
                <span className="legend-dot" aria-hidden="true" />
                <span className="legend-label">{b.label}</span>
                <span className="legend-count">{b.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function NextUp({ tasks }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Next up</h2>
        <Link to="/tasks" className="panel-link">View all</Link>
      </div>
      {tasks.length === 0 ? (
        <p className="panel-empty">Nothing pending — you&apos;re all caught up.</p>
      ) : (
        <ul className="mini-task-list">
          {tasks.map((task) => {
            const due = dueLabel(task.dueDate);
            return (
              <li key={task.id} className="mini-task">
                <Link to={`/tasks/${task.id}`} className="mini-task-title">
                  {task.title}
                </Link>
                <span className={`mini-task-due${due ? ` tone-${due.tone}` : ''}`}>
                  {due ? due.text : 'No date'}
                </span>
                <span className={`task-priority priority-${task.priority}`}>
                  <span className="task-priority-dot" aria-hidden="true" />
                  {task.priority}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [statsData, upcomingData] = await Promise.all([
          dashboard(),
          taskList({ status: 'pending', sortBy: 'dueDate', sortDirection: 'asc', limit: 5 }),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setUpcoming(upcomingData.items || []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.data?.error?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="loading-state">
          <div className="spinner spinner-large" role="status" aria-label="Loading dashboard" />
          <p className="loading-state-text">Loading your overview…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="error-state">
          <svg className="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 className="error-state-title">Unable to load dashboard</h2>
          <p className="error" role="alert">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const summary = stats
    ? [
        `${stats.total} ${stats.total === 1 ? 'task' : 'tasks'}`,
        `${stats.pending} pending`,
        `${stats.completed} completed`,
      ].join(' · ')
    : '';

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-header-subtitle">{summary}</p>
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

      <StatStrip stats={stats} />

      <div className="dash-grid">
        <PriorityBreakdown byPriority={stats?.byPriority} />
        <NextUp tasks={upcoming} />
      </div>
    </div>
  );
}
