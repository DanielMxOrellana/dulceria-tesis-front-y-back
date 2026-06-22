import React from 'react';
import { useApp } from '../../context/AppContext';

export default function SellerStock() {
  const { products, currentUser, updateStock } = useApp();
  const vendorProducts = products.filter((product) => product.vendorId === currentUser?.id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventario del vendedor</h1>
          <p>Actualiza stock, revisa mínimo y detecta inventario bajo.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {vendorProducts.length === 0 ? (
            <div className="empty-state"><p>No tienes productos publicados</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock actual</th>
                  <th>Stock mínimo</th>
                  <th>Estado</th>
                  <th>Ajustar</th>
                </tr>
              </thead>
              <tbody>
                {vendorProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <p className="text-muted">{product.category}</p>
                    </td>
                    <td>{product.stock}</td>
                    <td>{product.minStock}</td>
                    <td>
                      <span className={`badge ${product.stock === 0 ? 'badge-danger' : product.stock <= product.minStock ? 'badge-warning' : 'badge-success'}`}>
                        {product.stock === 0 ? 'Agotado' : product.stock <= product.minStock ? 'Bajo' : 'Normal'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-secondary btn-sm" onClick={() => updateStock(product.id, Math.max(0, product.stock - 1))}>-1</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => updateStock(product.id, product.stock + 1)}>+1</button>
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