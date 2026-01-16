import  { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { syncService } from './services/sync';
import { offlineDB } from './services/db';
import { api } from './services/api';

// Components
import Login from './components/Auth/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ProductList from './components/Products/ProductList';
import InventoryDashboard from './components/Inventory/InventoryDashboard';
import SaleForm from './components/Sales/SaleForm';
import SalesHistory from './components/Sales/SalesHistory';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';

import './index.css';

function App() {
  const { user, setUser, setOnline, setPendingSyncCount } = useStore();

  useEffect(() => {
    // Check authentication
    if (api.isAuthenticated()) {
      setUser({ authenticated: true });
    }

    // Initialize offline DB
    offlineDB.init();

    // Network status monitoring
    const handleOnline = () => {
      console.log('📶 Back online');
      setOnline(true);
      // Auto-sync when back online
      syncService.fullSync();
    };

    const handleOffline = () => {
      console.log('📵 Went offline');
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync status monitoring
    const unsubscribe = syncService.onSyncStatusChange((status) => {
      console.log('Sync status:', status);
    });

    // Update pending count
    const updatePendingCount = async () => {
      const count = await syncService.getPendingSalesCount();
      setPendingSyncCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, [setUser, setOnline, setPendingSyncCount]);

  if (!user.authenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/sales" element={<SaleForm />} />
          <Route path="/sales/history" element={<SalesHistory />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
