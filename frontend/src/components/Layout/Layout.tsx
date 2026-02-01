import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import NetworkStatus from '../Common/NetworkStatus';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout, isAdmin, user } = useStore();

  const navItems: NavItem[] = [
    { path: '/', label: isAdmin() ? 'Dashboard' : 'New Sale', icon: isAdmin() ? '📊' : '🛒' },
    { path: '/products', label: 'Products', icon: '📦', adminOnly: true },
    { path: '/inventory', label: 'Inventory', icon: '📋', adminOnly: true },
    { path: '/sales', label: 'New Sale', icon: '🛒', adminOnly: true },
    { path: '/sales/history', label: 'Sales History', icon: '📜', adminOnly: true },
    { path: '/analytics', label: 'Analytics', icon: '📈', adminOnly: true },
    { path: '/users', label: 'Users', icon: '👥', adminOnly: true },
  ];

  // Filter nav items based on role
  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin()) return false;
    // Don't show duplicate "New Sale" for staff (home is already sales)
    if (!isAdmin() && item.path === '/sales' && item.adminOnly) return false;
    return true;
  });

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
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🛒 CoolHarlems</h2>
              <NetworkStatus />
            </div>
            <div className="flex gap-md" style={{ alignItems: 'center' }}>
              <span style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: isAdmin() ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isAdmin() ? 'var(--primary)' : 'var(--success)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>
                {user.username}
              </span>
              <button onClick={logout} className="btn btn-outline" style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                Logout
              </button>
            </div>
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
            {visibleNavItems.map((item) => (
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
          © 2026  CoolHarlems Management System
        </p>
      </footer>
    </div>
  );
}
