import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'staff';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.deleteUser(id);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.updateUser(user.id, { is_active: user.is_active === 1 ? 0 : 1 });
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update user');
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
          <h1>User Management</h1>
          <p className="text-muted">Manage staff accounts and permissions</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          ➕ Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.username}</strong></td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.is_active === 1 ? 'badge-success' : 'badge-error'}`}>
                    {user.is_active === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-sm">
                    <button
                      onClick={() => { setEditingUser(user); setShowForm(true); }}
                      className="btn btn-primary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      {user.is_active === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
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

      {users.length === 0 && (
        <div className="text-center" style={{ padding: 'var(--spacing-xl)' }}>
          <p className="text-muted">No users found</p>
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
          onSave={async () => {
            await loadUsers();
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

// User Form Component
function UserForm({ user, onClose, onSave }: { user: User | null; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    pin: '',
    role: user?.role || 'staff',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          role: formData.role,
        };
        if (formData.pin) {
          updateData.pin = formData.pin;
        }
        await api.updateUser(user.id, updateData);
      } else {
        // Create new user
        await api.createUser(formData);
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{user ? 'Edit User' : 'New User'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username *</label>
            <input
              type="text"
              className="input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              {user ? 'New PIN (leave blank to keep current)' : 'PIN *'}
            </label>
            <input
              type="password"
              className="input"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              required={!user}
              minLength={4}
              maxLength={10}
              placeholder="4-10 digit PIN"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Role *</label>
            <select
              className="select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
              style={{ 
                background: 'var(--bg-primary)', 
                color: 'white',
                border: '1px solid var(--glass-border)'
              }}
            >
              <option value="staff" style={{ background: 'var(--bg-secondary)', color: 'white' }}>Staff</option>
              <option value="admin" style={{ background: 'var(--bg-secondary)', color: 'white' }}>Admin</option>
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <strong>Staff:</strong> Can only make sales. <strong>Admin:</strong> Full access.
            </p>
          </div>

          <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
