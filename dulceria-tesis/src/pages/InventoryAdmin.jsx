import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, XCircle, CheckCircle, Edit3 } from 'lucide-react';

export default function InventoryAdmin() {
  const { products, updateStock } = useApp();
  const [editing, setEditing] = useState(null);
  const [newStock, setNewStock] = useState('');

  const saveStock = (id) => {
    const qty = parseInt(newStock);
    if (!isNaN(qty) && qty >= 0) updateStock(id, qty);
    setEditing(null);
  };

  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const ok = products.filter(p => p.stock > p.minStock);

  const Section = ({ title, items, icon: Icon, color, badgeClass }) => (
    <div className="card" style={{ marginBottom: 20 }}>
         <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={18} color={color} />
        <h3 style={{ fontSize: '1rem', color }}>{title}</h3>
        <span className={`badge ${badgeClass}`} style={{ marginLeft: 'auto' }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px' }}><p>Sin productos en esta categoría</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Producto</th><th>Categoría</th><th>Stock Actual</th><th>Mín. Requerido</th><th>Actualizar Stock</th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={p.image && (p.image.startsWith('http') || p.image.startsWith('data:') ? p.image : encodeURI(p.image))}
                          alt={p.name}
                          onError={(e) => { e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23f3eae9'/%3E%3C/text%3E%3C/svg%3E" }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <span className={`badge ${badgeClass}`}>{p.stock} und.</span>
                  </td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>{p.minStock} und.</td>
                  <td>
                    {editing === p.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number" min="0" value={newStock}
                          onChange={e => setNewStock(e.target.value)}
                          style={{ width: 80, padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--pink-400)', fontSize: '0.9rem', outline: 'none' }}
                          autoFocus
                        />
                        <button className="btn btn-success btn-sm" onClick={() => saveStock(p.id)}>✓</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>✕</button>
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(p.id); setNewStock(p.stock); }}>
                        <Edit3 size={13} /> Actualizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1>Inventario</h1><p>Control de stock de productos</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Sin stock', value: outOfStock.length, bg: '#fdecea', color: 'var(--danger)', icon: '🚫' },
          { label: 'Stock bajo', value: lowStock.length, bg: '#fef8e7', color: '#c17d00', icon: '⚠️' },
          { label: 'Stock ok', value: ok.length, bg: '#e8f8f0', color: 'var(--success)', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 'var(--radius-lg)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '2rem' }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '0.83rem', color: s.color, opacity: 0.8 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Section title="Sin Stock — Requieren reposición urgente" items={outOfStock} icon={XCircle} color="var(--danger)" badgeClass="badge-danger" />
      <Section title="Stock Bajo — Por debajo del mínimo" items={lowStock} icon={AlertTriangle} color="#c17d00" badgeClass="badge-warning" />
      <Section title="Stock Normal" items={ok} icon={CheckCircle} color="var(--success)" badgeClass="badge-success" />
    </div>
  );
}
