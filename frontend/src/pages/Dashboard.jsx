import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboard } from '../api/client';

function StatCard({ value, label, accent, trend }) {
  return (
    <div className="stat-card">
      {accent && <div className={`stat-card-accent ${accent}`} />}
      <div className="stat-card-content">
        <div className="stat-card-value">
          {value !== null && value !== undefined ? value : '—'}
        </div>
        <div className="stat-card-label">{label}</div>
        {trend && (
          <div className={`stat-card-trend ${trend.direction}`}>
            <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {trend.direction === 'up' ? (
                <polyline points="18 15 12 9 6 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
            {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    dashboard()
      .then((data) => setStats(data))
      .catch((err) => setError(err?.data?.error?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="loading-state">
          <div className="spinner spinner-large" role="status" aria-label="Loading dashboard" />
          <p className="loading-state-text">Loading your overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="error-state">
          <svg className="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <div className="app-shell">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary" style={{ marginTop: 'var(--space-1)' }}>
            Welcome back! Here&apos;s your task overview.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/tasks/new')}>
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Task
        </button>
      </div>

      <div className="stats-grid overview">
        <StatCard
          value={stats?.total || 0}
          label="Total Tasks"
          accent
          trend={{ direction: stats?.total ? 'up' : 'up', label: 'All tasks' }}
        />
        <StatCard
          value={stats?.pending || 0}
          label="Pending"
          accent="warning"
        />
        <StatCard
          value={stats?.completed || 0}
          label="Completed"
          accent="success"
        />
        <StatCard
          value={stats?.overdue || 0}
          label="Overdue"
          accent="danger"
        />
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
            Priority Breakdown
          </span>
        </h2>
        <div className="stats-grid priority">
          <div className="stat-card">
            <div className="stat-card-accent success" />
            <div className="stat-card-content">
              <div className="stat-card-value">{stats?.byPriority?.low || 0}</div>
              <div className="stat-card-label">Low Priority</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-accent warning" />
            <div className="stat-card-content">
              <div className="stat-card-value">{stats?.byPriority?.medium || 0}</div>
              <div className="stat-card-label">Medium Priority</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-accent danger" />
            <div className="stat-card-content">
              <div className="stat-card-value">{stats?.byPriority?.high || 0}</div>
              <div className="stat-card-label">High Priority</div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-nav" style={{ marginTop: 'var(--space-8)' }}>
        <Link to="/tasks">
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          View all tasks
        </Link>
      </div>
    </div>
  );
}
