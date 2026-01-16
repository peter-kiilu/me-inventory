import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  inventory?: {
    quantity: number;
    min_stock_level: number;
    last_updated: string;
  };
}

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [showLowStock]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory({ low_stock: showLowStock, limit: 1000 });
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (productId: number, adjustment: number) => {
    try {
      await api.adjustInventory(productId, adjustment);
      await loadInventory();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to adjust inventory');
    }
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
          <h1>Inventory</h1>
          <p className="text-muted">Track stock levels and manage inventory</p>
        </div>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`btn ${showLowStock ? 'btn-warning' : 'btn-outline'}`}
        >
          {showLowStock ? '⚠️ Showing Low Stock Only' : '📋 Show All'}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Min Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const isLowStock = item.inventory && item.inventory.quantity <= item.inventory.min_stock_level;
              const stockPercentage = item.inventory
                ? (item.inventory.quantity / (item.inventory.min_stock_level * 2)) * 100
                : 0;

              return (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="badge badge-info">{item.category}</span></td>
                  <td>
                    <div>
                      <strong style={{ fontSize: '1.1rem' }}>{item.inventory?.quantity || 0}</strong> units
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '2px',
                      marginTop: '0.25rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(stockPercentage, 100)}%`,
                        height: '100%',
                        background: isLowStock ? 'var(--warning)' : 'var(--success)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </td>
                  <td>{item.inventory?.min_stock_level || 0}</td>
                  <td>
                    {isLowStock ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">OK</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => handleAdjust(item.id, 10)}
                        className="btn btn-success"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Add 10 units"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleAdjust(item.id, -1)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Remove 1 unit"
                      >
                        -1
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inventory.length === 0 && (
        <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
          <p className="text-muted">
            {showLowStock ? 'No low stock items found!' : 'No inventory data'}
          </p>
        </div>
      )}
    </div>
  );
}
