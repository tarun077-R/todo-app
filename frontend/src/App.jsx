import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import TaskDetail from './pages/TaskDetail';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function initializeAuth() {
      try {
        const { authMe } = await import('./api/client');
        const data = await authMe();
        if (!cancelled && data && data.user) {
          setUser(data.user);
        } else {
          // Auth check returned no user (e.g. 401 or invalid token)
          if (!cancelled) {
            setError('Not authenticated');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.data?.error?.message || 'Failed to initialize auth');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="loading-state">
          <div className="spinner spinner-large" role="status" aria-label="Loading" />
          <p className="loading-state-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Navigate to="/login" replace state={{ error }} />;
  }

  return children ? children : <Outlet context={{ user }} />;
}

function DashboardLayout() {
  // PrivateRoute publishes the authenticated user on the outlet context;
  // without reading it the sidebar could never show the signed-in account.
  const { user } = useOutletContext() || {};

  return (
    <div className="app-wrapper">
      <Sidebar user={user} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

/** Route tree without a router, so tests can mount it in a MemoryRouter. */
export function AppShell() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskList view="active" />} />
          <Route path="/tasks/completed" element={<TaskList view="completed" />} />
          <Route path="/tasks/new" element={<TaskForm />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
