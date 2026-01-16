/**
 * Global State Management with Zustand
 */
import { create } from 'zustand';

interface User {
  authenticated: boolean;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  barcode?: string;
  created_at: string;
  updated_at: string;
  inventory?: {
    quantity: number;
    min_stock_level: number;
  };
}

interface AppState {
  // Auth
  user: User;
  setUser: (user: User) => void;
  logout: () => void;

  // Network status
  isOnline: boolean;
  setOnline: (status: boolean) => void;

  // Pending sync count
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;

  // Products cache
  products: Product[];
  setProducts: (products: Product[]) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: { authenticated: false },
  setUser: (user) => set({ user }),
  logout: () => {
    set({ user: { authenticated: false } });
    localStorage.removeItem('token');
  },

  // Network
  isOnline: navigator.onLine,
  setOnline: (status) => set({ isOnline: status }),

  // Sync
  pendingSyncCount: 0,
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),

  // Products
  products: [],
  setProducts: (products) => set({ products }),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
