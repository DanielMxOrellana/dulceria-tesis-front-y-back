import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ClipboardList, Check, XCircle, AlertTriangle } from 'lucide-react';
import { STATUS_COLORS } from '../data/mockData';
import { getOrderProgressWidth, getOrderStepIndex, normalizeOrderStatusLabel, ORDER_STATUS_STEPS } from '../utils/orderFlow';
import { api } from '../services/api';

export default function MyOrdersPage() {
  const { orders, currentUser, markRejectionsSeen, complaints, fetchComplaints } = useApp();
  const [selected, setSelected] = useState(null);

  // Complaints state
  const [complaintOrder, setComplaintOrder] = useState(null);
  const [complaintReason, setComplaintReason] = useState('Producto dañado');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'complaints'

  const myOrders = orders.filter(o => o.clientId === currentUser?.id);
  const clientComplaints = complaints?.filter(c => c.customer_id === currentUser?.id) || [];

  useEffect(() => {
    markRejectionsSeen();
  }, [myOrders.length]);

  const getStepIndex = (status) => {
    const index = getOrderStepIndex(status);
    return index >= 0 ? index : 0;
  };

  const submitComplaint = async () => {
    if (!complaintOrder || !complaintDesc.trim()) {
      setComplaintMessage({ type: 'error', text: 'La descripción es obligatoria.' });
      return;
    }
    setComplaintLoading(true);
    setComplaintMessage('');
    try {
      const res = await api.createComplaint(complaintOrder.dbId || complaintOrder.id, {
        customerId: currentUser.id,
        reason: complaintReason,
        description: complaintDesc.trim()
      });
      if (res && res.ok) {
        setComplaintMessage({ type: 'success', text: 'Reclamo enviado correctamente. Nos pondremos en contacto.' });
        fetchComplaints();
        setTimeout(() => {
          setComplaintOrder(null);
          setComplaintMessage('');
          setComplaintDesc('');
          setComplaintReason('Producto dañado');
        }, 3000);
      } else {
        setComplaintMessage({ type: 'error', text: res?.error || 'Error al enviar.' });
      }
    } catch (err) {
      setComplaintMessage({ type: 'error', text: 'Falló la conexión al enviar.' });
    }
    setComplaintLoading(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Tu Espacio</h1>
          <p>{myOrders.length} pedidos · {clientComplaints.length} reclamos</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('orders')}
          >
            Historial de Pedidos
          </button>
          <button
            className={`btn ${activeTab === 'complaints' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setActiveTab('complaints')}
          >
            Mis Reclamos
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        myOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <ClipboardList size={50} />
            <p>Aún no tienes pedidos</p>
            <Link to="/nuevo-pedido/empaque" className="btn btn-primary" style={{ marginTop: 12 }}>Hacer nuevo pedido</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myOrders.map(o => (
              <div key={o.id} className="card" style={{ padding: '20px 24px', cursor: 'pointer' }} onClick={() => setSelected(selected?.id === o.id ? null : o)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: selected?.id === o.id ? 20 : 0 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--pink-500)', marginBottom: 2 }}>{o.id}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{o.date} · {o.items.length} productos</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${STATUS_COLORS[normalizeOrderStatusLabel(o.status)] || 'badge-gray'}`}>{normalizeOrderStatusLabel(o.status)}</span>
                    <span style={{ fontWeight: 700, color: 'var(--pink-500)' }}>${o.total.toFixed(2)}</span>
                  </div>
                </div>

                {selected?.id === o.id && (
                  <div>
                    {/* Progress bar */}
                    {normalizeOrderStatusLabel(o.status) !== 'rechazado' && (
                      <div style={{ marginBottom: 22 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 14, left: '5%', right: '5%', height: 3, background: 'var(--gray-100)', borderRadius: 99 }}>
                            <div style={{ height: '100%', background: 'var(--pink-500)', borderRadius: 99, width: `${getOrderProgressWidth(o.status)}%`, transition: 'width 0.4s' }} />
                          </div>
                          {ORDER_STATUS_STEPS.map((s, i) => {
                            const currentStep = getStepIndex(o.status);
                            const isCompleted = i <= currentStep;
                            return (
                              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, position: 'relative' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: isCompleted ? 'white' : 'var(--gray-300)', fontWeight: 700, border: `2px solid ${isCompleted ? 'var(--pink-500)' : 'var(--gray-200)'}`, zIndex: 1, background: isCompleted ? 'var(--pink-500)' : 'white' }}>
                                  {isCompleted ? <Check size={14} /> : i + 1}
                                </div>
                                <span style={{ fontSize: '0.68rem', color: isCompleted ? 'var(--pink-600)' : 'var(--gray-400)', fontWeight: i === currentStep ? 700 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {normalizeOrderStatusLabel(o.status) === 'rechazado' && (
                      <div style={{ background: '#fdecea', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, color: 'var(--danger)', fontSize: '0.88rem' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                          <XCircle size={16} /> Tu pedido fue rechazado.
                        </p>
                        <p style={{ margin: '6px 0 0' }}>
                          <strong>Motivo:</strong> {o.rejectionReason || 'No se especificó un motivo. Contacta con nosotros para más información.'}
                        </p>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 16 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Detalle del pedido</p>
                      {o.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.88rem' }}>
                          <span>{item.name} <span style={{ color: 'var(--gray-400)' }}>x{item.qty}</span></span>
                          <span style={{ fontWeight: 600 }}>${(item.qty * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                      {o.packaging && (
                        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                          <strong>Empaque:</strong> {o.packaging.nombre} · ${o.packaging.precio.toFixed(2)}
                        </div>
                      )}
                      {o.customer && (
                        <div style={{ marginTop: 10, padding: '10px 12px', background: '#fef8e7', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#7a5a00' }}>
                          <strong>{o.customer.deliveryType === 'retiro' ? 'Retiro en el local' : 'Entrega a domicilio'}:</strong> {o.customer.name}{o.customer.phone ? ` · ${o.customer.phone}` : ''}{o.customer.address ? ` · ${o.customer.address}` : ''}
                        </div>
                      )}
                      {o.attendedByName && (
                        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                          <strong>Atendido por:</strong> {o.attendedByName}
                        </div>
                      )}
                      {o.dispatchedByName && (
                        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                          <strong>Despachado por:</strong> {o.dispatchedByName}
                        </div>
                      )}
                      {o.notes && <p style={{ marginTop: 10, color: 'var(--gray-400)', fontSize: '0.85rem' }}><strong>Nota:</strong> {o.notes}</p>}
                      {(() => {
                        const activeComplaint = complaints?.find(c => c.order_id === (o.dbId || o.id));

                        if (activeComplaint) {
                          return (
                            <div style={{ marginTop: 16, padding: '10px 12px', background: activeComplaint.status === 'open' ? '#fdecea' : '#e6f4ea', color: activeComplaint.status === 'open' ? 'var(--danger)' : '#1e8e3e', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                              <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontWeight: 700 }}>
                                <AlertTriangle size={14} />
                                {activeComplaint.status === 'open' ? 'Reclamo en revisión' : 'Reclamo resuelto'}
                              </p>
                              <p style={{ margin: '4px 0 0' }}>{activeComplaint.reason}</p>
                            </div>
                          );
                        }

                        if (normalizeOrderStatusLabel(o.status) === 'entregado') {
                          return (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ marginTop: 16, width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                              onClick={(e) => { e.stopPropagation(); setComplaintOrder(o); }}
                            >
                              <AlertTriangle size={14} style={{ marginRight: 6 }} />
                              Reportar inconveniente
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {clientComplaints.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <AlertTriangle size={50} style={{ color: 'var(--gray-300)' }} />
              <p>No tienes ningún reclamo en tu historial</p>
            </div>
          ) : (
            clientComplaints.map(ac => {
              const relatedOrder = myOrders.find(o => (o.dbId || o.id) === ac.order_id);
              return (
                <div key={ac.id} className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: ac.status === 'open' ? 'var(--danger)' : '#1e8e3e' }}>
                        <AlertTriangle size={18} />
                        {ac.status === 'open' ? 'Reclamo en Revisión' : 'Reclamo Resuelto'}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                        {relatedOrder ? `Pedido relaccionado: ${relatedOrder.id}` : `ID Pedido DB: ${ac.order_id}`}
                      </p>
                    </div>
                    <span className={`badge`} style={{ background: ac.status === 'open' ? '#fdecea' : '#e6f4ea', color: ac.status === 'open' ? 'var(--danger)' : '#1e8e3e' }}>
                      {ac.status === 'open' ? 'Abierto' : 'Resuelto'}
                    </span>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{ac.reason}</p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--gray-600)' }}>{ac.description}</p>
                  </div>

                  {ac.status === 'resolved' && (
                    <div style={{ padding: '12px', background: '#d5ebd1', borderRadius: 'var(--radius-md)', marginTop: 12, borderLeft: '4px solid #14682c' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#14682c', fontSize: '0.85rem', textTransform: 'uppercase' }}>Respuesta de Dulcería</p>
                      <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#1a502c' }}>
                        {ac.admin_response || 'Tu reclamo ha sido atendido y solucionado satisfactoriamente.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {complaintOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '24px', width: '90%', maxWidth: '400px', backgroundColor: 'white' }}>
            <h3 style={{ marginTop: 0, marginBottom: '4px' }}>Reportar Inconveniente</h3>
            <p className="text-muted" style={{ marginBottom: '20px' }}>Pedido {complaintOrder.id}</p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Motivo del reclamo</label>
              <select
                value={complaintReason}
                onChange={(e) => setComplaintReason(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '2px solid var(--gray-200)' }}
              >
                <option value="Producto dañado">Producto defectuoso o dañado</option>
                <option value="Incompleto">Pedido incompleto</option>
                <option value="Mala atención">Mala atención</option>
                <option value="Otro">Otro problema</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Descripción detallada</label>
              <textarea
                value={complaintDesc}
                onChange={(e) => setComplaintDesc(e.target.value)}
                placeholder="Cuéntanos qué pasó..."
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '2px solid var(--gray-200)', resize: 'vertical' }}
              />
            </div>

            {complaintMessage && (
              <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '4px', backgroundColor: complaintMessage.type === 'error' ? '#fdecea' : '#e6f4ea', color: complaintMessage.type === 'error' ? 'var(--danger)' : '#1e8e3e', fontSize: '0.85rem' }}>
                {complaintMessage.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setComplaintOrder(null); setComplaintMessage(''); }}
                style={{ flex: 1 }}
                disabled={complaintLoading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={submitComplaint}
                style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={complaintLoading}
              >
                {complaintLoading ? 'Enviando...' : 'Enviar Reclamo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
