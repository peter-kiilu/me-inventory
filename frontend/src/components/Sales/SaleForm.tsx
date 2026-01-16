import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { offlineDB } from '../../services/db';
import { useStore } from '../../store/useStore';

interface Product {
  id: number;
  name: string;
  price: number;
  inventory?: {
    quantity: number;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function SaleForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isOnline = useStore(state => state.isOnline);

  useEffect(() => {
    loadProducts();
  }, [isOnline]);

  const loadProducts = async () => {
    try {
      if (isOnline) {
        const data = await api.getProducts({ limit: 1000 });
        setProducts(data);
        await offlineDB.saveProducts(data);
      } else {
        const data = await offlineDB.getProducts();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      // Try offline cache if online request fails
      const data = await offlineDB.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    // Check stock availability
    for (const item of cart) {
      if (item.product.inventory && item.product.inventory.quantity < item.quantity) {
        alert(`Insufficient stock for ${item.product.name}. Available: ${item.product.inventory.quantity}`);
        return;
      }
    }

    setSubmitting(true);

    const saleData = {
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      if (isOnline) {
        // Online: send to server
        await api.createSale(saleData);
        alert('✅ Sale completed successfully!');
      } else {
        // Offline: save to pending queue
        await offlineDB.addPendingSale(saleData);
        alert('✅ Sale saved offline. Will sync when connection is restored.');
      }

      // Clear cart and reload products
      setCart([]);
      await loadProducts();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to process sale';
      alert(`❌ ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <div>
      <h1>New Sale</h1>
      <p className="text-muted mb-lg">Select products to create a sale transaction</p>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Product Selection */}
        <div>
          <div className="glass-card mb-lg">
            <input
              type="text"
              className="input"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredProducts.map(product => (
              <div key={product.id} className="glass-card" style={{ cursor: 'pointer' }} onClick={() => addToCart(product)}>
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <strong>{product.name}</strong>
                </div>
                <div style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: 'var(--spacing-sm)' }}>
                  KSH {product.price.toFixed(0)}
                </div>
                {product.inventory && (
                  <div style={{ fontSize: '0.875rem' }}>
                    <span className={`badge ${product.inventory.quantity <= 10 ? 'badge-warning' : 'badge-success'}`}>
                      {product.inventory.quantity} in stock
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div>
          <div className="glass-card" style={{ position: 'sticky', top: '1rem' }}>
            <h3 className="mb-lg">Cart ({cart.length} items)</h3>

            {cart.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: 'var(--spacing-xl) 0' }}>
                Cart is empty
              </p>
            ) : (
              <>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 'var(--spacing-lg)' }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{
                      padding: 'var(--spacing-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--spacing-sm)'
                    }}>
                      <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <strong>{item.product.name}</strong>
                      </div>
                      <div className="flex-between" style={{ fontSize: '0.875rem' }}>
                        <div className="flex gap-sm">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, item.quantity - 1); }}
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-tertiary)' }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            className="input"
                            value={item.quantity}
                            min="1"
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                            style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, item.quantity + 1); }}
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-tertiary)' }}
                          >
                            +
                          </button>
                        </div>
                        <strong>KSH {(item.product.price * item.quantity).toFixed(0)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: 'var(--spacing-lg)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <div className="flex-between" style={{ fontSize: '1.5rem' }}>
                    <strong>Total:</strong>
                    <strong style={{ color: 'var(--primary)' }}>KSH {calculateTotal().toFixed(0)}</strong>
                  </div>
                </div>

                <div className="flex gap-sm" style={{ flexDirection: 'column' }}>
                  <button
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ width: '100%' }}
                  >
                    {submitting ? 'Processing...' : isOnline ? '💳 Complete Sale' : '💾 Save Offline'}
                  </button>
                  <button
                    onClick={() => setCart([])}
                    className="btn btn-outline"
                    disabled={submitting}
                    style={{ width: '100%' }}
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
