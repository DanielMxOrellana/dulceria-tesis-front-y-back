import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList, CheckCircle2, XCircle, Truck, X, ChefHat, AlertTriangle } from 'lucide-react';
import { STATUS_COLORS } from '../data/mockData';
import { api } from '../services/api';

export default function OrdersAdmin() {
  const { orders, updateOrderStatus, complaints, fetchComplaints } = useApp();
  const [resolvingComplaint, setResolvingComplaint] = useState(false);

  const handleResolveComplaint = async (complaintId, responseStr) => {
    setResolvingComplaint(true);
    try {
      await api.resolveComplaint(complaintId, responseStr);
      await fetchComplaints();
      setAdminResponse('');
    } catch (e) {
      console.error(e);
      alert('Error resolviendo el reclamo');
    }
    setResolvingComplaint(false);
  };
  const [filter, setFilter] = useState('todos');
  const [selected, setSelected] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [adminResponse, setAdminResponse] = useState('');

  const filtered = filter === 'todos' ? orders :
    filter === 'reclamos' ? orders.filter(o => complaints?.find(c => c.order_id === (o.dbId || o.id))) :
      orders.filter(o => o.status === filter);

  const liveSelected = selected ? (orders.find(o => o.id === selected.id) || selected) : null;

  const statusOptions = ['todos', 'aceptado', 'en preparacion', 'entregado', 'rechazado', 'reclamos'];


  const advanceOrder = (order, status) => updateOrderStatus(order.id, status);

  const confirmReject = async () => {
    if (!rejectConfirm) return;
    if (!rejectReason.trim()) {
      setRejectError('El motivo del rechazo es obligatorio.');
      return;
    }
    const result = await updateOrderStatus(rejectConfirm.id, 'rechazado', rejectReason.trim());
    if (result?.error) {
      setRejectError(result.error);
      return;
    }
    setRejectConfirm(null);
    setRejectReason('');
    setRejectError('');
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

      <div className="responsive-grid-stack" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div className={`card ${selected ? 'hide-on-mobile' : ''}`}>
          <div className="table-container">
            {filtered.length === 0 ? (
              <div className="empty-state"><ClipboardList size={40} /><p>No hay pedidos</p></div>
            ) : (
              <table className="responsive-table">
                <thead><tr><th>ID</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer' }}>
                      <td data-label="ID"><span style={{ fontWeight: 700, color: 'var(--pink-500)' }}>{o.id}</span></td>
                      <td data-label="Cliente">{o.clientName}</td>
                      <td data-label="Items" style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>{o.items.length} productos</td>
                      <td data-label="Total" style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                      <td data-label="Estado">
                        <span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span>
                        {(() => {
                          const ac = complaints?.find(c => c.order_id === (o.dbId || o.id));
                          if (ac && ac.status === 'open') {
                            return <span className="badge" style={{ backgroundColor: 'var(--danger)', color: 'white', display: 'block', marginTop: 4, padding: '2px 6px', fontSize: '0.65rem', width: 'fit-content' }}>Reclamo abierto</span>;
                          }
                          return null;
                        })()}
                      </td>
                      <td data-label="Fecha" style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{o.date}</td>
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
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}><X size={15} /></button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <span className={`badge ${STATUS_COLORS[liveSelected.status] || 'badge-gray'}`}>{liveSelected.status}</span>
              {(() => {
                const ac = complaints?.find(c => c.order_id === (liveSelected.dbId || liveSelected.id));
                if (ac) {
                  return (
                    <div style={{ background: ac.status === 'open' ? '#fdecea' : '#e6f4ea', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 12, color: ac.status === 'open' ? 'var(--danger)' : '#1e8e3e', fontSize: '0.85rem' }}>
                      <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontWeight: 700 }}>
                        <AlertTriangle size={14} />
                        {ac.status === 'open' ? 'Reclamo en revisión' : 'Reclamo resuelto'}
                      </p>
                      <p style={{ margin: '4px 0 2px', fontWeight: 600 }}>{ac.reason}</p>
                      <p style={{ margin: '0 0 12px', color: ac.status === 'open' ? 'var(--danger)' : '#1e8e3e' }}>{ac.description}</p>
                      {ac.status === 'open' && (
                        <div>
                          <textarea
                            rows={2}
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            placeholder="Escribe tu resolución al cliente..."
                            style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', background: 'white', color: 'var(--gray-700)', fontSize: '0.85rem', resize: 'vertical' }}
                          />
                          <button
                            className="btn btn-sm"
                            style={{ borderColor: 'currentColor', color: 'currentColor' }}
                            onClick={() => handleResolveComplaint(ac.id, adminResponse)}
                            disabled={resolvingComplaint || !adminResponse.trim()}
                          >
                            Marcar como Resuelto
                          </button>
                        </div>
                      )}
                      {ac.status === 'resolved' && ac.admin_response && (
                        <div style={{ marginTop: 8, padding: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-sm)', color: '#14682c' }}>
                          <strong style={{ display: 'block', marginBottom: 2 }}>Tu resolución:</strong> {ac.admin_response}
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
            </div>

            {liveSelected.status === 'rechazado' && liveSelected.rejectionReason && (
              <div style={{ background: '#fdecea', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18, color: 'var(--danger)', fontSize: '0.85rem' }}>
                <strong>Motivo del rechazo:</strong> {liveSelected.rejectionReason}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {liveSelected.status === 'pendiente' && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => advanceOrder(liveSelected, 'aceptado')}>
                    <CheckCircle2 size={14} /> Aceptar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setRejectConfirm(liveSelected); setRejectReason(''); setRejectError(''); }}>
                    <XCircle size={14} /> Rechazar
                  </button>
                </>
              )}
              {liveSelected.status === 'aceptado' && (
                <button className="btn btn-primary btn-sm" onClick={() => advanceOrder(liveSelected, 'en preparacion')}>
                  <ChefHat size={14} /> Preparar
                </button>
              )}
              {liveSelected.status === 'en preparacion' && (
                <button className="btn btn-primary btn-sm" onClick={() => advanceOrder(liveSelected, 'listo')}>
                  <CheckCircle2 size={14} /> Listo
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
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{liveSelected.customer.deliveryType === 'retiro' ? 'Retiro en el local' : 'Entrega a domicilio'}</p>
                {liveSelected.customer.phone && <p style={{ fontSize: '0.85rem' }}>Teléfono: {liveSelected.customer.phone}</p>}
                {liveSelected.customer.address && <p style={{ fontSize: '0.85rem' }}>Dirección: {liveSelected.customer.address}</p>}
                {liveSelected.customer.reference && <p style={{ fontSize: '0.85rem' }}>Referencia: {liveSelected.customer.reference}</p>}
              </div>
            )}

            {liveSelected.packaging && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Empaque</p>
                <p style={{ fontWeight: 600 }}>{liveSelected.packaging.nombre}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Incluye hasta ${liveSelected.packaging.precio.toFixed(2)} en dulces</p>
              </div>
            )}

            {liveSelected.attendedByName && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Atendido por (Preparación)</p>
                <p style={{ fontWeight: 600 }}>{liveSelected.attendedByName}</p>
              </div>
            )}

            {liveSelected.dispatchedByName && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Despachado por (Entrega)</p>
                <p style={{ fontWeight: 600 }}>{liveSelected.dispatchedByName}</p>
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
                <strong>Nota:</strong> {liveSelected.notes}
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
          <div className="modal" style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}><AlertTriangle size={40} /></div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>¿Rechazar pedido?</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginBottom: 16 }}>Se repondrá el stock reservado de este pedido. El cliente verá el motivo que escribas aquí.</p>
            <div className="form-group" style={{ textAlign: 'left', marginBottom: rejectError ? 8 : 20 }}>
              <label>Motivo del rechazo</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                placeholder="Ej. Producto sin stock, datos de contacto incorrectos, pedido duplicado..."
                autoFocus
              />
            </div>
            {rejectError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16, textAlign: 'left' }}>{rejectError}</p>}
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
