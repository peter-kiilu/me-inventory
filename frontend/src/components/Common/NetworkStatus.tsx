import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { syncService } from '../../services/sync';

export default function NetworkStatus() {
  const { isOnline, pendingSyncCount } = useStore();

  useEffect(() => {
    // Try to sync when coming online
    if (isOnline && pendingSyncCount > 0) {
      syncService.syncPendingSales();
    }
  }, [isOnline, pendingSyncCount]);

  const handleManualSync = () => {
    if (isOnline) {
      syncService.fullSync();
    }
  };

  return (
    <div className="flex gap-sm" style={{ alignItems: 'center' }}>
      {/* Online/Offline indicator */}
      <div className="flex gap-sm" style={{ alignItems: 'center' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isOnline ? 'var(--success)' : 'var(--error)',
          boxShadow: isOnline ? '0 0 8px var(--success)' : '0 0 8px var(--error)'
        }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Pending sync count */}
      {pendingSyncCount > 0 && (
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <span className="badge badge-warning">
            {pendingSyncCount} pending
          </span>
          {isOnline && (
            <button
              onClick={handleManualSync}
              className="btn btn-primary"
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem'
              }}
              title="Sync now"
            >
              Sync Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
