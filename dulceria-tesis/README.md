# 🍬 Dulcería Artesanal — App React

Sistema de gestión para una dulcería artesanal con roles de **Administrador** y **Cliente**.

## 🚀 Cómo iniciar

```bash
npm install
npm start
```

La app abrirá en http://localhost:3000

---

## 👥 Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Administrador** | admin@dulceria.com | 123456 |
| **Cliente** | maria@email.com | 123456 |
| **Cliente bloqueado** | ana@email.com | 123456 |

> También puedes registrar nuevos clientes desde la pantalla de login.

---

## 📦 Módulos implementados

### Admin
- **Dashboard** — Estadísticas, alertas de stock, pedidos recientes
- **Productos** — CRUD completo con emoji, categoría, precio, stock
- **Pedidos** — Ver, filtrar y cambiar estado de pedidos
- **Inventario** — Stock bajo, agotado, actualización rápida
- **Usuarios** — Ver y bloquear/desbloquear clientes
- **Reportes** — Gráficas de ingresos, estados, productos más vendidos

### Cliente
- **Catálogo** — Buscar y filtrar productos, ver detalle
- **Carrito** — Agregar/quitar productos, ajustar cantidad
- **Mis Pedidos** — Ver historial con tracker de estado en tiempo real

---

## 🏗️ Estructura del proyecto

```
src/
├── components/
│   ├── auth/        # Login, registro, recuperar contraseña
│   └── layout/      # Sidebar + topbar con navegación por rol
├── context/
│   └── AppContext.jsx  # Estado global (auth, productos, pedidos, carrito)
├── data/
│   └── mockData.js     # Datos de ejemplo
└── pages/
    ├── AdminDashboard.jsx
    ├── ProductsAdmin.jsx
    ├── OrdersAdmin.jsx
    ├── InventoryAdmin.jsx
    ├── UsersAdmin.jsx
    ├── ReportsAdmin.jsx
    ├── CatalogPage.jsx
    ├── CartPage.jsx
    └── MyOrdersPage.jsx
```

---

## 🔧 Tecnologías

- **React 18** + React Router v6
- **Recharts** — Gráficas de reportes
- **Lucide React** — Íconos
- CSS puro con variables (sin Tailwind ni Bootstrap)
- Estado global con Context API

---

## 📋 Requerimientos funcionales cubiertos

| # | RF | Estado |
|---|----|--------|
| RF01-05 | Módulo Autenticación | ✅ |
| RF06-12 | Módulo Productos (admin) | ✅ |
| RF13-15 | Módulo Catálogo (cliente) | ✅ |
| RF16-24 | Módulo Pedidos | ✅ |
| RF25-27 | Módulo Inventario | ✅ |
| RF28-29 | Módulo Usuarios | ✅ |
| RF30-31 | Módulo Reportes | ✅ |

> **Nota**: Los datos son en memoria (mock). Para producción conecta con tu API/backend.
