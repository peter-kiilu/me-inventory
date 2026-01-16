import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  barcode?: string;
  inventory?: {
    quantity: number;
    min_stock_level: number;
  };
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts({ limit: 1000 });
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const filteredProducts = filterCategory
    ? products.filter(p => p.category === filterCategory)
    : products;

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
          <h1>Products</h1>
          <p className="text-muted">Manage your product catalog</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          ➕ Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card mb-lg">
        <div className="flex gap-md" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="input-label" style={{ margin: 0 }}>Filter by Category:</label>
          <select
            className="select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ 
              maxWidth: '200px', 
              background: 'var(--bg-primary)', 
              color: 'white',
              border: '1px solid var(--glass-border)'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'white' }}>All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} style={{ background: 'var(--bg-secondary)', color: 'white' }}>{cat}</option>
            ))}
          </select>
          {filterCategory && (
            <button onClick={() => setFilterCategory('')} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Barcode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  {product.description && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {product.description}
                    </div>
                  )}
                </td>
                <td><span className="badge badge-info">{product.category}</span></td>
                <td>KSH {product.price.toFixed(0)}</td>
                <td>
                  {product.inventory && (
                    <span className={`badge ${product.inventory.quantity <= product.inventory.min_stock_level ? 'badge-warning' : 'badge-success'}`}>
                      {product.inventory.quantity} units
                    </span>
                  )}
                </td>
                <td>{product.barcode || '-'}</td>
                <td>
                  <div className="flex gap-sm">
                    <button
                      onClick={() => { setEditingProduct(product); setShowForm(true); }}
                      className="btn btn-primary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
          <p className="text-muted">No products found</p>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSave={async () => {
            await loadProducts();
            await loadCategories();
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Product Form Component
function ProductForm({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    price: product?.price || 0,
    barcode: product?.barcode || '',
    initial_quantity: product?.inventory?.quantity || 0,
    min_stock_level: product?.inventory?.min_stock_level || 10
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product) {
        await api.updateProduct(product.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          barcode: formData.barcode
        });
      } else {
        await api.createProduct(formData);
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Product Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">Category *</label>
              <input
                type="text"
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Price *</label>
              <input
                type="number"
                className="input"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Barcode</label>
            <input
              type="text"
              className="input"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </div>

          {!product && (
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Initial Quantity</label>
                <input
                  type="number"
                  className="input"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({ ...formData, initial_quantity: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Min Stock Level</label>
                <input
                  type="number"
                  className="input"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
            </div>
          )}

          <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
