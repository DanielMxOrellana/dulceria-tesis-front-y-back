import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Package, ShoppingBag, ClipboardList,
  BarChart2, Users, LogOut, Menu, X, Bell, ShoppingCart, ChevronRight
} from 'lucide-react';
import './Layout.css';

const adminNav = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/catalogo', icon: ShoppingBag, label: 'Catálogo' },
  { path: '/admin/productos', icon: Package, label: 'Productos' },
  { path: '/admin/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { path: '/admin/inventario', icon: ShoppingBag, label: 'Inventario' },
  { path: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { path: '/admin/reportes', icon: BarChart2, label: 'Reportes' },
];

const vendorNav = [
  { path: '/vendor', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/vendor/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { path: '/vendor/productos', icon: Package, label: 'Productos' },
  { path: '/vendor/inventario', icon: ShoppingBag, label: 'Inventario' },
  { path: '/vendor/estadisticas', icon: BarChart2, label: 'Estadisticas' },
  { path: '/catalogo', icon: ShoppingBag, label: 'Catálogo' },
];

const clientNav = [
  { path: '/nuevo-pedido/empaque', icon: ShoppingCart, label: 'Nuevo Pedido' },
  { path: '/catalogo', icon: ShoppingBag, label: 'Catálogo' },
  { path: '/mis-pedidos', icon: ClipboardList, label: 'Mis Pedidos' },
];

export default function Layout({ children }) {
  const { currentUser, logout, cartCount, lowStockProducts, products } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isVendor = currentUser?.role === 'vendor';
  const navItems = isAdmin ? adminNav : isVendor ? vendorNav : clientNav;
  const vendorLowStockCount = products.filter(
    (product) => product.vendorId === currentUser?.id && product.stock > 0 && product.stock <= product.minStock
  ).length;

  const isActive = (path) => {
    if (path === '/admin' || path === '/vendor' || path === '/catalogo') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">🍬</span>
          <div>
            <h2>Dulcería El Suspiro</h2>
            <span></span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item ${isActive(path) ? 'nav-item--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Nuevo Pedido' && cartCount > 0 && (
                <span className="nav-badge">{cartCount}</span>
              )}
              {label === 'Inventario' && (isVendor ? vendorLowStockCount : lowStockProducts.length) > 0 && (
                <span className="nav-badge nav-badge--warning">{isVendor ? vendorLowStockCount : lowStockProducts.length}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{currentUser?.name?.[0]}</div>
            <div>
              <p className="user-name">{currentUser?.name}</p>
              <p className="user-role">{isAdmin ? 'Administrador' : isVendor ? 'Vendedor' : 'Cliente'}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="topbar-right">
            {isAdmin && lowStockProducts.length > 0 && (
              <div className="notification-bell">
                <Bell size={20} />
                <span className="notif-dot">{lowStockProducts.length}</span>
              </div>
            )}
            {!isAdmin && !isVendor && (
              <Link to="/nuevo-pedido/empaque" className="cart-icon" title="Nuevo pedido">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="notif-dot">{cartCount}</span>}
              </Link>
            )}
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
