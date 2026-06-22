import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList } from 'lucide-react';

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  'en preparacion': 'En preparación',
  listo: 'Listo para despachar',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
};

const STATUS_BADGES = {
  pendiente: 'badge-warning',
  aceptado: 'badge-info',
  'en preparacion': 'badge-info',
  listo: 'badge-success',
  entregado: 'badge-success',
  rechazado: 'badge-danger',
};

const STATUS_OPTIONS = ['pendiente', 'aceptado', 'en preparacion', 'listo', 'entregado', 'rechazado'];

export default function OrdersPage() {
  const { currentUser, products, orders, updateOrderStatus } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const visibleOrders = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'admin') return orders;

    if (currentUser.role === 'vendor') {
      const vendorProducts = products.filter((product) => product.vendorId === currentUser.id);
      return orders
        .map((order) => {
          const vendorItems = order.items.filter((item) => vendorProducts.some((product) => product.id === item.productId));
          return {
            ...order,
            vendorItems,
            vendorTotal: vendorItems.reduce((sum, item) => sum + item.price * item.qty, 0),
          };
        })
        .filter((order) => order.vendorItems.length > 0);
    }

    return orders.filter((order) => order.clientId === currentUser.id);
  }, [currentUser, orders, products]);

  const selectedOrder = visibleOrders.find((order) => order.id === selectedOrderId) || visibleOrders[0] || null;

  const applyStatus = (orderId, status) => {
    const result = updateOrderStatus(orderId, status);
    if (result?.error) alert(result.error);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p>{currentUser?.role === 'vendor' ? 'Pedidos que contienen tus productos.' : 'Pedidos compartidos del sistema en memoria.'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 380px' : '1fr', gap: 20 }}>
        <div className="card">
          <div className="table-container">
            {visibleOrders.length === 0 ? (
              <div className="empty-state"><ClipboardList size={40} /><p>No hay pedidos</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Dirección</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} style={{ cursor: 'pointer' }}>
                      <td><span style={{ fontWeight: 700, color: 'var(--pink-500)' }}>{order.id}</span></td>
                      <td>
                        <strong>{order.customer?.name || order.clientName}</strong>
                        <p className="text-muted">{order.customer?.phone || 'Sin teléfono'}</p>
                      </td>
                      <td>{order.customer?.address || 'Sin dirección'}</td>
                      <td style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>{(order.vendorItems || order.items).length} productos</td>
                      <td style={{ fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                      <td><span className={`badge ${STATUS_BADGES[order.status] || 'badge-gray'}`}>{STATUS_LABELS[order.status] || order.status}</span></td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(event) => applyStatus(order.id, event.target.value)}
                          style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: '0.82rem', background: 'var(--gray-50)', outline: 'none', cursor: 'pointer' }}
                        >
                          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selectedOrder && (
          <div className="card" style={{ padding: '24px', height: 'fit-content', position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>{selectedOrder.id}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--gray-400)' }}>{selectedOrder.date}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrderId(null)}>✕</button>
            </div>

            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Cliente</p>
              <p style={{ fontWeight: 600 }}>{selectedOrder.customer?.name || selectedOrder.clientName}</p>
            </div>

            <div style={{ background: '#fef8e7', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18, color: '#7a5a00' }}>
              <p style={{ fontSize: '0.8rem', color: '#9b7d34', marginBottom: 2 }}>Datos personales</p>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{selectedOrder.customer?.name || selectedOrder.clientName}</p>
              {selectedOrder.customer?.phone && <p style={{ fontSize: '0.85rem' }}>Teléfono: {selectedOrder.customer.phone}</p>}
              {selectedOrder.customer?.address && <p style={{ fontSize: '0.85rem' }}>Dirección: {selectedOrder.customer.address}</p>}
              {selectedOrder.customer?.reference && <p style={{ fontSize: '0.85rem' }}>Referencia: {selectedOrder.customer.reference}</p>}
            </div>

            {selectedOrder.packaging && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Empaque</p>
                <p style={{ fontWeight: 600 }}>{selectedOrder.packaging.emoji} {selectedOrder.packaging.nombre}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Capacidad: hasta {selectedOrder.packaging.capacidadMax} dulces · ${selectedOrder.packaging.precio.toFixed(2)}</p>
              </div>
            )}

            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-400)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Productos</p>
            {(selectedOrder.vendorItems || selectedOrder.items).map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>x{item.qty} × ${item.price.toFixed(2)}</p>
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}

            {selectedOrder.notes && (
              <div style={{ background: '#fef8e7', borderRadius: 'var(--radius-sm)', padding: '10px 14px', margin: '14px 0', fontSize: '0.85rem', color: '#7a5a00' }}>
                📝 {selectedOrder.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: 8 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pink-500)' }}>${selectedOrder.total.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cambiar estado</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => applyStatus(selectedOrder.id, status)}
                    style={{ padding: '5px 12px', borderRadius: 99, border: `1.5px solid ${selectedOrder.status === status ? 'var(--pink-400)' : 'var(--gray-200)'}`, background: selectedOrder.status === status ? 'var(--pink-100)' : 'white', color: selectedOrder.status === status ? 'var(--pink-600)' : 'var(--gray-500)', fontSize: '0.8rem', fontWeight: selectedOrder.status === status ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}
                  >
                    {STATUS_LABELS[status]}
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