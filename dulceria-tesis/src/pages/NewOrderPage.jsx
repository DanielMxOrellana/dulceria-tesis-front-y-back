import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, ClipboardList, Package, ShoppingBag } from 'lucide-react';
import { ORDER_FLOW_STEPS } from '../utils/orderFlow';

export default function NewOrderPage() {
  const { cartCount } = useApp();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nuevo Pedido</h1>
          <p>Flujo dividido en páginas para que no se sienta cargado</p>
        </div>
        <Link to="/mis-pedidos" className="btn btn-secondary"><ClipboardList size={15} /> Mis pedidos</Link>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: 18 }}>
        <p style={{ color: 'var(--gray-400)', marginBottom: 6 }}>Productos seleccionados actualmente: {cartCount}</p>
        <h3 style={{ fontSize: '1.15rem', marginBottom: 10 }}>Sigue estos 3 pasos</h3>
        <p style={{ color: 'var(--gray-500)' }}>Primero elige el empaque, luego selecciona los productos y al final completa tus datos personales.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Link to="/nuevo-pedido/empaque" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 10 }}><Package size={28} /></div>
          <h3 style={{ marginBottom: 6 }}>1. Empaque</h3>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>Fundas, desechable/plástico o canastos.</p>
        </Link>

        <Link to="/nuevo-pedido/productos" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 10 }}><ShoppingBag size={28} /></div>
          <h3 style={{ marginBottom: 6 }}>2. Productos</h3>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>Selecciona los dulces y cantidades.</p>
        </Link>

        <Link to="/nuevo-pedido/datos" className="card" style={{ padding: '20px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 10 }}><ClipboardList size={28} /></div>
          <h3 style={{ marginBottom: 6 }}>3. Datos</h3>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>Nombre, teléfono, dirección y confirmación.</p>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/nuevo-pedido/empaque" className="btn btn-primary">
          Comenzar pedido <ArrowRight size={15} />
        </Link>
        {ORDER_FLOW_STEPS.map(step => (
          <Link key={step.path} to={step.path} className="btn btn-secondary">
            {step.label}
          </Link>
        ))}
      </div>
    </div>
  );
}