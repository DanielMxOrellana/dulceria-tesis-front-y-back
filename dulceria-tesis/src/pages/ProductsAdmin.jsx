import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

const EMPTY_FORM = { name: '', category: '', price: '', stock: '', minStock: '', description: '', image: '' };

export default function ProductsAdmin() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal('form'); };
  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, minStock: p.minStock, description: p.description, image: p.image });
    setEditId(p.id); setModal('form');
  };

  const save = (e) => {
    e.preventDefault();
    const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), minStock: parseInt(form.minStock) };
    if (editId) updateProduct(editId, data);
    else addProduct(data);
    setModal(null);
  };

  const doDelete = () => { deleteProduct(confirmDelete); setConfirmDelete(null); };

  const stockColor = (p) => {
    if (p.stock === 0) return 'badge-danger';
    if (p.stock <= p.minStock) return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Productos</h1><p>{products.length} productos registrados</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Nuevo Producto</button>
      </div>

      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', width: '300px', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="empty-state"><Package size={40} /><p>No hay productos</p></div>
          ) : (
            <table>
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={p.image && (p.image.startsWith('http') || p.image.startsWith('data:') ? p.image : encodeURI(p.image))}
                          alt={p.name}
                          onError={(e) => { e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23f3eae9'/%3E%3C/svg%3E" }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{p.description?.slice(0, 40)}</p>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td style={{ fontWeight: 600, color: 'var(--pink-500)' }}>${p.price.toFixed(2)}</td>
                    <td><span className={`badge ${stockColor(p)}`}>{p.stock} und.</span></td>
                    <td><span className={`badge ${p.available ? 'badge-success' : 'badge-danger'}`}>{p.available ? 'Disponible' : 'Agotado'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(p.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h2>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setModal(null)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input name="name" value={form.name} onChange={handle} required placeholder="Nombre del producto" />
                </div>
                <div className="form-group">
                  <label>Categoría *</label>
                  <select name="category" value={form.category} onChange={handle} required>
                    <option value="">Selecciona...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Precio ($) *</label>
                  <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handle} required placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Stock actual *</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handle} required placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Stock mínimo *</label>
                  <input name="minStock" type="number" min="0" value={form.minStock} onChange={handle} required placeholder="5" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Descripción</label>
                  <textarea name="description" value={form.description} onChange={handle} rows={2} placeholder="Descripción del producto..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Guardar cambios' : 'Registrar producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>¿Eliminar producto?</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginBottom: 24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={doDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}