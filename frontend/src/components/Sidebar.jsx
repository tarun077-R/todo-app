import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth } from '../api/client';

function Icon({ children }) {
  return (
    <svg
      className="sidebar-link-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const navItems = [
  {
    key: 'dashboard',
    to: '/',
    label: 'Dashboard',
    icon: (
      <Icon>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </Icon>
    ),
  },
  {
    key: 'tasks',
    to: '/tasks',
    label: 'My Tasks',
    icon: (
      <Icon>
        <path d="M9 6h11" />
        <path d="M9 12h11" />
        <path d="M9 18h11" />
        <path d="M4 6l.75.75L6.5 5" />
        <path d="M4 12l.75.75L6.5 11" />
        <path d="M4 18l.75.75L6.5 17" />
      </Icon>
    ),
  },
  {
    key: 'completed',
    to: '/tasks/completed',
    label: 'Completed',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" />
      </Icon>
    ),
  },
];

/**
 * Single source of truth for which sidebar item is active.
 * Exactly one key matches for every app route, so two items can never
 * highlight at once (the old code ORed NavLink's pathname-based isActive
 * with a startsWith check that both matched "/tasks").
 */
export function activeNavKey(pathname) {
  if (pathname === '/') return 'dashboard';
  if (pathname === '/tasks/completed') return 'completed';
  if (pathname.startsWith('/tasks')) return 'tasks'; // /tasks, /tasks/new, /tasks/:id
  return null;
}

export default function Sidebar({ user }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = activeNavKey(pathname);

  function handleSignOut() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">T</div>
        <span className="sidebar-brand-text">TaskFlow</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`sidebar-link${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="avatar" aria-hidden="true">{initial}</div>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{user.name || 'Your account'}</span>
              {user.email && <span className="sidebar-user-email">{user.email}</span>}
            </div>
          </div>
        )}
        <button type="button" className="sidebar-link sidebar-signout" onClick={handleSignOut}>
          <Icon>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </Icon>
          <span className="sidebar-link-label">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
