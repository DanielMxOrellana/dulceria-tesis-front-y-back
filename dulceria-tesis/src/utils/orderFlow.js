import { TIPOS_EMPAQUE } from '../data/mockData';

export const PACKAGING_TYPES = [
  { key: 'fundas', label: 'Fundas de papel', emoji: '🛍️', description: 'Ligero y práctico' },
  { key: 'desechables', label: 'Desechable / plástico', emoji: '📦', description: 'Más rígido y protegido' },
  { key: 'canastos', label: 'Canastos', emoji: '🎁', description: 'Presentación premium' },
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

export const getBestPackageForCount = (count) => {
  if (!ALL_PACKAGING_OPTIONS.length) return null;
  return ALL_PACKAGING_OPTIONS.find(option => count <= option.capacidadMax) || ALL_PACKAGING_OPTIONS[ALL_PACKAGING_OPTIONS.length - 1];
};

export const getBestPackageForType = (typeKey, count) => {
  const options = (TIPOS_EMPAQUE[typeKey] || []).map(option => ({ ...option, tipo: typeKey }));
  if (!options.length) return null;
  return options.find(option => count <= option.capacidadMax) || options[options.length - 1];
};

export const getPackagingsForType = (typeKey) => (TIPOS_EMPAQUE[typeKey] || []).map(option => ({ ...option, tipo: typeKey }));