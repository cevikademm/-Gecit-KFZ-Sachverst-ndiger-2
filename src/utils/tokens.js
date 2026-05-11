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

// Dosya Durum Paneli — her parti için renk + label + kısa kod.
// CaseStatusBoard / CaseStatusWidget / CaseTimeline kullanır.
export const PARTY_COLORS = {
  admin:     '#E30613',
  customer:  '#0EA5E9',
  insurance: '#8B5CF6',
  lawyer:    '#F59E0B',
  closed:    '#16A34A',
  unknown:   '#6B7280',
};

export const PARTY_LABELS = {
  admin:     'Sachverständiger',
  customer:  'Müşteride',
  insurance: 'Sigortada',
  lawyer:    'Avukatta',
  closed:    'Kapandı',
  unknown:   '—',
};
