import { useState } from 'react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import '../../index.css';

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(pin);
      setUser({ authenticated: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '90%' }}>
        <div className="text-center mb-xl">
          <h1 style={{ marginBottom: '0.5rem' }}>🛒 MeStock</h1>
          <p className="text-muted">Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Enter PIN</label>
            <input
              type="password"
              className="input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              autoFocus
              required
              maxLength={10}
            />
          </div>

          {error && (
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !pin}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-md)',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-md)',
          fontSize: '.875rem'
        }}>
          <p style={{ margin: 0, color: 'var(--info)' }}>
            💡 Default PIN: <strong>1234</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
