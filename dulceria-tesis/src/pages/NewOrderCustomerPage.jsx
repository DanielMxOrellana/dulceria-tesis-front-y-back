import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, CheckCircle, ShoppingCart } from 'lucide-react';
import { ORDER_STEPS, getRecommendedPackaging, resolveSelectedPackaging } from '../utils/orderFlow';

export default function NewOrderCustomerPage() {
  const { cart, cartTotal, createOrder, currentUser, orderDraft, updateOrderDraft } = useApp();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.name) return;
    if (!orderDraft.customer.name) {
      updateOrderDraft({ customer: { name: currentUser.name } });
    }
  }, [currentUser, orderDraft.customer.name, updateOrderDraft]);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const [loading, setLoading] = useState(false);
  const selectedPackaging = resolveSelectedPackaging(orderDraft, totalItems);
  const packagingTotal = selectedPackaging?.precio || 0;
  const grandTotal = cartTotal + packagingTotal;

  useEffect(() => {
    const recommended = getRecommendedPackaging(orderDraft, totalItems);
    if (!recommended) return;

    const currentType = orderDraft.packagingType || 'fundas';
    if (recommended.id !== orderDraft.packagingId || recommended.tipo !== currentType) {
      updateOrderDraft({ packagingId: recommended.id, packagingType: recommended.tipo });
    }
  }, [orderDraft, totalItems, updateOrderDraft]);

  const confirm = async () => {
    const customer = orderDraft.customer || {};
    const trimmedName = customer.name?.trim();
    const trimmedPhone = customer.phone?.trim();
    const trimmedAddress = customer.address?.trim();
    const trimmedCedula = customer.cedula?.trim();
    const trimmedCity = customer.city?.trim() || 'Quito';

    if (!cart.length) {
      setError('Agrega productos antes de confirmar.');
      return;
    }

    if (!selectedPackaging) {
      setError('Selecciona un empaque antes de confirmar.');
      return;
    }

    if (!trimmedName || !trimmedPhone || !trimmedAddress || !trimmedCedula || !trimmedCity) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    // Validacion de Cedula (10 digitos)
    if (!/^\d{10}$/.test(trimmedCedula)) {
      setError('La cédula debe tener exactamente 10 dígitos.');
      return;
    }

    // Validacion de Telefono (Formato Ecuatoriano: 09XXXXXXXX o similar)
    if (!/^0\d{9}$/.test(trimmedPhone)) {
      setError('El teléfono debe tener 10 dígitos y empezar con 0 (ej: 0987654321).');
      return;
    }

    setError('');
    setLoading(true);
    const result = await createOrder({
      notes: orderDraft.notes || '',
      packaging: selectedPackaging,
      customer: {
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        reference: customer.reference?.trim() || '',
        cedula: trimmedCedula,
        city: trimmedCity,
      },
    });

    setLoading(false);
    if (result?.success) {
      setSuccess(result.order);
    } else {
      setError(result?.error || 'No se pudo procesar el pedido. Revisa el stock disponible.');
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
        <div style={{ color: 'var(--success)', marginBottom: 12 }}><CheckCircle size={40} /></div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>¡Pedido confirmado!</h2>
        <p style={{ color: 'var(--gray-400)', marginBottom: 6 }}>Tu pedido fue registrado exitosamente</p>
        {success.packaging && (
          <p style={{ color: 'var(--gray-500)', marginBottom: 6 }}>Empaque: {success.packaging.emoji} {success.packaging.nombre}</p>
        )}
        <p style={{ color: 'var(--pink-500)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 28 }}>ID: {success.id}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/mis-pedidos" className="btn btn-primary">Ver mis pedidos</Link>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/nuevo-pedido/empaque')}>Nuevo pedido</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nuevo Pedido</h1>
          <p>Paso 3 de {ORDER_STEPS.length}: ingresa tus datos y confirma</p>
        </div>
        <Link to="/nuevo-pedido/productos" className="btn btn-secondary"><ArrowLeft size={15} /> Volver a productos</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Datos personales</h3>

          <div className="form-group">
            <label>Nombre completo</label>
            <input value={orderDraft.customer.name} onChange={e => updateOrderDraft({ customer: { name: e.target.value } })} placeholder="Nombre de quien hace el pedido" />
          </div>

          <div className="form-group">
            <label>Cédula / RUC (10 dígitos)</label>
            <input value={orderDraft.customer.cedula} onChange={e => updateOrderDraft({ customer: { cedula: e.target.value } })} placeholder="1712345678" maxLength={10} />
          </div>

          <div className="form-group">
            <label>Teléfono (10 dígitos)</label>
            <input value={orderDraft.customer.phone} onChange={e => updateOrderDraft({ customer: { phone: e.target.value } })} placeholder="0987654321" maxLength={10} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Ciudad</label>
              <input value={orderDraft.customer.city} onChange={e => updateOrderDraft({ customer: { city: e.target.value } })} placeholder="Quito" />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input value={orderDraft.customer.address} onChange={e => updateOrderDraft({ customer: { address: e.target.value } })} placeholder="Calle y N°" />
            </div>
          </div>

          <div className="form-group">
            <label>Referencia extra</label>
            <input value={orderDraft.customer.reference} onChange={e => updateOrderDraft({ customer: { reference: e.target.value } })} placeholder="Piso, casa color, horario, etc." />
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label>Notas del pedido</label>
            <textarea value={orderDraft.notes} onChange={e => updateOrderDraft({ notes: e.target.value })} rows={3} placeholder="Ej: Sin nueces, para cumpleaños..." style={{ resize: 'none' }} />
          </div>

          {error && (
            <div style={{ background: '#fdecea', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 14, fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={confirm} className="btn btn-primary btn-lg" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Confirmando...' : (
                <><ShoppingCart size={17} /> Confirmar pedido</>
              )}
            </button>
            <Link to="/nuevo-pedido/productos" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Volver</Link>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 18 }}>Resumen</h3>

          {cart.map(item => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
              <span>{item.name} x{item.qty}</span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
            <span>Empaque</span>
            <span>{selectedPackaging ? `${selectedPackaging.emoji} ${selectedPackaging.nombre} · $${selectedPackaging.precio.toFixed(2)} · hasta ${selectedPackaging.capacidadMax} uds` : 'Sin empaque'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
            <span>Total estimado</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', color: 'var(--gray-500)', fontSize: '0.86rem' }}>
            Revisa bien tus datos antes de confirmar.
          </div>
        </div>
      </div>
    </div>
  );
}