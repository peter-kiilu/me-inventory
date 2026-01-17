/**
 * IndexedDB Service for Offline Storage
 * Stores products, inventory, and pending sales offline
 */
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

// Database schema types
interface MeStockDB extends DBSchema {
  products: {
    key: number;
    value: {
      id: number;
      name: string;
      description?: string;
      category: string;
      price: number;
      barcode?: string;
      created_at: string;
      updated_at: string;
      inventory?: {
        id: number;
        product_id: number;
        quantity: number;
        min_stock_level: number;
        last_updated: string;
      };
    };
    indexes: { 'by-category': string };
  };
  pendingSales: {
    key: string; // UUID
    value: {
      id: string;
      items: Array<{ product_id: number; quantity: number }>;
      sale_date: string;
      status: 'pending' | 'syncing' | 'failed';
      created_at: string;
      error?: string;
    };
    indexes: { 'by-status': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'mestock-db';
const DB_VERSION = 1;

class OfflineDB {
  private db: IDBPDatabase<MeStockDB> | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<MeStockDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-category', 'category');
        }

        // Pending sales store
        if (!db.objectStoreNames.contains('pendingSales')) {
          const salesStore = db.createObjectStore('pendingSales', { keyPath: 'id' });
          salesStore.createIndex('by-status', 'status');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });

    return this.db;
  }

  // Products
  async saveProducts(products: any[]) {
    const db = await this.init();
    const tx = db.transaction('products', 'readwrite');
    await Promise.all(products.map(product => tx.store.put(product)));
    await tx.done;
  }

  async getProducts() {
    const db = await this.init();
    return await db.getAll('products');
  }

  async getProduct(id: number) {
    const db = await this.init();
    return await db.get('products', id);
  }

  async getProductsByCategory(category: string) {
    const db = await this.init();
    return await db.getAllFromIndex('products', 'by-category', category);
  }

  async clearProducts() {
    const db = await this.init();
    const tx = db.transaction('products', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  // Pending Sales
  async addPendingSale(sale: {
    items: Array<{ product_id: number; quantity: number }>;
  }) {
    const db = await this.init();
    const id = crypto.randomUUID();
    const pendingSale = {
      id,
      items: sale.items,
      sale_date: new Date().toISOString(),
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    };
    await db.add('pendingSales', pendingSale);
    return pendingSale;
  }

  async getPendingSales(status?: 'pending' | 'syncing' | 'failed') {
    const db = await this.init();
    if (status) {
      return await db.getAllFromIndex('pendingSales', 'by-status', status);
    }
    return await db.getAll('pendingSales');
  }

  async updatePendingSale(id: string, updates: Partial<MeStockDB['pendingSales']['value']>) {
    const db = await this.init();
    const sale = await db.get('pendingSales', id);
    if (sale) {
      await db.put('pendingSales', { ...sale, ...updates });
    }
  }

  async deletePendingSale(id: string) {
    const db = await this.init();
    await db.delete('pendingSales', id);
  }

  async clearPendingSales() {
    const db = await this.init();
    const tx = db.transaction('pendingSales', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  // Settings
  async getSetting(key: string) {
    const db = await this.init();
    return await db.get('settings', key);
  }

  async setSetting(key: string, value: any) {
    const db = await this.init();
    await db.put('settings', value, key);
  }

  // General
  async clear() {
    await this.init();
    await this.clearProducts();
    await this.clearPendingSales();
  }
}

export const offlineDB = new OfflineDB();
export default offlineDB;
