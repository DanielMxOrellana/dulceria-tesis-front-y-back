import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlertTriangle, XCircle, CheckCircle, Edit3, FileText } from 'lucide-react';

export default function InventoryAdmin() {
  const { products, updateStock } = useApp();
  const [editing, setEditing] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [error, setError] = useState('');

  const saveStock = async (id) => {
    const qty = parseInt(newStock);
    if (isNaN(qty) || qty < 0) {
      setError('Ingresa una cantidad valida.');
      return;
    }
    if (!stockNote.trim()) {
      setError('La nota es obligatoria para actualizar stock.');
      return;
    }
    const result = await updateStock(id, qty, stockNote);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditing(null);
    setNewStock('');
    setStockNote('');
    setError('');
  };

  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const ok = products.filter(p => p.stock > p.minStock);

  const renderSection = ({ title, items, icon: Icon, color, badgeClass }) => (
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
                      <div style={{ display: 'grid', gap: 6, minWidth: 220 }}>
                        <input
                          type="number" min="0" value={newStock}
                          onChange={e => setNewStock(e.target.value)}
                          style={{ width: 80, padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--pink-400)', fontSize: '0.9rem', outline: 'none' }}
                          autoFocus
                        />
                        <textarea
                          value={stockNote}
                          onChange={e => setStockNote(e.target.value)}
                          placeholder="Nota del movimiento"
                          rows={2}
                          style={{ padding: '7px 9px', borderRadius: 8, border: '1.5px solid var(--gray-200)', fontSize: '0.85rem', resize: 'vertical' }}
                        />
                        <button className="btn btn-success btn-sm" onClick={() => saveStock(p.id)}>Guardar</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(null); setStockNote(''); setError(''); }}>Cancelar</button>
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(p.id); setNewStock(p.stock); setStockNote(''); setError(''); }}>
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
        <Link to="/admin/inventario/logs" className="btn btn-secondary"><FileText size={16} /> Ver logs</Link>
      </div>

      {error && <div className="card" style={{ padding: 14, marginBottom: 18, color: 'var(--danger)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Sin stock', value: outOfStock.length, bg: '#fdecea', color: 'var(--danger)', icon: XCircle },
          { label: 'Stock bajo', value: lowStock.length, bg: '#fef8e7', color: '#c17d00', icon: AlertTriangle },
          { label: 'Stock ok', value: ok.length, bg: '#e8f8f0', color: 'var(--success)', icon: CheckCircle },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 'var(--radius-lg)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <s.icon size={28} color={s.color} />
            <div>
              <p style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '0.83rem', color: s.color, opacity: 0.8 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {renderSection({ title: "Sin Stock — Requieren reposición urgente", items: outOfStock, icon: XCircle, color: "var(--danger)", badgeClass: "badge-danger" })}
      {renderSection({ title: "Stock Bajo — Por debajo del mínimo", items: lowStock, icon: AlertTriangle, color: "#c17d00", badgeClass: "badge-warning" })}
      {renderSection({ title: "Stock Normal", items: ok, icon: CheckCircle, color: "var(--success)", badgeClass: "badge-success" })}
    </div>
  );
}
