// Design tokens — projenin renk ve animasyon paleti.
// Yeni renk eklerken sadece buradan ekle, App.jsx'e koyma.

export const C = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  text: '#000000',
  textDim: '#4B5563',
  primary: '#E30613',
  accent: '#E30613',
  glow: 'rgba(227, 6, 19, 0.2)',
  neon: '#E30613', // Aliasing for compatibility with existing code
  neon2: '#B0050F',
  cyan: '#E30613',
  magenta: '#7A0309',
};

export const easeOut = [0.22, 1, 0.36, 1];
export const spring = { type: 'spring', stiffness: 260, damping: 30 };
