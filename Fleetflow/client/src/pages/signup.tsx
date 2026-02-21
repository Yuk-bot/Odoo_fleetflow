import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Signup() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('Manager');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { register }            = useAuthStore();
  const navigate                = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, role);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
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
            Create a new account
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
              <label className="ff-label">Full name</label>
              <input
                type="text" required autoFocus
                className="ff-input"
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="ff-form-group">
              <label className="ff-label">Email address</label>
              <input
                type="email" required
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

            <div className="ff-form-group">
              <label className="ff-label">Role</label>
              <select
                className="ff-select"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="Manager">Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="SafetyOfficer">Safety Officer</option>
                <option value="FinancialAnalyst">Financial Analyst</option>
              </select>
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>

          </form>
        </div>

        {/* Sign in link */}
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '.8rem',
          color: 'var(--text-3)',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'var(--accent)',
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}