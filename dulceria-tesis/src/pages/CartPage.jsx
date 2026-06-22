import React from 'react';
import { Navigate } from 'react-router-dom';

export default function CartPage() {
  return <Navigate to="/nuevo-pedido/empaque" replace />;
}
