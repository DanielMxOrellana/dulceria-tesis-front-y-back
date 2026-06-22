import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ALL_PACKAGING_OPTIONS, ORDER_STEPS, PACKAGING_TYPES, getBestPackageForCount, getBestPackageForType, getPackagingsForType } from '../utils/orderFlow';

export default function NewOrderPackagingPage() {
  const { cartCount, orderDraft, updateOrderDraft } = useApp();
  const navigate = useNavigate();

  const selectedType = orderDraft.packagingType || 'fundas';
  const selectedPackaging = ALL_PACKAGING_OPTIONS.find(option => option.id === orderDraft.packagingId) || getBestPackageForCount(cartCount);
  const packagingOptions = getPackagingsForType(selectedType);

  useEffect(() => {
    const recommended = getBestPackageForType(selectedType, cartCount) || getBestPackageForCount(cartCount);
    // Solo aplicar la recomendación si aún no se ha seleccionado manualmente un empaque
    if (recommended && !orderDraft.packagingId) {
      updateOrderDraft({ packagingId: recommended.id });
    }
  }, [cartCount, selectedType, updateOrderDraft, orderDraft.packagingId]);

  const selectType = (typeKey) => {
    const recommended = getBestPackageForType(typeKey, cartCount) || getBestPackageForCount(cartCount);
    updateOrderDraft({
      packagingType: typeKey,
      packagingId: recommended?.id || '',
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nuevo Pedido</h1>
          <p>Paso 1 de {ORDER_STEPS.length}: elige el empaque</p>
        </div>
        <Link to="/mis-pedidos" className="btn btn-secondary"><ArrowLeft size={15} /> Mis pedidos</Link>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {ORDER_STEPS.map(step => (
            <span key={step.path} className="badge" style={{ background: step.path === '/nuevo-pedido/empaque' ? 'var(--pink-100)' : 'var(--gray-100)', color: step.path === '/nuevo-pedido/empaque' ? 'var(--pink-700)' : 'var(--gray-500)' }}>
              {step.label}
            </span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
          <div>
            <p style={{ color: 'var(--gray-400)', marginBottom: 12 }}>Cantidad actual de dulces: {cartCount}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
              {PACKAGING_TYPES.map(type => {
                const isActive = selectedType === type.key;
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => selectType(type.key)}
                    aria-pressed={isActive}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isActive ? 'var(--pink-400)' : 'var(--gray-200)'}`,
                      background: isActive ? 'var(--pink-50)' : 'white',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: isActive ? '0 6px 18px rgba(30, 79, 92, 0.10)' : 'none',
                    }}
                  >
                    {isActive && (
                      <span style={{ position: 'absolute', top: 8, right: 10, background: 'var(--pink-500)', color: 'white', borderRadius: 999, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                        ✓
                      </span>
                    )}
                    <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>{type.emoji}</div>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>{type.label}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{type.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {packagingOptions.map(option => {
              const isActive = orderDraft.packagingId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateOrderDraft({ packagingId: option.id })}
                  aria-pressed={isActive}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isActive ? 'var(--pink-400)' : 'var(--gray-200)'}`,
                    background: isActive ? 'var(--pink-50)' : 'white',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: isActive ? '0 8px 24px rgba(30, 79, 92, 0.10)' : 'none',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {isActive && (
                    <span style={{ position: 'absolute', top: 10, right: 12, background: 'var(--pink-500)', color: 'white', borderRadius: 999, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      ✓
                    </span>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 3 }}>{option.emoji} {option.nombre}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{option.descripcion}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--pink-500)', whiteSpace: 'nowrap' }}>${option.precio.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Capacidad: hasta {option.capacidadMax} dulces</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <Link to="/catalogo" className="btn btn-secondary">Ver catálogo</Link>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/nuevo-pedido/productos')}>
              Siguiente: Productos <ArrowRight size={15} />
            </button>
          </div>

          {selectedPackaging && (
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--gray-500)' }}>
              Empaque seleccionado: <strong>{selectedPackaging.emoji} {selectedPackaging.nombre}</strong> · capacidad hasta {selectedPackaging.capacidadMax} dulces
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
