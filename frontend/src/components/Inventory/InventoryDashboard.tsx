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
    batch_number?: string;
    expiry_date?: string;
  };
}

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null);

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
              <th>Batch #</th>
              <th>Expiry Date</th>
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
              
              // Check expiry status
              const expiryDate = item.inventory?.expiry_date ? new Date(item.inventory.expiry_date) : null;
              const today = new Date();
              const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
              const isExpired = expiryDate && expiryDate < today;
              const isExpiringSoon = expiryDate && !isExpired && expiryDate <= thirtyDaysFromNow;

              return (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="badge badge-info">{item.category}</span></td>
                  <td>
                    {item.inventory?.batch_number ? (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {item.inventory.batch_number}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {expiryDate ? (
                      <span 
                        className={`badge ${isExpired ? 'badge-danger' : isExpiringSoon ? 'badge-warning' : 'badge-success'}`}
                        title={isExpired ? 'Expired!' : isExpiringSoon ? 'Expiring soon!' : 'Valid'}
                      >
                        {expiryDate.toLocaleDateString()}
                        {isExpired && ' ⚠️'}
                        {isExpiringSoon && ' ⏳'}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
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
                    {isExpired ? (
                      <span className="badge badge-danger">Expired</span>
                    ) : isLowStock ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">OK</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="btn btn-primary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit inventory details"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setRestockingItem(item)}
                        className="btn btn-success"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Restock this item"
                      >
                        📦 Restock
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

      {/* Edit Inventory Modal */}
      {editingItem && (
        <EditInventoryModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async () => {
            await loadInventory();
            setEditingItem(null);
          }}
        />
      )}

      {/* Restock Modal */}
      {restockingItem && (
        <RestockModal
          item={restockingItem}
          onClose={() => setRestockingItem(null)}
          onSave={async () => {
            await loadInventory();
            setRestockingItem(null);
          }}
        />
      )}
    </div>
  );
}

// Edit Inventory Modal Component
function EditInventoryModal({ 
  item, 
  onClose, 
  onSave 
}: { 
  item: InventoryItem; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    quantity: item.inventory?.quantity || 0,
    min_stock_level: item.inventory?.min_stock_level || 10,
    batch_number: item.inventory?.batch_number || '',
    expiry_date: item.inventory?.expiry_date || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.updateInventory(item.id, {
        quantity: formData.quantity,
        min_stock_level: formData.min_stock_level,
        batch_number: formData.batch_number || null,
        expiry_date: formData.expiry_date || null
      });
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Inventory: {item.name}</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Update stock levels, batch information, and expiry date
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">Current Quantity *</label>
              <input
                type="number"
                className="input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Min Stock Level *</label>
              <input
                type="number"
                className="input"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Batch Number</label>
            <input
              type="text"
              className="input"
              value={formData.batch_number}
              onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              placeholder="e.g., BATCH-2026-001"
            />
            <small className="text-muted">Enter the batch/lot number for this stock</small>
          </div>

          <div className="input-group">
            <label className="input-label">Expiry Date</label>
            <input
              type="date"
              className="input"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
            <small className="text-muted">When does this stock expire? Leave empty if not applicable</small>
          </div>

          <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Restock Modal Component
function RestockModal({ 
  item, 
  onClose, 
  onSave 
}: { 
  item: InventoryItem; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [quantity, setQuantity] = useState<number>(1);
  const [updateBatchInfo, setUpdateBatchInfo] = useState(false);
  const [batchNumber, setBatchNumber] = useState(item.inventory?.batch_number || '');
  const [expiryDate, setExpiryDate] = useState(item.inventory?.expiry_date || '');
  const [loading, setLoading] = useState(false);

  const currentStock = item.inventory?.quantity || 0;
  const newStock = currentStock + quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      alert('Please enter a quantity greater than 0');
      return;
    }

    setLoading(true);

    try {
      // First, adjust the inventory quantity
      await api.adjustInventory(item.id, quantity);
      
      // If updating batch info, also update those fields
      if (updateBatchInfo) {
        await api.updateInventory(item.id, {
          batch_number: batchNumber || null,
          expiry_date: expiryDate || null
        });
      }
      
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to restock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>📦 Restock: {item.name}</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Add stock units to this product
        </p>
        
        {/* Current Stock Display */}
        <div className="glass-card mb-lg" style={{ padding: '1rem', textAlign: 'center' }}>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Current Stock</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {currentStock} units
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Quantity to Add *</label>
            <input
              type="number"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              required
              autoFocus
              style={{ fontSize: '1.25rem', textAlign: 'center' }}
            />
            <small className="text-muted">Enter the number of units you're adding to stock</small>
          </div>

          {/* New Stock Preview */}
          <div className="glass-card mb-lg" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>New Stock After Restock</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
              {newStock} units
            </div>
          </div>

          {/* Optional: Update Batch Info */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={updateBatchInfo}
                onChange={(e) => setUpdateBatchInfo(e.target.checked)}
              />
              <span>Update batch information with this restock</span>
            </label>
          </div>

          {updateBatchInfo && (
            <div className="grid grid-2" style={{ marginTop: '1rem' }}>
              <div className="input-group">
                <label className="input-label">New Batch Number</label>
                <input
                  type="text"
                  className="input"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g., BATCH-2026-002"
                />
              </div>

              <div className="input-group">
                <label className="input-label">New Expiry Date</label>
                <input
                  type="date"
                  className="input"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading || quantity <= 0}>
              {loading ? 'Restocking...' : `📦 Add ${quantity} Units`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
