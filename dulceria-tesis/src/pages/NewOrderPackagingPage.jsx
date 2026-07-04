import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ORDER_STEPS, PACKAGING_TYPES, getPackagingsForType, getSelectedPackaging } from '../utils/orderFlow';

export default function NewOrderPackagingPage() {
  const { cartTotal, orderDraft, updateOrderDraft } = useApp();
  const navigate = useNavigate();
  const [downgradeError, setDowngradeError] = useState('');

  const selectedType = orderDraft.packagingType || 'fundas';
  const selectedPackaging = getSelectedPackaging(orderDraft);
  const packagingOptions = getPackagingsForType(selectedType);

  const selectType = (typeKey) => {
    const options = getPackagingsForType(typeKey);
    const firstThatFits = options.find(option => option.precio + 0.001 >= cartTotal) || options[0];
    updateOrderDraft({
      packagingType: typeKey,
      preferredPackagingType: typeKey,
      packagingId: firstThatFits?.id || '',
    });
    setDowngradeError('');
  };

  const selectPackaging = (option) => {
    if (option.precio + 0.001 < cartTotal) {
      setDowngradeError(`Ya agregaste $${cartTotal.toFixed(2)} en dulces. Este empaque solo permite hasta $${option.precio.toFixed(2)}.`);
      return;
    }
    setDowngradeError('');
    updateOrderDraft({
      packagingId: option.id,
      preferredPackagingType: selectedType,
    });
  };

  const limit = selectedPackaging?.precio || 0;
  const remaining = Math.max(0, limit - cartTotal);

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
          <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem' }}>
              Cada empaque incluye un valor máximo en dulces: el precio del empaque ya cubre esos dulces, así que solo se cobra el valor del empaque.
            </p>
          </div>

          <div>
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

          {downgradeError && (
            <div style={{ background: '#fdecea', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: '0.88rem' }}>
              {downgradeError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {packagingOptions.map(option => {
              const isActive = orderDraft.packagingId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectPackaging(option)}
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Incluye hasta ${option.precio.toFixed(2)} en dulces</div>
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
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '14px 16px', color: 'var(--gray-500)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empaque seleccionado</p>
                <p style={{ fontWeight: 700, color: 'var(--gray-700)' }}>{selectedPackaging.emoji} {selectedPackaging.nombre}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Límite disponible</p>
                <p style={{ fontWeight: 700, color: 'var(--gray-700)' }}>${limit.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor acumulado</p>
                <p style={{ fontWeight: 700, color: 'var(--gray-700)' }}>${cartTotal.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saldo restante</p>
                <p style={{ fontWeight: 700, color: 'var(--gray-700)' }}>${remaining.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
