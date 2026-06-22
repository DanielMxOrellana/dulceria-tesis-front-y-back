import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, CheckCircle, Save, XCircle } from 'lucide-react';

export default function InventoryPage() {
  const { products, updateStock, currentUser } = useApp();
  const [drafts, setDrafts] = useState({});

  const lowStock = useMemo(() => products.filter((product) => product.stock > 0 && product.stock <= product.minStock), [products]);
  const outOfStock = useMemo(() => products.filter((product) => product.stock === 0), [products]);
  const okStock = useMemo(() => products.filter((product) => product.stock > product.minStock), [products]);

  const title = currentUser?.role === 'vendor' ? 'Inventario del vendedor' : 'Inventario';

  const saveStock = (productId) => {
    const qty = parseInt(drafts[productId], 10);
    if (Number.isNaN(qty) || qty < 0) return;
    updateStock(productId, qty);
  };

  const renderRows = (items) => items.map((product) => (
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
          <input
            type="number"
            min="0"
            value={drafts[product.id] ?? product.stock}
            onChange={(event) => setDrafts((prev) => ({ ...prev, [product.id]: event.target.value }))}
            style={{ width: 90, padding: '7px 10px', borderRadius: 10, border: '1px solid var(--gray-200)' }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => saveStock(product.id)}>
            <Save size={14} /> Guardar
          </button>
        </div>
      </td>
    </tr>
  ));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>Actualiza el stock compartido desde un único estado en memoria.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18 }}>
          <p className="text-muted">Agotados</p>
          <h3 style={{ color: 'var(--danger)' }}>{outOfStock.length}</h3>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <p className="text-muted">Stock bajo</p>
          <h3 style={{ color: '#c17d00' }}>{lowStock.length}</h3>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <p className="text-muted">Stock normal</p>
          <h3 style={{ color: 'var(--success)' }}>{okStock.length}</h3>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <XCircle size={18} color="var(--danger)" />
          <h3 style={{ fontSize: '1rem', color: 'var(--danger)' }}>Agotados</h3>
          <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{outOfStock.length}</span>
        </div>
        <div className="table-container">
          {outOfStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 20px' }}><p>No hay productos agotados</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                  <th>Ajustar</th>
                </tr>
              </thead>
              <tbody>{renderRows(outOfStock)}</tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#c17d00" />
          <h3 style={{ fontSize: '1rem', color: '#c17d00' }}>Stock bajo</h3>
          <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{lowStock.length}</span>
        </div>
        <div className="table-container">
          {lowStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 20px' }}><p>No hay alertas activas</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                  <th>Ajustar</th>
                </tr>
              </thead>
              <tbody>{renderRows(lowStock)}</tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={18} color="var(--success)" />
          <h3 style={{ fontSize: '1rem', color: 'var(--success)' }}>Stock normal</h3>
          <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{okStock.length}</span>
        </div>
        <div className="table-container">
          {okStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 20px' }}><p>No hay productos en estado normal</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                  <th>Ajustar</th>
                </tr>
              </thead>
              <tbody>{renderRows(okStock)}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}