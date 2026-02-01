import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalSales: number;
  recentSales: number;
  totalStockUnits: number;
  totalInventoryValue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalSales: 0,
    recentSales: 0,
    totalStockUnits: 0,
    totalInventoryValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [salesData, inventorySummary] = await Promise.all([
        api.getDashboardAnalytics(7),
        api.getInventorySummary()
      ]);

      setStats({
        totalProducts: inventorySummary.total_products,
        lowStockItems: inventorySummary.low_stock_count,
        totalSales: salesData.total_sales,
        recentSales: salesData.total_transactions,
        totalStockUnits: inventorySummary.total_stock_units,
        totalInventoryValue: inventorySummary.total_inventory_value
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
      title: 'Total Stock',
      value: `${stats.totalStockUnits.toLocaleString()} units`,
      icon: '📊',
      color: 'var(--accent)',
      link: '/inventory'
    },
    {
      title: 'Inventory Value',
      value: `KSH ${stats.totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: '💎',
      color: 'var(--info)',
      link: '/inventory'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: '⚠️',
      color: stats.lowStockItems > 0 ? 'var(--warning)' : 'var(--success)',
      link: '/inventory'
    },
    {
      title: 'Total Sales (Week)',
      value: `KSH ${stats.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: '💰',
      color: 'var(--success)',
      link: '/analytics'
    },
    {
      title: 'Transactions (Week)',
      value: stats.recentSales,
      icon: '🛒',
      color: 'var(--primary)',
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
      <div className="grid grid-3 mb-xl">
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
                <h2 style={{ fontSize: '1.75rem', margin: 0, color: card.color }}>
                  {card.value}
                </h2>
              </div>
              <div style={{ fontSize: '2.5rem', opacity: 0.5 }}>
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
