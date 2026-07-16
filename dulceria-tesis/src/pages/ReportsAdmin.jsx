import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, DollarSign, ClipboardList, CheckCircle2 } from 'lucide-react';

const PLACEHOLDER_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23f3eae9'/%3E%3C/svg%3E";

const COLORS = ['#2E6B7A', '#4A8FA0', '#1E4F5C', '#8DBCC7', '#D6E8EC', '#B8D6DD'];

export default function ReportsAdmin() {
  const { orders, products } = useApp();

  // Sales by status
  const statusData = ['pendiente', 'aceptado', 'en preparacion', 'listo', 'entregado', 'rechazado'].map(s => ({
    name: s,
    total: orders.filter(o => o.status === s).reduce((sum, o) => sum + o.total, 0),
    count: orders.filter(o => o.status === s).length,
  }));

  // Top products
  const productSales = {};
  orders.forEach(o => {
    if (o.status !== 'rechazado') {
      o.items.forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + item.qty;
      });
    }
  });
  const topProducts = Object.entries(productSales)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // Revenue by day
  const revenueByDay = {};
  orders.filter(o => o.status === 'entregado').forEach(o => {
    revenueByDay[o.date] = (revenueByDay[o.date] || 0) + o.total;
  });
  const revenueData = Object.entries(revenueByDay).map(([date, total]) => ({ date, total: parseFloat(total.toFixed(2)) })).sort((a, b) => a.date.localeCompare(b.date));

  const totalRevenue = orders.filter(o => o.status === 'entregado').reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'entregado').length;

  return (
    <div>
      <div className="page-header">
        <div><h1>Reportes</h1><p>Análisis del negocio</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Ingresos totales', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
          { label: 'Total pedidos', value: totalOrders, icon: ClipboardList },
          { label: 'Pedidos entregados', value: deliveredOrders, icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--pink-100)', color: 'var(--pink-600)', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={22} /></div>
            <div className="stat-info">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Ingresos por día</h3>
          {revenueData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}><p>Sin datos de ingresos aún</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`$${v}`, 'Ingresos']} />
                <Bar dataKey="total" fill="var(--pink-500)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Pedidos por estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData.filter(d => d.count > 0)} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, count }) => `${name}: ${count}`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Productos más vendidos</h3>
        {topProducts.length === 0 ? (
          <div className="empty-state"><p>Sin ventas registradas aún</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {topProducts.map((p, i) => {
              const product = products.find(pr => pr.name === p.name);
              const image = product?.image;
              const src = image && (image.startsWith('http') || image.startsWith('data:') ? image : encodeURI(image));
              return (
                <div key={p.name} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {src ? (
                      <img
                        src={src}
                        alt={p.name}
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <Package size={20} color="var(--gray-400)" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ color: 'var(--pink-500)', fontWeight: 700, fontSize: '0.85rem' }}>{p.qty} vendidos</p>
                  </div>
                  <span style={{ marginLeft: 'auto', flexShrink: 0, width: 26, height: 26, background: i < 3 ? 'var(--pink-500)' : 'var(--gray-200)', color: i < 3 ? 'white' : 'var(--gray-400)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>#{i+1}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
