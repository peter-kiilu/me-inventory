/**
 * Sync Service
 * Handles syncing offline transactions when connection is restored
 */
import { api } from './api';
import { offlineDB } from './db';

class SyncService {
  private isSyncing = false;
  private syncCallbacks: Array<(status: 'syncing' | 'success' | 'error') => void> = [];

  /**
   * Register a callback to be notified of sync status changes
   */
  onSyncStatusChange(callback: (status: 'syncing' | 'success' | 'error') => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyCallbacks(status: 'syncing' | 'success' | 'error') {
    this.syncCallbacks.forEach(cb => cb(status));
  }

  /**
   * Sync all pending sales to the server
   */
  async syncPendingSales() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.notifyCallbacks('syncing');

    try {
      const pendingSales = await offlineDB.getPendingSales('pending');
      
      if (pendingSales.length === 0) {
        console.log('No pending sales to sync');
        this.isSyncing = false;
        this.notifyCallbacks('success');
        return;
      }

      console.log(`Syncing ${pendingSales.length} pending sales...`);

      let successCount = 0;
      let errorCount = 0;

      // Sync each sale in chronological order
      for (const sale of pendingSales) {
        try {
          // Update status to syncing
          await offlineDB.updatePendingSale(sale.id, { status: 'syncing' });

          // Send to server
          await api.createSale({ items: sale.items });

          // Remove from pending queue
          await offlineDB.deletePendingSale(sale.id);
          successCount++;
          
          console.log(`✓ Synced sale ${sale.id}`);
        } catch (error: any) {
          console.error(`✗ Failed to sync sale ${sale.id}:`, error);
          
          // Mark as failed
          await offlineDB.updatePendingSale(sale.id, {
            status: 'failed',
            error: error.response?.data?.detail || error.message
          });
          errorCount++;
        }
      }

      console.log(`Sync complete. Success: ${successCount}, Failed: ${errorCount}`);
      
      if (errorCount === 0) {
        this.notifyCallbacks('success');
      } else {
        this.notifyCallbacks('error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyCallbacks('error');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Refresh local product cache from server
   */
  async refreshProductCache() {
    try {
      const products = await api.getProducts({ limit: 1000 });
      await offlineDB.saveProducts(products);
      console.log(`Cached ${products.length} products offline`);
    } catch (error) {
      console.error('Failed to refresh product cache:', error);
    }
  }

  /**
   * Full sync: refresh cache and sync pending sales
   */
  async fullSync() {
    await this.refreshProductCache();
    await this.syncPendingSales();
  }

  /**
   * Check if there are pending sales
   */
  async hasPendingSales(): Promise<boolean> {
    const pending = await offlineDB.getPendingSales('pending');
    return pending.length > 0;
  }

  /**
   * Get count of pending sales
   */
  async getPendingSalesCount(): Promise<number> {
    const pending = await offlineDB.getPendingSales('pending');
    return pending.length;
  }
}

export const syncService = new SyncService();
export default syncService;
