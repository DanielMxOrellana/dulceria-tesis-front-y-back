const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export const hasApi = Boolean(API_URL);

async function request(path, options = {}) {
  if (!hasApi) return null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
        id: p.candy_id || p.CANDY_ID,
        name: p.candy_name || p.CANDY_NAME,
        description: p.description || p.DESCRIPTION,
        category: p.category || p.CATEGORY || 'General',
        image: p.image_url || p.IMAGE_URL || '/img/dulces/logo.jpg',
        stock: p.quantity || p.QUANTITY || 0,
        price: Number(p.price || p.PRICE || 0),
        available: Boolean(p.available || p.AVAILABLE),
        vendorId: p.vendor_id || p.vendorId || p.VENDOR_ID,
        minStock: p.min_stock || p.minStock || p.MIN_STOCK || 0
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
          'cancelled': 'cancelado'
        }[o.status?.toLowerCase()] || o.status || 'pendiente',
        clientName: o.customerName,
        customer: {
          name: o.customerName,
          phone: o.customerPhone,
          address: o.customerAddress,
          city: o.customerCity,
          cedula: o.customerCedula,
          reference: o.customerReference
        },
        packaging: {
          type: o.containerType,
          nombre: o.containerName,
          precio: Number(o.containerPrice || 0)
        },
        items: (o.items || []).map(item => ({
          productId: item.candyId,
          name: item.candyName,
          qty: item.quantity,
          price: Number(item.unitPrice || 0),
          subtotal: Number(item.subtotal || 0)
        })),
        notes: o.notes
      }));
    }
    return res;
  },
  getUsers: () => request('/api/auth/users'),
  createProduct: (product) => request('/api/inventory', {
    method: 'POST',
    headers: { 'x-admin-password': 'admin123' }, // Mocking admin password for now
    body: JSON.stringify(product),
  }),
  updateProduct: (id, updates) => request(`/api/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
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
};