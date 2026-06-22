import React, { createContext, useContext, useEffect, useState } from 'react';
import { PRODUCTS_INITIAL, ORDERS_INITIAL, USERS_INITIAL } from '../data/mockData';
import { api, hasApi } from '../services/api';

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
    packagingId: '',
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
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty, image: product.image }];
    });
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
    packagingId: '',
    customer: { name: '', phone: '', address: '', reference: '', cedula: '', city: 'Quito' },
    notes: '',
  });

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  // Orders
  const createOrder = async (orderData = {}) => {
    const { notes = '', packaging = null, customer = {} } = typeof orderData === 'string' ? { notes: orderData } : orderData;
    if (!cart.length) return { error: 'El carrito está vacío' };

    const packagingTotal = packaging?.precio ?? 0;
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
      total: cartTotal + packagingTotal,
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
          items: cart.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price })),
          productTotal: cartTotal,
          packagingTotal,
          total: cartTotal + packagingTotal,
          status: 'pendiente',
          date: new Date().toISOString().split('T')[0],
          notes,
        };

        setOrders(prev => [newOrder, ...prev]);

        // Reduce stock locally
        cart.forEach(item => {
          setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.qty), available: Math.max(0, p.stock - item.qty) > 0 } : p));
        });

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

  const updateOrderStatus = (orderId, status) => {
    const order = orders.find(o => o.id === orderId);
    const dbId = order?.dbId || orderId;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    syncApi(() => api.updateOrder(dbId, { status }));
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
