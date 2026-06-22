import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { ALL_PACKAGING_OPTIONS, ORDER_STEPS, getBestPackageForCount, getImageSrc } from '../utils/orderFlow';

export default function NewOrderProductsPage() {
  const { products, cart, addToCart, removeFromCart, cartTotal, orderDraft, updateOrderDraft } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const navigate = useNavigate();

  const categories = ['Todos', ...CATEGORIES.filter(c => products.some(p => p.category === c))];
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todos' || p.category === category;
    return matchSearch && matchCat;
  });

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const selectedPackaging = ALL_PACKAGING_OPTIONS.find(option => option.id === orderDraft.packagingId) || getBestPackageForCount(totalItems);
  const packagingTotal = selectedPackaging?.precio || 0;
  const grandTotal = cartTotal + packagingTotal;

  useEffect(() => {
    if (!selectedPackaging) return;
    if (selectedPackaging.capacidadMax < totalItems) {
      const recommended = getBestPackageForCount(totalItems);
      if (recommended && recommended.id !== orderDraft.packagingId) {
        updateOrderDraft({ packagingId: recommended.id });
      }
    }
  }, [orderDraft.packagingId, selectedPackaging, totalItems, updateOrderDraft]);

  const inCart = (id) => cart.find(i => i.productId === id);

  const updateQty = (item, delta) => {
    if (item.qty + delta <= 0) return removeFromCart(item.productId);
    addToCart({ id: item.productId, name: item.name, price: item.price, image: item.image }, delta);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nuevo Pedido</h1>
          <p>Paso 2 de {ORDER_STEPS.length}: elige productos</p>
        </div>
        <Link to="/nuevo-pedido/empaque" className="btn btn-secondary"><ArrowLeft size={15} /> Volver a empaque</Link>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>Empaque actual: {selectedPackaging ? `${selectedPackaging.emoji} ${selectedPackaging.nombre}` : 'Sin empaque'}</p>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>Si excedes la capacidad, se ajusta automáticamente a uno más grande.</p>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 14, background: 'var(--gray-50)', color: 'var(--gray-500)', fontSize: '0.86rem' }}>
            {totalItems} dulces seleccionados
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-300)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar dulces..." style={{ paddingLeft: 36, padding: '10px 14px 10px 36px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)', width: '100%', fontSize: '0.9rem', outline: 'none', background: 'white' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
            {filtered.map(p => {
              const item = inCart(p.id);
              return (
                <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, var(--pink-100), var(--brown-100))', padding: '18px', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={getImageSrc(p.image)} alt={p.name} onError={(e) => { e.currentTarget.src = getImageSrc(); }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px', display: 'block' }} />
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>{p.name}</h3>
                      <span style={{ fontWeight: 700, color: 'var(--pink-500)', whiteSpace: 'nowrap', marginLeft: 8 }}>${p.price.toFixed(2)}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 8 }}>{p.category}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: 12 }}>Stock: {p.stock} · {p.available ? 'Disponible' : 'Agotado'}</p>
                    {!p.available ? (
                      <span className="badge badge-danger" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>Agotado</span>
                    ) : item ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <button onClick={() => updateQty(item, -1)} className="btn btn-secondary btn-sm" style={{ width: 30, height: 30, padding: 0, justifyContent: 'center' }}><Minus size={13} /></button>
                        <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item, 1)} className="btn btn-secondary btn-sm" style={{ width: 30, height: 30, padding: 0, justifyContent: 'center' }}><Plus size={13} /></button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => addToCart(p)}>
                        <Plus size={13} /> Seleccionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ padding: '24px', position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Resumen</h3>

            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 16px' }}>
                <ShoppingCart size={36} />
                <p>Selecciona productos para continuar</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
                  <span>{item.name} x{item.qty}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                      x
                    </button>
                  </div>
                </div>
              ))
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
              <span>Empaque</span>
              <span>{selectedPackaging ? selectedPackaging.nombre : 'Sin empaque'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
              <span>Total estimado</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Link to="/nuevo-pedido/empaque" className="btn btn-secondary" style={{ flex: 1 }}>Atrás</Link>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/nuevo-pedido/datos')}>
                Siguiente <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}