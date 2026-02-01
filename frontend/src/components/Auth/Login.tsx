import { useState } from 'react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import '../../index.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, pin);
      setUser({
        authenticated: true,
        user_id: response.user_id,
        username: response.username,
        role: response.role,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or PIN');
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
            <label className="input-label">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">PIN</label>
            <input
              type="password"
              className="input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
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
            disabled={loading || !username || !pin}
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

        <div className="text-center text-muted" style={{ marginTop: 'var(--spacing-lg)', fontSize: '0.75rem' }}>
          Default Admin: admin / 1234
        </div>
      </div>
    </div>
  );
}
