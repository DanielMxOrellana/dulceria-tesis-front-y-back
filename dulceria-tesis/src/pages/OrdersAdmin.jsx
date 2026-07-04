import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { STATUS_COLORS } from '../data/mockData';

export default function OrdersAdmin() {
  const { orders, updateOrderStatus } = useApp();
  const [filter, setFilter] = useState('todos');
  const [selected, setSelected] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);

  const filtered = filter === 'todos' ? orders : orders.filter(o => o.status === filter);

  const liveSelected = selected ? (orders.find(o => o.id === selected.id) || selected) : null;

  const statusOptions = ['todos', 'aceptado', 'rechazado'];

  const advanceOrder = (order, status) => updateOrderStatus(order.id, status);

  const confirmReject = () => {
    if (!rejectConfirm) return;
    updateOrderStatus(rejectConfirm.id, 'rechazado');
    setRejectConfirm(null);
  };

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
                <thead><tr><th>ID</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer' }}>
                      <td><span style={{ fontWeight: 700, color: 'var(--pink-500)' }}>{o.id}</span></td>
                      <td>{o.clientName}</td>
                      <td style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>{o.items.length} productos</td>
                      <td style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                      <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {liveSelected && (
          <div className="card" style={{ padding: '24px', height: 'fit-content', position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>{liveSelected.id}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--gray-400)' }}>{liveSelected.date}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <span className={`badge ${STATUS_COLORS[liveSelected.status] || 'badge-gray'}`}>{liveSelected.status}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {liveSelected.status === 'pendiente' && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => advanceOrder(liveSelected, 'aceptado')}>
                    <CheckCircle2 size={14} /> Aceptar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setRejectConfirm(liveSelected)}>
                    <XCircle size={14} /> Rechazar
                  </button>
                </>
              )}
              {liveSelected.status === 'aceptado' && (
                <button className="btn btn-primary btn-sm" onClick={() => advanceOrder(liveSelected, 'en preparacion')}>
                  🍳 Preparar
                </button>
              )}
              {liveSelected.status === 'en preparacion' && (
                <button className="btn btn-primary btn-sm" onClick={() => advanceOrder(liveSelected, 'listo')}>
                  ✅ Listo
                </button>
              )}
              {liveSelected.status === 'listo' && (
                <button className="btn btn-success btn-sm" onClick={() => advanceOrder(liveSelected, 'entregado')}>
                  <Truck size={14} /> Entregar
                </button>
              )}
            </div>

            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Cliente</p>
              <p style={{ fontWeight: 600 }}>{liveSelected.clientName}</p>
            </div>

            {liveSelected.customer && (
              <div style={{ background: '#fef8e7', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18, color: '#7a5a00' }}>
                <p style={{ fontSize: '0.8rem', color: '#9b7d34', marginBottom: 2 }}>Datos personales</p>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{liveSelected.customer.name}</p>
                {liveSelected.customer.phone && <p style={{ fontSize: '0.85rem' }}>Teléfono: {liveSelected.customer.phone}</p>}
                {liveSelected.customer.address && <p style={{ fontSize: '0.85rem' }}>Dirección: {liveSelected.customer.address}</p>}
                {liveSelected.customer.reference && <p style={{ fontSize: '0.85rem' }}>Referencia: {liveSelected.customer.reference}</p>}
              </div>
            )}

            {liveSelected.packaging && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Empaque</p>
                <p style={{ fontWeight: 600 }}>{liveSelected.packaging.emoji} {liveSelected.packaging.nombre}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Incluye hasta ${liveSelected.packaging.precio.toFixed(2)} en dulces</p>
              </div>
            )}

            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-400)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Productos</p>
            {liveSelected.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>x{item.qty} × ${item.price.toFixed(2)}</p>
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}

            {liveSelected.notes && (
              <div style={{ background: '#fef8e7', borderRadius: 'var(--radius-sm)', padding: '10px 14px', margin: '14px 0', fontSize: '0.85rem', color: '#7a5a00' }}>
                📝 {liveSelected.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: 8 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pink-500)' }}>${liveSelected.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reject Confirm */}
      {rejectConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>¿Rechazar pedido?</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginBottom: 24 }}>Se repondrá el stock reservado de este pedido.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setRejectConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmReject}>Rechazar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
