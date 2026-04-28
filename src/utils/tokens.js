// Design tokens — projenin renk ve animasyon paleti.
// Yeni renk eklerken sadece buradan ekle, App.jsx'e koyma.

export const C = {
  bg: '#07060B',
  surface: '#0E0B18',
  surface2: '#141027',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#EDE9FE',
  textDim: '#8B85A8',
  neon: '#A78BFA',
  neon2: '#7C3AED',
  cyan: '#22D3EE',
  magenta: '#F472B6',
  glow: 'rgba(167,139,250,0.35)',
};

export const easeOut = [0.22, 1, 0.36, 1];
export const spring = { type: 'spring', stiffness: 260, damping: 30 };
