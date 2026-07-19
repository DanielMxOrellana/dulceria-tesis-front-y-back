const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin20003';

export const hasApi = Boolean(API_URL);

async function request(path, options = {}) {
  if (!hasApi) return null;

  let sessionUser = null;
  try {
    sessionUser = JSON.parse(localStorage.getItem('dulceria_session') || 'null');
  } catch (e) {
    sessionUser = null;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionUser?.id ? { 'x-user-id': String(sessionUser.id) } : {}),
      ...(sessionUser?.role ? { 'x-user-role': String(sessionUser.role) } : {}),
      ...(sessionUser?.name ? { 'x-user-name': String(sessionUser.name) } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    // Attempt to parse error message from JSON body
    let errorMsg = `API error ${response.status} on ${path}`;
    try {
      const data = await response.json();
      if (data && data.error) errorMsg = data.error;
    } catch (e) {
      // Not JSON or no error field
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getProducts: async () => {
    const res = await request('/api/inventory');
    if (res && res.ok && Array.isArray(res.inventory)) {
      return res.inventory.map(p => ({
        id: Number(p.candy_id || p.CANDY_ID),
        name: p.candy_name || p.CANDY_NAME,
        description: p.description || p.DESCRIPTION,
        category: p.category || p.CATEGORY || 'General',
        image: p.image_url || p.IMAGE_URL || '',
        stock: Number(p.quantity ?? p.QUANTITY ?? 0),
        price: Number(p.price || p.PRICE || 0),
        available: Boolean(p.available || p.AVAILABLE),
        vendorId: p.vendor_id || p.vendorId || p.VENDOR_ID,
        minStock: Number(p.min_stock || p.minStock || p.MIN_STOCK || 0)
      }));
    }
    return res;
  },
  getOrders: async () => {
    const res = await request('/api/orders');
    if (res && res.ok && Array.isArray(res.orders)) {
      return res.orders.map(o => ({
        id: o.orderCode || `PED-${o.id}`,
        dbId: o.id,
        clientId: o.userId,
        date: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : (o.order_date || '').split('T')[0],
        total: Number(o.total || 0),
        status: {
          'pending': 'pendiente',
          'confirmed': 'aceptado',
          'confirmado': 'aceptado',
          'preparado': 'en preparacion',
          'ready': 'listo',
          'delivered': 'entregado',
          'rejected': 'rechazado',
          'cancelled': 'cancelado',
        }[o.status?.toLowerCase()] || o.status || 'pendiente',
        clientName: o.customerName,
        customer: {
          name: o.customerName,
          phone: o.customerPhone,
          address: o.customerAddress,
          city: o.customerCity,
          cedula: o.customerCedula,
          reference: o.customerReference,
          deliveryType: o.deliveryType || 'domicilio'
        },
        packaging: {
          type: o.containerType,
          nombre: o.containerName,
          precio: Number(o.containerPrice || 0)
        },
        items: (o.items || []).map(item => ({
          productId: Number(item.candyId),
          name: item.candyName,
          qty: Number(item.quantity ?? 0),
          price: Number(item.unitPrice || 0),
          subtotal: Number(item.subtotal || 0)
        })),
        attendedById: o.attended_by_id || o.attendedById,
        attendedByName: o.attended_by_name || o.attendedByName,
        dispatchedById: o.dispatched_by_id || o.dispatchedById,
        dispatchedByName: o.dispatched_by_name || o.dispatchedByName,
        notes: o.notes,
        rejectionReason: o.rejectionReason || ''
      }));
    }
    return res;
  },
  getUsers: () => request('/api/auth/users'),
  createProduct: (product) => request('/api/inventory', {
    method: 'POST',
    headers: { 'x-admin-password': ADMIN_PASSWORD },
    body: JSON.stringify(product),
  }),
  updateProduct: (id, updates) => request(`/api/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  getInventoryMovements: (status = '') => request(`/api/inventory/movements${status ? `?status=${encodeURIComponent(status)}` : ''}`, {
    headers: { 'x-admin-password': ADMIN_PASSWORD },
  }),
  approveInventoryMovement: (id, payload = {}) => request(`/api/inventory/movements/${id}/approve`, {
    method: 'PUT',
    headers: { 'x-admin-password': ADMIN_PASSWORD },
    body: JSON.stringify(payload),
  }),
  rejectInventoryMovement: (id, payload = {}) => request(`/api/inventory/movements/${id}/reject`, {
    method: 'PUT',
    headers: { 'x-admin-password': ADMIN_PASSWORD },
    body: JSON.stringify(payload),
  }),
  deleteProduct: (id) => request(`/api/inventory/${id}`, {
    method: 'DELETE',
  }),
  createOrder: (order) => request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  updateOrder: (id, updates) => request(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  createComplaint: (orderId, complaint) => request(`/api/orders/${orderId}/complaints`, {
    method: 'POST',
    body: JSON.stringify(complaint)
  }),
  getComplaintsAll: () => request('/api/orders/complaints/all', {
    headers: { 'x-admin-password': ADMIN_PASSWORD },
  }),
  resolveComplaint: (complaintId, adminResponse) => request(`/api/orders/complaints/${complaintId}/resolve`, {
    method: 'PUT',
    headers: { 'x-admin-password': ADMIN_PASSWORD },
    body: JSON.stringify({ adminResponse })
  }),
  login: (credentials) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  resetPassword: (email) => request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  updatePassword: (password, token) => request('/api/auth/update-password', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ password }),
  }),
  createUser: (user) => request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  updateUser: (id, updates) => request(`/api/auth/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  uploadImage: async (file) => {
    if (!hasApi) return { ok: false, error: 'No API available' };
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (err) {
      return { ok: false, error: err.message || 'Error uploading file' };
    }
  },
};
