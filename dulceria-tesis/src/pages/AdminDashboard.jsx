import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Package, ClipboardList, Users, AlertTriangle, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { STATUS_COLORS } from '../data/mockData';

export default function AdminDashboard() {
  const { products, orders, users, lowStockProducts, outOfStockProducts } = useApp();

  const pending = orders.filter(o => o.status === 'pendiente').length;
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.date === today);
  const totalRevenue = orders.filter(o => o.status === 'entregado').reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: 'Productos', value: products.length, icon: Package, color: '#eaf4fd', iconColor: '#1a7abc', to: '/admin/productos' },
    { label: 'Pedidos Hoy', value: todayOrders.length, icon: ClipboardList, color: '#fef8e7', iconColor: '#c17d00', to: '/admin/pedidos' },
    { label: 'Clientes', value: users.filter(u => u.role === 'cliente').length, icon: Users, color: '#e8f8f0', iconColor: '#1a9b56', to: '/admin/usuarios' },
    { label: 'Ingresos', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: '#D6E8EC', iconColor: '#1E4F5C', to: '/admin/reportes' },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen del negocio</p>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lowStockProducts.length > 0 && (
            <div style={{ background: '#fef8e7', border: '1px solid #fdeab3', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#c17d00' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: '0.9rem' }}><strong>{lowStockProducts.length} producto(s)</strong> con stock bajo: {lowStockProducts.map(p => p.name).join(', ')}</span>
            </div>
          )}
          {outOfStockProducts.length > 0 && (
            <div style={{ background: '#fdecea', border: '1px solid #f5c2be', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#c0392b' }}>
              <XCircle size={18} />
              <span style={{ fontSize: '0.9rem' }}><strong>{outOfStockProducts.length} producto(s)</strong> sin stock: {outOfStockProducts.map(p => p.name).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <Link to={s.to} key={s.label} className="stat-card" style={{ textDecoration: 'none' }}>
            <div className="stat-icon" style={{ background: s.color }}>
              <s.icon size={22} color={s.iconColor} />
            </div>
            <div className="stat-info">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Recent orders */}
        <div className="card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Pedidos Recientes</h3>
            <Link to="/admin/pedidos" className="btn btn-secondary btn-sm">Ver todos</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontWeight: 600, color: 'var(--pink-500)' }}>{o.id}</span></td>
                    <td>{o.clientName}</td>
                    <td>${o.total.toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Acción requerida</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'var(--pink-100)', borderRadius: 'var(--radius-md)' }}>
                <Clock size={18} color="var(--pink-500)" />
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--pink-600)' }}>{pending} pedidos pendientes</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Esperando revisión</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: '#fdecea', borderRadius: 'var(--radius-md)' }}>
                <AlertTriangle size={18} color="var(--danger)" />
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--danger)' }}>{outOfStockProducts.length} sin stock</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Requieren reposición</p>
                </div>
              </div>
            </div>
            <Link to="/admin/pedidos" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
              Gestionar pedidos
            </Link>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Top Productos</h3>
            {products.slice(0, 4).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={p.image && (p.image.startsWith('http') || p.image.startsWith('data:') ? p.image : encodeURI(p.image))}
                    alt={p.name}
                    onError={(e) => { e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23f3eae9'/%3E%3C/text%3E%3C/svg%3E" }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Stock: {p.stock}</p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--pink-500)' }}>${p.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
