import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, X, Package, AlertTriangle } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { api } from '../services/api';

const EMPTY_FORM = { name: '', category: '', price: '', stock: '', minStock: '', description: '', image: '' };

export default function ProductsAdmin() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [stockNoteModal, setStockNoteModal] = useState(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setUploadError(''); setModal('form'); };
  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, minStock: p.minStock, description: p.description, image: p.image });
    setEditId(p.id); setUploadError(''); setModal('form');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const response = await api.uploadImage(file);
      if (response && response.ok) {
        setForm(prev => ({ ...prev, image: response.imageUrl }));
      } else {
        setUploadError(response?.error || 'Falló la subida de la imagen.');
      }
    } catch (err) {
      setUploadError('Error al subir la imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), minStock: parseInt(form.minStock) };
    if (editId) {
      const currentProduct = products.find((product) => product.id === editId);
      if (currentProduct && Number(currentProduct.stock) !== Number(data.stock)) {
        setStockNoteModal({
          productId: editId,
          productName: currentProduct.name,
          previousStock: Number(currentProduct.stock),
          nextStock: Number(data.stock),
          data,
          note: '',
          error: '',
          isSubmitting: false,
        });
        return;
      } else {
        updateProduct(editId, data);
      }
    }
    else addProduct(data);
    setModal(null);
  };

  const saveWithStockNote = async () => {
    if (!stockNoteModal) return;
    const note = stockNoteModal.note.trim();
    if (!note) {
      setStockNoteModal(prev => ({ ...prev, error: 'La nota es obligatoria para registrar el movimiento.' }));
      return;
    }

    setStockNoteModal(prev => ({ ...prev, isSubmitting: true, error: '' }));
    const result = await updateProduct(stockNoteModal.productId, { ...stockNoteModal.data, note });
    if (result?.error) {
      setStockNoteModal(prev => ({ ...prev, isSubmitting: false, error: result.error }));
      return;
    }
    setStockNoteModal(null);
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
            <table className="responsive-table">
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td data-label="Producto">
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
                    <td data-label="Categoría">{p.category}</td>
                    <td data-label="Precio" style={{ fontWeight: 600, color: 'var(--pink-500)' }}>${p.price.toFixed(2)}</td>
                    <td data-label="Stock"><span className={`badge ${stockColor(p)}`}>{p.stock} und.</span></td>
                    <td data-label="Estado"><span className={`badge ${p.available ? 'badge-success' : 'badge-danger'}`}>{p.available ? 'Disponible' : 'Agotado'}</span></td>
                    <td data-label="Acciones">
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
              <div className="responsive-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
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
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Imagen</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {isUploading && <span style={{ color: 'var(--pink-500)', fontSize: '0.85rem' }}>Subiendo imagen...</span>}
                  {uploadError && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{uploadError}</span>}
                  {form.image && !isUploading && (
                    <img src={form.image} alt="Vista previa" style={{ maxWidth: '100px', marginTop: 8, borderRadius: 8 }} />
                  )}
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

      {stockNoteModal && (
        <div className="modal-overlay" onClick={() => !stockNoteModal.isSubmitting && setStockNoteModal(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Nota de movimiento</h2>
                <p className="section-subtitle">{stockNoteModal.productName}</p>
              </div>
              <button className="btn btn-secondary btn-sm" disabled={stockNoteModal.isSubmitting} onClick={() => setStockNoteModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="responsive-grid-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: 14 }}>
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>Stock actual</p>
                  <strong>{stockNoteModal.previousStock}</strong>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>Nuevo stock</p>
                  <strong>{stockNoteModal.nextStock}</strong>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.78rem' }}>Movimiento</p>
                  <strong>{stockNoteModal.nextStock - stockNoteModal.previousStock > 0 ? '+' : ''}{stockNoteModal.nextStock - stockNoteModal.previousStock}</strong>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Explicación obligatoria</label>
                <textarea
                  rows={4}
                  value={stockNoteModal.note}
                  onChange={(event) => setStockNoteModal(prev => ({ ...prev, note: event.target.value, error: '' }))}
                  placeholder="Ej. Reposición de proveedor, ajuste por conteo físico, salida por merma..."
                  autoFocus
                />
              </div>
              {stockNoteModal.error && <p style={{ color: 'var(--danger)', marginTop: 10 }}>{stockNoteModal.error}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" disabled={stockNoteModal.isSubmitting} onClick={() => setStockNoteModal(null)}>Cancelar</button>
              <button className="btn btn-primary" disabled={stockNoteModal.isSubmitting} onClick={saveWithStockNote}>Guardar movimiento</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}><AlertTriangle size={40} /></div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>¿Desactivar producto?</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginBottom: 24 }}>El producto se ocultará del catálogo pero se conservará en la base de datos.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={doDelete}>Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
