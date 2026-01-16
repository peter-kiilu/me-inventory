import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  total_sales: number;
  total_transactions: number;
  average_sale: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  sales_by_category: Array<{
    category: string;
    revenue: number;
    quantity_sold: number;
  }>;
  daily_sales: Array<{
    date: string;
    total_sales: number;
    transaction_count: number;
  }>;
}

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardAnalytics(days);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
        <p className="text-muted">No analytics data available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-lg">
        <div>
          <h1>Sales Analytics</h1>
          <p className="text-muted">Insights and trends for your business</p>
        </div>
        <select
          className="select"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={{ maxWidth: '200px' }}
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-3 mb-xl">
        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Revenue</p>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--success)' }}>
            KSH {analytics.total_sales.toFixed(0)}
          </h2>
        </div>
        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Transactions</p>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--primary)' }}>
            {analytics.total_transactions}
          </h2>
        </div>
        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Average Sale</p>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--info)' }}>
            KSH {analytics.average_sale.toFixed(0)}
          </h2>
        </div>
      </div>

      {/* Daily Sales Trend */}
      <div className="glass-card mb-xl">
        <h3 className="mb-lg">Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.daily_sales}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)' }}
            />
            <YAxis
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)'
              }}
            />
            <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
            <Line
              type="monotone"
              dataKey="total_sales"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ fill: 'var(--primary)', r: 4 }}
              name="Revenue (KSH)"
            />
            <Line
              type="monotone"
              dataKey="transaction_count"
              stroke="var(--secondary)"
              strokeWidth={2}
              dot={{ fill: 'var(--secondary)', r: 3 }}
              name="Transactions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-2 gap-lg mb-xl">
        {/* Top Products */}
        <div className="glass-card">
          <h3 className="mb-lg">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.top_products.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="product_name"
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)'
                }}
              />
              <Bar dataKey="quantity_sold" fill="var(--primary)" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="glass-card">
          <h3 className="mb-lg">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.sales_by_category}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.category}
              >
                {analytics.sales_by_category.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-2 gap-lg">
        {/* Top Products Table */}
        <div className="glass-card">
          <h3 className="mb-lg">Product Performance</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_products.slice(0, 10).map((product, index) => (
                  <tr key={index}>
                    <td>{product.product_name}</td>
                    <td>{product.quantity_sold}</td>
                    <td><strong>KSH {product.revenue.toFixed(0)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Performance Table */}
        <div className="glass-card">
          <h3 className="mb-lg">Category Performance</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.sales_by_category.map((category, index) => (
                  <tr key={index}>
                    <td><span className="badge badge-info">{category.category}</span></td>
                    <td>{category.quantity_sold}</td>
                    <td><strong>KSH {category.revenue.toFixed(0)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
