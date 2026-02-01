import { useEffect } from 'react';
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
import UserManagement from './components/Users/UserManagement';

import './index.css';

// Protected route wrapper for admin-only pages
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { user, setUser, setOnline, setPendingSyncCount, isAdmin } = useStore();

  useEffect(() => {
    // Check authentication and load user info
    if (api.isAuthenticated()) {
      const userInfo = api.getUserInfo();
      if (userInfo) {
        setUser({
          authenticated: true,
          user_id: userInfo.user_id,
          username: userInfo.username,
          role: userInfo.role,
        });
      } else {
        setUser({ authenticated: true });
      }
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
          {/* Admin gets full dashboard, Staff gets simple sales page */}
          <Route path="/" element={isAdmin() ? <Dashboard /> : <SaleForm />} />
          
          {/* Admin-only routes */}
          <Route path="/products" element={
            <AdminRoute><ProductList /></AdminRoute>
          } />
          <Route path="/inventory" element={
            <AdminRoute><InventoryDashboard /></AdminRoute>
          } />
          <Route path="/sales/history" element={
            <AdminRoute><SalesHistory /></AdminRoute>
          } />
          <Route path="/analytics" element={
            <AdminRoute><AnalyticsDashboard /></AdminRoute>
          } />
          <Route path="/users" element={
            <AdminRoute><UserManagement /></AdminRoute>
          } />
          
          {/* Accessible to all authenticated users */}
          <Route path="/sales" element={<SaleForm />} />
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
