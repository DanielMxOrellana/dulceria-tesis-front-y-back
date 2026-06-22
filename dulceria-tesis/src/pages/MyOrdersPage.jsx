import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ClipboardList } from 'lucide-react';
import { STATUS_COLORS } from '../data/mockData';

const STATUS_STEPS = ['pendiente', 'aceptado', 'en preparacion', 'listo', 'entregado'];

export default function MyOrdersPage() {
  const { orders, currentUser } = useApp();
  const [selected, setSelected] = useState(null);

  const myOrders = orders.filter(o => o.clientId === currentUser?.id);

  const stepIndex = (status) => STATUS_STEPS.indexOf(status);

  return (
    <div>
      <div className="page-header">
        <div><h1>Mis Pedidos</h1><p>{myOrders.length} pedidos realizados</p></div>
        <Link to="/nuevo-pedido/empaque" className="btn btn-primary">Hacer nuevo pedido</Link>
      </div>

      {myOrders.length === 0 ? (
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
                  <span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span>
                  <span style={{ fontWeight: 700, color: 'var(--pink-500)' }}>${o.total.toFixed(2)}</span>
                </div>
              </div>

              {selected?.id === o.id && (
                <div>
                  {/* Progress bar */}
                  {o.status !== 'rechazado' && (
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 14, left: '5%', right: '5%', height: 3, background: 'var(--gray-100)', borderRadius: 99 }}>
                          <div style={{ height: '100%', background: 'var(--pink-500)', borderRadius: 99, width: `${Math.max(0, stepIndex(o.status)) / (STATUS_STEPS.length - 1) * 100}%`, transition: 'width 0.4s' }} />
                        </div>
                        {STATUS_STEPS.map((s, i) => (
                          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, position: 'relative' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= stepIndex(o.status) ? 'var(--pink-500)' : 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: i <= stepIndex(o.status) ? 'white' : 'var(--gray-300)', fontWeight: 700, border: `2px solid ${i <= stepIndex(o.status) ? 'var(--pink-500)' : 'var(--gray-200)'}`, zIndex: 1, background: i <= stepIndex(o.status) ? 'var(--pink-500)' : 'white' }}>
                              {i < stepIndex(o.status) ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: i <= stepIndex(o.status) ? 'var(--pink-600)' : 'var(--gray-400)', fontWeight: i === stepIndex(o.status) ? 700 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {o.status === 'rechazado' && (
                    <div style={{ background: '#fdecea', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, color: 'var(--danger)', fontSize: '0.88rem' }}>
                      ❌ Tu pedido fue rechazado. Contacta con nosotros para más información.
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
                        <strong>Empaque:</strong> {o.packaging.emoji} {o.packaging.nombre} · ${o.packaging.precio.toFixed(2)}
                      </div>
                    )}
                    {o.customer && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: '#fef8e7', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#7a5a00' }}>
                        <strong>Datos personales:</strong> {o.customer.name}{o.customer.phone ? ` · ${o.customer.phone}` : ''}{o.customer.address ? ` · ${o.customer.address}` : ''}
                      </div>
                    )}
                    {o.notes && <p style={{ marginTop: 10, color: 'var(--gray-400)', fontSize: '0.85rem' }}>📝 {o.notes}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
