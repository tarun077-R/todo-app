import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authLogin, setToken } from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token, user } = await authLogin({ email, password });
      setToken(token);
      const from = location.state?.from?.pathname || '/tasks';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div
        className="card"
        style={{
          maxWidth: '420px',
          margin: 'var(--space-8) auto',
          padding: 'var(--space-8)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            className="sidebar-brand"
            style={{
              justifyContent: 'center',
              paddingBottom: 0,
              marginBottom: 'var(--space-4)',
              borderBottom: 'none',
            }}
          >
            <div className="sidebar-brand-icon">T</div>
            <span className="sidebar-brand-text">TaskFlow</span>
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Welcome back
          </h1>
          <p className="text-secondary">
            Sign in to continue to your tasks.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-state" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
              <p className="error" role="alert">{error}</p>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 'var(--space-4)' }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="hint" style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          No account?{' '}
          <Link to={location.state?.from?.pathname || '/register'}>Create one</Link>
        </div>
      </div>
    </div>
  );
}
