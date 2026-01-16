import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Sale {
  id: number;
  sale_date: string;
  total_amount: number;
  status: string;
  items: Array<{
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product?: {
      name: string;
    };
  }>;
}

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, [days]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales({ days, limit: 100 });
      setSales(data);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-lg">
        <div>
          <h1>Sales History</h1>
          <p className="text-muted">View past transactions and sales data</p>
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
          <option value={365}>Last Year</option>
        </select>
      </div>

      {/* Sales Summary */}
      <div className="grid grid-3 mb-lg">
        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Sales</p>
          <h2 style={{ margin: 0, color: 'var(--success)' }}>
            KSH {sales.reduce((sum, sale) => sum + sale.total_amount, 0).toFixed(0)}
          </h2>
        </div>
        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Transactions</p>
          <h2 style={{ margin: 0, color: 'var(--primary)' }}>{sales.length}</h2>
        </div>
        <div className="glass-card">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Average Sale</p>
          <h2 style={{ margin: 0, color: 'var(--info)' }}>
            KSH {sales.length > 0 ? (sales.reduce((sum, sale) => sum + sale.total_amount, 0) / sales.length).toFixed(0) : '0'}
          </h2>
        </div>
      </div>

      {/* Sales Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>#{sale.id}</td>
                <td>{formatDate(sale.sale_date)}</td>
                <td>{sale.items.length} items</td>
                <td><strong>KSH {sale.total_amount.toFixed(0)}</strong></td>
                <td>
                  <span className="badge badge-success">{sale.status}</span>
                </td>
                <td>
                  <button
                    onClick={() => setSelectedSale(sale)}
                    className="btn btn-primary"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sales.length === 0 && (
        <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
          <p className="text-muted">No sales found for this period</p>
        </div>
      )}

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sale #{selectedSale.id}</h2>
            <p className="text-muted mb-lg">{formatDate(selectedSale.sale_date)}</p>

            <div className="table-container mb-lg">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.product?.name || `Product #${item.product_id}`}</td>
                      <td>{item.quantity}</td>
                      <td>KSH {item.unit_price.toFixed(0)}</td>
                      <td><strong>KSH {item.subtotal.toFixed(0)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              padding: 'var(--spacing-lg)',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div className="flex-between" style={{ fontSize: '1.5rem' }}>
                <strong>Total:</strong>
                <strong style={{ color: 'var(--primary)' }}>KSH {selectedSale.total_amount.toFixed(0)}</strong>
              </div>
            </div>

            <button onClick={() => setSelectedSale(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
