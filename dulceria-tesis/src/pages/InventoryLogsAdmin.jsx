import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, FileText, RefreshCw, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const valueOf = (row, key) => row?.[key] ?? row?.[key.toUpperCase()];

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
};

const statusLabel = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const statusClass = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

export default function InventoryLogsAdmin() {
  const {
    inventoryMovements,
    fetchInventoryMovements,
    approveInventoryMovement,
    rejectInventoryMovement,
  } = useApp();
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  useEffect(() => {
    fetchInventoryMovements();
  }, []);

  const movements = useMemo(() => {
    const rows = Array.isArray(inventoryMovements) ? inventoryMovements : [];
    if (filter === 'all') return rows;
    return rows.filter((row) => valueOf(row, 'status') === filter);
  }, [inventoryMovements, filter]);

  const pendingCount = inventoryMovements.filter((row) => valueOf(row, 'status') === 'pending').length;

  const approve = async (id) => {
    setProcessingId(id);
    setError('');
    const result = await approveInventoryMovement(id);
    if (result?.error) setError(result.error);
    setProcessingId(null);
  };

  const reject = async () => {
    if (!rejectModal) return;
    const { id, rejectionNote } = rejectModal;
    setProcessingId(id);
    setError('');
    const result = await rejectInventoryMovement(id, rejectionNote);
    if (result?.error) setError(result.error);
    else setRejectModal(null);
    setProcessingId(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Logs de inventario</h1>
          <p>Movimientos de stock, notas y solicitudes pendientes de aprobación.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchInventoryMovements}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef8e7', color: 'var(--warning)' }}><Clock size={22} /></div>
          <div className="stat-info"><p>Pendientes</p><h3>{pendingCount}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f8f0', color: 'var(--success)' }}><CheckCircle2 size={22} /></div>
          <div className="stat-info"><p>Aprobados</p><h3>{inventoryMovements.filter((row) => valueOf(row, 'status') === 'approved').length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fdecea', color: 'var(--danger)' }}><XCircle size={22} /></div>
          <div className="stat-info"><p>Rechazados</p><h3>{inventoryMovements.filter((row) => valueOf(row, 'status') === 'rejected').length}</h3></div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            ['all', 'Todos'],
            ['pending', 'Pendientes'],
            ['approved', 'Aprobados'],
            ['rejected', 'Rechazados'],
          ].map(([key, label]) => (
            <button key={key} className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
          {error && <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</span>}
        </div>

        {movements.length === 0 ? (
          <div className="empty-state">
            <FileText size={42} />
            <p>No hay movimientos para mostrar.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Movimiento</th>
                  <th>Cantidades</th>
                  <th>Actor</th>
                  <th>Nota</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((row) => {
                  const id = Number(valueOf(row, 'id'));
                  const status = valueOf(row, 'status');
                  const delta = Number(valueOf(row, 'delta') || 0);
                  return (
                    <tr key={id}>
                      <td>
                        <strong>{valueOf(row, 'candy_name')}</strong>
                        <p className="text-muted">ID {valueOf(row, 'candy_id')}</p>
                      </td>
                      <td>
                        <span className={`badge ${delta > 0 ? 'badge-success' : delta < 0 ? 'badge-danger' : 'badge-info'}`}>
                          {valueOf(row, 'movement_type')}
                        </span>
                      </td>
                      <td>{valueOf(row, 'quantity_before')} -> {valueOf(row, 'quantity_after')} ({delta > 0 ? '+' : ''}{delta})</td>
                      <td>
                        <strong>{valueOf(row, 'actor_name') || 'Sistema'}</strong>
                        <p className="text-muted">{valueOf(row, 'actor_role')}</p>
                      </td>
                      <td style={{ minWidth: 220 }}>
                        <p>{valueOf(row, 'note')}</p>
                        {status === 'rejected' && valueOf(row, 'rejection_note') && (
                          <p style={{ marginTop: 6, color: 'var(--danger)', fontSize: '0.85rem' }}>
                            <strong>Rechazo:</strong> {valueOf(row, 'rejection_note')}
                          </p>
                        )}
                      </td>
                      <td><span className={`badge ${statusClass[status] || 'badge-gray'}`}>{statusLabel[status] || status}</span></td>
                      <td>{formatDate(valueOf(row, 'requested_at'))}</td>
                      <td>
                        {status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-success btn-sm" disabled={processingId === id} onClick={() => approve(id)}>
                              <CheckCircle2 size={14} /> Aprobar
                            </button>
                            <button className="btn btn-danger btn-sm" disabled={processingId === id} onClick={() => setRejectModal({ id, productName: valueOf(row, 'candy_name'), rejectionNote: '' })}>
                              <XCircle size={14} /> Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">{valueOf(row, 'approved_by_name') || 'Procesado'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => processingId !== rejectModal.id && setRejectModal(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Rechazar movimiento</h2>
                <p className="section-subtitle">{rejectModal.productName}</p>
              </div>
              <button className="btn btn-secondary btn-sm" disabled={processingId === rejectModal.id} onClick={() => setRejectModal(null)}>
                <XCircle size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Motivo del rechazo</label>
                <textarea
                  rows={4}
                  value={rejectModal.rejectionNote}
                  onChange={(event) => setRejectModal((prev) => ({ ...prev, rejectionNote: event.target.value }))}
                  placeholder="Ej. Cantidad no coincide con soporte, solicitud duplicada, falta evidencia..."
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" disabled={processingId === rejectModal.id} onClick={() => setRejectModal(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" disabled={processingId === rejectModal.id} onClick={reject}>
                <XCircle size={14} /> Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
