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
      const { token } = await authLogin({ email, password });
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
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="sidebar-brand-icon" aria-hidden="true">T</div>
          <span className="sidebar-brand-text">TaskFlow</span>
        </div>

        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p className="text-secondary">Sign in to continue to your tasks.</p>
        </div>

        <form onSubmit={handleSubmit}>
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
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner spinner-inline" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="hint">
          No account?{' '}
          <Link to={location.state?.from?.pathname || '/register'}>Create one</Link>
        </div>
      </div>
    </div>
  );
}
