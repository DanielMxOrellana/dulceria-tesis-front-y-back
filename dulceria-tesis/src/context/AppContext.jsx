import React, { createContext, useContext, useEffect, useState } from 'react';
import { PRODUCTS_INITIAL, ORDERS_INITIAL, USERS_INITIAL } from '../data/mockData';
import { api, hasApi } from '../services/api';
import { getSelectedPackaging, getPackagingLimit } from '../utils/orderFlow';

export const PACKAGING_LIMIT_EXCEEDED_MESSAGE =
  'No es posible agregar este producto porque excede la capacidad del empaque seleccionado. Seleccione un empaque de mayor valor para continuar.';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dulceria_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dulceria_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dulceria_session');
    }
  }, [currentUser]);
  const [products, setProducts] = useState(PRODUCTS_INITIAL);
  const [orders, setOrders] = useState(ORDERS_INITIAL);
  const [users, setUsers] = useState([]);
  const [cart, setCart] = useState([]);
  const [apiError, setApiError] = useState('');
  const [orderDraft, setOrderDraft] = useState({
    packagingType: 'fundas',
    preferredPackagingType: 'fundas',
    packagingId: 'funda_s',
    customer: {
      name: '',
      phone: '',
      address: '',
      reference: '',
      cedula: '',
      city: 'Quito',
    },
    notes: '',
  });

  const fetchData = async () => {
    if (!hasApi) return;
    try {
      const [apiProducts, apiOrders, apiUsers] = await Promise.all([
        api.getProducts().catch(() => null),
        api.getOrders().catch(() => null),
        api.getUsers().catch(() => null),
      ]);

      if (Array.isArray(apiProducts)) setProducts(apiProducts);
      if (Array.isArray(apiOrders)) setOrders(apiOrders);
      if (Array.isArray(apiUsers)) setUsers(apiUsers);
      setApiError('');
    } catch (error) {
      console.error("fetchData error:", error);
      setApiError('No se pudo conectar con el backend. Usando datos locales.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetchData();
    }, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    setCart(prev => {
      let changed = false;
      const next = prev
        .map(item => {
          const stock = Math.max(0, products.find(p => Number(p.id) === Number(item.productId))?.stock ?? 0);
          if (item.qty > stock) {
            changed = true;
            return { ...item, qty: stock };
          }
          return item;
        })
        .filter(item => {
          if (item.qty <= 0) {
            changed = true;
            return false;
          }
          return true;
        });
      return changed ? next : prev;
    });
  }, [products]);

  const syncApi = (operation) => {
    if (!hasApi) return;
    operation().then((res) => {
      setApiError('');
    }).catch((err) => {
      setApiError('No se pudo sincronizar con el backend. Revisa que la API este activa.');
    });
  };

  // Auth
  const login = async (email, password) => {
    try {
      const response = await api.login({ email, password });
      if (response && response.ok && response.user) {
        if (response.user.status === 'bloqueado') {
          return { error: 'Tu cuenta está bloqueada. Contacta al administrador.' };
        }
        setCurrentUser(response.user);
        fetchData();
        return { success: true };
      }
      return { error: response?.error || 'Credenciales incorrectas.' };
    } catch (error) {
      console.error("Login error:", error);
      return { error: error.message || 'Error al conectar con el servidor.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCart([]);
    setOrderDraft({
      packagingType: 'fundas',
      preferredPackagingType: 'fundas',
      packagingId: '',
      customer: { name: '', phone: '', address: '', reference: '' },
      notes: '',
    });
  };

  const resetPassword = async (email) => {
    try {
      const response = await api.resetPassword(email);
      if (response && response.ok) {
        return { success: true };
      }
      return { error: response?.error || 'Error al enviar el correo de recuperación.' };
    } catch (error) {
      console.error("Reset password error:", error);
      return { error: error.message || 'Error al conectar con el servidor.' };
    }
  };

  const updatePassword = async (password, token) => {
    try {
      const response = await api.updatePassword(password, token);
      if (response && response.ok) {
        return { success: true };
      }
      return { error: response?.error || 'Error al actualizar la contraseña.' };
    } catch (error) {
      console.error("Update password error:", error);
      return { error: error.message || 'Error al conectar con el servidor.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.createUser({ name, email, password });
      if (response && (response.ok || response.user)) {
        if (response.needsVerification) {
          return { success: true, needsVerification: true };
        }
        const newUser = response.user;
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        return { success: true };
      }
      return { error: response?.error || 'Error al registrar el usuario.' };
    } catch (error) {
      console.error("Register error:", error);
      return { error: error.message || 'Error al conectar con el servidor.' };
    }
  };

  const createUser = async (name, email, password, role = 'cliente') => {
    try {
      const response = await api.createUser({ name, email, password, role, email_confirm: true });
      if (response && (response.ok || response.user)) {
        const newUser = response.user;
        setUsers(prev => [...prev, newUser]);
        return { success: true, user: newUser };
      }
      return { error: response?.error || 'Error al crear el usuario.' };
    } catch (error) {
      console.error("Create user error:", error);
      return { error: error.message || 'Error al conectar con el servidor.' };
    }
  };

  // Products (Admin & Vendor)
  const addProduct = (product) => {
    const candy_id = Date.now() % 1000000; // ID numerico para la DB
    const newP = {
      ...product,
      id: candy_id,
      candy_id, // Para el backend
      candy_name: product.name,
      image_url: product.image,
      quantity: product.stock,
      available: product.stock > 0,
      vendor_id: currentUser?.id, // Snake case for backend
      vendorId: currentUser?.id, // Camel case for frontend
      vendorName: currentUser?.name,
      min_stock: product.minStock || 0,
      minStock: product.minStock || 0
    };
    setProducts(prev => [...prev, newP]);
    syncApi(() => api.createProduct(newP));
  };

  const updateProduct = (id, updates) => {
    // Map stock to quantity for backend
    const apiUpdates = { ...updates };
    if (updates.stock !== undefined) apiUpdates.quantity = updates.stock;
    if (updates.image !== undefined) apiUpdates.image_url = updates.image;

    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, available: (updates.stock ?? p.stock) > 0 } : p));
    syncApi(() => api.updateProduct(id, apiUpdates));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    syncApi(() => api.deleteProduct(id));
  };

  const updateStock = (id, qty) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: qty, available: qty > 0 } : p));
    syncApi(() => api.updateProduct(id, { quantity: qty, available: qty > 0 }));
  };

  // Cart
  const addToCart = (product, qty = 1) => {
    const productId = product.id ?? product.productId;
    const catalogProduct = products.find(p => p.id === productId);
    const stock = Math.max(0, catalogProduct?.stock ?? 0);

    if (qty > 0 && (!catalogProduct?.available || stock === 0)) {
      return { error: 'Producto no disponible.' };
    }

    if (qty > 0) {
      const selectedPackaging = getSelectedPackaging(orderDraft);
      const limit = getPackagingLimit(selectedPackaging);
      const addedValue = Number(product.price || 0) * qty;

      if (selectedPackaging && cartTotal + addedValue > limit + 0.001) {
        return { error: PACKAGING_LIMIT_EXCEEDED_MESSAGE };
      }
    }

    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      const currentQty = existing?.qty ?? 0;
      const nextQty = currentQty + qty;

      if (nextQty <= 0) {
        return prev.filter(i => i.productId !== productId);
      }

      const cappedQty = Math.min(nextQty, stock);
      if (cappedQty <= 0) return prev;

      if (existing) {
        return prev.map(i => i.productId === productId ? { ...i, qty: cappedQty } : i);
      }

      return [...prev, {
        productId,
        name: product.name,
        price: product.price,
        qty: cappedQty,
        image: product.image,
      }];
    });

    return { success: true };
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));
  const clearCart = () => setCart([]);

  const updateOrderDraft = (updates) => {
    setOrderDraft(prev => ({
      ...prev,
      ...updates,
      customer: {
        ...prev.customer,
        ...(updates.customer || {}),
      },
    }));
  };

  const resetOrderDraft = () => setOrderDraft({
    packagingType: 'fundas',
    preferredPackagingType: 'fundas',
    packagingId: 'funda_s',
    customer: { name: '', phone: '', address: '', reference: '', cedula: '', city: 'Quito' },
    notes: '',
  });

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const normalizeOrderStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();
    const map = {
      pending: 'pendiente',
      pendiente: 'pendiente',
      confirmed: 'aceptado',
      aceptado: 'aceptado',
      confirmado: 'aceptado',
      preparado: 'en preparacion',
      'en preparacion': 'en preparacion',
      ready: 'listo',
      listo: 'listo',
      delivered: 'entregado',
      entregado: 'entregado',
      rejected: 'rechazado',
      rechazado: 'rechazado',
      cancelled: 'cancelado',
      cancelado: 'cancelado',
    };
    return map[value] || value;
  };

  const resolveOrderDbId = (order) => {
    if (order?.dbId != null) {
      const dbId = Number(order.dbId);
      if (Number.isInteger(dbId) && dbId > 0) return dbId;
    }

    const match = String(order?.id || '').match(/PED-0*(\d+)$/i);
    if (match) return Number(match[1]);

    const numericId = Number(order?.id);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
  };

  const restoreLocalStockForOrder = (orderItems = []) => {
    setProducts(prev => prev.map(p => {
      const item = orderItems.find(i => Number(i.productId) === Number(p.id));
      if (!item) return p;
      const newStock = Number(p.stock) + Number(item.qty);
      return { ...p, stock: newStock, available: newStock > 0 };
    }));
  };

  const refreshProductsFromApi = async () => {
    if (!hasApi) return;
    const apiProducts = await api.getProducts();
    if (Array.isArray(apiProducts)) setProducts(apiProducts);
  };

  const createOrder = async (orderData = {}) => {
    const { notes = '', packaging = null, customer = {} } = typeof orderData === 'string' ? { notes: orderData } : orderData;
    if (!cart.length) return { error: 'El carrito está vacío' };

    for (const item of cart) {
      const product = products.find(p => p.id === item.productId);
      if (!product?.available || product.stock < item.qty) {
        return {
          error: `Stock insuficiente para "${item.name}". Disponible: ${product?.stock ?? 0}`,
        };
      }
    }

    if (!packaging) return { error: 'Selecciona un empaque antes de confirmar.' };

    const packagingTotal = packaging?.precio ?? 0;

    if (cartTotal > packagingTotal + 0.001) {
      return { error: PACKAGING_LIMIT_EXCEEDED_MESSAGE };
    }

    const clientName = customer.name?.trim() || currentUser.name;
    const clientPhone = customer.phone?.trim() || '';
    const clientAddress = customer.address?.trim() || '';
    const clientCedula = customer.cedula?.trim() || '';
    const clientCity = customer.city?.trim() || 'Quito';

    // Map to backend schema
    const backendOrder = {
      customerCedula: clientCedula,
      customerName: clientName,
      customerPhone: clientPhone,
      customerAddress: clientAddress,
      customerCity: clientCity,
      customerReference: customer.reference?.trim() || '',
      deliveryType: 'domicilio',
      containerType: packaging?.type || 'fundas',
      containerName: packaging?.nombre || 'Básica',
      containerPrice: packagingTotal,
      notes: notes,
      items: cart.map(i => ({
        candyId: parseInt(i.productId, 10),
        candyName: String(i.name),
        unitPrice: Number(i.price),
        quantity: parseInt(i.qty, 10),
        subtotal: Number(i.price * i.qty)
      })),
      total: packagingTotal,
      userId: currentUser?.id
    };

    try {
      const response = await api.createOrder(backendOrder);
      if (response && response.ok) {
        const realOrder = response.order;
        // Map backend response back to frontend format for consistency in UI
        const newOrder = {
          id: realOrder.orderCode || `PED-${realOrder.id}`,
          dbId: realOrder.id,
          clientId: currentUser?.id,
          clientName,
          customer: { ...customer, name: clientName },
          packaging,
          items: cart.map(i => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
            price: i.price,
          })),
          productTotal: cartTotal,
          packagingTotal,
          total: packagingTotal,
          status: 'pendiente',
          date: new Date().toISOString().split('T')[0],
          notes,
        };

        setOrders(prev => [newOrder, ...prev]);

        if (hasApi) {
          await refreshProductsFromApi();
        } else {
          cart.forEach(item => {
            setProducts(prev => prev.map(p => {
              if (Number(p.id) !== Number(item.productId)) return p;
              const newStock = Math.max(0, Number(p.stock) - Number(item.qty));
              return { ...p, stock: newStock, available: newStock > 0 };
            }));
          });
        }

        clearCart();
        resetOrderDraft();
        return { success: true, order: newOrder };
      } else {
        return { error: response?.error || 'Error al procesar el pedido en el servidor.' };
      }
    } catch (error) {
      console.error("Create order error:", error);
      return { error: 'Error de conexión con el servidor.' };
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { error: 'Pedido no encontrado' };

    const normalizedStatus = normalizeOrderStatus(status);
    const normalizedPrevious = normalizeOrderStatus(order.status);
    const dbId = resolveOrderDbId(order);
    const previousStatus = order.status;

    const shouldRestoreStock =
      ['rechazado', 'cancelado'].includes(normalizedStatus) &&
      !['rechazado', 'cancelado', 'entregado'].includes(normalizedPrevious);

    setOrders(prev => prev.map(o => (
      o.id === orderId ? { ...o, status: normalizedStatus } : o
    )));

    if (!hasApi || !dbId) {
      if (shouldRestoreStock && order.items?.length) {
        restoreLocalStockForOrder(order.items);
      }
      return { success: true };
    }

    try {
      await api.updateOrder(dbId, { status: normalizedStatus });
      setApiError('');

      if (shouldRestoreStock) {
        await refreshProductsFromApi();
      }

      return { success: true };
    } catch (error) {
      setOrders(prev => prev.map(o => (
        o.id === orderId ? { ...o, status: previousStatus } : o
      )));
      setApiError(error.message || 'No se pudo sincronizar con el backend. Revisa que la API este activa.');
      return { error: error.message || 'No se pudo actualizar el pedido.' };
    }
  };

  // Users (Admin)
  const toggleUserBlock = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const newStatus = user.status === 'activo' ? 'bloqueado' : 'activo';
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      syncApi(() => api.updateUser(userId, { status: newStatus }));
    }
  };

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, register, createUser, resetPassword, updatePassword,
      apiError,
      products, addProduct, updateProduct, deleteProduct, updateStock,
      orders, createOrder, updateOrderStatus,
      users, toggleUserBlock,
      cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount,
      orderDraft, updateOrderDraft, resetOrderDraft,
      lowStockProducts, outOfStockProducts,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
