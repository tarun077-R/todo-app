import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authRegister, setToken } from '../api/client';

export default function Register() {
  const [name, setName] = useState('');
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
      const { token, user } = await authRegister({ name, email, password });
      setToken(token);
      const from = location.state?.from?.pathname || '/tasks';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.error?.message || 'Registration failed. Please try again.');
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
            Create your account
          </h1>
          <p className="text-secondary">
            Get started with your personal task manager.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-state" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
              <p className="error" role="alert">{error}</p>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoComplete="name"
              autoFocus
            />
          </div>

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
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              minLength={8}
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="hint" style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          Already have an account?{' '}
          <Link to={location.state?.from?.pathname || '/login'}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
