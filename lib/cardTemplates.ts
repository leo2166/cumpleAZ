export type CardCategory = 'todas' | 'nuevos' | 'clasicas' | 'festivas' | 'navidad'

export interface CardTemplate {
  id: string
  label: string
  src: string
  centerX: number
  centerY: number
  category: CardCategory
  description?: string
}

export const CATEGORIES: { id: CardCategory; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'nuevos', label: 'Nuevas (X1-X10)' },
  { id: 'festivas', label: 'Festivas' },
  { id: 'clasicas', label: 'Clásicas' },
  { id: 'navidad', label: 'Navideñas' },
]

export const CARD_TEMPLATES: CardTemplate[] = [
  // ── Colección Nuevos Diseños (X1 - X10) ───────────────────────────────────
  { id: 'x1',  label: 'X1 Floral',       src: '/x1.png',  centerX: 540, centerY: 580, category: 'nuevos' },
  { id: 'x2',  label: 'X2 Elegante',     src: '/x2.png',  centerX: 540, centerY: 470, category: 'nuevos' },
  { id: 'x3',  label: 'X3 Dulce',        src: '/x3.png',  centerX: 540, centerY: 460, category: 'nuevos' },
  { id: 'x4',  label: 'X4 Dorado',       src: '/x4.png',  centerX: 540, centerY: 375, category: 'nuevos' },
  { id: 'x5',  label: 'X5 Celebración',  src: '/x5.png',  centerX: 540, centerY: 470, category: 'nuevos' },
  { id: 'x6',  label: 'X6 Celeste',      src: '/x6.png',  centerX: 540, centerY: 475, category: 'nuevos' },
  { id: 'x7',  label: 'X7 Azul Real',    src: '/x7.png',  centerX: 540, centerY: 460, category: 'nuevos' },
  { id: 'x8',  label: 'X8 Rosa Glam',    src: '/x8.png',  centerX: 540, centerY: 545, category: 'nuevos' },
  { id: 'x9',  label: 'X9 Festivo',      src: '/x9.png',  centerX: 540, centerY: 575, category: 'nuevos' },
  { id: 'x10', label: 'X10 CumpleAZ',    src: '/x10.png', centerX: 540, centerY: 470, category: 'nuevos' },

  // ── Festivas y Especiales ────────────────────────────────────────────────
  { id: 'azul',       label: 'Azul',        src: '/azul.png',      centerX: 540, centerY: 580, category: 'festivas' },
  { id: 'celebramos', label: 'Celebramos',  src: '/celebramos.jpg', centerX: 540, centerY: 535, category: 'festivas' },
  { id: 'newf3',      label: 'Fiesta',      src: '/newf3.png',     centerX: 540, centerY: 555, category: 'festivas' },

  // ── Clásicas ─────────────────────────────────────────────────────────────
  { id: 'img2', label: 'Clásico',   src: '/img2.png', centerX: 695, centerY: 500, category: 'clasicas' },
  { id: 'F2',   label: 'Diseño 2',  src: '/F2.png',   centerX: 540, centerY: 500, category: 'clasicas' },
  { id: 'F3',   label: 'Diseño 3',  src: '/F3.png',   centerX: 540, centerY: 400, category: 'clasicas' },
  { id: 'F4',   label: 'Diseño 4',  src: '/F4.png',   centerX: 540, centerY: 460, category: 'clasicas' },
  { id: 'F5',   label: 'Diseño 5',  src: '/F5.png',   centerX: 540, centerY: 520, category: 'clasicas' },
  { id: 'F6',   label: 'Diseño 6',  src: '/F6.png',   centerX: 530, centerY: 565, category: 'clasicas' },

  // ── Navideñas ────────────────────────────────────────────────────────────
  { id: 'newf1',     label: 'Navidad 1', src: '/newf1.png',     centerX: 540, centerY: 510, category: 'navidad' },
  { id: 'navidad_2', label: 'Navidad 2', src: '/navidad_2.png', centerX: 540, centerY: 500, category: 'navidad' },
]
