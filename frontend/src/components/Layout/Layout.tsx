import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import NetworkStatus from '../Common/NetworkStatus';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const logout = useStore((state) => state.logout);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/inventory', label: 'Inventory', icon: '📋' },
    { path: '/sales', label: 'New Sale', icon: '🛒' },
    { path: '/sales/history', label: 'Sales History', icon: '📜' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Bar */}
      <header style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
      }}>
        <div className="container">
          <div className="flex-between">
            <div className="flex gap-md" style={{ alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🛒 MeStock</h2>
              <NetworkStatus />
            </div>
            <button onClick={logout} className="btn btn-outline" style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--glass-border)',
        padding: 'var(--spacing-sm) 0',
        overflowX: 'auto'
      }}>
        <div className="container">
          <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="btn"
                style={{
                  background: location.pathname === item.path
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                    : 'transparent',
                  color: location.pathname === item.path ? 'white' : 'var(--text-secondary)',
                  border: location.pathname === item.path ? 'none' : '1px solid transparent',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  fontSize: '0.875rem'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: 'var(--spacing-xl) 0',
      }}>
        <div className="container">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--glass-border)',
        padding: 'var(--spacing-lg)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: 0 }}>
          © 2026 MeStock Inventory Management System
        </p>
      </footer>
    </div>
  );
}
