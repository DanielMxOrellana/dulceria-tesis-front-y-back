import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import AuthPage from './components/auth/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import ProductsAdmin from './pages/ProductsAdmin';
import OrdersAdmin from './pages/OrdersAdmin';
import InventoryAdmin from './pages/InventoryAdmin';
import UsersAdmin from './pages/UsersAdmin';
import ReportsAdmin from './pages/ReportsAdmin';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import NewOrderPage from './pages/NewOrderPage';
import NewOrderPackagingPage from './pages/NewOrderPackagingPage';
import NewOrderProductsPage from './pages/NewOrderProductsPage';
import NewOrderCustomerPage from './pages/NewOrderCustomerPage';
import MyOrdersPage from './pages/MyOrdersPage';
import VendorDashboard from './pages/VendorDashboard';

const getHomeRoute = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'vendor') return '/vendor';
  return '/catalogo';
};

function ProtectedRoute({ children, role }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/auth" replace />;
  if (role && currentUser.role !== role) return <Navigate to={getHomeRoute(currentUser.role)} replace />;
  return children;
}

function AppRoutes() {
  const { currentUser } = useApp();
  const canViewCatalog = ['admin', 'vendor', 'cliente'].includes(currentUser?.role);

  return (
    <Routes>
      <Route path="/auth" element={currentUser ? <Navigate to={getHomeRoute(currentUser.role)} replace /> : <AuthPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/productos" element={<ProtectedRoute role="admin"><Layout><ProductsAdmin /></Layout></ProtectedRoute>} />
      <Route path="/admin/pedidos" element={<ProtectedRoute role="admin"><Layout><OrdersAdmin /></Layout></ProtectedRoute>} />
      <Route path="/admin/inventario" element={<ProtectedRoute role="admin"><Layout><InventoryAdmin /></Layout></ProtectedRoute>} />
      <Route path="/admin/usuarios" element={<ProtectedRoute role="admin"><Layout><UsersAdmin /></Layout></ProtectedRoute>} />
      <Route path="/admin/reportes" element={<ProtectedRoute role="admin"><Layout><ReportsAdmin /></Layout></ProtectedRoute>} />

      {/* Client routes */}
      <Route path="/catalogo" element={<ProtectedRoute><Layout><CatalogPage /></Layout></ProtectedRoute>} />
      <Route path="/nuevo-pedido" element={<ProtectedRoute role="cliente"><Layout><NewOrderPage /></Layout></ProtectedRoute>} />
      <Route path="/nuevo-pedido/empaque" element={<ProtectedRoute role="cliente"><Layout><NewOrderPackagingPage /></Layout></ProtectedRoute>} />
      <Route path="/nuevo-pedido/productos" element={<ProtectedRoute role="cliente"><Layout><NewOrderProductsPage /></Layout></ProtectedRoute>} />
      <Route path="/nuevo-pedido/datos" element={<ProtectedRoute role="cliente"><Layout><NewOrderCustomerPage /></Layout></ProtectedRoute>} />
      <Route path="/carrito" element={<ProtectedRoute role="cliente"><Layout><CartPage /></Layout></ProtectedRoute>} />
      <Route path="/mis-pedidos" element={<ProtectedRoute role="cliente"><Layout><MyOrdersPage /></Layout></ProtectedRoute>} />

      {/* Vendor routes */}
      <Route path="/vendor" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard section="dashboard" /></Layout></ProtectedRoute>} />
      <Route path="/vendor/pedidos" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard section="pedidos" /></Layout></ProtectedRoute>} />
      <Route path="/vendor/productos" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard section="productos" /></Layout></ProtectedRoute>} />
      <Route path="/vendor/inventario" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard section="inventario" /></Layout></ProtectedRoute>} />
      <Route path="/vendor/estadisticas" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard section="estadisticas" /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={currentUser ? getHomeRoute(currentUser.role) : '/auth'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
