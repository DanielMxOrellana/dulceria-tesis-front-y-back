import React from 'react';
import { useApp } from '../../context/AppContext';

const ORDER_LABELS = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  'en preparacion': 'En preparación',
  listo: 'Listo para despachar',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
};

const ORDER_BADGES = {
  pendiente: 'badge-warning',
  aceptado: 'badge-info',
  'en preparacion': 'badge-info',
  listo: 'badge-success',
  entregado: 'badge-success',
  rechazado: 'badge-danger',
};

export default function SellerOrders() {
  const { products, orders, currentUser, updateOrderStatus } = useApp();
  const vendorProducts = products.filter((product) => product.vendorId === currentUser?.id);
  const vendorOrders = orders
    .map((order) => ({
      ...order,
      vendorItems: order.items.filter((item) => vendorProducts.some((product) => product.id === item.productId)),
    }))
    .filter((order) => order.vendorItems.length > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pedidos del vendedor</h1>
          <p>Gestiona pedidos, clientes y estado de despacho.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {vendorOrders.length === 0 ? (
            <div className="empty-state"><p>No tienes pedidos todavía</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Dirección</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {vendorOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <strong>{order.customer?.name || order.clientName}</strong>
                      <p className="text-muted">{order.customer?.phone || 'Sin teléfono'}</p>
                    </td>
                    <td>{order.customer?.address || 'Sin dirección'}</td>
                    <td>{order.vendorItems.length}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td><span className={`badge ${ORDER_BADGES[order.status] || 'badge-info'}`}>{ORDER_LABELS[order.status] || order.status}</span></td>
                    <td>
                      <div className="actions-cell">
                        {order.status === 'pendiente' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => updateOrderStatus(order.id, 'aceptado')}>Aceptar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateOrderStatus(order.id, 'rechazado')}>Rechazar</button>
                          </>
                        )}
                        {(order.status === 'aceptado' || order.status === 'en preparacion') && (
                          <button className="btn btn-primary btn-sm" onClick={() => updateOrderStatus(order.id, 'listo')}>Listo para despachar</button>
                        )}
                        {(order.status === 'listo') && (
                          <button className="btn btn-success btn-sm" onClick={() => updateOrderStatus(order.id, 'entregado')}>Entregado</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}