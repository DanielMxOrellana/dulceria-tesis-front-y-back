import { ShoppingBag, Package, Gift } from 'lucide-react';
import { TIPOS_EMPAQUE } from '../data/mockData';

export const PACKAGING_TYPES = [
  { key: 'fundas', label: 'Fundas de papel', icon: ShoppingBag, description: 'Ligero y práctico' },
  { key: 'desechables', label: 'Desechable / plástico', icon: Package, description: 'Más rígido y protegido' },
  { key: 'canastos', label: 'Canastos', icon: Gift, description: 'Presentación premium' },
];

export const ORDER_STEPS = [
  { path: '/nuevo-pedido/empaque', label: 'Empaque' },
  { path: '/nuevo-pedido/productos', label: 'Productos' },
  { path: '/nuevo-pedido/datos', label: 'Datos' },
];

export const ORDER_FLOW_STEPS = ORDER_STEPS;

export const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='420' viewBox='0 0 600 420'%3E%3Crect width='600' height='420' fill='%23f9efe9'/%3E%3Ctext x='300' y='205' text-anchor='middle' fill='%238a7f77' font-family='Arial, sans-serif' font-size='26'%3ESin imagen%3C/text%3E%3C/svg%3E";

export const ALL_PACKAGING_OPTIONS = PACKAGING_TYPES.flatMap(type =>
  (TIPOS_EMPAQUE[type.key] || []).map(option => ({ ...option, tipo: type.key }))
).sort((a, b) => a.capacidadMax - b.capacidadMax);

export const getImageSrc = (image) => {
  if (!image) return FALLBACK_IMAGE;
  if (image.startsWith('http') || image.startsWith('data:')) return image;
  return encodeURI(image);
};

export const getPackagingsForType = (typeKey) =>
  (TIPOS_EMPAQUE[typeKey] || [])
    .map(option => ({ ...option, tipo: typeKey }))
    .sort((a, b) => a.capacidadMax - b.capacidadMax);

export const getBestPackageForCount = (count) => {
  if (!ALL_PACKAGING_OPTIONS.length) return null;
  return ALL_PACKAGING_OPTIONS.find(option => count <= option.capacidadMax) || ALL_PACKAGING_OPTIONS[ALL_PACKAGING_OPTIONS.length - 1];
};

export const getBestPackageForType = (typeKey, count) => {
  const options = getPackagingsForType(typeKey);
  if (!options.length) return null;
  return options.find(option => count <= option.capacidadMax) || options[options.length - 1];
};

const getMaxCapacityForType = (typeKey) => {
  const options = getPackagingsForType(typeKey);
  if (!options.length) return 0;
  return options[options.length - 1].capacidadMax;
};

/** Busca en otros tipos el que tenga mayor capacidad máxima y elige el tamaño adecuado dentro de él. */
export const getBestPackageFromOtherTypes = (typeKey, count) => {
  const otherTypes = PACKAGING_TYPES
    .filter(type => type.key !== typeKey)
    .map(type => ({ key: type.key, maxCapacity: getMaxCapacityForType(type.key) }))
    .filter(type => type.maxCapacity > 0)
    .sort((a, b) => b.maxCapacity - a.maxCapacity);

  for (const type of otherTypes) {
    const option = getBestPackageForType(type.key, count);
    if (option && count <= option.capacidadMax) return option;
  }

  if (otherTypes.length) {
    return getBestPackageForType(otherTypes[0].key, count);
  }

  return getBestPackageForCount(count);
};

/** Tipo de empaque elegido por el cliente en el paso 1 (ancla del ajuste automático). */
export const getPreferredPackagingType = (orderDraft) =>
  orderDraft?.preferredPackagingType || orderDraft?.packagingType || 'fundas';

/**
 * Ajuste automático anclado al tipo preferido del cliente:
 * - Mientras quepa en ese tipo, solo cambia de tamaño dentro del mismo.
 * - Si supera el máximo del tipo preferido, cambia temporalmente a otro tipo mayor.
 * - Al bajar productos, vuelve al tipo preferido si ya cabe de nuevo.
 */
export const getRecommendedPackaging = (orderDraft, count) => {
  const preferredType = getPreferredPackagingType(orderDraft);

  if (count <= 0) {
    const options = getPackagingsForType(preferredType);
    return options[0] || getPackagingsForType('fundas')[0] || null;
  }

  const preferredMax = getMaxCapacityForType(preferredType);

  if (count <= preferredMax) {
    return getBestPackageForType(preferredType, count);
  }

  return getBestPackageFromOtherTypes(preferredType, count);
};

export const resolveSelectedPackaging = (orderDraft, count) =>
  getRecommendedPackaging(orderDraft, count);

/** Busca un empaque por su id, sin importar el tipo. */
export const getPackagingById = (id) =>
  ALL_PACKAGING_OPTIONS.find(option => option.id === id) || null;

/**
 * Empaque elegido manualmente por el cliente (paso 1). A diferencia de
 * getRecommendedPackaging, esta funcion NO cambia de empaque segun lo que
 * se agregue al carrito: el limite de valor en dulces lo define unicamente
 * el empaque que el cliente selecciono.
 */
export const getSelectedPackaging = (orderDraft) =>
  getPackagingById(orderDraft?.packagingId);

/** El precio del empaque es, a la vez, el limite maximo en dulces permitido. */
export const getPackagingLimit = (packaging) => Number(packaging?.precio ?? 0);

export const getOrderPackagingTotal = (order) =>
  Number(order?.packaging?.precio ?? order?.packagingTotal ?? 0);

export const ORDER_STATUS_STEPS = [
  'pendiente',
  'aceptado',
  'en preparacion',
  'listo',
  'entregado',
];

export const normalizeOrderStatusLabel = (status) => {
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

export const getOrderStepIndex = (status) => {
  const normalized = normalizeOrderStatusLabel(status);
  return ORDER_STATUS_STEPS.indexOf(normalized);
};

/** Ancho de la barra de progreso alineado con el centro de cada paso del timeline. */
export const getOrderProgressWidth = (status, trackInsetPercent = 5) => {
  const stepIndex = getOrderStepIndex(status);
  if (stepIndex < 0) return 0;

  const trackWidth = 100 - trackInsetPercent * 2;
  const stepCenter = ((stepIndex + 0.5) / ORDER_STATUS_STEPS.length) * 100;

  return Math.min(100, Math.max(0, ((stepCenter - trackInsetPercent) / trackWidth) * 100));
};