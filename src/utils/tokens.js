// Design tokens — projenin renk ve animasyon paleti.
// Yeni renk eklerken sadece buradan ekle, App.jsx'e koyma.

export const C = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#F8F8F8',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.16)',
  text: '#0A0A0A',
  textDim: '#6B6B6B',
  neon: '#E30613',     // primary red — eski mor/violet yerine
  neon2: '#B0050F',    // koyu kirmizi
  cyan: '#E30613',     // info/aksesuar — kirmizi varyant
  magenta: '#7A0309',  // cok koyu kirmizi/uyari
  glow: 'rgba(227,6,19,0.25)',
};

export const easeOut = [0.22, 1, 0.36, 1];
export const spring = { type: 'spring', stiffness: 260, damping: 30 };
