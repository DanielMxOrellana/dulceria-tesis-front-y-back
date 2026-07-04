import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { ORDER_STEPS, getImageSrc, getSelectedPackaging } from '../utils/orderFlow';

export default function NewOrderProductsPage() {
  const { products, cart, addToCart, removeFromCart, cartTotal, orderDraft } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [limitError, setLimitError] = useState('');
  const navigate = useNavigate();

  const categories = ['Todos', ...CATEGORIES.filter(c => products.some(p => p.category === c))];
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todos' || p.category === category;
    return matchSearch && matchCat;
  });

  const selectedPackaging = getSelectedPackaging(orderDraft);
  const limit = selectedPackaging?.precio || 0;
  const remaining = Math.max(0, limit - cartTotal);
  const grandTotal = limit;

  const inCart = (id) => cart.find(i => i.productId === id);

  const getProductStock = (productId) => {
    const product = products.find(p => p.id === productId);
    return Math.max(0, product?.stock ?? 0);
  };

  const canAddMore = (productId, currentQty = 0) => {
    const product = products.find(p => p.id === productId);
    if (!product?.available) return false;
    return currentQty < getProductStock(productId);
  };

  const fitsInBudget = (price) => cartTotal + Number(price || 0) <= limit + 0.001;

  const updateQty = (item, delta) => {
    if (item.qty + delta <= 0) return removeFromCart(item.productId);
    if (delta > 0 && !canAddMore(item.productId, item.qty)) return;
    const result = addToCart({ id: item.productId, name: item.name, price: item.price, image: item.image }, delta);
    setLimitError(result?.error && delta > 0 ? result.error : '');
  };

  const handleSelect = (product) => {
    if (!canAddMore(product.id)) return;
    const result = addToCart(product);
    setLimitError(result?.error || '');
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

      <div className="card" style={{ padding: '24px', marginBottom: 18, overflow: 'visible' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>Empaque actual: {selectedPackaging ? `${selectedPackaging.emoji} ${selectedPackaging.nombre}` : 'Sin empaque'}</p>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>El precio del empaque ya incluye el valor de los dulces: si necesitas más, vuelve al paso 1 y elige un empaque de mayor valor.</p>
          </div>
        </div>

        {selectedPackaging && (
          <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empaque seleccionado</p>
              <p style={{ fontWeight: 700 }}>{selectedPackaging.emoji} {selectedPackaging.nombre}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Límite disponible</p>
              <p style={{ fontWeight: 700 }}>${limit.toFixed(2)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor acumulado</p>
              <p style={{ fontWeight: 700 }}>${cartTotal.toFixed(2)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saldo restante</p>
              <p style={{ fontWeight: 700 }}>${remaining.toFixed(2)}</p>
            </div>
          </div>
        )}

        {limitError && (
          <div style={{ background: '#fdecea', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16, fontSize: '0.88rem' }}>
            {limitError}
          </div>
        )}

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
              const canAddByBudget = fitsInBudget(p.price);
              return (
                <div key={p.id} className="card catalog-product-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="catalog-product-card__image" style={{ background: 'linear-gradient(135deg, var(--pink-100), var(--brown-100))', padding: '18px', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={getImageSrc(p.image)} alt={p.name} onError={(e) => { e.currentTarget.src = getImageSrc(); }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px', display: 'block' }} />
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <div className="product-name-tooltip">
                        <h3 className="product-name-clamp" style={{ fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>{p.name}</h3>
                        <span className="product-name-tooltip__popup" role="tooltip">{p.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--pink-500)', whiteSpace: 'nowrap', flexShrink: 0 }}>${p.price.toFixed(2)}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 8 }}>{p.category}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: 12 }}>Stock: {p.stock} · {p.available ? 'Disponible' : 'Agotado'}</p>
                    {!p.available ? (
                      <span className="badge badge-danger" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 'auto' }}>Agotado</span>
                    ) : item ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
                        <button onClick={() => updateQty(item, -1)} className="btn btn-secondary btn-sm" style={{ width: 30, height: 30, padding: 0, justifyContent: 'center' }}><Minus size={13} /></button>
                        <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                        <button
                          onClick={() => updateQty(item, 1)}
                          className="btn btn-secondary btn-sm"
                          style={{ width: 30, height: 30, padding: 0, justifyContent: 'center', opacity: (canAddMore(p.id, item.qty) && canAddByBudget) ? 1 : 0.4, cursor: (canAddMore(p.id, item.qty) && canAddByBudget) ? 'pointer' : 'not-allowed' }}
                          disabled={!canAddMore(p.id, item.qty) || !canAddByBudget}
                          title={!canAddMore(p.id, item.qty) ? `Stock máximo (${p.stock})` : !canAddByBudget ? 'Excede el límite del empaque' : 'Agregar uno'}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', opacity: (canAddMore(p.id) && canAddByBudget) ? 1 : 0.5, cursor: (canAddMore(p.id) && canAddByBudget) ? 'pointer' : 'not-allowed' }}
                        onClick={() => handleSelect(p)}
                        disabled={!canAddMore(p.id) || !canAddByBudget}
                        title={!canAddByBudget ? 'Excede el límite del empaque' : undefined}
                      >
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
              cart.map(item => {
                const atStockLimit = !canAddMore(item.productId, item.qty);
                const atBudgetLimit = !fitsInBudget(item.price);
                return (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => updateQty(item, -1)} className="btn btn-secondary btn-sm" style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item, 1)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (atStockLimit || atBudgetLimit) ? 0.4 : 1, cursor: (atStockLimit || atBudgetLimit) ? 'not-allowed' : 'pointer' }}
                      disabled={atStockLimit || atBudgetLimit}
                      title={atStockLimit ? `Stock máximo (${getProductStock(item.productId)})` : atBudgetLimit ? 'Excede el límite del empaque' : 'Agregar uno'}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap', minWidth: 55, textAlign: 'right' }}>${(item.price * item.qty).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="btn btn-danger btn-sm" style={{ padding: '4px 6px', lineHeight: 1 }} title="Quitar">
                    <X size={13} />
                  </button>
                </div>
              );})
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
              <span>Valor de dulces</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
              <span>Empaque</span>
              <span>{selectedPackaging ? `${selectedPackaging.nombre} · $${selectedPackaging.precio.toFixed(2)}` : 'Sin empaque'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.95rem', fontWeight: 700 }}>
              <span>Total a cobrar</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Link to="/nuevo-pedido/empaque" className="btn btn-secondary" style={{ flex: 1 }}>Atrás</Link>
              <button type="button" className="btn btn-primary" style={{ flex: 1, opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }} disabled={cart.length === 0} onClick={() => navigate('/nuevo-pedido/datos')}>
                Siguiente <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
