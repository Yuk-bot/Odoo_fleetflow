// useTheme.ts — drop into src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('ff-theme') as 'light' | 'dark') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ff-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return { theme, toggle };
}


// ─────────────────────────────────────────────────────────────────────────────
// AppLayout.tsx — drop into src/components/AppLayout.tsx
// Wraps every page. Uses React Router for navigation.
// ─────────────────────────────────────────────────────────────────────────────
/*
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const NAV = [
  { label: 'Command Center',    path: '/',           icon: <GridIcon /> },
  { label: 'Vehicle Registry',  path: '/vehicles',   icon: <TruckIcon /> },
  { label: 'Trip Dispatcher',   path: '/trips',      icon: <RouteIcon /> },
  { label: 'Maintenance',       path: '/maintenance',icon: <WrenchIcon /> },
  { label: 'Expenses',          path: '/expenses',   icon: <ReceiptIcon /> },
  { label: 'Drivers',           path: '/drivers',    icon: <UserIcon /> },
  { label: 'Analytics',         path: '/analytics',  icon: <BarChartIcon /> },
];

export default function AppLayout() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  return (
    <div className="ff-app">
      <aside className="ff-sidebar">
        <div className="ff-sidebar-logo">
          <div className="logo-text">FleetFlow</div>
          <div className="logo-sub">Fleet Management</div>
        </div>
        <nav className="ff-nav-section">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`ff-nav-item ${pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ff-sidebar-footer">
          <button className="ff-theme-toggle" onClick={toggle}>
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>
      <main className="ff-main">
        <Outlet />
      </main>
    </div>
  );
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// SVG Icons (minimal, 18×18) — copy into your icon file or inline as needed
// ─────────────────────────────────────────────────────────────────────────────

export const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

export const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4h8v7H1zM9 6h3l2 2v3h-5V6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <circle cx="3.5" cy="11.5" r="1" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="11.5" cy="11.5" r="1" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export const RouteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="3" cy="4" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M3 6v3a2 2 0 002 2h4a2 2 0 012 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export const WrenchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 3.5a3 3 0 01-4.2 4.2L4 13a1 1 0 01-1.4-1.4L7.9 6.3A3 3 0 0113.5 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);

export const ReceiptIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2h10v12l-2-1.5L9 14l-2-1.5L5 14 3 12.5V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M5.5 6h5M5.5 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2.5 13.5c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="9" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="6.5" y="5" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="11" y="2" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

export const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 7.5A5.5 5.5 0 016.5 2a5.5 5.5 0 100 10A5.5 5.5 0 0012 7.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);
