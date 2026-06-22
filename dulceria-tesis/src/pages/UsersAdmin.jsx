import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, ShieldOff, Shield, Plus, X } from 'lucide-react';

const ROLE_COLORS = {
  admin: '#D6E8EC',
  cliente: '#eaf4fd',
  vendor: '#e8f8f0'
};

const ROLE_LABELS = {
  admin: 'Administrador',
  cliente: 'Cliente',
  vendor: 'Vendedor'
};

export default function UsersAdmin() {
  const { users, toggleUserBlock, createUser, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cliente' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!form.email.includes('@')) {
      setError('El correo no es válido');
      return;
    }

    const result = createUser(form.name, form.email, form.password, form.role);

    if (result.error) {
      setError(result.error);
    } else {
      setForm({ name: '', email: '', password: '', role: 'cliente' });
      setShowForm(false);
      setError('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Usuarios</h1><p>{users.length} usuarios registrados</p></div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0066cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          <Plus size={18} /> Crear Usuario
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #f88', color: '#c33', padding: 12, borderRadius: 6, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c33', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>Nuevo Usuario</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              type="text"
              placeholder="Nombre completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.9rem' }}
            >
              <option value="cliente">Cliente</option>
              <option value="vendor">Vendedor</option>
            </select>
            <button
              type="submit"
              style={{ gridColumn: '1 / -1', padding: '10px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}
            >
              Crear Usuario
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          {users.length === 0 ? (
            <div className="empty-state"><Users size={40} /><p>No hay usuarios registrados</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Fecha de registro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--primary-dark))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {(u.name || u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name || u.full_name || 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.88rem' }}>{u.email}</td>
                    <td>
                      <span style={{ background: ROLE_COLORS[u.role] || ROLE_COLORS.cliente, color: 'var(--gray-700)', padding: '4px 12px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, display: 'inline-block' }}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>{u.joinDate}</td>
                    <td>
                      <span className={`badge ${u.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u.id !== currentUser?.id && (
                        <button
                          className={`btn btn-sm ${u.status === 'activo' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleUserBlock(u.id)}
                        >
                          {u.status === 'activo' ? <><ShieldOff size={13} /> Bloquear</> : <><Shield size={13} /> Desbloquear</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
