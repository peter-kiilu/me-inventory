import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalSales: number;
  recentSales: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalSales: 0,
    recentSales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [products, lowStock, salesData] = await Promise.all([
        api.getProducts({ limit: 1000 }),
        api.getInventory({ low_stock: true }),
        api.getDashboardAnalytics(7)
      ]);

      setStats({
        totalProducts: products.length,
        lowStockItems: lowStock.length,
        totalSales: salesData.total_sales,
        recentSales: salesData.total_transactions
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      color: 'var(--primary)',
      link: '/products'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: '⚠️',
      color: 'var(--warning)',
      link: '/inventory'
    },
    {
      title: 'Total Sales (Week)',
      value: `KSH ${stats.totalSales.toFixed(0)}`,
      icon: '💰',
      color: 'var(--success)',
      link: '/analytics'
    },
    {
      title: 'Transactions (Week)',
      value: stats.recentSales,
      icon: '🛒',
      color: 'var(--info)',
      link: '/sales/history'
    }
  ];

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '3rem', height: '3rem', marginBottom: 'var(--spacing-md)' }} />
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-xl">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Overview of your inventory and sales</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-2 mb-xl">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="glass-card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="flex-between">
              <div>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}>
                  {card.title}
                </p>
                <h2 style={{ fontSize: '2rem', margin: 0, color: card.color }}>
                  {card.value}
                </h2>
              </div>
              <div style={{ fontSize: '3rem', opacity: 0.5 }}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card">
        <h3 className="mb-lg">Quick Actions</h3>
        <div className="grid grid-3">
          <Link to="/sales" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            🛒 New Sale
          </Link>
          <Link to="/products" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            📦 Manage Products
          </Link>
          <Link to="/analytics" className="btn btn-success" style={{ textDecoration: 'none', background: 'var(--accent)' }}>
            📈 View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
