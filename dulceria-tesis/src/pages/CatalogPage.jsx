import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, X } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='420' viewBox='0 0 600 420'%3E%3Crect width='600' height='420' fill='%23f9efe9'/%3E%3Ctext x='300' y='205' text-anchor='middle' fill='%238a7f77' font-family='Arial, sans-serif' font-size='26'%3ESin imagen%3C/text%3E%3C/svg%3E";

const getImageSrc = (image) => {
  if (!image) return FALLBACK_IMAGE;
  if (image.startsWith('http') || image.startsWith('data:')) return image;
  return encodeURI(image);
};

export default function CatalogPage() {
  const { products } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [detail, setDetail] = useState(null);

  const categories = ['Todos', ...CATEGORIES.filter(c => products.some(p => p.category === c))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todos' || p.category === category;
    return matchSearch && matchCat;
  });

  const openDetail = (p) => { setDetail(p); };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--gray-700)', marginBottom: 4 }}>Catálogo</h1>
        <p style={{ color: 'var(--gray-400)' }}>Descubre nuestros dulces tracionales de la ciudad de Cuenca</p>
      </div>

      {/* Search & filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-300)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar dulces..."
            style={{ paddingLeft: 36, padding: '10px 14px 10px 36px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)', width: '100%', fontSize: '0.9rem', outline: 'none', background: 'white' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <p>No encontramos productos con ese criterio</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onClick={() => openDetail(p)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ background: 'linear-gradient(135deg, var(--pink-100), var(--brown-100))', padding: '18px', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={getImageSrc(p.image)}
                  alt={p.name}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px', display: 'block' }}
                />
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>{p.name}</h3>
                  <span style={{ fontWeight: 700, color: 'var(--pink-500)', whiteSpace: 'nowrap', marginLeft: 8 }}>${p.price.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 10 }}>{p.category}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: 10 }}>Stock: {p.stock} · {p.available ? 'Disponible' : 'Agotado'}</p>
                {!p.available ? (
                  <span className="badge badge-danger" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>Agotado</span>
                ) : (
                  <span className="badge badge-success" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>Disponible</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, var(--pink-100), var(--brown-100))', padding: '18px', height: 280, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', marginTop: -32, marginLeft: -32, marginRight: -32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={getImageSrc(detail.image)}
                alt={detail.name}
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px', display: 'block' }}
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h2 style={{ fontSize: '1.4rem' }}>{detail.name}</h2>
                <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--gray-300)', fontSize: '1.2rem', cursor: 'pointer', padding: 4 }}>✕</button>
              </div>
              <span className="badge badge-gray" style={{ marginBottom: 12 }}>{detail.category}</span>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: 16 }}>{detail.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Precio unitario</span>
                <span style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--pink-500)' }}>${detail.price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Stock disponible</span>
                <span style={{ fontWeight: 700, color: detail.available ? 'var(--success)' : 'var(--danger)' }}>{detail.stock}</span>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: detail.available ? '#eef9f1' : '#fdecea', borderRadius: 'var(--radius-md)', color: detail.available ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                {detail.available ? 'Disponible para pedido desde Nuevo Pedido' : 'Producto agotado'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
