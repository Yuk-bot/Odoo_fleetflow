import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, user }         = useAuthStore();
  const navigate                = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px', animation: 'ff-up .28s cubic-bezier(.32,.72,0,1) both' }}>

        {/* Brand */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            fontSize: '1.4rem', fontWeight: 600,
            letterSpacing: '-.03em', color: 'var(--text)',
          }}>
            FleetFlow
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--text-3)', marginTop: '4px' }}>
            Sign in to your workspace
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          padding: '28px 28px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {error && (
              <div className="ff-alert-error">{error}</div>
            )}

            <div className="ff-form-group">
              <label className="ff-label">Email address</label>
              <input
                type="email" required autoFocus
                className="ff-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="ff-form-group">
              <label className="ff-label">Password</label>
              <input
                type="password" required
                className="ff-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => alert('Contact your system administrator to reset your password.')}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: '.78rem', color: 'var(--text-3)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '2px',
                width: '100%', padding: '9px',
                background: 'var(--text)', color: 'var(--bg)',
                border: 'none', borderRadius: 'var(--r)',
                fontSize: '.875rem', fontWeight: 500,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? .65 : 1,
                transition: 'opacity 150ms',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
              }}
            >
              {loading && (
                <span style={{
                  width: '13px', height: '13px',
                  border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'ff-spin .6s linear infinite',
                }} />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>
        </div>

        {/* Sign up link */}
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '.8rem',
          color: 'var(--text-3)',
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{
            color: 'var(--accent)',
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            Sign up
          </Link>
        </div>

        {/* Default creds */}
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          fontSize: '.74rem',
          color: 'var(--text-3)',
          lineHeight: 1.6,
          textAlign: 'center',
        }}>
          <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>Default credentials</span>
          <br />
          admin@fleetflow.com · admin123
        </div>

      </div>
    </div>
  );
}