import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList, ChevronDown } from 'lucide-react';
import { STATUS_COLORS, ORDER_STATUSES } from '../data/mockData';

export default function OrdersAdmin() {
  const { orders, updateOrderStatus } = useApp();
  const [filter, setFilter] = useState('todos');
  const [selected, setSelected] = useState(null);

  const filtered = filter === 'todos' ? orders : orders.filter(o => o.status === filter);

  const statusOptions = ['todos', ...ORDER_STATUSES];

  return (
    <div>
      <div className="page-header">
        <div><h1>Pedidos</h1><p>{orders.length} pedidos en total</p></div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {statusOptions.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div className="card">
          <div className="table-container">
            {filtered.length === 0 ? (
              <div className="empty-state"><ClipboardList size={40} /><p>No hay pedidos</p></div>
            ) : (
              <table>
                <thead><tr><th>ID</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer' }}>
                      <td><span style={{ fontWeight: 700, color: 'var(--pink-500)' }}>{o.id}</span></td>
                      <td>{o.clientName}</td>
                      <td style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>{o.items.length} productos</td>
                      <td style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                      <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{o.date}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={o.status}
                          onChange={e => updateOrderStatus(o.id, e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: '0.82rem', background: 'var(--gray-50)', outline: 'none', cursor: 'pointer' }}
                        >
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card" style={{ padding: '24px', height: 'fit-content', position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>{selected.id}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--gray-400)' }}>{selected.date}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Cliente</p>
              <p style={{ fontWeight: 600 }}>{selected.clientName}</p>
            </div>

            {selected.customer && (
              <div style={{ background: '#fef8e7', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18, color: '#7a5a00' }}>
                <p style={{ fontSize: '0.8rem', color: '#9b7d34', marginBottom: 2 }}>Datos personales</p>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{selected.customer.name}</p>
                {selected.customer.phone && <p style={{ fontSize: '0.85rem' }}>Teléfono: {selected.customer.phone}</p>}
                {selected.customer.address && <p style={{ fontSize: '0.85rem' }}>Dirección: {selected.customer.address}</p>}
                {selected.customer.reference && <p style={{ fontSize: '0.85rem' }}>Referencia: {selected.customer.reference}</p>}
              </div>
            )}

            {selected.packaging && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Empaque</p>
                <p style={{ fontWeight: 600 }}>{selected.packaging.emoji} {selected.packaging.nombre}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Capacidad: hasta {selected.packaging.capacidadMax} dulces · ${selected.packaging.precio.toFixed(2)}</p>
              </div>
            )}

            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-400)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Productos</p>
            {selected.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>x{item.qty} × ${item.price.toFixed(2)}</p>
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}

            {selected.notes && (
              <div style={{ background: '#fef8e7', borderRadius: 'var(--radius-sm)', padding: '10px 14px', margin: '14px 0', fontSize: '0.85rem', color: '#7a5a00' }}>
                📝 {selected.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: 8 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pink-500)' }}>${selected.total.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cambiar estado</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ORDER_STATUSES.map(s => (
                  <button key={s} onClick={() => { updateOrderStatus(selected.id, s); setSelected({ ...selected, status: s }); }}
                    style={{ padding: '5px 12px', borderRadius: 99, border: `1.5px solid ${selected.status === s ? 'var(--pink-400)' : 'var(--gray-200)'}`, background: selected.status === s ? 'var(--pink-100)' : 'white', color: selected.status === s ? 'var(--pink-600)' : 'var(--gray-500)', fontSize: '0.8rem', fontWeight: selected.status === s ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
