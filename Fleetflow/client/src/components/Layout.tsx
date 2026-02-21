import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NAV = [
  { name: 'Command Center',   href: '/',           icon: <GridIco /> },
  { name: 'Vehicle Registry', href: '/vehicles',   icon: <TruckIco /> },
  { name: 'Trip Dispatcher',  href: '/trips',      icon: <RouteIco /> },
  { name: 'Maintenance Logs', href: '/maintenance', icon: <WrenchIco /> },
  { name: 'Expense Logging',  href: '/expenses',   icon: <ReceiptIco /> },
  { name: 'Driver Profiles',  href: '/drivers',    icon: <UserIco /> },
  { name: 'Analytics',        href: '/analytics',  icon: <ChartIco /> },
];

export default function Layout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();

  const [dark, setDark] = useState(() =>
    (localStorage.getItem('ff-theme') ?? 'light') === 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('ff-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="ff-app">
      {/* ── Sidebar ── */}
      <aside className="ff-sidebar">
        <div className="ff-brand">
          <div className="brand-name">FleetFlow</div>
          <div className="brand-sub">Fleet Management</div>
        </div>

        <nav className="ff-nav">
          <div className="ff-nav-label">Workspace</div>
          {NAV.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`ff-nav-link${location.pathname === item.href ? ' active' : ''}`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="ff-sidebar-footer">
          <div className="ff-user">
            <div className="u-name">{user?.name ?? 'User'}</div>
            <div className="u-role">{user?.role ?? ''}</div>
          </div>

          <button className="ff-footer-btn" onClick={() => setDark(d => !d)}>
            <div className="toggle-track"><div className="toggle-thumb" /></div>
            {dark ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            className="ff-footer-btn"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <SignOutIco />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <main className="ff-main">
        <Outlet />
      </main>
    </div>
  );
}

/* ── Inline SVG icons ── */
function GridIco() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

function TruckIco() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M1 4h8v7H1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9 6h3l2 2v3h-5V6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="3.5" cy="11.5" r="1" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11.5" cy="11.5" r="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function RouteIco() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="3" cy="4" r="2" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M3 6v3a2 2 0 002 2h4a2 2 0 012 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function WrenchIco() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 3.5a3 3 0 01-4.2 4.2L4 13a1 1 0 01-1.4-1.4L7.9 6.3A3 3 0 0113.5 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function ReceiptIco() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h10v12l-2-1.5L9 14l-2-1.5L5 14 3 12.5V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M5.5 6h5M5.5 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function UserIco() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2.5 13.5c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function ChartIco() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="6.5" y="5" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="11" y="2" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function SignOutIco() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9.5 9.5L13 7l-3.5-2.5M13 7H5"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}