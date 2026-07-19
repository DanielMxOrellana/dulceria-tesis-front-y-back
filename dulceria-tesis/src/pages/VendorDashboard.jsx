import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  Edit3,
  Eye,
  Package,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { CATEGORIES, STATUS_COLORS } from '../data/mockData';
import { getOrderPackagingTotal } from '../utils/orderFlow';
import { api } from '../services/api';
import './VendorDashboard.css';

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  stock: '',
  minStock: '',
  description: '',
  image: '',
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function VendorDashboard({ section = 'dashboard' }) {
  const {
    products,
    orders,
    users,
    currentUser,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    updateOrderStatus,
    complaints,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [pendingProductData, setPendingProductData] = useState(null);
  const [rejectConfirmOrder, setRejectConfirmOrder] = useState(null);
  const [rejectOrderReason, setRejectOrderReason] = useState('');
  const [rejectOrderError, setRejectOrderError] = useState('');
  const [stockMessage, setStockMessage] = useState('');
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockRequest, setStockRequest] = useState(null);
  const [activeOrderTab, setActiveOrderTab] = useState('pendientes');

  const vendorProducts = useMemo(
    () => products,
    [products]
  );

  const vendorProductIds = useMemo(
    () => new Set(vendorProducts.map((product) => product.id)),
    [vendorProducts]
  );

  const vendorOrders = useMemo(() => {
    return orders
      .map((order) => {
        const vendorItems = order.items.filter((item) => vendorProductIds.has(item.productId));
        const vendorItemsTotal = vendorItems.reduce((sum, item) => sum + item.price * item.qty, 0);
        const packagingTotal = getOrderPackagingTotal(order);
        const vendorTotal = vendorItemsTotal + packagingTotal;
        const client = users.find((user) => user.id === order.clientId);

        return {
          ...order,
          vendorItems,
          vendorItemsTotal,
          packagingTotal,
          vendorTotal,
          clientEmail: client?.email || 'No registrado',
          customer: {
            name: order.customer?.name || order.clientName || client?.name || 'Cliente',
            phone: order.customer?.phone || 'No registrado',
            deliveryType: order.customer?.deliveryType === 'retiro' ? 'retiro' : 'domicilio',
            address: order.customer?.address || (order.customer?.deliveryType === 'retiro' ? '' : 'No registrada'),
            reference: order.customer?.reference || (order.customer?.deliveryType === 'retiro' ? '' : 'Sin referencia'),
          },
        };
      })
      .filter((order) => order.vendorItems.length > 0);
  }, [orders, users, vendorProductIds]);

  const deliveredVendorOrders = useMemo(
    () => vendorOrders.filter((order) => order.status === 'entregado'),
    [vendorOrders]
  );

  const lowStockProducts = vendorProducts.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock
  );
  const outOfStockProducts = vendorProducts.filter((product) => product.stock === 0);
  const totalSales = deliveredVendorOrders.reduce((sum, order) => sum + order.vendorTotal, 0);
  const pendingOrdersList = vendorOrders.filter((order) => order.status === 'pendiente');
  const prepOrdersList = vendorOrders.filter((order) => ['aceptado', 'en preparacion', 'listo'].includes(order.status));
  const closedOrdersList = vendorOrders.filter((order) => ['entregado', 'rechazado', 'cancelado'].includes(order.status));

  const vendorComplaintOrders = vendorOrders.filter((order) => {
    return complaints?.some(c => c.order_id === order.id && c.status === 'open');
  });

  const pendingOrders = pendingOrdersList.length;

  const stats = [
    { label: 'Productos publicados', value: vendorProducts.length, icon: Package },
    { label: 'Pedidos recibidos', value: vendorOrders.length, icon: ClipboardList },
    { label: 'Ventas acumuladas', value: money(totalSales), icon: TrendingUp },
    { label: 'Stock bajo', value: lowStockProducts.length + outOfStockProducts.length, icon: AlertTriangle },
  ];

  const pageTitles = {
    dashboard: {
      title: 'Panel del vendedor',
      subtitle: 'Resumen de tus productos, pedidos, inventario y ventas.',
    },
    pedidos: {
      title: 'Pedidos',
      subtitle: 'Gestiona los pedidos que contienen tus productos.',
    },
    productos: {
      title: 'Productos',
      subtitle: 'Agrega, edita y elimina tus productos publicados.',
    },
    inventario: {
      title: 'Inventario',
      subtitle: 'Actualiza stock y controla alertas de inventario bajo.',
    },
    estadisticas: {
      title: 'Estadisticas',
      subtitle: 'Consulta ventas, pedidos y rendimiento de tu catalogo.',
    },
  };

  const currentPage = pageTitles[section] || pageTitles.dashboard;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  };

  const openNewProductForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditProductForm = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description || '',
      image: product.image || '',
    });
    setEditingId(product.id);
    setShowForm(true);
    setError('');
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    try {
      const response = await api.uploadImage(file);
      if (response && response.ok) {
        handleFormChange('image', response.imageUrl);
      } else {
        setError(response?.error || 'Falló la subida de la imagen.');
      }
    } catch (err) {
      setError('Error al subir la imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const price = Number(form.price);
    const stock = Number.parseInt(form.stock, 10);
    const minStock = Number.parseInt(form.minStock, 10);

    if (!form.name.trim() || !form.category || Number.isNaN(price) || Number.isNaN(stock)) {
      setError('Completa nombre, categoria, precio y stock.');
      return;
    }

    if (price <= 0) {
      setError('El precio debe ser mayor a 0.');
      return;
    }

    if (stock < 0 || minStock < 0) {
      setError('Los valores numéricos no pueden ser negativos.');
      return;
    }

    const currentWarnings = [];
    if (stock === 0) currentWarnings.push("El stock actual es 0 (el producto aparecerá como agotado).");
    if (minStock === 0 || Number.isNaN(minStock)) currentWarnings.push("El stock mínimo es 0 (no recibirás alertas de reabastecimiento).");
    if (!form.description || !form.description.trim()) currentWarnings.push("No has agregado una descripción.");
    if (!form.image || form.image.trim() === '/img/dulces/logo.jpg' || form.image.trim() === '') currentWarnings.push("No has adjuntado una imagen personalizada.");

    const productData = {
      name: form.name.trim(),
      category: form.category,
      price,
      stock,
      minStock: Number.isNaN(minStock) ? 0 : minStock,
      description: form.description.trim(),
      image: form.image.trim() || '/img/dulces/logo.jpg',
      vendorId: currentUser.id,
      vendorName: currentUser.name,
      disponible: stock > 0,
      available: stock > 0,
    };

    if (currentWarnings.length > 0) {
      setWarnings(currentWarnings);
      setPendingProductData(productData);
      setShowWarningsModal(true);
      return;
    }

    executeSave(productData);
  };

  const executeSave = (productData) => {
    if (editingId) {
      const currentProduct = products.find((product) => product.id === editingId);
      if (currentProduct && Number(currentProduct.stock) !== Number(productData.stock)) {
        openStockRequest(currentProduct, Number(productData.stock), { productData });
        setShowWarningsModal(false);
        setPendingProductData(null);
        setWarnings([]);
        return;
      } else {
        updateProduct(editingId, productData);
      }
    }
    else addProduct(productData);

    resetForm();
    setShowForm(false);
    setShowWarningsModal(false);
    setPendingProductData(null);
    setWarnings([]);
  };

  const openStockRequest = (product, requestedStock, extra = {}) => {
    if (!product || Number.isNaN(Number(requestedStock))) return;
    const nextStock = Math.max(0, Number.parseInt(requestedStock, 10));
    if (Number(product.stock) === nextStock) return;
    setStockRequest({
      product,
      requestedStock: nextStock,
      note: '',
      error: '',
      isSubmitting: false,
      productData: extra.productData || null,
    });
  };

  const closeStockRequest = () => {
    if (stockRequest?.product?.id) {
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[stockRequest.product.id];
        return next;
      });
    }
    setStockRequest(null);
  };

  const submitStockRequest = async () => {
    if (!stockRequest) return;
    const note = stockRequest.note.trim();
    if (!note) {
      setStockRequest((prev) => ({ ...prev, error: 'La nota es obligatoria para solicitar el movimiento.' }));
      return;
    }

    setStockRequest((prev) => ({ ...prev, isSubmitting: true, error: '' }));

    const result = stockRequest.productData
      ? await updateProduct(editingId, { ...stockRequest.productData, note })
      : await updateStock(stockRequest.product.id, stockRequest.requestedStock, note);

    if (result?.error) {
      setStockRequest((prev) => ({ ...prev, isSubmitting: false, error: result.error }));
      return;
    }

    setStockDrafts((prev) => {
      const next = { ...prev };
      delete next[stockRequest.product.id];
      return next;
    });
    setStockMessage('Solicitud enviada al administrador. El stock cambiará cuando sea aprobada.');
    setStockRequest(null);

    if (stockRequest.productData) {
      resetForm();
      setShowForm(false);
      setPendingProductData(null);
      setWarnings([]);
    }
  };

  const handleStockChange = (productId, value) => {
    setStockDrafts((prev) => ({ ...prev, [productId]: value }));
  };

  const commitStockDraft = (product) => {
    const value = stockDrafts[product.id];
    if (value === undefined || value === '') return;
    const qty = Number.parseInt(value, 10);
    if (Number.isNaN(qty) || qty < 0) {
      setStockMessage('Ingresa una cantidad válida para solicitar el movimiento.');
      return;
    }
    if (Number(product.stock) === qty) {
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      return;
    }
    openStockRequest(product, qty);
  };

  const handleMinStockChange = (product, value) => {
    const minStock = Number.parseInt(value, 10);
    if (!Number.isNaN(minStock) && minStock >= 0) updateProduct(product.id, { minStock });
  };

  const updateOrder = async (order, status, reason = '') => {
    const extraPayload = {};
    if (status === 'en preparacion' || status === 'preparado') {
      extraPayload.attendedById = currentUser?.id;
      extraPayload.attendedByName = currentUser?.name;
    } else if (status === 'entregado') {
      extraPayload.dispatchedById = currentUser?.id;
      extraPayload.dispatchedByName = currentUser?.name;
    }
    const result = await updateOrderStatus(order.id, status, reason, extraPayload);
    if (!result?.error) {
      setSelectedOrder((current) => (current?.id === order.id ? { ...current, status, ...extraPayload } : current));
    }
    return result;
  };

  const liveSelectedOrder = selectedOrder
    ? vendorOrders.find((order) => order.id === selectedOrder.id) || selectedOrder
    : null;

  const requestRejectOrder = (order) => {
    setRejectConfirmOrder(order);
    setRejectOrderReason('');
    setRejectOrderError('');
  };

  const confirmRejectOrder = async () => {
    if (!rejectConfirmOrder) return;
    if (!rejectOrderReason.trim()) {
      setRejectOrderError('El motivo del rechazo es obligatorio.');
      return;
    }
    const result = await updateOrder(rejectConfirmOrder, 'rechazado', rejectOrderReason.trim());
    if (result?.error) {
      setRejectOrderError(result.error);
      return;
    }
    setRejectConfirmOrder(null);
    setRejectOrderReason('');
    setRejectOrderError('');
  };

  const renderOrderActions = (order) => (
    <div className="actions-cell">
      {order.status === 'pendiente' && (
        <>
          <button className="btn btn-success btn-sm" onClick={() => updateOrder(order, 'aceptado')}>
            <CheckCircle2 size={14} /> Aceptar
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => requestRejectOrder(order)}>
            <XCircle size={14} /> Rechazar
          </button>
        </>
      )}
      {order.status === 'aceptado' && (
        <button className="btn btn-primary btn-sm" onClick={() => updateOrder(order, 'en preparacion')}>
          <ChefHat size={14} /> Preparar
        </button>
      )}
      {order.status === 'en preparacion' && (
        <button className="btn btn-primary btn-sm" onClick={() => updateOrder(order, 'listo')}>
          <CheckCircle2 size={14} /> Listo
        </button>
      )}
      {order.status === 'listo' && (
        <button className="btn btn-success btn-sm" onClick={() => updateOrder(order, 'entregado')}>
          <Truck size={14} /> Entregar
        </button>
      )}
      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(order)}>
        <Eye size={14} /> Detalle
      </button>
    </div>
  );

  return (
    <div className="vendor-dashboard">
      <div className="vendor-dashboard__top">
        <div>
          <h1>{currentPage.title}</h1>
          <p>{currentPage.subtitle}</p>
        </div>
        {(section === 'dashboard' || section === 'productos') && (
          <button className="btn btn-primary" onClick={openNewProductForm}>
            <Plus size={18} /> Agregar producto
          </button>
        )}
      </div>

      {(section === 'dashboard' || section === 'estadisticas') && (
        <div className="vendor-dashboard__stats">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon"><Icon size={22} /></div>
              <div className="stat-info">
                <p>{label}</p>
                <h3>{value}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {(section === 'dashboard' || section === 'inventario') && (lowStockProducts.length > 0 || outOfStockProducts.length > 0 || pendingOrders > 0) && (
        <div className="vendor-alerts">
          {pendingOrders > 0 && <span><ClipboardList size={16} /> {pendingOrders} pedidos pendientes por responder</span>}
          {lowStockProducts.length > 0 && <span><AlertTriangle size={16} /> {lowStockProducts.length} productos llegaron al stock minimo</span>}
          {outOfStockProducts.length > 0 && <span><XCircle size={16} /> {outOfStockProducts.length} productos agotados</span>}
        </div>
      )}

      {stockMessage && (
        <div className="vendor-alerts">
          <span><Clock size={16} /> {stockMessage}</span>
        </div>
      )}

      {showForm && (section === 'dashboard' || section === 'productos') && (
        <section className="card vendor-dashboard__form">
          <div className="section-head">
            <div>
              <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
              <p className="section-subtitle">Define precio, inventario y alerta de stock minimo.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
              <X size={18} /> Cerrar
            </button>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit} className="vendor-dashboard__product-form">
            <div className="form-group">
              <label>Nombre</label>
              <input value={form.name} onChange={(event) => handleFormChange('name', event.target.value)} placeholder="Ej. Quesitos de manjar" />
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <select value={form.category} onChange={(event) => handleFormChange('category', event.target.value)}>
                <option value="">Seleccionar categoria</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Precio</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => handleFormChange('price', event.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Stock actual</label>
              <input type="number" min="0" value={form.stock} onChange={(event) => handleFormChange('stock', event.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Stock minimo</label>
              <input type="number" min="0" value={form.minStock} onChange={(event) => handleFormChange('minStock', event.target.value)} placeholder="10" />
            </div>
            <div className="form-group">
              <label>Imagen del producto</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {isUploading && <span style={{ color: 'var(--primary)' }}>Subiendo imagen...</span>}
              {form.image && !isUploading && (
                <div style={{ marginTop: '10px' }}>
                  <img src={form.image} alt="Vista previa" style={{ maxWidth: '100px', borderRadius: '8px' }} />
                </div>
              )}
            </div>
            <div className="form-group form-group--wide">
              <label>Descripcion</label>
              <textarea rows={3} value={form.description} onChange={(event) => handleFormChange('description', event.target.value)} placeholder="Detalle para que el cliente reconozca el producto" />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> {editingId ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </form>
        </section>
      )}

      {section === 'dashboard' && (
        <section className="vendor-dashboard__section card">
          <div className="section-head">
            <div>
              <h2>Actividad reciente</h2>
              <p className="section-subtitle">Una vista rapida de lo que requiere tu atencion.</p>
            </div>
          </div>
          <div className="vendor-summary-grid">
            <div className="summary-panel">
              <h3>Pedidos pendientes</h3>
              <p>{pendingOrders}</p>
            </div>
            <div className="summary-panel">
              <h3>Productos con alerta</h3>
              <p>{lowStockProducts.length + outOfStockProducts.length}</p>
            </div>
            <div className="summary-panel">
              <h3>Ultimo pedido</h3>
              <p>{vendorOrders[0]?.id || 'Sin pedidos'}</p>
            </div>
          </div>
        </section>
      )}

      {section === 'pedidos' && (
        <section className="vendor-dashboard__section card" id="pedidos">
          <div className="section-head">
            <div>
              <h2>Pedidos recibidos</h2>
              <p className="section-subtitle">Solo aparecen pedidos que contienen tus productos.</p>
            </div>
          </div>

          <div className="vendor-tabs">
            <button
              className={`vendor-tab ${activeOrderTab === 'pendientes' ? 'active' : ''}`}
              onClick={() => setActiveOrderTab('pendientes')}
            >
              Pendientes <span className="tab-badge">{pendingOrdersList.length}</span>
            </button>
            <button
              className={`vendor-tab ${activeOrderTab === 'preparacion' ? 'active' : ''}`}
              onClick={() => setActiveOrderTab('preparacion')}
            >
              En Preparación <span className="tab-badge">{prepOrdersList.length}</span>
            </button>
            <button
              className={`vendor-tab ${activeOrderTab === 'despachados' ? 'active' : ''}`}
              onClick={() => setActiveOrderTab('despachados')}
            >
              Despachados / Cerrados <span className="tab-badge">{closedOrdersList.length}</span>
            </button>
            <button
              className={`vendor-tab ${activeOrderTab === 'reclamos' ? 'active' : ''}`}
              onClick={() => setActiveOrderTab('reclamos')}
            >
              Con Reclamos <span className="tab-badge" style={{ background: 'var(--danger)', color: 'white' }}>{vendorComplaintOrders.length}</span>
            </button>
          </div>

          {[
            { id: 'pendientes', list: pendingOrdersList, emptyMessage: 'No hay pedidos pendientes.' },
            { id: 'preparacion', list: prepOrdersList, emptyMessage: 'No hay pedidos en preparación.' },
            { id: 'despachados', list: closedOrdersList, emptyMessage: 'No hay pedidos entregados o cerrados.' },
            { id: 'reclamos', list: vendorComplaintOrders, emptyMessage: 'No tienes pedidos con reclamos abiertos.' }
          ].map((tabConfig) => activeOrderTab === tabConfig.id && (
            <div key={tabConfig.id}>
              {tabConfig.list.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '20px' }}>
                  <ClipboardList size={42} />
                  <h3>{tabConfig.emptyMessage}</h3>
                </div>
              ) : (
                <div className="table-container" style={{ marginTop: '20px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Productos</th>
                        <th>Total pedido</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabConfig.list.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.id}</strong>
                            {(() => {
                              const activeComplaint = complaints?.find(c => c.order_id === (order.dbId || order.id));
                              if (activeComplaint && activeComplaint.status === 'open') {
                                return (
                                  <div style={{ marginTop: '4px' }}>
                                    <span className="badge" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '2px 6px', fontSize: '0.65rem' }}>Reclamo abierto</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td>
                            <strong>{order.customer.name}</strong>
                            <p className="text-muted">{order.customer.phone}</p>
                          </td>
                          <td>{order.vendorItems.length} productos</td>
                          <td>{money(order.vendorTotal)}</td>
                          <td><span className={`badge ${STATUS_COLORS[order.status] || 'badge-info'}`}>{order.status}</span></td>
                          <td>{order.date}</td>
                          <td>{renderOrderActions(order)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {section === 'productos' && (
        <section className="vendor-dashboard__section card" id="productos">
          <div className="section-head">
            <div>
              <h2>Gestionar productos</h2>
              <p className="section-subtitle">Agrega, edita, elimina y actualiza el stock de tus publicaciones.</p>
            </div>
            <div className="section-tag">{vendorProducts.length} productos</div>
          </div>

          {vendorProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={42} />
              <h3>No tienes productos publicados</h3>
              <p>Crea tu primer producto para empezar a recibir pedidos.</p>
              <button className="btn btn-primary" onClick={openNewProductForm}>Crear producto</button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoria</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Stock minimo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-avatar">
                            {product.image?.startsWith('/') || product.image?.startsWith('http') ? (
                              <img src={product.image} alt={product.name} />
                            ) : (
                              <span>{product.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <p className="text-muted">{product.description || 'Sin descripcion'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{money(product.price)}</td>
                      <td>
                        <input
                          className="stock-input"
                          type="number"
                          min="0"
                          value={stockDrafts[product.id] ?? product.stock}
                          onChange={(event) => handleStockChange(product.id, event.target.value)}
                          onBlur={() => commitStockDraft(product)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input className="stock-input" type="number" min="0" value={product.minStock} onChange={(event) => handleMinStockChange(product, event.target.value)} />
                      </td>
                      <td>
                        <span className={`badge ${product.stock === 0 ? 'badge-danger' : product.stock <= product.minStock ? 'badge-warning' : 'badge-success'}`}>
                          {product.stock === 0 ? 'Agotado' : product.stock <= product.minStock ? 'Stock bajo' : 'Disponible'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditProductForm(product)}>
                          <Edit3 size={14} /> Editar
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('¿Desactivar este producto? Se ocultará del catálogo pero permanecerá en la base de datos.')) deleteProduct(product.id); }}>
                          <Trash2 size={14} /> Desactivar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {section === 'inventario' && (
        <section className="vendor-dashboard__section card" id="inventario">
          <div className="section-head">
            <div>
              <h2>Control de inventario</h2>
              <p className="section-subtitle">Stock actual y alertas segun el minimo configurado.</p>
            </div>
            <div className="section-tag">{lowStockProducts.length + outOfStockProducts.length} alertas</div>
          </div>

          <div className="inventory-grid">
            {vendorProducts.map((product) => (
              <div key={product.id} className={`inventory-item ${product.stock <= product.minStock ? 'inventory-item--alert' : ''}`}>
                <div>
                  <strong>{product.name}</strong>
                  <p className="text-muted">Minimo: {product.minStock} unidades</p>
                </div>
                <div className="inventory-controls">
                  <button className="btn btn-secondary btn-sm" onClick={() => openStockRequest(product, Math.max(0, product.stock - 1))}>-1</button>
                  <input
                    className="stock-input"
                    type="number"
                    min="0"
                    value={stockDrafts[product.id] ?? product.stock}
                    onChange={(event) => handleStockChange(product.id, event.target.value)}
                    onBlur={() => commitStockDraft(product)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur();
                      }
                    }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => openStockRequest(product, product.stock + 1)}>+1</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === 'estadisticas' && (
        <section className="vendor-dashboard__section card" id="estadisticas">
          <div className="section-head">
            <div>
              <h2>Detalle de estadisticas</h2>
              <p className="section-subtitle">Indicadores clave de ventas, pedidos e inventario.</p>
            </div>
          </div>



          {/* Order status breakdown */}
          <h3 style={{ marginTop: 24, marginBottom: 12 }}>Pedidos por estado</h3>
          <div className="vendor-summary-grid">
            {[
              { label: 'Pendientes', status: 'pendiente', color: 'badge-warning' },
              { label: 'Aceptados', status: 'aceptado', color: 'badge-info' },
              { label: 'En preparación', status: 'en preparacion', color: 'badge-info' },
              { label: 'Listos', status: 'listo', color: 'badge-success' },
              { label: 'Entregados', status: 'entregado', color: 'badge-success' },
              { label: 'Rechazados', status: 'rechazado', color: 'badge-danger' },
            ].map(({ label, status, color }) => (
              <div key={status} className="summary-panel">
                <h3>{label}</h3>
                <p>
                  <span className={`badge ${color}`}>
                    {vendorOrders.filter((o) => o.status === status).length}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* Top products table */}
          <h3 style={{ marginTop: 24, marginBottom: 12 }}>Rendimiento de productos</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidades vendidas</th>
                  <th>Ingresos</th>
                  <th>Stock actual</th>
                  <th>Stock minimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {vendorProducts.map((product) => {
                  const soldQty = deliveredVendorOrders.reduce((sum, order) => {
                    const item = order.vendorItems.find((i) => i.productId === product.id);
                    return sum + (item ? item.qty : 0);
                  }, 0);
                  const revenue = deliveredVendorOrders.reduce((sum, order) => {
                    const item = order.vendorItems.find((i) => i.productId === product.id);
                    return sum + (item ? item.qty * item.price : 0);
                  }, 0);
                  return (
                    <tr key={product.id}>
                      <td><strong>{product.name}</strong></td>
                      <td>{soldQty}</td>
                      <td>{money(revenue)}</td>
                      <td>{product.stock}</td>
                      <td>{product.minStock}</td>
                      <td>
                        <span className={`badge ${product.stock === 0 ? 'badge-danger' : product.stock <= product.minStock ? 'badge-warning' : 'badge-success'}`}>
                          {product.stock === 0 ? 'Agotado' : product.stock <= product.minStock ? 'Stock bajo' : 'Disponible'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}


      {stockRequest && (
        <div className="modal-overlay" onClick={() => !stockRequest.isSubmitting && closeStockRequest()}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Solicitar movimiento de stock</h2>
                <p className="section-subtitle">{stockRequest.product.name}</p>
              </div>
              <button className="btn btn-secondary btn-sm" disabled={stockRequest.isSubmitting} onClick={closeStockRequest}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="vendor-summary-grid" style={{ marginBottom: 16 }}>
                <div className="summary-panel">
                  <h3>Stock actual</h3>
                  <p>{stockRequest.product.stock}</p>
                </div>
                <div className="summary-panel">
                  <h3>Solicitado</h3>
                  <p>{stockRequest.requestedStock}</p>
                </div>
                <div className="summary-panel">
                  <h3>Movimiento</h3>
                  <p>{stockRequest.requestedStock - stockRequest.product.stock > 0 ? '+' : ''}{stockRequest.requestedStock - stockRequest.product.stock}</p>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nota obligatoria</label>
                <textarea
                  rows={4}
                  value={stockRequest.note}
                  onChange={(event) => setStockRequest((prev) => ({ ...prev, note: event.target.value, error: '' }))}
                  placeholder="Ej. Reposición por compra a proveedor, ajuste por merma, salida por inventario físico..."
                  autoFocus
                />
              </div>
              {stockRequest.error && <div className="form-error" style={{ marginTop: 12 }}>{stockRequest.error}</div>}
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: 12 }}>
                El stock no cambiará hasta que el administrador apruebe esta solicitud.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" disabled={stockRequest.isSubmitting} onClick={closeStockRequest}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={stockRequest.isSubmitting} onClick={submitStockRequest}>
                <Save size={14} /> Enviar solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {liveSelectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Pedido {liveSelectedOrder.id}</h2>
                <p className="section-subtitle">Fecha: {liveSelectedOrder.date} | Estado: {liveSelectedOrder.status}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}><X size={16} /> Cerrar</button>
            </div>

            <div className="modal-body">
              <div className="customer-panel">
                <h3>Informacion del cliente</h3>
                <div className="customer-grid">
                  <p><strong>Nombre:</strong> {liveSelectedOrder.customer.name}</p>
                  <p><strong>Correo:</strong> {liveSelectedOrder.clientEmail}</p>
                  <p><strong>Telefono:</strong> {liveSelectedOrder.customer.phone}</p>
                  <p><strong>Entrega:</strong> {liveSelectedOrder.customer.deliveryType === 'retiro' ? 'Retiro en el local' : 'A domicilio'}</p>
                  {liveSelectedOrder.customer.deliveryType !== 'retiro' && (
                    <>
                      <p><strong>Direccion:</strong> {liveSelectedOrder.customer.address}</p>
                      <p className="customer-grid__wide"><strong>Referencia:</strong> {liveSelectedOrder.customer.reference}</p>
                    </>
                  )}
                  <p className="customer-grid__wide"><strong>Notas:</strong> {liveSelectedOrder.notes || 'Sin notas'}</p>
                  {liveSelectedOrder.status === 'rechazado' && liveSelectedOrder.rejectionReason && (
                    <p className="customer-grid__wide"><strong>Motivo del rechazo:</strong> {liveSelectedOrder.rejectionReason}</p>
                  )}
                </div>
              </div>

              <div>
                <h3>Productos del pedido</h3>
                <div className="order-items">
                  {liveSelectedOrder.vendorItems.map((item) => (
                    <div key={`${liveSelectedOrder.id}-${item.productId}`} className="order-item-row">
                      <span>{item.name}</span>
                      <span>{item.qty} x {money(item.price)} = {money(item.qty * item.price)}</span>
                    </div>
                  ))}
                  {liveSelectedOrder.packagingTotal > 0 && (
                    <div className="order-item-row">
                      <span>Empaque{liveSelectedOrder.packaging?.nombre ? `: ${liveSelectedOrder.packaging.nombre}` : ''}</span>
                      <span>{money(liveSelectedOrder.packagingTotal)}</span>
                    </div>
                  )}
                  <div className="order-item-row" style={{ fontWeight: 700, borderTop: '1px solid var(--gray-100)', paddingTop: 10, marginTop: 6 }}>
                    <span>Total</span>
                    <span>{money(liveSelectedOrder.vendorTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {renderOrderActions(liveSelectedOrder)}
            </div>
          </div>
        </div>
      )}

      {rejectConfirmOrder && (
        <div className="modal-overlay" onClick={() => setRejectConfirmOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rechazar pedido</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setRejectConfirmOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12 }}>
                ¿Confirmas que deseas rechazar el pedido <strong>{rejectConfirmOrder.id}</strong> de{' '}
                <strong>{rejectConfirmOrder.customer.name}</strong>?
              </p>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: 16 }}>
                El stock de los productos incluidos se repondrá automáticamente en el inventario. El cliente verá el motivo que escribas aquí.
              </p>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Motivo del rechazo</label>
                <textarea
                  rows={3}
                  value={rejectOrderReason}
                  onChange={(e) => { setRejectOrderReason(e.target.value); setRejectOrderError(''); }}
                  placeholder="Ej. Producto sin stock, datos de contacto incorrectos, pedido duplicado..."
                  autoFocus
                />
              </div>
              {rejectOrderError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: 10 }}>{rejectOrderError}</p>}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setRejectConfirmOrder(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmRejectOrder}>
                <XCircle size={14} /> Sí, rechazar pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarningsModal && (
        <div className="modal-overlay" onClick={() => setShowWarningsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Advertencias en el producto</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowWarningsModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                <AlertTriangle size={24} style={{ marginBottom: '8px', color: 'var(--warning)' }} />
                <p><strong>Estás a punto de guardar este producto con los siguientes detalles:</strong></p>
                <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                  {warnings.map((w, index) => <li key={index}>{w}</li>)}
                </ul>
                <p style={{ marginTop: '12px' }}>¿Deseas corregirlos o prefieres continuar de todos modos?</p>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowWarningsModal(false)}>
                Cancelar y corregir
              </button>
              <button className="btn btn-warning" onClick={() => executeSave(pendingProductData)}>
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
