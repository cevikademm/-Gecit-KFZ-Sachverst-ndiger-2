// Bu dosya legacy/index.html'den otomatik tasindi. Asama asama bilesenler
// ./components ve ./utils altina ayriliyor. AUTO-GENERATED via .migration/transform.mjs.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  motion, useScroll, useTransform, useMotionValue, useSpring, useInView, AnimatePresence,
} from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { createClient } from '@supabase/supabase-js';
import { C, easeOut, spring } from './utils/tokens.js';
import { useReducedMotion, useTouchDevice, useMousePosition } from './utils/hooks.js';
import {
  Svg, ArrowRight, Play, Check, ChevronRight, Sparkles, Brain, Zap, Target,
  TrendingUp, Rocket, Shield, BarChart3, Globe, Layers, Cpu, Database, Code, Quote,
  LayoutDashboard, UsersIcon, Building, CalendarIcon, FileText, Receipt, SettingsIcon,
  CarIcon, UploadIcon, DownloadIcon, PlusIcon, XClose, SearchIcon, LogOutIcon, Wrench,
  PhoneIcon, MailIcon, BellIcon, ClockIcon, AlertTriangle, ArchiveIcon, ActivityIcon,
  PaletteIcon, EditIcon, EyeIcon, FolderIcon, ImageIcon, PinIcon, MessageIcon,
  CheckSquare, HashIcon, QrCodeIcon, ClipboardIcon, ScaleIcon, ShieldIcon, UserPlusIcon, StarIcon,
  TrashIcon, GlobeIcon, InfinityIcon, UsersGroupIcon, RadioTowerIcon, FolderCheckIcon,
  CameraIcon, GridIcon, MaximizeIcon,
} from './components/icons.jsx';
// Landing (homepage) tamamen izole — src/pages/Landing.jsx
import Landing from './pages/Landing.jsx';
import { GecitKfzModal } from './components/Modal.jsx';
import { RuhsatPanel } from './components/RuhsatPanel.jsx';
import { parseRuhsatMock } from './utils/ruhsatParser.js';
import { useLang } from './i18n/LangContext.jsx';

const RUHSAT_DOC_TYPES = ['fahrzeugschein', 'fahrzeugbrief'];
const isRuhsatDoc = (type) => RUHSAT_DOC_TYPES.includes(type);

// Helper: legalize IIFE-with-hooks pattern by giving each its own component fiber.
// Usage: <Iife>{() => { const [x,setX] = useState(0); return <div/>; }}</Iife>
function Iife({ children }) { return children(); }
// ─── Noise overlay ──────────────────────────────
function NoiseOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40"
         style={{ mixBlendMode: 'overlay', opacity: 0.05 }} aria-hidden="true">
      <svg className="w-full h-full">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

// ─── Scroll progress ────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scale = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div className="fixed top-[26px] left-0 right-0 z-50 origin-left"
      style={{
        scaleX: scale, height: 2,
        background: `linear-gradient(90deg, ${C.neon}, ${C.magenta}, ${C.cyan})`,
        boxShadow: `0 0 12px ${C.glow}`,
      }} />
  );
}

// CustomCursor removed — was hiding native cursor (cursor: none) and causing UX issues
function CustomCursor() {
  // Defensive: if anywhere in code body cursor got set to 'none', restore it on mount
  useEffect(() => {
    if (document.body.style.cursor === 'none') document.body.style.cursor = '';
  }, []);
  return null;
}

// ─── Mesh BG ────────────────────────────────────
function MeshBackground() {
  const rm = useReducedMotion();
  const { x, y } = useMousePosition();
  const offX = useTransform(x, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-20, 20]);
  const offY = useTransform(y, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [-20, 20]);
  const base = { position: 'absolute', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' };
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
      <motion.div style={{ ...base, width: 560, height: 560, top: '-10%', left: '-5%', background: C.neon2, opacity: 0.06, x: offX, y: offY }}
        animate={rm ? {} : { x: [0, 60, -30, 0], y: [0, -40, 50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div style={{ ...base, width: 480, height: 480, top: '40%', right: '-8%', background: C.cyan, opacity: 0.04 }}
        animate={rm ? {} : { x: [0, -80, 30, 0], y: [0, 40, -40, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div style={{ ...base, width: 520, height: 520, bottom: '-10%', left: '30%', background: C.magenta, opacity: 0.05 }}
        animate={rm ? {} : { x: [0, 50, -60, 0], y: [0, -60, 20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

// ─── Magnetic button ────────────────────────────
function MagneticButton({ children, variant = 'primary', className = '', onClick, ariaLabel }) {
  const ref = useRef(null);
  const isTouch = useTouchDevice();
  const rm = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 15 });
  const sy = useSpring(my, { stiffness: 200, damping: 15 });
  const handleMove = (e) => {
    if (isTouch || rm) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.sqrt(dx*dx + dy*dy) < 120) { mx.set(dx * 0.25); my.set(dy * 0.25); }
  };
  const handleLeave = () => { mx.set(0); my.set(0); };
  const baseCls = 'relative inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-lg px-7 py-3.5 transition-colors focus:outline-none';
  const style = variant === 'primary'
    ? { background: '#E30613', color: '#FFFFFF',
        boxShadow: '0 4px 20px -4px rgba(227,6,19,0.40)' }
    : { background: 'transparent', color: C.text, border: `1px solid ${C.border}` };
  return (
    <motion.button ref={ref} data-magnetic onMouseMove={handleMove} onMouseLeave={handleLeave}
      onClick={onClick} aria-label={ariaLabel}
      style={{ x: sx, y: sy, ...style }}
      className={baseCls + ' ' + className} whileTap={{ scale: 0.97 }}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

// ─── Navbar ─────────────────────────────────────
function Navbar({ user, onLoginClick, onLogout, onEnterApp, onBook }) {
  const { scrollY } = useScroll();
  const blur = useTransform(scrollY, [0, 80], [6, 18]);
  const bgOp = useTransform(scrollY, [0, 80], [0.02, 0.08]);
  const brOp = useTransform(scrollY, [0, 80], [0.04, 0.14]);
  const [bgCss, setBg] = useState('rgba(0,0,0,0.03)');
  const [brCss, setBr] = useState('rgba(0,0,0,0.05)');
  const [blCss, setBl] = useState('blur(6px)');
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const u1 = bgOp.on('change', v => setBg(`rgba(255,255,255,${v})`));
    const u2 = brOp.on('change', v => setBr(`rgba(255,255,255,${v})`));
    const u3 = blur.on('change', v => setBl(`blur(${v}px)`));
    return () => { u1(); u2(); u3(); };
  }, [bgOp, brOp, blur]);
  const links = ['Leistungen', 'Ablauf', 'Pakete', 'Kontakt'];
  const initials = user ? user.email.slice(0, 2).toUpperCase() : '';
  return (
    <motion.nav initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: easeOut }}
      className="fixed z-40"
      style={{ top: 'max(16px, calc(env(safe-area-inset-top) + 8px))',
        left: 'max(16px, env(safe-area-inset-left))',
        right: 'max(16px, env(safe-area-inset-right))',
        marginLeft: 'auto', marginRight: 'auto', maxWidth: 1200,
        background: bgCss, backdropFilter: blCss, WebkitBackdropFilter: blCss,
        border: `1px solid ${brCss}`, borderRadius: 999 }}>
      <div className="flex items-center justify-between px-5 py-3">
        <a href="#" className="flex items-center gap-0 font-mono text-lg flex-shrink-0" style={{ color: C.text }}>
          <span style={{ color: C.neon }}>Gecit Kfz Sachverständiger</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: C.textDim }}>
          {links.map(l => <a key={l} href="#" className="transition-colors hover:text-gray-900">{l}</a>)}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
            <button onClick={onEnterApp}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md transition-all"
              style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.25)', color: C.neon }}>
              Zum Dashboard
              <ArrowRight size={14} />
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)} onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md transition-colors"
                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.10)', color: C.text }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                  style={{ background: '#E30613', color: '#FFFFFF' }}>
                  {initials}
                </span>
                <span className="hidden sm:inline" style={{ color: C.text }}>{user.role === 'super_admin' ? 'Super Admin' : 'Benutzer'}</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl p-2 text-sm"
                    style={{ background: '#FFFFFF', border: `1px solid ${C.border}`,
                      boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15)' }}>
                    <div className="px-3 py-2" style={{ color: C.textDim }}>
                      <p className="truncate" style={{ color: C.text }}>{user.email}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.neon }}>
                        {user.role === 'super_admin' ? '● Super Admin' : '● Benutzer'}
                      </p>
                    </div>
                    <div className="h-px my-1" style={{ background: C.border }} />
                    <button onMouseDown={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl transition-colors hover:bg-black/5"
                      style={{ color: C.text }}>
                      Abmelden
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <button onClick={onLoginClick}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 sm:px-4 py-2 rounded-md transition-all"
              style={{ background: 'rgba(227,6,19,0.07)', border: `1px solid ${C.neon}55`, color: C.neon }}>
              <Svg size={14}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></Svg>
              <span className="hidden sm:inline">Anmelden</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
          <MagneticButton variant="primary" ariaLabel="Online Termin Al" className="text-sm !px-4 sm:!px-7 !py-2.5 sm:!py-3.5" onClick={onBook}>
            <span className="hidden sm:inline">Online-Termin</span>
            <span className="sm:hidden">Termin</span>
            <ArrowRight size={16} />
          </MagneticButton>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Login Drawer ───────────────────────────────
function LoginDrawer({ open, onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setError(''); setPassword(''); return; }
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const em = email.trim().toLowerCase();
      const { user, error: signErr } = await SupabaseAuth.signIn(em, password);
      if (signErr || !user) {
        setError('E-Mail veya şifre hatalı.');
        return;
      }
      if (!user.role) {
        // Auth başarılı ama user_profiles satırı yok — yetkisiz hesap
        await SupabaseAuth.signOut();
        setError('Hesabınız henüz yetkilendirilmemiş. Yöneticiyle iletişime geçin.');
        return;
      }
      if (user.active === false) {
        await SupabaseAuth.signOut();
        setError('Hesabınız devre dışı bırakılmış.');
        return;
      }
      const sessionUser = {
        email: user.email,
        role: user.role,
        name: user.full_name || user.email,
        lawyer_id: user.role === 'lawyer' ? user.linked_id : undefined,
        insurer_id: user.role === 'insurance' ? user.linked_id : undefined,
      };
      onLogin(sessionUser);
      setEmail(''); setPassword('');
      onClose();
    } catch (err) {
      setError('Bağlantı hatası: ' + (err?.message || 'Bilinmeyen'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ zIndex: 60, background: 'rgba(7,6,11,0.65)', backdropFilter: 'blur(6px)' }} />
          <motion.aside key="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            role="dialog" aria-modal="true" aria-label="Anmelden"
            className="fixed top-0 right-0 bottom-0 flex flex-col overflow-y-auto"
            style={{ zIndex: 61, width: 'min(440px, 100vw)',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingRight: 'env(safe-area-inset-right)',
              background: `linear-gradient(180deg, ${C.surface2} 0%, ${C.surface} 100%)`,
              borderLeft: `1px solid ${C.border}`,
              boxShadow: `-40px 0 80px -20px rgba(0,0,0,0.6), inset 1px 0 0 ${C.glow}` }}>
            <div className="absolute top-0 right-0 pointer-events-none"
              style={{ width: 320, height: 320,
                background: `radial-gradient(circle, ${C.glow} 0%, transparent 70%)`,
                filter: 'blur(40px)' }} />
            <div className="relative flex items-center justify-between p-6"
              style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3 font-black tracking-tight" style={{ lineHeight: 1 }}>
                <img src="/logocustom3.png" alt="Logo" className="h-10 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
                <span style={{ color: C.text, fontSize: 16 }}>Gecit Kfz Sachverständiger</span>
              </div>
              <button onClick={onClose} aria-label="Kapat"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
                style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                <Svg size={16}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Svg>
              </button>
            </div>

            <div className="relative flex-1 p-8">
              <p className="text-xs uppercase mb-3" style={{ color: C.neon, letterSpacing: '0.25em' }}>
                Konto-Anmeldung
              </p>
              <h2 className="text-3xl font-semibold mb-2"
                style={{ color: C.text, letterSpacing: '-0.02em' }}>
                Willkommen zurück.
              </h2>
              <p className="text-sm mb-8" style={{ color: C.textDim }}>
                Melden Sie sich an, um auf das Gecit Kfz Dashboard zuzugreifen.
              </p>

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase mb-2"
                    style={{ color: C.textDim, letterSpacing: '0.2em' }}>E-Mail</label>
                  <input type="email" required value={email} autoFocus
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="sen@sirket.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    style={{ background: 'rgba(0,0,0,0.04)',
                      border: `1px solid ${C.border}`, color: C.text }}
                    onFocus={(e) => e.target.style.border = `1px solid ${C.neon}`}
                    onBlur={(e) => e.target.style.border = `1px solid ${C.border}`} />
                </div>
                <div>
                  <label className="block text-xs uppercase mb-2"
                    style={{ color: C.textDim, letterSpacing: '0.2em' }}>Passwort</label>
                  <input type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    style={{ background: 'rgba(0,0,0,0.04)',
                      border: `1px solid ${C.border}`, color: C.text }}
                    onFocus={(e) => e.target.style.border = `1px solid ${C.neon}`}
                    onBlur={(e) => e.target.style.border = `1px solid ${C.border}`} />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(227,6,19,0.06)',
                        border: '1px solid rgba(227,6,19,0.20)', color: '#B0050F' }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between text-xs" style={{ color: C.textDim }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked
                      style={{ accentColor: C.neon }} />
                    Angemeldet bleiben
                  </label>
                  <a href="#" className="hover:text-gray-900 transition-colors">Passwort vergessen</a>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ background: '#E30613', color: '#FFFFFF',
                    boxShadow: '0 4px 16px rgba(227,6,19,0.30)' }}>
                  {loading ? 'Anmeldung läuft…' : <>Anmelden <ArrowRight size={16} /></>}
                </motion.button>
              </form>

              <p className="text-center text-[11px] mt-8" style={{ color: C.textDim }}>
                Nur autorisierte Konten haben Zugriff. Bei Problemen wenden Sie sich an den Administrator.
              </p>
            </div>

            <div className="relative p-6 text-xs" style={{ color: C.textDim, borderTop: `1px solid ${C.border}` }}>
              <p>Sichere Verbindung · DSGVO-konform · Supabase Auth</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Reveal heading ─────────────────────────────
function RevealHeading({ text, className = '', style = {}, delay = 0 }) {
  const rm = useReducedMotion();
  const words = text.split(' ');
  return (
    <h1 className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ marginRight: '0.28em' }}>
          <motion.span className="inline-block"
            initial={{ y: '110%' }} animate={{ y: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.9, ease: easeOut, delay: delay + i * 0.08 }}>
            {w}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

// ─── Hero ───────────────────────────────────────
function Hero() {
  const rm = useReducedMotion();
  const { scrollY } = useScroll();
  const sphY = useTransform(scrollY, [0, 800], [0, -240]);
  const sphS = useTransform(scrollY, [0, 800], [1, 0.85]);
  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight: '100vh', paddingTop: 'calc(env(safe-area-inset-top) + 120px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
      <motion.div className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{ y: sphY, scale: sphS, translateX: '-50%', translateY: '-50%', zIndex: 1 }}>
        <div className="relative" style={{ width: 600, height: 600 }}>
          <motion.div className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(227,6,19,0.12) 0%, transparent 65%)', border: `1px solid ${C.border}` }}
            animate={rm ? {} : { rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute rounded-full"
            style={{ inset: 80, background: 'radial-gradient(circle, rgba(176,5,15,0.25) 0%, transparent 60%)', border: `1px dashed ${C.borderStrong}` }}
            animate={rm ? {} : { rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
          <div className="absolute rounded-full"
            style={{ inset: 180, background: `radial-gradient(circle, ${C.neon} 0%, ${C.neon2} 45%, transparent 80%)`,
              boxShadow: `0 0 140px ${C.neon}, inset 0 0 80px ${C.magenta}`, filter: 'blur(2px)' }} />
          {!rm && [...Array(6)].map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <motion.div key={i} className="absolute rounded-full"
                style={{ left: '50%', top: '50%', width: 8, height: 8,
                  background: i % 2 === 0 ? C.cyan : C.magenta,
                  boxShadow: `0 0 14px ${i % 2 === 0 ? C.cyan : C.magenta}` }}
                animate={{
                  x: [Math.cos(a) * 260, Math.cos(a + Math.PI * 2) * 260],
                  y: [Math.sin(a) * 260, Math.sin(a + Math.PI * 2) * 260],
                }}
                transition={{ duration: 14 + i * 2, repeat: Infinity, ease: 'linear' }} />
            );
          })}
        </div>
      </motion.div>

      <div className="relative mx-auto px-6 w-full" style={{ maxWidth: 1200, zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs uppercase"
          style={{ background: 'rgba(227,6,19,0.07)', border: '1px solid rgba(227,6,19,0.25)',
            color: C.neon, letterSpacing: '0.2em', backdropFilter: 'blur(8px)' }}>
          <Sparkles size={12} /> Yapay Zeka Destekli Oto Ekspertiz
        </motion.div>
        <RevealHeading text="Aracının Gerçek Durumunu"
          className="text-5xl md:text-7xl lg:text-8xl font-semibold"
          style={{ color: C.text, letterSpacing: '-0.04em', lineHeight: 0.92 }} />
        <RevealHeading text="Saniyeler İçinde Öğren."
          className="text-5xl md:text-7xl lg:text-8xl font-semibold mt-2"
          style={{ background: `linear-gradient(135deg, ${C.neon} 0%, ${C.magenta} 50%, ${C.cyan} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: '-0.04em', lineHeight: 0.92 }} delay={0.3} />
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut, delay: 1.1 }}
          className="mt-8 text-base md:text-xl max-w-2xl leading-relaxed" style={{ color: C.textDim }}>
          Gecit Kfz Sachverständiger, ruhsat fotoğrafından aracın tüm künyesini saniyeler içinde okur. Tramer geçmişi, değişen parça kayıtları ve 120 noktalık ekspertiz sürecini
          <span style={{ color: C.text, fontWeight: 500 }}> tek platformda</span> birleştirir.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut, delay: 1.3 }}
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <MagneticButton variant="primary" ariaLabel="Online termin al"
            onClick={() => window.dispatchEvent(new CustomEvent('gecit-kfz:book'))}>
            Online Termin Al <ArrowRight size={18} />
          </MagneticButton>
          <MagneticButton variant="ghost" ariaLabel="Süreci izle">
            <Play size={14} /> 60 saniyede süreci gör
          </MagneticButton>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: 200, background: `linear-gradient(180deg, transparent 0%, ${C.bg} 100%)`, zIndex: 2 }} />
    </section>
  );
}

// ─── Banner Showcase (One-File / Vier Portale) ─────
function BannerShowcase() {
  const [lightbox, setLightbox] = useState(null);
  const banners = [
    {
      src: './banner/unnamed%20(13).png',
      alt: 'Gecit Kfz Sachverständiger — Ein Index, Vier Welten: Kunde, Anwalt, Versicherer, Admin',
      title: 'Vier Portale, Ein Index',
      desc: 'Müşteri, avukat, sigortacı ve admin — dört rolün dört portali, tek `index.html` dosyasında.',
      accent: C.neon,
    },
    {
      src: './banner/unnamed%20(14).png',
      alt: 'Gecit Kfz Sachverständiger — One File Architecture: Das gesamte Kfz-Expertise-Ökosystem',
      title: 'One File Architecture',
      desc: 'Kurulum yok, sunucu yok. Tüm ekosistem tarayıcıda doğrudan çalışır.',
      accent: C.cyan,
    },
  ];
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1280 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-12">
          <p className="text-xs uppercase mb-4" style={{ color: C.neon, letterSpacing: '0.25em' }}>Sistem Anatomisi</p>
          <h2 className="text-3xl md:text-5xl font-semibold" style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Tek Dosya, <span style={{ color: C.neon }}>Dört Portal</span>, Tüm Ekosistem
          </h2>
          <p className="mt-4 text-base md:text-lg max-w-2xl mx-auto" style={{ color: C.textDim }}>
            Gecit Kfz Sachverständiger'nin mimari özeti: KFZ-ekspertiz iş kolunun tüm halkaları tek bir dosyada birleşir.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map((b, i) => (
            <motion.button key={i} type="button"
              onClick={() => setLightbox(b)}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: easeOut, delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl overflow-hidden text-left"
              style={{ background: C.surface, border: `1px solid ${C.border}`, cursor: 'zoom-in' }}>
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(600px circle at 50% 40%, ${b.accent}22, transparent 60%)` }} />
              <div className="relative">
                <img src={b.src} alt={b.alt}
                  loading="lazy"
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{ display: 'block' }} />
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `linear-gradient(180deg, transparent 60%, ${C.surface}dd 100%)` }} />
              </div>
              <div className="relative p-6 md:p-7" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ color: C.text, letterSpacing: '-0.01em' }}>
                      {b.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.textDim }}>{b.desc}</p>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: `${b.accent}15`, color: b.accent, border: `1px solid ${b.accent}33` }}>
                    Büyüt <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 flex items-center justify-center p-4 md:p-10"
            style={{ zIndex: 200, background: 'rgba(7,6,11,0.92)', backdropFilter: 'blur(8px)', cursor: 'zoom-out' }}>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              src={lightbox.src} alt={lightbox.alt}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full rounded-2xl"
              style={{ boxShadow: `0 20px 60px ${lightbox.accent}55, 0 0 80px ${lightbox.accent}22`, border: `1px solid ${lightbox.accent}44` }} />
            <button onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.07)', color: C.text, border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}>
              <XClose size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Marquee ────────────────────────────────────
function Marquee() {
  const logos = [
    { Icon: Shield, label: 'OtoGüven' }, { Icon: Rocket, label: 'Motorex' },
    { Icon: BarChart3, label: 'TramerX' }, { Icon: Globe, label: 'AutoNet' },
    { Icon: Layers, label: 'Dinamo' }, { Icon: Cpu, label: 'ŞasiPro' },
    { Icon: Database, label: 'GaraBox' }, { Icon: Code, label: 'OtoLink' },
  ];
  const doubled = [...logos, ...logos];
  const rm = useReducedMotion();
  return (
    <section className="relative py-20 overflow-hidden" style={{ zIndex: 2 }}>
      <p className="text-center text-xs uppercase mb-10" style={{ color: C.textDim, letterSpacing: '0.25em' }}>
        Türkiye'nin güvenilir ekspertiz ağı · 500+ servis
      </p>
      <div className="relative">
        <motion.div className="flex gap-16 whitespace-nowrap"
          animate={rm ? {} : { x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
          {doubled.map(({ Icon, label }, i) => (
            <div key={i} className="flex items-center gap-3 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{ color: C.textDim }}>
              <Icon size={28} strokeWidth={1.5} />
              <span className="text-2xl font-mono tracking-tight">{label}</span>
            </div>
          ))}
        </motion.div>
        <div className="absolute top-0 bottom-0 left-0 pointer-events-none" style={{ width: 140, background: `linear-gradient(90deg, ${C.bg}, transparent)` }} />
        <div className="absolute top-0 bottom-0 right-0 pointer-events-none" style={{ width: 140, background: `linear-gradient(270deg, ${C.bg}, transparent)` }} />
      </div>
    </section>
  );
}

// ─── Spotlight card ─────────────────────────────
function SpotlightCard({ children, className = '', size = 'md' }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [active, setActive] = useState(false);
  return (
    <motion.div ref={ref}
      onMouseMove={e => {
        const r = ref.current.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)}
      whileHover={{ y: -4 }} transition={spring}
      className={`relative rounded-3xl overflow-hidden ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.border}`,
        minHeight: size === 'lg' ? 360 : 260 }}>
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: active ? 1 : 0,
          background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(227,6,19,0.08), transparent 40%)` }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, rgba(227,6,19,0.18), transparent 40%)`,
          WebkitMask: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, black, transparent 40%)`,
          mask: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, black, transparent 40%)`,
          opacity: active ? 0.4 : 0, transition: 'opacity 500ms',
          padding: 1, borderRadius: 24, border: `1px solid ${C.neon}` }} />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

// ─── Features ───────────────────────────────────
function Features() {
  const features = [
    { icon: Brain, title: 'AI Ruhsat Okuma (OCR)', desc: 'Ruhsat fotoğrafını yükle — şasi numarası, plaka, marka, model ve yıl saniyeler içinde otomatik doldurulsun. Yazım hatası sıfır.', span: 'col-span-12 md:col-span-8', size: 'lg', accent: C.neon },
    { icon: Zap, title: 'Anlık Araç Geçmişi', desc: 'Şasi ya da plaka üzerinden tramer, kaza ve değişen parça raporuna tek tıkla eriş.', span: 'col-span-12 md:col-span-4', size: 'lg', accent: C.cyan },
    { icon: Target, title: 'Online Termin Sistemi', desc: 'Google Takvim senkronlu boş saatler. Müşteri randevu alır, servis ajandasına anında işlenir.', span: 'col-span-12 md:col-span-5', size: 'md', accent: C.magenta },
    { icon: TrendingUp, title: 'Canlı Ekspertiz Takibi', desc: 'Mekanik, kaporta, boya, rapor. Müşteri sürecin her aşamasını bar üzerinde gerçek zamanlı görür.', span: 'col-span-12 md:col-span-7', size: 'md', accent: C.neon2 },
  ];
  return (
    <section className="relative py-32 md:py-40" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="mb-16 md:mb-24">
          <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>Özellikler</p>
          <h2 className="text-4xl md:text-6xl font-semibold max-w-3xl" style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Oto Ekspertizin <span style={{ color: C.neon }}>Dijital Standardı</span>.
          </h2>
          <p className="mt-6 text-lg max-w-2xl" style={{ color: C.textDim }}>
            Ruhsat tarama, tramer geçmişi, termin yönetimi, canlı ekspertiz takibi ve müşteri portalı — hepsi tek çatı altında.
          </p>
        </motion.div>
        <div className="grid grid-cols-12 gap-4">
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: easeOut, delay: i * 0.1 }}
              className={f.span}>
              <SpotlightCard size={f.size} className="h-full">
                <div className="flex flex-col h-full p-8 md:p-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: `${f.accent}20`, border: `1px solid ${f.accent}44`,
                      color: f.accent, boxShadow: `0 0 30px ${f.accent}22` }}>
                    <f.icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold mb-3"
                    style={{ color: C.text, letterSpacing: '-0.02em' }}>{f.title}</h3>
                  <p className="leading-relaxed" style={{ color: C.textDim }}>{f.desc}</p>
                  <div className="mt-auto pt-8">
                    <span className="inline-flex items-center gap-1 text-sm" style={{ color: f.accent }}>
                      Detaylı incele <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Kostenlos Banner ────────────────────────────
function KostenlosBanner() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: 'rgba(227,6,19,0.04)', border: '1px solid rgba(227,6,19,0.15)' }}>

          <div className="relative p-10 md:p-16">
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Left: Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                    border: '1px solid rgba(239,68,68,0.25)',
                    boxShadow: '0 0 40px rgba(239,68,68,0.1)' }}>
                  <ScaleIcon size={44} style={{ color: '#EF4444' }} />
                </div>
              </motion.div>

              {/* Center: Content */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs uppercase mb-3 font-semibold tracking-widest" style={{ color: '#EF4444' }}>
                  Ihre Vorteile mit uns
                </p>
                <h2 className="text-3xl md:text-5xl font-bold mb-4"
                  style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  Kostenlos für <span style={{ color: '#EF4444' }}>Geschädigte</span>
                </h2>
                <p className="text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: C.textDim }}>
                  Bei Fremdverschuldung zahlen Sie nichts. Wir rechnen direkt mit der gegnerischen Versicherung ab.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <span style={{ color: '#34D399', fontSize: 16 }}>✓</span>
                    <span className="text-sm" style={{ color: '#34D399' }}>Keine Vorauszahlung</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <span style={{ color: '#34D399', fontSize: 16 }}>✓</span>
                    <span className="text-sm" style={{ color: '#34D399' }}>Direkte Abrechnung</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <span style={{ color: '#34D399', fontSize: 16 }}>✓</span>
                    <span className="text-sm" style={{ color: '#34D399' }}>Professionelles Gutachten</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Rights after accident ────────────────────────
function RechteSection() {
  const items = [
    { title: 'Freie Gutachterwahl', desc: 'Sie haben das Recht, Ihren eigenen unabhängigen Gutachter zu wählen. Lassen Sie sich keinen Gutachter von der Versicherung vorschreiben.' },
    { title: 'Volle Reparaturkosten', desc: 'Die gegnerische Versicherung muss die vollen Reparaturkosten gemäß Gutachten übernehmen — auch in einer Markenwerkstatt.' },
    { title: 'Wertminderung', desc: 'Ihr Fahrzeug verliert durch den Unfall an Wert. Diese merkantile Wertminderung steht Ihnen als Entschädigung zu.' },
    { title: 'Mietwagen & Nutzungsausfall', desc: 'Für die Dauer der Reparatur steht Ihnen Mietwagen zu. Alternativ können Sie Nutzungsausfallentschädigung verlangen.' },
  ];
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold mb-4"
            style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Ihre Rechte nach einem <span style={{ color: '#F59E0B' }}>Unfall</span>
          </h2>
          <p className="text-lg" style={{ color: C.textDim }}>
            Als Geschädigter stehen Ihnen viele Rechte zu. Wir setzen diese für Sie durch.
          </p>
        </motion.div>
        <div className="space-y-4">
          {items.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.1 }}
              className="rounded-2xl p-6 md:p-8 flex gap-5"
              style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}`,
                backdropFilter: 'blur(4px)' }}>
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: C.text }}>{item.title}</h3>
                <p className="leading-relaxed" style={{ color: C.textDim }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why Choose Gecit Kfz Sachverständiger ─────────────────────────────
function WhyGecitKfz() {
  const benefits = [
    {
      icon: InfinityIcon,
      title: 'Ömür Boyu Erişim',
      desc: 'Ekspertiz raporlarınız ve belgeleriniz sonsuza kadar dijital arşivde. İstediğiniz zaman, istediğiniz yerden ulaşın.',
      accent: C.neon,
      gradient: `linear-gradient(135deg, ${C.neon}18, ${C.neon2}08)`,
      borderColor: `${C.neon}30`,
      stat: '∞',
      statLabel: 'Sınırsız Saklama',
    },
    {
      icon: GlobeIcon,
      title: 'Her Yerden Erişim',
      desc: 'Mobil, tablet veya bilgisayar — fark etmez. Belgeleriniz her cihazda, her zaman yanınızda.',
      accent: C.cyan,
      gradient: `linear-gradient(135deg, ${C.cyan}18, rgba(6,182,212,0.05))`,
      borderColor: `${C.cyan}30`,
      stat: '24/7',
      statLabel: 'Kesintisiz Hizmet',
    },
    {
      icon: UsersGroupIcon,
      title: 'Tek Portal, Üç Kullanıcı',
      desc: 'Müşteri, avukat ve sigortacı aynı platformu kullanır. Bilgi akışı kopma olmadan, tek merkezden yönetilir.',
      accent: C.magenta,
      gradient: `linear-gradient(135deg, ${C.magenta}18, rgba(236,72,153,0.05))`,
      borderColor: `${C.magenta}30`,
      stat: '3in1',
      statLabel: 'Birleşik Platform',
    },
    {
      icon: RadioTowerIcon,
      title: 'Canlı Veri Akışı',
      desc: 'Ekspertiz sürecini adım adım canlı takip edin. Mekanik, kaporta, rapor — her aşama anlık güncellenir.',
      accent: '#34D399',
      gradient: 'linear-gradient(135deg, rgba(52,211,153,0.09), rgba(16,185,129,0.04))',
      borderColor: 'rgba(52,211,153,0.3)',
      stat: 'LIVE',
      statLabel: 'Gerçek Zamanlı',
    },
    {
      icon: FolderCheckIcon,
      title: 'Merkezi Evrak Takibi',
      desc: '51 kategoride belgeler, tek panelden yönetim. Ekspertiz, sigorta, hukuki süreç — her evrak yerli yerinde.',
      accent: '#F59E0B',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.09), rgba(217,119,6,0.04))',
      borderColor: 'rgba(245,158,11,0.3)',
      stat: '51',
      statLabel: 'Belge Kategorisi',
    },
  ];

  return (
    <section className="relative py-32 md:py-40 overflow-hidden" style={{ zIndex: 2 }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${C.neon}08, transparent 70%)`, filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${C.cyan}06, transparent 70%)`, filter: 'blur(60px)' }} />
      </div>

      <div className="mx-auto px-6 relative" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-20">
          <p className="text-xs uppercase mb-5 font-semibold" style={{ color: C.cyan, letterSpacing: '0.25em' }}>Warum Gecit Kfz Sachverständiger?</p>
          <h2 className="text-4xl md:text-6xl font-semibold max-w-4xl mx-auto" style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Neden <span style={{ background: `linear-gradient(135deg, ${C.neon}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gecit Kfz Sachverständiger</span>'u Tercih Etmelisiniz?
          </h2>
          <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: C.textDim }}>
            Belgeleriniz güvende, süreçleriniz şeffaf, herkes aynı sayfada.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {benefits.map((b, i) => {
            const isWide = i < 2;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: easeOut, delay: i * 0.08 }}
                className={`group relative rounded-3xl overflow-hidden ${i === 0 ? 'md:col-span-2' : i === 1 ? 'md:col-span-1' : i === 2 ? 'md:col-span-1' : i === 3 ? 'md:col-span-1' : 'md:col-span-1'}`}
                style={{ background: b.gradient, border: `1px solid ${b.borderColor}`,
                  backdropFilter: 'blur(8px)', minHeight: 240 }}>
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ background: `radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${b.accent}12, transparent 60%)` }} />

                <div className="relative p-8 md:p-10 h-full flex flex-col">
                  {/* Top row: icon + stat */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `${b.accent}15`, border: `1px solid ${b.accent}35`,
                        boxShadow: `0 0 30px ${b.accent}15` }}>
                      <b.icon size={26} strokeWidth={1.6} style={{ color: b.accent }} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-mono font-bold" style={{ color: b.accent, textShadow: `0 0 20px ${b.accent}40` }}>{b.stat}</div>
                      <div className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: `${b.accent}99` }}>{b.statLabel}</div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: C.text, letterSpacing: '-0.02em' }}>{b.title}</h3>
                  <p className="leading-relaxed text-sm md:text-base" style={{ color: C.textDim }}>{b.desc}</p>

                  {/* Bottom accent line */}
                  <div className="mt-auto pt-6">
                    <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${b.accent}40, transparent)` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {[
            { icon: ShieldIcon, text: 'DSGVO-Konform' },
            { icon: ShieldIcon, text: 'SSL Verschlüsselt' },
            { icon: ShieldIcon, text: 'Deutsche Server' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
              <t.icon size={14} strokeWidth={2} style={{ color: C.neon }} />
              <span className="text-xs font-medium" style={{ color: C.textDim }}>{t.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How it works ───────────────────────────────
function HowItWorks() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const pathLen = useTransform(scrollYProgress, [0.1, 0.8], [0, 1]);
  const steps = [
    { n: '01', title: 'Termin Al', desc: 'Online takvimden uygun saati seç. Randevu Google Takvim üzerinde işaretlenir, SMS ve e-posta ile onay gelir.', align: 'left' },
    { n: '02', title: 'Ruhsatını Yükle', desc: 'Ruhsat fotoğrafını sürükle-bırak ile yükle. AI saniyeler içinde araç bilgisini okur; tramer ve kaza geçmişi anında görünür.', align: 'right' },
    { n: '03', title: 'Raporunu Al', desc: 'Mekanik, kaporta ve boya kontrolü tamamlandığında detaylı PDF rapor müşteri portalına ve e-postana düşer.', align: 'left' },
  ];
  return (
    <section ref={ref} className="relative py-32 md:py-40 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-20">
          <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>Nasıl Çalışır</p>
          <h2 className="text-4xl md:text-6xl font-semibold" style={{ color: C.text, letterSpacing: '-0.03em' }}>
            3 Adımda <span style={{ color: C.neon }}>Güvenli Ekspertiz</span>
          </h2>
        </motion.div>
        <div className="relative">
          <svg className="absolute left-1/2 top-0 pointer-events-none hidden md:block"
            width="400" height="1100" viewBox="0 0 400 1100"
            style={{ transform: 'translateX(-50%)', zIndex: 0, overflow: 'visible' }}
            aria-hidden="true">
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.neon} />
                <stop offset="50%" stopColor={C.magenta} />
                <stop offset="100%" stopColor={C.cyan} />
              </linearGradient>
              <filter id="pathGlow">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <motion.path
              d="M 200 0 C 200 150, 80 200, 80 350 C 80 500, 320 500, 320 700 C 320 850, 200 900, 200 1100"
              fill="none" stroke="url(#pathGrad)" strokeWidth="2.5" strokeLinecap="round"
              filter="url(#pathGlow)" style={{ pathLength: pathLen }} />
          </svg>
          <div className="space-y-24 md:space-y-40 relative">
            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease: easeOut }}
                className={`flex flex-col md:flex-row items-center gap-8 ${s.align === 'right' ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center font-mono text-2xl md:text-3xl"
                    style={{ background: C.surface, border: `2px solid ${C.neon}`, color: C.neon,
                      boxShadow: `0 0 40px ${C.glow}, inset 0 0 20px ${C.glow}` }}>
                    {s.n}
                  </div>
                </div>
                <div className="flex-1 p-8 md:p-10 rounded-3xl max-w-md"
                  style={{ background: C.surface2, border: `1px solid ${C.border}`, backdropFilter: 'blur(12px)' }}>
                  <h3 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: C.text, letterSpacing: '-0.02em' }}>{s.title}</h3>
                  <p className="text-lg leading-relaxed" style={{ color: C.textDim }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stat ───────────────────────────────────────
function Stat({ value, prefix = '', suffix = '', label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [disp, setDisp] = useState(0);
  const rm = useReducedMotion();
  useEffect(() => {
    if (!inView) return;
    if (rm) { setDisp(value); return; }
    let start = null; const dur = 1800;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(Math.floor(value * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, rm]);
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: easeOut }} className="text-center md:text-left">
      <div className="font-mono tabular-nums text-5xl md:text-7xl font-semibold"
        style={{ background: `linear-gradient(135deg, ${C.neon} 0%, ${C.magenta} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          letterSpacing: '-0.04em' }}>
        {prefix}{disp}{suffix}
      </div>
      <p className="mt-3 text-sm uppercase" style={{ color: C.textDim, letterSpacing: '0.2em' }}>{label}</p>
    </motion.div>
  );
}

function Stats() {
  return (
    <section className="relative py-32 md:py-40" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="mb-20">
          <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>Güven</p>
          <h2 className="text-4xl md:text-6xl font-semibold max-w-3xl" style={{ color: C.text, letterSpacing: '-0.03em' }}>
            Sayılarla güvenin adı.
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          <Stat value={15} suffix="K+" label="Tamamlanan Ekspertiz" />
          <Stat value={3} suffix="sn" label="Ruhsat OCR Süresi" />
          <Stat value={120} suffix="+" label="Kontrol Noktası" />
          <Stat value={98} suffix="%" label="Müşteri Memnuniyeti" />
        </div>
      </div>
    </section>
  );
}

// ─── Testimonial ────────────────────────────────
function Testimonial() {
  return (
    <section className="relative py-32 md:py-40" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1000 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: easeOut }}
          className="relative p-10 md:p-16 rounded-3xl"
          style={{ background: '#F8F8F8', border: `1px solid ${C.border}` }}>
          <Quote size={48} style={{ color: C.neon, opacity: 0.6 }} />
          <blockquote className="mt-6 text-3xl md:text-5xl italic leading-tight"
            style={{ color: C.text, letterSpacing: '-0.02em', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            "İkinci el araç aldık; Gecit Kfz Sachverständiger ruhsattan saniyede okudu, 20 yıllık galericinin bile kaçırdığı değişen parçayı yakaladı. Paranın tam karşılığı."
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg"
              style={{ background: '#E30613', color: '#FFFFFF' }}>MY</div>
            <div>
              <p style={{ color: C.text }} className="font-medium">Mehmet Yıldız</p>
              <p className="text-sm" style={{ color: C.textDim }}>Kurucu Ortak @ Yıldız Motors</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pricing ────────────────────────────────────
function PricingCard({ name, price, desc, features, highlighted, cta }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={spring}
      className="relative p-8 rounded-3xl h-full flex flex-col"
      style={{ background: highlighted ? C.surface2 : C.surface,
        border: highlighted ? '2px solid #E30613' : `1px solid ${C.border}`,
        boxShadow: highlighted ? `0 0 60px ${C.glow}` : 'none' }}>
      {highlighted && (
        <div className="absolute px-4 py-1 rounded-full text-xs uppercase font-bold"
          style={{ top: -14, left: '50%', transform: 'translateX(-50%)',
            background: '#E30613', color: '#FFFFFF', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>En Popüler</div>
      )}
      <p className="text-sm uppercase mb-4" style={{ color: C.neon, letterSpacing: '0.2em' }}>{name}</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-5xl font-semibold font-mono tabular-nums"
          style={{ color: C.text, letterSpacing: '-0.03em' }}>{price}</span>
        {price !== 'Özel' && <span style={{ color: C.textDim }}>/ay</span>}
      </div>
      <p className="mb-8 text-sm" style={{ color: C.textDim }}>{desc}</p>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm" style={{ color: C.text }}>
            <Check size={16} style={{ color: C.neon, marginTop: 3, flexShrink: 0 }} />{f}
          </li>
        ))}
      </ul>
      <button data-magnetic className="w-full py-3 rounded-lg font-semibold text-sm transition-all"
        style={highlighted
          ? { background: '#E30613', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(227,6,19,0.30)' }
          : { background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }}>
        {cta}
      </button>
    </motion.div>
  );
}

function Pricing() {
  return (
    <section className="relative py-32 md:py-40" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-20">
          <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>Paketler</p>
          <h2 className="text-4xl md:text-6xl font-semibold" style={{ color: C.text, letterSpacing: '-0.03em' }}>
            Her araç için doğru paket.
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingCard name="Standart" price="₺1.490" desc="Bireysel araç sahipleri için temel ekspertiz paketi."
            features={['60 nokta görsel kontrol', 'Dijital PDF rapor', 'Tramer geçmişi sorgulama', 'Online termin + SMS bildirim']} cta="Termin Al" />
          <PricingCard name="Premium" price="₺2.990" desc="İkinci el alıcılar ve oto galerilerinin ilk tercihi."
            features={['120 nokta detaylı kontrol', 'AI ruhsat OCR analizi', 'Kaporta + boya kalınlık ölçümü', 'Motor + şanzıman testi', 'Müşteri portalına tam erişim']}
            highlighted cta="Premium Seç" />
          <PricingCard name="Kurumsal" price="Özel" desc="Galeri, sigorta ve filo firmalarına özel çözümler."
            features={['Aylık sınırsız ekspertiz', 'Özel CRM + API entegrasyonu', 'Kurumsal fatura & cari takip', 'Öncelikli servis hattı + SLA']} cta="Bizimle Görüş" />
        </div>
      </div>
    </section>
  );
}

// ─── Footer CTA ─────────────────────────────────
function FooterCTA() {
  const rm = useReducedMotion();
  return (
    <section className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: '100vh', zIndex: 2 }}>
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ width: 900, height: 900,
          background: 'radial-gradient(circle, rgba(227,6,19,0.12) 0%, rgba(176,5,15,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)' }}
        animate={rm ? {} : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative text-center px-6" style={{ maxWidth: 900 }}>
        <RevealHeading text="Aracının Gerçek Hikayesini Öğren."
          className="text-5xl md:text-7xl lg:text-8xl font-semibold"
          style={{ color: C.text, letterSpacing: '-0.04em', lineHeight: 0.95 }} />
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: easeOut, delay: 0.6 }}
          className="mt-8 text-lg md:text-xl" style={{ color: C.textDim }}>
          İlk ekspertizinde %15 indirim. 5 dakikada online termin.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: easeOut, delay: 0.8 }}
          className="mt-10 flex justify-center">
          <MagneticButton variant="primary" ariaLabel="Online termin al" className="text-base"
            onClick={() => window.dispatchEvent(new CustomEvent('gecit-kfz:book'))}>
            Online Termin Al <ArrowRight size={18} />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────
function Footer() {
  const cols = [
    { title: 'Hizmet', links: ['Ekspertiz Paketleri', 'Tramer Sorgulama', 'AI Ruhsat OCR', 'Kurumsal Çözümler'] },
    { title: 'Şirket', links: ['Hakkımızda', 'Şubeler', 'Kariyer', 'İletişim'] },
    { title: 'Destek', links: ['Nasıl Çalışır', 'SSS', 'Müşteri Portalı', 'Galeri Paneli'] },
    { title: 'Yasal', links: ['Gizlilik', 'Kullanım Şartları', 'Çerez Politikası', 'KVKK'] },
  ];
  return (
    <footer className="relative pt-20 pb-10"
      style={{ borderTop: `1px solid ${C.border}`, background: C.bg, zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-0 font-mono text-2xl" style={{ color: C.text }}>
              <span>Gecit&nbsp;</span>
              <span style={{ color: C.neon, textShadow: `0 0 12px ${C.glow}` }}>K</span>
              <span>fz</span>
            </div>
            <p className="mt-4 text-sm" style={{ color: C.textDim }}>
              Oto ekspertizin dijital standardı.
            </p>
          </div>
          {cols.map((col, i) => (
            <div key={i}>
              <p className="text-xs uppercase mb-4" style={{ color: C.text, letterSpacing: '0.2em' }}>{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l, j) => (
                  <li key={j}><a href="#" className="text-sm transition-colors hover:text-gray-900" style={{ color: C.textDim }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
          style={{ borderTop: `1px solid ${C.border}`, color: C.textDim }}>
          <p>© 2026 Gecit Kfz Sachverständiger. Tüm hakları saklıdır.</p>
          <p className="flex items-center gap-1">
            İstanbul'da <Zap size={12} style={{ color: C.neon }} /> ile üretildi.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ════════════════════════════════════════════════
//           CRM + MÜŞTERİ PORTALI
// ════════════════════════════════════════════════

// ─── Mock database (localStorage-backed) ────────
const DB_KEY = 'gecit_kfz_db_v6';

// ═══════════════════════════════════════════════════════
// Gecit Kfz Sachverständiger DataService — Unified Data Layer
// MODE: 'local' = localStorage (demo/offline)
//       'live'  = Supabase (production)
// Tek switch ile canlıya geç: GECIT_KFZ_MODE = 'live'
// ═══════════════════════════════════════════════════════
// Varsayılan Supabase bağlantısı (env yoksa hardcoded fallback kullanılır)
const DEFAULT_SUPABASE_URL = 'https://kqbcbhtqxidegimidxfh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYmNiaHRxeGlkZWdpbWlkeGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTMwMDIsImV4cCI6MjA5MzEyOTAwMn0.cauDwrs0bZCEwmWifU2nFRK0O_ooOaJA5-TSEgs13sY';

const ENV_SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

const SUPABASE_CONFIG = {
  url: localStorage.getItem('gecit_kfz_supabase_url') || ENV_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  anonKey: localStorage.getItem('gecit_kfz_supabase_key') || ENV_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
};

// Env veya fallback ile geçerli bir URL/Key varsa otomatik canlı moda geç
const HAS_VALID_SUPABASE = SUPABASE_CONFIG.url.startsWith('https://') &&
  !SUPABASE_CONFIG.url.includes('YOUR_PROJECT') &&
  SUPABASE_CONFIG.anonKey.length > 20;

const GECIT_KFZ_MODE = localStorage.getItem('gecit_kfz_mode') || (HAS_VALID_SUPABASE ? 'live' : 'local');

// Table name mapping — localStorage keys → Supabase table names
const TABLE_MAP = {
  customers: 'customers',
  vehicles: 'vehicles',
  appraisals: 'appraisals',
  invoices: 'invoices',
  appointments: 'appointments',
  customer_documents: 'customer_documents',
  customer_notes: 'customer_notes',
  vehicle_notes: 'vehicle_notes',
  lawyers: 'lawyers',
  lawyer_assignments: 'lawyer_assignments',
  lawyer_tasks: 'lawyer_tasks',
  lawyer_cases: 'lawyer_cases',
  court_dates: 'court_dates',
  messages: 'messages',
  notifications: 'notifications',
  activity_logs: 'activity_logs',
  satisfaction_surveys: 'satisfaction_surveys',
  insurers: 'insurers',
  insurance_claims: 'insurance_claims',
  insurance_offers: 'insurance_offers',
  damage_photos: 'damage_photos',
  damage_timeline: 'damage_timeline',
  objection_templates: 'objection_templates',
  file_flows: 'file_flows',
  whatsapp_templates: 'whatsapp_templates',
  gallery: 'gallery',
  reminders: 'reminders',
  live_feed: 'live_feed',
};

// Supabase client singleton
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  if (!HAS_VALID_SUPABASE) {
    console.warn('[Gecit-KFZ] Supabase URL/anonKey eksik — local moda fallback. Ayarlar > Veri Kaynagi sekmesinden ekleyin.');
    return null;
  }
  _supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  console.log('[Gecit-KFZ] Supabase client initialized →', SUPABASE_CONFIG.url);
  return _supabase;
}

// ─── Supabase CRUD helpers ──────────────────────────
const SupabaseOps = {
  async fetchTable(table) {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from(TABLE_MAP[table] || table).select('*');
    if (error) { console.error(`[Gecit-KFZ] Fetch ${table}:`, error); return []; }
    return data || [];
  },

  async fetchAll() {
    const sb = getSupabase();
    if (!sb) return null;
    const tables = Object.keys(TABLE_MAP);
    const results = {};
    const fetches = tables.map(async (t) => {
      results[t] = await SupabaseOps.fetchTable(t);
    });
    await Promise.all(fetches);
    // Handle special non-array fields
    results.paint_maps = results.paint_maps || {};
    results.lawyer_permissions = results.lawyer_permissions || {};
    results.sla_config = results.sla_config || { max_hours: 48 };
    results.loyalty_points = results.loyalty_points || {};
    results.customer_segments = results.customer_segments || {};
    return results;
  },

  async insert(table, record) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from(TABLE_MAP[table] || table).insert(record).select();
    if (error) console.error(`[Gecit-KFZ] Insert ${table}:`, error);
    return data?.[0] || null;
  },

  async update(table, id, changes) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from(TABLE_MAP[table] || table).update(changes).eq('id', id).select();
    if (error) console.error(`[Gecit-KFZ] Update ${table}:`, error);
    return data?.[0] || null;
  },

  async remove(table, id) {
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb.from(TABLE_MAP[table] || table).delete().eq('id', id);
    if (error) { console.error(`[Gecit-KFZ] Delete ${table}:`, error); return false; }
    return true;
  },

  async upsert(table, record) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from(TABLE_MAP[table] || table).upsert(record).select();
    if (error) console.error(`[Gecit-KFZ] Upsert ${table}:`, error);
    return data?.[0] || null;
  },
};

// ─── Supabase Auth helpers ──────────────────────────
const SupabaseAuth = {
  async signIn(email, password) {
    const sb = getSupabase();
    if (!sb) return { user: null, error: 'Supabase not initialized' };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    // Fetch user role from profiles table
    const { data: profile } = await sb.from('user_profiles').select('*').eq('id', data.user.id).single();
    return { user: { ...data.user, ...profile }, error: null };
  },

  async signOut() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  },

  async getSession() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  },

  onAuthChange(callback) {
    const sb = getSupabase();
    if (!sb) return () => {};
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => subscription.unsubscribe();
  },
};

// ─── Realtime Subscriptions ─────────────────────────
const RealtimeService = {
  _channels: [],

  subscribe(table, callback) {
    const sb = getSupabase();
    if (!sb) return () => {};
    const channel = sb
      .channel(`gecit_kfz_${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_MAP[table] || table }, (payload) => {
        console.log(`[Gecit-KFZ RT] ${table}:`, payload.eventType, payload.new);
        callback(payload);
      })
      .subscribe();
    this._channels.push(channel);
    return () => { sb.removeChannel(channel); };
  },

  subscribeAll(onUpdate) {
    const unsubs = [];
    const criticalTables = ['messages', 'notifications', 'insurance_claims', 'insurance_offers', 'appraisals', 'appointments'];
    criticalTables.forEach(table => {
      unsubs.push(this.subscribe(table, (payload) => {
        onUpdate(table, payload);
      }));
    });
    return () => unsubs.forEach(fn => fn());
  },

  cleanup() {
    const sb = getSupabase();
    if (!sb) return;
    this._channels.forEach(ch => sb.removeChannel(ch));
    this._channels = [];
  },
};

// ─── Storage Service (Supabase Storage for files) ───
const StorageService = {
  async uploadFile(bucket, path, file) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { console.error('[Gecit-KFZ Storage]', error); return null; }
    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
    return urlData?.publicUrl || null;
  },

  async deleteFile(bucket, path) {
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb.storage.from(bucket).remove([path]);
    return !error;
  },

  getPublicUrl(bucket, path) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  },
};

// ─── DataService — Unified interface ────────────────
// Tüm portallar bunu kullanır. Mode'a göre local veya Supabase'e yönlendirir.
const DataService = {
  mode: GECIT_KFZ_MODE,

  isLive() { return this.mode === 'live' && !!getSupabase(); },

  // Full DB fetch (initial load)
  async loadAll() {
    if (this.isLive()) {
      const data = await SupabaseOps.fetchAll();
      if (data) return data;
    }
    return loadDB(); // fallback to localStorage
  },

  // Table-level operations
  async getTable(table) {
    if (this.isLive()) return SupabaseOps.fetchTable(table);
    const db = loadDB();
    return db[table] || [];
  },

  async addRecord(table, record) {
    if (this.isLive()) return SupabaseOps.insert(table, record);
    // localStorage handled by useDB setDb pattern
    return record;
  },

  async updateRecord(table, id, changes) {
    if (this.isLive()) return SupabaseOps.update(table, id, changes);
    return { id, ...changes };
  },

  async deleteRecord(table, id) {
    if (this.isLive()) return SupabaseOps.remove(table, id);
    return true;
  },

  // Auth
  async login(email, password) {
    if (this.isLive()) return SupabaseAuth.signIn(email, password);
    return { user: null, error: 'local_mode' }; // handled by LoginDrawer locally
  },

  async logout() {
    if (this.isLive()) return SupabaseAuth.signOut();
  },

  // Realtime
  onDataChange(callback) {
    if (this.isLive()) return RealtimeService.subscribeAll(callback);
    return () => {}; // no-op for local mode
  },

  // File upload
  async uploadFile(file, path) {
    if (this.isLive()) return StorageService.uploadFile('documents', path, file);
    // Local: convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  },
};

// ─── Supabase-ready useDB hook ──────────────────────
// In local mode: works exactly as before (localStorage)
// In live mode: initial load from Supabase, writes go to both
//              + realtime subscription auto-updates state
const STAGES = [
  { key: 'bekliyor',   label: 'Kabul Edildi',       pct: 20,  color: '#6B6B6B' },
  { key: 'mekanik',    label: 'Mekanik Kontrol',    pct: 45,  color: '#E30613' },
  { key: 'kaporta',    label: 'Kaporta / Boya',     pct: 70,  color: '#B0050F' },
  { key: 'rapor',      label: 'Rapor Hazırlanıyor', pct: 90,  color: '#7A0309' },
  { key: 'tamamlandi', label: 'Rapor Hazır',        pct: 100, color: '#16A34A' },
];

// ─── Document Categories (from Akte system) ─────
const DOC_CATEGORIES = [
  { key: 'keine_kategorie',              label: 'Keine Kategorie',                      group: 'Genel',       color: '#8B8B8B' },
  { key: 'abrechnungsschreiben',          label: 'Abrechnungsschreiben',                 group: 'Abrechnung',  color: '#E30613' },
  { key: 'abrechnungsschreiben_rsv',      label: 'Abrechnungsschreiben RSV',             group: 'Abrechnung',  color: '#E30613' },
  { key: 'abschleppkosten',               label: 'Abschleppkosten',                      group: 'Kosten',      color: '#F59E0B' },
  { key: 'abtretungserklaerung',          label: 'Abtretungserklärung',                  group: 'Vertrag',     color: '#34D399' },
  { key: 'abtretungserklaerung_mietwagen', label: 'Abtretungserklärung Mietwagen',       group: 'Vertrag',     color: '#34D399' },
  { key: 'abtretungserklaerung_reparatur', label: 'Abtretungserklärung Reparatur',       group: 'Vertrag',     color: '#34D399' },
  { key: 'abtretungserklaerung_zug',      label: 'Abtretungserklärung Zug um Zug',      group: 'Vertrag',     color: '#34D399' },
  { key: 'achsvermessung_protokoll',       label: 'Achsvermessung Protokoll',             group: 'Prüfung',    color: '#B0050F' },
  { key: 'anschreiben_gutachter',          label: 'Anschreiben Gutachter',               group: 'Gutachten',   color: '#E30613' },
  { key: 'arbeitsunfaehigkeit',            label: 'Arbeitsunfähigkeitsbescheinigung',    group: 'Medizinisch', color: '#EF4444' },
  { key: 'aerztliches_attest',             label: 'Ärztliches Attest',                   group: 'Medizinisch', color: '#EF4444' },
  { key: 'aufnahmebogen',                  label: 'Aufnahmebogen',                       group: 'Genel',       color: '#8B8B8B' },
  { key: 'ausweisdokument',                label: 'Ausweisdokument',                     group: 'Dokument',    color: '#7A0309' },
  { key: 'diagnosebericht',                label: 'Diagnosebericht',                     group: 'Prüfung',    color: '#B0050F' },
  { key: 'fahrzeugbrief',                  label: 'Fahrzeugbrief',                       group: 'Fahrzeug',    color: '#06B6D4' },
  { key: 'fahrzeugschein',                 label: 'Fahrzeugschein',                      group: 'Fahrzeug',    color: '#06B6D4' },
  { key: 'ga_hilfestellung',               label: 'GA Hilfestellung',                    group: 'Gutachten',   color: '#E30613' },
  { key: 'gruene_karte',                   label: 'Grüne Karte',                         group: 'Versicherung', color: '#10B981' },
  { key: 'gruene_karte_ablehnung',         label: 'Grüne Karte (Ablehnung)',             group: 'Versicherung', color: '#10B981' },
  { key: 'gruene_karte_zwischenbescheid',  label: 'Grüne Karte (Zwischenbescheid)',      group: 'Versicherung', color: '#10B981' },
  { key: 'gutachten',                      label: 'Gutachten',                           group: 'Gutachten',   color: '#E30613' },
  { key: 'honorarvereinbarung',            label: 'Honorarvereinbarung (Gutachten)',      group: 'Gutachten',   color: '#E30613' },
  { key: 'hu_bericht',                     label: 'HU Bericht',                          group: 'Prüfung',    color: '#B0050F' },
  { key: 'kaufvertrag',                    label: 'Kaufvertrag',                         group: 'Vertrag',     color: '#34D399' },
  { key: 'kostenvoranschlag',              label: 'Kostenvoranschlag',                   group: 'Kosten',      color: '#F59E0B' },
  { key: 'lackschichtdickenmessung',       label: 'Lackschichtdickenmessung',            group: 'Prüfung',    color: '#B0050F' },
  { key: 'marktanalyse',                   label: 'Marktanalyse',                        group: 'Gutachten',   color: '#E30613' },
  { key: 'marktwertanalyse',               label: 'Marktwertanalyse',                    group: 'Gutachten',   color: '#E30613' },
  { key: 'mietvertrag',                    label: 'Mietvertrag',                         group: 'Vertrag',     color: '#34D399' },
  { key: 'minderwertreport',               label: 'Minderwertreport',                    group: 'Gutachten',   color: '#E30613' },
  { key: 'polizeibericht',                 label: 'Polizeibericht',                      group: 'Dokument',    color: '#7A0309' },
  { key: 'pruefbericht',                   label: 'Prüfbericht',                         group: 'Prüfung',    color: '#B0050F' },
  { key: 'pruefbericht_repko',             label: 'Prüfbericht RepKo',                   group: 'Prüfung',    color: '#B0050F' },
  { key: 'pruefbericht_sv_kosten',         label: 'Prüfbericht SV-Kosten',               group: 'Prüfung',    color: '#B0050F' },
  { key: 'rechnung_achsvermessung',        label: 'Rechnung Achsvermessung',             group: 'Rechnung',    color: '#F59E0B' },
  { key: 'rechnung_gutachten',             label: 'Rechnung Gutachten',                  group: 'Rechnung',    color: '#F59E0B' },
  { key: 'rechnung_kostenvoranschlag',     label: 'Rechnung Kostenvoranschlag',          group: 'Rechnung',    color: '#F59E0B' },
  { key: 'rechnung_leihwagen',             label: 'Rechnung Leihwagen',                  group: 'Rechnung',    color: '#F59E0B' },
  { key: 'rechnung_werkstatt',             label: 'Rechnung Werkstatt',                  group: 'Rechnung',    color: '#F59E0B' },
  { key: 'reparaturbestaetigung',          label: 'Reparaturbestätigung',                group: 'Reparatur',   color: '#06B6D4' },
  { key: 'restwertangebot_sv',             label: 'Restwertangebot SV',                  group: 'Gutachten',   color: '#E30613' },
  { key: 'scheckheft',                     label: 'Scheckheft/Serviceheft',              group: 'Fahrzeug',    color: '#06B6D4' },
  { key: 'schuldeingestaendnis',           label: 'Schuldeingeständnis',                 group: 'Dokument',    color: '#7A0309' },
  { key: 'schweigepflicht',                label: 'Schweigepflicht Entbindungserklärung', group: 'Medizinisch', color: '#EF4444' },
  { key: 'sonstige_dokumente',             label: 'Sonstige Dokumente',                  group: 'Genel',       color: '#8B8B8B' },
  { key: 'stellungnahme_gutachter',        label: 'Stellungnahme Gutachter',             group: 'Gutachten',   color: '#E30613' },
  { key: 'unfallskizze',                   label: 'Unfallskizze',                        group: 'Dokument',    color: '#7A0309' },
  { key: 'versicherungsdaten_gegner',      label: 'Versicherungsdaten des Gegners',      group: 'Versicherung', color: '#10B981' },
  { key: 'vollmacht',                      label: 'Vollmacht',                           group: 'Vertrag',     color: '#34D399' },
  { key: 'zentralruf',                     label: 'Zentralruf',                          group: 'Versicherung', color: '#10B981' },
  { key: 'zeugenaussage',                  label: 'Zeugenaussage',                       group: 'Dokument',    color: '#7A0309' },
];

const DOC_GROUPS = [...new Set(DOC_CATEGORIES.map(c => c.group))];

function seedDB() {
  return {
    customers: [
      { id: 'c1', type: 'bireysel', full_name: 'Ali Veli', email: 'ali.veli@mail.com', phone: '+90 555 111 22 33', created_at: '2026-04-10' },
      { id: 'c2', type: 'bireysel', full_name: 'Ayşe Kara', email: 'ayse@mail.com', phone: '+90 532 222 33 44', created_at: '2026-04-15' },
      { id: 'c3', type: 'kurumsal', full_name: 'Mehmet Yıldız', company: 'Yıldız Motors', tax_no: '1234567890', tax_office: 'Beşiktaş', email: 'info@yildizmotors.com', phone: '+90 212 555 66 77', created_at: '2026-03-22' },
      { id: 'c4', type: 'kurumsal', full_name: 'Selim Demir', company: 'Demir Sigorta A.Ş.', tax_no: '9876543210', tax_office: 'Kadıköy', email: 'satinalma@demirsigorta.com', phone: '+90 216 444 55 66', created_at: '2026-02-14' },
    ],
    vehicles: [
      { id: 'v1', owner_id: 'c1', plate: '34 ABC 123', chassis: 'WDB2050451F123456', brand: 'Mercedes-Benz', model: 'C 180', year: 2020, created_at: '2026-04-10', tuv_date: '2026-05-20' },
      { id: 'v2', owner_id: 'c2', plate: '06 XYZ 789', chassis: 'VF1LZ5101234567', brand: 'Renault', model: 'Megane', year: 2018, created_at: '2026-04-15', tuv_date: '2026-04-15' },
      { id: 'v3', owner_id: 'c3', plate: '34 YDM 0001', chassis: 'WVWZZZ1KZ8W234567', brand: 'Volkswagen', model: 'Passat', year: 2022, created_at: '2026-03-22', tuv_date: '2026-09-12' },
    ],
    appraisals: [
      { id: 'ap1', vehicle_id: 'v1', status: 'mekanik', notes: 'Arka sol tampon boyalı tespit edildi.', created_at: '2026-04-22' },
      { id: 'ap2', vehicle_id: 'v2', status: 'tamamlandi', notes: 'Hasarsız, orijinal.', created_at: '2026-04-18' },
      { id: 'ap3', vehicle_id: 'v3', status: 'bekliyor', notes: '', created_at: '2026-04-24' },
    ],
    appointments: [
      { id: 'a1', customer_id: 'c1', date: '2026-04-25', time: '10:00', service: 'Premium Ekspertiz', status: 'onaylandi', notes: '' },
      { id: 'a2', customer_id: 'c2', date: '2026-04-25', time: '14:30', service: 'Standart Ekspertiz', status: 'onaylandi', notes: '' },
      { id: 'a3', customer_id: 'c3', date: '2026-04-26', time: '09:00', service: 'Kurumsal Filo', status: 'bekliyor', notes: '5 araç' },
    ],
    invoices: [
      { id: 'i1', customer_id: 'c1', vehicle_id: 'v1', amount: 2990, date: '2026-04-22', status: 'ödendi', no: 'Gecit-KFZ-2026-0421' },
      { id: 'i2', customer_id: 'c2', vehicle_id: 'v2', amount: 1490, date: '2026-04-18', status: 'ödendi', no: 'Gecit-KFZ-2026-0418' },
    ],
    customer_documents: [
      { id: 'cd1', customer_id: 'c1', vehicle_id: 'v1', name: 'Fahrzeugschein_Mercedes_C180.pdf', type: 'fahrzeugschein', size: 245000, data: null, uploaded_at: '2026-04-22', mime: 'application/pdf' },
      { id: 'cd2', customer_id: 'c1', vehicle_id: 'v1', name: 'Gutachten_C180.pdf', type: 'gutachten', size: 1240000, data: null, uploaded_at: '2026-04-22', mime: 'application/pdf' },
      { id: 'cd3', customer_id: 'c1', vehicle_id: 'v1', name: 'Lackschichtdickenmessung_C180.pdf', type: 'lackschichtdickenmessung', size: 512000, data: null, uploaded_at: '2026-04-23', mime: 'application/pdf' },
      { id: 'cd4', customer_id: 'c1', vehicle_id: 'v1', name: 'Kostenvoranschlag.pdf', type: 'kostenvoranschlag', size: 380000, data: null, uploaded_at: '2026-04-23', mime: 'application/pdf' },
      { id: 'cd5', customer_id: 'c2', vehicle_id: 'v2', name: 'Fahrzeugbrief_Megane.pdf', type: 'fahrzeugbrief', size: 198000, data: null, uploaded_at: '2026-04-18', mime: 'application/pdf' },
      { id: 'cd6', customer_id: 'c2', vehicle_id: 'v2', name: 'Unfallskizze.pdf', type: 'unfallskizze', size: 156000, data: null, uploaded_at: '2026-04-19', mime: 'application/pdf' },
      { id: 'cd7', customer_id: 'c3', vehicle_id: 'v3', name: 'Kaufvertrag_Passat.pdf', type: 'kaufvertrag', size: 890000, data: null, uploaded_at: '2026-04-24', mime: 'application/pdf' },
      { id: 'cd8', customer_id: 'c3', vehicle_id: 'v3', name: 'Vollmacht_YildizMotors.pdf', type: 'vollmacht', size: 125000, data: null, uploaded_at: '2026-04-24', mime: 'application/pdf' },
    ],
    customer_notes: [
      { id: 'cn1', customer_id: 'c1', text: 'Müşteri her zaman zamanında geliyor, referans potansiyeli yüksek. Ekspertiz sonrası galericiye yönlendirme yapılabilir.', category: 'genel', pinned: true, created_at: '2026-04-20T09:30:00' },
      { id: 'cn2', customer_id: 'c1', text: 'Mercedes C180 için ek boya ölçümü istendi, arka tampon mikron değerleri yüksek çıktı. Detaylı rapor hazırlandı.', category: 'teknik', pinned: false, created_at: '2026-04-22T14:15:00' },
      { id: 'cn3', customer_id: 'c2', text: 'Fatura için şirket adına kesim talep etti ama bireysel kayıtlı. Güncelleme yapılacak.', category: 'finansal', pinned: false, created_at: '2026-04-19T11:00:00' },
      { id: 'cn4', customer_id: 'c3', text: 'Yıldız Motors filo sözleşmesi 6 aylık, aylık 5 araç ekspertiz garantisi var. İndirimli paket uygulanıyor.', category: 'sozlesme', pinned: true, created_at: '2026-04-24T10:00:00' },
      { id: 'cn5', customer_id: 'c3', text: 'Muhasebe departmanından Elif Hanım ile iletişime geçilecek, fatura onayı bekleniyor.', category: 'genel', pinned: false, created_at: '2026-04-24T16:30:00' },
    ],
    lawyers: [
      { id: 'law1', name: 'Av. Mehmet Yılmaz', email: 'mehmet@hukuk.com', phone: '0532 111 22 33', password: 'avukat123', baro: 'İstanbul Barosu', baro_no: '45821', active: true, created_at: '2026-04-10' },
      { id: 'law2', name: 'Av. Zeynep Demir', email: 'zeynep@hukuk.com', phone: '0533 444 55 66', password: 'avukat123', baro: 'İstanbul Barosu', baro_no: '38764', active: true, created_at: '2026-04-12' },
      { id: 'law3', name: 'Av. Can Öztürk', email: 'can@hukuk.com', phone: '0535 777 88 99', password: 'avukat123', baro: 'Ankara Barosu', baro_no: '21453', active: true, created_at: '2026-04-15' },
    ],
    lawyer_assignments: [
      { id: 'la1', lawyer_id: 'law1', customer_id: 'c1', assigned_at: '2026-04-20' },
      { id: 'la2', lawyer_id: 'law1', customer_id: 'c2', assigned_at: '2026-04-21' },
      { id: 'la3', lawyer_id: 'law2', customer_id: 'c3', assigned_at: '2026-04-22' },
    ],
    lawyer_permissions: {
      can_view_documents: true,
      can_view_notes: true,
      can_view_invoices: true,
      can_view_vehicles: true,
      can_view_appraisals: true,
      can_view_contact_info: true,
    },
    documents: [],
    vehicle_notes: [
      { id: 'vn1', vehicle_id: 'v1', type: 'boya', part: 'Arka Sol Tampon', detail: 'Lokal boyalı, 180 mikron', color: '#7A0309', created_at: '2026-04-22' },
      { id: 'vn2', vehicle_id: 'v1', type: 'degisen', part: 'Sağ Ön Çamurluk', detail: 'Değişmiş, orijinal yedek parça', color: '#EF4444', created_at: '2026-04-22' },
      { id: 'vn3', vehicle_id: 'v1', type: 'mekanik', part: 'Motor', detail: 'Yağ kaçağı yok, sağlıklı', color: '#34D399', created_at: '2026-04-22' },
      { id: 'vn4', vehicle_id: 'v2', type: 'orijinal', part: 'Tüm Paneller', detail: 'Orijinal boyalı, hasarsız', color: '#34D399', created_at: '2026-04-18' },
      { id: 'vn5', vehicle_id: 'v3', type: 'boya', part: 'Motor Kaputu', detail: 'Komple boyalı, 200+ mikron', color: '#7A0309', created_at: '2026-04-24' },
      { id: 'vn6', vehicle_id: 'v3', type: 'mekanik', part: 'Şanzıman', detail: 'DSG bakım yapılmış, sorunsuz', color: '#B0050F', created_at: '2026-04-24' },
    ],
    reminders: [
      { id: 'r1', customer_id: 'c1', vehicle_id: 'v1', title: 'Ekspertiz raporu hazır', message: 'Ali Bey\'in Mercedes C180 raporu teslim edilecek', due_date: '2026-04-25', due_time: '17:00', repeat: 'none', status: 'active', created_at: '2026-04-22' },
      { id: 'r2', customer_id: 'c3', vehicle_id: 'v3', title: 'Filo kontrol randevusu', message: 'Yıldız Motors 5 araçlık filo kontrolü için hazırlık', due_date: '2026-04-26', due_time: '08:30', repeat: 'none', status: 'active', created_at: '2026-04-23' },
      { id: 'r3', customer_id: 'c2', vehicle_id: 'v2', title: 'Fatura gönder', message: 'Ayşe Hanım\'a tamamlanmış ekspertiz faturası gönderilecek', due_date: '2026-04-24', due_time: '16:00', repeat: 'none', status: 'active', created_at: '2026-04-20' },
    ],
    live_feed: [
      { id: 'lf1', type: 'gelen', text: 'Ali Veli — Mercedes C180 kabul edildi', time: '09:15', date: '2026-04-24', status: 'islemde' },
      { id: 'lf2', type: 'tamamlandi', text: 'Ayşe Kara — Renault Megane raporu hazır', time: '11:30', date: '2026-04-24', status: 'bitti' },
      { id: 'lf3', type: 'gelen', text: 'Yıldız Motors — VW Passat teslim alındı', time: '13:00', date: '2026-04-24', status: 'bekliyor' },
      { id: 'lf4', type: 'giden', text: 'Ayşe Kara — Megane teslim edildi', time: '14:00', date: '2026-04-24', status: 'bitti' },
    ],
    insurers: [
      { id: 'ins1', company: 'Allianz Versicherung', name: 'Thomas Müller', email: 'mueller@allianz.de', phone: '+49 170 111 2233', password: 'sigorta123', active: true, created_at: '2026-04-01' },
      { id: 'ins2', company: 'HUK-COBURG', name: 'Anna Schmidt', email: 'schmidt@huk.de', phone: '+49 171 444 5566', password: 'sigorta123', active: true, created_at: '2026-04-05' },
      { id: 'ins3', company: 'DEVK Versicherung', name: 'Klaus Weber', email: 'weber@devk.de', phone: '+49 172 777 8899', password: 'sigorta123', active: true, created_at: '2026-04-10' },
    ],
    insurance_claims: [
      { id: 'ic1', customer_id: 'c1', vehicle_id: 'v1', insurer_id: 'ins1', appraisal_id: 'ap1', status: 'inceleniyor', claim_date: '2026-04-22', damage_description: 'Arka sol tampon hasarı, park halinde çarpılma', claim_amount: 2500, offer_amount: null, notes: '' },
      { id: 'ic2', customer_id: 'c2', vehicle_id: 'v2', insurer_id: 'ins2', appraisal_id: 'ap2', status: 'onaylandi', claim_date: '2026-04-18', damage_description: 'Araç hasarsız, ekspertiz talebi', claim_amount: 0, offer_amount: 0, notes: 'Hasarsız onay' },
    ],
    insurance_assignments: [
      { id: 'ia1', insurer_id: 'ins1', customer_id: 'c1', assigned_at: '2026-04-22' },
      { id: 'ia2', insurer_id: 'ins2', customer_id: 'c2', assigned_at: '2026-04-18' },
      { id: 'ia3', insurer_id: 'ins1', customer_id: 'c4', assigned_at: '2026-04-20' },
    ],
    insurance_permissions: {
      can_view_documents: true,
      can_upload_documents: true,
      can_view_notes: false,
      can_view_invoices: true,
      can_view_vehicles: true,
      can_view_appraisals: true,
      can_view_contact_info: true,
    },
    insurance_offers: [],
    damage_photos: [
      { id: 'dp1', vehicle_id: 'v1', type: 'before', label: 'Arka Sol Tampon — Hasar Öncesi', url: null, created_at: '2026-04-22', part: 'rear_bumper' },
      { id: 'dp2', vehicle_id: 'v1', type: 'after', label: 'Arka Sol Tampon — Onarım Sonrası', url: null, created_at: '2026-04-25', part: 'rear_bumper' },
      { id: 'dp3', vehicle_id: 'v1', type: 'detail', label: 'Boya Kalınlık Ölçümü', url: null, created_at: '2026-04-22', part: 'rear_bumper' },
      { id: 'dp4', vehicle_id: 'v1', type: 'before', label: 'Sol Arka Çamurluk — Çizik', url: null, created_at: '2026-04-22', part: 'rear_left_fender' },
    ],
    damage_timeline: [
      { id: 'dt1', vehicle_id: 'v1', customer_id: 'c1', event: 'hasar_bildirimi', date: '2026-04-22', description: 'Park halinde aracın arka tamponuna çarpılma hasarı bildirildi', actor: 'customer' },
      { id: 'dt2', vehicle_id: 'v1', customer_id: 'c1', event: 'ekspertiz_basladi', date: '2026-04-23', description: 'Gecit Kfz Sachverständiger tarafından ekspertiz inceleme başlatıldı', actor: 'admin' },
      { id: 'dt3', vehicle_id: 'v1', customer_id: 'c1', event: 'sigorta_bildirim', date: '2026-04-23', description: 'Allianz Versicherung\'a hasar dosyası iletildi', actor: 'system' },
      { id: 'dt4', vehicle_id: 'v1', customer_id: 'c1', event: 'teklif_alindi', date: '2026-04-24', description: 'Sigorta şirketi €2.500 teklif verdi', actor: 'insurance' },
    ],
    objection_templates: [
      { id: 'ot1', title: 'Sigorta Red Yazısına İtiraz', category: 'red_itiraz', content: 'Sayın Yetkili,\n\n[SIGORTA_SIRKETI] tarafından [TARIH] tarihinde verilen red kararına itiraz ediyoruz.\n\nEkspertiz raporunda belirtilen hasar tutarı [HASAR_TUTARI] EUR olup, sigorta poliçesi kapsamında teminat altındadır.\n\nSaygılarımızla,\n[AVUKAT_ADI]' },
      { id: 'ot2', title: 'Düşük Teklif İtirazı', category: 'dusuk_teklif', content: 'Sayın Yetkili,\n\n[SIGORTA_SIRKETI] tarafından [TARIH] tarihinde sunulan [TEKLIF_TUTARI] EUR tutarındaki Kostenvoranschlag, bağımsız ekspertiz raporundaki [HASAR_TUTARI] EUR tutarının çok altındadır.\n\nFark raporu ekte sunulmuştur.\n\nSaygılarımızla,\n[AVUKAT_ADI]' },
      { id: 'ot3', title: 'Tazminat Talebi', category: 'tazminat', content: 'Sayın Yetkili,\n\nMüvekkilimiz [MUSTERI_ADI]\'nın [PLAKA] plakalı aracında oluşan hasar için [HASAR_TUTARI] EUR tazminat talep ediyoruz.\n\nBağımsız ekspertiz raporu ve fotoğraflar ekte sunulmuştur.\n\nSaygılarımızla,\n[AVUKAT_ADI]' },
      { id: 'ot4', title: 'Mahkeme Dilekçe Şablonu', category: 'mahkeme', content: 'SAYIN MAHKEME BAŞKANLIĞINA\n\nDavacı: [MUSTERI_ADI]\nDavalı: [SIGORTA_SIRKETI]\nKonu: Sigorta tazminat talebi\n\nBağımsız ekspertiz raporuna göre araçtaki hasar tutarı [HASAR_TUTARI] EUR olarak tespit edilmiştir. Davalı sigorta şirketi [TEKLIF_TUTARI] EUR teklif vererek haksız şekilde tazminat miktarını düşürmüştür.\n\nGereğini arz ederiz.\n[AVUKAT_ADI]' },
    ],
    file_flows: [
      { id: 'ff1', trigger: 'ekspertiz_tamamlandi', actions: ['notify_customer', 'send_to_insurance', 'notify_lawyer'], label: 'Ekspertiz Tamamlandı Akışı', active: true },
      { id: 'ff2', trigger: 'sigorta_teklif', actions: ['notify_customer', 'notify_lawyer', 'create_diff_report'], label: 'Sigorta Teklifi Geldi', active: true },
      { id: 'ff3', trigger: 'sigorta_red', actions: ['notify_customer', 'notify_lawyer', 'create_objection_draft'], label: 'Sigorta Reddi', active: true },
    ],
    whatsapp_templates: [
      { id: 'wt1', name: 'Ekspertiz Hazır', message: 'Merhaba {MUSTERI_ADI}, {PLAKA} plakalı aracınızın ekspertiz raporu hazır. Portaldan inceleyebilirsiniz: {PORTAL_LINK}', trigger: 'ekspertiz_tamamlandi' },
      { id: 'wt2', name: 'Randevu Hatırlatma', message: 'Merhaba {MUSTERI_ADI}, {TARIH} tarihli randevunuzu hatırlatmak isteriz. Gecit Kfz Sachverständiger', trigger: 'randevu_yaklasti' },
      { id: 'wt3', name: 'Sigorta Durumu', message: 'Merhaba {MUSTERI_ADI}, {PLAKA} plakalı aracınızın sigorta talebi güncellendi: {DURUM}. Detaylar portalda.', trigger: 'sigorta_guncelleme' },
      { id: 'wt4', name: 'Fatura Bildirimi', message: 'Merhaba {MUSTERI_ADI}, {FATURA_NO} numaralı faturanız oluşturuldu. Tutar: €{TUTAR}. Portaldan inceleyebilirsiniz.', trigger: 'fatura_olusturuldu' },
      { id: 'wt_tuv60', name: 'TÜV — 60 Gün Kaldı', message: 'Sayın {MUSTERI_ADI},\n\n{PLAKA} plakalı {MARKA_MODEL} aracınızın TÜV (Hauptuntersuchung) muayene tarihi yaklaşıyor.\n\nTÜV Tarihi: {TUF_TARIHI}\nKalan Süre: {KALAN_GUN} gün\n\nMuayene randevusu için bizimle iletişime geçebilirsiniz.\n\nGecit Kfz Sachverständiger', trigger: 'tuv_60g' },
      { id: 'wt_tuv30', name: 'TÜV — 30 Gün Kaldı', message: 'Sayın {MUSTERI_ADI},\n\n{PLAKA} plakalı aracınızın TÜV muayene süresi dolmak üzere.\n\nSon Tarih: {TUF_TARIHI} ({KALAN_GUN} gün kaldı)\n\nLütfen en kısa sürede muayene randevusu alın. Yardımcı olmamızı isterseniz hemen arayın.\n\nGecit Kfz Sachverständiger', trigger: 'tuv_30g' },
      { id: 'wt_tuv_gecmis', name: 'TÜV — Süresi Doldu', message: 'Sayın {MUSTERI_ADI},\n\n{PLAKA} plakalı {MARKA_MODEL} aracınızın TÜV muayenesi {TUF_TARIHI} tarihinde sona ermiştir ({KALAN_GUN} gün önce).\n\nGeçerli muayenesi olmayan araçlarla trafiğe çıkmak yasaktır ve para cezası uygulanır. Lütfen acilen muayene yaptırın.\n\nGecit Kfz Sachverständiger', trigger: 'tuv_gecmis' },
    ],
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) { const s = seedDB(); localStorage.setItem(DB_KEY, JSON.stringify(s)); return s; }
    const parsed = JSON.parse(raw);
    // Merge new seed fields for existing databases
    const seed = seedDB();
    if (!parsed.vehicle_notes) parsed.vehicle_notes = seed.vehicle_notes;
    if (!parsed.reminders) parsed.reminders = seed.reminders;
    if (!parsed.live_feed) parsed.live_feed = seed.live_feed;
    if (!parsed.customer_documents) parsed.customer_documents = seed.customer_documents;
    if (!parsed.customer_notes) parsed.customer_notes = seed.customer_notes;
    if (!parsed.lawyers) parsed.lawyers = seed.lawyers;
    if (!parsed.lawyer_assignments) parsed.lawyer_assignments = seed.lawyer_assignments;
    if (!parsed.lawyer_permissions) parsed.lawyer_permissions = seed.lawyer_permissions;
    if (!parsed.gallery) parsed.gallery = [];
    if (!parsed.paint_maps) parsed.paint_maps = {};
    if (!parsed.messages) parsed.messages = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.activity_logs) parsed.activity_logs = [];
    if (!parsed.satisfaction_surveys) parsed.satisfaction_surveys = [];
    if (!parsed.loyalty_points) parsed.loyalty_points = {};
    if (!parsed.lawyer_tasks) parsed.lawyer_tasks = [];
    if (!parsed.lawyer_cases) parsed.lawyer_cases = [];
    if (!parsed.court_dates) parsed.court_dates = [];
    if (!parsed.sla_config) parsed.sla_config = { max_hours: 48 };
    if (!parsed.customer_segments) parsed.customer_segments = {};
    if (!parsed.insurers) { const s = seedDB(); parsed.insurers = s.insurers; }
    if (!parsed.insurance_claims) { const s = seedDB(); parsed.insurance_claims = s.insurance_claims; }
    if (!parsed.insurance_assignments) { const s = seedDB(); parsed.insurance_assignments = s.insurance_assignments; }
    if (!parsed.insurance_permissions) { const s = seedDB(); parsed.insurance_permissions = s.insurance_permissions; }
    if (!parsed.insurance_offers) parsed.insurance_offers = [];
    if (!parsed.damage_photos) parsed.damage_photos = [];
    if (!parsed.damage_timeline) { const s = seedDB(); parsed.damage_timeline = s.damage_timeline; }
    if (!parsed.objection_templates) { const s = seedDB(); parsed.objection_templates = s.objection_templates; }
    if (!parsed.file_flows) { const s = seedDB(); parsed.file_flows = s.file_flows; }
    if (!parsed.whatsapp_templates) { const s = seedDB(); parsed.whatsapp_templates = s.whatsapp_templates; }
    // Migration: add TÜV templates if missing
    const tuvIds = ['wt_tuv60', 'wt_tuv30', 'wt_tuv_gecmis'];
    const existingIds = (parsed.whatsapp_templates || []).map(t => t.id);
    if (!tuvIds.every(id => existingIds.includes(id))) {
      const s = seedDB();
      const missing = s.whatsapp_templates.filter(t => tuvIds.includes(t.id) && !existingIds.includes(t.id));
      parsed.whatsapp_templates = [...(parsed.whatsapp_templates || []), ...missing];
    }
    return parsed;
  } catch (e) { return seedDB(); }
}
function saveDB(db) { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }

// Mobile breakpoint hook (lg: 1024px+ desktop, altı mobil)
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e) => setM(e.matches);
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler); };
  }, []);
  return m;
}

function useDB() {
  const [db, setDb] = useState(() => loadDB());
  const [liveReady, setLiveReady] = useState(false);

  // Live mode: fetch from Supabase on mount
  useEffect(() => {
    if (DataService.isLive()) {
      DataService.loadAll().then(data => {
        if (data) { setDb(data); setLiveReady(true); }
      });
    }
  }, []);

  // Live mode: subscribe to realtime changes
  useEffect(() => {
    if (!DataService.isLive()) return;
    const unsub = DataService.onDataChange((table, payload) => {
      setDb(prev => {
        const arr = Array.isArray(prev[table]) ? [...prev[table]] : [];
        if (payload.eventType === 'INSERT') {
          arr.push(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          const idx = arr.findIndex(r => r.id === payload.new.id);
          if (idx !== -1) arr[idx] = payload.new;
        } else if (payload.eventType === 'DELETE') {
          const idx = arr.findIndex(r => r.id === payload.old?.id);
          if (idx !== -1) arr.splice(idx, 1);
        }
        return { ...prev, [table]: arr };
      });
    });
    return unsub;
  }, [liveReady]);

  const update = useCallback((fn) => {
    setDb(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      // Always save to localStorage (offline cache / fallback)
      saveDB(next);
      // In live mode, Supabase writes happen at the call site via DataService
      return next;
    });
  }, []);

  return [db, update];
}
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Genel Kural: Musteriye yapilan her evrak girisi PDF olur ────────────
// Avukat/admin tarafindan musteri icin olusturulan TUM kayitlar (dava dosyasi,
// itiraz yazisi, mahkeme takvimi, vb.) bu helper araciligi ile PDF'e
// donusturulur ve ilgili musterinin kartina (customer_documents) yazilir.
// Yeni bir "musteri evraki" yaratan ozellik eklerken bu fonksiyonu kullan.
function buildCustomerPdfDoc({ customer_id, customerLabel = '', title, body,
                               type = 'hukuki', signatureLine = '', uploadedBy = '' }) {
  const today = new Date().toLocaleDateString('tr-TR');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 20;
  const marginY = 22;
  const contentWidth = pageWidth - marginX * 2;

  // Mor ust serit (marka renkleri)
  pdf.setFillColor(124, 58, 237);
  pdf.rect(0, 0, pageWidth, 12, 'F');

  // Baslik
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(20, 20, 20);
  pdf.text(title, marginX, marginY);

  // Meta satiri (musteri + tarih)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(110, 110, 110);
  if (customerLabel) pdf.text(`Musteri: ${customerLabel}`, marginX, marginY + 7);
  pdf.text(`Tarih: ${today}`, pageWidth - marginX, marginY + 7, { align: 'right' });

  // Cizgi
  pdf.setDrawColor(220, 220, 220);
  pdf.line(marginX, marginY + 11, pageWidth - marginX, marginY + 11);

  // Govde metni
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  const lines = pdf.splitTextToSize(body || '', contentWidth);
  let y = marginY + 22;
  const lineH = 6;
  lines.forEach(line => {
    if (y > pageHeight - marginY) { pdf.addPage(); y = marginY; }
    pdf.text(line, marginX, y);
    y += lineH;
  });

  // Footer (imza satiri)
  if (signatureLine) {
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`${signatureLine}  |  Gecit Kfz Sachverstandiger`, marginX, pageHeight - 10);
  }

  const dataUri = pdf.output('datauristring');
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80);
  const fileName = `${safeTitle} - ${today.replace(/\./g, '-')}.pdf`;

  return {
    id: 'cd' + uid(),
    customer_id,
    vehicle_id: '',
    name: fileName,
    type,
    size: Math.round(dataUri.length * 0.75),
    data: dataUri,
    uploaded_at: new Date().toISOString().slice(0, 10),
    mime: 'application/pdf',
    uploaded_by: uploadedBy,
  };
}

// ─── Activity Logging ───────────────────────────
// Centralized audit trail. Every mutation that should be visible in the
// admin "Aktivite Logları" panel must go through `makeLogEntry` + `logActivity`.
const ACTOR_ROLES = {
  super_admin: { label: 'Süper Admin', color: '#E30613', bg: 'rgba(227,6,19,0.08)',  border: 'rgba(227,6,19,0.25)'  },
  admin:       { label: 'Admin',       color: '#E30613', bg: 'rgba(227,6,19,0.08)',  border: 'rgba(227,6,19,0.25)'  },
  lawyer:      { label: 'Avukat',      color: '#B0050F', bg: 'rgba(176,5,15,0.08)',  border: 'rgba(176,5,15,0.25)'  },
  customer:    { label: 'Müşteri',     color: '#0A0A0A', bg: 'rgba(0,0,0,0.05)',     border: 'rgba(0,0,0,0.15)'     },
  ekspert:     { label: 'Eksper',      color: '#7A0309', bg: 'rgba(122,3,9,0.08)',   border: 'rgba(122,3,9,0.25)'   },
  system:      { label: 'Sistem',      color: '#6B7280', bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.25)'},
};

const ACTION_META = {
  // Auth
  login:                { label: 'Giriş yapıldı',          severity: 'info' },
  logout:               { label: 'Çıkış yapıldı',          severity: 'info' },
  // Customer
  customer_create:      { label: 'Müşteri oluşturuldu',    severity: 'info' },
  customer_update:      { label: 'Müşteri güncellendi',    severity: 'info' },
  customer_delete:      { label: 'Müşteri silindi',        severity: 'critical' },
  // Vehicle
  vehicle_create:       { label: 'Araç eklendi',           severity: 'info' },
  vehicle_update:       { label: 'Araç güncellendi',       severity: 'info' },
  vehicle_delete:       { label: 'Araç silindi',           severity: 'critical' },
  // Document
  doc_upload:           { label: 'Belge yüklendi',         severity: 'info' },
  doc_delete:           { label: 'Belge silindi',          severity: 'warning' },
  // Appraisal
  appraisal_create:     { label: 'Ekspertiz oluşturuldu',  severity: 'info' },
  appraisal_status:     { label: 'Ekspertiz durumu',       severity: 'info' },
  appraisal_update:     { label: 'Ekspertiz güncellendi',  severity: 'info' },
  appraisal_delete:     { label: 'Ekspertiz silindi',      severity: 'critical' },
  // Invoice
  invoice_create:       { label: 'Fatura oluşturuldu',     severity: 'info' },
  invoice_amount:       { label: 'Fatura tutarı değişti',  severity: 'warning' },
  invoice_status:       { label: 'Fatura durumu',          severity: 'info' },
  invoice_delete:       { label: 'Fatura silindi',         severity: 'critical' },
  // Insurance Claim
  claim_create:         { label: 'Hasar talebi oluşturuldu', severity: 'info' },
  claim_status:         { label: 'Hasar talebi durumu',    severity: 'warning' },
  claim_amount:         { label: 'Hasar tutarı değişti',   severity: 'warning' },
  // Assignments
  lawyer_assign:        { label: 'Avukat atandı',          severity: 'info' },
  lawyer_unassign:      { label: 'Avukat kaldırıldı',      severity: 'warning' },
  insurance_assign:     { label: 'Sigorta atandı',         severity: 'info' },
  insurance_unassign:   { label: 'Sigorta kaldırıldı',     severity: 'warning' },
  // Lawyer/Insurer master
  lawyer_create:        { label: 'Avukat eklendi',         severity: 'info' },
  lawyer_update:        { label: 'Avukat güncellendi',     severity: 'info' },
  lawyer_delete:        { label: 'Avukat silindi',         severity: 'critical' },
  insurer_create:       { label: 'Sigorta şirketi eklendi', severity: 'info' },
  insurer_update:       { label: 'Sigorta şirketi güncellendi', severity: 'info' },
  insurer_delete:       { label: 'Sigorta şirketi silindi', severity: 'critical' },
  // Appointment
  appointment_create:   { label: 'Randevu oluşturuldu',    severity: 'info' },
  appointment_update:   { label: 'Randevu güncellendi',    severity: 'info' },
  appointment_status:   { label: 'Randevu durumu',         severity: 'info' },
  appointment_delete:   { label: 'Randevu silindi',        severity: 'warning' },
  // Message / Note
  message_send:         { label: 'Mesaj gönderildi',       severity: 'info' },
  note_create:          { label: 'Not eklendi',            severity: 'info' },
  note_delete:          { label: 'Not silindi',            severity: 'info' },
  // Workflow
  flow_toggle:          { label: 'İş akışı değişti',       severity: 'info' },
  flow_exec:            { label: 'İş akışı çalıştırıldı',  severity: 'info' },
  // Settings
  settings_update:      { label: 'Ayar güncellendi',       severity: 'info' },
};

const SEVERITY_META = {
  info:     { color: '#6B6B6B', bg: 'rgba(0,0,0,0.05)'       },
  warning:  { color: '#B0050F', bg: 'rgba(176,5,15,0.08)'    },
  critical: { color: '#E30613', bg: 'rgba(227,6,19,0.10)'    },
};

function describeUser(user) {
  if (!user) return { id: null, name: 'Sistem', role: 'system' };
  return {
    id: user.id || user.email || null,
    name: user.full_name || user.name || user.company || user.email || 'Bilinmiyor',
    role: user.role || 'system',
  };
}

function makeLogEntry({ user, action, target = null, details = '', before = null, after = null, metadata = {} }) {
  const u = describeUser(user);
  const meta = ACTION_META[action] || { label: action, severity: 'info' };
  return {
    id: 'log' + uid() + Date.now().toString(36),
    actor_id: u.id,
    actor_name: u.name,
    actor_role: u.role,
    action,
    target,
    details: details || meta.label,
    before, after, metadata,
    severity: meta.severity || 'info',
    text: details || meta.label,
    type: action,
    user_id: u.id,
    created_at: new Date().toISOString(),
  };
}

function logActivity(setDb, entry) {
  if (!entry) return;
  setDb(prev => ({ ...prev, activity_logs: [...(prev.activity_logs || []), entry] }));
}

function withLog(updater, entry) {
  return (prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (!entry) return next;
    return { ...next, activity_logs: [...(next.activity_logs || []), entry] };
  };
}

function withLogs(updater, entries) {
  return (prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const filtered = (entries || []).filter(Boolean);
    if (!filtered.length) return next;
    return { ...next, activity_logs: [...(next.activity_logs || []), ...filtered] };
  };
}

// ─── Shared admin UI primitives ─────────────────
function GlassCard({ children, className = '', padding = 'p-6', ...rest }) {
  return (
    <div className={`rounded-2xl ${padding} ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
      {...rest}>{children}</div>
  );
}

function AdminButton({ children, variant = 'ghost', size = 'md', onClick, type = 'button', disabled, className = '' }) {
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const style = variant === 'primary'
    ? { background: '#E30613', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(227,6,19,0.30)' }
    : variant === 'danger'
    ? { background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.25)', color: '#B0050F' }
    : { background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 ${sizeCls} ${className}`}
      style={style}>{children}</button>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase mb-2" style={{ color: C.textDim, letterSpacing: '0.2em' }}>
        {label}{required && <span style={{ color: C.magenta }}> *</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', required }) {
  const [focus, setFocus] = useState(false);
  return (
    <input type={type} value={value || ''} onChange={onChange} placeholder={placeholder} required={required}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
      style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${focus ? C.neon : C.border}`, color: C.text }} />
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ''} onChange={onChange}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 40 }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value} style={{ background: C.surface2, color: C.text }}>{o.label}</option>)}
    </select>
  );
}

function AdminTopbar({ title, subtitle, action }) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: C.text, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: C.textDim }}>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

// ─── Admin Sidebar ──────────────────────────────
// ─── Mobile Topbar (hamburger + role badge) ─────────
function MobileTopbar({ onMenuClick, role = 'admin', sectionLabel, onLogout }) {
  const roleConfig = {
    admin:     { label: 'ADMIN',    color: '#E30613', bg: 'rgba(227,6,19,0.08)',  border: 'rgba(227,6,19,0.30)'  },
    customer:  { label: 'MÜŞTERİ', color: '#0A0A0A', bg: 'rgba(0,0,0,0.05)',     border: 'rgba(0,0,0,0.20)'    },
    lawyer:    { label: 'AVUKAT',   color: '#B0050F', bg: 'rgba(176,5,15,0.08)',  border: 'rgba(176,5,15,0.30)'  },
    insurance: { label: 'SİGORTA',  color: '#6B6B6B', bg: 'rgba(0,0,0,0.05)',    border: 'rgba(0,0,0,0.15)'    },
  };
  const cfg = roleConfig[role] || roleConfig.admin;
  return (
    <header className="lg:hidden sticky top-[26px] z-30 flex items-center justify-between px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onMenuClick} aria-label="Menü"
        className="w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-95"
        style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
        <div className="font-mono text-base font-semibold truncate" style={{ color: C.text }}>
          {sectionLabel || 'Gecit Kfz'}
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: cfg.color, border: `1px solid ${cfg.border}`, background: cfg.bg, letterSpacing: '0.15em' }}>
          {cfg.label}
        </span>
      </div>
      {onLogout ? (
        <button onClick={onLogout} aria-label="Çıkış"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-95"
          style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.textDim }}>
          <LogOutIcon size={16} />
        </button>
      ) : <div className="w-10 h-10" />}
    </header>
  );
}

// ─── Shared Mobile Bottom Nav (Customer / Admin / Lawyer) ────
function MobileBottomNav({ items, active, onChange, onHome, onLogout, primaryCount = 4 }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const norm = (n) => ({ key: n.key ?? n.k, label: n.label ?? n.l, icon: n.icon, badge: n.badge });
  const all = (items || []).map(norm).filter(n => n.key && n.icon);
  const primary = all.slice(0, primaryCount);
  const secondary = all.slice(primaryCount);
  const isSecondaryActive = secondary.some(n => n.key === active);
  const handleSelect = (k) => { onChange(k); setMoreOpen(false); };
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', borderTop: `1px solid ${C.border}` }}>
      <AnimatePresence>
        {moreOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 p-3 grid grid-cols-3 gap-2 overflow-y-auto"
            style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)', borderTop: `1px solid ${C.border}`, maxHeight: '60vh' }}>
            {secondary.map(t => {
              const I = t.icon;
              return (
                <button key={t.key} onClick={() => handleSelect(t.key)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl relative transition-all"
                  style={{
                    background: active === t.key ? `${C.neon}15` : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${active === t.key ? C.neon + '44' : C.border}`,
                    color: active === t.key ? C.neon : C.textDim,
                  }}>
                  <I size={18} />
                  <span className="text-[10px] leading-tight text-center">{t.label}</span>
                  {t.badge > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: C.magenta, color: '#fff' }}>{t.badge}</span>}
                </button>
              );
            })}
            {onHome && (
              <button onClick={() => { onHome(); setMoreOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}`, color: C.textDim }}>
                <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
                <span className="text-[10px]">Ana Sayfa</span>
              </button>
            )}
            {onLogout && (
              <button onClick={() => { onLogout(); setMoreOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                <LogOutIcon size={18} />
                <span className="text-[10px]">Çıkış</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-around py-2 px-1">
        {primary.map(t => {
          const I = t.icon;
          return (
            <button key={t.key} onClick={() => handleSelect(t.key)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 relative flex-1"
              style={{ color: active === t.key ? C.neon : C.textDim }}>
              <I size={20} />
              <span className="text-[9px]">{(t.label || '').split(' ')[0]}</span>
              {t.badge > 0 && <span className="absolute top-0 right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: C.magenta, color: '#fff' }}>{t.badge}</span>}
              {active === t.key && <span className="absolute -bottom-1 w-4 h-0.5 rounded-full" style={{ background: C.neon }} />}
            </button>
          );
        })}
        {(secondary.length > 0 || onHome || onLogout) && (
          <button onClick={() => setMoreOpen(v => !v)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 relative flex-1"
            style={{ color: moreOpen || isSecondaryActive ? C.neon : C.textDim }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
            <span className="text-[9px]">Daha</span>
            {secondary.some(t => t.badge > 0) && <span className="absolute top-0 right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: C.magenta, color: '#fff' }}>•</span>}
            {(moreOpen || isSecondaryActive) && <span className="absolute -bottom-1 w-4 h-0.5 rounded-full" style={{ background: C.neon }} />}
          </button>
        )}
      </div>
    </div>
  );
}

function AdminSidebar({ active, onNav, user, onLogout, onHome, reminderCount, mobileOpen, setMobileOpen }) {
  const items = [
    { key: 'home',         label: 'Ana Sayfa',           icon: LayoutDashboard },
    { key: 'live',         label: 'Canlı Dashboard',     icon: ActivityIcon },
    { key: 'bireysel',     label: 'Bireysel Müşteriler', icon: UsersIcon },
    { key: 'kurumsal',     label: 'Kurumsal Firmalar',   icon: Building },
    { key: 'appointments', label: 'Termin Planlayıcı',   icon: CalendarIcon },
    { key: 'tuv',          label: 'TÜF Takip',           icon: Shield },
    { key: 'partners',     label: 'Avukatlar & Sigorta', icon: ScaleIcon },
    { key: 'gallery',      label: 'Galeri',              icon: CameraIcon },
    { key: 'reminders',    label: 'Hatırlatmalar',       icon: BellIcon },
    { key: 'file_flows',    label: 'Dosya Akış Motoru',   icon: Zap },
    { key: 'whatsapp_tpl', label: 'WhatsApp Şablonları', icon: MessageIcon },
    { key: 'activity_logs', label: 'Aktivite Logları',   icon: EyeIcon },
    { key: 'settings',     label: 'Ayarlar',             icon: SettingsIcon },
  ];
  const closeOnMobile = () => { if (setMobileOpen) setMobileOpen(false); };
  const handleNav = (key) => { onNav(key); closeOnMobile(); };
  const isMobile = useIsMobile();
  return (
    <>
      {mobileOpen && (
        <div onClick={closeOnMobile} className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      )}
      <aside className="flex flex-col"
        style={{
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          ...(isMobile ? {
            width: 280, maxWidth: '85vw',
            position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          } : {
            width: 260, height: 'calc(100vh - 26px)', position: 'sticky', top: '26px',
            flexShrink: 0,
          }),
        }}>
      <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-0 font-mono text-xl" style={{ color: C.text }}>
          <span>GE</span>
          <span style={{ color: C.neon, textShadow: `0 0 12px ${C.glow}` }}>C</span>
          <span>IT</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#E30613', border: '1px solid rgba(227,6,19,0.30)', background: 'rgba(227,6,19,0.07)', letterSpacing: '0.15em' }}>ADMIN</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(it => {
          const isActive = active === it.key;
          return (
            <button key={it.key} onClick={() => handleNav(it.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all active:scale-[0.98]"
              style={{
                background: isActive ? 'rgba(227,6,19,0.08)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(227,6,19,0.20)' : 'transparent'}`,
                color: isActive ? '#E30613' : C.textDim,
              }}>
              <it.icon size={18} strokeWidth={1.8} />
              <span className={isActive ? 'font-medium' : ''}>{it.label}</span>
              {it.key === 'reminders' && reminderCount > 0 && !isActive && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-mono animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', minWidth: 18, textAlign: 'center' }}>
                  {reminderCount}
                </span>
              )}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: C.neon, boxShadow: `0 0 8px ${C.neon}` }} />}
            </button>
          );
        })}
      </nav>
      <div className="p-4 space-y-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <button onClick={() => { onHome(); closeOnMobile(); }} className="w-full text-xs px-3 py-2 rounded-full transition-colors hover:bg-black/5"
          style={{ color: C.textDim, border: `1px solid ${C.border}` }}>← Landing'e Dön</button>
        <div className="flex items-center gap-3 px-2 py-3 rounded-xl" style={{ background: 'rgba(227,6,19,0.05)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
            style={{ background: '#E30613', color: '#FFFFFF' }}>
            {(user?.name || user?.email || 'A').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate" style={{ color: C.text }}>{user?.name || 'Admin'}</p>
            <p className="text-xs truncate" style={{ color: C.textDim }}>{user?.email}</p>
          </div>
          <button onClick={onLogout} title="Çıkış Yap"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition"
            style={{ color: C.textDim }}><LogOutIcon size={14} /></button>
        </div>
      </div>
      </aside>
    </>
  );
}

// ─── Admin Home (Dashboard overview) ────────────
function AdminHome({ db }) {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const hour = today.getHours();

  // Time-based greeting
  let greeting = 'Günaydın';
  if (hour >= 12 && hour < 17) greeting = 'İyi Günler';
  else if (hour >= 17) greeting = 'İyi Akşamlar';

  const todaysApts = db.appointments.filter(a => a.date === todayIso);
  const activeApr = db.appraisals.filter(a => a.status !== 'tamamlandi').length;
  const totalRevenue = db.invoices.filter(i => i.status === 'ödendi').reduce((s, i) => s + i.amount, 0);
  const completedToday = db.appraisals.filter(a => a.created_at === todayIso && a.status === 'tamamlandi').length;

  // Animated stat cards
  const statCards = [
    { label: 'Heutige Termine', value: todaysApts.length, icon: CalendarIcon, color: C.neon, trend: '+2' },
    { label: 'Aktive Gutachten', value: activeApr, icon: Wrench, color: C.cyan, trend: '-1' },
    { label: 'Gesamtkunden', value: db.customers.length, icon: UsersIcon, color: C.magenta, trend: '+4' },
    { label: 'Gesamteinnahmen', value: '€' + (totalRevenue / 1000).toFixed(1) + 'K', icon: Receipt, color: '#34D399', trend: '+8%' },
  ];

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return { iso: d.toISOString().slice(0,10), label: d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' }) };
  });

  // Progress ring data
  const dailyTarget = 6;
  const dailyComplete = Math.min(todaysApts.length, dailyTarget);
  const weeklyCompleted = db.appraisals.filter(a => {
    const apDate = new Date(a.created_at);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return apDate >= weekStart && a.status === 'tamamlandi';
  }).length;
  const customerSatisfaction = 98;

  // Activity feed (mock data)
  const activities = [
    { id: 1, type: 'vehicle', text: 'Neues Fahrzeug hinzugefügt: 34 ABC 123', time: 'vor 10 Minuten', dot: C.cyan },
    { id: 2, type: 'complete', text: 'Gutachten abgeschlossen: Renault Megane', time: 'vor 1 Stunde', dot: '#34D399' },
    { id: 3, type: 'customer', text: 'Neue Kundenregistrierung: Mehmet Yıldız', time: 'vor 2 Stunden', dot: C.neon },
    { id: 4, type: 'appointment', text: 'Termin bestätigt: Ali Veli (10:00)', time: 'vor 3 Stunden', dot: C.magenta },
    { id: 5, type: 'invoice', text: 'Rechnung bezahlt: Gecit Kfz Sachverständiger-2026-0421', time: 'vor 5 Stunden', dot: '#34D399' },
  ];

  // CircularProgress component
  const CircularProgress = ({ value, max, label, color }) => {
    const percent = (value / max) * 100;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }} className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="3" />
            <motion.circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="3"
              strokeLinecap="round" initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ strokeDasharray: circumference, transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
              filter="drop-shadow(0 0 8px rgba(227,6,19,0.25))" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold font-mono" style={{ color: C.text }}>{value}/{max}</p>
            <p className="text-xs mt-1" style={{ color: C.textDim }}>abgeschlossen</p>
          </div>
        </div>
        <p className="text-xs mt-3 text-center uppercase" style={{ color: C.textDim, letterSpacing: '0.15em' }}>{label}</p>
      </motion.div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes gradient-border {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-border {
          background: linear-gradient(90deg, ${C.neon}40, ${C.magenta}40, ${C.cyan}40, ${C.neon}40);
          background-size: 300% 100%;
          animation: gradient-border 3s ease-in-out infinite;
        }
      `}</style>

      {/* Welcome Hero Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 rounded-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.neon}15, ${C.magenta}10, ${C.cyan}05)`,
          border: `1px solid ${C.border}`, backdropFilter: 'blur(12px)' }}>
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm uppercase" style={{ color: C.neon, letterSpacing: '0.2em' }}>Willkommen</p>
                <Sparkles size={14} style={{ color: C.neon }} />
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-1" style={{ color: C.text, letterSpacing: '-0.02em' }}>
                {greeting}, Admin
              </h2>
              <p className="text-sm" style={{ color: C.textDim }}>
                Heute gibt es {todaysApts.length} Termine · {activeApr} aktive Gutachten laufen · Sie haben in den letzten 7 Tagen großartige Fortschritte gemacht.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase mb-1" style={{ color: C.textDim, letterSpacing: '0.1em' }}>Heute</p>
              <p className="text-xl font-bold" style={{ color: C.text }}>{today.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</p>
              <p className="text-xs mt-2" style={{ color: C.neon }}>● System Aktiv</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animated Stat Cards with Gradient Borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
            whileHover={{ y: -4 }} className="group cursor-pointer">
            <div className="relative h-full">
              <div className="absolute inset-0 rounded-2xl animate-gradient-border opacity-40" />
              <GlassCard className="relative h-full">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle, ${s.color}40, transparent 70%)`, filter: 'blur(20px)' }} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs uppercase" style={{ color: C.textDim, letterSpacing: '0.2em' }}>{s.label}</p>
                      <div className="flex items-baseline gap-2 mt-3">
                        <p className="text-3xl font-bold font-mono tabular-nums" style={{ color: C.text, letterSpacing: '-0.02em' }}>{s.value}</p>
                        <p className="text-xs font-medium" style={{ color: s.color }}>{s.trend}</p>
                      </div>
                    </div>
                    <motion.div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}33`, boxShadow: `0 0 12px ${s.color}22` }}>
                      <s.icon size={20} strokeWidth={1.5} />
                    </motion.div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden mt-4" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${s.color}, ${C.neon})`, boxShadow: `0 0 8px ${s.color}66` }} />
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Circular Progress Rings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="flex items-center justify-center py-8">
          <CircularProgress value={dailyComplete} max={dailyTarget} label="Günlük Hedef" color={C.neon} />
        </GlassCard>
        <GlassCard className="flex items-center justify-center py-8">
          <CircularProgress value={Math.min(weeklyCompleted, 15)} max={15} label="Haftalık Tamamlanan" color={C.cyan} />
        </GlassCard>
        <GlassCard className="flex items-center justify-center py-8">
          <CircularProgress value={customerSatisfaction} max={100} label="Müşteri Memnuniyeti" color={C.magenta} />
        </GlassCard>
      </motion.div>

      {/* Enhanced Calendar + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }} className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: C.text }}>Yaklaşan Terminler</h3>
                <p className="text-xs mt-1" style={{ color: C.textDim }}>Sonraki 7 gün — tüm zaman dilimleri</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full animate-pulse" style={{ background: 'rgba(227,6,19,0.06)', color: C.neon, border: `1px solid ${C.neon}33` }}>● Canlı Senkron</span>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {days.map((d, dayIdx) => {
                const count = db.appointments.filter(a => a.date === d.iso).length;
                const isToday = d.iso === todayIso;
                return (
                  <motion.div key={d.iso} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: dayIdx * 0.05, duration: 0.3 }}
                    className="rounded-xl p-3 text-center cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: isToday ? `linear-gradient(135deg, ${C.neon}20, ${C.neon}10)` : count > 0 ? 'rgba(227,6,19,0.06)' : 'rgba(0,0,0,0.03)',
                      border: isToday ? `2px solid ${C.neon}` : `1px solid ${count > 0 ? 'rgba(227,6,19,0.18)' : C.border}`,
                      boxShadow: isToday ? `0 0 16px ${C.glow}` : 'none'
                    }}>
                    <p className="text-[10px] uppercase font-medium" style={{ color: isToday ? C.neon : C.textDim, letterSpacing: '0.15em' }}>{d.label.split(' ')[0]}</p>
                    <p className="text-lg font-mono font-bold mt-1" style={{ color: isToday ? C.neon : C.text }}>{d.label.split(' ')[1]}</p>
                    {count > 0 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: dayIdx * 0.05 + 0.2 }}
                        className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: `${C.neon}22`, color: C.neon }}>
                        {count}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="space-y-2 border-t" style={{ borderColor: C.border, paddingTop: 16 }}>
              {db.appointments.slice(0, 4).map((a, idx) => {
                const c = db.customers.find(x => x.id === a.customer_id);
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-black/[0.04]"
                    style={{ border: `1px solid ${C.border}` }}>
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-center"
                      style={{ background: 'rgba(227,6,19,0.06)', border: `1px solid rgba(227,6,19,0.12)` }}>
                      <div>
                        <p className="text-xs font-mono" style={{ color: C.textDim }}>{a.date.slice(5)}</p>
                        <p className="font-bold text-sm" style={{ color: C.neon }}>{a.time}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: C.text }}>{c?.type === 'kurumsal' ? c.company : c?.full_name || '—'}</p>
                      <p className="text-xs truncate" style={{ color: C.textDim }}>{a.service}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 capitalize font-medium"
                      style={{
                        background: a.status === 'onaylandi' ? 'rgba(52,211,153,0.1)' : 'rgba(227,6,19,0.07)',
                        color: a.status === 'onaylandi' ? '#34D399' : C.neon,
                        border: `1px solid ${a.status === 'onaylandi' ? 'rgba(52,211,153,0.3)' : 'rgba(227,6,19,0.18)'}`
                      }}>
                      {a.status === 'onaylandi' ? '✓' : '○'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}>
          <GlassCard>
            <h3 className="text-lg font-semibold mb-5" style={{ color: C.text }}>Canlı Aktivite</h3>
            <div className="space-y-3">
              {activities.map((act, idx) => (
                <motion.div key={act.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.08 }}
                  className="flex gap-3 group">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                    style={{ background: act.dot, boxShadow: `0 0 8px ${act.dot}66` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm group-hover:text-gray-900 transition-colors" style={{ color: C.text }}>{act.text}</p>
                    <p className="text-xs mt-1" style={{ color: C.textDim }}>{act.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: UsersIcon, label: 'Yeni Müşteri', desc: 'Bireysel veya kurumsal', color: C.neon, bg: 'rgba(227,6,19,0.06)' },
            { icon: CalendarIcon, label: 'Termin Oluştur', desc: 'Hızlı randevu ata', color: C.magenta, bg: 'rgba(227,6,19,0.06)' },
            { icon: Wrench, label: 'Ekspertiz Başlat', desc: 'Yeni araç analizi', color: C.cyan, bg: 'rgba(0,0,0,0.04)' },
            { icon: Receipt, label: 'Fatura Kes', desc: 'Hızlı faturalandır', color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
          ].map((action, idx) => (
            <motion.div key={idx}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + idx * 0.1 }}
              whileHover={{ y: -6 }} className="group cursor-pointer">
              <GlassCard className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                    style={{ background: action.bg, color: action.color, border: `1px solid ${action.color}33` }}>
                    <action.icon size={22} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: C.text }}>{action.label}</p>
                    <p className="text-xs mt-1" style={{ color: C.textDim }}>{action.desc}</p>
                  </div>
                  <motion.div whileHover={{ x: 4 }} className="text-sm font-medium" style={{ color: action.color }}>
                    →
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

// ─── Customer list view (bireysel / kurumsal) ──
function CustomerListView({ title, type, subtitle, db, setDb, onOpenCustomer, currentUser }) {
  const [q, setQ] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');

  const isKurum = type === 'kurumsal';
  const accent = isKurum ? C.cyan : C.neon;
  const accentSecondary = isKurum ? C.neon2 : C.magenta;
  const accentRgb = isKurum ? '176,5,15' : '122,3,9';

  const allOfType = db.customers.filter(c => c.type === type);
  const totalCustomers = allOfType.length;
  const newThisMonth = allOfType.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalVehicles = (db.vehicles || []).filter(v => allOfType.some(c => c.id === v.owner_id)).length;
  const activeAppraisals = (db.appraisals || []).filter(a => {
    const v = (db.vehicles || []).find(x => x.id === a.vehicle_id);
    const c = v && allOfType.find(x => x.id === v.owner_id);
    return c && a.status !== 'tamamlandi';
  }).length;

  const list = allOfType
    .filter(c => !q || `${c.full_name} ${c.email} ${c.phone} ${c.company || ''} ${c.tax_no || ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        const an = (isKurum ? a.company : a.full_name) || '';
        const bn = (isKurum ? b.company : b.full_name) || '';
        return an.localeCompare(bn, 'de');
      }
      if (sortBy === 'recent') return (b.created_at || '').localeCompare(a.created_at || '');
      return 0;
    });

  const getInitials = (c) => {
    const name = (isKurum ? c.company : c.full_name) || '?';
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };
  const getCustomerVehicles = (cid) => (db.vehicles || []).filter(v => v.owner_id === cid);
  const getCustomerAppraisals = (cid) => {
    const vehicleIds = getCustomerVehicles(cid).map(v => v.id);
    return (db.appraisals || []).filter(a => vehicleIds.includes(a.vehicle_id));
  };
  const getAssignedLawyer = (cid) => {
    const a = (db.lawyer_assignments || []).find(x => x.customer_id === cid);
    return a ? (db.lawyers || []).find(l => l.id === a.lawyer_id) : null;
  };
  const getAssignedInsurer = (cid) => {
    const a = (db.insurance_assignments || []).find(x => x.customer_id === cid);
    return a ? (db.insurers || []).find(i => i.id === a.insurer_id) : null;
  };

  const avatarPalettes = isKurum
    ? [['#B0050F', '#0EA5E9'], ['#06B6D4', '#0284C7'], ['#0EA5E9', '#3B82F6'], ['#10B981', '#059669'], ['#8B5CF6', '#6366F1']]
    : [['#E30613', '#E30613'], ['#7A0309', '#DB2777'], ['#FBBF24', '#F59E0B'], ['#34D399', '#10B981'], ['#F87171', '#DC2626']];
  const paletteFor = (id) => {
    let h = 0;
    for (const ch of (id || '')) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return avatarPalettes[Math.abs(h) % avatarPalettes.length];
  };

  const STATS = [
    { label: isKurum ? 'Geschäftskunden' : 'Gesamtkunden', value: totalCustomers, icon: isKurum ? Building : UsersIcon, color: accent },
    { label: 'Diesen Monat neu', value: newThisMonth, icon: TrendingUp, color: '#34D399' },
    { label: 'Reg. Fahrzeuge', value: totalVehicles, icon: CarIcon, color: '#F59E0B' },
    { label: 'Aktive Gutachten', value: activeAppraisals, icon: Wrench, color: C.magenta },
  ];

  return (
    <>
      <AdminTopbar title={title} subtitle={subtitle}
        action={<AdminButton variant="primary" onClick={() => setNewOpen(true)}><PlusIcon size={14} /> Neuer Eintrag</AdminButton>} />

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {STATS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="relative rounded-2xl p-4 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${s.color}10, transparent)`,
              border: `1px solid ${s.color}25` }}>
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full" style={{ background: `${s.color}15`, filter: 'blur(20px)' }} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>{s.label}</p>
                <p className="text-3xl font-bold font-mono mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textDim }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={isKurum ? 'Firma, Steuernummer, Ansprechpartner suchen…' : 'Name, E-Mail, Telefon suchen…'}
            className="w-full pl-11 pr-4 py-2.5 rounded-full text-sm outline-none"
            style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="text-xs px-3 py-2.5 rounded-full outline-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}>
          <option value="recent">Neueste</option>
          <option value="name">Nach Name</option>
        </select>
        <div className="inline-flex rounded-full p-1" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
          {[
            { k: 'grid', icon: Layers, label: 'Grid' },
            { k: 'list', icon: FileText, label: 'Liste' },
          ].map(v => (
            <button key={v.k} onClick={() => setViewMode(v.k)}
              className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all"
              style={{
                background: viewMode === v.k ? `linear-gradient(135deg, ${accent}, ${accentSecondary})` : 'transparent',
                color: viewMode === v.k ? '#FFFFFF' : C.textDim,
                fontWeight: viewMode === v.k ? 600 : 400,
              }}>
              <v.icon size={12} /> {v.label}
            </button>
          ))}
        </div>
        <span className="text-xs px-3 py-1 rounded-full"
          style={{ color: accent, background: `rgba(${accentRgb},0.08)`, border: `1px solid rgba(${accentRgb},0.25)` }}>
          {list.length} {list.length === 1 ? 'Eintrag' : 'Einträge'}
        </span>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="rounded-3xl py-20 text-center"
          style={{ background: 'rgba(0,0,0,0.03)', border: `1px dashed ${C.border}` }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${accent}10`, border: `1px solid ${accent}30` }}>
            {isKurum ? <Building size={28} style={{ color: accent }} /> : <UsersIcon size={28} style={{ color: accent }} />}
          </div>
          <p className="text-sm" style={{ color: C.text }}>{q ? 'Keine Treffer für diese Suche.' : 'Noch keine Einträge vorhanden.'}</p>
          <p className="text-xs mt-1" style={{ color: C.textDim }}>{q ? 'Versuchen Sie es mit einem anderen Begriff.' : 'Beginnen Sie oben rechts mit "Neuer Eintrag".'}</p>
        </div>
      )}

      {/* Grid view */}
      {list.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((c, i) => {
            const [g1, g2] = paletteFor(c.id);
            const vehicles = getCustomerVehicles(c.id);
            const apprs = getCustomerAppraisals(c.id);
            const activeAprs = apprs.filter(a => a.status !== 'tamamlandi').length;
            const lawyer = getAssignedLawyer(c.id);
            const insurer = getAssignedInsurer(c.id);
            const phoneDigits = (c.phone || '').replace(/[^0-9+]/g, '').replace('+', '');
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4 }}
                whileHover={{ y: -4 }}
                onClick={() => onOpenCustomer(c)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)`, filter: 'blur(30px)' }} />
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${g1}, ${g2})` }} />

                <div className="relative p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold"
                        style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, color: '#FFFFFF',
                          boxShadow: `0 8px 24px ${g1}33` }}>
                        {getInitials(c)}
                      </div>
                      {activeAprs > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ background: C.magenta, color: '#fff', boxShadow: `0 0 10px ${C.magenta}88`, border: `2px solid ${C.surface}` }}>
                          {activeAprs}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: accent }}>
                        {isKurum ? 'Geschäftlich · ' + (c.tax_office || '—') : 'Privat'}
                      </p>
                      <h3 className="text-base font-semibold truncate" style={{ color: C.text }}>
                        {isKurum ? c.company : c.full_name}
                      </h3>
                      {isKurum && <p className="text-xs mt-0.5 truncate" style={{ color: C.textDim }}>Ansprechpartner: {c.full_name}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <MailIcon size={12} style={{ color: C.textDim }} />
                      <span className="truncate" style={{ color: C.textDim }}>{c.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <PhoneIcon size={12} style={{ color: C.textDim }} />
                      <span className="font-mono" style={{ color: C.textDim }}>{c.phone || '—'}</span>
                    </div>
                    {isKurum && c.tax_no && (
                      <div className="flex items-center gap-2 text-xs">
                        <FileText size={12} style={{ color: C.textDim }} />
                        <span className="font-mono" style={{ color: C.textDim }}>VKN: {c.tax_no}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { v: vehicles.length, l: 'Fahrzeuge', icon: CarIcon, col: '#F59E0B' },
                      { v: apprs.length, l: 'Gutachten', icon: Wrench, col: C.cyan },
                      { v: activeAprs, l: 'Aktiv', icon: TrendingUp, col: C.magenta },
                    ].map((s, idx) => (
                      <div key={idx} className="rounded-xl p-2 text-center"
                        style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
                        <s.icon size={11} style={{ color: s.col, margin: '0 auto 2px' }} />
                        <p className="text-base font-bold font-mono leading-none" style={{ color: C.text }}>{s.v}</p>
                        <p className="text-[9px] uppercase mt-0.5" style={{ color: C.textDim, letterSpacing: '0.1em' }}>{s.l}</p>
                      </div>
                    ))}
                  </div>

                  {(lawyer || insurer) && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {lawyer && (
                        <span className="text-[10px] px-2 py-1 rounded-full inline-flex items-center gap-1"
                          style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <ScaleIcon size={10} /> {lawyer.name.replace('Av. ', '').replace('RA ', '')}
                        </span>
                      )}
                      {insurer && (
                        <span className="text-[10px] px-2 py-1 rounded-full inline-flex items-center gap-1"
                          style={{ background: 'rgba(0,0,0,0.04)', color: C.cyan, border: '1px solid rgba(0,0,0,0.08)' }}>
                          <ShieldIcon size={10} /> {insurer.company}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                    <p className="text-[10px]" style={{ color: C.textDim }}>
                      Reg: {c.created_at || '—'}
                    </p>
                    <div className="flex items-center gap-1">
                      {phoneDigits && (
                        <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${phoneDigits}`, '_blank'); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:scale-110"
                          style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}
                          title="WhatsApp">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                        </button>
                      )}
                      {c.phone && (
                        <a onClick={(e) => e.stopPropagation()} href={`tel:${c.phone}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:scale-110"
                          style={{ background: `rgba(${accentRgb},0.1)`, color: accent, border: `1px solid rgba(${accentRgb},0.25)` }}
                          title="Ara">
                          <PhoneIcon size={11} />
                        </a>
                      )}
                      <span className="ml-1 text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ color: accent, background: `rgba(${accentRgb},0.08)` }}>
                        Details <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* List view (compact) */}
      {list.length > 0 && viewMode === 'list' && (
        <GlassCard padding="p-0">
          <div className="grid gap-0 text-xs uppercase px-6 py-3"
            style={{ gridTemplateColumns: isKurum ? '60px 2fr 1.5fr 1.4fr 1.2fr 140px 100px' : '60px 2fr 1.5fr 1.4fr 140px 100px',
              color: C.textDim, letterSpacing: '0.2em', borderBottom: `1px solid ${C.border}` }}>
            <div></div>
            <div>{isKurum ? 'Firma' : 'Ad Soyad'}</div>
            <div>E-posta</div>
            <div>Telefon</div>
            {isKurum && <div>Vergi No</div>}
            <div>Atamalar</div>
            <div className="text-right">İşlem</div>
          </div>
          {list.map((c, i) => {
            const [g1, g2] = paletteFor(c.id);
            const lawyer = getAssignedLawyer(c.id);
            const insurer = getAssignedInsurer(c.id);
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => onOpenCustomer(c)}
                className="grid gap-0 items-center px-6 py-3 text-sm cursor-pointer transition-colors hover:bg-black/[0.05]"
                style={{ gridTemplateColumns: isKurum ? '60px 2fr 1.5fr 1.4fr 1.2fr 140px 100px' : '60px 2fr 1.5fr 1.4fr 140px 100px',
                  borderBottom: `1px solid ${C.border}`, color: C.text }}>
                <div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, color: '#FFFFFF' }}>
                    {getInitials(c)}
                  </div>
                </div>
                <div>
                  <p className="truncate">{isKurum ? c.company : c.full_name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: C.textDim }}>{isKurum ? 'Yetkili: ' + c.full_name : c.created_at}</p>
                </div>
                <div style={{ color: C.textDim }} className="truncate text-xs">{c.email}</div>
                <div style={{ color: C.textDim }} className="font-mono text-xs">{c.phone}</div>
                {isKurum && <div style={{ color: C.textDim }} className="font-mono text-xs">{c.tax_no || '—'}</div>}
                <div className="flex items-center gap-1">
                  {lawyer && <span className="w-5 h-5 rounded-md flex items-center justify-center" title={lawyer.name}
                    style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}><ScaleIcon size={10} /></span>}
                  {insurer && <span className="w-5 h-5 rounded-md flex items-center justify-center" title={insurer.company}
                    style={{ background: 'rgba(0,0,0,0.05)', color: C.cyan }}><ShieldIcon size={10} /></span>}
                  {!lawyer && !insurer && <span className="text-[10px]" style={{ color: C.textDim }}>—</span>}
                </div>
                <div className="text-right"><span style={{ color: accent }} className="text-xs">Detay <ChevronRight size={12} style={{ display: 'inline' }} /></span></div>
              </motion.div>
            );
          })}
        </GlassCard>
      )}

      <NewRecordModal open={newOpen} onClose={() => setNewOpen(false)} defaultType={type} setDb={setDb} currentUser={currentUser} />
    </>
  );
}

// ─── Mock OCR data (ruhsat AI okuma simülasyonu) ──
const MOCK_RUHSAT_OWNERS = {
  bireysel: [
    { full_name: 'Ali Veli',       tc: '12345678901', address: 'Atatürk Cd. No:42, Beşiktaş / İstanbul',          phone: '+90 532 111 22 33' },
    { full_name: 'Ayşe Yılmaz',    tc: '23456789012', address: 'Bağdat Cd. No:128, Kadıköy / İstanbul',           phone: '+90 533 444 55 66' },
    { full_name: 'Mehmet Demir',   tc: '34567890123', address: 'Cumhuriyet Cd. No:78, Çankaya / Ankara',          phone: '+90 535 777 88 99' },
    { full_name: 'Fatma Kaya',     tc: '45678901234', address: 'İstiklal Mah. 5. Sk. No:14, Konak / İzmir',       phone: '+90 537 222 11 00' },
  ],
  kurumsal: [
    { company: 'Yıldız Otomotiv San. Tic. A.Ş.',  tax_no: '1234567890', tax_office: 'Beşiktaş', full_name: 'Mehmet Yıldız', address: 'Maslak Mah. Büyükdere Cd. No:255, Sarıyer / İstanbul', phone: '+90 212 555 66 77' },
    { company: 'Demir Filo Çözümleri Ltd. Şti.',  tax_no: '9876543210', tax_office: 'Kadıköy',  full_name: 'Selim Demir',   address: 'Şaşkınbakkal Mah. Bağdat Cd. No:412, Kadıköy / İstanbul', phone: '+90 216 444 55 66' },
    { company: 'Aksoy Lojistik A.Ş.',             tax_no: '5556667771', tax_office: 'Çankaya',  full_name: 'Ahmet Aksoy',   address: 'Eskişehir Yolu 9. Km, Çankaya / Ankara',                  phone: '+90 312 555 22 33' },
  ],
};
const MOCK_RUHSAT_VEHICLES = [
  { plate: '34 ABC 123',  chassis: 'WDB2050451F123456',  brand: 'Mercedes-Benz', model: 'C 180', year: 2020, color: 'Beyaz',     fuel: 'Benzin', engine_cc: 1595 },
  { plate: '06 XYZ 789',  chassis: 'VF1LZ5101234567',    brand: 'Renault',       model: 'Megane',year: 2018, color: 'Gri',       fuel: 'Dizel',  engine_cc: 1461 },
  { plate: '34 YDM 0001', chassis: 'WVWZZZ1KZ8W234567',  brand: 'Volkswagen',    model: 'Passat',year: 2022, color: 'Siyah',     fuel: 'Dizel',  engine_cc: 1968 },
  { plate: '07 BMR 555',  chassis: 'WBA8E9C09KAF12345',  brand: 'BMW',           model: '320i',  year: 2021, color: 'Lacivert',  fuel: 'Benzin', engine_cc: 1998 },
  { plate: '35 AUD 042',  chassis: 'WAUZZZ8V0FA567890',  brand: 'Audi',          model: 'A3',    year: 2019, color: 'Kırmızı',   fuel: 'Benzin', engine_cc: 1395 },
];
function mockRuhsatOCR(type) {
  const owners = MOCK_RUHSAT_OWNERS[type] || MOCK_RUHSAT_OWNERS.bireysel;
  const owner = owners[Math.floor(Math.random() * owners.length)];
  const vehicle = MOCK_RUHSAT_VEHICLES[Math.floor(Math.random() * MOCK_RUHSAT_VEHICLES.length)];
  return { owner, vehicle };
}

// ─── Unified record modal (bireysel / kurumsal / avukat / sigorta) ──
// Bireysel ve kurumsal için RUHSAT-FIRST akış zorunludur.
function NewRecordModal({ open, onClose, defaultType = 'bireysel', setDb, currentUser }) {
  const [type, setType] = useState(defaultType);
  const [form, setForm] = useState({});
  // 'tab' | 'upload' | 'processing' | 'form'
  const [stage, setStage] = useState('tab');
  const [ruhsatPreview, setRuhsatPreview] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);

  const isRuhsatType = (t) => t === 'bireysel' || t === 'kurumsal';

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setForm({});
    setRuhsatPreview(null);
    setOcrConfidence(null);
    // Bireysel/kurumsal seçildiğinde önce ruhsat upload zorunlu
    setStage(isRuhsatType(defaultType) ? 'upload' : 'tab');
  }, [open, defaultType]);

  // Tip değişince stage'i resetle
  const switchType = (newType) => {
    setType(newType);
    setForm({});
    setRuhsatPreview(null);
    setOcrConfidence(null);
    setStage(isRuhsatType(newType) ? 'upload' : 'tab');
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const onRuhsatFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setRuhsatPreview(reader.result);
    reader.readAsDataURL(f);
    setStage('processing');
    setTimeout(() => {
      const { owner, vehicle } = mockRuhsatOCR(type);
      const merged = type === 'kurumsal'
        ? { ...owner, ...vehicle }
        : { full_name: owner.full_name, tc: owner.tc, address: owner.address, phone: owner.phone, ...vehicle };
      setForm(merged);
      setOcrConfidence(0.91 + Math.random() * 0.07); // 91-98%
      setStage('form');
    }, 1800);
  };

  const submit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (type === 'avukat') {
      const lawyer = {
        id: 'law' + uid(),
        name: form.full_name || '',
        email: form.email || '',
        phone: form.phone || '',
        password: form.password || '',
        baro: form.baro || '',
        baro_no: form.baro_no || '',
        notes: form.notes || '',
        active: true,
        created_at: new Date().toISOString().slice(0, 10),
      };
      setDb(withLog(
        prev => ({ ...prev, lawyers: [...(prev.lawyers || []), lawyer] }),
        makeLogEntry({
          user: currentUser, action: 'lawyer_create',
          target: { kind: 'lawyer', id: lawyer.id, label: lawyer.name },
          details: `Avukat eklendi: ${lawyer.name} (${lawyer.email})`,
        })
      ));
    } else if (type === 'sigorta') {
      const insurer = {
        id: 'ins' + uid(),
        company: form.company || '',
        name: form.full_name || '',
        email: form.email || '',
        phone: form.phone || '',
        password: form.password || '',
        notes: form.notes || '',
        active: true,
        created_at: new Date().toISOString().slice(0, 10),
      };
      setDb(withLog(
        prev => ({ ...prev, insurers: [...(prev.insurers || []), insurer] }),
        makeLogEntry({
          user: currentUser, action: 'insurer_create',
          target: { kind: 'insurer', id: insurer.id, label: insurer.company },
          details: `Sigorta şirketi eklendi: ${insurer.company}`,
        })
      ));
    } else {
      // Bireysel/kurumsal: ruhsattan gelen veriler — hem customer hem vehicle oluştur
      const customerId = 'c' + uid();
      const cust = {
        id: customerId,
        type,
        created_at: new Date().toISOString().slice(0, 10),
        full_name: form.full_name || '',
        email: form.email || '',
        phone: form.phone || '',
        address: form.address || '',
        notes: form.notes || '',
        ...(type === 'bireysel' ? { tc: form.tc || '' } : {}),
        ...(type === 'kurumsal' ? {
          company: form.company || '',
          tax_no: form.tax_no || '',
          tax_office: form.tax_office || '',
        } : {}),
      };
      const vehicleId = 'v' + uid();
      const vehicle = {
        id: vehicleId,
        owner_id: customerId,
        plate: form.plate || '',
        chassis: form.chassis || '',
        brand: form.brand || '',
        model: form.model || '',
        year: Number(form.year) || null,
        color: form.color || '',
        fuel: form.fuel || '',
        engine_cc: form.engine_cc || null,
        tuv_date: form.tuv_date || '',
        created_at: new Date().toISOString().slice(0, 10),
      };
      const appraisal = {
        id: 'ap' + uid(),
        vehicle_id: vehicleId,
        status: 'bekliyor',
        notes: '',
        created_at: new Date().toISOString().slice(0, 10),
      };
      const custLabel = cust.full_name || cust.company || cust.email;
      setDb(withLogs(
        prev => ({
          ...prev,
          customers: [...(prev.customers || []), cust],
          vehicles: [...(prev.vehicles || []), vehicle],
          appraisals: [...(prev.appraisals || []), appraisal],
        }),
        [
          makeLogEntry({
            user: currentUser, action: 'customer_create',
            target: { kind: 'customer', id: customerId, label: custLabel },
            details: `${type === 'kurumsal' ? 'Kurumsal' : 'Bireysel'} müşteri eklendi: ${custLabel}`,
          }),
          vehicle.plate ? makeLogEntry({
            user: currentUser, action: 'vehicle_create',
            target: { kind: 'vehicle', id: vehicleId, label: vehicle.plate },
            details: `Araç eklendi: ${vehicle.plate} ${vehicle.brand || ''} ${vehicle.model || ''}`.trim() + ` (${custLabel})`,
          }) : null,
          makeLogEntry({
            user: currentUser, action: 'appraisal_create',
            target: { kind: 'appraisal', id: appraisal.id, label: vehicle.plate || customerId },
            details: `Ekspertiz başlatıldı: ${vehicle.plate || custLabel}`,
          }),
        ]
      ));
    }
    onClose();
  };

  const subtitleMap = {
    bireysel: 'Önce ruhsat yükle — AI bilgileri otomatik dolduracak',
    kurumsal: 'Önce ruhsat yükle — firma ve araç bilgileri otomatik dolacak',
    avukat: 'Yeni avukat hesabı oluştur — sisteme giriş yapabilecek',
    sigorta: 'Yeni sigorta şirketi hesabı oluştur — portala giriş yapabilecek',
  };
  const tabs = [
    { k: 'bireysel', l: 'Bireysel Müşteri' },
    { k: 'kurumsal', l: 'Kurumsal Firma' },
    { k: 'avukat',   l: 'Avukat' },
    { k: 'sigorta',  l: 'Sigorta Şirketi' },
  ];

  const TabSwitcher = () => (
    <div className="mb-6 inline-flex rounded-full p-1 flex-wrap" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
      {tabs.map(t => (
        <button key={t.k} type="button" onClick={() => switchType(t.k)}
          className="px-5 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background: type === t.k
              ? (t.k === 'avukat'
                  ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
                  : t.k === 'sigorta'
                    ? 'linear-gradient(135deg, #B0050F, #7A0309)'
                    : `linear-gradient(135deg, ${C.neon}, ${C.neon2})`)
              : 'transparent',
            color: type === t.k ? '#FFFFFF' : C.textDim,
          }}>
          {t.l}
        </button>
      ))}
    </div>
  );

  // Stepper (sadece ruhsat akışında)
  const Stepper = () => {
    const steps = [
      { k: 'upload', l: 'Ruhsat Yükle', icon: UploadIcon },
      { k: 'processing', l: 'AI Analiz', icon: Sparkles },
      { k: 'form', l: 'Bilgileri Onayla', icon: Check },
    ];
    const activeIdx = steps.findIndex(s => s.k === stage);
    return (
      <div className="flex items-center justify-between mb-6 px-2">
        {steps.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <React.Fragment key={s.k}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: active ? `linear-gradient(135deg, ${C.neon}, ${C.magenta})` : done ? '#34D39920' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${active ? 'transparent' : done ? '#34D39955' : C.border}`,
                    color: active ? '#FFFFFF' : done ? '#34D399' : C.textDim,
                    boxShadow: active ? `0 0 16px ${C.neon}55` : 'none',
                  }}>
                  {done ? <Check size={14} /> : <s.icon size={14} />}
                </div>
                <p className="text-xs font-medium hidden sm:block"
                  style={{ color: active ? C.text : done ? '#34D399' : C.textDim }}>{s.l}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 rounded-full"
                  style={{ background: i < activeIdx ? '#34D39955' : C.border }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <GecitKfzModal open={open} onClose={onClose} title="Yeni Kayıt" subtitle={subtitleMap[type]} width={isRuhsatType(type) && stage === 'form' ? 760 : 640}>
      <TabSwitcher />

      {/* Avukat / Sigorta — doğrudan form */}
      {!isRuhsatType(type) && (
        <form onSubmit={submit} className="space-y-4">
          {type === 'avukat' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Ad Soyad" required><TextInput value={form.full_name || ''} onChange={set('full_name')} required placeholder="Av. ..." /></Field>
                <Field label="Telefon"><TextInput value={form.phone || ''} onChange={set('phone')} placeholder="0532 ..." /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="E-posta" required><TextInput type="email" value={form.email || ''} onChange={set('email')} required placeholder="avukat@hukuk.com" /></Field>
                <Field label="Giriş Şifresi" required><TextInput type="password" value={form.password || ''} onChange={set('password')} required placeholder="En az 4 karakter" /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Baro"><TextInput value={form.baro || ''} onChange={set('baro')} placeholder="İstanbul Barosu" /></Field>
                <Field label="Baro Sicil No"><TextInput value={form.baro_no || ''} onChange={set('baro_no')} placeholder="45821" /></Field>
              </div>
              <p className="text-xs px-1" style={{ color: C.textDim }}>Avukat bu e-posta ve şifre ile sisteme giriş yapabilecek.</p>
            </>
          )}
          {type === 'sigorta' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Firma Adı" required><TextInput value={form.company || ''} onChange={set('company')} required placeholder="Örn: Allianz Versicherung" /></Field>
                <Field label="Yetkili Kişi"><TextInput value={form.full_name || ''} onChange={set('full_name')} placeholder="Örn: Thomas Müller" /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="E-posta" required><TextInput type="email" value={form.email || ''} onChange={set('email')} required placeholder="iletisim@sigorta.com" /></Field>
                <Field label="Telefon"><TextInput value={form.phone || ''} onChange={set('phone')} placeholder="+49 ..." /></Field>
              </div>
              <Field label="Giriş Şifresi" required><TextInput type="password" value={form.password || ''} onChange={set('password')} required placeholder="En az 4 karakter" /></Field>
              <p className="text-xs px-1" style={{ color: C.textDim }}>Sigorta şirketi bu e-posta ve şifre ile sigortacı portalına giriş yapabilecek.</p>
            </>
          )}
          <Field label="Notlar"><TextInput value={form.notes || ''} onChange={set('notes')} placeholder="İsteğe bağlı" /></Field>
          <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <AdminButton onClick={onClose}>İptal</AdminButton>
            <AdminButton type="submit" variant="primary"><Check size={14} /> Kaydet</AdminButton>
          </div>
        </form>
      )}

      {/* Bireysel / Kurumsal — ruhsat-first akış */}
      {isRuhsatType(type) && (
        <>
          <Stepper />

          {stage === 'upload' && (
            <div>
              <div className="mb-4 p-4 rounded-xl text-sm flex items-start gap-3"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                <Shield size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium" style={{ color: C.text }}>Ruhsat zorunlu</p>
                  <p className="text-xs mt-1" style={{ color: C.textDim }}>
                    {type === 'bireysel'
                      ? 'Bireysel müşteri kaydı oluşturmak için önce aracın ruhsatını yüklemen gerekiyor. AI sahip ad-soyadını, T.C. kimlik numarasını, adresini ve araç bilgilerini ruhsattan okuyacak.'
                      : 'Kurumsal firma kaydı oluşturmak için önce ruhsat yüklenmeli. AI firma ünvanını, vergi numarasını ve araç bilgilerini ruhsattan otomatik çekecek.'}
                  </p>
                </div>
              </div>
              <label className="block rounded-3xl p-10 text-center cursor-pointer transition-all hover:bg-black/[0.03]"
                style={{ border: `2px dashed ${C.border}` }}>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onRuhsatFile(e.target.files?.[0])} />
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `linear-gradient(135deg, ${C.neon}20, ${C.magenta}20)`, color: C.neon, border: `1px solid ${C.neon}33` }}>
                  <UploadIcon size={28} />
                </div>
                <p className="text-lg font-medium" style={{ color: C.text }}>Araç Ruhsatını Yükle</p>
                <p className="text-sm mt-2" style={{ color: C.textDim }}>Ruhsat fotoğrafı veya PDF'i sürükleyip bırak ya da tıklayıp seç.</p>
                <p className="text-xs mt-4" style={{ color: C.neon }}>● AI OCR otomatik çalışır — sahip + araç bilgileri saniyeler içinde doldurulur</p>
              </label>
              <div className="mt-6 flex items-center gap-2 text-xs" style={{ color: C.textDim }}>
                <Sparkles size={12} style={{ color: C.neon }} />
                Google Cloud Vision / OpenAI Vision entegrasyonu Supabase Edge Function üzerinden tetiklenecek.
              </div>
              <div className="flex justify-start mt-6">
                <AdminButton onClick={onClose}>İptal</AdminButton>
              </div>
            </div>
          )}

          {stage === 'processing' && (
            <div className="py-16 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto rounded-full mb-6"
                style={{ background: `conic-gradient(${C.neon}, ${C.magenta}, ${C.cyan}, ${C.neon})`,
                  mask: 'radial-gradient(circle, transparent 55%, black 58%)',
                  WebkitMask: 'radial-gradient(circle, transparent 55%, black 58%)',
                  boxShadow: `0 0 40px ${C.glow}` }} />
              <p className="text-lg font-medium" style={{ color: C.text }}>Ruhsat Analiz Ediliyor…</p>
              <p className="text-sm mt-2" style={{ color: C.textDim }}>AI OCR çalışıyor · sahip bilgileri ve araç künyesi okunuyor</p>
              <div className="mt-4 inline-block text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(227,6,19,0.06)', color: C.neon, border: `1px solid ${C.neon}33`, letterSpacing: '0.15em' }}>● VISION API ACTIVE</div>
            </div>
          )}

          {stage === 'form' && (
            <form onSubmit={submit} className="space-y-5">
              {/* OCR sonuç banner'ı */}
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.text }}>Ruhsat başarıyla okundu</p>
                    <p className="text-xs mt-0.5" style={{ color: C.textDim }}>
                      Alanları kontrol et — yanlış olanları düzelt, eksikleri tamamla.
                      {ocrConfidence != null && (
                        <span style={{ color: '#34D399' }}> · Güven skoru: %{(ocrConfidence * 100).toFixed(1)}</span>
                      )}
                    </p>
                  </div>
                </div>
                {ruhsatPreview && (
                  <img src={ruhsatPreview} alt="Ruhsat önizleme"
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    style={{ border: `1px solid ${C.border}` }} />
                )}
                <button type="button" onClick={() => { setStage('upload'); setRuhsatPreview(null); setForm({}); setOcrConfidence(null); }}
                  className="text-xs px-3 py-1.5 rounded-lg transition hover:bg-black/5 flex-shrink-0"
                  style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                  Yeniden Yükle
                </button>
              </div>

              {/* SAHİP BİLGİLERİ */}
              <div>
                <p className="text-xs uppercase mb-3 flex items-center gap-2" style={{ color: C.neon, letterSpacing: '0.2em' }}>
                  <UsersIcon size={12} /> {type === 'kurumsal' ? 'Firma Bilgileri' : 'Sahip Bilgileri'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {type === 'kurumsal' && (
                    <>
                      <Field label="Firma Ünvanı" required>
                        <TextInput value={form.company || ''} onChange={set('company')} required placeholder="Örn: Yıldız Otomotiv A.Ş." />
                      </Field>
                      <Field label="Vergi Numarası" required>
                        <TextInput value={form.tax_no || ''} onChange={set('tax_no')} required placeholder="10 haneli" />
                      </Field>
                      <Field label="Vergi Dairesi">
                        <TextInput value={form.tax_office || ''} onChange={set('tax_office')} placeholder="Örn: Beşiktaş" />
                      </Field>
                      <Field label="Yetkili Ad Soyad" required>
                        <TextInput value={form.full_name || ''} onChange={set('full_name')} required />
                      </Field>
                    </>
                  )}
                  {type === 'bireysel' && (
                    <>
                      <Field label="Ad Soyad" required>
                        <TextInput value={form.full_name || ''} onChange={set('full_name')} required />
                      </Field>
                      <Field label="T.C. Kimlik No">
                        <TextInput value={form.tc || ''} onChange={set('tc')} placeholder="11 haneli" />
                      </Field>
                    </>
                  )}
                  <Field label="E-posta" required>
                    <TextInput type="email" value={form.email || ''} onChange={set('email')} required placeholder="ornek@mail.com" />
                  </Field>
                  <Field label="Telefon" required>
                    <TextInput value={form.phone || ''} onChange={set('phone')} placeholder="+90 5xx xxx xx xx" required />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Adres">
                      <TextInput value={form.address || ''} onChange={set('address')} placeholder="Mah. / Cad. / No / İlçe / İl" />
                    </Field>
                  </div>
                </div>
              </div>

              {/* ARAÇ BİLGİLERİ */}
              <div>
                <p className="text-xs uppercase mb-3 flex items-center gap-2" style={{ color: C.cyan, letterSpacing: '0.2em' }}>
                  <CarIcon size={12} /> Araç Bilgileri
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Plaka" required>
                    <TextInput value={form.plate || ''} onChange={set('plate')} required placeholder="34 ABC 123" />
                  </Field>
                  <Field label="Şasi No (VIN)" required>
                    <TextInput value={form.chassis || ''} onChange={set('chassis')} required placeholder="17 haneli" />
                  </Field>
                  <Field label="Marka" required>
                    <TextInput value={form.brand || ''} onChange={set('brand')} required />
                  </Field>
                  <Field label="Model" required>
                    <TextInput value={form.model || ''} onChange={set('model')} required />
                  </Field>
                  <Field label="Model Yılı" required>
                    <TextInput value={form.year || ''} onChange={set('year')} required placeholder="2020" />
                  </Field>
                  <Field label="TÜV Tarihi (HU)">
                    <TextInput type="date" value={form.tuv_date || ''} onChange={set('tuv_date')} />
                  </Field>
                  <Field label="Renk">
                    <TextInput value={form.color || ''} onChange={set('color')} />
                  </Field>
                  <Field label="Yakıt">
                    <TextInput value={form.fuel || ''} onChange={set('fuel')} />
                  </Field>
                </div>
              </div>

              <Field label="Notlar (opsiyonel)">
                <TextInput value={form.notes || ''} onChange={set('notes')} placeholder="Bu müşteri/araç hakkında ek not" />
              </Field>

              <div className="flex justify-between gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <AdminButton type="button" onClick={() => { setStage('upload'); setRuhsatPreview(null); setForm({}); setOcrConfidence(null); }}>
                  <UploadIcon size={14} /> Yeniden Yükle
                </AdminButton>
                <div className="flex gap-2">
                  <AdminButton type="button" onClick={onClose}>İptal</AdminButton>
                  <AdminButton type="submit" variant="primary"><Check size={14} /> Müşteri + Araç Kaydet</AdminButton>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </GecitKfzModal>
  );
}

// ─── Customer Info & Notes ────────────────────────
function CustomerInfoAndNotes({ customer, db, setDb }) {
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('genel');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const textareaRef = useRef(null);

  const NOTE_CATEGORIES = [
    { key: 'genel', label: 'Genel', color: '#8B8B8B', icon: '💬' },
    { key: 'teknik', label: 'Teknik', color: '#B0050F', icon: '🔧' },
    { key: 'finansal', label: 'Finansal', color: '#34D399', icon: '💰' },
    { key: 'sozlesme', label: 'Sözleşme', color: '#F59E0B', icon: '📄' },
    { key: 'onemli', label: 'Önemli', color: '#EF4444', icon: '⚠️' },
  ];

  const myNotes = (db.customer_notes || [])
    .filter(n => n.customer_id === customer.id)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const addNote = () => {
    if (!noteText.trim()) return;
    const note = {
      id: 'cn' + uid(),
      customer_id: customer.id,
      text: noteText.trim(),
      category: noteCategory,
      pinned: false,
      created_at: new Date().toISOString(),
    };
    setDb(prev => ({ ...prev, customer_notes: [...(prev.customer_notes || []), note] }));
    setNoteText('');
    setNoteCategory('genel');
  };

  const deleteNote = (id) => {
    setDb(prev => ({ ...prev, customer_notes: (prev.customer_notes || []).filter(n => n.id !== id) }));
  };

  const togglePin = (id) => {
    setDb(prev => ({
      ...prev,
      customer_notes: (prev.customer_notes || []).map(n =>
        n.id === id ? { ...n, pinned: !n.pinned } : n
      ),
    }));
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = (id) => {
    if (!editText.trim()) return;
    setDb(prev => ({
      ...prev,
      customer_notes: (prev.customer_notes || []).map(n =>
        n.id === id ? { ...n, text: editText.trim() } : n
      ),
    }));
    setEditingId(null);
    setEditText('');
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const day = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
  };

  const getCatInfo = (key) => NOTE_CATEGORIES.find(c => c.key === key) || NOTE_CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* Contact info section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(227,6,19,0.07)' }}>
            <SettingsIcon size={14} style={{ color: C.neon }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: C.text }}>Kişi Bilgileri</h3>
        </div>
        {customer.type === 'kurumsal' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Firma Ünvanı"><TextInput value={customer.company} onChange={() => {}} /></Field>
            <Field label="Vergi Numarası"><TextInput value={customer.tax_no} onChange={() => {}} /></Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ad Soyad"><TextInput value={customer.full_name} onChange={() => {}} /></Field>
          <Field label="Telefon"><TextInput value={customer.phone} onChange={() => {}} /></Field>
        </div>
        <div className="mt-4">
          <Field label="E-posta"><TextInput value={customer.email} onChange={() => {}} /></Field>
        </div>
        <p className="text-xs mt-3" style={{ color: C.textDim }}>Kayıt tarihi: {customer.created_at}</p>

        {/* WhatsApp Quick Actions */}
        {customer.phone && customer.phone !== '—' && (
          <div className="mt-4 flex items-center gap-2">
            <button onClick={() => {
              const phone = customer.phone.replace(/[^0-9+]/g, '').replace('+', '');
              window.open(`https://wa.me/${phone}`, '_blank');
            }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition hover:scale-105"
              style={{ background: '#25D366', color: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Gönder
            </button>
            <button onClick={() => {
              const phone = customer.phone.replace(/[^0-9+]/g, '').replace('+', '');
              const text = encodeURIComponent(`Merhaba ${customer.full_name || customer.company}, Gecit Kfz Sachverständiger olarak ekspertiz durumunuz hakkında bilgi vermek istiyoruz.`);
              window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
            }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition hover:scale-105"
              style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}>
              Durum Bildir
            </button>
            <a href={`tel:${customer.phone}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition hover:scale-105"
              style={{ background: 'rgba(0,0,0,0.04)', color: C.cyan, border: `1px solid rgba(0,0,0,0.10)` }}>
              Ara
            </a>
          </div>
        )}

        {/* Assigned Lawyer */}
        {(() => {
          const assignment = (db.lawyer_assignments || []).find(a => a.customer_id === customer.id);
          const assignedLawyer = assignment ? (db.lawyers || []).find(l => l.id === assignment.lawyer_id) : null;
          const availableLawyers = (db.lawyers || []).filter(l => l.active);
          return (
            <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(227,6,19,0.03)', border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <ScaleIcon size={14} style={{ color: '#F59E0B' }} />
                <span className="text-xs font-semibold uppercase" style={{ color: '#F59E0B', letterSpacing: '0.1em' }}>İlgili Avukat</span>
              </div>
              {assignedLawyer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                      {assignedLawyer.name.split(' ').filter(w => w.startsWith('Av.') ? false : true).map(w => w[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{assignedLawyer.name}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>{assignedLawyer.baro} · {assignedLawyer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={assignedLawyer.id}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        if (newVal === '') {
                          setDb(prev => ({ ...prev, lawyer_assignments: (prev.lawyer_assignments || []).filter(a => a.customer_id !== customer.id) }));
                        } else {
                          setDb(prev => ({ ...prev, lawyer_assignments: (prev.lawyer_assignments || []).map(a =>
                            a.customer_id === customer.id ? { ...a, lawyer_id: newVal } : a
                          ) }));
                        }
                      }}
                      className="text-xs rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
                      <option value="">Kaldır</option>
                      {availableLawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <select value=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        setDb(prev => ({
                          ...prev,
                          lawyer_assignments: [...(prev.lawyer_assignments || []),
                            { id: 'la' + uid(), lawyer_id: e.target.value, customer_id: customer.id, assigned_at: new Date().toISOString().slice(0,10) }
                          ],
                        }));
                      }}
                      className="w-full text-sm rounded-lg px-3 py-2.5 outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
                      <option value="">Avukat seçiniz...</option>
                      {availableLawyers.map(l => <option key={l.id} value={l.id}>{l.name} — {l.baro}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Assigned Insurance Company */}
        {(() => {
          const insAssignment = (db.insurance_assignments || []).find(a => a.customer_id === customer.id);
          const assignedInsurer = insAssignment ? (db.insurers || []).find(i => i.id === insAssignment.insurer_id) : null;
          const availableInsurers = (db.insurers || []).filter(i => i.active);
          return (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(227,6,19,0.03)', border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldIcon size={14} style={{ color: C.cyan }} />
                <span className="text-xs font-semibold uppercase" style={{ color: C.cyan, letterSpacing: '0.1em' }}>İlgili Sigorta Şirketi</span>
              </div>
              {assignedInsurer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(0,0,0,0.05)', color: C.cyan }}>
                      {(assignedInsurer.company || '?').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{assignedInsurer.company}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>{assignedInsurer.name} · {assignedInsurer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={assignedInsurer.id}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        if (newVal === '') {
                          setDb(prev => ({ ...prev, insurance_assignments: (prev.insurance_assignments || []).filter(a => a.customer_id !== customer.id) }));
                        } else {
                          setDb(prev => ({ ...prev, insurance_assignments: (prev.insurance_assignments || []).map(a =>
                            a.customer_id === customer.id ? { ...a, insurer_id: newVal } : a
                          ) }));
                        }
                      }}
                      className="text-xs rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
                      <option value="">Kaldır</option>
                      {availableInsurers.map(i => <option key={i.id} value={i.id}>{i.company}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <select value=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        setDb(prev => ({
                          ...prev,
                          insurance_assignments: [...(prev.insurance_assignments || []),
                            { id: 'ia' + uid(), insurer_id: e.target.value, customer_id: customer.id, assigned_at: new Date().toISOString().slice(0,10) }
                          ],
                        }));
                      }}
                      className="w-full text-sm rounded-lg px-3 py-2.5 outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
                      <option value="">Sigorta şirketi seçiniz...</option>
                      {availableInsurers.map(i => <option key={i.id} value={i.id}>{i.company}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)` }} />

      {/* Notes section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <MessageIcon size={14} style={{ color: C.cyan }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: C.text }}>Özel Notlar</h3>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.05)', color: C.textDim }}>{myNotes.length}</span>
          </div>
        </div>

        {/* Add note form */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(); }}
            placeholder="Bu müşteri hakkında not ekle... (Ctrl+Enter ile kaydet)"
            rows={3}
            className="w-full resize-none text-sm outline-none"
            style={{
              background: 'transparent', color: C.text, border: 'none',
              fontFamily: 'inherit', lineHeight: 1.6,
            }}
          />
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-1.5">
              {NOTE_CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setNoteCategory(cat.key)}
                  className="px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{
                    background: noteCategory === cat.key ? `${cat.color}20` : 'transparent',
                    color: noteCategory === cat.key ? cat.color : C.textDim,
                    border: `1px solid ${noteCategory === cat.key ? cat.color + '44' : 'transparent'}`,
                  }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <AdminButton variant="primary" size="sm" onClick={addNote}
              style={{ opacity: noteText.trim() ? 1 : 0.4 }}>
              <PlusIcon size={14} /> Ekle
            </AdminButton>
          </div>
        </div>

        {/* Notes list */}
        {myNotes.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ border: `1px dashed ${C.border}` }}>
            <MessageIcon size={32} style={{ color: C.textDim, margin: '0 auto 12px' }} />
            <p style={{ color: C.textDim }} className="text-sm">Henüz not eklenmemiş.</p>
            <p style={{ color: C.textDim }} className="text-xs mt-1">Müşteri hakkında önemli bilgileri buraya kaydet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myNotes.map(note => {
              const cat = getCatInfo(note.category);
              const isEditing = editingId === note.id;
              return (
                <motion.div key={note.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4 group transition-all"
                  style={{
                    background: note.pinned ? `${C.neon}06` : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${note.pinned ? C.neon + '30' : C.border}`,
                  }}>
                  {/* Header: category + actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${cat.color}15`, color: cat.color, fontSize: 10 }}>
                        {cat.icon} {cat.label}
                      </span>
                      {note.pinned && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.neon }}>
                          <PinIcon size={10} /> Sabitlenmiş
                        </span>
                      )}
                      <span className="text-xs" style={{ color: C.textDim }}>{formatDate(note.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => togglePin(note.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                        title={note.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                        style={{ color: note.pinned ? C.neon : C.textDim }}>
                        <PinIcon size={13} />
                      </button>
                      <button onClick={() => startEdit(note)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                        title="Düzenle" style={{ color: C.textDim }}>
                        <EditIcon size={13} />
                      </button>
                      <button onClick={() => deleteNote(note.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition"
                        title="Sil" style={{ color: '#EF4444' }}>
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>
                  {/* Note body */}
                  {isEditing ? (
                    <div>
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                        rows={3} className="w-full resize-none text-sm outline-none rounded-lg p-3"
                        style={{ background: 'rgba(0,0,0,0.04)', color: C.text,
                          border: `1px solid ${C.neon}44`, fontFamily: 'inherit', lineHeight: 1.6 }}
                        autoFocus />
                      <div className="flex items-center gap-2 mt-2 justify-end">
                        <button onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs" style={{ color: C.textDim }}>İptal</button>
                        <AdminButton variant="primary" size="sm" onClick={() => saveEdit(note.id)}>Kaydet</AdminButton>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap" style={{ color: C.text, lineHeight: 1.6 }}>{note.text}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Customer detail drawer ─────────────────────
// ─── Gecit Kfz Sachverständiger Logo Base64 ──────────────────────
const GECIT_LOGO_HEADER = 'data:image/png;base64,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NY1Go9VqvV4vx3EGg6GpqWnSpElHjx59//33X3nllT179vz444/Nzc2yLOt0OpZl77rrrunTp3u93i1btpw4caKqqio+Pj4xMTEuLs7pdP78889HjhyJj4/v2rXr7bffDgC1tbU5OTloM9XV1aG6WFtb63a70cT29/enlB45cmTChAnXVd6UPWbVqlVIlcFguHviRKCUSpLzk3WEXDmEZanbob2th37kMKAUgwvcv7J0vvzyy169ev3444+HDx8+f/68Xq9HA76iomLQoEG4jQcFBfE839TUNGTIkJ9++uk6qVwch26V9PT0ysrKc+fO7d69e9CgQaWlpQcPHtTr9QEBAceOHevcuXNQUJBerz916lRqaqrX63U4HKIooo6HNpDb7T5x4sS8efM++eST++67j2GYurq6goICXF6SJGVnZ0uSdP78+by8vK+++goADhw4gJeRkZHRtWvXzz///Pz58/gOOhcCAwPbtWvXs2dPURQbGxubm5tzc3MDAgLQuEZXSGFh4c0H6ptvvtm/fz8unalTpyYlJ8sAnu27+CO/EL0Zlw4BkKlkWfw4q9MpsZ8/SA+an7m5uePGjZs/f/6yZctSUlJw/weAoqIi1Ge6des2efLkkJCQ7777rqamJjU1NTw8XKPR4KzHfBqTyXTixAmj0Xj48GGv10sIWbdu3cCBA+Pi4jweT1lZmcfjiYmJOXbsWFJSUmFhodPpNJlMkydPtlqt+fn5paWlYWFhWq3WZDKFh4efPn163759SUlJgiAYjUa9Xo/z1+v1xsTEDBs2jGXZsrKy4uLiNnd0/vz55ORki8XicrnQ/WG32wGgqakJAE6fPq3Vai0Wi9lslmW5a9euAQEBDQ0NTU1NVqsVD7kRN3V1dQsWLEC5EhoaumzZMirLlOdbnnv5txg2y8oum2HkWNNdd4BP1OeP0IN78rFjx4KDgy9fvuzn57dgwQK8FMWCYxgmOjr6pZde2rp168KFC5988kmdTocyGncUSZJQTNlsNtQjUEbJspyfn19SUjJw4ECtVhsbG/vtt996vd64uLj6+vrg4GCj0Thr1qzevXs3Nzf379//7Nmzx48fR38Ex3E8z2/evBl/Qkku6N69e1lZWVZWVkBAgKIx+/v7jx8/PioqymKxnDx5ctu2bTabzWAwICuKP8lisaDiwPM88jF06NBRo0YJgoBOI8W91GbjwT1VluUZM2ZYrVatVsvz/Ntvv92+fXsJoOXF1/lTxxlDIMgSMAwVvCQwLGDFy4RhQZYV2v64anD+/Pl27dodPHgwOztbr9fjEPte3JgxYxITE3U63YQJExoaGoxGI37kcrnwTjiOw8wNrVaLn6IuJ4piSUnJqFGjKKWxsbE8z6POo8DhcBQUFKSkpFRXV7e0tNhstpkzZ166dOno0aOJiYmRkZGBgYFms1mSJLSN6uvrS0tLp0yZgopWYWFhQ0PDsGHDUlJSLly4QCnNzMyMjIzcv39/165dDx06hN50BNpeyrQLDAycP3/+yJEjN27cWFFRQQhp3759UlLStesGR2PmzJnbt29HnfDpp5+eNGmSDODZut3+yuuM3g9kqZUJwRu4+kNth5Q2Ie0/Qg/+cH19fXx8vN1u79ev33VtZp1Ol5SUtGTJEkLI7t27169fjxuAXq/X6XRGoxHDDaIoNjU1paSksCyLSyoxMfHs2bMHDhxwOByXL1/Oy8trc+alS5eOGzcuIiLizJkzOTk5EydO/Oijjzp16oTbwHV3gk6dOqG+VFpampeXZzKZEhIS1q5di1bLxo0bZ8yYMWvWrN27d8fGxup0Ogz94RWirepwOHieT0pK6tChA+oRn3zyid1ux51v9uzZvkYeRhxmzZr1xRdfaDQar9c7f968559/ngJ4fz7SNOMBQhgABggFhpFdDX7PvWSa/F/Xphtwf0xns9vtLpdLFEWTyZSUlOQbaVfW9a+//vrTTz8NGTLk8OHDP/74I7phMJIoCEJ5ebnRaHQ6nfHx8SaT6fz581lZWZcvX46IiKiurs7Pz9+5c+elS5fcbrcoihEREXg4GkOU0rNnz1ZXV7tcrujo6DFjxuzfv7+4uHjWrFlKiijKN41GQwhpaWkxmUynT59OTk7Oy8srKyvr2bPnzz//XFpaarFYevfuffbs2Y8//viFF14ICwvbuXOnsr8ajUacSQzDhIaGoskSGxtbWFhYU1PjdDpxQL766qs33ngjMDAQ3eccxxUXF8+YMePAgQPowH3uueeWLl1KATx79zfePV1udhCdHigFQmRXg+WJxQFLFxFJvjbn7Q8KN7vdjgkYFoslKCiojeRFCnmef/nll/ft21dfX3/hwgUMiKFnWqfTJScnNzQ0mM1mq9UaHx+/a9cuq9UaGRl54cIFl8vFsuyUKVM2b95ssVhCQkJwsDDIptPpmpqaCgoKPB5PYGBgdXW1Tqez2+0YREBxpORmCIIwatSo7du3nzt3buvWrVFRUX369HE4HG63u6ysLCoq6rXXXnO73TNnznzhhRfWrVv3zDPP/OMf/1A0Pbvd7na7m5ublWyT6dOno7ldXl4eEBAwefLkgICA48ePW61WtFgBYOvWrY888khlZSV6H95b/e6Ue6ZKAK71X9kenEs9XqLTt85i3uG/9Fn/554m8vWz3f64Yu12uxmGMZlMN4pzVFdXh4eHX7hwwev18jwfHR0tCIJOpyssLHz//ffPnDljNpsPHjzodDq1Wu3YsWMxvRbtO5fLZTQa33333ddee61Tp05HjhxBB6jH48nMzOQ4buHChRqNJigoqKamBldJXV0dJia2weHDhyml5eXl7du3P3z4cFBQECEkJSVlz549S5cu3bdv39q1a8PDw2fMmPHGG2/8+uuv4eHhNTU1yk3h+kMXdURERI8ePQAgNze3oaFh+PDh9fX1GzZs6NWrV1BQEMuyLS0tzzzzzNtvv417VZ8+fdasXt2lWzeB5+3PvuR4+XWi0RGtDhhCnS6i1wS+t9rvoftbdYHrDeMfpEer1drtdpzO6EdpEyXU6/VpaWkYdJFlOT4+HkMDZ8+e7d+/f0ZGxuHDh91ud6dOnUpKSvbs2WM2m1HPkWUZ9bS6ujpZlv39/S0Wi1arNRgMOKMxrxMA4uPju3XrtmHDBoxIchz31FNP7dixA4Unbu+U0vHjx+/cudPPzw9dcxcuXIiLi9uxY0d8fLwgCDt37tRoNDU1NTt37kxLSysqKgoPD6+urvbdTXEfQjdr586dZVkuKSkxGAx1dXV79+7t37//448/3r59+z179jzxxBNnz57FffeJ+fOXLlum0+vdeQUtj833/LiT0QcgDbKziUtIDl77nn5wJpUkcuNIxB+kx9/fv7GxEQOjdXV17du393VpUEp5nt+xYweqZ7hPIqk8z/fq1cvpdDY2No4YMeLChQs8zzc3Nzc3N/uev3v37qIo6vX6RYsWoWqL8wCtB6/XGxwcXFhYiFpDaWlpx44dRVGsqqoaMWJEa30BIYIg6PX6ioqK/Pz8Pn365OTkeL3evLw8QRB4nk9PT//hhx9Q+yKE5ObmduvWzWq1ZmZm4qaCUSWPxyNJEvomunbt2q5du5qamsuXLzudzrS0tC1btkyYMAGThD744AOMo2cNHfriCy/06tMHAOyffdHy5DKxupwxBgMB4HkqOAzj/xL03t8x9ZDctL7qd9ODGbMajYZlWZvNFhYWlpOTEx0dreQXUErz8vJiYmK0Wm2HDh0wc6ympua5557buXPn8uXLd+7cOXr0aI7j6urqLly4UFJSgiEcFAjoxWrXrl1kZOSnn3565MgRvV6PFpXJZBIEgeM4rVaLCW87d+4khLzyyivvvPNORkbG2rVrr3vNgYGBZWVlDQ0NGPzX6XRVVVVoGyipIzzPo/DkeR7dazjWHo/Hz88vICDA4/FERUUJgnDx4sXk5OQFCxagKrhq1aqXXnoJD0lPS1v0xBP33HcfAfDkF7YsWe7ZuBEYHWsOpLJMnc3EPzDg2ectjz9Kbpy4+y/RoyRgGI3GkydPzpkzZ8eOHcOGDfN1xP3yyy/l5eU8z+fk5OBRK1as6NGjx6RJkyRJqqysvPvuu8eMGbN3796cnBxUbdtkPIeFhVVWVhYUFCAfaBV6vV6bzYYsomGL06WysnL69OlKcsy1uVro31MiIBgk9Xg8ipsDz4le6vT09GeffRaz43meFwTB6XTabDasffjuu++6deu2cuVKTBt6/vnnT58+jfGORx9+eNb99xtNJpn32t5e43x9hVRbwRgDCcPILheVPfrhIwNff1HbOR0oVbxqfxo9SpqH2+1esmTJ3r17NRrNW2+9VV5ebrVa27dvj7ZYQ0NDaWlp586d0Xnj5+dntVq7d+9+5syZwsLCrl27JiQkoJiKjo728/MbMGAA+ngwAFNUVHTp0qWQkJDi4uLnn38e9T1FH/H9n+d5RYnH3QhN2psk6+JGcvTo0aCgoNjYWFQIRVFMTk6+/fbbT5w4YbFY0CqSZRlj5DzPa7XaPn36ZGVlRUVFoYdw+/btL7300uHDhzGF8cEHHpg2fXpAYCAAtGz81vHKW8Kp4wxnYv1Cqcct8XaufZLl6YWW2TMIkNZFc2tFWNwt6mloTADA999/v3Tp0pSUlO+//37EiBEfffRRdnb2q6++unr1almWP/roI6PRuGDBAkwNRO1u69atRqPRZrMRQnr16hUXF2e3271er9vt7tu3r9FoRCmPCvfBgwcTExNZlj1z5gx6ZW7k9MORUi6PUhoYGBgbG3v27NlrixGUP/V6fXR0NIZQFXsgIyNj9erVQ4cOpZQWFRVt375dOTAlJWX69OlZWVlI53fffffqq68iMQNuv/3BB2bfmZ1tNBkBwPHjHsebq/gf9wAQ1i+U8rzUUsdagvzmPGFZNI8LD2utcfw9xbzcLSatYZrH0qVLu3XrZrFYVq9erdVqw8PDX3zxxYsXL3799de7du0aMWJEWVnZZ599VllZ2aZk4OWXX8aoyQcffOD7/rFjx6qqqi5duiRJUkBAwK5du5xOZ0xMjE6n27VrF46dUpqr+CywXKQNWwzDNDc322w2VCJudEdutzs/Pz80NNR3naGDAPUdFIMhISFjx46dNm3akCFDcM199NFHb7311qVLl1iWnTb1nlkzZwwcMqTVCvxht+ud9707fgQqMOYAKopSSx2jtZim3ev3xF+1ndN/KxH5nVXB3D8lhmXZ48ePz5s3jxAyYcKEhISEzMzMrKyshoaG8vJyQsgjjzyyZs2aRx99FHMBgoOD24Sio6OjlfFiGGbWrFkYAfP398/IyEBPjMlkOnbsWG5ublxcXFRU1MmTJ2tra9sMNO4rkiQNHDhw2rRpWP8mCML69etPnDihrKTw8PCysjJFml1XymHFD1ypSL3tttvsdjuerXfv3rNmzRo9enRERAR639977721a9fabLYOHTq8/uqr/3XXXbEJCQBAed6+5XvX+x/z+w4AlRizP+V5yVHPmAJN0++1zH1E1/22VmIYBv5YBfxNks0ppZWVlTNmzEhKSlq9ejWl9NNPP42KivJ6vffff79vduSiRYsKCwsjIyP79OnzzDPP9OvXLz09PTMzc9SoUYsWLcKwP3o4CCHp6ekdO3bEoZkxY8bDDz88ZcqUiRMnhoeHDxw4cMSIEa+88orRaLxRGfvkyZOdTqfv1Xo8nnXr1s2ZM+eLL74oLi6Oj4+/efAf9TcMLuA7R48eLSkp+fjjj0tKSpRE3w0bNgwZMoRhmICAgFkzZh7ct09JA/ZWVjWtfLey2+0lYCwFk9UYVsr4lYCmLCy+4dF5nrPnWq9MkujV2fG/F9y12wyOO6X09ddfX7169ejRo3/99deysrKhQ4diPG3+/PmjR49eu3atJEkjR45MS0t77bXXgoODt23bNnz4cFEU//KXv6BViEGXH374oaysDDd5NAzxJwICAr799lssafPz84uLi6uqqpo5c+a6deswMq1cjCRJEyZMGDt2bGRk5OjRo1HaKGOt0+mmTp06depU1ODxo2uXjuIYxAvzer2hoaH+/v7Tp0/v2rWrTqebMWMGAPz888/r1q3bsWOH2+UaMGDAN19/PXzESNOV2l3HocOeDZu8W7eLZaWEaBiNngou6nJwXbqYpt5tnHSXpn1Ua840wM3rRn/f6sF8cHz9zTffpKenjx49GmPPjz76qCJeMPwOABMmTPjll1/Qp/vmm28CwLx58z799NPWsuar0bVr15ycnOHDh6NFzTDM8OHDt23b9uqrr3br1q1nz54PPPBAeHj4kiVLRowY0Wbu4+svvvjCN4G9TcGGKIqYTFNdXY0XoOz86Ev1PSHHcd26dVu1alVeXp5ykuPHjz/99NN9+/bt1LHj1MlTNm3Y0GyzKZ+68goa//5OVeZwqz6kFHSlYC4FYwnoy8IT6u6Z5dqxS/R6FcnzL66Y69T3KMScPXt27NixnTt3/v777yVJevvttzF5TrH/8fWECRNwq0cNjVL68ccfA8CgQYP27NmzYMECpbwPGQWA3r17Yz4mjlRsbGxsbOzgwYOHDBkSHx8fGRm5ePFiTL+6NmKv0WguXryI1v6N7gQ5EwShV69emADU5jyBgYGjRo1asWJFbm4uHsLz/MGDB59//vm77747+847ly1Zsn/vXv5KaQ6l1FVQ1PThJzV3TCoPiSsBTQmwJaApBVNZWHzthIktaz/jyyt+uwJBpJL855Y0gVI61NDQ8PDDD8fFxa1YsYJSunfv3s6dOyv3ptdjKSt07tx506ZNbUjFF0ePHsUU5EWLFn388ccLFy7s0qWLwWC4rhmPFYHjx49PTU29/fbbly9fjtkXbfYMnBCjR49Gba3NumkDvJeZM2f6+gYzMjIeeeSRb775prKyEr9WX1e3b9++d1evfv7ZZ197+eXN32wqLS31GWXBeepMw1urakZnlwW1LwEoBigBYtUFV3S4rf6+B+2ff8mXlfts1BIVRSrL/46Ks9ayo5UrV3744YeDBg06d+5cXV3d+PHjt23bptxhdHQ0Gu3z589/7LHHTCaTkvCu6LWSJGHg5K233nrppZfcbnd2dva0adN4nq+pqcFMM6XFQENDg9Vqraur02q1I0aMwCoyzANtU/SD2uPs2bOVEo5/Kq7vvvvuI0eOdO3adfDgwX369OnUqZNync2NTUWFBQ6Xy2gyTfivuyJDw5SjvPkFnhO/8vsOCb8cFS5fpOABAIbx06R206Z11Pbtpe3TS9MlnVWKfrE/C8MA++8sYfv1118zMzOHDBmSm5vrcrmeeOIJxf3MMExkZGRKSkpUVNTMmTOLi4vbLJob6XuNjY3vvvtu7969TSZTUFBQWFgY1l2gMubn55eYmDhu3Lh169a99dZbqampykJRStfwm7h0pkyZcpMfvc5lCILT4bjqHUqvsxs0Nrr3HWx8Y2X1nZPL4tNKwVACUAKa8ojEmqFjG/66qOWz9e5fT4vNLW1W6L9vrVwLEhwcTCmtqalZt27d4sWLsWwcAIKCgkJDQx0OR1pa2sKFC7OystCvg2N3K2YsprlcvHixqKiopaVFkiRMY8edJjg4GMup7r33XnTJXBdpaWkbNmzAQPXvU3kAKADBBCWHU2xokCurxLxCMTfPm5MrFZXIdQ3U62U0WjauPdchWdMpVdMhme2QzEVGsn6WNuqsksX5J3abuiUHNFrI2dnZGMvC+orIyEhBEEwm05w5c3wFC7m1i0OS2kS4FZw+ffr06dO//PLLxYsXIyMjq6qqsGuAslxwrSjpyH5+fjNnzuzRo0dKSkpISMhNCp2AUtnjkRoapYZGWlsnV9eIVbVyba3c2CjbHUAYxmIiAQFsZAQXF8O2j9bEtGfCQsm1F0kpSDIQaI2Skf+xvl2kW7dup06dSk5Orq2txc4/AQEBoihOmjRpwYIFoaGhbRbEH7Z523xUV1dXW1sbEBBgNpsxVHwtPbheMYRBCAkODr6uoqEsF6mpSa5voG637PYQUWT0eqLXE7OZCQxg2iyINmTg+lDIIP9r+qht3rzZ17zQ6/WTJk06derUzbeZ/534JxuCJLVqWYLYap3I8n/bLvLH7Z61a9f6+/trNJrs7GysvVd6PPwbh1KWfdPJbgW3eF4qy63eFEmikvy/n4ObqQa4qVitVofDgTuwErUEFf/TaO0UqDijsILJRyhTAPpbcd11d0uM/f2zGPh1BDoeSK+cn8B1tKM2Zybk93WDJOQ/np62Kwa3ypt3gkMn+R++edyKb6Ru4LRg/5uWbxtD+FpPOSom137hJh3Irhs/VOodrxsnvK5n/ZqgiE96vNzQKBQVSxWVsq0ZJIlodUxYCBcXw8bHMVgxSikQIjW30MZG4NgbzGsCsgw6HRsR0XqPkoxDL7vdYkGRVFEpN7eAJBGjkQ0PYxPi2PAwJeVHstmI0i+X5Rh/P9psA0m+pZnBMODn9++Q0jcvh/vzV48vNxTAtXGza/3X/K+n5foG2WMHkK6ICR3j789ER+kHZ/otWciFh8leb924ifzRY4zJBJJ83Wkju2yGcROC139Mrqw5/vxF+4efeHftlSqqZKcDgAegACyjNTFBQVxainn2TNPEbLGwqHb4HdTtBq2GOm2GiZP8lzxR228Y5Xlg2ZtJOYahHqe2b9+QzV/efBwppU8//XRhYSF64kVRvO222xYvXuwbpX3hhRfy8vLQHYVvvvjii/Hx8V9//fW+ffswNfWf5jbNnz8/KCho+fLlSv4JiqvrlkbjsgkLC+Ouklcs6z17oemvC7wH9hMghNWDTseaAqkkYVseYAj18lJOvv3iScPEO7mIcLGySjh2Epwe2SMAUCAMAL1qarOs7G7m2ke3xqUJNL/0uv2VN2R7IyEGotOxZgv4GEZyc7Nn7w6QqWlitpBfJBblAWsAlpH5Rk18rFhiFUoLGL2f0orGtwMNUaLFHCe76tnAAIZhbpSvhOatzWb7+9//7r5SqK44f9Hw4jhu3rx5K1as8D3w7bffxryDDz/8EHvq3AqeeuqpQ4cOvfPOO7e+dEaOHMn9tm5Y1n3gUMNdU6X6GsYYQBiGCoLsshHQMkFBxM8Mgig32ajLQcHDte+gSUkGAKm8kjodoNfjXKatraB9ZxNDQdJkdEJuGh963PH+KkYbyJiCCYDscsmeZsIYiVZDJYkKbgBCAXT9+wIAn5dHicQY9EApEVhNlwzv8V9l4KF1QQMBPTEYWpcRIbLbDiAAEOBZGWQNBvlvsMiQnqKiIszVwrksy3Lfvn1xv9HpdC+++OKKFSvQCYlr64MPPpg1axYAeL1ezB/2deNem+OAHueoqKjY2NgPPvgATe82aQ6KY15ZOizLejyeJ554glNkGl9Q2HD3dLmhkTEFgkxll5NoteYHZhuz79BkdCJ6PciyVN8gnDzt3LQZ3F4uNBQAxEs5sswzxAAA1OM2z3/MMLC/7HT9pokBASrrhg4CQmwvvuF4fxVjCgNJAlmW3S1ch06m+6Zq+/RiQ0Nkp1PMyeePnXB9v03TIQUAxPOXCSVAKQgio/VnwkO1HBe0/GViNKJu4vlpv2f3bqI1giyDJJnvn8klJgAvUEEgBAx3jMPle5P9Iy8vD1NQlf5ZaWlpmDP04YcfPv3000q+gyzLK1euxEQJjUZTVVVVXFyMkkpZ+tgQqQ09kiRh8D4/Px9LwxUWcYpotdrGxkbf4JbH45k9e/bQoUOBUkolWZblmjF3lYLGag636kNKWUtZTIpr34EbGedCk40KAqW04a+LSoArM4VbdcGl2iC+oOBGFpbr+EmrLtCqD7bqQ6yGsFLQ106/X2xovPabQnOzZLdTSqsHjSoFvdUUXkr8yqM7CPX1bb7Z8OiCEmCtpnCrJtBqDhera27d4sOOeEuWLFGc5ZicjLGfTZs2+bYfAYBXXnkFj0JPCsb1lbJ9FF8FBQWXLl3K9UFeXl5OTk5VVRWltKKiori4uMQHBQUFNTU1Dz/8sHIq/K2pU6e2NkjF7ojOnT+WgsFqCLPqQ6zawDK/cPfRE3gTV/6JVBCpIMheLxKD4cnaMXeVgNZqCrcy/uXRHcTaOiqKlBdaHSf4j+cppbV/mVIKWqspzGoMKwV9zZhsCY15QaDiFSMfj0IXTHNzRVLnUjBbTeGlYKzulyVRSiVJ5nmZ52VekLyeqn5DS8FgNYWXEktFh9uklhYqCJTnW6/5FmJ3SnwWR6dTp06U0gMHDmC1nhLqXb58uZLfg7xipTV+isfu2rXrD/gF1qxZg/NAcTlOnDgRXTayLHO4l7o++gcFkRAAwsgem9/CpfrePUAQ4OrSA/DtL0KI7HIJ+QWE6ACAyl4uMZ4JDQEAYK/W1DUaIb/Qu/snojGDJIMkE7O//+vPM4SAJIGP2G3t/idJwDBSeaVUVU20WgIgA8+lJqNRRjSaVoW+oVkqKwdGCwCUermkBMZiAUoBCF6lfLXi0CYnBFNK8/PzwadlU+/evYuLi7Ozs7HGCFl88sknly1bht1elIw7TGhBG0iWZaPR2KVLl5skcSq9f5SqB61W+9FHHz300EPKfiOK4p133rlu3TqlIzoHDCPWN3iPHGMYA1AKosj4hZrvndoaCgQQqqvFnHzGZLyyAwMVRCaynTYuVqqokCqqCceBLBNOL+QV1A0bR9EVj2aH26np1y/wtRc8+w5I9nrGFAQUqMeuH32HrmNH1EdupI0KhcWys5kx+lMAAKrBfs8yBeaKvVVRJdfUEQ2yK3NJia1GFcf6OnlvsvGUlZWVl5f72oYsy06YMKG+vl6xIufNm/fyyy8rgVqlL8zly5d9D9TpdFu2bMHGbsqvC4KQlpbWt29fhSGkFrnZsGHDgw8+qPSjF0Vx1KhR69evx/K/VlkHAGJBoVRTQzQaIIQKXm3XzprEeEU5tj/3qv29FYw2mGKFGMfKQlPgi29o/7ZAzMmnLgfR6UGWgeNoY5Nnz37fPAFZtGkyuhAA/vRZAgQDZBRE3e19W10DN7ZJhMs5ra2aZJkQPdcx9TcnDWZLX86lvJsYzEApAVbTsYOyunE1vP3222fPnsVyBl8TBFOCDAZDUVERVikp9j/WOChPxcjKynrrrbeujXVh7bGv46CpqQnXQRu88MILffv2bVMtxHHczp0777nnHiVTTBTFIUOGbNy4EcuYGN/Cebmymoouog1CycLGx7Z2G2UYoJQ/fhJAQ2WJaDXo6WFksyYtFQDE3HxK3YQ1gihhKd5Vva9EEQB0vXug/t0quSgQ4LiE+H9q9ouXc1tNKFEkBhOXnNCWnpw8Cl7C+IEsA9Fo0joq9CANq1atum67qK5duz733HMAgAUUyribzWaj0VhXV6cQfO7cuUuXLnXs2FGRfvjCarUqYWVfJc2XQtTZsJmQr3+I47gDBw5MnDgR+9ejjO3fv/+mTZsw9f6qnC8AkFvsvvYA9uHDBSE1NgHDcO2TQcfJVTUgiiCIjMmP7ZAMAEJOHgADQIBSwnGWOQu4mGgQxN+GXqfVjcrysYdwZDliNFy9j13tcGNZKklifiEBDgCoIHAx0Wxku9/owXaJeYUEdzlBYIKCuVjsY03wDktLS69ta4Xo2bMnDsG5c+eUoZRlOSIiYuXKlXfeeSfqZlgMM3fu3N27d7e690nryS9duoRN4Xz9Bb6vcX6YTCZMWVVkGsdxJ06cuPPOOzEHH7/WvXv3rVu3Ymsb9jqV2YzvODFSVQ0QgrsC42cJ27UFCCM1NtRmjpJraqkss2GhXEw0rp7WEeR5Lj426M2XbujY0F+JcjKEgleqqfvNUX0tPYTIzc1iqRUYLQGglOeSE1nc9klrz01ZEvncXAAtAFCR56Ij2fAwX5d2U1NTcnIy7hNtjETMM1X2DwUBAQGjR4+eOXPmmjVr0NzBVkUffPDBgw8+6Dt2ubm5Cqk4+uvXr+/YsaMgCMrcp5TqdDr0L+AS4TjuzJkz48ePb2pqUrjJyMj47rvvgoODrxuS5gCACQslwAGgn1gnnDsvNTSygQEgSYTjSGAgAIglJXJ9PWg11GXnkhJYo1FqbBStZcCgaiey7aOoKLb6fn6LEFBCCGg0bLsIIPSKcGM83++03DsFKAVJ8pVXiptcKquQahuIhqMAFCQuMaHNti/V1kvWcmhtVSuyCbFEq0WBzBCCEuzXX3+9NitB0V+bm5uxdQvuw7IsY7fMZ555ZsuWLTU1NYr69Le//W3kyJHYkRJH/+LFi4qgo5SGhoaOGzfuug9W8JVply9fHjduXHV1NZ5EkqSEhIQtW7ZERkZidy1fp0Oryg4AmrSOTFAoCCIAEJ1OrCpveWMlMEyryitJACBczpO9LYTTAAioRAn5hXJtPdFoAICCqOl+G+E4otMRrYZotUSrxReommt73EapDEBAkojOz7N1m+OrjaDhgGXxAVLAsvhatNsBQLicS3nXFb8n07rtK5o6gFhcQpubCeYmgKzFVB6fhYLNrTXXQDHaKyoqsLZdEUpdunQhhERERKCVg6IMez0uWLBAkWyUUoUeHOjExESDwaAkSvpCSdXLyckZNWpUeXk5Lmhs/nrkyJGEhARMJmSvxpXVI8ua9tG64UNdX33O6MJA4Bmd2fH6CnB7TLPu5RLjCcfJTpdn3wECLFBKgOPQ41JcKntaGGMAUEqAIUYDf/Ey8IIywXG+E4uZS4w3jhvdvDRGbmognBZNk6YZD/NHThizx7MR4RSANjQKufmuzZu1/QcELHpcuJQDwAMhIEsENFx66m97FQUAkAqKZN7OmILxbFfx989CKfj+pUuXlOFGwjDjThTFWbNmffbZZ4cPH1ZE3KZNmzZs2DBx4kQAwBa+vtZSUlKS8s0buY7GjBlTWlqqdD6hlMbExLz77rtOpxMJUxpDS5IUFBT0+OOP6/V6wIwIT05eWWhsKRis5girIdSqDykBrdUcUZHYuTK1W0VsJ6shxKoLthrDrFyA++AvlNKm5S+VEI3VFG7Vh1h1IWXmCKtfpNUcofwrC4gu0Rga5izAyWJ75/0SIFZ9iNUYZjWEWnXBJaApJZaywOiywOhSLrAUjMUA9k/WUUrr7p5eSnRWc4RVE1gWHMNjBiTmG4sipbTpyWUlRGM1R1j1IVZdkAd9HLeWuIJm//LlyzEVG7cBvV5fWFiofHr48GHM0kbHAcMw7du3r6mpkWX5559/Vhr8o8H/6quv3ihtBtPzBw0ahEvEtxX+TbTWzp07o+OAQe1Z1yE5+NsvuYQE2VFH3W6glDUHgShKJaVCXoFUXgEUHzTVSIxGLikeAISzF4BKIIogiiCJsssNDge43Mo/6nKB4OZSkgCA8oLfo7P9n32Bet2yywaCCAzDWkIYo5G63NTpJhqOsBoGDNr0jgDAX8wBCiCKVHCzoaFsePhvahshAMCfuwBUBkGgHhfjH8AlxN16wQZKpDNnzqCHBm2XiIiIqKgoJSG5b9++M2bMQGGF/5eVlc2fPx8LYHx7/GPj35v4C86fP79//34AaJO/f6OgKgD07dsXvbRc613JsuH2vtqjB+zvvu/e8r2Ymy870GkvAxAKHMgyExzExXUyZN/BhodTQZQbm1j/MGIwKc9juNaUIdQf7R7CspTSgGf+ph/Qv2Xlu/wvR+WGBhkkAAmAAWCJRse1j9JlDebSO4n19eBys0FhoNfLdqLt3Z0xGBQ7DBhG5gXZ6WJDo4nRTJ12rnMaExJ8i5kFuGFgQ5bIyEiMwvE8P2DAAKWZO0q8Z5999siRIxUVFWjGsyy7ffv2s2fPYlNGLFeSJKldu3bdunWDGz9aIy8vLygoSKvV3sozoLBRKfYeuTpaeiWMLfO8VFgsFhZJ1bXU4yEcxwQGsNFRbGx7Niqy9SJkWayrJ5J0swefUgocx4SFEuVLV35CLK8Qc/JEazl1uYFl2JBgNjGeS0zAx6lRnpcaGnClUFliAgMYo+mqWSlJ1GYDGfVsGbRa1t//90ajW1pacHbDlR6SBoOhzRA7nU6Hw6HsDZIkGQwGhmHwTXzHbDZjBvmN4HuSW7y2gIAAfKzM1cFstEZvnhB6JVOA/p5n0uLEYVkWZBmAXG1pXT/T4dZzqck15cE3uQylNew/TRa4WbbwjXUQRZ37N+QaXCe/6Yo5gm5gbAnj8wiKG1qXvolXN8rU8T1/m/ws/JTAb7m1bWQ6kkHhhkz/zmG9iXS61nJq8+nNWfxjzyvCczLXzw1DQ4RjgeNan17LMkrmFKo62PeUotOBIcAQSoCS3/4EhtArF7dv376rwvLXnp9hwDdtiBBsoEWvcOP7LDiGYQheDEOwq1tLSws6wa77yDh8LUnS999/j8+rOnHiBPZwges978933NsoWujp2bBhA9pMChobGxsbG71eL77v++ttDr9FXCdL/WZpsT4hrIsXLw4ePBjN7w8//BCrANs8oAtttNY6Zq83ICAAmzooFW7K//jC933lBZ5BeaGgrKwMm0Zh29cVK1ZMnjwZHcOoSuH3lcNRV8aBmzdvHvriVqxYIcuyx+PxrX30LbD1/XX8FFWvt99+GwCOHTuGWjh+2qtXr0mTJr322msWiwWbWyojcO05rx3YW6vMluXfBA5KlatzDTEdYurUqVardf369eXl5V27dqWUYrIEXqjvo17Q0VRZWdnc3DxmzBhf0ew7Z/FrqHoqiUU4idDWw/ZSOCF+/vnnCRMmbN68OTQ01Gg0bty4MTU1NT09Ha8BFVP8vpLCgSfPzc0lhPTo0SMyMnL9+vWZmZlY1e37u0pYTKkW9g3S4AmPHTsWFBTUq1cv/BqK+hdffBGLOzp06KA8e0M5s6JcoE5IfB9ML8utqbjKm1cL+X+2eARB9niU+WWz2TQazW233abMO0rp6dOnx40bFxkZGRcXt3jxYjTrRowYYbFYFi9evG/fPkLIHXfckZKS0qdPH5vNtnDhwmHDhlFKL126dNttt/3jH//Izc3NzMyMioq68847m5ubd+7cmZWV9fTTTw8fPrympuaee+4JDw8fMmTIoUOH8AmLsbGxBQUFFRUVjz76aHx8fMeOHWfPnk0pffzxx6dMmTJlyhTsdEgpra+vnz17dmRkJHabzMnJ+eSTTwYPHtzS0sLz/LJly2JjY6OiojIzM7Ft/8yZMyMiInr27Hn8+HFRFEeOHDlv3rz+/fsnJibu2bOHUpqRkREdHY0tdlauXEkpXbp06ejRo7Egd8CAAYWFhS+99NJ99903ffr0uXPnUkoXLFgQHh4eHx//ySeftIoKUZTd7lutzKaUii0troO/ODdva3nvw6ZnXqx/8K+1f5lSM3RcZWqX2onTceXj+vjb3/4GAOHh4d9++y2l9MyZM9iR87333gOAhQsXFhQUGAyGjIyMVatWnT59+o033gCAKVOmYFHu/v37n3zySZyP9957r06n+/XXXyMjI++9994PP/wQAL755husBQsLC3vnnXfmzZsHAJ9//vn+/fsLCgoSEhJCQkJWrlxZVFSUlJQUERHx0UcfAcCgQYPw4RYA8PTTT4eHh8fGxno8noEDB+p0uo8//rhfv346nQ57MWDrYGyF8Pbbb+PKrq2tveOOO5KTk7du3arRaEaPHl1TUwMAMTExS5cuBYCHHnrI4/GYzeaQkJBXXnklKirKaDS63e60tLTY2FhRFLHDQEtLy9ixYwEgIyPj4MGD+DzI9957b9iwYQzD5OfmUkrtO34sj0ut7j+sZvRdddPub1y4xPbGSvv6r50/7PbmFVxNDwrWqurmv7/T+MSSuntm1QwdW3Vbv4rEzuVRyaWsuWboWOVriK+//jokJMRsNjc2Nk6ePBkbAefm5jIMs2fPngcffBDbteGXsZMypXTr1q0YLNm4cSPDMLt37waAjz/+GIvu+/Xrl5KSEhsbW1RUNHfuXL1ej30HsDvXX/7yFyytTkxMHDNmDJqNGFJDm/Hll1/GTtj33nsvpbRjx45ZWVl79uyBKz0R+vXrh6I4MjIyOzsbI3XLli3D59SmpaVh//ekpCSsit2wYcPevXsZhtmyZQvK5FdeeQVDCa+//jqldNy4cRaLpby83GKxzJgxg1Lau3fvpKQkSmlycnJGRoby5IWHHnqIUvr5558DwP6ffqKUtny7rRT05aFxFTEdKzv2qOo3tPaOyQ0Pz2ta9oJr90/KaN9UuEmy1GLnyyuEmhrlAGxOTymdM2cOAFy+fDklJaV79+6U0vvuu4/juKKiov79+wcFBSkOrg4dOvTv359Sik9p9Xg8x48fNxgMPXv2xJt5/PHHWZZ96623du/eXV9fj97c22+/XXFk4dMpBg4ciKHMF154gVI6dOjQgIAASulbb73Fsuy+ffsuXrzIsuzXX3+NG8+SJUtWr17NcVx+fn55eblWq33sscfsdjvLsq+//jq26tu8eXNtba1er7/33nuPHz8OAPgoS2T9+eefRx314MGDLMvu37//s88+w0a7TU1Ner1+ypQpWHm5du3auro6nU43c+bMlpYWlmWff/55Sum+fftwgSKdHMehUiM4HHxJqdjYKCv9Km4u3Kgs/5b6dL3iY9Q6xo0b165du169egEABhaxZ9PgwYOxR5DT6XzhhRcAID09/a677jpz5gwAPPLII7IsJycnY1vLqqoqzJXFFglbtmwBgBEjRkyfPn3hwoXY8/7RRx+VZfnSpUtDhw7FqfDYY49hj+qgoKCCgoJFixahe0pJ8luzZg2+wHXw1Vdf4SMSkpOTe/bsicN06NAhANi+fXtxcTHDMH5+fv369cO0aZfLFRISkpCQ8NBDD40fP97pdGZlZeG6x5VaV1f32WefoSCNj4+PjY2tqKjAmF5MTAzGrd98882jR48CwPfffy/Lcn19fWxsLHa8AAB0nkrXtg3Bgm9RbNNUhMUf/s3cUf4plTRXAmWob/j5+aF/d+7cucuXL9dqtf379/d6vb169Zo3b15iYmJmZmb//v1DQ0Obm5szMjL69u1rNpsnT56MDQizs7MzMjIMBoO/v//IkSNRJqSmpqalpeXl5RFCsrOzIyIiOI6bNGlSVFSUJEmFhYUFBQWPPvroU089FRwc7OfnZzQaR40aNWzYMI/HEx8fv2TJkoiICPwzKSlp/Pjxzc3NAQEB48eP79KlS2BgIMdxjz/+eGpq6siRI7VabWho6Pjx46Ojo8eNG5eRkRETE7Nnz57FixenpqYOHToUn/qXlZXVq1cvt9s9fvz4bt26tbS0pKenDx06tGPHjn5+frW1taNGjVqzZk27du38/PwCAwMtFsu8efM6duw4ZswYjUYTGhqanZ1tNBqNRuOYMWOwvekbb7yBgpdhGKAAVL7KEPQdeUVVvlH7wJv47HzNt2tDsIrj5FqHCn7zNwfPldfYmvva8ow2EZSbFyFf96jrxmAQ+GifqKioVatWpaam4hNCfFsKX3vCa1N2MOPgul4cRdf1vTXf8oRbAffHSq59k7Vvwt913/f9wnW/rNxtm0+v+3M3P+om3w8JCWlubi4vL3/iiScWLlx4bc33tSe8Ti4Ax/2uwbnJ969/knHjxv2fK9gkhFKq1+sxBY7jOHwU0I069KlQcYOZhI3aVfzvBHcrITwV/1NQmxeo9KhQ6VHpUaHSo0KlR6VHhUqPSo8KlR4VKj0qPSpUelR6VKj0qFDpUelRodKj0qNCpUeFSo9KjwqVHpUedQhUelSo9Kj0qFDpUaHSo9KjQqVHpUeFSo8KlR6VHhUqPSo9KlR6VKj0qPSoUOlR6VGh0qNCpUelR4VKj0qPCpUeFSo9Kj0qVHpUqPSo9KhQ6VHpUaHSo0KlR6VHhUqPSo8KlR4VKj0qPSpUelR6VKj0qFDpUelRodKj0qNCpUeFSo9KjwqVHhUqPSo9KlR6VHpUqPSoUOlR6VGh0qPSo0KlR4VKj0qPCpUelR4VKj0qVHpUelSo9Kj0qFDpUaHSo9KjQqVHhUqPSo8KlR6VHhUqPSpUelR6VPx5+H/q94ybAIPvbwAAAABJRU5ErkJggg==';
const GECIT_LOGO_WATERMARK = 'data:image/png;base64,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mTKFd999l+TkZOLi4rDb7TQ2NpKens6BAwcYP348GzduxGAw0KVLF5KTkzl+/DjDhg1jy5YtbNiwgbq6OnJycrRzDE+mWa1WzGYz1dXVDBkyhHfffReXy8WsWbOwWq1s3LgRk8lE586dteOOHj0agPfff5+6ujpmz56NxWIJbZzh3hfU9hzDSaz/LY/R+0ckLy+Pp59+GovFwqOPPsqAAQP+289JGDlyZMrPdf7bTkWEfe62SZqwX9q2QTPcIte2ChN249oO1bYtXXXs9whHch2fYxX2hds25oePE853hB/tIYoiXq+33Tl2rDm2HdbteI1tj9v2Gn6qSv93ewv1bpF/Y19KZGTk/9mL+29tt/sp4B0fqKjLf63o/Wc6cB24LjpwHbguOnAduC46cB24DlwXHbgOXBcduA5cFx24DlwHrosOXAeuiw5cB66LDlwHrgPXRQeuA9dFB64D10UHrgPXgeuiA9eB66ID14HrogPXgevAddGB68B10YHrwHXRgevAdeC66MB14LrowHXguujAdeA6cF104DpwXXTgOnBddOA6cB24LjpwHbguOnAduC46cB24DlwXHbgOXJd/Xv4f386KuCfQa5IAAAAASUVORK5CYII=';

// ─── PDF Gutachten Report Generator ─────────────
function generateGutachtenPDF({ vehicle, customer, appraisal, paintData, db, output = 'save' }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210, H = 297;
  const margin = 18;
  const usable = W - margin * 2;

  // Colors
  const purple = [227, 6, 19]; // brand red
  const dark = [10, 10, 10];
  const gray = [120, 113, 108];
  const white = [255, 255, 255];
  const green = [52, 211, 153];
  const red = [239, 68, 68];
  const blue = [59, 130, 246];

  // Helper: add watermark/hologram to current page
  const addWatermark = () => {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.06 }));
    // Tile the logo across the page
    const wmW = 40, wmH = 86;
    for (let y = 50; y < H - 30; y += 100) {
      for (let x = 20; x < W - 20; x += 60) {
        try { doc.addImage(GECIT_LOGO_WATERMARK, 'PNG', x, y, wmW, wmH); } catch(e) {}
      }
    }
    doc.restoreGraphicsState();
  };

  // Helper: add header to each page
  const addHeader = (pageNum, totalPages) => {
    // Top bar
    doc.setFillColor(...purple);
    doc.rect(0, 0, W, 3, 'F');

    // Logo
    try { doc.addImage(GECIT_LOGO_HEADER, 'PNG', margin, 6, 22, 48); } catch(e) {}

    // Company info right side
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text('Gecit Kfz Sachverständiger', W - margin, 16, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Sachverständigenbüro', W - margin, 22, { align: 'right' });
    doc.text('Kfz-Schadensgutachten · Bewertungen', W - margin, 27, { align: 'right' });

    // Separator
    doc.setDrawColor(...purple);
    doc.setLineWidth(0.5);
    doc.line(margin, 56, W - margin, 56);

    // Page number
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('Seite ' + pageNum + ' von ' + totalPages, W - margin, H - 8, { align: 'right' });

    // Bottom bar
    doc.setFillColor(...purple);
    doc.rect(0, H - 3, W, 3, 'F');
  };

  // Helper: add footer
  const addFooter = () => {
    doc.setFontSize(6);
    doc.setTextColor(...gray);
    doc.text('Gecit Kfz Sachverständiger · Dieses Dokument ist urheberrechtlich geschützt.', margin, H - 8);
    doc.text('Erstellt mit Gecit Kfz Sachverständiger Expertiz Platform · ' + new Date().toLocaleDateString('de-DE'), margin, H - 12);
  };

  // ═══════════════════════════
  // PAGE 1: Cover + Vehicle Info
  // ═══════════════════════════
  addWatermark();
  addHeader(1, 3);
  addFooter();

  let y = 64;

  // Report title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('KAPORTA DETAY EKSPERTİZİ', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Kfz-Schadensgutachten / Fahrzeugbewertung', margin, y);
  y += 4;

  // Purple accent line
  doc.setDrawColor(...purple);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + 50, y);
  y += 8;

  // Report number + date
  const reportNo = 'GKF-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, usable, 18, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...purple);
  doc.text('Gutachten-Nr:', margin + 5, y + 7);
  doc.text('Datum:', margin + usable/2, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...dark);
  doc.text(reportNo, margin + 35, y + 7);
  doc.text(new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }), margin + usable/2 + 18, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...purple);
  doc.text('Auftraggeber:', margin + 5, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...dark);
  doc.text(customer?.full_name || '—', margin + 38, y + 14);
  y += 26;

  // Vehicle info table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('FAHRZEUGDATEN', margin, y);
  y += 2;

  const vRows = [
    ['Kennzeichen / Plaka', vehicle?.plate || '—'],
    ['Marke / Marka', vehicle?.brand || '—'],
    ['Modell / Model', vehicle?.model || '—'],
    ['Baujahr / Yıl', String(vehicle?.year || '—')],
    ['Fahrgestellnr. / Şasi No', vehicle?.chassis || '—'],
    ['Auftraggeber / Müşteri', customer?.full_name || '—'],
    ['Telefon', customer?.phone || '—'],
    ['E-Mail', customer?.email || '—'],
  ];

  doc.autoTable({
    startY: y,
    head: [],
    body: vRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 }, textColor: dark, lineColor: [230, 230, 230], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: gray },
      1: { cellWidth: usable - 55 },
    },
    alternateRowStyles: { fillColor: [250, 249, 255] },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Appraisal status
  const stageInfo = (appraisal?.status || 'bekliyor');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('EKSPERTİZ DURUMU', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Durum: ' + stageInfo.toUpperCase(), margin, y);
  y += 4;
  if (appraisal?.notes) {
    doc.text('Notlar: ' + appraisal.notes, margin, y, { maxWidth: usable });
    y += 8;
  }

  // ═══════════════════════════
  // PAGE 2: Paint Map (Boya Haritası)
  // ═══════════════════════════
  doc.addPage();
  addWatermark();
  addHeader(2, 3);
  addFooter();

  y = 64;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('KAPORTA BOYA HARİTASI', margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Lackschichtdickenmessung / Karosserieprüfung', margin, y);
  y += 3;
  doc.setDrawColor(...purple);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + 50, y);
  y += 8;

  // Paint status legend
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('LEJANT / LEGENDE:', margin, y);
  y += 5;

  const statusColors = {
    orijinal: { r: 52, g: 211, b: 153, label: 'Orijinal / Original' },
    l_boyali: { r: 59, g: 130, b: 246, label: 'L. Boyalı / Leicht lackiert' },
    boyali:   { r: 139, g: 92, b: 246, label: 'Boyalı / Lackiert' },
    degisen:  { r: 239, g: 68, b: 68, label: 'Değişen / Erneuert' },
    sok_tak:  { r: 245, g: 158, b: 11, label: 'Sök-Tak / Ab- und angebaut' },
    plastik:  { r: 107, g: 114, b: 128, label: 'Plastik / Kunststoff' },
    folyo:    { r: 236, g: 72, b: 153, label: 'Folyo / Folie' },
    yok:      { r: 120, g: 113, b: 108, label: 'Yok / Nicht vorhanden' },
  };

  let lx = margin;
  Object.entries(statusColors).forEach(([key, sc]) => {
    doc.setFillColor(sc.r, sc.g, sc.b);
    doc.roundedRect(lx, y - 3, 4, 4, 1, 1, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(sc.r, sc.g, sc.b);
    doc.text(sc.label, lx + 6, y);
    lx += 44;
    if (lx > W - margin - 30) { lx = margin; y += 7; }
  });
  y += 10;

  // Paint data table
  const paintRows = [];
  const carParts = [
    { id: 'on_tampon', tr: 'Ön Tampon', de: 'Frontstoßstange' },
    { id: 'on_kaput', tr: 'Ön Kaput', de: 'Motorhaube' },
    { id: 'tavan', tr: 'Tavan', de: 'Dach' },
    { id: 'bagaj', tr: 'Bagaj Kapağı', de: 'Kofferraumdeckel' },
    { id: 'arka_tampon', tr: 'Arka Tampon', de: 'Heckstoßstange' },
    { id: 'sol_on_camurluk', tr: 'Sol Ön Çamurluk', de: 'Kotflügel VL' },
    { id: 'sag_on_camurluk', tr: 'Sağ Ön Çamurluk', de: 'Kotflügel VR' },
    { id: 'sol_on_kapi', tr: 'Sol Ön Kapı', de: 'Tür VL' },
    { id: 'sag_on_kapi', tr: 'Sağ Ön Kapı', de: 'Tür VR' },
    { id: 'sol_arka_kapi', tr: 'Sol Arka Kapı', de: 'Tür HL' },
    { id: 'sag_arka_kapi', tr: 'Sağ Arka Kapı', de: 'Tür HR' },
    { id: 'sol_arka_camurluk', tr: 'Sol Arka Çamurluk', de: 'Kotflügel HL' },
    { id: 'sag_arka_camurluk', tr: 'Sağ Arka Çamurluk', de: 'Kotflügel HR' },
    { id: 'sol_marspiyel', tr: 'Sol Marşpiyel', de: 'Schweller L' },
    { id: 'sag_marspiyel', tr: 'Sağ Marşpiyel', de: 'Schweller R' },
  ];

  carParts.forEach(part => {
    const data = paintData?.[part.id];
    const status = data ? (statusColors[data.status]?.label || '—') : 'Kontrol edilmedi';
    paintRows.push([part.tr, part.de, status, data?.thickness ? data.thickness + ' μm' : '—']);
  });

  doc.autoTable({
    startY: y,
    head: [['Parça / Bauteil', 'Deutsch', 'Durum / Status', 'Kalınlık / Dicke']],
    body: paintRows,
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: purple, textColor: white, fontSize: 8, fontStyle: 'bold', cellPadding: 3 },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: dark, lineColor: [220, 220, 230], lineWidth: 0.15 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 35, textColor: gray },
      2: { cellWidth: 55 },
      3: { cellWidth: usable - 130, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [250, 249, 255] },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw;
        if (val.includes('Orijinal') || val.includes('Original')) data.cell.styles.textColor = [52, 211, 153];
        else if (val.includes('Boyalı') || val.includes('Lackiert')) data.cell.styles.textColor = [139, 92, 246];
        else if (val.includes('L. Boyalı') || val.includes('Leicht')) data.cell.styles.textColor = [59, 130, 246];
        else if (val.includes('Değişen') || val.includes('Erneuert')) data.cell.styles.textColor = [239, 68, 68];
        else if (val.includes('Sök-Tak')) data.cell.styles.textColor = [245, 158, 11];
        else if (val.includes('Kontrol')) data.cell.styles.textColor = gray;
      }
    },
  });

  // ═══════════════════════════
  // PAGE 3: Summary + Signature
  // ═══════════════════════════
  doc.addPage();
  addWatermark();
  addHeader(3, 3);
  addFooter();

  y = 64;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('ZUSAMMENFASSUNG / ÖZET', margin, y);
  y += 5;
  doc.setDrawColor(...purple);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + 50, y);
  y += 10;

  // Summary stats
  const filled = paintData ? Object.keys(paintData).length : 0;
  const total = 15;
  const counts = {};
  if (paintData) {
    Object.values(paintData).forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
  }

  const summaryRows = [
    ['Geprüfte Bauteile / Kontrol Edilen Parça', filled + ' / ' + total],
    ['Original / Orijinal Parça', String(counts.orijinal || 0)],
    ['Lackiert / Boyalı Parça', String((counts.boyali || 0) + (counts.l_boyali || 0))],
    ['Erneuert / Değişen Parça', String(counts.degisen || 0)],
    ['Sök-Tak', String(counts.sok_tak || 0)],
    ['Kunststoff / Plastik', String(counts.plastik || 0)],
    ['Folie / Folyo', String(counts.folyo || 0)],
  ];

  doc.autoTable({
    startY: y,
    head: [['Beschreibung / Açıklama', 'Wert / Değer']],
    body: summaryRows,
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: purple, textColor: white, fontSize: 9, fontStyle: 'bold', cellPadding: 4 },
    styles: { fontSize: 9, cellPadding: 3.5, textColor: dark },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: usable * 0.65 },
      1: { halign: 'center', cellWidth: usable * 0.35 },
    },
    alternateRowStyles: { fillColor: [250, 249, 255] },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Notes section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('ANMERKUNGEN / NOTLAR', margin, y);
  y += 6;
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.2);
  for (let i = 0; i < 5; i++) {
    doc.line(margin, y, W - margin, y);
    y += 8;
  }

  y += 10;

  // Signature section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('UNTERSCHRIFT / İMZA', margin, y);
  y += 15;

  // Two signature boxes
  const sigW = (usable - 10) / 2;
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.3);

  // Left: Sachverständiger
  doc.line(margin, y, margin + sigW, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Sachverständiger / Eksper', margin, y + 5);
  doc.text('Gecit Kfz Sachverständiger', margin, y + 10);

  // Right: Auftraggeber
  doc.line(margin + sigW + 10, y, W - margin, y);
  doc.text('Auftraggeber / Müşteri', margin + sigW + 10, y + 5);
  doc.text(customer?.full_name || '', margin + sigW + 10, y + 10);

  y += 20;

  // Stamp / Seal area
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('Ort, Datum / Yer, Tarih: ________________    Stempel / Kaşe:', margin, y);

  // Disclaimer
  y += 15;
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, usable, 20, 2, 2, 'F');
  doc.setDrawColor(...purple);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, usable, 20, 2, 2, 'S');
  doc.setFontSize(6);
  doc.setTextColor(...gray);
  doc.text('HAFTUNGSAUSSCHLUSS / SORUMLULUK REDDİ', margin + 5, y + 5);
  doc.setFontSize(5.5);
  doc.text('Dieses Gutachten wurde nach bestem Wissen und Gewissen erstellt. Der Sachverständige haftet nicht für', margin + 5, y + 10);
  doc.text('verdeckte Mängel. Bu rapor en iyi bilgi ve tecrübeye dayanılarak hazırlanmıştır.', margin + 5, y + 14);
  doc.text('Gizli kusurlardan sorumlu tutulamaz. © ' + new Date().getFullYear() + ' Gecit Kfz Sachverständiger · Alle Rechte vorbehalten.', margin + 5, y + 18);

  // Save / output
  const filename = 'Gecit-KFZ_Gutachten_' + (vehicle?.plate || 'Fahrzeug').replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
  if (output === 'dataurl') {
    return { dataUrl: doc.output('datauristring'), filename };
  }
  doc.save(filename);
  return filename;
}


// ─── Paint Thickness Map (Boya Kalınlık Haritası) ──
const PAINT_STATUSES = [
  { key: 'orijinal',  label: 'Orijinal',   short: 'OR', color: '#34D399', bg: 'rgba(52,211,153,0.18)',  border: 'rgba(52,211,153,0.5)' },
  { key: 'l_boyali',  label: 'L. Boyalı',  short: 'LB', color: '#3B82F6', bg: 'rgba(59,130,246,0.18)',  border: 'rgba(59,130,246,0.5)' },
  { key: 'boyali',    label: 'Boyalı',     short: 'BY', color: '#8B5CF6', bg: 'rgba(139,92,246,0.22)',  border: 'rgba(139,92,246,0.5)' },
  { key: 'degisen',   label: 'Değişen',    short: 'DG', color: '#EF4444', bg: 'rgba(239,68,68,0.22)',   border: 'rgba(239,68,68,0.5)' },
  { key: 'sok_tak',   label: 'Sök-Tak',    short: 'ST', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.5)' },
  { key: 'plastik',   label: 'Plastik',    short: 'PL', color: '#6B7280', bg: 'rgba(107,114,128,0.18)', border: 'rgba(107,114,128,0.5)' },
  { key: 'folyo',     label: 'Folyo',      short: 'FO', color: '#EC4899', bg: 'rgba(236,72,153,0.18)',  border: 'rgba(236,72,153,0.5)' },
  { key: 'yok',       label: 'Yok',        short: 'YK', color: '#78716C', bg: 'rgba(120,113,108,0.22)', border: 'rgba(120,113,108,0.5)' },
];

const CAR_PARTS = [
  // id, label (TR), label (DE)
  { id: 'on_tampon',       label: 'Ön Tampon',           de: 'Frontstoßstange' },
  { id: 'on_kaput',        label: 'Ön Kaput',            de: 'Motorhaube' },
  { id: 'tavan',           label: 'Tavan',               de: 'Dach' },
  { id: 'bagaj',           label: 'Bagaj Kapağı',        de: 'Kofferraumdeckel' },
  { id: 'arka_tampon',     label: 'Arka Tampon',         de: 'Heckstoßstange' },
  { id: 'sol_on_camurluk', label: 'Sol Ön Çamurluk',     de: 'Kotflügel VL' },
  { id: 'sag_on_camurluk', label: 'Sağ Ön Çamurluk',     de: 'Kotflügel VR' },
  { id: 'sol_on_kapi',     label: 'Sol Ön Kapı',         de: 'Tür VL' },
  { id: 'sag_on_kapi',     label: 'Sağ Ön Kapı',         de: 'Tür VR' },
  { id: 'sol_arka_kapi',   label: 'Sol Arka Kapı',       de: 'Tür HL' },
  { id: 'sag_arka_kapi',   label: 'Sağ Arka Kapı',       de: 'Tür HR' },
  { id: 'sol_arka_camurluk', label: 'Sol Arka Çamurluk', de: 'Kotflügel HL' },
  { id: 'sag_arka_camurluk', label: 'Sağ Arka Çamurluk', de: 'Kotflügel HR' },
  { id: 'sol_marspiyel',   label: 'Sol Marşpiyel',       de: 'Schweller L' },
  { id: 'sag_marspiyel',   label: 'Sağ Marşpiyel',       de: 'Schweller R' },
];

function PaintMap({ vehicleId, db, setDb }) {
  const paintData = (db.paint_maps || {})[vehicleId] || {};
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTool, setActiveTool] = useState('orijinal');
  const [thickness, setThickness] = useState('');

  const getPartStatus = (partId) => paintData[partId] || null;
  const getStatusInfo = (key) => PAINT_STATUSES.find(s => s.key === key) || PAINT_STATUSES[0];

  const applyStatus = (partId) => {
    const newMap = { ...(db.paint_maps || {}) };
    const vehicleMap = { ...(newMap[vehicleId] || {}) };
    vehicleMap[partId] = {
      status: activeTool,
      thickness: thickness || null,
      updated_at: new Date().toISOString(),
    };
    newMap[vehicleId] = vehicleMap;
    setDb(prev => ({ ...prev, paint_maps: newMap }));
  };

  const clearPart = (partId) => {
    const newMap = { ...(db.paint_maps || {}) };
    const vehicleMap = { ...(newMap[vehicleId] || {}) };
    delete vehicleMap[partId];
    newMap[vehicleId] = vehicleMap;
    setDb(prev => ({ ...prev, paint_maps: newMap }));
  };

  const clearAll = () => {
    const newMap = { ...(db.paint_maps || {}) };
    newMap[vehicleId] = {};
    setDb(prev => ({ ...prev, paint_maps: newMap }));
  };

  const handlePartClick = (partId) => {
    setSelectedPart(partId);
    applyStatus(partId);
  };

  const getPartFill = (partId) => {
    const data = getPartStatus(partId);
    if (!data) return 'rgba(0,0,0,0.05)';
    return getStatusInfo(data.status).bg;
  };

  const getPartStroke = (partId) => {
    const data = getPartStatus(partId);
    if (!data) return C.border;
    return getStatusInfo(data.status).border;
  };

  const getPartLabel = (partId) => {
    const data = getPartStatus(partId);
    if (!data) return '';
    return getStatusInfo(data.status).short;
  };

  const getPartColor = (partId) => {
    const data = getPartStatus(partId);
    if (!data) return C.textDim;
    return getStatusInfo(data.status).color;
  };

  // Count stats
  const filledParts = Object.keys(paintData).length;
  const totalParts = CAR_PARTS.length;
  const statusCounts = {};
  Object.values(paintData).forEach(v => {
    statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
  });

  // SVG car part paths — top-down view
  const PartShape = ({ id, d, x, y, w, h, labelX, labelY, rx }) => {
    const isSelected = selectedPart === id;
    const data = getPartStatus(id);
    const statusInfo = data ? getStatusInfo(data.status) : null;
    return (
      <g className="cursor-pointer" onClick={() => handlePartClick(id)}
        style={{ transition: 'all 0.2s' }}>
        {rx !== undefined ? (
          <rect x={x} y={y} width={w} height={h} rx={rx}
            fill={getPartFill(id)} stroke={getPartStroke(id)} strokeWidth={isSelected ? 2.5 : 1.5}
            style={{ filter: isSelected ? `drop-shadow(0 0 6px ${getPartColor(id)})` : 'none', transition: 'all 0.2s' }} />
        ) : (
          <path d={d} fill={getPartFill(id)} stroke={getPartStroke(id)} strokeWidth={isSelected ? 2.5 : 1.5}
            style={{ filter: isSelected ? `drop-shadow(0 0 6px ${getPartColor(id)})` : 'none', transition: 'all 0.2s' }} />
        )}
        {statusInfo && (
          <text x={labelX || (x + w/2)} y={labelY || (y + h/2 + 4)}
            textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace"
            fill={statusInfo.color} style={{ pointerEvents: 'none' }}>
            {statusInfo.short}
          </text>
        )}
        {!statusInfo && (
          <text x={labelX || (x + w/2)} y={labelY || (y + h/2 + 3)}
            textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.2)"
            style={{ pointerEvents: 'none' }}>
            ·
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5">
        {PAINT_STATUSES.map(s => (
          <button key={s.key} onClick={() => setActiveTool(s.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTool === s.key ? s.bg : 'rgba(0,0,0,0.04)',
              border: `1.5px solid ${activeTool === s.key ? s.border : C.border}`,
              color: activeTool === s.key ? s.color : C.textDim,
              boxShadow: activeTool === s.key ? `0 0 12px ${s.color}25` : 'none',
            }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Car Diagram + Info side by side */}
      <div className="flex gap-4">
        {/* SVG Car Diagram */}
        <div className="flex-1 rounded-2xl p-4 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}`, minHeight: 380 }}>
          <svg viewBox="0 0 240 440" width="220" xmlns="http://www.w3.org/2000/svg">
            {/* Car body outline hint */}
            <defs>
              <linearGradient id="carBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(227,6,19,0.02)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.02)" />
              </linearGradient>
            </defs>

            {/* ── Ön Tampon ── */}
            <PartShape id="on_tampon" x={40} y={10} w={160} h={36} rx={16} labelX={120} labelY={32} />

            {/* ── Ön Kaput ── */}
            <PartShape id="on_kaput" x={40} y={50} w={160} h={70} rx={6} labelX={120} labelY={88} />

            {/* ── Sol Ön Çamurluk ── */}
            <PartShape id="sol_on_camurluk" x={8} y={50} w={28} h={70} rx={6} labelX={22} labelY={88} />

            {/* ── Sağ Ön Çamurluk ── */}
            <PartShape id="sag_on_camurluk" x={204} y={50} w={28} h={70} rx={6} labelX={218} labelY={88} />

            {/* ── Sol Ön Kapı ── */}
            <PartShape id="sol_on_kapi" x={8} y={124} w={28} h={72} rx={4} labelX={22} labelY={163} />

            {/* ── Sağ Ön Kapı ── */}
            <PartShape id="sag_on_kapi" x={204} y={124} w={28} h={72} rx={4} labelX={218} labelY={163} />

            {/* ── Tavan ── */}
            <PartShape id="tavan" x={40} y={124} w={160} h={160} rx={6} labelX={120} labelY={208} />

            {/* ── Sol Marşpiyel ── */}
            <PartShape id="sol_marspiyel" x={8} y={200} w={28} h={16} rx={3} labelX={22} labelY={211} />

            {/* ── Sağ Marşpiyel ── */}
            <PartShape id="sag_marspiyel" x={204} y={200} w={28} h={16} rx={3} labelX={218} labelY={211} />

            {/* ── Sol Arka Kapı ── */}
            <PartShape id="sol_arka_kapi" x={8} y={220} w={28} h={72} rx={4} labelX={22} labelY={259} />

            {/* ── Sağ Arka Kapı ── */}
            <PartShape id="sag_arka_kapi" x={204} y={220} w={28} h={72} rx={4} labelX={218} labelY={259} />

            {/* ── Sol Arka Çamurluk ── */}
            <PartShape id="sol_arka_camurluk" x={8} y={296} w={28} h={70} rx={6} labelX={22} labelY={334} />

            {/* ── Sağ Arka Çamurluk ── */}
            <PartShape id="sag_arka_camurluk" x={204} y={296} w={28} h={70} rx={6} labelX={218} labelY={334} />

            {/* ── Bagaj ── */}
            <PartShape id="bagaj" x={40} y={288} w={160} h={70} rx={6} labelX={120} labelY={326} />

            {/* ── Arka Tampon ── */}
            <PartShape id="arka_tampon" x={40} y={362} w={160} h={36} rx={16} labelX={120} labelY={384} />

            {/* Wheel hints */}
            {[[18, 122, 12], [222, 122, 12], [18, 294, 12], [222, 294, 12]].map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3 2" />
            ))}

            {/* Direction arrow */}
            <g opacity="0.15">
              <path d="M 120 415 L 120 425 M 115 420 L 120 415 L 125 420" stroke={C.textDim} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <text x="120" y="436" textAnchor="middle" fontSize="7" fill={C.textDim} fontFamily="system-ui">ÖN</text>
            </g>
          </svg>
        </div>

        {/* Right side: selected part details + stats */}
        <div className="w-52 flex-shrink-0 space-y-3">
          {/* Selected part info */}
          {selectedPart && (() => {
            const part = CAR_PARTS.find(p => p.id === selectedPart);
            const data = getPartStatus(selectedPart);
            const statusInfo = data ? getStatusInfo(data.status) : null;
            return (
              <div className="rounded-xl p-3 space-y-2" style={{ background: statusInfo ? statusInfo.bg : 'rgba(0,0,0,0.04)', border: `1px solid ${statusInfo ? statusInfo.border : C.border}` }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: C.text }}>{part?.label}</p>
                  {data && <button onClick={() => clearPart(selectedPart)} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)' }}>Sıfırla</button>}
                </div>
                <p className="text-[10px]" style={{ color: C.textDim }}>{part?.de}</p>
                {statusInfo && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ background: statusInfo.color }} />
                    <span className="text-xs font-medium" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                  </div>
                )}
                {/* Thickness input */}
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: C.textDim }}>Kalınlık (μm)</label>
                  <input type="number" placeholder="ör: 120" value={data?.thickness || thickness}
                    onChange={e => {
                      setThickness(e.target.value);
                      if (data) {
                        const newMap = { ...(db.paint_maps || {}) };
                        const vehicleMap = { ...(newMap[vehicleId] || {}) };
                        vehicleMap[selectedPart] = { ...data, thickness: e.target.value || null };
                        newMap[vehicleId] = vehicleMap;
                        setDb(prev => ({ ...prev, paint_maps: newMap }));
                      }
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                </div>
              </div>
            );
          })()}

          {/* Stats summary */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
            <p className="text-[10px] uppercase font-bold mb-2" style={{ color: C.textDim, letterSpacing: '0.1em' }}>Özet</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: C.textDim }}>Tamamlanan</span>
              <span className="text-xs font-mono font-bold" style={{ color: C.text }}>{filledParts}/{totalParts}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <div className="h-full rounded-full" style={{ width: `${(filledParts / totalParts) * 100}%`, background: `linear-gradient(90deg, ${C.neon}, ${C.cyan})`, transition: 'width 0.3s' }} />
            </div>
            <div className="space-y-1">
              {PAINT_STATUSES.filter(s => statusCounts[s.key]).map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                    <span className="text-[11px]" style={{ color: C.textDim }}>{s.label}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{statusCounts[s.key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1.5">
            <button onClick={clearAll}
              className="w-full text-xs py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
              Tümünü Sıfırla
            </button>
          </div>
        </div>
      </div>

      {/* Parts list — compact */}
      <div className="grid grid-cols-3 gap-1.5">
        {CAR_PARTS.map(part => {
          const data = getPartStatus(part.id);
          const statusInfo = data ? getStatusInfo(data.status) : null;
          const isSelected = selectedPart === part.id;
          return (
            <button key={part.id} onClick={() => { setSelectedPart(part.id); }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
              style={{
                background: isSelected ? (statusInfo ? statusInfo.bg : `${C.neon}10`) : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isSelected ? (statusInfo ? statusInfo.border : C.neon + '44') : C.border}`,
              }}>
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: statusInfo ? statusInfo.color : 'rgba(255,255,255,0.1)' }} />
              <span className="text-[11px] truncate" style={{ color: statusInfo ? statusInfo.color : C.textDim }}>{part.label}</span>
              {data?.thickness && <span className="text-[9px] font-mono ml-auto flex-shrink-0" style={{ color: C.textDim }}>{data.thickness}μm</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppraisalCard({ ap, customer, db, setDb, onPreview, isPreviewing, currentUser }) {
  const v = db.vehicles.find(vh => vh.id === ap.vehicle_id);
  const [showPaintMap, setShowPaintMap] = useState(false);
  const stop = (e) => { e.stopPropagation(); };
  const STAGE_LABEL = (k) => (STAGES.find(s => s.key === k)?.label) || k;
  const customerLabel = customer ? (customer.full_name || customer.company || customer.email) : '';
  return (
    <div onClick={onPreview ? () => onPreview() : undefined}
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: isPreviewing ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${isPreviewing ? 'rgba(239,68,68,0.4)' : C.border}`,
        cursor: onPreview ? 'pointer' : 'default',
        boxShadow: isPreviewing ? '0 0 24px rgba(239,68,68,0.15)' : 'none',
      }}
      title={onPreview ? 'PDF\u0027yi sağ panelde önizle' : undefined}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            <p className="font-mono text-sm" style={{ color: C.text }}>{v?.plate}</p>
            <p className="text-xs" style={{ color: C.textDim }}>{v?.brand} {v?.model} · {v?.year} — {ap.created_at}</p>
          </div>
          <div className="w-48" onClick={stop}>
            <SelectInput value={ap.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                if (newStatus === ap.status) return;
                setDb(withLog(
                  prev => ({ ...prev, appraisals: prev.appraisals.map(x => x.id === ap.id ? { ...x, status: newStatus } : x) }),
                  makeLogEntry({
                    user: currentUser, action: 'appraisal_status',
                    target: { kind: 'appraisal', id: ap.id, label: v?.plate || ap.id },
                    details: `${v?.plate || 'Araç'}: ${STAGE_LABEL(ap.status)} → ${STAGE_LABEL(newStatus)}${customerLabel ? ' (' + customerLabel + ')' : ''}`,
                    before: ap.status, after: newStatus,
                  })
                ));
              }}
              options={STAGES.map(s => ({ value: s.key, label: s.label }))} />
          </div>
        </div>
        {ap.notes && <p className="text-sm mb-3" style={{ color: C.textDim }}>{ap.notes}</p>}
        <div className="flex gap-2" onClick={stop}>
          <button onClick={() => setShowPaintMap(!showPaintMap)}
            className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all justify-center"
            style={{
              background: showPaintMap ? 'rgba(227,6,19,0.07)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${showPaintMap ? 'rgba(227,6,19,0.18)' : C.border}`,
              color: showPaintMap ? C.neon : C.textDim,
            }}>
            <PaletteIcon size={14} />
            {showPaintMap ? 'Boya Haritasını Gizle' : 'Boya Haritası'}
            {(() => {
              const pm = (db.paint_maps || {})[v?.id];
              const cnt = pm ? Object.keys(pm).length : 0;
              return cnt > 0 ? <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono" style={{ background: `${C.neon}20`, color: C.neon }}>{cnt}/15</span> : null;
            })()}
          </button>
          <button onClick={() => {
            try {
              const paintMap = (db.paint_maps || {})[v?.id] || {};
              generateGutachtenPDF({
                vehicle: v,
                customer: customer,
                appraisal: ap,
                paintData: paintMap,
                db: db,
              });
            } catch(err) {
              console.error('PDF generation error:', err);
              alert('PDF oluşturulurken hata: ' + err.message);
            }
          }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444',
            }}>
            <FileText size={14} />
            PDF Rapor
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showPaintMap && v && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="overflow-hidden"
            style={{ borderTop: `1px solid ${C.border}` }}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <PaletteIcon size={16} style={{ color: C.neon }} />
                <span className="text-sm font-bold" style={{ color: C.text }}>Kaporta Detay Ekspertizi</span>
                <span className="text-xs" style={{ color: C.textDim }}>— Parçaya tıklayıp durumu seçin</span>
              </div>
              <PaintMap vehicleId={v.id} db={db} setDb={setDb} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── WhatsApp template helpers ───────────────────
const WA_TEMPLATE_TRIGGER_LABELS = {
  ekspertiz_tamamlandi: 'Ekspertiz Tamamlandı',
  randevu_yaklasti: 'Randevu Yaklaştı',
  sigorta_guncelleme: 'Sigorta Güncelleme',
  fatura_olusturuldu: 'Fatura Oluşturuldu',
};

function fillWhatsAppTemplate(message, ctx) {
  const safe = (v, fb) => (v === undefined || v === null || v === '' ? (fb || '') : String(v));
  return String(message || '')
    .replace(/\{MUSTERI_ADI\}/g, safe(ctx.customerName, 'Müşteri'))
    .replace(/\{PLAKA\}/g, safe(ctx.plate, '—'))
    .replace(/\{TARIH\}/g, safe(ctx.date, new Date().toLocaleDateString('tr-TR')))
    .replace(/\{DURUM\}/g, safe(ctx.status, '—'))
    .replace(/\{FATURA_NO\}/g, safe(ctx.invoiceNo, '—'))
    .replace(/\{TUTAR\}/g, safe(ctx.amount, '—'))
    .replace(/\{PORTAL_LINK\}/g, safe(ctx.portalLink, 'https://gecit-kfz.app/portal'));
}

function buildCustomerTemplateContext(customer, db) {
  const myVehicles = (db.vehicles || []).filter(v => v.owner_id === customer.id);
  const lastInvoice = (db.invoices || []).filter(i => i.customer_id === customer.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  return {
    customerName: customer.full_name || customer.company || customer.name || 'Müşteri',
    plate: myVehicles[0]?.plate || '—',
    date: new Date().toLocaleDateString('tr-TR'),
    status: 'Güncellendi',
    invoiceNo: lastInvoice?.no || '—',
    amount: lastInvoice ? lastInvoice.amount?.toLocaleString('tr-TR') : '—',
    portalLink: 'https://gecit-kfz.app/portal',
  };
}

// ─── Admin: WhatsApp Templates Management Section ───
function WhatsAppTemplatesSection({ db, setDb }) {
  const templates = db.whatsapp_templates || [];
  const [editTpl, setEditTpl] = useState(null);
  const [editMsg, setEditMsg] = useState('');
  const triggerColors = {
    ekspertiz_tamamlandi: '#34D399',
    randevu_yaklasti: '#F59E0B',
    sigorta_guncelleme: C.cyan,
    fatura_olusturuldu: C.magenta,
  };
  return (
    <>
      <AdminTopbar title="WhatsApp Şablon Mesajları" subtitle="Otomatik bildirim şablonları" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl, idx) => {
          const tc = triggerColors[tpl.trigger] || C.neon;
          return (
            <motion.div key={tpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}>
              <GlassCard>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: '#25D36615', border: '1px solid #25D36633' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: C.text }}>{tpl.name}</p>
                  </div>
                  <span className="text-[9px] px-2 py-1 rounded-full uppercase"
                    style={{ background: `${tc}15`, color: tc, border: `1px solid ${tc}33`, letterSpacing: '0.1em' }}>
                    {WA_TEMPLATE_TRIGGER_LABELS[tpl.trigger] || tpl.trigger}
                  </span>
                </div>
                <div className="p-3 rounded-xl text-xs font-mono leading-relaxed mb-3"
                  style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.15)', color: C.text }}>
                  {editTpl === tpl.id ? (
                    <textarea value={editMsg} onChange={e => setEditMsg(e.target.value)} rows={4}
                      className="w-full bg-transparent outline-none resize-none text-xs font-mono"
                      style={{ color: C.text }} />
                  ) : tpl.message}
                </div>
                <div className="flex items-center gap-2">
                  {editTpl === tpl.id ? (
                    <>
                      <AdminButton variant="primary" size="sm" onClick={() => {
                        setDb(prev => ({ ...prev, whatsapp_templates: (prev.whatsapp_templates || []).map(t => t.id === tpl.id ? { ...t, message: editMsg } : t) }));
                        setEditTpl(null);
                      }}>Kaydet</AdminButton>
                      <AdminButton size="sm" onClick={() => setEditTpl(null)}>İptal</AdminButton>
                    </>
                  ) : (
                    <>
                      <AdminButton size="sm" onClick={() => { setEditTpl(tpl.id); setEditMsg(tpl.message); }}>
                        Düzenle
                      </AdminButton>
                      <AdminButton size="sm" onClick={() => navigator.clipboard.writeText(tpl.message)}>
                        Kopyala
                      </AdminButton>
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-4 p-4 rounded-xl"
        style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.15)' }}>
        <p className="text-xs" style={{ color: C.textDim }}>
          Değişkenler: {'{MUSTERI_ADI}'}, {'{PLAKA}'}, {'{TARIH}'}, {'{DURUM}'}, {'{FATURA_NO}'}, {'{TUTAR}'}, {'{PORTAL_LINK}'}
        </p>
      </div>
    </>
  );
}

function MessagesTab({ customer, db, setDb }) {
  const myMessages = (db.messages || []).filter(m => m.contact_id === customer.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const [msgText, setMsgText] = useState('');
  const [tplOpen, setTplOpen] = useState(false);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [myMessages.length]);
  const sendMessage = () => {
    const txt = msgText.trim();
    if (!txt) return;
    const msg = {
      id: 'msg' + uid(),
      contact_id: customer.id,
      contact_type: 'customer',
      sender: 'admin',
      text: txt,
      created_at: new Date().toISOString(),
    };
    setDb(prev => ({ ...prev, messages: [...(prev.messages || []), msg] }));
    setMsgText('');
  };
  const formatMsgTime = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + time;
  };
  return (
    <div className="flex flex-col h-full" style={{ minHeight: 400 }}>
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {myMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageIcon size={48} style={{ color: C.textDim, opacity: 0.3, marginBottom: 16 }} />
            <p className="text-sm font-medium" style={{ color: C.textDim }}>Henuz mesaj yok</p>
            <p className="text-xs mt-1" style={{ color: C.textDim, opacity: 0.6 }}>
              Bu kisiye ilk mesajinizi gonderin
            </p>
          </div>
        )}
        {myMessages.map((msg, idx) => {
          const isAdmin = msg.sender === 'admin';
          const prevMsg = myMessages[idx - 1];
          const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ background: `${C.border}`, color: C.textDim, fontSize: 10 }}>
                    {new Date(msg.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] group relative">
                  <div className="px-4 py-2.5 rounded-2xl text-sm"
                    style={{
                      background: isAdmin
                        ? `linear-gradient(135deg, ${C.neon2}, ${C.neon})`
                        : C.surface2,
                      color: isAdmin ? '#fff' : C.text,
                      borderBottomRightRadius: isAdmin ? 4 : 16,
                      borderBottomLeftRadius: isAdmin ? 16 : 4,
                      boxShadow: isAdmin ? `0 2px 12px ${C.neon}25` : `0 1px 4px rgba(0,0,0,0.2)`,
                      border: isAdmin ? 'none' : `1px solid ${C.border}`,
                    }}>
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5, fontSize: 13 }}>{msg.text}</p>
                  </div>
                  <p className={`text-xs mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}
                    style={{ color: C.textDim, fontSize: 10, opacity: 0.7 }}>
                    {isAdmin ? 'Sen' : customer.name?.split(' ')[0] || 'Musteri'} · {formatMsgTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="pt-3 mt-auto" style={{ borderTop: `1px solid ${C.border}` }}>
        {tplOpen && (
          <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <p className="text-xs font-semibold" style={{ color: '#25D366' }}>Hazır Mesaj Şablonları</p>
              </div>
              <button onClick={() => setTplOpen(false)} className="text-xs px-2 py-0.5 rounded" style={{ color: C.textDim, background: 'rgba(0,0,0,0.05)' }}>Kapat</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
              {(db.whatsapp_templates || []).map(tpl => (
                <button key={tpl.id} type="button" onClick={() => {
                  const filled = fillWhatsAppTemplate(tpl.message, buildCustomerTemplateContext(customer, db));
                  setMsgText(filled);
                  setTplOpen(false);
                }} className="text-left p-2.5 rounded-lg transition hover:opacity-90"
                  style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
                  <p className="text-xs font-medium mb-1" style={{ color: C.text }}>{tpl.name}</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: C.textDim, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tpl.message}</p>
                </button>
              ))}
              {(db.whatsapp_templates || []).length === 0 && (
                <p className="text-xs col-span-full text-center py-4" style={{ color: C.textDim }}>Tanımlı şablon yok.</p>
              )}
            </div>
          </div>
        )}
        {/* Belirgin aksiyon butonlari - input ustunde, her zaman gorunur */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={() => setTplOpen(o => !o)} type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:scale-[1.02]"
            style={{
              background: tplOpen ? `${C.neon}20` : "rgba(37,211,102,0.10)",
              color: tplOpen ? C.neon : "#25D366",
              border: `1px solid ${tplOpen ? `${C.neon}55` : "rgba(37,211,102,0.35)"}`,
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
            Şablon Seç
          </button>
          {customer.phone && customer.phone !== "—" && (
            <button onClick={() => {
              const phone = customer.phone.replace(/[^0-9+]/g, "").replace("+", "");
              const text = encodeURIComponent(msgText.trim() || `Merhaba ${customer.full_name || customer.company}, Gecit Kfz Sachverständiger olarak sizinle iletişime geçmek istiyoruz.`);
              window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
            }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:scale-[1.02]"
              style={{ background: "#25D366", color: "#fff", boxShadow: "0 2px 12px rgba(37,211,102,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp ile Aç
            </button>
          )}
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Mesajinizi yazin..."
            rows={1}
            className="flex-1 rounded-xl px-4 py-3 text-sm resize-none outline-none transition"
            style={{
              background: C.surface2,
              color: C.text,
              border: `1px solid ${C.border}`,
              maxHeight: 120,
              minHeight: 44,
            }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
          />
          <button
            onClick={sendMessage}
            disabled={!msgText.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: msgText.trim() ? `linear-gradient(135deg, ${C.neon2}, ${C.neon})` : C.surface2,
              color: msgText.trim() ? '#fff' : C.textDim,
              border: `1px solid ${msgText.trim() ? C.neon : C.border}`,
              cursor: msgText.trim() ? 'pointer' : 'default',
              boxShadow: msgText.trim() ? `0 2px 12px ${C.neon}30` : 'none',
              opacity: msgText.trim() ? 1 : 0.5,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-end mt-2">
          <p className="text-xs" style={{ color: C.textDim, opacity: 0.5 }}>
            Enter: gönder · Shift+Enter: yeni satır
          </p>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailDrawer({ customer, db, setDb, onClose, currentUser }) {
  const [tab, setTab] = useState('araclar');
  const [ruhsatOpen, setRuhsatOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [ruhsatPanelDoc, setRuhsatPanelDoc] = useState(null);
  const [previewAppraisal, setPreviewAppraisal] = useState(null);
  const [docFilter, setDocFilter] = useState('all');
  const fileInputRef = useRef(null);
  if (!customer) return null;
  const myVehicles = db.vehicles.filter(v => v.owner_id === customer.id);
  const myAppraisals = db.appraisals.filter(ap => myVehicles.some(v => v.id === ap.vehicle_id));
  const myInvoices = db.invoices.filter(i => i.customer_id === customer.id);
  const myDocs = (db.customer_documents || []).filter(d => d.customer_id === customer.id);
  const filteredDocs = docFilter === 'all' ? myDocs
    : docFilter.startsWith('group:') ? myDocs.filter(d => {
        const cat = DOC_CATEGORIES.find(c => c.key === d.type);
        return cat?.group === docFilter.slice(6);
      })
    : myDocs.filter(d => d.type === docFilter);

  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const [pendingFiles, setPendingFiles] = useState([]);

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingFiles(files);
    if (!uploadCategory) setUploadCategory(DOC_CATEGORIES[0].key);
    setUploadModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDropFiles = (files) => {
    if (files.length === 0) return;
    setPendingFiles(Array.from(files));
    if (!uploadCategory) setUploadCategory(DOC_CATEGORIES[0].key);
    setUploadModalOpen(true);
  };

  const confirmUpload = () => {
    if (!uploadCategory) return;
    const customerLabel = customer.full_name || customer.company || customer.email;
    pendingFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const doc = {
          id: 'cd' + uid(),
          customer_id: customer.id,
          vehicle_id: myVehicles[0]?.id || '',
          name: file.name,
          type: uploadCategory,
          size: file.size,
          data: reader.result,
          uploaded_at: new Date().toISOString().slice(0, 10),
          mime: file.type,
        };
        if (isRuhsatDoc(uploadCategory)) {
          doc.ruhsatData = parseRuhsatMock(file);
        }
        const catLabel = (DOC_CATEGORIES.find(c => c.key === uploadCategory)?.label) || uploadCategory;
        setDb(withLog(
          prev => ({ ...prev, customer_documents: [...(prev.customer_documents || []), doc] }),
          makeLogEntry({
            user: currentUser,
            action: 'doc_upload',
            target: { kind: 'customer', id: customer.id, label: customerLabel },
            details: `${file.name} (${catLabel}) → ${customerLabel}`,
            metadata: { doc_id: doc.id, category: uploadCategory, size: file.size },
          })
        ));
        if (isRuhsatDoc(uploadCategory)) {
          setRuhsatPanelDoc(doc);
        }
      };
      reader.readAsDataURL(file);
    });
    setPendingFiles([]);
    setUploadCategory('');
    setUploadModalOpen(false);
  };

  const deleteDoc = (docId) => {
    const doc = (db.customer_documents || []).find(d => d.id === docId);
    const customerLabel = customer.full_name || customer.company || customer.email;
    setDb(withLog(
      prev => ({ ...prev, customer_documents: (prev.customer_documents || []).filter(d => d.id !== docId) }),
      doc ? makeLogEntry({
        user: currentUser,
        action: 'doc_delete',
        target: { kind: 'customer', id: customer.id, label: customerLabel },
        details: `${doc.name} silindi (${customerLabel})`,
        metadata: { doc_id: docId, category: doc.type },
      }) : null
    ));
    if (previewDoc?.id === docId) setPreviewDoc(null);
  };

  const getDocTypeInfo = (type) => DOC_CATEGORIES.find(d => d.key === type) || { key: type, label: type, group: 'Genel', color: '#8B8B8B' };

  return (
    <AnimatePresence>
      <motion.aside key="cda"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 flex flex-col"
        style={{ zIndex: 71, width: '100vw', height: '100dvh',
          background: `linear-gradient(180deg, ${C.surface2} 0%, ${C.surface} 100%)` }}>
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase mb-2" style={{ color: C.neon, letterSpacing: '0.2em' }}>
              {customer.type === 'kurumsal' ? 'Kurumsal Firma' : 'Bireysel Müşteri'}
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold truncate" style={{ color: C.text, letterSpacing: '-0.01em' }}>
              {customer.type === 'kurumsal' ? customer.company : customer.full_name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs sm:text-sm" style={{ color: C.textDim }}>
              <span className="flex items-center gap-1.5 min-w-0"><MailIcon size={14} /> <span className="truncate">{customer.email}</span></span>
              <span className="flex items-center gap-1.5"><PhoneIcon size={14} /> {customer.phone}</span>
            </div>
            {/* Yetkili Avukat & Sigorta — header pills (visible across all tabs) */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {(() => {
                const assignment = (db.lawyer_assignments || []).find(a => a.customer_id === customer.id);
                const assignedLawyer = assignment ? (db.lawyers || []).find(l => l.id === assignment.lawyer_id) : null;
                const availableLawyers = (db.lawyers || []).filter(l => l.active);
                const customerLabel = customer.full_name || customer.company || customer.email;
                const onChange = (e) => {
                  const newVal = e.target.value;
                  const newLawyer = newVal ? (db.lawyers || []).find(l => l.id === newVal) : null;
                  const logEntry = newVal
                    ? makeLogEntry({
                        user: currentUser, action: 'lawyer_assign',
                        target: { kind: 'customer', id: customer.id, label: customerLabel },
                        details: `${newLawyer?.name || newVal} → ${customerLabel}`,
                        before: assignedLawyer?.name || null,
                        after: newLawyer?.name || null,
                      })
                    : assignedLawyer ? makeLogEntry({
                        user: currentUser, action: 'lawyer_unassign',
                        target: { kind: 'customer', id: customer.id, label: customerLabel },
                        details: `${assignedLawyer.name} ${customerLabel} müşterisinden kaldırıldı`,
                        before: assignedLawyer.name, after: null,
                      }) : null;
                  setDb(withLog(prev => {
                    const cleaned = (prev.lawyer_assignments || []).filter(a => a.customer_id !== customer.id);
                    if (!newVal) return { ...prev, lawyer_assignments: cleaned };
                    return {
                      ...prev,
                      lawyer_assignments: [...cleaned,
                        { id: 'la' + uid(), lawyer_id: newVal, customer_id: customer.id, assigned_at: new Date().toISOString().slice(0,10) }
                      ],
                    };
                  }, logEntry));
                };
                return (
                  <div className="inline-flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-full w-fit"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <ScaleIcon size={12} style={{ color: '#F59E0B' }} />
                    <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>
                      {assignedLawyer ? 'Yetkili Avukat:' : 'Avukat Ata:'}
                    </span>
                    <select value={assignedLawyer?.id || ''} onChange={onChange}
                      className="text-xs outline-none cursor-pointer pr-2"
                      style={{ background: 'transparent', color: assignedLawyer ? C.text : C.textDim, border: 'none' }}>
                      <option value="" style={{ background: C.surface, color: C.textDim }}>— Seçilmedi —</option>
                      {availableLawyers.map(l => (
                        <option key={l.id} value={l.id} style={{ background: C.surface, color: C.text }}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {(() => {
                const insAssignment = (db.insurance_assignments || []).find(a => a.customer_id === customer.id);
                const assignedInsurer = insAssignment ? (db.insurers || []).find(i => i.id === insAssignment.insurer_id) : null;
                const availableInsurers = (db.insurers || []).filter(i => i.active);
                const customerLabel = customer.full_name || customer.company || customer.email;
                const onChange = (e) => {
                  const newVal = e.target.value;
                  const newInsurer = newVal ? (db.insurers || []).find(i => i.id === newVal) : null;
                  const logEntry = newVal
                    ? makeLogEntry({
                        user: currentUser, action: 'insurance_assign',
                        target: { kind: 'customer', id: customer.id, label: customerLabel },
                        details: `${newInsurer?.company || newVal} → ${customerLabel}`,
                        before: assignedInsurer?.company || null,
                        after: newInsurer?.company || null,
                      })
                    : assignedInsurer ? makeLogEntry({
                        user: currentUser, action: 'insurance_unassign',
                        target: { kind: 'customer', id: customer.id, label: customerLabel },
                        details: `${assignedInsurer.company} ${customerLabel} müşterisinden kaldırıldı`,
                        before: assignedInsurer.company, after: null,
                      }) : null;
                  setDb(withLog(prev => {
                    const cleaned = (prev.insurance_assignments || []).filter(a => a.customer_id !== customer.id);
                    if (!newVal) return { ...prev, insurance_assignments: cleaned };
                    return {
                      ...prev,
                      insurance_assignments: [...cleaned,
                        { id: 'ia' + uid(), insurer_id: newVal, customer_id: customer.id, assigned_at: new Date().toISOString().slice(0,10) }
                      ],
                    };
                  }, logEntry));
                };
                return (
                  <div className="inline-flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-full w-fit"
                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.10)' }}>
                    <ShieldIcon size={12} style={{ color: C.cyan }} />
                    <span className="text-xs font-medium" style={{ color: C.cyan }}>
                      {assignedInsurer ? 'Yetkili Sigorta:' : 'Sigorta Ata:'}
                    </span>
                    <select value={assignedInsurer?.id || ''} onChange={onChange}
                      className="text-xs outline-none cursor-pointer pr-2"
                      style={{ background: 'transparent', color: assignedInsurer ? C.text : C.textDim, border: 'none' }}>
                      <option value="" style={{ background: C.surface, color: C.textDim }}>— Seçilmedi —</option>
                      {availableInsurers.map(i => (
                        <option key={i.id} value={i.id} style={{ background: C.surface, color: C.text }}>
                          {i.company}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>
          </div>
          {/* Ana sayfa / cikis butonu - mevcut adminin musteri listesine doner */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(227,6,19,0.07)', color: C.text,
                border: `1px solid ${C.neon}55` }}>
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
              Ana Sayfa
            </button>
            <button onClick={onClose} aria-label="Kapat"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition"
              style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
              <XClose size={16} />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="px-3 sm:px-6 flex gap-0.5 sm:gap-1 overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}`, scrollbarWidth: 'none' }}>
          {[
            { k: 'araclar', l: 'Araçlar', cnt: myVehicles.length, icon: CarIcon },
            { k: 'belgeler', l: 'Belgeler', cnt: myDocs.length, icon: FolderIcon },
            { k: 'ekspertiz', l: 'Ekspertiz', cnt: myAppraisals.length, icon: Wrench },
            { k: 'mesajlar', l: 'Mesajlar', cnt: (db.messages || []).filter(m => m.contact_id === customer.id).length, icon: MessageIcon },
            { k: 'faturalar', l: 'Faturalar', cnt: myInvoices.length, icon: Receipt },
            { k: 'bilgi', l: 'Bilgiler', cnt: null, icon: SettingsIcon },
          ].map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); if (t.k !== 'belgeler') setPreviewDoc(null); if (t.k !== 'ekspertiz') setPreviewAppraisal(null); }}
              className="px-2.5 sm:px-4 py-3 text-xs sm:text-sm transition-colors relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0"
              style={{ color: tab === t.k ? C.text : C.textDim }}>
              <t.icon size={14} />
              {t.l}
              {t.cnt !== null && <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: tab === t.k ? `${C.neon}20` : 'rgba(0,0,0,0.05)',
                  color: tab === t.k ? C.neon : C.textDim, fontSize: 11 }}>{t.cnt}</span>}
              {tab === t.k && <span className="absolute left-0 right-0 bottom-0 h-0.5" style={{ background: C.neon, boxShadow: `0 0 8px ${C.neon}` }} />}
            </button>
          ))}
        </div>
        {/* Content area — flex row when preview is open */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left panel — tabs content */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${previewDoc ? 'border-r' : ''}`}
            style={{ borderColor: C.border, minWidth: 0, paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {tab === 'araclar' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm" style={{ color: C.textDim }}>Kayıtlı araçlar</p>
                <AdminButton variant="primary" size="sm" onClick={() => setRuhsatOpen(true)}>
                  <PlusIcon size={14} /> Yeni Araç Ekle
                </AdminButton>
              </div>
              {myVehicles.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ border: `1px dashed ${C.border}` }}>
                  <CarIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                  <p style={{ color: C.textDim }} className="text-sm">Henüz araç eklenmemiş.</p>
                  <p style={{ color: C.textDim }} className="text-xs mt-1">"Yeni Araç Ekle" ile ruhsat fotoğrafından otomatik doldurabilirsin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myVehicles.map(v => {
                    const apr = myAppraisals.find(a => a.vehicle_id === v.id);
                    const stage = STAGES.find(s => s.key === (apr?.status || 'bekliyor'));
                    const vDocs = myDocs.filter(d => d.vehicle_id === v.id);
                    return (
                      <div key={v.id} className="rounded-2xl p-5" style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-mono text-lg tracking-wider" style={{ color: C.text }}>{v.plate}</p>
                            <p className="text-sm" style={{ color: C.textDim }}>{v.brand} {v.model} · {v.year}</p>
                            <p className="text-xs mt-1 font-mono" style={{ color: C.textDim }}>Şasi: {v.chassis}</p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full"
                            style={{ background: `${stage.color}20`, color: stage.color, border: `1px solid ${stage.color}44` }}>
                            {stage.label}
                          </span>
                        </div>
                        {vDocs.length > 0 && (
                          <div className="flex items-center gap-2 mt-3 mb-3">
                            <FolderIcon size={12} style={{ color: C.textDim }} />
                            <span className="text-xs" style={{ color: C.textDim }}>{vDocs.length} belge</span>
                            <button onClick={() => { setTab('belgeler'); }} className="text-xs underline" style={{ color: C.neon }}>Görüntüle</button>
                          </div>
                        )}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span style={{ color: C.textDim }}>Ekspertiz Süreci</span>
                            <span className="font-mono" style={{ color: stage.color }}>%{stage.pct}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }}
                              transition={{ duration: 1, ease: easeOut }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${C.neon}, ${stage.color})`, boxShadow: `0 0 12px ${stage.color}66` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── BELGELER TAB ── */}
          {tab === 'belgeler' && (
            <div>
              {/* Upload area */}
              <div className="rounded-2xl p-6 mb-5 text-center cursor-pointer transition-all hover:border-opacity-60"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = C.neon; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = C.border;
                  if (e.dataTransfer.files?.length) handleDropFiles(e.dataTransfer.files);
                }}
                style={{ border: `2px dashed ${C.border}`, background: 'rgba(227,6,19,0.02)',
                  borderRadius: 16 }}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'rgba(227,6,19,0.07)' }}>
                  <UploadIcon size={24} style={{ color: C.neon }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: C.text }}>Belge Yükle</p>
                <p className="text-xs" style={{ color: C.textDim }}>PDF, resim veya doküman sürükle veya tıkla</p>
                <p className="text-xs mt-1" style={{ color: C.textDim }}>Önce kategori seçeceksiniz</p>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden" onChange={handleFilePick} />
              </div>

              {/* Upload Category Modal */}
              <GecitKfzModal open={uploadModalOpen} onClose={() => { setUploadModalOpen(false); setPendingFiles([]); }} title="Kategori Seç & Yükle">
                {pendingFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(227,6,19,0.04)', border: `1px solid ${C.border}` }}>
                      <p className="text-xs mb-1" style={{ color: C.textDim }}>Seçilen dosya(lar):</p>
                      {pendingFiles.map((f, i) => (
                        <p key={i} className="text-sm font-mono truncate" style={{ color: C.text }}>{f.name}</p>
                      ))}
                    </div>
                    <Field label="Kategorie / Kategori *">
                      <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
                        <option value="">Kategori seçiniz...</option>
                        {DOC_GROUPS.map(group => (
                          <optgroup key={group} label={`── ${group} ──`}>
                            {DOC_CATEGORIES.filter(c => c.group === group).map(c => (
                              <option key={c.key} value={c.key}>{c.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </Field>
                    {uploadCategory && (
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: `${getDocTypeInfo(uploadCategory).color}10` }}>
                        <span className="w-3 h-3 rounded-full" style={{ background: getDocTypeInfo(uploadCategory).color }} />
                        <span className="text-xs font-medium" style={{ color: getDocTypeInfo(uploadCategory).color }}>
                          {getDocTypeInfo(uploadCategory).label}
                        </span>
                        <span className="text-xs" style={{ color: C.textDim }}>({getDocTypeInfo(uploadCategory).group})</span>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                      <AdminButton onClick={() => { setUploadModalOpen(false); setPendingFiles([]); }}>İptal</AdminButton>
                      <AdminButton variant="primary" onClick={confirmUpload}
                        style={{ opacity: uploadCategory ? 1 : 0.4 }}>
                        <UploadIcon size={14} /> Yükle ({pendingFiles.length} dosya)
                      </AdminButton>
                    </div>
                  </div>
                )}
              </GecitKfzModal>

              {/* Filter by group */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={() => setDocFilter('all')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: docFilter === 'all' ? `${C.neon}20` : 'rgba(0,0,0,0.04)',
                    color: docFilter === 'all' ? C.neon : C.textDim,
                    border: `1px solid ${docFilter === 'all' ? C.neon + '44' : C.border}`,
                  }}>Tümü ({myDocs.length})</button>
                {DOC_GROUPS.map(group => {
                  const cnt = myDocs.filter(d => {
                    const cat = DOC_CATEGORIES.find(c => c.key === d.type);
                    return cat?.group === group;
                  }).length;
                  if (cnt === 0) return null;
                  const groupColor = DOC_CATEGORIES.find(c => c.group === group)?.color || C.textDim;
                  return (
                    <button key={group} onClick={() => setDocFilter('group:' + group)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: docFilter === 'group:' + group ? `${groupColor}20` : 'rgba(0,0,0,0.04)',
                        color: docFilter === 'group:' + group ? groupColor : C.textDim,
                        border: `1px solid ${docFilter === 'group:' + group ? groupColor + '44' : C.border}`,
                      }}>{group} ({cnt})</button>
                  );
                })}
              </div>

              {/* Document list */}
              {filteredDocs.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ border: `1px dashed ${C.border}` }}>
                  <FolderIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                  <p style={{ color: C.textDim }} className="text-sm">Henüz belge yüklenmemiş.</p>
                  <p style={{ color: C.textDim }} className="text-xs mt-1">Yukarıdan PDF veya resim dosyası yükleyebilirsin.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocs.map(doc => {
                    const dtInfo = getDocTypeInfo(doc.type);
                    const veh = db.vehicles.find(v => v.id === doc.vehicle_id);
                    const isActive = previewDoc?.id === doc.id;
                    const isPdf = doc.mime === 'application/pdf' || doc.name.endsWith('.pdf');
                    const isImage = doc.mime?.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(doc.name);
                    return (
                      <motion.div key={doc.id}
                        whileHover={{ scale: 1.01 }}
                        className="rounded-xl p-4 cursor-pointer transition-all"
                        onClick={() => { isRuhsatDoc(doc.type) ? setRuhsatPanelDoc(doc) : setPreviewDoc(doc); }}
                        style={{
                          background: isActive ? `${C.neon}08` : 'rgba(0,0,0,0.03)',
                          border: `1px solid ${isActive ? C.neon + '44' : C.border}`,
                          boxShadow: isActive ? `0 0 20px ${C.neon}10` : 'none',
                        }}>
                        <div className="flex items-center gap-3">
                          {/* File icon */}
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${dtInfo.color}15` }}>
                            {isPdf ? (
                              <FileText size={18} style={{ color: dtInfo.color }} />
                            ) : isImage ? (
                              <ImageIcon size={18} style={{ color: dtInfo.color }} />
                            ) : (
                              <FileText size={18} style={{ color: dtInfo.color }} />
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: C.text }}>{doc.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: `${dtInfo.color}15`, color: dtInfo.color, fontSize: 10 }}>
                                {dtInfo.label}
                              </span>
                              {veh && <span className="text-xs font-mono" style={{ color: C.textDim }}>{veh.plate}</span>}
                              <span className="text-xs" style={{ color: C.textDim }}>{formatSize(doc.size)}</span>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {isRuhsatDoc(doc.type) && (
                              <button onClick={(e) => { e.stopPropagation(); setRuhsatPanelDoc(doc); }}
                                className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium hover:bg-black/5 transition"
                                title="Ruhsat Detayı"
                                style={{ color: C.cyan, border: `1px solid ${C.cyan}44`, background: `${C.cyan}10` }}>
                                <FileText size={12} /> Ruhsat
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                              title="Görüntüle" style={{ color: C.neon }}>
                              <EyeIcon size={15} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition"
                              title="Sil" style={{ color: '#EF4444' }}>
                              <TrashIcon size={15} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs mt-2" style={{ color: C.textDim }}>Yüklenme: {doc.uploaded_at}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'ekspertiz' && (
            <div className="space-y-4">
              {myAppraisals.length === 0 && <p className="text-sm" style={{ color: C.textDim }}>Ekspertiz kaydı yok.</p>}
              {myAppraisals.map(ap => (
                <AppraisalCard key={ap.id} ap={ap} customer={customer} db={db} setDb={setDb} currentUser={currentUser}
                  isPreviewing={previewAppraisal?.id === ap.id}
                  onPreview={() => {
                    try {
                      const v = db.vehicles.find(vh => vh.id === ap.vehicle_id);
                      const paintMap = (db.paint_maps || {})[v?.id] || {};
                      const result = generateGutachtenPDF({
                        vehicle: v, customer, appraisal: ap, paintData: paintMap, db,
                        output: 'dataurl',
                      });
                      if (result?.dataUrl) {
                        setPreviewAppraisal({ id: ap.id, dataUrl: result.dataUrl, filename: result.filename, vehicle: v, appraisal: ap });
                      }
                    } catch (err) {
                      console.error('PDF preview error:', err);
                      alert('PDF önizleme hatası: ' + err.message);
                    }
                  }} />
              ))}
            </div>
          )}
          {tab === 'mesajlar' && (
            <MessagesTab customer={customer} db={db} setDb={setDb} />
          )}
          {tab === 'faturalar' && (
            <div className="space-y-2">
              {myInvoices.length === 0 && <p className="text-sm" style={{ color: C.textDim }}>Fatura bulunmuyor.</p>}
              {[...myInvoices]
                .sort((a, b) => {
                  if (!!b.favorite !== !!a.favorite) return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
                  return new Date(b.date || 0) - new Date(a.date || 0);
                })
                .map(i => {
                const toggleFav = (e) => {
                  e.stopPropagation();
                  const next = !i.favorite;
                  setDb(withLog(
                    prev => ({ ...prev, invoices: (prev.invoices || []).map(x => x.id === i.id ? { ...x, favorite: next } : x) }),
                    makeLogEntry({
                      user: currentUser, action: 'invoice_status',
                      target: { kind: 'invoice', id: i.id, label: i.no },
                      details: `${i.no} ${next ? 'favorilere eklendi' : 'favorilerden çıkarıldı'} (${customer.full_name || customer.company || customer.email})`,
                      before: { favorite: !next }, after: { favorite: next },
                    })
                  ));
                };
                return (
                  <div key={i.id} className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl transition-all"
                    style={{
                      border: `1px solid ${i.favorite ? '#F59E0B66' : C.border}`,
                      background: i.favorite ? 'rgba(245,158,11,0.04)' : 'transparent',
                      boxShadow: i.favorite ? '0 0 0 1px rgba(245,158,11,0.15) inset' : 'none',
                    }}>
                    <button onClick={toggleFav}
                      title={i.favorite ? 'Favoriden çıkar' : 'Favorilere ekle'}
                      aria-pressed={!!i.favorite}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 hover:scale-110"
                      style={{
                        background: i.favorite ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.04)',
                        color: i.favorite ? '#F59E0B' : C.textDim,
                        border: `1px solid ${i.favorite ? '#F59E0B66' : C.border}`,
                      }}>
                      <StarIcon size={15} filled={!!i.favorite} />
                    </button>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
                      <Receipt size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate" style={{ color: C.text }}>{i.no}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>{i.date} · {i.status}</p>
                    </div>
                    <p className="font-mono whitespace-nowrap" style={{ color: C.text }}>₺{i.amount.toLocaleString('tr-TR')}</p>
                    <AdminButton size="sm"><DownloadIcon size={14} /> PDF</AdminButton>
                  </div>
                );
              })}
            </div>
          )}
          {tab === 'bilgi' && (
            <CustomerInfoAndNotes customer={customer} db={db} setDb={setDb} />
          )}
          </div>

          {/* ── Right panel: Appraisal PDF Preview ── */}
          {previewAppraisal && tab === 'ekspertiz' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '50%' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col overflow-hidden"
              style={{ background: C.bg, minWidth: 0 }}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.text }}>{previewAppraisal.filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 10 }}>
                      GUTACHTEN PDF
                    </span>
                    {previewAppraisal.vehicle && (
                      <span className="text-xs" style={{ color: C.textDim }}>
                        {previewAppraisal.vehicle.plate} · {previewAppraisal.vehicle.brand} {previewAppraisal.vehicle.model}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={previewAppraisal.dataUrl} download={previewAppraisal.filename}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                    style={{ color: C.neon }} title="İndir">
                    <DownloadIcon size={16} />
                  </a>
                  <button onClick={() => window.open(previewAppraisal.dataUrl, '_blank')}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                    style={{ color: C.textDim }} title="Yeni sekmede aç">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </button>
                  <button onClick={() => setPreviewAppraisal(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                    style={{ color: C.textDim }}><XClose size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <iframe src={previewAppraisal.dataUrl} title={previewAppraisal.filename}
                  className="w-full h-full" style={{ border: 'none', background: 'white' }} />
              </div>
            </motion.div>
          )}

          {/* ── Right panel: Document Preview ── */}
          {previewDoc && tab === 'belgeler' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '50%' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col overflow-hidden"
              style={{ background: C.bg, minWidth: 0 }}>
              {/* Preview header */}
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.text }}>{previewDoc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${getDocTypeInfo(previewDoc.type).color}15`,
                        color: getDocTypeInfo(previewDoc.type).color, fontSize: 10 }}>
                      {getDocTypeInfo(previewDoc.type).label}
                    </span>
                    <span className="text-xs" style={{ color: C.textDim }}>{formatSize(previewDoc.size)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Download button */}
                  {previewDoc.data && (
                    <a href={previewDoc.data} download={previewDoc.name}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                      style={{ color: C.neon }} title="İndir">
                      <DownloadIcon size={16} />
                    </a>
                  )}
                  {/* Change type */}
                  <div className="w-28">
                    <SelectInput value={previewDoc.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setDb(prev => ({
                          ...prev,
                          customer_documents: (prev.customer_documents || []).map(d =>
                            d.id === previewDoc.id ? { ...d, type: newType } : d
                          ),
                        }));
                        setPreviewDoc(prev => ({ ...prev, type: newType }));
                      }}
                      options={DOC_CATEGORIES.map(t => ({ value: t.key, label: t.label }))} />
                  </div>
                  <button onClick={() => setPreviewDoc(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                    style={{ color: C.textDim }}><XClose size={16} /></button>
                </div>
              </div>
              {/* Preview content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                {previewDoc.data ? (
                  (() => {
                    const isPdf = previewDoc.mime === 'application/pdf' || previewDoc.name.endsWith('.pdf');
                    const isImage = previewDoc.mime?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(previewDoc.name);
                    if (isPdf) {
                      return (
                        <iframe src={previewDoc.data} className="w-full h-full rounded-lg"
                          style={{ border: 'none', minHeight: 500, background: 'white' }} />
                      );
                    }
                    if (isImage) {
                      return (
                        <img src={previewDoc.data} alt={previewDoc.name}
                          className="max-w-full max-h-full object-contain rounded-lg"
                          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }} />
                      );
                    }
                    return (
                      <div className="text-center p-10">
                        <FileText size={48} style={{ color: C.textDim, margin: '0 auto 16px' }} />
                        <p className="text-sm" style={{ color: C.textDim }}>Bu dosya türü önizleme desteklemiyor.</p>
                        {previewDoc.data && (
                          <a href={previewDoc.data} download={previewDoc.name}
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm"
                            style={{ background: `${C.neon}20`, color: C.neon }}>
                            <DownloadIcon size={14} /> Dosyayı İndir
                          </a>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center p-10">
                    <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: 'rgba(227,6,19,0.07)' }}>
                      <FileText size={36} style={{ color: C.neon }} />
                    </div>
                    <p className="text-sm font-medium mb-2" style={{ color: C.text }}>{previewDoc.name}</p>
                    <p className="text-xs" style={{ color: C.textDim }}>Bu belge demo verisidir. Gerçek dosya yüklendiğinde burada görüntülenecek.</p>
                    <p className="text-xs mt-3" style={{ color: C.textDim }}>Boyut: {formatSize(previewDoc.size)}</p>
                  </div>
                )}
              </div>
              {/* Vehicle association */}
              <div className="p-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs whitespace-nowrap" style={{ color: C.textDim }}>Araç:</span>
                  <div className="flex-1">
                    <SelectInput value={previewDoc.vehicle_id || ''}
                      onChange={(e) => {
                        const newVid = e.target.value;
                        setDb(prev => ({
                          ...prev,
                          customer_documents: (prev.customer_documents || []).map(d =>
                            d.id === previewDoc.id ? { ...d, vehicle_id: newVid } : d
                          ),
                        }));
                        setPreviewDoc(prev => ({ ...prev, vehicle_id: newVid }));
                      }}
                      options={[
                        { value: '', label: 'Araç seçiniz...' },
                        ...myVehicles.map(v => ({ value: v.id, label: `${v.plate} — ${v.brand} ${v.model}` })),
                      ]} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>
      <RuhsatUploadModal open={ruhsatOpen} onClose={() => setRuhsatOpen(false)} customerId={customer.id}
        onSave={(vehicle) => setDb(db => ({
          ...db,
          vehicles: [...db.vehicles, vehicle],
          appraisals: [...db.appraisals, { id: 'ap' + uid(), vehicle_id: vehicle.id, status: 'bekliyor', notes: '', created_at: new Date().toISOString().slice(0,10) }]
        }))} />
      <RuhsatPanel doc={ruhsatPanelDoc} onClose={() => setRuhsatPanelDoc(null)} />
    </AnimatePresence>
  );
}

// ─── Ruhsat Upload Modal (AI OCR mock) ──────────
function RuhsatUploadModal({ open, onClose, customerId, onSave }) {
  const [stage, setStage] = useState('upload');
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({});
  const [history, setHistory] = useState(null);
  useEffect(() => { if (open) { setStage('upload'); setPreview(null); setForm({}); setHistory(null); } }, [open]);

  const onFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
    setStage('processing');
    setTimeout(() => {
      setForm({
        plate: '34 ' + ['ABC','DEF','XYZ'][Math.floor(Math.random()*3)] + ' ' + (Math.floor(Math.random()*900)+100),
        chassis: 'WDB' + Math.random().toString(36).slice(2,13).toUpperCase(),
        brand: ['Mercedes-Benz','BMW','Audi','Volkswagen'][Math.floor(Math.random()*4)],
        model: ['C 180','3.20i','A3','Passat'][Math.floor(Math.random()*4)],
        year: 2018 + Math.floor(Math.random()*7),
      });
      setHistory({
        tramer_total: Math.floor(Math.random()*45000),
        accidents: Math.floor(Math.random()*3),
        changed_parts: ['Sağ ön kapı','Arka tampon','Motor kaputu'].slice(0, Math.floor(Math.random()*3)),
        last_check: '2025-11-12',
      });
      setStage('result');
    }, 1800);
  };

  const save = () => {
    const v = { id: 'v' + uid(), owner_id: customerId, created_at: new Date().toISOString().slice(0,10),
      plate: form.plate, chassis: form.chassis, brand: form.brand, model: form.model, year: Number(form.year),
      tuv_date: form.tuv_date || '',
      history_report: history };
    onSave(v);
    onClose();
  };

  return (
    <GecitKfzModal open={open} onClose={onClose} title="Neues Fahrzeug hinzufügen" subtitle="Ruhsatı yükle, AI bilgileri otomatik doldursun" width={680}>
      {stage === 'upload' && (
        <div>
          <label className="block rounded-3xl p-10 text-center cursor-pointer transition-all hover:bg-black/[0.03]"
            style={{ border: `2px dashed ${C.border}` }}>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `linear-gradient(135deg, ${C.neon}20, ${C.magenta}20)`, color: C.neon, border: `1px solid ${C.neon}33` }}>
              <UploadIcon size={28} />
            </div>
            <p className="text-lg font-medium" style={{ color: C.text }}>Otomobil Ruhsatını Yükle</p>
            <p className="text-sm mt-2" style={{ color: C.textDim }}>Ruhsat fotoğrafı veya PDF'i sürükleyip bırakın ya da tıklayıp seçin.</p>
            <p className="text-xs mt-4" style={{ color: C.neon }}>● AI OCR otomatik çalışır — şasi, plaka, marka, model saniyeler içinde doldurulur</p>
          </label>
          <div className="mt-6 flex items-center gap-2 text-xs" style={{ color: C.textDim }}>
            <Sparkles size={12} style={{ color: C.neon }} />
            Google Cloud Vision / OpenAI Vision entegrasyonu Supabase Edge Function üzerinden tetiklenecek.
          </div>
        </div>
      )}
      {stage === 'processing' && (
        <div className="py-16 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto rounded-full mb-6"
            style={{ background: `conic-gradient(${C.neon}, ${C.magenta}, ${C.cyan}, ${C.neon})`,
              mask: 'radial-gradient(circle, transparent 55%, black 58%)',
              WebkitMask: 'radial-gradient(circle, transparent 55%, black 58%)',
              boxShadow: `0 0 40px ${C.glow}` }} />
          <p className="text-lg font-medium" style={{ color: C.text }}>Fahrzeugschein wird analysiert…</p>
          <p className="text-sm mt-2" style={{ color: C.textDim }}>AI OCR läuft · Fahrgestellnummer, Kennzeichen und Fahrzeugdaten werden ausgelesen</p>
          <div className="mt-4 inline-block text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(227,6,19,0.06)', color: C.neon, border: `1px solid ${C.neon}33`, letterSpacing: '0.15em' }}>● VISION API ACTIVE</div>
        </div>
      )}
      {stage === 'result' && (
        <div>
          <div className="flex items-center gap-2 text-sm mb-4 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399' }}>
            <Check size={16} /> Fahrzeugschein erfolgreich ausgelesen. Bitte die Felder prüfen und speichern.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Field label="Plaka" required><TextInput value={form.plate} onChange={(e) => setForm(f => ({ ...f, plate: e.target.value }))} /></Field>
            <Field label="Şasi No" required><TextInput value={form.chassis} onChange={(e) => setForm(f => ({ ...f, chassis: e.target.value }))} /></Field>
            <Field label="Marka" required><TextInput value={form.brand} onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))} /></Field>
            <Field label="Model" required><TextInput value={form.model} onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))} /></Field>
            <Field label="Model Yılı" required><TextInput value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} /></Field>
            <Field label="TÜV Tarihi (HU)"><TextInput type="date" value={form.tuv_date || ''} onChange={(e) => setForm(f => ({ ...f, tuv_date: e.target.value }))} /></Field>
          </div>
          {history && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(227,6,19,0.03)', border: '1px solid rgba(0,0,0,0.10)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} style={{ color: C.cyan }} />
                <p className="text-sm font-medium" style={{ color: C.text }}>Fahrzeughistorie (Tramer)</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs uppercase mb-1" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Tramer Gesamt</p><p className="font-mono" style={{ color: C.text }}>€{history.tramer_total.toLocaleString('de-DE')}</p></div>
                <div><p className="text-xs uppercase mb-1" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Unfälle</p><p className="font-mono" style={{ color: C.text }}>{history.accidents}</p></div>
                <div className="col-span-2"><p className="text-xs uppercase mb-1" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Geänderte Teile</p><p style={{ color: C.text }}>{history.changed_parts.length ? history.changed_parts.join(', ') : 'Keine festgestellt'}</p></div>
              </div>
            </div>
          )}
          <div className="flex justify-between pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <AdminButton onClick={() => setStage('upload')}>Neu laden</AdminButton>
            <AdminButton variant="primary" onClick={save}><Check size={14} /> Speichern</AdminButton>
          </div>
        </div>
      )}
    </GecitKfzModal>
  );
}

// ─── Appointments Admin view ────────────────────
function AdminAppointments({ db, setDb }) {
  const statuses = ['bekliyor','onaylandi','iptal','tamamlandi'];
  return (
    <>
      <AdminTopbar title="Terminplaner" subtitle="Alle Termine sind mit Google Kalender synchronisiert" />
      <GlassCard padding="p-0">
        <div className="grid gap-0 text-xs uppercase px-6 py-3"
          style={{ gridTemplateColumns: '160px 2fr 1.5fr 160px 140px',
            color: C.textDim, letterSpacing: '0.2em', borderBottom: `1px solid ${C.border}` }}>
          <div>Datum / Uhrzeit</div><div>Kunde</div><div>Leistung</div><div>Status</div><div>Notiz</div>
        </div>
        {db.appointments.length === 0 && <div className="py-10 text-center text-sm" style={{ color: C.textDim }}>Keine Termine.</div>}
        {db.appointments.map(a => {
          const c = db.customers.find(x => x.id === a.customer_id);
          return (
            <div key={a.id} className="grid gap-0 items-center px-6 py-4 text-sm"
              style={{ gridTemplateColumns: '160px 2fr 1.5fr 160px 140px', borderBottom: `1px solid ${C.border}`, color: C.text }}>
              <div>
                <p>{a.date}</p>
                <p className="font-mono text-xs" style={{ color: C.textDim }}>{a.time}</p>
              </div>
              <div>
                <p>{c?.type === 'kurumsal' ? c.company : c?.full_name || a.full_name || '—'}</p>
                <p className="text-xs" style={{ color: C.textDim }}>{c?.phone || a.phone}</p>
              </div>
              <div style={{ color: C.textDim }}>{a.service}</div>
              <div>
                <SelectInput value={a.status}
                  onChange={(e) => setDb(db => ({ ...db, appointments: db.appointments.map(x => x.id === a.id ? { ...x, status: e.target.value } : x) }))}
                  options={statuses.map(s => ({ value: s, label: s }))} />
              </div>
              <div style={{ color: C.textDim }} className="text-xs truncate">{a.notes || '—'}</div>
            </div>
          );
        })}
      </GlassCard>
    </>
  );
}

// ─── Admin Settings ─────────────────────────────
function AdminSettings({ user, db, setDb }) {
  const perms = db?.lawyer_permissions || {};
  const togglePerm = (key) => {
    setDb(prev => ({
      ...prev,
      lawyer_permissions: { ...(prev.lawyer_permissions || {}), [key]: !perms[key] },
    }));
  };
  const insPerms = db?.insurance_permissions || {};
  const toggleInsPerm = (key) => {
    setDb(prev => ({
      ...prev,
      insurance_permissions: { ...(prev.insurance_permissions || {}), [key]: !insPerms[key] },
    }));
  };

  const PERM_ITEMS = [
    { key: 'can_view_documents', label: 'Belgeleri Görüntüleme', desc: 'Avukat, müşteriye ait yüklenmiş belgeleri görebilir', icon: FolderIcon },
    { key: 'can_view_notes', label: 'Özel Notları Görüntüleme', desc: 'Avukat, müşteriye yazılmış özel notları okuyabilir', icon: MessageIcon },
    { key: 'can_view_invoices', label: 'Faturaları Görüntüleme', desc: 'Avukat, müşteriye ait faturaları görebilir', icon: Receipt },
    { key: 'can_view_vehicles', label: 'Araç Bilgilerini Görüntüleme', desc: 'Avukat, müşterinin araç detaylarını görebilir', icon: CarIcon },
    { key: 'can_view_appraisals', label: 'Ekspertiz Bilgilerini Görüntüleme', desc: 'Avukat, ekspertiz durum ve detaylarını görebilir', icon: FileText },
    { key: 'can_view_contact_info', label: 'İletişim Bilgilerini Görüntüleme', desc: 'Avukat, müşterinin telefon ve e-posta bilgisini görebilir', icon: PhoneIcon },
  ];

  const INS_PERM_ITEMS = [
    { key: 'can_view_documents', label: 'Belgeleri Görüntüleme', desc: 'Sigorta şirketi, atandığı müşterilerin belgelerini görebilir', icon: FolderIcon },
    { key: 'can_upload_documents', label: 'Belge Yükleme', desc: 'Sigorta şirketi, dosyaya evrak (poliçe, teklif, red yazısı) yükleyebilir', icon: UploadIcon },
    { key: 'can_view_notes', label: 'Özel Notları Görüntüleme', desc: 'Sigorta şirketi, müşteriye yazılmış özel notları okuyabilir', icon: MessageIcon },
    { key: 'can_view_invoices', label: 'Faturaları Görüntüleme', desc: 'Sigorta şirketi, müşteriye ait faturaları görebilir', icon: Receipt },
    { key: 'can_view_vehicles', label: 'Araç Bilgilerini Görüntüleme', desc: 'Sigorta şirketi, müşterinin araç detaylarını görebilir', icon: CarIcon },
    { key: 'can_view_appraisals', label: 'Ekspertiz Bilgilerini Görüntüleme', desc: 'Sigorta şirketi, ekspertiz durum ve detaylarını görebilir', icon: FileText },
    { key: 'can_view_contact_info', label: 'İletişim Bilgilerini Görüntüleme', desc: 'Sigorta şirketi, müşterinin telefon ve e-posta bilgisini görebilir', icon: PhoneIcon },
  ];

  return (
    <>
      <AdminTopbar title="Einstellungen" subtitle="Konto-, Integrations- und Berechtigungseinstellungen" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4" style={{ color: C.text }}>Kontoinformationen</h3>
          <div className="space-y-4">
            <Field label="Vor- & Nachname"><TextInput value={user?.name || ''} onChange={() => {}} /></Field>
            <Field label="E-Mail"><TextInput value={user?.email || ''} onChange={() => {}} /></Field>
            <Field label="Rolle"><TextInput value={user?.role === 'super_admin' ? 'Super Admin' : 'Admin'} onChange={() => {}} /></Field>
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4" style={{ color: C.text }}>Integrationen</h3>
          {<Iife>{() => {
            const [sbOpen, setSbOpen] = React.useState(false);
            const [sbUrl, setSbUrl] = React.useState(SUPABASE_CONFIG.url);
            const [sbKey, setSbKey] = React.useState(SUPABASE_CONFIG.anonKey);
            const [testStatus, setTestStatus] = React.useState(null);
            const currentMode = GECIT_KFZ_MODE;
            const isLive = DataService.isLive();

            const testConnection = async () => {
              setTestStatus('testing');
              try {
                if (false) { setTestStatus('no_lib'); return; }
                const client = createClient(sbUrl, sbKey);
                const { data, error } = await client.from('customers').select('id').limit(1);
                if (error) { setTestStatus('error'); console.error('[Gecit-KFZ Test]', error); }
                else { setTestStatus('success'); }
              } catch (e) { setTestStatus('error'); console.error(e); }
            };

            const activateLive = () => {
              localStorage.setItem('gecit_kfz_mode', 'live');
              localStorage.setItem('gecit_kfz_supabase_url', sbUrl);
              localStorage.setItem('gecit_kfz_supabase_key', sbKey);
              window.location.reload();
            };

            const switchToLocal = () => {
              localStorage.setItem('gecit_kfz_mode', 'local');
              window.location.reload();
            };

            return (
              <div className="space-y-3">
                {/* Supabase — interactive config */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isLive ? '#34D39944' : C.border}` }}>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/[0.03] transition"
                    onClick={() => setSbOpen(!sbOpen)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: isLive ? 'rgba(52,211,153,0.1)' : 'rgba(227,6,19,0.07)' }}>
                        <Zap size={16} style={{ color: isLive ? '#34D399' : C.neon }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.text }}>Supabase Database</p>
                        <p className="text-xs" style={{ color: isLive ? '#34D399' : C.textDim }}>
                          ● {isLive ? 'LIVE — Realtime aktiv' : `Demo-Modus — localStorage (${currentMode})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-bold"
                        style={{ background: isLive ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                          color: isLive ? '#34D399' : '#F59E0B', letterSpacing: '0.1em' }}>
                        {isLive ? 'LIVE' : 'LOCAL'}
                      </span>
                      <ChevronRight size={14} style={{ color: C.textDim, transform: sbOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                  {sbOpen && (
                    <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${C.border}`, background: C.surface2 }}>
                      <Field label="Supabase Project URL">
                        <TextInput value={sbUrl} onChange={e => setSbUrl(e.target.value)} placeholder="https://abc123.supabase.co" />
                      </Field>
                      <Field label="Anon Key (public)">
                        <TextInput value={sbKey} onChange={e => setSbKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." />
                      </Field>
                      <div className="flex items-center gap-2 flex-wrap">
                        <AdminButton size="sm" onClick={testConnection}>
                          <Zap size={12} /> Bağlantı Test Et
                        </AdminButton>
                        {!isLive && testStatus === 'success' && (
                          <AdminButton size="sm" variant="primary" onClick={activateLive}>
                            Canlıya Geç (LIVE)
                          </AdminButton>
                        )}
                        {isLive && (
                          <AdminButton size="sm" onClick={switchToLocal}>
                            Local Mode'a Dön
                          </AdminButton>
                        )}
                      </div>
                      {testStatus && (
                        <div className="text-xs p-2 rounded-lg" style={{
                          background: testStatus === 'success' ? 'rgba(52,211,153,0.06)' : testStatus === 'testing' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                          color: testStatus === 'success' ? '#34D399' : testStatus === 'testing' ? '#F59E0B' : '#EF4444',
                          border: `1px solid ${testStatus === 'success' ? '#34D39933' : testStatus === 'testing' ? '#F59E0B33' : '#EF444433'}`
                        }}>
                          {testStatus === 'testing' && '⏳ Test ediliyor...'}
                          {testStatus === 'success' && '✓ Bağlantı başarılı! Canlıya geçebilirsiniz.'}
                          {testStatus === 'error' && '✕ Bağlantı başarısız. URL ve Key kontrol edin.'}
                          {testStatus === 'no_lib' && '✕ Supabase kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.'}
                        </div>
                      )}
                      <div className="text-[10px] p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', color: C.textDim, border: `1px solid ${C.border}` }}>
                        Canlıya geçtiğinizde: Tüm veriler Supabase'den okunur, yazılır ve realtime güncellenir. localStorage yedek olarak devam eder.
                      </div>
                    </div>
                  )}
                </div>

                {/* Other integrations */}
                {[
                  { name: 'WhatsApp Business API', status: isLive ? 'wa.me deep link' : 'wa.me deep link (demo)', active: true },
                  { name: 'Google Vision OCR', status: 'Demo Mode — simülasyon', active: false },
                  { name: 'Tramer / Araç Geçmişi API', status: 'Demo Mode — mock', active: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ border: `1px solid ${C.border}` }}>
                    <div>
                      <p className="text-sm" style={{ color: C.text }}>{s.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: s.active ? '#34D399' : C.textDim }}>● {s.status}</p>
                    </div>
                    <AdminButton size="sm">{s.active ? 'Yönet' : 'Bağla'}</AdminButton>
                  </div>
                ))}
              </div>
            );
          }}</Iife>}
        </GlassCard>
      </div>

      {/* Lawyer Permissions */}
      <div className="mt-6">
        <GlassCard>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <ScaleIcon size={20} style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: C.text }}>Avukat Yetkilendirme</h3>
              <p className="text-xs" style={{ color: C.textDim }}>Avukatların müşteri portalında hangi bilgilere erişebileceğini kontrol edin</p>
            </div>
          </div>
          <div className="space-y-3">
            {PERM_ITEMS.map(p => (
              <div key={p.key} className="flex items-center justify-between p-4 rounded-xl transition-all"
                style={{ background: perms[p.key] ? 'rgba(52,211,153,0.04)' : 'rgba(239,68,68,0.04)',
                  border: `1px solid ${perms[p.key] ? '#34D39930' : '#EF444430'}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: perms[p.key] ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)' }}>
                    <p.icon size={16} style={{ color: perms[p.key] ? '#34D399' : '#EF4444' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.text }}>{p.label}</p>
                    <p className="text-xs" style={{ color: C.textDim }}>{p.desc}</p>
                  </div>
                </div>
                <button onClick={() => togglePerm(p.key)}
                  className="relative w-12 h-7 rounded-full transition-all flex-shrink-0"
                  style={{ background: perms[p.key] ? '#34D399' : 'rgba(255,255,255,0.1)',
                    boxShadow: perms[p.key] ? '0 0 12px rgba(52,211,153,0.3)' : 'none' }}>
                  <span className="absolute top-1 w-5 h-5 rounded-full transition-all"
                    style={{ background: 'white', left: perms[p.key] ? 24 : 4,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Insurance Permissions */}
      <div className="mt-6">
        <GlassCard>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <ShieldIcon size={20} style={{ color: C.cyan }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: C.text }}>Sigorta Şirketi Yetkilendirme</h3>
              <p className="text-xs" style={{ color: C.textDim }}>Yetkilendirilen sigorta şirketleri yalnızca atandıkları müşterilerin dosyalarını görebilir. Hangi bilgilere erişebileceklerini buradan kontrol edin.</p>
            </div>
          </div>
          <div className="space-y-3">
            {INS_PERM_ITEMS.map(p => (
              <div key={p.key} className="flex items-center justify-between p-4 rounded-xl transition-all"
                style={{ background: insPerms[p.key] ? 'rgba(52,211,153,0.04)' : 'rgba(239,68,68,0.04)',
                  border: `1px solid ${insPerms[p.key] ? '#34D39930' : '#EF444430'}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: insPerms[p.key] ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)' }}>
                    <p.icon size={16} style={{ color: insPerms[p.key] ? '#34D399' : '#EF4444' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.text }}>{p.label}</p>
                    <p className="text-xs" style={{ color: C.textDim }}>{p.desc}</p>
                  </div>
                </div>
                <button onClick={() => toggleInsPerm(p.key)}
                  className="relative w-12 h-7 rounded-full transition-all flex-shrink-0"
                  style={{ background: insPerms[p.key] ? '#34D399' : 'rgba(255,255,255,0.1)',
                    boxShadow: insPerms[p.key] ? '0 0 12px rgba(52,211,153,0.3)' : 'none' }}>
                  <span className="absolute top-1 w-5 h-5 rounded-full transition-all"
                    style={{ background: 'white', left: insPerms[p.key] ? 24 : 4,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

// ─── TÜF Takip (Hauptuntersuchung Tracking) ───────────
function tuvDaysUntil(tuvDate) {
  if (!tuvDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const t = new Date(tuvDate); t.setHours(0,0,0,0);
  return Math.round((t - today) / (1000 * 60 * 60 * 24));
}

function tuvStatusInfo(days, C) {
  if (days === null || days === undefined) return { label: 'Bilinmiyor', color: C.textDim, bg: 'rgba(139,133,168,0.1)' };
  if (days < 0) return { label: 'Süresi Doldu', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
  if (days <= 30) return { label: 'Acil (30 gün)', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  if (days <= 60) return { label: 'Yaklaşıyor (60 gün)', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' };
  return { label: 'Geçerli', color: '#34D399', bg: 'rgba(52,211,153,0.1)' };
}

function fillTuvTemplate(tpl, ctx) {
  return (tpl || '')
    .replace(/\{MUSTERI_ADI\}/g, ctx.musteri || '')
    .replace(/\{PLAKA\}/g, ctx.plaka || '')
    .replace(/\{MARKA_MODEL\}/g, ctx.markaModel || '')
    .replace(/\{TUF_TARIHI\}/g, ctx.tuvDate || '')
    .replace(/\{KALAN_GUN\}/g, ctx.daysAbs != null ? String(ctx.daysAbs) : '');
}

function generateTuvNotificationPDF({ vehicle, customer, message }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setFontSize(18);
  doc.text('Gecit Kfz Sachverstaendiger', 20, 22);
  doc.setFontSize(11);
  doc.text('TUV / HU Bilgilendirme Yazisi', 20, 30);
  doc.setDrawColor(180);
  doc.line(20, 34, 190, 34);

  doc.setFontSize(10);
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 44);
  doc.text(`Sayin: ${customer?.full_name || customer?.company || '-'}`, 20, 51);
  doc.text(`Plaka: ${vehicle?.plate || '-'}`, 20, 58);
  doc.text(`Arac: ${vehicle?.brand || ''} ${vehicle?.model || ''} (${vehicle?.year || '-'})`, 20, 65);
  doc.text(`Sasi: ${vehicle?.chassis || '-'}`, 20, 72);
  doc.text(`TUV Tarihi: ${vehicle?.tuv_date || '-'}`, 20, 79);
  doc.line(20, 84, 190, 84);

  doc.setFontSize(11);
  const cleanMsg = (message || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u').replace(/[şŞ]/g, 's').replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c');
  const lines = doc.splitTextToSize(cleanMsg, 170);
  doc.text(lines, 20, 94);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('Gecit Kfz Sachverstaendiger - Alle Rechte vorbehalten', 20, 285);
  doc.save(`TUV_Bildirim_${(vehicle?.plate || 'arac').replace(/\s+/g, '_')}.pdf`);
}

function TuvNotifyModal({ open, onClose, vehicle, customer, db }) {
  const tuvTemplates = (db.whatsapp_templates || []).filter(t => (t.trigger || '').startsWith('tuv_'));
  const days = tuvDaysUntil(vehicle?.tuv_date);
  const defaultTplId = days == null ? '' : days < 0 ? 'wt_tuv_gecmis' : days <= 30 ? 'wt_tuv30' : 'wt_tuv60';
  const [tplId, setTplId] = useState(defaultTplId);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    const tpl = tuvTemplates.find(t => t.id === tplId) || tuvTemplates[0];
    if (!tpl) { setMessage(''); return; }
    const ctx = {
      musteri: customer?.full_name || customer?.company || '',
      plaka: vehicle?.plate || '',
      markaModel: `${vehicle?.brand || ''} ${vehicle?.model || ''}`.trim(),
      tuvDate: vehicle?.tuv_date ? new Date(vehicle.tuv_date).toLocaleDateString('tr-TR') : '',
      daysAbs: days != null ? Math.abs(days) : null,
    };
    setMessage(fillTuvTemplate(tpl.message, ctx));
  }, [open, tplId, vehicle?.id]);

  const sendWhatsApp = () => {
    if (!customer?.phone) { alert('Müşterinin telefon numarası tanımlı değil.'); return; }
    const phone = customer.phone.replace(/[^0-9+]/g, '').replace('+', '');
    if (!phone) { alert('Geçerli bir telefon numarası bulunamadı.'); return; }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const downloadPDF = () => {
    try {
      generateTuvNotificationPDF({ vehicle, customer, message });
    } catch (err) {
      console.error('TÜV PDF error:', err);
      alert('PDF oluşturulurken hata: ' + err.message);
    }
  };

  return (
    <GecitKfzModal open={open} onClose={onClose} title="TÜV Bilgilendirme Mesajı"
      subtitle={vehicle ? `${vehicle.plate} · ${vehicle.brand} ${vehicle.model}` : ''} width={680}>
      <div className="space-y-4">
        <Field label="Şablon">
          <select value={tplId} onChange={(e) => setTplId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
            {tuvTemplates.length === 0 && <option value="">Şablon tanımlı değil</option>}
            {tuvTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Mesaj (düzenleyebilirsin)">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y"
            style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}`, fontFamily: 'inherit', lineHeight: 1.5, minHeight: 200 }} />
        </Field>
        <div className="text-xs p-3 rounded-xl" style={{ background: 'rgba(227,6,19,0.04)', border: `1px solid ${C.border}`, color: C.textDim }}>
          <strong style={{ color: C.text }}>Alıcı:</strong> {customer?.full_name || customer?.company || '—'}
          {customer?.phone ? ` · ${customer.phone}` : ' · (telefon yok)'}
        </div>
        <div className="flex justify-between gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <AdminButton onClick={onClose}>Kapat</AdminButton>
          <div className="flex gap-2">
            <AdminButton onClick={downloadPDF}><DownloadIcon size={14} /> PDF İndir</AdminButton>
            <AdminButton variant="primary" onClick={sendWhatsApp} disabled={!customer?.phone}>
              <MessageIcon size={14} /> WhatsApp Gönder
            </AdminButton>
          </div>
        </div>
      </div>
    </GecitKfzModal>
  );
}

// ─── Bulk TÜV mail/PDF modal ───
function BulkTuvActionsModal({ open, onClose, vehicles, db }) {
  const [tplId, setTplId] = useState('auto');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const tuvTemplates = (db.whatsapp_templates || []).filter(t => (t.trigger || '').startsWith('tuv_'));

  const buildItem = (v) => {
    const owner = (db.customers || []).find(c => c.id === v.owner_id);
    const days = tuvDaysUntil(v.tuv_date);
    const autoTplId = days == null ? '' : days < 0 ? 'wt_tuv_gecmis' : days <= 30 ? 'wt_tuv30' : 'wt_tuv60';
    const useTplId = tplId === 'auto' ? autoTplId : tplId;
    const tpl = tuvTemplates.find(t => t.id === useTplId) || tuvTemplates[0];
    const ctx = {
      musteri: owner?.full_name || owner?.company || '',
      plaka: v.plate || '',
      markaModel: `${v.brand || ''} ${v.model || ''}`.trim(),
      tuvDate: v.tuv_date ? new Date(v.tuv_date).toLocaleDateString('tr-TR') : '',
      daysAbs: days != null ? Math.abs(days) : null,
    };
    const message = tpl ? fillTuvTemplate(tpl.message, ctx) : '';
    const subject = `TÜV Hatırlatması — ${v.plate || ''} (${ctx.tuvDate})`;
    return { v, owner, days, message, subject, tplName: tpl?.name };
  };

  const items = vehicles.map(buildItem);
  const withEmail = items.filter(it => it.owner?.email);
  const withPhone = items.filter(it => it.owner?.phone);

  const generateAllPDFs = async () => {
    setRunning(true); setProgress(0);
    for (let i = 0; i < items.length; i++) {
      const { v, owner, message } = items[i];
      try { generateTuvNotificationPDF({ vehicle: v, customer: owner, message }); }
      catch (e) { console.error('Bulk PDF error:', e); }
      setProgress(i + 1);
      await new Promise(r => setTimeout(r, 300)); // tarayıcının ardışık download'ı algılaması için
    }
    setRunning(false);
  };

  const openAllMails = () => {
    if (!withEmail.length) { alert('E-posta adresi olan müşteri yok.'); return; }
    const ok = window.confirm(`${withEmail.length} adet e-posta penceresi açılacak. Pop-up engelleyiciyi kapattığından emin ol. Devam edilsin mi?`);
    if (!ok) return;
    withEmail.forEach((it, idx) => {
      setTimeout(() => {
        const url = `mailto:${it.owner.email}?subject=${encodeURIComponent(it.subject)}&body=${encodeURIComponent(it.message)}`;
        window.open(url, '_blank');
      }, idx * 250);
    });
  };

  const openAllWhatsApp = () => {
    if (!withPhone.length) { alert('Telefon numarası olan müşteri yok.'); return; }
    const ok = window.confirm(`${withPhone.length} adet WhatsApp sekmesi açılacak. Devam edilsin mi?`);
    if (!ok) return;
    withPhone.forEach((it, idx) => {
      setTimeout(() => {
        const phone = it.owner.phone.replace(/[^0-9+]/g, '').replace('+', '');
        if (!phone) return;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(it.message)}`;
        window.open(url, '_blank');
      }, idx * 250);
    });
  };

  return (
    <GecitKfzModal open={open} onClose={onClose} title="Toplu TÜV Bildirimi"
      subtitle={`${vehicles.length} araç seçildi`} width={760}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Toplam', value: items.length, color: C.neon },
            { label: 'E-postalı', value: withEmail.length, color: '#34D399' },
            { label: 'Telefonlu', value: withPhone.length, color: C.cyan },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-3"
              style={{ background: `${s.color}10`, border: `1px solid ${s.color}30` }}>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>{s.label}</p>
              <p className="text-2xl font-bold font-mono mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <Field label="Şablon">
          <select value={tplId} onChange={(e) => setTplId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
            <option value="auto">Otomatik (her aracın TÜV durumuna göre)</option>
            {tuvTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>

        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}`, maxHeight: 240, overflowY: 'auto' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.04)' }}>
              <tr>
                <th className="text-left px-3 py-2" style={{ color: C.textDim }}>Plaka</th>
                <th className="text-left px-3 py-2" style={{ color: C.textDim }}>Sahip</th>
                <th className="text-left px-3 py-2" style={{ color: C.textDim }}>E-posta</th>
                <th className="text-left px-3 py-2" style={{ color: C.textDim }}>Telefon</th>
                <th className="text-left px-3 py-2" style={{ color: C.textDim }}>Şablon</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.v.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-3 py-2 font-mono" style={{ color: C.text }}>{it.v.plate}</td>
                  <td className="px-3 py-2" style={{ color: C.text }}>{it.owner?.full_name || it.owner?.company || '—'}</td>
                  <td className="px-3 py-2" style={{ color: it.owner?.email ? '#34D399' : '#EF4444' }}>
                    {it.owner?.email || 'YOK'}
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: it.owner?.phone ? C.cyan : '#EF4444' }}>
                    {it.owner?.phone || 'YOK'}
                  </td>
                  <td className="px-3 py-2" style={{ color: C.textDim }}>{it.tplName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {running && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(227,6,19,0.05)', border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: C.text }}>PDF üretiliyor...</span>
              <span style={{ color: C.neon }}>{progress} / {items.length}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <div className="h-full transition-all" style={{
                width: `${(progress / Math.max(items.length, 1)) * 100}%`,
                background: `linear-gradient(90deg, ${C.neon}, ${C.cyan})`
              }} />
            </div>
          </div>
        )}

        <div className="text-[11px] p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
          <strong>Not:</strong> Mail ve WhatsApp toplu açma için tarayıcının pop-up engelleyicisi devre dışı olmalı. Mail varsayılan e-posta uygulamanı (Outlook, Mail vs.) açar.
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <AdminButton onClick={onClose}>Kapat</AdminButton>
          <div className="flex flex-wrap gap-2">
            <AdminButton onClick={generateAllPDFs} disabled={running || items.length === 0}>
              <DownloadIcon size={14} /> Tüm PDF'leri İndir ({items.length})
            </AdminButton>
            <AdminButton onClick={openAllWhatsApp} disabled={running || withPhone.length === 0}>
              <MessageIcon size={14} /> WhatsApp ({withPhone.length})
            </AdminButton>
            <AdminButton variant="primary" onClick={openAllMails} disabled={running || withEmail.length === 0}>
              <MailIcon size={14} /> Toplu Mail ({withEmail.length})
            </AdminButton>
          </div>
        </div>
      </div>
    </GecitKfzModal>
  );
}

function AdminTuvTracking({ db, setDb }) {
  const [mode, setMode] = useState('tuv'); // 'tuv' | 'insurance'
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editVehicle, setEditVehicle] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [notifyVehicle, setNotifyVehicle] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState('all'); // 'all' veya 0-11

  const dateField = mode === 'tuv' ? 'tuv_date' : 'insurance_date';
  const modeLabel = mode === 'tuv' ? 'TÜV (Hauptuntersuchung)' : 'Sigorta';
  const modeShort = mode === 'tuv' ? 'TÜV' : 'Sigorta';

  const rows = (db.vehicles || []).map(v => {
    const owner = (db.customers || []).find(c => c.id === v.owner_id);
    const dval = v[dateField];
    const days = tuvDaysUntil(dval);
    const dt = dval ? new Date(dval) : null;
    // Find assigned insurer for this vehicle's owner (if any)
    const insAssign = (db.insurance_assignments || []).find(a => a.customer_id === v.owner_id);
    const insurer = insAssign ? (db.insurers || []).find(i => i.id === insAssign.insurer_id) : null;
    return { v, owner, days, year: dt?.getFullYear(), month: dt?.getMonth(), insurer };
  });

  // Yıl çevresindeki tüm yıllar (tarihsel verisi olanlar) — yıl seçici dropdown için
  const allYears = Array.from(new Set(rows.map(r => r.year).filter(Boolean))).sort();
  if (!allYears.includes(today.getFullYear())) allYears.push(today.getFullYear());
  if (!allYears.includes(today.getFullYear() + 1)) allYears.push(today.getFullYear() + 1);
  allYears.sort();

  // Yıla göre ay sayımları (12 ay)
  const monthCounts = Array.from({ length: 12 }, () => 0);
  rows.forEach(r => {
    if (r.year === year && r.month != null) monthCounts[r.month]++;
  });
  const yearTotal = monthCounts.reduce((a, b) => a + b, 0);

  const filtered = rows.filter(({ v, owner, days, year: ry, month: rm, insurer }) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${v.plate} ${v.brand} ${v.model} ${owner?.full_name || owner?.company || ''} ${insurer?.company || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const dv = v[dateField];
    if (filter !== 'unset') {
      if (dv) {
        if (ry !== year) return false;
        if (month !== 'all' && rm !== month) return false;
      } else if (filter !== 'all') {
        return false;
      } else if (year !== today.getFullYear() || month !== 'all') {
        return false;
      }
    }
    if (filter === 'all') return true;
    if (filter === 'unset') return dv == null || dv === '';
    if (days == null) return false;
    if (filter === 'expired') return days < 0;
    if (filter === '30') return days >= 0 && days <= 30;
    if (filter === '60') return days >= 0 && days <= 60;
    if (filter === 'ok') return days > 60;
    return true;
  }).sort((a, b) => {
    const aD = a.days == null ? 99999 : a.days;
    const bD = b.days == null ? 99999 : b.days;
    return aD - bD;
  });

  const counts = {
    all: rows.length,
    expired: rows.filter(r => r.days != null && r.days < 0).length,
    '30': rows.filter(r => r.days != null && r.days >= 0 && r.days <= 30).length,
    '60': rows.filter(r => r.days != null && r.days >= 0 && r.days <= 60).length,
    ok: rows.filter(r => r.days != null && r.days > 60).length,
    unset: rows.filter(r => !r.v[dateField]).length,
  };

  const saveEditDate = () => {
    if (!editVehicle) return;
    setDb(prev => ({
      ...prev,
      vehicles: (prev.vehicles || []).map(x => x.id === editVehicle.id ? { ...x, [dateField]: editDate || '' } : x),
    }));
    setEditVehicle(null);
    setEditDate('');
  };

  const filterChips = [
    { key: 'all',     label: 'Tümü',           color: C.text },
    { key: 'expired', label: 'Süresi Dolmuş',  color: '#EF4444' },
    { key: '30',      label: '≤ 30 gün',       color: '#F59E0B' },
    { key: '60',      label: '≤ 60 gün',       color: '#FBBF24' },
    { key: 'ok',      label: 'Geçerli',        color: '#34D399' },
    { key: 'unset',   label: 'Tarih Girilmemiş', color: C.textDim },
  ];

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const monthShort = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
  const monthIntensity = (count) => {
    if (count === 0) return { bg: 'rgba(0,0,0,0.03)', border: C.border, color: C.textDim };
    if (count <= 2) return { bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)', color: '#34D399' };
    if (count <= 5) return { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)', color: '#FBBF24' };
    if (count <= 10) return { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', color: '#F59E0B' };
    return { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', color: '#EF4444' };
  };
  const isCurrentMonth = (m) => year === today.getFullYear() && m === today.getMonth();

  return (
    <>
      <AdminTopbar
        title={mode === 'tuv' ? 'TÜF Takip' : 'Sigorta Takip'}
        subtitle={mode === 'tuv' ? 'Hauptuntersuchung tarihleri ve otomatik bilgilendirme' : 'Sigorta poliçe son tarihleri ve otomatik bilgilendirme'}
        action={
          <AdminButton variant="primary" onClick={() => setBulkOpen(true)} disabled={filtered.filter(r => r.v[dateField]).length === 0}>
            <MailIcon size={14} /> Toplu Bildirim ({filtered.filter(r => r.v[dateField]).length})
          </AdminButton>
        } />

      {/* Mode toggle: TÜV / Sigorta */}
      <div className="mb-5 inline-flex rounded-full p-1" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
        {[
          { k: 'tuv',       l: 'TÜV (Hauptuntersuchung)', icon: Shield,     color: C.neon },
          { k: 'insurance', l: 'Sigorta',                  icon: ShieldIcon, color: '#B0050F' },
        ].map(t => {
          const active = mode === t.k;
          return (
            <button key={t.k} type="button" onClick={() => { setMode(t.k); setFilter('all'); setMonth('all'); }}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: active ? `linear-gradient(135deg, ${t.color}, ${t.color}cc)` : 'transparent',
                color: active ? '#FFFFFF' : C.textDim,
              }}>
              <t.icon size={14} />
              {t.l}
            </button>
          );
        })}
      </div>

      {/* Year Selector + Month Strip */}
      <div className="rounded-2xl mb-5 overflow-hidden"
        style={{ background: `linear-gradient(135deg, rgba(227,6,19,0.05), rgba(227,6,19,0.03))`,
          border: `1px solid ${C.border}` }}>
        {/* Year header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${C.neon}15`, border: `1px solid ${C.neon}30` }}>
              <Shield size={16} style={{ color: C.neon }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Takvim Görünümü</p>
              <p className="text-sm font-semibold" style={{ color: C.text }}>
                {year} yılı için <span style={{ color: C.neon }}>{yearTotal}</span> {modeShort} tarihi planlandı
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setYear(y => y - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-black/5"
              style={{ color: C.textDim, border: `1px solid ${C.border}` }}>‹</button>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-1.5 rounded-lg text-sm font-mono font-bold outline-none cursor-pointer"
              style={{ background: `rgba(227,6,19,0.07)`, color: C.text, border: `1px solid ${C.neon}40` }}>
              {allYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => setYear(y => y + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-black/5"
              style={{ color: C.textDim, border: `1px solid ${C.border}` }}>›</button>
            <button onClick={() => { setYear(today.getFullYear()); setMonth('all'); }}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs transition hover:bg-black/5"
              style={{ color: C.cyan, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.10)' }}>
              Bugün
            </button>
          </div>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 p-4">
          <button onClick={() => setMonth('all')}
            className="flex flex-col items-center justify-center py-3 rounded-xl transition-all"
            style={{
              background: month === 'all' ? `linear-gradient(135deg, ${C.neon}, ${C.magenta})` : 'rgba(0,0,0,0.03)',
              border: `1px solid ${month === 'all' ? 'transparent' : C.border}`,
              color: month === 'all' ? '#FFFFFF' : C.text,
              fontWeight: month === 'all' ? 600 : 400,
            }}>
            <span className="text-[9px] uppercase tracking-widest" style={{ opacity: 0.7 }}>Tümü</span>
            <span className="text-lg font-mono font-bold mt-0.5">{yearTotal}</span>
          </button>
          {monthNames.map((m, i) => {
            const count = monthCounts[i];
            const intensity = monthIntensity(count);
            const active = month === i;
            const current = isCurrentMonth(i);
            return (
              <button key={i} onClick={() => setMonth(month === i ? 'all' : i)}
                className="relative flex flex-col items-center justify-center py-3 rounded-xl transition-all"
                style={{
                  background: active ? `linear-gradient(135deg, ${intensity.color}, ${intensity.color}cc)` : intensity.bg,
                  border: `1px solid ${active ? 'transparent' : intensity.border}`,
                  color: active ? '#FFFFFF' : intensity.color,
                  transform: active ? 'translateY(-2px)' : 'none',
                  boxShadow: active ? `0 8px 20px ${intensity.color}44` : 'none',
                }}>
                {current && !active && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: C.neon, boxShadow: `0 0 8px ${C.neon}` }} />
                )}
                <span className="text-[10px] uppercase tracking-widest font-medium" style={{ opacity: active ? 0.7 : 1 }}>
                  <span className="lg:hidden">{monthShort[i]}</span>
                  <span className="hidden lg:inline">{m.slice(0, 3)}</span>
                </span>
                <span className="text-xl font-mono font-bold mt-0.5" style={{ color: active ? '#FFFFFF' : (count > 0 ? intensity.color : C.text) }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-3 text-[10px]"
          style={{ borderTop: `1px solid ${C.border}`, color: C.textDim }}>
          <div className="flex items-center gap-3">
            <span className="uppercase tracking-widest">Yoğunluk:</span>
            {[
              { l: '0', c: { bg: 'rgba(0,0,0,0.03)', color: C.textDim, border: C.border } },
              { l: '1-2', c: monthIntensity(1) },
              { l: '3-5', c: monthIntensity(3) },
              { l: '6-10', c: monthIntensity(6) },
              { l: '10+', c: monthIntensity(11) },
            ].map((x, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                style={{ background: x.c.bg, border: `1px solid ${x.c.border}`, color: x.c.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: x.c.color }} /> {x.l}
              </span>
            ))}
          </div>
          {month !== 'all' && (
            <span style={{ color: C.neon }}>
              Filtre aktif: <strong>{monthNames[month]} {year}</strong> · {monthCounts[month]} araç
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        {filterChips.map(c => {
          const active = filter === c.key;
          return (
            <button key={c.key} onClick={() => setFilter(c.key)}
              className="px-3 py-3 rounded-xl text-left transition-all"
              style={{
                background: active ? `${c.color}15` : 'rgba(0,0,0,0.03)',
                border: `1px solid ${active ? c.color : C.border}`,
                color: active ? c.color : C.textDim,
              }}>
              <p className="text-[10px] uppercase tracking-wider">{c.label}</p>
              <p className="font-mono text-2xl mt-1" style={{ color: active ? c.color : C.text }}>{counts[c.key]}</p>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Plaka, marka veya müşteri ara..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }} />
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider" style={{ color: C.textDim }}>Plaka</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider" style={{ color: C.textDim }}>Araç</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider" style={{ color: C.textDim }}>Sahip</th>
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider" style={{ color: C.textDim }}>{mode === 'tuv' ? 'TÜV Tarihi' : 'Sigorta Bitiş'}</th>
                {mode === 'insurance' && <th className="text-left py-3 px-2 text-xs uppercase tracking-wider" style={{ color: C.textDim }}>Sigorta Şirketi</th>}
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider" style={{ color: C.textDim }}>Durum</th>
                <th className="text-right py-3 px-2 text-xs uppercase tracking-wider" style={{ color: C.textDim }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ v, owner, days, insurer }) => {
                const status = tuvStatusInfo(days, C);
                const dval = v[dateField];
                return (
                  <tr key={v.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-3 px-2 font-mono" style={{ color: C.text }}>{v.plate}</td>
                    <td className="py-3 px-2" style={{ color: C.text }}>
                      <p className="text-sm">{v.brand} {v.model}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>{v.year}</p>
                    </td>
                    <td className="py-3 px-2" style={{ color: C.text }}>
                      <p className="text-sm">{owner?.full_name || owner?.company || '—'}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>{owner?.phone || ''}</p>
                    </td>
                    <td className="py-3 px-2 font-mono" style={{ color: C.text }}>
                      {dval ? new Date(dval).toLocaleDateString('tr-TR') : <span style={{ color: C.textDim }}>—</span>}
                      {days != null && (
                        <p className="text-[10px] mt-1" style={{ color: status.color }}>
                          {days < 0 ? `${Math.abs(days)} gün geçti` : days === 0 ? 'Bugün' : `${days} gün kaldı`}
                        </p>
                      )}
                    </td>
                    {mode === 'insurance' && (
                      <td className="py-3 px-2" style={{ color: C.text }}>
                        {insurer ? (
                          <div className="flex items-center gap-2">
                            <ShieldIcon size={12} style={{ color: '#B0050F' }} />
                            <span className="text-xs">{insurer.company}</span>
                          </div>
                        ) : <span className="text-xs" style={{ color: C.textDim }}>Atanmamış</span>}
                      </td>
                    )}
                    <td className="py-3 px-2">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="inline-flex gap-2">
                        <AdminButton size="sm" onClick={() => { setEditVehicle(v); setEditDate(dval || ''); }}>
                          <EditIcon size={12} /> Tarih
                        </AdminButton>
                        <AdminButton size="sm" variant="primary" onClick={() => setNotifyVehicle(v)} disabled={!dval}>
                          <MessageIcon size={12} /> Bildir
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={mode === 'insurance' ? 7 : 6} className="py-12 text-center text-sm" style={{ color: C.textDim }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Edit date modal */}
      <GecitKfzModal open={!!editVehicle} onClose={() => setEditVehicle(null)}
        title={`${modeShort} Tarihi Güncelle`}
        subtitle={editVehicle ? `${editVehicle.plate} · ${editVehicle.brand} ${editVehicle.model}` : ''}
        width={420}>
        <div className="space-y-4">
          <Field label={`${modeLabel} Tarihi`}>
            <TextInput type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <AdminButton onClick={() => setEditVehicle(null)}>İptal</AdminButton>
            <AdminButton variant="primary" onClick={saveEditDate}><Check size={14} /> Kaydet</AdminButton>
          </div>
        </div>
      </GecitKfzModal>

      <TuvNotifyModal
        open={!!notifyVehicle}
        onClose={() => setNotifyVehicle(null)}
        vehicle={notifyVehicle}
        customer={notifyVehicle ? (db.customers || []).find(c => c.id === notifyVehicle.owner_id) : null}
        db={db}
      />

      <BulkTuvActionsModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        vehicles={filtered.filter(r => r.v[dateField]).map(r => r.v)}
        db={db}
      />
    </>
  );
}

// ─── Live Dashboard (Canlı İş Takibi) ───────────
function AdminLiveDashboard({ db, setDb }) {
  const [feedModal, setFeedModal] = useState(false);
  const [feedForm, setFeedForm] = useState({ type: 'gelen', text: '', status: 'bekliyor' });
  const todayIso = new Date().toISOString().slice(0, 10);

  const feed = (db.live_feed || []).sort((a, b) => b.time.localeCompare(a.time));
  const todayFeed = feed.filter(f => f.date === todayIso);
  const gelen = todayFeed.filter(f => f.type === 'gelen').length;
  const giden = todayFeed.filter(f => f.type === 'giden').length;
  const tamamlanan = todayFeed.filter(f => f.status === 'bitti').length;
  const bekleyen = todayFeed.filter(f => f.status === 'bekliyor' || f.status === 'islemde').length;

  const feedColors = { gelen: C.cyan, giden: C.magenta, tamamlandi: '#34D399' };
  const statusColors = { bekliyor: '#8B8B8B', islemde: C.neon, bitti: '#34D399' };
  const statusLabels = { bekliyor: 'Wartend', islemde: 'In Bearbeitung', bitti: 'Abgeschlossen' };

  const addFeed = (e) => {
    e.preventDefault();
    const now = new Date();
    const entry = {
      id: 'lf' + uid(), type: feedForm.type, text: feedForm.text,
      time: now.toTimeString().slice(0, 5), date: todayIso, status: feedForm.status,
    };
    setDb(db => ({ ...db, live_feed: [...(db.live_feed || []), entry] }));
    setFeedForm({ type: 'gelen', text: '', status: 'bekliyor' });
    setFeedModal(false);
  };

  const updateFeedStatus = (feedId, newStatus) => {
    setDb(db => ({ ...db, live_feed: (db.live_feed || []).map(f => f.id === feedId ? { ...f, status: newStatus } : f) }));
  };

  return (
    <>
      <AdminTopbar title="Live-Dashboard" subtitle="Eingang · Ausgang · Erledigt · Wartend — Echtzeit-Tracking"
        action={<AdminButton variant="primary" onClick={() => setFeedModal(true)}><PlusIcon size={14} /> Neuer Eintrag</AdminButton>} />

      {/* Live Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Eingang Fahrzeug', value: gelen, icon: ArrowRight, color: C.cyan, rotate: '0deg' },
          { label: 'Ausgang Fahrzeug', value: giden, icon: ArrowRight, color: C.magenta, rotate: '180deg' },
          { label: 'Abgeschlossen', value: tamamlanan, icon: Check, color: '#34D399', rotate: '0deg' },
          { label: 'Wartend', value: bekleyen, icon: ClockIcon, color: '#F59E0B', rotate: '0deg' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}>
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}33` }}>
                  <s.icon size={20} style={{ transform: `rotate(${s.rotate})` }} />
                </div>
                <div>
                  <p className="text-3xl font-bold font-mono" style={{ color: C.text }}>{s.value}</p>
                  <p className="text-xs uppercase" style={{ color: C.textDim, letterSpacing: '0.15em' }}>{s.label}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Live Feed */}
      <GlassCard>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34D399', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />
            <h3 className="text-lg font-semibold" style={{ color: C.text }}>Heutiger Verlauf</h3>
            <span className="text-xs" style={{ color: C.textDim }}>{todayFeed.length} Einträge</span>
          </div>
        </div>

        {todayFeed.length === 0 ? (
          <div className="py-16 text-center">
            <ActivityIcon size={48} style={{ color: C.textDim, margin: '0 auto 16px' }} />
            <p style={{ color: C.textDim }}>Heute gibt es noch keine Einträge.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayFeed.map((f, idx) => (
              <motion.div key={f.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-black/[0.05]"
                style={{ border: `1px solid ${C.border}` }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${feedColors[f.type] || C.neon}15`, color: feedColors[f.type] || C.neon }}>
                  {f.type === 'gelen' ? <ArrowRight size={16} /> :
                   f.type === 'giden' ? <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> :
                   <Check size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: C.text }}>{f.text}</p>
                  <p className="text-xs mt-1 font-mono" style={{ color: C.textDim }}>{f.time}</p>
                </div>
                <div className="flex-shrink-0 w-36">
                  <SelectInput value={f.status}
                    onChange={(e) => updateFeedStatus(f.id, e.target.value)}
                    options={[
                      { value: 'bekliyor', label: '○ Wartend' },
                      { value: 'islemde', label: '◐ In Bearbeitung' },
                      { value: 'bitti', label: '● Abgeschlossen' },
                    ]} />
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: statusColors[f.status], boxShadow: `0 0 8px ${statusColors[f.status]}66` }} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Older Feed */}
        {feed.filter(f => f.date !== todayIso).length > 0 && (
          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Frühere Einträge</p>
            <div className="space-y-1.5">
              {feed.filter(f => f.date !== todayIso).slice(0, 10).map(f => (
                <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg text-xs" style={{ color: C.textDim }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[f.status] }} />
                  <span className="flex-1 truncate">{f.text}</span>
                  <span className="font-mono flex-shrink-0">{f.date} {f.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Add Feed Modal */}
      <GecitKfzModal open={feedModal} onClose={() => setFeedModal(false)} title="Yeni İş Kaydı" subtitle="Gelen/giden araç veya iş durumu ekle">
        <form onSubmit={addFeed} className="space-y-4">
          <Field label="Tür" required>
            <div className="flex gap-2">
              {[{ k: 'gelen', l: 'Gelen Araç', c: C.cyan }, { k: 'giden', l: 'Giden Araç', c: C.magenta }, { k: 'tamamlandi', l: 'İş Tamamlandı', c: '#34D399' }].map(t => (
                <button key={t.k} type="button" onClick={() => setFeedForm(f => ({ ...f, type: t.k }))}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium transition-all text-center"
                  style={{
                    background: feedForm.type === t.k ? `${t.c}15` : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${feedForm.type === t.k ? t.c : C.border}`,
                    color: feedForm.type === t.k ? t.c : C.textDim,
                  }}>{t.l}</button>
              ))}
            </div>
          </Field>
          <Field label="Açıklama" required>
            <TextInput value={feedForm.text} onChange={(e) => setFeedForm(f => ({ ...f, text: e.target.value }))} required
              placeholder="Örn: Ali Veli — Mercedes C180 kabul edildi" />
          </Field>
          <Field label="Durum">
            <SelectInput value={feedForm.status}
              onChange={(e) => setFeedForm(f => ({ ...f, status: e.target.value }))}
              options={[{ value: 'bekliyor', label: 'Bekliyor' }, { value: 'islemde', label: 'İşlemde' }, { value: 'bitti', label: 'Tamamlandı' }]} />
          </Field>
          <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <AdminButton onClick={() => setFeedModal(false)}>İptal</AdminButton>
            <AdminButton type="submit" variant="primary"><Check size={14} /> Ekle</AdminButton>
          </div>
        </form>
      </GecitKfzModal>
    </>
  );
}

// ─── Reminders & Push Notifications ─────────────
// ─── Admin Gallery ─────────────────────────────
function AdminGallery({ db, setDb }) {
  const [photos, setPhotos] = useState(db.gallery || []);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const fileRef = useRef(null);

  useEffect(() => { setPhotos(db.gallery || []); }, [db.gallery]);

  const uid = () => Math.random().toString(36).slice(2, 10);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const photo = {
          id: 'ph' + uid(),
          name: file.name,
          data: reader.result,
          size: file.size,
          mime: file.type,
          note: '',
          tags: [],
          uploaded_at: new Date().toISOString(),
          date: new Date().toISOString().slice(0, 10),
        };
        setDb(prev => ({ ...prev, gallery: [...(prev.gallery || []), photo] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const deletePhoto = (id) => {
    setDb(prev => ({ ...prev, gallery: (prev.gallery || []).filter(p => p.id !== id) }));
    if (viewPhoto?.id === id) setViewPhoto(null);
  };

  const updateNote = (id, note) => {
    setDb(prev => ({
      ...prev,
      gallery: (prev.gallery || []).map(p => p.id === id ? { ...p, note } : p),
    }));
  };

  // Group by year / month / date
  const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const years = [...new Set(photos.map(p => p.date?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const months = [...new Set(
    photos
      .filter(p => selectedYear === 'all' || p.date?.startsWith(selectedYear + '-'))
      .map(p => p.date?.slice(0, 7))
      .filter(Boolean)
  )].sort().reverse();
  const dates = [...new Set(
    photos
      .filter(p => selectedYear === 'all' || p.date?.startsWith(selectedYear + '-'))
      .filter(p => selectedMonth === 'all' || p.date?.startsWith(selectedMonth + '-'))
      .map(p => p.date)
      .filter(Boolean)
  )].sort().reverse();
  const filtered = photos
    .filter(p => selectedYear === 'all' || p.date?.startsWith(selectedYear + '-'))
    .filter(p => selectedMonth === 'all' || p.date?.startsWith(selectedMonth + '-'))
    .filter(p => selectedDate === 'all' || p.date === selectedDate)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.note || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));

  const formatDate = (d) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (d === today) return 'Bugün';
    if (d === yesterday) return 'Dün';
    return new Date(d + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatMonth = (ym) => {
    const [y, m] = ym.split('-');
    return `${TR_MONTHS[parseInt(m, 10) - 1]} ${y}`;
  };

  const onYearChange = (val) => {
    setSelectedYear(val);
    setSelectedMonth('all');
    setSelectedDate('all');
  };
  const onMonthChange = (val) => {
    setSelectedMonth(val);
    if (val !== 'all') setSelectedYear(val.slice(0, 4));
    setSelectedDate('all');
  };
  const onDateChange = (val) => {
    setSelectedDate(val);
    if (val !== 'all') {
      setSelectedYear(val.slice(0, 4));
      setSelectedMonth(val.slice(0, 7));
    }
  };
  const clearDateFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDate('all');
  };
  const hasDateFilter = selectedYear !== 'all' || selectedMonth !== 'all' || selectedDate !== 'all';

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div>
      <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={handleUpload} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: C.text }}>
            <CameraIcon size={24} style={{ color: C.neon }} /> Galeri
          </h1>
          <p className="text-sm mt-1" style={{ color: C.textDim }}>
            Gün içi çekimler ve fotoğraflar — {photos.length} fotoğraf
          </p>
        </div>
        <AdminButton icon={CameraIcon} onClick={() => fileRef.current?.click()}>
          Fotoğraf Yükle
        </AdminButton>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <TextInput placeholder="Fotoğraf ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <button onClick={() => setViewMode('grid')} className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: viewMode === 'grid' ? `${C.neon}20` : 'transparent', color: viewMode === 'grid' ? C.neon : C.textDim, border: viewMode === 'grid' ? `1px solid ${C.neon}40` : '1px solid transparent' }}>
            <GridIcon size={16} />
          </button>
          <button onClick={() => setViewMode('list')} className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: viewMode === 'list' ? `${C.neon}20` : 'transparent', color: viewMode === 'list' ? C.neon : C.textDim, border: viewMode === 'list' ? `1px solid ${C.neon}40` : '1px solid transparent' }}>
            ☰
          </button>
        </div>
        <select value={selectedYear} onChange={e => onYearChange(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          title="Yıl">
          <option value="all">Tüm Yıllar</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selectedMonth} onChange={e => onMonthChange(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          title="Ay"
          disabled={months.length === 0}>
          <option value="all">Tüm Aylar</option>
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <select value={selectedDate} onChange={e => onDateChange(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          title="Gün"
          disabled={dates.length === 0}>
          <option value="all">Tüm Günler</option>
          {dates.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
        </select>
        {hasDateFilter && (
          <button onClick={clearDateFilters}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: `${C.neon}15`, border: `1px solid ${C.neon}40`, color: C.neon }}
            title="Tarih filtrelerini temizle">
            Temizle
          </button>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <CameraIcon size={48} style={{ color: C.textDim, margin: '0 auto 16px' }} />
          <p className="text-lg font-medium mb-2" style={{ color: C.text }}>Henüz fotoğraf yok</p>
          <p className="text-sm mb-6" style={{ color: C.textDim }}>Gün içi çekimlerinizi buraya yükleyin</p>
          <AdminButton icon={CameraIcon} onClick={() => fileRef.current?.click()}>İlk Fotoğrafı Yükle</AdminButton>
        </div>
      )}

      {/* Grid view */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(photo => (
            <motion.div key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-square"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
              onClick={() => setViewPhoto(photo)}>
              <img src={photo.data} alt={photo.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs font-medium truncate" style={{ color: '#fff' }}>{photo.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatDate(photo.date)} · {formatSize(photo.size)}</p>
              </div>
              {photo.note && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${C.neon}30`, backdropFilter: 'blur(4px)' }}>
                    <MessageIcon size={10} style={{ color: C.neon }} />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filtered.map(photo => (
            <motion.div key={photo.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:scale-[1.01] transition-all"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
              onClick={() => setViewPhoto(photo)}>
              <img src={photo.data} alt={photo.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: C.text }}>{photo.name}</p>
                {photo.note && <p className="text-xs truncate mt-0.5" style={{ color: C.textDim }}>{photo.note}</p>}
                <p className="text-[11px] mt-1" style={{ color: C.textDim }}>{formatDate(photo.date)} · {formatSize(photo.size)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#EF4444' }}>
                <TrashIcon size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Photo viewer modal */}
      <AnimatePresence>
        {viewPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setViewPhoto(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row rounded-3xl overflow-hidden"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
              onClick={e => e.stopPropagation()}>
              {/* Image */}
              <div className="flex-1 min-w-0 flex items-center justify-center bg-black/50 p-4" style={{ minHeight: 300 }}>
                <img src={viewPhoto.data} alt={viewPhoto.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              </div>
              {/* Info panel */}
              <div className="w-full md:w-72 flex-shrink-0 p-6 space-y-4 overflow-y-auto" style={{ borderLeft: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold truncate" style={{ color: C.text }}>{viewPhoto.name}</h3>
                  <button onClick={() => setViewPhoto(null)} className="p-1 rounded-lg" style={{ color: C.textDim }}>✕</button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: C.textDim }}>Tarih</span><span style={{ color: C.text }}>{formatDate(viewPhoto.date)}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textDim }}>Boyut</span><span style={{ color: C.text }}>{formatSize(viewPhoto.size)}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textDim }}>Tür</span><span style={{ color: C.text }}>{viewPhoto.mime}</span></div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: C.textDim }}>Not</label>
                  <textarea
                    value={viewPhoto.note || ''}
                    onChange={e => {
                      const note = e.target.value;
                      setViewPhoto(prev => ({ ...prev, note }));
                      updateNote(viewPhoto.id, note);
                    }}
                    rows={3} placeholder="Bu fotoğraf hakkında not..."
                    className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
                    style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
                </div>
                <div className="flex gap-2 pt-2">
                  <a href={viewPhoto.data} download={viewPhoto.name}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: `${C.neon}15`, border: `1px solid ${C.neon}40`, color: C.neon }}>
                    <DownloadIcon size={14} /> İndir
                  </a>
                  <button onClick={() => deletePhoto(viewPhoto.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                    <TrashIcon size={14} /> Sil
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminReminders({ db, setDb }) {
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', due_date: '', due_time: '', repeat: 'none', customer_id: '', vehicle_id: '' });
  const [pushPermission, setPushPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');

  // Request push notification permission
  const requestPush = async () => {
    if (!('Notification' in window)) { alert('Bu tarayıcı bildirimleri desteklemiyor.'); return; }
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      // Use Service Worker for notification (better mobile support)
      const reg = window.__swRegistration;
      if (reg) {
        reg.showNotification('Gecit Kfz Sachverständiger Bildirimleri Aktif', {
          body: 'Hatırlatmalar artık telefonunuza bildirim olarak gelecek.',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="80">🚗</text></svg>',
          badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="%237C3AED"/><text x="48" y="58" text-anchor="middle" font-size="50" font-weight="bold" fill="white" font-family="system-ui">GK</text></svg>',
          tag: 'gecit-kfz-test',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        });
      } else {
        new Notification('Gecit Kfz Sachverständiger Bildirimleri Aktif', {
          body: 'Hatırlatmalar artık telefonunuza bildirim olarak gelecek.',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="80">🚗</text></svg>',
          tag: 'gecit-kfz-test',
        });
      }
    }
  };

  // Check and fire due reminders (via Service Worker for mobile persistence)
  useEffect(() => {
    if (pushPermission !== 'granted') return;
    const fireNotification = (title, options) => {
      const reg = window.__swRegistration;
      if (reg) {
        // Service Worker notification — works in background, persists on mobile
        reg.showNotification(title, {
          ...options,
          badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="%237C3AED"/><text x="48" y="58" text-anchor="middle" font-size="50" font-weight="bold" fill="white" font-family="system-ui">GK</text></svg>',
          vibrate: [200, 100, 200, 100, 200],
          actions: [
            { action: 'open', title: 'Aç' },
            { action: 'dismiss', title: 'Kapat' },
          ],
        });
      } else {
        new Notification(title, options);
      }
    };
    const interval = setInterval(() => {
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const nowTime = now.toTimeString().slice(0, 5);
      const reminders = (db.reminders || []).filter(r =>
        r.status === 'active' && r.due_date <= todayIso && r.due_time <= nowTime
      );
      reminders.forEach(r => {
        fireNotification('Gecit Kfz Sachverständiger Hatırlatma: ' + r.title, {
          body: r.message,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="80">🔔</text></svg>',
          tag: 'gecit-kfz-reminder-' + r.id,
          requireInteraction: true,
          renotify: true,
        });
      });
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [db.reminders, pushPermission]);

  const addReminder = (e) => {
    e.preventDefault();
    const reminder = {
      id: 'r' + uid(), ...form, status: 'active', created_at: new Date().toISOString().slice(0, 10),
    };
    setDb(db => ({ ...db, reminders: [...(db.reminders || []), reminder] }));
    setForm({ title: '', message: '', due_date: '', due_time: '', repeat: 'none', customer_id: '', vehicle_id: '' });
    setNewOpen(false);
  };

  const toggleReminder = (id) => {
    setDb(db => ({
      ...db, reminders: (db.reminders || []).map(r =>
        r.id === id ? { ...r, status: r.status === 'active' ? 'done' : 'active' } : r
      ),
    }));
  };

  const deleteReminder = (id) => {
    setDb(db => ({ ...db, reminders: (db.reminders || []).filter(r => r.id !== id) }));
  };

  const active = (db.reminders || []).filter(r => r.status === 'active').sort((a, b) => `${a.due_date}${a.due_time}`.localeCompare(`${b.due_date}${b.due_time}`));
  const done = (db.reminders || []).filter(r => r.status === 'done');

  return (
    <>
      <AdminTopbar title="Hatırlatmalar" subtitle="Push bildirim ile mobil hatırlatma sistemi"
        action={<AdminButton variant="primary" onClick={() => setNewOpen(true)}><PlusIcon size={14} /> Yeni Hatırlatma</AdminButton>} />

      {/* Push Notification Status Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 mb-6 flex items-center justify-between"
        style={{
          background: pushPermission === 'granted' ? 'rgba(52,211,153,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${pushPermission === 'granted' ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`,
        }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: pushPermission === 'granted' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
              color: pushPermission === 'granted' ? '#34D399' : '#F59E0B',
            }}>
            <BellIcon size={22} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: C.text }}>
              {pushPermission === 'granted' ? 'Push Bildirimleri Aktif' :
               pushPermission === 'denied' ? 'Bildirimler Engellendi' : 'Bildirimler Kapalı'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.textDim }}>
              {pushPermission === 'granted'
                ? 'Hatırlatmalar telefonunuza bildirim olarak gelecek. Tamamlanana kadar tekrar eder.'
                : pushPermission === 'denied'
                ? 'Tarayıcı ayarlarından bildirimleri açın.'
                : 'Bildirimleri açarak hatırlatmaların telefonunuza gelmesini sağlayın.'}
            </p>
          </div>
        </div>
        {pushPermission !== 'granted' && (
          <AdminButton variant="primary" onClick={requestPush}>
            <BellIcon size={14} /> {pushPermission === 'denied' ? 'Ayarlardan Aç' : 'Bildirimleri Aç'}
          </AdminButton>
        )}
      </motion.div>

      {/* Active Reminders */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.neon, boxShadow: `0 0 8px ${C.neon}` }} />
          <h3 className="text-lg font-semibold" style={{ color: C.text }}>Aktif Hatırlatmalar</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.neon}15`, color: C.neon }}>{active.length}</span>
        </div>

        {active.length === 0 ? (
          <GlassCard className="text-center py-12">
            <BellIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
            <p style={{ color: C.textDim }}>Aktif hatırlatma yok.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {active.map((r, idx) => {
              const c = db.customers.find(x => x.id === r.customer_id);
              const v = db.vehicles.find(x => x.id === r.vehicle_id);
              const isOverdue = `${r.due_date}${r.due_time}` <= `${new Date().toISOString().slice(0,10)}${new Date().toTimeString().slice(0,5)}`;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}>
                  <GlassCard className={isOverdue ? 'ring-1 ring-red-500/30' : ''}>
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isOverdue ? 'rgba(239,68,68,0.1)' : `${C.neon}15`,
                          color: isOverdue ? '#EF4444' : C.neon,
                          border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : C.neon + '33'}`,
                        }}>
                        {isOverdue ? <AlertTriangle size={18} /> : <BellIcon size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: C.text }}>{r.title}</p>
                          {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>GECİKMİŞ</span>}
                        </div>
                        <p className="text-xs mt-1" style={{ color: C.textDim }}>{r.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-mono flex items-center gap-1" style={{ color: C.neon }}>
                            <CalendarIcon size={12} /> {r.due_date}
                          </span>
                          <span className="text-xs font-mono flex items-center gap-1" style={{ color: C.cyan }}>
                            <ClockIcon size={12} /> {r.due_time}
                          </span>
                          {c && <span className="text-xs" style={{ color: C.textDim }}>{c.type === 'kurumsal' ? c.company : c.full_name}</span>}
                          {v && <span className="text-xs font-mono" style={{ color: C.textDim }}>{v.plate}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => toggleReminder(r.id)} title="Tamamlandı"
                          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition"
                          style={{ color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => deleteReminder(r.id)} title="Sil"
                          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition"
                          style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Reminders */}
      {done.length > 0 && (
        <div>
          <h3 className="text-sm uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Tamamlanan ({done.length})</h3>
          <div className="space-y-1.5">
            {done.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl opacity-50" style={{ border: `1px solid ${C.border}` }}>
                <Check size={14} style={{ color: '#34D399' }} />
                <span className="text-sm line-through flex-1" style={{ color: C.textDim }}>{r.title}</span>
                <span className="text-xs font-mono" style={{ color: C.textDim }}>{r.due_date}</span>
                <button onClick={() => deleteReminder(r.id)} className="text-xs" style={{ color: C.textDim }}>
                  <TrashIcon size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Reminder Modal */}
      <GecitKfzModal open={newOpen} onClose={() => setNewOpen(false)} title="Yeni Hatırlatma" subtitle="Zamanı geldiğinde push bildirim gönderilecek" width={620}>
        <form onSubmit={addReminder} className="space-y-4">
          <Field label="Başlık" required>
            <TextInput value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Örn: Raporu teslim et" />
          </Field>
          <Field label="Mesaj" required>
            <TextInput value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} required placeholder="Detaylı açıklama…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tarih" required>
              <input type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text, colorScheme: 'dark' }} />
            </Field>
            <Field label="Saat" required>
              <input type="time" value={form.due_time} onChange={(e) => setForm(f => ({ ...f, due_time: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text, colorScheme: 'dark' }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Müşteri (opsiyonel)">
              <SelectInput value={form.customer_id} onChange={(e) => setForm(f => ({ ...f, customer_id: e.target.value }))}
                options={db.customers.map(c => ({ value: c.id, label: c.type === 'kurumsal' ? c.company : c.full_name }))}
                placeholder="Seçiniz…" />
            </Field>
            <Field label="Araç (opsiyonel)">
              <SelectInput value={form.vehicle_id} onChange={(e) => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                options={db.vehicles.map(v => ({ value: v.id, label: `${v.plate} — ${v.brand} ${v.model}` }))}
                placeholder="Seçiniz…" />
            </Field>
          </div>
          <Field label="Tekrar">
            <SelectInput value={form.repeat} onChange={(e) => setForm(f => ({ ...f, repeat: e.target.value }))}
              options={[
                { value: 'none', label: 'Tekrarlama' },
                { value: 'daily', label: 'Her Gün' },
                { value: 'weekly', label: 'Her Hafta' },
                { value: 'monthly', label: 'Her Ay' },
              ]} />
          </Field>
          <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <AdminButton onClick={() => setNewOpen(false)}>İptal</AdminButton>
            <AdminButton type="submit" variant="primary"><BellIcon size={14} /> Hatırlatma Oluştur</AdminButton>
          </div>
        </form>
      </GecitKfzModal>
    </>
  );
}

// ─── Admin Partners (Avukatlar & Sigorta) ─────────
function AdminPartners({ db, setDb, currentUser }) {
  const [tab, setTab] = useState('lawyers');
  const lawyerCount = (db.lawyers || []).length;
  const insurerCount = (db.insurers || []).length;
  return (
    <>
      <div className="mb-5 inline-flex rounded-full p-1" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
        {[
          { k: 'lawyers',  l: 'Avukatlar',         cnt: lawyerCount,  color: C.neon,  icon: ScaleIcon },
          { k: 'insurers', l: 'Sigorta Şirketleri', cnt: insurerCount, color: '#B0050F', icon: ShieldIcon },
        ].map(t => {
          const active = tab === t.k;
          return (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: active ? `linear-gradient(135deg, ${t.color}, ${t.color}cc)` : 'transparent',
                color: active ? '#FFFFFF' : C.textDim,
              }}>
              <t.icon size={14} />
              {t.l}
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono"
                style={{ background: active ? 'rgba(11,8,24,0.18)' : 'rgba(0,0,0,0.05)', color: active ? '#FFFFFF' : C.textDim }}>
                {t.cnt}
              </span>
            </button>
          );
        })}
      </div>
      {tab === 'lawyers' && <AdminLawyers db={db} setDb={setDb} currentUser={currentUser} />}
      {tab === 'insurers' && <AdminInsurers db={db} setDb={setDb} currentUser={currentUser} />}
    </>
  );
}

// ─── Admin Insurance Companies Management ─────────
function AdminInsurers({ db, setDb, currentUser }) {
  const [editOpen, setEditOpen] = useState(false);
  const [unifiedOpen, setUnifiedOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', password: '', notes: '' });

  const insurers = (db.insurers || []).filter(i =>
    !search ||
    (i.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => setUnifiedOpen(true);
  const openEdit = (ins) => {
    setForm({
      company: ins.company || '', name: ins.name || '', email: ins.email || '',
      phone: ins.phone || '', password: ins.password || '', notes: ins.notes || '',
    });
    setEditId(ins.id);
    setEditOpen(true);
  };

  const saveEdit = (e) => {
    e?.preventDefault();
    const before = (db.insurers || []).find(i => i.id === editId);
    setDb(withLog(
      prev => ({ ...prev, insurers: (prev.insurers || []).map(i => i.id === editId ? { ...i, ...form } : i) }),
      makeLogEntry({
        user: currentUser, action: 'insurer_update',
        target: { kind: 'insurer', id: editId, label: form.company || before?.company },
        details: `Sigorta şirketi güncellendi: ${form.company || before?.company}`,
        before: before ? { company: before.company, name: before.name, email: before.email, phone: before.phone } : null,
        after: { company: form.company, name: form.name, email: form.email, phone: form.phone },
      })
    ));
    setEditOpen(false);
  };

  const toggleActive = (id) => {
    const ins = (db.insurers || []).find(i => i.id === id);
    if (!ins) return;
    setDb(withLog(
      prev => ({ ...prev, insurers: (prev.insurers || []).map(i => i.id === id ? { ...i, active: !i.active } : i) }),
      makeLogEntry({
        user: currentUser, action: 'insurer_update',
        target: { kind: 'insurer', id, label: ins.company },
        details: `${ins.company} ${ins.active ? 'pasifleştirildi' : 'aktifleştirildi'}`,
        before: { active: ins.active }, after: { active: !ins.active },
      })
    ));
  };

  const deleteInsurer = (id) => {
    if (!window.confirm('Bu sigorta şirketi silinecek. Devam edilsin mi?')) return;
    const ins = (db.insurers || []).find(i => i.id === id);
    setDb(withLog(
      prev => ({
        ...prev,
        insurers: (prev.insurers || []).filter(i => i.id !== id),
        insurance_assignments: (prev.insurance_assignments || []).filter(a => a.insurer_id !== id),
      }),
      ins ? makeLogEntry({
        user: currentUser, action: 'insurer_delete',
        target: { kind: 'insurer', id, label: ins.company },
        details: `Sigorta şirketi silindi: ${ins.company}`,
      }) : null
    ));
  };

  const getAssignedCount = (insId) => (db.insurance_assignments || []).filter(a => a.insurer_id === insId).length;

  return (
    <>
      <AdminTopbar title="Sigorta Şirketleri" subtitle={`${(db.insurers || []).length} kayıtlı sigorta şirketi`}
        action={<AdminButton variant="primary" onClick={openAdd}><PlusIcon size={14} /> Yeni Sigorta Şirketi</AdminButton>} />

      <div className="mb-5 relative">
        <SearchIcon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textDim }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Sigorta şirketi ara... (firma, yetkili, e-posta)"
          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }} />
      </div>

      {insurers.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: `1px dashed ${C.border}` }}>
          <ShieldIcon size={48} style={{ color: C.textDim, margin: '0 auto 16px' }} />
          <p className="text-sm" style={{ color: C.textDim }}>
            {search ? 'Aramayla eşleşen sigorta şirketi bulunamadı.' : 'Henüz sigorta şirketi eklenmemiş.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insurers.map(ins => (
            <GlassCard key={ins.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.12)' }}>
                    <ShieldIcon size={18} style={{ color: '#B0050F' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{ins.company || '—'}</p>
                    <p className="text-xs truncate" style={{ color: C.textDim }}>{ins.name || 'Yetkili belirsiz'}</p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-1 rounded-full uppercase tracking-wider"
                  style={{
                    background: ins.active ? 'rgba(52,211,153,0.12)' : 'rgba(0,0,0,0.05)',
                    color: ins.active ? '#34D399' : C.textDim,
                    border: `1px solid ${ins.active ? 'rgba(52,211,153,0.3)' : C.border}`,
                  }}>
                  {ins.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs mb-4" style={{ color: C.textDim }}>
                {ins.email && <p className="flex items-center gap-2"><MailIcon size={11} /> {ins.email}</p>}
                {ins.phone && <p className="flex items-center gap-2"><PhoneIcon size={11} /> {ins.phone}</p>}
                <p className="flex items-center gap-2"><UsersIcon size={11} /> Atanmış müşteri: <span style={{ color: C.text }}>{getAssignedCount(ins.id)}</span></p>
              </div>
              <div className="flex gap-2">
                <AdminButton size="sm" onClick={() => openEdit(ins)}><EditIcon size={12} /> Düzenle</AdminButton>
                <AdminButton size="sm" onClick={() => toggleActive(ins.id)}>
                  {ins.active ? 'Devre Dışı' : 'Aktifleştir'}
                </AdminButton>
                <AdminButton size="sm" onClick={() => deleteInsurer(ins.id)}>
                  <TrashIcon size={12} /> Sil
                </AdminButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add via unified record modal (insurer tab) */}
      <NewRecordModal open={unifiedOpen} onClose={() => setUnifiedOpen(false)} defaultType="sigorta" setDb={setDb} currentUser={currentUser} />

      {/* Edit modal */}
      <GecitKfzModal open={editOpen} onClose={() => setEditOpen(false)} title="Sigorta Şirketi Düzenle">
        <form onSubmit={saveEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Firma Adı" required><TextInput value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} required placeholder="Örn: Allianz Versicherung" /></Field>
            <Field label="Yetkili Kişi"><TextInput value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Örn: Thomas Müller" /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="E-posta" required><TextInput type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="iletisim@sigorta.com" /></Field>
            <Field label="Telefon"><TextInput value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+49 ..." /></Field>
          </div>
          <Field label="Giriş Şifresi" required><TextInput type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required /></Field>
          <Field label="Notlar"><TextInput value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="İsteğe bağlı" /></Field>
          <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <AdminButton onClick={() => setEditOpen(false)}>İptal</AdminButton>
            <AdminButton variant="primary" type="submit"><Check size={14} /> Güncelle</AdminButton>
          </div>
        </form>
      </GecitKfzModal>
    </>
  );
}

// ─── Admin App shell ────────────────────────────
// ─── Admin Lawyer Management ──────────────────────
function AdminLawyers({ db, setDb, currentUser }) {
  const [addOpen, setAddOpen] = useState(false);
  const [unifiedOpen, setUnifiedOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', baro: '', baro_no: '' });

  const lawyers = (db.lawyers || []).filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.baro.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setUnifiedOpen(true); };
  const openEdit = (l) => { setForm({ name: l.name, email: l.email, phone: l.phone, password: l.password, baro: l.baro, baro_no: l.baro_no }); setEditId(l.id); setAddOpen(true); };

  const saveLawyer = (e) => {
    e.preventDefault();
    if (editId) {
      const before = (db.lawyers || []).find(l => l.id === editId);
      setDb(withLog(
        prev => ({ ...prev, lawyers: (prev.lawyers || []).map(l => l.id === editId ? { ...l, ...form } : l) }),
        makeLogEntry({
          user: currentUser, action: 'lawyer_update',
          target: { kind: 'lawyer', id: editId, label: form.name || before?.name },
          details: `Avukat güncellendi: ${form.name || before?.name}`,
          before: before ? { name: before.name, email: before.email, phone: before.phone, baro: before.baro } : null,
          after: { name: form.name, email: form.email, phone: form.phone, baro: form.baro },
        })
      ));
    } else {
      const lawyer = { id: 'law' + uid(), ...form, active: true, created_at: new Date().toISOString().slice(0, 10) };
      setDb(withLog(
        prev => ({ ...prev, lawyers: [...(prev.lawyers || []), lawyer] }),
        makeLogEntry({
          user: currentUser, action: 'lawyer_create',
          target: { kind: 'lawyer', id: lawyer.id, label: lawyer.name },
          details: `Avukat eklendi: ${lawyer.name} (${lawyer.email})`,
        })
      ));
    }
    setAddOpen(false);
  };

  const toggleActive = (id) => {
    const law = (db.lawyers || []).find(l => l.id === id);
    if (!law) return;
    setDb(withLog(
      prev => ({ ...prev, lawyers: (prev.lawyers || []).map(l => l.id === id ? { ...l, active: !l.active } : l) }),
      makeLogEntry({
        user: currentUser, action: 'lawyer_update',
        target: { kind: 'lawyer', id, label: law.name },
        details: `${law.name} ${law.active ? 'pasifleştirildi' : 'aktifleştirildi'}`,
        before: { active: law.active }, after: { active: !law.active },
      })
    ));
  };

  const deleteLawyer = (id) => {
    const law = (db.lawyers || []).find(l => l.id === id);
    setDb(withLog(
      prev => ({
        ...prev,
        lawyers: (prev.lawyers || []).filter(l => l.id !== id),
        lawyer_assignments: (prev.lawyer_assignments || []).filter(a => a.lawyer_id !== id),
      }),
      law ? makeLogEntry({
        user: currentUser, action: 'lawyer_delete',
        target: { kind: 'lawyer', id, label: law.name },
        details: `Avukat silindi: ${law.name}`,
      }) : null
    ));
  };

  const getAssignedCustomers = (lawyerId) => {
    const assignments = (db.lawyer_assignments || []).filter(a => a.lawyer_id === lawyerId);
    return assignments.map(a => db.customers.find(c => c.id === a.customer_id)).filter(Boolean);
  };

  return (
    <>
      <AdminTopbar title="Avukat Yönetimi" subtitle={`${(db.lawyers || []).length} kayıtlı avukat`}
        action={<AdminButton variant="primary" onClick={openAdd}><UserPlusIcon size={14} /> Yeni Avukat Ekle</AdminButton>} />

      {/* Search */}
      <div className="mb-5 relative">
        <SearchIcon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textDim }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Avukat ara... (isim, e-posta, baro)"
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }} />
      </div>

      {/* Lawyer cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {lawyers.map(l => {
          const customers = getAssignedCustomers(l.id);
          return (
            <motion.div key={l.id} whileHover={{ scale: 1.01 }}
              className="rounded-2xl p-5 transition-all"
              style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${l.active ? C.border : 'rgba(239,68,68,0.2)'}`,
                opacity: l.active ? 1 : 0.6 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: l.active ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: l.active ? '#F59E0B' : '#EF4444' }}>
                    <ScaleIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: C.text }}>{l.name}</p>
                    <p className="text-xs" style={{ color: C.textDim }}>{l.baro} · Sicil: {l.baro_no}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: l.active ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                    color: l.active ? '#34D399' : '#EF4444', border: `1px solid ${l.active ? '#34D39944' : '#EF444444'}` }}>
                  {l.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs" style={{ color: C.textDim }}>
                  <MailIcon size={12} /> {l.email}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: C.textDim }}>
                  <PhoneIcon size={12} /> {l.phone}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: C.textDim }}>
                  <ShieldIcon size={12} /> Şifre: {'•'.repeat(l.password.length)}
                </div>
              </div>
              {/* Assigned customers */}
              <div className="mb-3">
                <p className="text-xs font-medium mb-1.5" style={{ color: C.textDim }}>Atanmış Müşteriler ({customers.length})</p>
                {customers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {customers.map(c => (
                      <span key={c.id} className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(227,6,19,0.07)', color: C.neon, border: `1px solid ${C.neon}22` }}>
                        {c.type === 'kurumsal' ? c.company : c.full_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: C.textDim }}>Henüz müşteri atanmamış</p>
                )}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                <AdminButton size="sm" onClick={() => openEdit(l)}><EditIcon size={12} /> Düzenle</AdminButton>
                <AdminButton size="sm" onClick={() => toggleActive(l.id)}>
                  {l.active ? '⏸ Pasife Al' : '▶ Aktifleştir'}
                </AdminButton>
                <button onClick={() => deleteLawyer(l.id)}
                  className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition"
                  style={{ color: '#EF4444' }}><TrashIcon size={14} /></button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {lawyers.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ border: `1px dashed ${C.border}` }}>
          <ScaleIcon size={48} style={{ color: C.textDim, margin: '0 auto 16px' }} />
          <p className="text-sm" style={{ color: C.textDim }}>
            {search ? 'Aramayla eşleşen avukat bulunamadı.' : 'Henüz avukat eklenmemiş.'}
          </p>
        </div>
      )}

      {/* Unified add modal (bireysel / kurumsal / avukat) */}
      <NewRecordModal open={unifiedOpen} onClose={() => setUnifiedOpen(false)} defaultType="avukat" setDb={setDb} currentUser={currentUser} />

      {/* Edit-only modal for existing lawyers */}
      <GecitKfzModal open={addOpen} onClose={() => setAddOpen(false)} title="Avukat Düzenle">
        <form onSubmit={saveLawyer} className="space-y-4">
          <Field label="Ad Soyad *"><TextInput value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Av. ..." /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="E-posta *"><TextInput value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="avukat@hukuk.com" /></Field>
            <Field label="Telefon"><TextInput value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0532 ..." /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Baro"><TextInput value={form.baro} onChange={(e) => setForm(f => ({ ...f, baro: e.target.value }))} placeholder="İstanbul Barosu" /></Field>
            <Field label="Baro Sicil No"><TextInput value={form.baro_no} onChange={(e) => setForm(f => ({ ...f, baro_no: e.target.value }))} placeholder="45821" /></Field>
          </div>
          <Field label="Giriş Şifresi *"><TextInput type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="En az 4 karakter" /></Field>
          <p className="text-xs" style={{ color: C.textDim }}>Avukat bu e-posta ve şifre ile sisteme giriş yapabilecek.</p>
          <div className="flex justify-end gap-3 pt-2">
            <AdminButton onClick={() => setAddOpen(false)}>İptal</AdminButton>
            <AdminButton variant="primary" onClick={saveLawyer}>{editId ? 'Güncelle' : 'Ekle'}</AdminButton>
          </div>
        </form>
      </GecitKfzModal>
    </>
  );
}

// ─── Lawyer Portal ──────────────────────────────
function LawyerApp({ user, onLogout, onHome }) {
  const [db, setDb] = useDB();
  const [section, setSection] = useState('home');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ customer_id: '', name: '' });
  const [caseOpen, setCaseOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const fileRef = useRef(null);

  const lawyer = (db.lawyers || []).find(l => l.id === user.lawyer_id);
  const perms = db.lawyer_permissions || {};
  const myAssignments = (db.lawyer_assignments || []).filter(a => a.lawyer_id === user.lawyer_id);
  // Actor used for activity logs — combine user role with lawyer record for proper attribution.
  const lawyerActor = { id: user.lawyer_id || user.email, name: lawyer?.name || user.name || user.email, role: 'lawyer' };

  useEffect(() => {
    const sessionKey = 'gecit_kfz_session_logged_' + (user?.email || user?.id || 'anon');
    if (!sessionStorage.getItem(sessionKey)) {
      logActivity(setDb, makeLogEntry({
        user: lawyerActor, action: 'login',
        details: `Avukat ${lawyerActor.name} portala giriş yaptı`,
      }));
      sessionStorage.setItem(sessionKey, '1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    const sessionKey = 'gecit_kfz_session_logged_' + (user?.email || user?.id || 'anon');
    sessionStorage.removeItem(sessionKey);
    logActivity(setDb, makeLogEntry({ user: lawyerActor, action: 'logout', details: `Avukat ${lawyerActor.name} çıkış yaptı` }));
    onLogout();
  };
  const myCustomerIds = myAssignments.map(a => a.customer_id);
  const myCustomers = db.customers.filter(c => myCustomerIds.includes(c.id));
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const myTasks = (db.lawyer_tasks || []).filter(t => t.lawyer_id === user.lawyer_id);
  const myCases = (db.lawyer_cases || []).filter(c => c.lawyer_id === user.lawyer_id);
  const myCourtDates = (db.court_dates || []).filter(cd => cd.lawyer_id === user.lawyer_id);
  const myMessages = (db.messages || []).filter(m => m.contact_type === 'lawyer' && m.contact_id === user.lawyer_id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const getCustomerDocs = (custId) => (db.customer_documents || []).filter(d => d.customer_id === custId);
  const getCustomerVehicles = (custId) => db.vehicles.filter(v => v.owner_id === custId);
  const getCustomerNotes = (custId) => (db.customer_notes || []).filter(n => n.customer_id === custId);
  const getCustomerAppraisals = (custId) => {
    const vIds = getCustomerVehicles(custId).map(v => v.id);
    return db.appraisals.filter(a => vIds.includes(a.vehicle_id));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!uploadForm.customer_id) { alert('Lütfen müşteri seçin.'); return; }
    const custVehicles = getCustomerVehicles(uploadForm.customer_id);
    const customer = (db.customers || []).find(c => c.id === uploadForm.customer_id);
    const custLabel = customer ? (customer.full_name || customer.company || customer.email) : uploadForm.customer_id;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const doc = {
          id: 'cd' + uid(),
          customer_id: uploadForm.customer_id,
          vehicle_id: custVehicles[0]?.id || '',
          name: file.name,
          type: 'diger',
          size: file.size,
          data: reader.result,
          uploaded_at: new Date().toISOString().slice(0, 10),
          mime: file.type,
          uploaded_by: user.lawyer_id,
        };
        setDb(withLog(
          prev => ({ ...prev, customer_documents: [...(prev.customer_documents || []), doc] }),
          makeLogEntry({
            user: lawyerActor, action: 'doc_upload',
            target: { kind: 'customer', id: uploadForm.customer_id, label: custLabel },
            details: `Avukat ${lawyerActor.name} belge yükledi: ${file.name} → ${custLabel}`,
            metadata: { doc_id: doc.id, size: file.size },
          })
        ));
      };
      reader.readAsDataURL(file);
    });
    setUploadOpen(false);
    setUploadForm({ customer_id: '', name: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const lawyerNavItems = [
    { key: 'home', label: 'Genel Bakış', icon: LayoutDashboard },
    { key: 'customers', label: 'Müşterilerim', icon: UsersIcon },
    { key: 'cases', label: 'Dava Dosyaları', icon: FolderIcon, badge: myCases.filter(c => c.status === 'aktif').length },
    { key: 'tasks', label: 'Görevlerim', icon: CheckSquare, badge: myTasks.filter(t => !t.done).length },
    { key: 'messages', label: 'Mesajlar', icon: MessageIcon, badge: myMessages.filter(m => m.sender !== 'lawyer' && !m.read_by_lawyer).length },
    { key: 'calendar', label: 'Mahkeme Takvimi', icon: CalendarIcon, badge: myCourtDates.filter(cd => new Date(cd.date) >= new Date()).length },
    { key: 'templates', label: 'İtiraz Şablonları', icon: FileText, badge: (db.objection_templates || []).length },
    { key: 'diff_report', label: 'Fark Raporu', icon: AlertTriangle },
    { key: 'client_summary', label: 'Müvekkil Özeti', icon: ClipboardIcon },
    { key: 'reports', label: 'Ekspertiz Raporları', icon: Wrench },
    { key: 'upload', label: 'Dosya Yükle', icon: UploadIcon },
    { key: 'metrics', label: 'Performans', icon: TrendingUp },
  ];
  const sectionLabel = (lawyerNavItems.find(i => i.key === section)?.label) || 'Avukat Portalı';
  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: C.bg }}>
      <MobileTopbar onMenuClick={() => setMobileNavOpen(true)} role="lawyer"
        sectionLabel={sectionLabel} onLogout={handleLogout} />
      {/* Sidebar - mobile drawer / desktop sticky */}
      {mobileNavOpen && (
        <div onClick={() => setMobileNavOpen(false)} className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      )}
      <aside className="flex flex-col"
        style={{
          background: C.surface, borderRight: `1px solid ${C.border}`,
          ...(isMobile ? {
            width: 280, maxWidth: '85vw',
            position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
            transform: mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          } : {
            width: 260, height: '100vh', position: 'sticky', top: 0, flexShrink: 0,
          }),
        }}>
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-0 font-mono text-xl flex-shrink-0" style={{ color: C.text }}>
            <span>GE</span>
            <span style={{ color: C.neon, textShadow: `0 0 12px ${C.glow}` }}>C</span>
            <span>IT</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase font-medium" style={{ color: '#F59E0B', letterSpacing: '0.2em' }}>Avukat</p>
            <p className="text-xs font-semibold truncate" style={{ color: C.text }} title={lawyer?.name || user.name}>
              {lawyer?.name || user.name || 'Avukat'}
            </p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {lawyerNavItems.map(it => (
            <button key={it.key} onClick={() => { setSection(it.key); if (it.key === 'upload') setUploadOpen(true); setMobileNavOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all relative active:scale-[0.98]"
              style={{
                background: section === it.key ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' : 'transparent',
                border: `1px solid ${section === it.key ? 'rgba(245,158,11,0.3)' : 'transparent'}`,
                color: section === it.key ? C.text : C.textDim,
              }}>
              <it.icon size={18} strokeWidth={1.8} />
              <span className={section === it.key ? 'font-medium' : ''}>{it.label}</span>
              {it.badge > 0 && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#F59E0B', color: '#FFFFFF' }}>{it.badge}</span>}
              {section === it.key && !it.badge && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />}
            </button>
          ))}
        </nav>
        <div className="p-4 space-y-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => { onHome(); setMobileNavOpen(false); }} className="w-full text-xs px-3 py-2 rounded-full transition-colors hover:bg-black/5"
            style={{ color: C.textDim, border: `1px solid ${C.border}` }}>← Ana Sayfa</button>
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFFFFF' }}>
              <ScaleIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: C.text }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: C.textDim }}>{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-black/5 transition" style={{ color: C.textDim }}>
              <LogOutIcon size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-4 py-4 lg:px-8 lg:py-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)' }}>
        {section === 'home' && (
          <>
            <AdminTopbar title={`Hoş geldiniz, ${lawyer?.name || user.name}`} subtitle="Avukat Portalı — Atanmış dosyalarınız" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Atanmış Müşteri', value: myCustomers.length, color: '#F59E0B', icon: UsersIcon },
                { label: 'Toplam Belge', value: myCustomerIds.reduce((sum, id) => sum + getCustomerDocs(id).length, 0), color: '#B0050F', icon: FolderIcon },
                { label: 'Toplam Araç', value: myCustomerIds.reduce((sum, id) => sum + getCustomerVehicles(id).length, 0), color: '#34D399', icon: CarIcon },
              ].map((s, i) => (
                <GlassCard key={i}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs" style={{ color: C.textDim }}>{s.label}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                      <s.icon size={16} style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                </GlassCard>
              ))}
            </div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Müşterilerim</h3>
            <div className="space-y-2">
              {myCustomers.map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setSection('customers'); }}
                  className="rounded-xl p-4 cursor-pointer hover:bg-black/[0.03] transition-all"
                  style={{ border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                        {(c.full_name || c.company || '?')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.text }}>{c.type === 'kurumsal' ? c.company : c.full_name}</p>
                        <p className="text-xs" style={{ color: C.textDim }}>{c.email} · {getCustomerDocs(c.id).length} belge</p>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: C.neon }}>Görüntüle →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {section === 'customers' && !selectedCustomer && (
          <>
            <AdminTopbar title="Müşterilerim" subtitle={`${myCustomers.length} müşteri · tüm dosya, dava ve belgeler kart içinde`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCustomers.map((c, idx) => {
                const docs = getCustomerDocs(c.id);
                const vehicles = getCustomerVehicles(c.id);
                const cases = (db.lawyer_cases || []).filter(cs => cs.customer_id === c.id && cs.lawyer_id === user.lawyer_id);
                const activeCases = cases.filter(cs => cs.status === 'aktif').length;
                const apps = getCustomerAppraisals(c.id);
                const isCorp = c.type === 'kurumsal';
                const initials = (c.full_name || c.company || '?').slice(0,2).toUpperCase();
                const lastDoc = docs.slice().sort((a,b) => (b.uploaded_at || '').localeCompare(a.uploaded_at || ''))[0];
                const accent = isCorp ? C.cyan : '#F59E0B';
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedCustomer(c)}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all group"
                    style={{
                      background: `linear-gradient(135deg, ${accent}10 0%, rgba(0,0,0,0.03) 60%)`,
                      border: `1px solid ${C.border}`,
                      boxShadow: `0 4px 24px rgba(0,0,0,0.2)`,
                    }}>
                    {/* Decorative glow */}
                    <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-50 group-hover:opacity-80 transition-opacity"
                      style={{ background: `radial-gradient(circle, ${accent}30, transparent 70%)`, filter: 'blur(40px)' }} />

                    {/* Header: avatar + name + type */}
                    <div className="relative flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)`, color: '#FFFFFF',
                            boxShadow: `0 8px 24px ${accent}33` }}>
                          {initials}
                          {activeCases > 0 && (
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: '#34D399', color: '#FFFFFF', border: `2px solid ${C.surface}` }}>
                              {activeCases}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate" style={{ color: C.text, letterSpacing: '-0.01em' }}>
                            {isCorp ? c.company : c.full_name}
                          </p>
                          {perms.can_view_contact_info ? (
                            <p className="text-xs truncate" style={{ color: C.textDim }}>{c.email}</p>
                          ) : (
                            <p className="text-xs italic" style={{ color: C.textDim, opacity: 0.6 }}>İletişim gizli</p>
                          )}
                          {perms.can_view_contact_info && c.phone && (
                            <p className="text-[11px] font-mono mt-0.5" style={{ color: C.textDim }}>{c.phone}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full font-medium uppercase flex-shrink-0"
                        style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}44`, letterSpacing: '0.1em' }}>
                        {isCorp ? 'Kurumsal' : 'Bireysel'}
                      </span>
                    </div>

                    {/* Stats grid: 4 quick metrics */}
                    <div className="relative grid grid-cols-4 gap-2 mb-4">
                      {[
                        { icon: FolderIcon, label: 'Belge', value: docs.length, color: C.neon },
                        { icon: CarIcon,    label: 'Araç',  value: vehicles.length, color: C.cyan },
                        { icon: ScaleIcon,  label: 'Dava',  value: cases.length, color: '#F59E0B' },
                        { icon: Wrench,     label: 'Rapor', value: apps.length, color: '#34D399' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-2.5 text-center"
                          style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
                          <s.icon size={14} style={{ color: s.color, margin: '0 auto 4px' }} />
                          <p className="text-base font-semibold leading-none" style={{ color: C.text }}>{s.value}</p>
                          <p className="text-[10px] mt-1" style={{ color: C.textDim }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer: last activity + chevron */}
                    <div className="relative flex items-center justify-between text-[11px]" style={{ color: C.textDim }}>
                      <span className="flex items-center gap-1.5 truncate min-w-0">
                        <ClockIcon size={11} />
                        {lastDoc ? `Son belge: ${lastDoc.uploaded_at}` : 'Henüz belge yok'}
                      </span>
                      <span className="flex items-center gap-1 font-medium flex-shrink-0 group-hover:translate-x-1 transition-transform"
                        style={{ color: accent }}>
                        Detayları Aç <ChevronRight size={12} />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {myCustomers.length === 0 && (
                <GlassCard className="col-span-full text-center py-16">
                  <UsersIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                  <p className="text-lg font-medium mb-1" style={{ color: C.text }}>Henüz müşteri atanmamış</p>
                  <p className="text-sm" style={{ color: C.textDim }}>Size müşteri ataması yapıldığında burada görünür.</p>
                </GlassCard>
              )}
            </div>
          </>
        )}

        {section === 'customers' && selectedCustomer && (() => {
          const isCorp = selectedCustomer.type === 'kurumsal';
          const accent = isCorp ? C.cyan : '#F59E0B';
          const initials = (selectedCustomer.full_name || selectedCustomer.company || '?').slice(0,2).toUpperCase();
          const docs = getCustomerDocs(selectedCustomer.id);
          const vehicles = getCustomerVehicles(selectedCustomer.id);
          const cases = (db.lawyer_cases || []).filter(cs => cs.customer_id === selectedCustomer.id && cs.lawyer_id === user.lawyer_id);
          const apps = getCustomerAppraisals(selectedCustomer.id);
          const notes = getCustomerNotes(selectedCustomer.id);
          const uploaderBadge = (doc) => {
            const ub = doc.uploaded_by;
            if (!ub || ub === 'customer') return { label: 'Müşteri', color: C.cyan };
            if (ub === user.lawyer_id) return { label: 'Sen', color: '#F59E0B' };
            const lw = (db.lawyers || []).find(l => l.id === ub);
            if (lw) return { label: `Av. ${lw.name?.split(' ')[0] || lw.name}`, color: '#F59E0B' };
            return { label: 'Admin', color: C.neon };
          };
          return (
          <>
            {/* Hero header */}
            <div className="relative rounded-3xl overflow-hidden mb-6 p-6 md:p-8"
              style={{ background: `linear-gradient(135deg, ${accent}15 0%, ${C.surface}cc 60%)`,
                border: `1px solid ${C.border}` }}>
              <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full"
                style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)`, filter: 'blur(60px)' }} />
              <div className="relative flex items-start gap-4 md:gap-6">
                <button onClick={() => { setSelectedCustomer(null); setPreviewDoc(null); }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 transition flex-shrink-0"
                  style={{ border: `1px solid ${C.border}`, color: C.textDim }}>←</button>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)`, color: '#FFFFFF',
                    boxShadow: `0 12px 32px ${accent}44` }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full inline-block mb-2"
                    style={{ color: accent, background: `${accent}15`, border: `1px solid ${accent}44`, letterSpacing: '0.15em' }}>
                    {isCorp ? 'Kurumsal Müşteri' : 'Bireysel Müşteri'}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-semibold truncate" style={{ color: C.text, letterSpacing: '-0.02em' }}>
                    {isCorp ? selectedCustomer.company : selectedCustomer.full_name}
                  </h2>
                  {perms.can_view_contact_info ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: C.textDim }}>
                      {selectedCustomer.email && <span className="flex items-center gap-1.5"><MailIcon size={12} /> {selectedCustomer.email}</span>}
                      {selectedCustomer.phone && <span className="flex items-center gap-1.5 font-mono"><PhoneIcon size={12} /> {selectedCustomer.phone}</span>}
                    </div>
                  ) : (
                    <p className="text-xs italic mt-2" style={{ color: C.textDim, opacity: 0.6 }}>İletişim bilgileri gizli</p>
                  )}
                </div>
              </div>
              {/* Stats row */}
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {[
                  { icon: FolderIcon, label: 'Belge',  value: docs.length,     color: C.neon },
                  { icon: CarIcon,    label: 'Araç',   value: vehicles.length, color: C.cyan },
                  { icon: ScaleIcon,  label: 'Dava',   value: cases.length,    color: '#F59E0B' },
                  { icon: Wrench,     label: 'Rapor',  value: apps.length,     color: '#34D399' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${s.color}15` }}>
                      <s.icon size={15} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-xl font-semibold leading-none" style={{ color: C.text }}>{s.value}</p>
                      <p className="text-[10px] uppercase mt-1" style={{ color: C.textDim, letterSpacing: '0.1em' }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              {/* Left: Info + Docs list */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Vehicles */}
                {perms.can_view_vehicles && vehicles.length > 0 && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: C.text }}>
                      <CarIcon size={14} style={{ color: C.cyan }} /> Araçlar
                      <span className="ml-auto text-[10px] font-mono" style={{ color: C.textDim }}>{vehicles.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {vehicles.map(v => (
                        <div key={v.id} className="p-3 rounded-xl"
                          style={{ background: 'rgba(227,6,19,0.03)', border: `1px solid ${C.border}` }}>
                          <p className="font-mono text-sm font-semibold" style={{ color: C.text }}>{v.plate}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.textDim }}>{v.brand} {v.model} · {v.year}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Dava Dosyaları */}
                {cases.length > 0 && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: C.text }}>
                      <ScaleIcon size={14} style={{ color: '#F59E0B' }} /> Dava Dosyaları
                      <span className="ml-auto text-[10px] font-mono" style={{ color: C.textDim }}>{cases.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {cases.map(cs => {
                        const caseDocs = docs.filter(d => d.case_id === cs.id);
                        const statusColor = cs.status === 'aktif' ? '#34D399' : cs.status === 'kapali' ? '#6B7280' : '#F59E0B';
                        return (
                          <div key={cs.id} className="p-3 rounded-xl"
                            style={{ background: 'rgba(245,158,11,0.04)', border: `1px solid ${C.border}` }}>
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <p className="text-sm font-medium truncate flex-1" style={{ color: C.text }}>{cs.title}</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase flex-shrink-0"
                                style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}44`, letterSpacing: '0.1em' }}>
                                {cs.status}
                              </span>
                            </div>
                            {cs.description && <p className="text-xs mb-2" style={{ color: C.textDim }}>{cs.description}</p>}
                            <div className="flex items-center gap-3 text-[11px]" style={{ color: C.textDim }}>
                              <span className="flex items-center gap-1"><ClockIcon size={11} /> {cs.created_at?.slice(0,10)}</span>
                              <span className="flex items-center gap-1"><FileText size={11} /> {caseDocs.length} ekli belge</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                )}

                {/* Documents */}
                {perms.can_view_documents && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: C.text }}>
                      <FolderIcon size={14} style={{ color: C.neon }} /> Belgeler
                      <span className="ml-auto text-[10px] font-mono" style={{ color: C.textDim }}>{docs.length}</span>
                    </h3>
                    {docs.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: C.textDim }}>Bu müşteri için henüz belge yüklenmemiş.</p>
                    ) : (
                      <div className="space-y-2">
                        {docs.map(doc => {
                          const ub = uploaderBadge(doc);
                          return (
                            <div key={doc.id} onClick={() => setPreviewDoc(doc)}
                              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-black/[0.05]"
                              style={{ border: `1px solid ${previewDoc?.id === doc.id ? C.neon + '44' : C.border}`,
                                background: previewDoc?.id === doc.id ? `${C.neon}08` : 'rgba(0,0,0,0.03)' }}>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(227,6,19,0.07)' }}>
                                <FileText size={16} style={{ color: C.neon }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate" style={{ color: C.text }}>{doc.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: C.textDim }}>
                                  <span>{doc.uploaded_at}</span>
                                  <span>·</span>
                                  <span>{formatSize(doc.size)}</span>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ background: `${ub.color}15`, color: ub.color, border: `1px solid ${ub.color}44` }}>
                                {ub.label}
                              </span>
                              <EyeIcon size={14} style={{ color: C.neon, flexShrink: 0 }} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </GlassCard>
                )}

                {/* Ekspertiz Raporları */}
                {apps.length > 0 && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: C.text }}>
                      <Wrench size={14} style={{ color: '#34D399' }} /> Ekspertiz Raporları
                      <span className="ml-auto text-[10px] font-mono" style={{ color: C.textDim }}>{apps.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {apps.map(ap => {
                        const v = vehicles.find(vh => vh.id === ap.vehicle_id);
                        const statusColor = ap.status === 'tamamlandi' ? '#34D399' : ap.status === 'devam' ? '#F59E0B' : C.textDim;
                        return (
                          <div key={ap.id} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(52,211,153,0.04)', border: `1px solid ${C.border}` }}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(52,211,153,0.1)' }}>
                              <Wrench size={15} style={{ color: '#34D399' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono truncate" style={{ color: C.text }}>
                                {v ? `${v.plate} · ${v.brand} ${v.model}` : 'Araç bilgisi yok'}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: C.textDim }}>
                                {ap.created_at?.slice(0,10)} {ap.notes ? `· ${ap.notes.slice(0, 60)}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full uppercase flex-shrink-0"
                              style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}44`, letterSpacing: '0.1em' }}>
                              {ap.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                )}

                {/* Notes */}
                {perms.can_view_notes && notes.length > 0 && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: C.text }}>
                      <MessageIcon size={14} style={{ color: C.magenta }} /> Notlar
                      <span className="ml-auto text-[10px] font-mono" style={{ color: C.textDim }}>{notes.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {notes.map(n => (
                        <div key={n.id} className="p-3 rounded-xl text-sm"
                          style={{ background: 'rgba(227,6,19,0.03)', border: `1px solid ${C.border}`, color: C.text }}>
                          {n.text}
                          <p className="text-[11px] mt-1.5" style={{ color: C.textDim }}>{new Date(n.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>

              {/* Right: Preview */}
              {previewDoc && (
                <div className="w-1/2 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, maxHeight: 'calc(100vh - 120px)', position: 'sticky', top: 32 }}>
                  <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: C.text }}>{previewDoc.name}</p>
                      <p className="text-xs" style={{ color: C.textDim }}>{formatSize(previewDoc.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {previewDoc.data && (
                        <a href={previewDoc.data} download={previewDoc.name}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                          style={{ color: C.neon }}><DownloadIcon size={16} /></a>
                      )}
                      <button onClick={() => setPreviewDoc(null)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                        style={{ color: C.textDim }}><XClose size={16} /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {previewDoc.data ? (
                      previewDoc.mime === 'application/pdf' || previewDoc.name.endsWith('.pdf') ? (
                        <iframe src={previewDoc.data} className="w-full h-full rounded-lg" style={{ border: 'none', minHeight: 500, background: 'white' }} />
                      ) : previewDoc.mime?.startsWith('image/') ? (
                        <img src={previewDoc.data} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-lg" />
                      ) : (
                        <div className="text-center p-8">
                          <FileText size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                          <p className="text-sm" style={{ color: C.textDim }}>Önizleme desteklenmiyor.</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-8">
                        <FileText size={40} style={{ color: C.neon, margin: '0 auto 12px' }} />
                        <p className="text-sm" style={{ color: C.text }}>{previewDoc.name}</p>
                        <p className="text-xs mt-2" style={{ color: C.textDim }}>Demo verisi — gerçek dosya yüklendiğinde görüntülenecek.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
          );
        })()}

        {/* Cases — Dava Dosyaları */}
        {section === 'cases' && (
          <>
            <AdminTopbar title="Dava Dosyaları" subtitle={`${myCases.length} dosya`}
              action={<AdminButton variant="primary" onClick={() => setCaseOpen(true)}><FolderIcon size={14} /> Yeni Dava</AdminButton>} />
            {myCases.length === 0 ? (
              <GlassCard className="text-center py-16">
                <FolderIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p className="text-lg font-medium mb-1" style={{ color: C.text }}>Dava dosyası yok</p>
                <p style={{ color: C.textDim }} className="text-sm">Yeni bir dava dosyası oluşturun.</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {myCases.map((cs, idx) => {
                  const cust = db.customers.find(c => c.id === cs.customer_id);
                  const statusColors = { aktif: '#34D399', beklemede: '#F59E0B', kapali: '#6B7280' };
                  return (
                    <motion.div key={cs.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}>
                      <GlassCard padding="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium" style={{ color: C.text }}>{cs.title}</p>
                            <p className="text-xs" style={{ color: C.textDim }}>
                              Müşteri: {cust ? (cust.type === 'kurumsal' ? cust.company : cust.full_name) : '—'} · Açılış: {cs.created_at?.slice(0, 10)}
                            </p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full capitalize"
                            style={{ background: `${statusColors[cs.status] || '#6B7280'}15`, color: statusColors[cs.status] || '#6B7280',
                              border: `1px solid ${statusColors[cs.status] || '#6B7280'}44` }}>
                            {cs.status}
                          </span>
                        </div>
                        {cs.description && <p className="text-sm mb-3" style={{ color: C.textDim }}>{cs.description}</p>}
                        <div className="flex items-center gap-3">
                          <span className="text-xs flex items-center gap-1" style={{ color: C.textDim }}>
                            <FileText size={12} /> {(db.customer_documents || []).filter(d => d.case_id === cs.id).length} belge
                          </span>
                          <span className="text-xs flex items-center gap-1" style={{ color: C.textDim }}>
                            <MessageIcon size={12} /> {(db.customer_notes || []).filter(n => n.case_id === cs.id).length} not
                          </span>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tasks — Görevler */}
        {section === 'tasks' && <Iife>{() => {
          const [newTask, setNewTask] = React.useState('');
          const addTask = () => {
            const t = newTask.trim();
            if (!t) return;
            const task = { id: 'lt' + uid(), lawyer_id: user.lawyer_id, text: t, done: false, priority: 'normal', created_at: new Date().toISOString() };
            setDb(prev => ({ ...prev, lawyer_tasks: [...(prev.lawyer_tasks || []), task] }));
            setNewTask('');
          };
          const toggleTask = (taskId) => {
            setDb(prev => ({ ...prev, lawyer_tasks: (prev.lawyer_tasks || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t) }));
          };
          const deleteTask = (taskId) => {
            setDb(prev => ({ ...prev, lawyer_tasks: (prev.lawyer_tasks || []).filter(t => t.id !== taskId) }));
          };
          const pending = myTasks.filter(t => !t.done);
          const completed = myTasks.filter(t => t.done);
          return (
            <>
              <AdminTopbar title="Görevlerim" subtitle={`${pending.length} bekleyen · ${completed.length} tamamlanan`} />
              <GlassCard className="mb-4">
                <div className="flex items-center gap-3">
                  <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
                    placeholder="Yeni görev ekle..."
                    className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                  <AdminButton variant="primary" onClick={addTask}><CheckSquare size={14} /> Ekle</AdminButton>
                </div>
              </GlassCard>
              <div className="space-y-2">
                {pending.map(t => (
                  <GlassCard key={t.id} padding="p-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTask(t.id)} className="w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-all hover:border-yellow-400"
                        style={{ borderColor: C.border }}>
                      </button>
                      <p className="flex-1 text-sm" style={{ color: C.text }}>{t.text}</p>
                      <span className="text-[10px]" style={{ color: C.textDim }}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</span>
                      <button onClick={() => deleteTask(t.id)} className="text-xs hover:text-red-400 transition" style={{ color: C.textDim }}>✕</button>
                    </div>
                  </GlassCard>
                ))}
                {completed.length > 0 && (
                  <>
                    <p className="text-xs uppercase mt-6 mb-2" style={{ color: C.textDim, letterSpacing: '0.12em' }}>Tamamlanan ({completed.length})</p>
                    {completed.map(t => (
                      <GlassCard key={t.id} padding="p-4" style={{ opacity: 0.6 }}>
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleTask(t.id)} className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)' }}>
                            <Check size={14} style={{ color: '#F59E0B' }} />
                          </button>
                          <p className="flex-1 text-sm line-through" style={{ color: C.textDim }}>{t.text}</p>
                          <button onClick={() => deleteTask(t.id)} className="text-xs hover:text-red-400 transition" style={{ color: C.textDim }}>✕</button>
                        </div>
                      </GlassCard>
                    ))}
                  </>
                )}
              </div>
            </>
          );
        }}</Iife>}

        {/* Messages — Lawyer messaging */}
        {section === 'messages' && <Iife>{() => {
          const [msgText, setMsgText] = React.useState('');
          const [selectedContact, setSelectedContact] = React.useState(null);
          const messagesEndRef = React.useRef(null);
          const contactMessages = selectedContact
            ? (db.messages || []).filter(m => (m.contact_id === selectedContact.id && m.contact_type === 'customer') || (m.sender === 'lawyer' && m.lawyer_id === user.lawyer_id && m.contact_id === selectedContact.id))
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            : [];
          React.useEffect(() => {
            if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }, [contactMessages.length]);
          const sendMsg = () => {
            const txt = msgText.trim();
            if (!txt || !selectedContact) return;
            const msg = {
              id: 'msg' + uid(),
              contact_id: selectedContact.id,
              contact_type: 'customer',
              sender: 'lawyer',
              lawyer_id: user.lawyer_id,
              sender_name: lawyer?.name || user.name,
              text: txt,
              created_at: new Date().toISOString(),
            };
            setDb(prev => ({ ...prev, messages: [...(prev.messages || []), msg] }));
            setMsgText('');
          };
          return (
            <>
              <AdminTopbar title="Mesajlar" subtitle="Müşterilerinizle iletişim" />
              <div className="flex gap-4" style={{ height: 'calc(100vh - 180px)' }}>
                {/* Contact list */}
                <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
                  {myCustomers.map(c => {
                    const lastMsg = (db.messages || []).filter(m => m.contact_id === c.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                    return (
                      <div key={c.id} onClick={() => setSelectedContact(c)}
                        className="p-3 rounded-xl cursor-pointer transition-all"
                        style={{ background: selectedContact?.id === c.id ? 'rgba(245,158,11,0.1)' : 'transparent',
                          border: `1px solid ${selectedContact?.id === c.id ? 'rgba(245,158,11,0.3)' : C.border}` }}>
                        <p className="text-sm font-medium truncate" style={{ color: C.text }}>{c.type === 'kurumsal' ? c.company : c.full_name}</p>
                        {lastMsg && <p className="text-xs truncate mt-1" style={{ color: C.textDim }}>{lastMsg.text}</p>}
                      </div>
                    );
                  })}
                </div>
                {/* Chat area */}
                <GlassCard padding="p-0" className="flex-1 flex flex-col overflow-hidden">
                  {!selectedContact ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm" style={{ color: C.textDim }}>Mesaj göndermek için sol taraftan müşteri seçin.</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                          {(selectedContact.full_name || selectedContact.company || '?')[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: C.text }}>{selectedContact.type === 'kurumsal' ? selectedContact.company : selectedContact.full_name}</p>
                          <p className="text-xs" style={{ color: C.textDim }}>{selectedContact.email}</p>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {contactMessages.map(m => (
                          <div key={m.id} className={`flex ${m.sender === 'lawyer' ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[70%] rounded-2xl px-4 py-2.5"
                              style={{
                                background: m.sender === 'lawyer' ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.05)',
                                border: `1px solid ${m.sender === 'lawyer' ? 'rgba(245,158,11,0.3)' : C.border}`,
                              }}>
                              <p className="text-sm" style={{ color: C.text, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                              <p className="text-[10px] mt-1 text-right" style={{ color: C.textDim }}>
                                {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="p-4 flex items-end gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
                        <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }}}
                          placeholder="Mesajınızı yazın..." rows={1}
                          className="flex-1 rounded-xl px-4 py-3 text-sm resize-none outline-none"
                          style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                        <button onClick={sendMsg}
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFFFFF' }}>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </GlassCard>
              </div>
            </>
          );
        }}</Iife>}

        {/* Calendar — Mahkeme Takvimi */}
        {section === 'calendar' && <Iife>{() => {
          const [newDate, setNewDate] = React.useState({ date: '', time: '', court: '', description: '', customer_id: '' });
          const addCourtDate = () => {
            if (!newDate.date || !newDate.court) return;
            const cd = { id: 'cd' + uid(), lawyer_id: user.lawyer_id, ...newDate, created_at: new Date().toISOString() };
            // Eger musteri secildiyse, PDF kaydi da olustur (genel kural)
            const cust = newDate.customer_id ? (db.customers || []).find(c => c.id === newDate.customer_id) : null;
            const lbl = cust ? (cust.full_name || cust.company || cust.email) : '';
            if (newDate.customer_id && cust) {
              const courtPdf = buildCustomerPdfDoc({
                customer_id: newDate.customer_id,
                customerLabel: lbl,
                title: 'Mahkeme Takvimi Kaydi',
                body: `Mahkeme: ${newDate.court}\nTarih: ${newDate.date}${newDate.time ? ' ' + newDate.time : ''}\n\nAciklama:\n${newDate.description || '(aciklama yok)'}`,
                type: 'hukuki',
                signatureLine: 'Olusturan: ' + (lawyer?.name || user.name || '-') + ' (Avukat)',
                uploadedBy: user.lawyer_id,
              });
              setDb(prev => ({ ...prev, court_dates: [...(prev.court_dates || []), cd], customer_documents: [...(prev.customer_documents || []), courtPdf] }));
            } else {
              setDb(prev => ({ ...prev, court_dates: [...(prev.court_dates || []), cd] }));
            }
            setNewDate({ date: '', time: '', court: '', description: '', customer_id: '' });
          };
          const upcoming = myCourtDates.filter(cd => new Date(cd.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
          const past = myCourtDates.filter(cd => new Date(cd.date) < new Date()).sort((a, b) => new Date(b.date) - new Date(a.date));
          return (
            <>
              <AdminTopbar title="Mahkeme Takvimi" subtitle={`${upcoming.length} gelecek duruşma`} />
              <GlassCard className="mb-6">
                <p className="text-sm font-medium mb-3" style={{ color: C.text }}>Yeni Duruşma Ekle</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <input type="date" value={newDate.date} onChange={(e) => setNewDate(d => ({ ...d, date: e.target.value }))}
                    className="rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                  <input type="time" value={newDate.time} onChange={(e) => setNewDate(d => ({ ...d, time: e.target.value }))}
                    className="rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                  <input placeholder="Mahkeme adı" value={newDate.court} onChange={(e) => setNewDate(d => ({ ...d, court: e.target.value }))}
                    className="rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                  <SelectInput value={newDate.customer_id}
                    onChange={(e) => setNewDate(d => ({ ...d, customer_id: e.target.value }))}
                    options={[{ value: '', label: 'Müşteri...' }, ...myCustomers.map(c => ({ value: c.id, label: c.type === 'kurumsal' ? c.company : c.full_name }))]} />
                </div>
                <input placeholder="Açıklama" value={newDate.description} onChange={(e) => setNewDate(d => ({ ...d, description: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
                  style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                <AdminButton variant="primary" onClick={addCourtDate}><CalendarIcon size={14} /> Ekle</AdminButton>
              </GlassCard>
              {upcoming.length > 0 && (
                <>
                  <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.12em' }}>Yaklaşan Duruşmalar</p>
                  <div className="space-y-2 mb-6">
                    {upcoming.map(cd => {
                      const cust = db.customers.find(c => c.id === cd.customer_id);
                      const daysLeft = Math.ceil((new Date(cd.date) - new Date()) / 86400000);
                      return (
                        <GlassCard key={cd.id} padding="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                              style={{ background: daysLeft <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)',
                                border: `1px solid ${daysLeft <= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                              <span className="text-sm font-bold font-mono" style={{ color: daysLeft <= 3 ? '#EF4444' : '#F59E0B' }}>{new Date(cd.date).getDate()}</span>
                              <span className="text-[8px] uppercase" style={{ color: C.textDim }}>{new Date(cd.date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: C.text }}>{cd.court}</p>
                              <p className="text-xs" style={{ color: C.textDim }}>
                                {cd.time && `Saat ${cd.time} · `}{cust ? (cust.type === 'kurumsal' ? cust.company : cust.full_name) : ''}
                              </p>
                              {cd.description && <p className="text-xs mt-1" style={{ color: C.textDim }}>{cd.description}</p>}
                            </div>
                            <span className="text-xs font-mono" style={{ color: daysLeft <= 3 ? '#EF4444' : '#F59E0B' }}>{daysLeft} gün</span>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </>
              )}
              {past.length > 0 && (
                <>
                  <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.12em' }}>Geçmiş Duruşmalar ({past.length})</p>
                  <div className="space-y-2" style={{ opacity: 0.6 }}>
                    {past.slice(0, 5).map(cd => (
                      <GlassCard key={cd.id} padding="p-3">
                        <div className="flex items-center gap-3">
                          <CalendarIcon size={14} style={{ color: C.textDim }} />
                          <span className="text-sm" style={{ color: C.textDim }}>{cd.court} · {cd.date}</span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        }}</Iife>}

        {/* Ekspertiz Reports — Avukat erişimi */}
        {section === 'reports' && (
          <>
            <AdminTopbar title="Ekspertiz Raporları" subtitle="Müşterilerinizin araç ekspertiz sonuçları" />
            {myCustomers.map(cust => {
              const aprs = getCustomerAppraisals(cust.id);
              if (aprs.length === 0) return null;
              return (
                <div key={cust.id} className="mb-6">
                  <p className="text-sm font-medium mb-2" style={{ color: C.text }}>
                    {cust.type === 'kurumsal' ? cust.company : cust.full_name}
                  </p>
                  <div className="space-y-2">
                    {aprs.map(apr => {
                      const v = getCustomerVehicles(cust.id).find(vh => vh.id === apr.vehicle_id);
                      const stage = STAGES.find(s => s.key === (apr.status || 'bekliyor'));
                      return (
                        <GlassCard key={apr.id} padding="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stage.color}15`, color: stage.color }}>
                              <Wrench size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-mono" style={{ color: C.text }}>{v?.plate || '—'} · {v?.brand} {v?.model}</p>
                              <p className="text-xs" style={{ color: C.textDim }}>{stage.label} · %{stage.pct}</p>
                            </div>
                            {apr.status === 'tamamlandi' && (
                              <AdminButton size="sm" onClick={() => {
                                if (typeof generateGutachtenPDF === 'function') generateGutachtenPDF(v, apr, db.paint_maps?.[v?.id] || {});
                                else alert('Rapor PDF hazırlanıyor...');
                              }}>
                                <DownloadIcon size={14} /> PDF
                              </AdminButton>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Performance Metrics */}
        {/* ═══ İtiraz Şablonları ═══ */}
        {section === 'templates' && <Iife>{() => {
          const templates = db.objection_templates || [];
          const [selectedTpl, setSelectedTpl] = React.useState(null);
          const [editContent, setEditContent] = React.useState('');
          const [fillModal, setFillModal] = React.useState(false);
          const [fillCustomer, setFillCustomer] = React.useState('');

          const fillTemplate = (tpl) => {
            const cust = myCustomers.find(c => c.id === fillCustomer);
            if (!cust) return tpl.content;
            const vehicles = getCustomerVehicles(cust.id);
            const claims = (db.insurance_claims || []).filter(c => c.customer_id === cust.id);
            const claim = claims[0];
            const insurer = claim ? (db.insurers || []).find(i => i.id === claim.insurer_id) : null;
            let txt = tpl.content;
            txt = txt.replace(/\[MUSTERI_ADI\]/g, cust.full_name || cust.company || '—');
            txt = txt.replace(/\[PLAKA\]/g, vehicles[0]?.plate || '—');
            txt = txt.replace(/\[AVUKAT_ADI\]/g, lawyer?.name || user.name || '—');
            txt = txt.replace(/\[SIGORTA_SIRKETI\]/g, insurer?.company || '—');
            txt = txt.replace(/\[TARIH\]/g, new Date().toLocaleDateString('tr-TR'));
            txt = txt.replace(/\[HASAR_TUTARI\]/g, claim?.claim_amount?.toLocaleString('tr-TR') || '—');
            txt = txt.replace(/\[TEKLIF_TUTARI\]/g, claim?.offer_amount?.toLocaleString('tr-TR') || '—');
            return txt;
          };

          const categoryColors = { red_itiraz: '#EF4444', dusuk_teklif: '#F59E0B', tazminat: C.cyan, mahkeme: C.magenta };
          const categoryLabels = { red_itiraz: 'Red İtirazı', dusuk_teklif: 'Düşük Teklif', tazminat: 'Tazminat', mahkeme: 'Mahkeme' };

          return (
            <>
              <AdminTopbar title="İtiraz Şablonları" subtitle="Sigorta red ve düşük teklif itirazları için hazır şablonlar" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {templates.map((tpl, idx) => {
                  const cc = categoryColors[tpl.category] || C.neon;
                  return (
                    <motion.div key={tpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }} whileHover={{ y: -3 }}>
                      <GlassCard className="cursor-pointer hover:border-opacity-50 transition-all"
                        onClick={() => { setSelectedTpl(tpl); setEditContent(tpl.content); }}>
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-[9px] px-2 py-1 rounded-full uppercase font-bold"
                            style={{ background: `${cc}15`, color: cc, border: `1px solid ${cc}44`, letterSpacing: '0.1em' }}>
                            {categoryLabels[tpl.category] || tpl.category}
                          </span>
                          <FileText size={18} style={{ color: cc }} />
                        </div>
                        <p className="text-sm font-medium mb-2" style={{ color: C.text }}>{tpl.title}</p>
                        <p className="text-xs line-clamp-3" style={{ color: C.textDim }}>{tpl.content.slice(0, 120)}...</p>
                        <div className="flex items-center gap-2 mt-4">
                          <AdminButton size="sm" variant="primary" onClick={(e) => {
                            e.stopPropagation(); setSelectedTpl(tpl); setFillModal(true); setEditContent(tpl.content);
                          }}>
                            Kullan
                          </AdminButton>
                          <AdminButton size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTpl(tpl); setEditContent(tpl.content); }}>
                            Önizle
                          </AdminButton>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              {/* Template Preview/Edit */}
              {selectedTpl && !fillModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-lg font-medium" style={{ color: C.text }}>{selectedTpl.title}</p>
                      <AdminButton size="sm" onClick={() => setSelectedTpl(null)}>✕ Kapat</AdminButton>
                    </div>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                      rows={15}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none font-mono"
                      style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text, lineHeight: 1.8 }} />
                    <div className="flex items-center gap-2 mt-4">
                      <AdminButton variant="primary" onClick={() => { setFillModal(true); }}>
                        Müşteri ile Doldur
                      </AdminButton>
                      <AdminButton onClick={() => { navigator.clipboard.writeText(editContent); }}>
                        Kopyala
                      </AdminButton>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Fill Template Modal */}
              <GecitKfzModal open={fillModal} onClose={() => setFillModal(false)} title="Şablon Doldur" subtitle="Müşteri bilgileri ile otomatik doldur">
                <div className="space-y-4">
                  <Field label="Müşteri Seçin">
                    <SelectInput value={fillCustomer}
                      onChange={e => setFillCustomer(e.target.value)}
                      options={[{ value: '', label: 'Müşteri seçiniz...' }, ...myCustomers.map(c => ({ value: c.id, label: c.type === 'kurumsal' ? c.company : c.full_name }))]} />
                  </Field>
                  {fillCustomer && selectedTpl && (
                    <>
                      <div className="p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap"
                        style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text, maxHeight: 300, overflowY: 'auto' }}>
                        {fillTemplate(selectedTpl)}
                      </div>
                      <div className="flex items-center gap-2">
                        <AdminButton variant="primary" onClick={() => {
                          navigator.clipboard.writeText(fillTemplate(selectedTpl));
                          setFillModal(false);
                        }}>
                          Kopyala ve Kapat
                        </AdminButton>
                        <AdminButton onClick={() => {
                          // Itiraz sablonunu PDF olarak musteri kartina kaydet
                          const cust = (db.customers || []).find(c => c.id === fillCustomer);
                          const lbl = cust ? (cust.full_name || cust.company || cust.email) : fillCustomer;
                          const filledText = fillTemplate(selectedTpl);
                          const today = new Date().toLocaleDateString('tr-TR');

                          const pdf = new jsPDF('p', 'mm', 'a4');
                          const pageWidth = pdf.internal.pageSize.getWidth();
                          const pageHeight = pdf.internal.pageSize.getHeight();
                          const marginX = 20;
                          const marginY = 22;
                          const contentWidth = pageWidth - marginX * 2;

                          // Mor ust serit
                          pdf.setFillColor(124, 58, 237);
                          pdf.rect(0, 0, pageWidth, 12, 'F');

                          // Baslik
                          pdf.setFont('helvetica', 'bold');
                          pdf.setFontSize(16);
                          pdf.setTextColor(20, 20, 20);
                          pdf.text(selectedTpl.title, marginX, marginY);

                          // Meta satiri
                          pdf.setFont('helvetica', 'normal');
                          pdf.setFontSize(9);
                          pdf.setTextColor(110, 110, 110);
                          pdf.text(`Musteri: ${lbl}`, marginX, marginY + 7);
                          pdf.text(`Tarih: ${today}`, pageWidth - marginX, marginY + 7, { align: 'right' });

                          // Cizgi
                          pdf.setDrawColor(220, 220, 220);
                          pdf.line(marginX, marginY + 11, pageWidth - marginX, marginY + 11);

                          // Govde metni
                          pdf.setFont('helvetica', 'normal');
                          pdf.setFontSize(11);
                          pdf.setTextColor(30, 30, 30);
                          const lines = pdf.splitTextToSize(filledText, contentWidth);
                          let y = marginY + 22;
                          const lineH = 6;
                          lines.forEach(line => {
                            if (y > pageHeight - marginY) { pdf.addPage(); y = marginY; }
                            pdf.text(line, marginX, y);
                            y += lineH;
                          });

                          // Footer
                          pdf.setFontSize(8);
                          pdf.setTextColor(150, 150, 150);
                          pdf.text(`Olusturan: ${lawyer?.name || user.name || '—'} (Avukat)  |  Gecit Kfz Sachverstandiger`,
                            marginX, pageHeight - 10);

                          const pdfDataUri = pdf.output('datauristring');
                          const pdfSize = Math.round(pdfDataUri.length * 0.75);
                          const safeName = selectedTpl.title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80);
                          const fileName = `${safeName} - ${today.replace(/\./g, '-')}.pdf`;

                          const docFile = {
                            id: 'cd' + uid(),
                            customer_id: fillCustomer,
                            vehicle_id: '',
                            name: fileName,
                            type: 'hukuki',
                            size: pdfSize,
                            data: pdfDataUri,
                            uploaded_at: new Date().toISOString().slice(0, 10),
                            mime: 'application/pdf',
                            uploaded_by: user.lawyer_id,
                          };

                          setDb(withLog(
                            prev => ({ ...prev, customer_documents: [...(prev.customer_documents || []), docFile] }),
                            makeLogEntry({
                              user: lawyerActor, action: 'doc_upload',
                              target: { kind: 'customer', id: fillCustomer, label: lbl },
                              details: `Avukat ${lawyerActor.name} itiraz sablonunu PDF olarak kaydetti: ${docFile.name} -> ${lbl}`,
                              metadata: { doc_id: docFile.id, template: selectedTpl.title, format: 'pdf' },
                            })
                          ));
                          setFillModal(false);
                        }}>
                          PDF Olarak Kaydet
                        </AdminButton>
                      </div>
                    </>
                  )}
                </div>
              </GecitKfzModal>
            </>
          );
        }}</Iife>}

        {/* ═══ Hasar Fark Raporu (müşteri talebi vs sigorta teklifi) ═══ */}
        {section === 'diff_report' && <Iife>{() => {
          const [selCust, setSelCust] = React.useState('');
          const claims = selCust ? (db.insurance_claims || []).filter(c => c.customer_id === selCust) : [];
          const offers = (db.insurance_offers || []);

          return (
            <>
              <AdminTopbar title="Hasar Fark Raporu" subtitle="Müşteri talebi vs sigorta teklifi karşılaştırma" />
              <GlassCard className="mb-6">
                <Field label="Müşteri Seçin">
                  <SelectInput value={selCust} onChange={e => setSelCust(e.target.value)}
                    options={[{ value: '', label: 'Müşteri seçiniz...' }, ...myCustomers.map(c => ({ value: c.id, label: c.type === 'kurumsal' ? c.company : c.full_name }))]} />
                </Field>
              </GlassCard>

              {selCust && claims.length > 0 ? (
                <div className="space-y-4">
                  {claims.map((claim, idx) => {
                    const vehicle = db.vehicles.find(v => v.id === claim.vehicle_id);
                    const insurer = (db.insurers || []).find(i => i.id === claim.insurer_id);
                    const offer = offers.find(o => o.claim_id === claim.id);
                    const claimAmt = claim.claim_amount || 0;
                    const offerAmt = offer?.amount || claim.offer_amount || 0;
                    const diff = claimAmt - offerAmt;
                    const diffPct = claimAmt > 0 ? Math.round((diff / claimAmt) * 100) : 0;
                    return (
                      <motion.div key={claim.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}>
                        <GlassCard>
                          <div className="flex items-center gap-3 mb-4">
                            <p className="font-mono text-lg font-bold" style={{ color: C.text }}>{vehicle?.plate || '—'}</p>
                            {insurer && <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${C.cyan}15`, color: C.cyan, border: `1px solid ${C.cyan}33` }}>{insurer.company}</span>}
                          </div>
                          <p className="text-sm mb-4" style={{ color: C.textDim }}>{claim.damage_description}</p>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                              <p className="text-[10px] uppercase mb-1" style={{ color: '#EF4444', letterSpacing: '0.1em' }}>Hasar Tutarı</p>
                              <p className="text-2xl font-bold font-mono" style={{ color: '#EF4444' }}>€{claimAmt.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                              <p className="text-[10px] uppercase mb-1" style={{ color: C.cyan, letterSpacing: '0.1em' }}>Sigorta Teklifi</p>
                              <p className="text-2xl font-bold font-mono" style={{ color: C.cyan }}>€{offerAmt.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="p-4 rounded-xl text-center" style={{ background: diff > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(52,211,153,0.06)', border: `1px solid ${diff > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(52,211,153,0.2)'}` }}>
                              <p className="text-[10px] uppercase mb-1" style={{ color: diff > 0 ? '#F59E0B' : '#34D399', letterSpacing: '0.1em' }}>Fark</p>
                              <p className="text-2xl font-bold font-mono" style={{ color: diff > 0 ? '#F59E0B' : '#34D399' }}>€{Math.abs(diff).toLocaleString('tr-TR')}</p>
                              {diffPct !== 0 && <p className="text-[10px]" style={{ color: diff > 0 ? '#F59E0B' : '#34D399' }}>%{Math.abs(diffPct)} {diff > 0 ? 'eksik' : 'fazla'}</p>}
                            </div>
                          </div>

                          {diff > 0 && (
                            <div className="p-3 rounded-xl mb-3 flex items-start gap-2"
                              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                              <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                              <p className="text-xs" style={{ color: '#F59E0B' }}>
                                Sigorta teklifi, ekspertiz raporundaki hasar tutarının %{diffPct} altında. İtiraz edilmesi tavsiye edilir.
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <AdminButton variant="primary" size="sm" onClick={() => setSection('templates')}>
                              <FileText size={14} /> İtiraz Şablonu Kullan
                            </AdminButton>
                            <AdminButton size="sm" onClick={() => {
                              const cust = myCustomers.find(c => c.id === selCust);
                              const report = `HASAR FARK RAPORU\n${'='.repeat(40)}\nMüşteri: ${cust?.full_name || cust?.company}\nAraç: ${vehicle?.plate} — ${vehicle?.brand} ${vehicle?.model}\nSigorta: ${insurer?.company || '—'}\n\nHasar Tutarı: €${claimAmt.toLocaleString('tr-TR')}\nSigorta Teklifi: €${offerAmt.toLocaleString('tr-TR')}\nFark: €${Math.abs(diff).toLocaleString('tr-TR')} (${diff > 0 ? 'eksik' : 'fazla'})\n\nAçıklama: ${claim.damage_description}\n\nTarih: ${new Date().toLocaleDateString('tr-TR')}\nHazırlayan: ${lawyer?.name || user.name}`;
                              navigator.clipboard.writeText(report);
                            }}>
                              Raporu Kopyala
                            </AdminButton>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              ) : selCust ? (
                <GlassCard className="text-center py-12">
                  <AlertTriangle size={36} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                  <p style={{ color: C.textDim }} className="text-sm">Bu müşteriye ait sigorta talebi bulunmuyor.</p>
                </GlassCard>
              ) : null}
            </>
          );
        }}</Iife>}

        {/* ═══ Müvekkil Dosya Özeti (1-Sayfa) ═══ */}
        {section === 'client_summary' && <Iife>{() => {
          const [selCust, setSelCust] = React.useState('');

          const generateSummary = () => {
            const cust = myCustomers.find(c => c.id === selCust);
            if (!cust) return null;
            const vehicles = getCustomerVehicles(cust.id);
            const docs = getCustomerDocs(cust.id);
            const aprs = getCustomerAppraisals(cust.id);
            const cases = myCases.filter(cs => cs.customer_id === cust.id);
            const claims = (db.insurance_claims || []).filter(c => c.customer_id === cust.id);
            const timeline = (db.damage_timeline || []).filter(t => t.customer_id === cust.id).sort((a, b) => new Date(b.date) - new Date(a.date));
            return { cust, vehicles, docs, aprs, cases, claims, timeline };
          };

          const data = selCust ? generateSummary() : null;

          const copyToClipboard = () => {
            if (!data) return;
            const { cust, vehicles, docs, aprs, cases, claims } = data;
            const text = `MÜVEKKİL DOSYA ÖZETİ
${'═'.repeat(50)}
Ad: ${cust.full_name || cust.company}
Tip: ${cust.type === 'kurumsal' ? 'Kurumsal' : 'Bireysel'}
E-posta: ${cust.email}
Telefon: ${cust.phone || '—'}
${'─'.repeat(50)}
ARAÇLAR (${vehicles.length}):
${vehicles.map(v => `  • ${v.plate} — ${v.brand} ${v.model} ${v.year}`).join('\n') || '  Yok'}

EKSPERTİZLER (${aprs.length}):
${aprs.map(a => `  • ${a.id} — Durum: ${a.status} — Tarih: ${a.date || '—'}`).join('\n') || '  Yok'}

SİGORTA TALEPLERİ (${claims.length}):
${claims.map(c => `  • ${c.id} — Durum: ${c.status} — Tutar: €${c.claim_amount || 0}`).join('\n') || '  Yok'}

DAVALAR (${cases.length}):
${cases.map(c => `  • ${c.title} — Durum: ${c.status}`).join('\n') || '  Yok'}

BELGELER (${docs.length}):
${docs.map(d => `  • ${d.name} — ${d.uploaded_at}`).join('\n') || '  Yok'}
${'─'.repeat(50)}
Hazırlayan: ${lawyer?.name || user.name}
Tarih: ${new Date().toLocaleDateString('tr-TR')}`;
            navigator.clipboard.writeText(text);
          };

          return (
            <>
              <AdminTopbar title="Müvekkil Dosya Özeti" subtitle="Tek sayfada tüm müvekkil bilgileri" />
              <GlassCard className="mb-6">
                <Field label="Müşteri Seçin">
                  <SelectInput value={selCust} onChange={e => setSelCust(e.target.value)}
                    options={[{ value: '', label: 'Müşteri seçiniz...' }, ...myCustomers.map(c => ({ value: c.id, label: c.type === 'kurumsal' ? c.company : c.full_name }))]} />
                </Field>
              </GlassCard>

              {data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Client Header */}
                  <GlassCard>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                        {(data.cust.full_name || data.cust.company || '?')[0]}
                      </div>
                      <div>
                        <p className="text-xl font-bold" style={{ color: C.text }}>{data.cust.full_name || data.cust.company}</p>
                        <p className="text-sm" style={{ color: C.textDim }}>{data.cust.email} · {data.cust.phone || '—'}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase mt-1 inline-block"
                          style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', letterSpacing: '0.1em' }}>
                          {data.cust.type === 'kurumsal' ? 'Kurumsal' : 'Bireysel'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { l: 'Araç', v: data.vehicles.length, c: C.cyan },
                        { l: 'Ekspertiz', v: data.aprs.length, c: C.neon },
                        { l: 'Sigorta', v: data.claims.length, c: '#F59E0B' },
                        { l: 'Dava', v: data.cases.length, c: C.magenta },
                        { l: 'Belge', v: data.docs.length, c: '#34D399' },
                      ].map((s, i) => (
                        <div key={i} className="p-3 rounded-xl text-center" style={{ background: `${s.c}08`, border: `1px solid ${s.c}22` }}>
                          <p className="text-2xl font-bold font-mono" style={{ color: s.c }}>{s.v}</p>
                          <p className="text-[10px] uppercase" style={{ color: C.textDim, letterSpacing: '0.1em' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Vehicles */}
                  {data.vehicles.length > 0 && (
                    <GlassCard>
                      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: C.text }}>
                        <CarIcon size={16} style={{ color: C.cyan }} /> Araçlar
                      </p>
                      {data.vehicles.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
                          <div>
                            <span className="font-mono font-bold" style={{ color: C.text }}>{v.plate}</span>
                            <span className="text-xs ml-2" style={{ color: C.textDim }}>{v.brand} {v.model} · {v.year}</span>
                          </div>
                          <span className="text-xs font-mono" style={{ color: C.textDim }}>{v.chassis}</span>
                        </div>
                      ))}
                    </GlassCard>
                  )}

                  {/* Claims */}
                  {data.claims.length > 0 && (
                    <GlassCard>
                      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: C.text }}>
                        <ShieldIcon size={16} style={{ color: '#F59E0B' }} /> Sigorta Talepleri
                      </p>
                      {data.claims.map(c => {
                        const insurer = (db.insurers || []).find(i => i.id === c.insurer_id);
                        return (
                          <div key={c.id} className="p-3 rounded-xl mb-2" style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm" style={{ color: C.text }}>{c.damage_description?.slice(0, 60)}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)' }}>{c.status}</span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: C.textDim }}>
                              {insurer?.company || '—'} · Talep: €{c.claim_amount?.toLocaleString('tr-TR') || 0} · Teklif: €{c.offer_amount?.toLocaleString('tr-TR') || '—'}
                            </p>
                          </div>
                        );
                      })}
                    </GlassCard>
                  )}

                  {/* Timeline */}
                  {data.timeline.length > 0 && (
                    <GlassCard>
                      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: C.text }}>
                        <ClockIcon size={16} style={{ color: C.neon }} /> Son Olaylar
                      </p>
                      {data.timeline.slice(0, 5).map(ev => (
                        <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg mb-1">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.neon }} />
                          <span className="text-xs flex-1" style={{ color: C.text }}>{ev.description}</span>
                          <span className="text-[10px] font-mono" style={{ color: C.textDim }}>{ev.date}</span>
                        </div>
                      ))}
                    </GlassCard>
                  )}

                  <div className="flex items-center gap-2">
                    <AdminButton variant="primary" onClick={copyToClipboard}>
                      <ClipboardIcon size={14} /> Özeti Kopyala
                    </AdminButton>
                    <AdminButton onClick={() => {
                      const phone = '4917XXXXXXXX';
                      const text = encodeURIComponent(`Müvekkil Özeti: ${data.cust.full_name || data.cust.company}\nAraç: ${data.vehicles.map(v => v.plate).join(', ')}\nDava: ${data.cases.length} · Sigorta: ${data.claims.length}`);
                      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                    }}>
                      WhatsApp ile Gönder
                    </AdminButton>
                  </div>
                </motion.div>
              )}
            </>
          );
        }}</Iife>}

        {section === 'metrics' && (
          <>
            <AdminTopbar title="Performans Metrikleri" subtitle="Vaka süreleri ve istatistikler" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Toplam Dava', value: myCases.length, color: '#F59E0B', icon: FolderIcon },
                { label: 'Aktif Dava', value: myCases.filter(c => c.status === 'aktif').length, color: '#34D399', icon: TrendingUp },
                { label: 'Görev Tamamlama', value: myTasks.length > 0 ? Math.round((myTasks.filter(t => t.done).length / myTasks.length) * 100) + '%' : '—', color: C.cyan, icon: CheckSquare },
                { label: 'Yaklaşan Duruşma', value: myCourtDates.filter(cd => new Date(cd.date) >= new Date()).length, color: C.magenta, icon: CalendarIcon },
              ].map((s, i) => (
                <GlassCard key={i}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs" style={{ color: C.textDim }}>{s.label}</span>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                  <p className="text-3xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                </GlassCard>
              ))}
            </div>
            <GlassCard>
              <p className="text-sm font-medium mb-4" style={{ color: C.text }}>Müşteri Bazlı Özet</p>
              <div className="space-y-3">
                {myCustomers.map(c => {
                  const docs = getCustomerDocs(c.id);
                  const aprs = getCustomerAppraisals(c.id);
                  const cases = myCases.filter(cs => cs.customer_id === c.id);
                  return (
                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                        {(c.full_name || c.company || '?')[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: C.text }}>{c.type === 'kurumsal' ? c.company : c.full_name}</p>
                      </div>
                      <span className="text-xs" style={{ color: C.textDim }}>{docs.length} belge</span>
                      <span className="text-xs" style={{ color: C.textDim }}>{aprs.length} ekspertiz</span>
                      <span className="text-xs" style={{ color: C.textDim }}>{cases.length} dava</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </>
        )}
      </main>
      <MobileBottomNav items={lawyerNavItems} active={section} onChange={setSection}
        onHome={onHome} onLogout={handleLogout} />

      {/* Upload Modal */}
      <GecitKfzModal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Dosya Yükle">
        <div className="space-y-4">
          <Field label="Müşteri Seçin *">
            <SelectInput value={uploadForm.customer_id}
              onChange={(e) => setUploadForm(f => ({ ...f, customer_id: e.target.value }))}
              options={[{ value: '', label: 'Müşteri seçiniz...' }, ...myCustomers.map(c => ({ value: c.id, label: c.type === 'kurumsal' ? c.company : c.full_name }))]} />
          </Field>
          <Field label="Dosya Seç">
            <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleUpload}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:cursor-pointer"
              style={{ color: C.textDim }}
              disabled={!uploadForm.customer_id} />
          </Field>
          {!uploadForm.customer_id && <p className="text-xs" style={{ color: '#F59E0B' }}>Önce müşteri seçmelisiniz.</p>}
        </div>
      </GecitKfzModal>

      {/* Case Creation Modal */}
      <GecitKfzModal open={caseOpen} onClose={() => setCaseOpen(false)} title="Yeni Dava Dosyası">
        {<Iife>{() => {
          const [caseForm, setCaseForm] = React.useState({ title: '', customer_id: '', description: '', status: 'aktif' });
          const createCase = () => {
            if (!caseForm.title || !caseForm.customer_id) return;
            const cs = { id: 'case' + uid(), lawyer_id: user.lawyer_id, ...caseForm, created_at: new Date().toISOString() };
            const cust = (db.customers || []).find(c => c.id === caseForm.customer_id);
            const lbl = cust ? (cust.full_name || cust.company || cust.email) : caseForm.customer_id;
            // PDF olusturup musteri kartina yaz (genel kural: her evrak girisi PDF olur)
            const casePdf = buildCustomerPdfDoc({
              customer_id: caseForm.customer_id,
              customerLabel: lbl,
              title: 'Dava Dosyasi: ' + caseForm.title,
              body: `Dava Basligi: ${caseForm.title}\nDurum: ${caseForm.status}\n\nAciklama:\n${caseForm.description || '(aciklama yok)'}\n\nDava Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
              type: 'hukuki',
              signatureLine: 'Olusturan: ' + (lawyer?.name || user.name || '-') + ' (Avukat)',
              uploadedBy: user.lawyer_id,
            });
            setDb(withLog(
              prev => ({ ...prev, lawyer_cases: [...(prev.lawyer_cases || []), cs], customer_documents: [...(prev.customer_documents || []), casePdf] }),
              makeLogEntry({
                user: lawyerActor, action: 'note_create',
                target: { kind: 'customer', id: caseForm.customer_id, label: lbl },
                details: `Avukat ${lawyerActor.name} dava dosyası açtı: "${caseForm.title}" → ${lbl}`,
                metadata: { case_id: cs.id, case_status: caseForm.status },
              })
            ));
            setCaseOpen(false);
          };
          return (
            <div className="space-y-4">
              <Field label="Dava Başlığı *">
                <input value={caseForm.title} onChange={(e) => setCaseForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Örn: Kaza hasar davası"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
              </Field>
              <Field label="Müşteri *">
                <SelectInput value={caseForm.customer_id}
                  onChange={(e) => setCaseForm(f => ({ ...f, customer_id: e.target.value }))}
                  options={[{ value: '', label: 'Müşteri seçiniz...' }, ...myCustomers.map(c => ({ value: c.id, label: c.type === 'kurumsal' ? c.company : c.full_name }))]} />
              </Field>
              <Field label="Açıklama">
                <textarea value={caseForm.description} onChange={(e) => setCaseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Dava detayları..."
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
              </Field>
              <AdminButton variant="primary" onClick={createCase}>
                <FolderIcon size={14} /> Dava Oluştur
              </AdminButton>
            </div>
          );
        }}</Iife>}
      </GecitKfzModal>
    </div>
  );
}

// ─── PWA Install Prompt ─────────────────────────
function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsPWA(standalone);
    if (standalone) return; // Already installed

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Check if dismissed recently
    const dismissed = localStorage.getItem('gecit_kfz_pwa_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    if (ios) {
      // iOS: show Safari install instructions
      const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        setTimeout(() => setShow(true), 3000);
      }
    } else {
      // Android/Desktop: listen for beforeinstallprompt
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShow(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('gecit_kfz_pwa_dismissed', Date.now().toString());
  };

  if (!show || isPWA) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        style={{ position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 9999,
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.12)', borderRadius: 20,
          padding: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(227,6,19,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>
            📲
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A', marginBottom: 4 }}>
              Gecit Kfz Sachverständiger'u Ana Ekrana Ekle
            </div>
            {isIOS ? (
              <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5 }}>
                <span style={{ color: '#E30613' }}>Safari</span>'de alttaki{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(227,6,19,0.08)',
                  borderRadius: 6, padding: '2px 6px', fontSize: 12, verticalAlign: 'middle' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E30613" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </span>{' '}
                paylaş butonuna bas, sonra <strong style={{ color: '#0A0A0A' }}>"Ana Ekrana Ekle"</strong> seç.
                Push bildirimleri sadece PWA'da çalışır.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5 }}>
                Uygulamayı telefonuna yükle — push bildirimleri al, çevrimdışı çalış.
              </div>
            )}
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#6B6B6B',
            fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
        {!isIOS && deferredPrompt && (
          <button onClick={handleInstall}
            style={{ width: '100%', marginTop: 14, padding: '12px 0', borderRadius: 12,
              background: '#E30613',
              border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Şimdi Yükle
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Activity Log Panel (admin-only) ────────────
function ActivityLogPanel({ db, setDb }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [limit, setLimit] = useState(100);

  const allLogs = (db.activity_logs || []);
  const enriched = useMemo(() => allLogs.map(l => ({
    ...l,
    actor_role: l.actor_role || (l.user_id ? 'customer' : 'system'),
    actor_name: l.actor_name || 'Bilinmiyor',
    action: l.action || l.type || 'unknown',
    severity: l.severity || (ACTION_META[l.action || l.type]?.severity) || 'info',
    details: l.details || l.text || '',
  })), [allLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched
      .filter(l => roleFilter === 'all' || l.actor_role === roleFilter || (roleFilter === 'admin' && l.actor_role === 'super_admin'))
      .filter(l => actionFilter === 'all' || l.action === actionFilter)
      .filter(l => severityFilter === 'all' || l.severity === severityFilter)
      .filter(l => !q || (l.details || '').toLowerCase().includes(q) || (l.actor_name || '').toLowerCase().includes(q) || (l.target?.label || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [enriched, roleFilter, actionFilter, severityFilter, search]);

  const visible = filtered.slice(0, limit);

  const counts = useMemo(() => {
    const byRole = {};
    enriched.forEach(l => { byRole[l.actor_role] = (byRole[l.actor_role] || 0) + 1; });
    return { byRole, total: enriched.length };
  }, [enriched]);

  const exportCSV = () => {
    const rows = [['Tarih', 'Rol', 'Kullanıcı', 'İşlem', 'Hedef', 'Detay', 'Önem']];
    filtered.forEach(l => {
      rows.push([
        new Date(l.created_at).toLocaleString('tr-TR'),
        ACTOR_ROLES[l.actor_role]?.label || l.actor_role,
        l.actor_name,
        ACTION_META[l.action]?.label || l.action,
        l.target?.label || '',
        (l.details || '').replace(/"/g, '""'),
        l.severity,
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c)}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `aktivite_log_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (!window.confirm('Tüm aktivite kayıtları silinecek. Bu işlem geri alınamaz. Devam edilsin mi?')) return;
    setDb(prev => ({ ...prev, activity_logs: [] }));
  };

  const formatRelative = (iso) => {
    const d = new Date(iso); const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'az önce';
    if (diff < 3600) return Math.floor(diff / 60) + ' dk önce';
    if (diff < 86400) return Math.floor(diff / 3600) + ' sa önce';
    if (diff < 604800) return Math.floor(diff / 86400) + ' gün önce';
    return d.toLocaleDateString('tr-TR');
  };

  const roles = ['all', 'super_admin', 'admin', 'lawyer', 'customer', 'system'];
  const actionKeys = ['all', ...Array.from(new Set(enriched.map(l => l.action)))];
  const severities = ['all', 'info', 'warning', 'critical'];

  return (
    <>
      <AdminTopbar title="Aktivite Logları" subtitle={`${counts.total} kayıt · Sadece admin görür`}
        action={
          <div className="flex gap-2">
            <AdminButton size="sm" onClick={exportCSV} disabled={!filtered.length}>
              <DownloadIcon size={12} /> CSV İndir
            </AdminButton>
            <AdminButton variant="danger" size="sm" onClick={clearAll} disabled={!counts.total}>
              <TrashIcon size={12} /> Temizle
            </AdminButton>
          </div>
        } />

      {/* Filters */}
      <GlassCard className="mb-4" padding="p-4">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textDim }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Kullanıcı, hedef veya detay ara..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }} />
          </div>

          {/* Role filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {roles.map(r => {
              const meta = r === 'all' ? { label: 'Hepsi', color: C.text, bg: 'rgba(0,0,0,0.06)', border: C.border } : ACTOR_ROLES[r];
              if (!meta) return null;
              const cnt = r === 'all' ? counts.total : (counts.byRole[r] || 0) + (r === 'admin' ? (counts.byRole.super_admin || 0) : 0);
              const active = roleFilter === r;
              return (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5"
                  style={{
                    background: active ? meta.color : meta.bg,
                    color: active ? '#FFFFFF' : meta.color,
                    border: `1px solid ${active ? meta.color : (meta.border || C.border)}`,
                    fontWeight: active ? 600 : 500,
                  }}>
                  {meta.label}
                  <span className="font-mono opacity-80">{cnt}</span>
                </button>
              );
            })}
          </div>

          {/* Action + severity selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl outline-none cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }}>
              {actionKeys.map(a => (
                <option key={a} value={a} style={{ background: C.surface }}>
                  {a === 'all' ? '— Tüm İşlemler —' : (ACTION_META[a]?.label || a)}
                </option>
              ))}
            </select>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl outline-none cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }}>
              {severities.map(s => (
                <option key={s} value={s} style={{ background: C.surface }}>
                  {s === 'all' ? '— Tüm Önem Seviyeleri —' : s === 'info' ? 'Bilgi' : s === 'warning' ? 'Uyarı' : 'Kritik'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Logs */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <FileText size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
          <p style={{ color: C.textDim }} className="text-sm">
            {counts.total === 0 ? 'Henüz aktivite kaydı yok.' : 'Filtreyle eşleşen kayıt bulunamadı.'}
          </p>
        </GlassCard>
      ) : (
        <GlassCard padding="p-3">
          <div className="space-y-1.5">
            {visible.map(log => {
              const role = ACTOR_ROLES[log.actor_role] || ACTOR_ROLES.system;
              const action = ACTION_META[log.action] || { label: log.action, severity: log.severity };
              const sev = SEVERITY_META[log.severity] || SEVERITY_META.info;
              const isOpen = expandedId === log.id;
              const initial = (log.actor_name || '?').slice(0, 1).toUpperCase();
              return (
                <div key={log.id}
                  onClick={() => setExpandedId(isOpen ? null : log.id)}
                  className="rounded-xl p-3 cursor-pointer transition-colors hover:bg-black/[0.05]"
                  style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
                  <div className="flex items-start gap-3">
                    {/* Actor avatar */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs"
                      style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                      {initial}
                    </div>
                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate" style={{ color: C.text }}>{log.actor_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase" style={{ letterSpacing: '0.1em', background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                          {role.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}33` }}>
                          {action.label}
                        </span>
                        {log.target?.label && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.05)', color: C.textDim, border: `1px solid ${C.border}` }}>
                            → {log.target.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: C.textDim }}>{log.details}</p>
                      {/* Diff (before/after) */}
                      {isOpen && (log.before != null || log.after != null) && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {log.before != null && (
                            <div className="rounded-lg p-2 text-[11px] font-mono" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                              <p className="text-[9px] uppercase mb-1" style={{ letterSpacing: '0.15em', color: '#EF4444' }}>Önce</p>
                              {typeof log.before === 'object' ? JSON.stringify(log.before, null, 2) : String(log.before)}
                            </div>
                          )}
                          {log.after != null && (
                            <div className="rounded-lg p-2 text-[11px] font-mono" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', color: '#86EFAC' }}>
                              <p className="text-[9px] uppercase mb-1" style={{ letterSpacing: '0.15em', color: '#34D399' }}>Sonra</p>
                              {typeof log.after === 'object' ? JSON.stringify(log.after, null, 2) : String(log.after)}
                            </div>
                          )}
                        </div>
                      )}
                      {isOpen && log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 rounded-lg p-2 text-[11px] font-mono" style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}`, color: C.textDim }}>
                          <p className="text-[9px] uppercase mb-1" style={{ letterSpacing: '0.15em', color: C.text }}>Metadata</p>
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                    {/* Time */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[11px] whitespace-nowrap" style={{ color: C.textDim }}>{formatRelative(log.created_at)}</p>
                      <p className="text-[10px] font-mono whitespace-nowrap" style={{ color: C.textDim, opacity: 0.7 }}>
                        {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length > visible.length && (
            <div className="mt-3 text-center">
              <AdminButton size="sm" onClick={() => setLimit(l => l + 100)}>
                Mehr laden ({filtered.length - visible.length} weitere Einträge)
              </AdminButton>
            </div>
          )}
        </GlassCard>
      )}
    </>
  );
}

function AdminApp({ user, onLogout, onHome }) {
  const [section, setSection] = useState('home');
  const [db, setDb] = useDB();
  const [openCustomer, setOpenCustomer] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const sessionKey = 'gecit_kfz_session_logged_' + (user?.email || user?.id || 'anon');
    if (!sessionStorage.getItem(sessionKey)) {
      logActivity(setDb, makeLogEntry({
        user, action: 'login',
        details: `${user?.name || user?.email} hat sich im Admin-Panel angemeldet`,
      }));
      sessionStorage.setItem(sessionKey, '1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    const sessionKey = 'gecit_kfz_session_logged_' + (user?.email || user?.id || 'anon');
    sessionStorage.removeItem(sessionKey);
    logActivity(setDb, makeLogEntry({ user, action: 'logout', details: `${user?.name || user?.email} çıkış yaptı` }));
    onLogout();
  };

  const sectionLabels = {
    home: 'Übersicht', live: 'Live-Dashboard', bireysel: 'Privatkunden', kurumsal: 'Geschäftskunden',
    appointments: 'Terminplaner', appraisals: 'Gutachten-Infos', tuv: 'HU/AU-Tracking', invoices: 'Rechnungen',
    partners: 'Anwälte & Versicherungen', gallery: 'Galerie', reminders: 'Erinnerungen',
    file_flows: 'Dateifluss-Engine', whatsapp_tpl: 'WhatsApp-Vorlagen',
    activity_logs: 'Aktivitätsprotokolle', settings: 'Einstellungen',
  };
  const reminderCount = (db.reminders || []).filter(r => r.status === 'active').length;
  const adminNavItems = [
    { key: 'home',          label: 'Übersicht',           icon: LayoutDashboard },
    { key: 'live',          label: 'Live-Dashboard',     icon: ActivityIcon },
    { key: 'bireysel',      label: 'Privatkunden',       icon: UsersIcon },
    { key: 'kurumsal',      label: 'Geschäftskunden',     icon: Building },
    { key: 'appointments',  label: 'Termine',             icon: CalendarIcon },
    { key: 'tuv',           label: 'HU/AU-Tracking',      icon: Shield },
    { key: 'partners',      label: 'Anwälte & Versicherungen', icon: ScaleIcon },
    { key: 'gallery',       label: 'Galerie',             icon: CameraIcon },
    { key: 'reminders',     label: 'Erinnerungen',       icon: BellIcon, badge: reminderCount },
    { key: 'file_flows',    label: 'Dateifluss-Engine',   icon: Zap },
    { key: 'whatsapp_tpl',  label: 'WhatsApp-Vorlagen',  icon: MessageIcon },
    { key: 'activity_logs', label: 'Aktivitätsprotokolle', icon: EyeIcon },
    { key: 'settings',      label: 'Einstellungen',        icon: SettingsIcon },
  ];
  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: C.bg }}>
      <MobileTopbar onMenuClick={() => setMobileNavOpen(true)} role="admin"
        sectionLabel={sectionLabels[section] || 'Gecit Kfz'} onLogout={handleLogout} />
      <AdminSidebar active={section} onNav={setSection} user={user} onLogout={handleLogout} onHome={onHome}
        reminderCount={reminderCount}
        mobileOpen={mobileNavOpen} setMobileOpen={setMobileNavOpen} />
      <main className="flex-1 min-w-0 px-4 py-4 lg:px-8 lg:py-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)' }}>
        {section === 'home' && <AdminHome db={db} />}
        {section === 'live' && <AdminLiveDashboard db={db} setDb={setDb} />}
        {section === 'bireysel' && <CustomerListView title="Privatkunden" type="bireysel"
          subtitle="Privatkunden-Einträge" db={db} setDb={setDb} onOpenCustomer={setOpenCustomer} currentUser={user} />}
        {section === 'kurumsal' && <CustomerListView title="Geschäftskunden" type="kurumsal"
          subtitle="Autohäuser, Versicherungen und Flotten" db={db} setDb={setDb} onOpenCustomer={setOpenCustomer} currentUser={user} />}
        {section === 'appointments' && <AdminAppointments db={db} setDb={setDb} />}
        {section === 'tuv' && <AdminTuvTracking db={db} setDb={setDb} />}
        {section === 'partners' && <AdminPartners db={db} setDb={setDb} currentUser={user} />}
        {section === 'gallery' && <AdminGallery db={db} setDb={setDb} />}
        {section === 'reminders' && <AdminReminders db={db} setDb={setDb} />}
        {section === 'settings' && <AdminSettings user={user} db={db} setDb={setDb} />}



        {/* Activity Logs */}
        {/* ═══ Dosya Akış Motoru ═══ */}
        {section === 'file_flows' && (() => {
          const flows = db.file_flows || [];
          const triggerLabels = { ekspertiz_tamamlandi: 'Ekspertiz Tamamlandı', sigorta_teklif: 'Sigorta Teklifi Geldi', sigorta_red: 'Sigorta Reddi' };
          const actionLabels = { notify_customer: 'Müşteriye Bildir', send_to_insurance: 'Sigortaya İlet', notify_lawyer: 'Avukata Bildir', create_diff_report: 'Fark Raporu Oluştur', create_objection_draft: 'İtiraz Taslağı Oluştur' };
          const actionColors = { notify_customer: '#34D399', send_to_insurance: C.cyan, notify_lawyer: '#F59E0B', create_diff_report: C.magenta, create_objection_draft: '#EF4444' };

          const toggleFlow = (flowId) => {
            const flow = (db.file_flows || []).find(f => f.id === flowId);
            setDb(withLog(
              prev => ({ ...prev, file_flows: (prev.file_flows || []).map(f => f.id === flowId ? { ...f, active: !f.active } : f) }),
              makeLogEntry({
                user, action: 'flow_toggle',
                target: { kind: 'flow', id: flowId, label: flow?.label || flowId },
                details: `İş akışı ${flow?.active ? 'durduruldu' : 'aktifleştirildi'}: ${flow?.label || flowId}`,
                before: { active: flow?.active }, after: { active: !flow?.active },
              })
            ));
          };

          const simulateFlow = (flow) => {
            const entries = flow.actions.map(action => makeLogEntry({
              user, action: 'flow_exec',
              target: { kind: 'flow', id: flow.id, label: flow.label },
              details: `[AKIŞ] ${flow.label} → ${actionLabels[action] || action}`,
              metadata: { sub_action: action },
            }));
            setDb(withLogs(prev => prev, entries));
          };

          return (
            <>
              <AdminTopbar title="Dosya Akış Motoru" subtitle="Otomatik belge ve bildirim akışları" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Aktif Akış', value: flows.filter(f => f.active).length, color: '#34D399', icon: Zap },
                  { label: 'Toplam Akış', value: flows.length, color: C.cyan, icon: SettingsIcon },
                  { label: 'Son 24s Tetikleme', value: (db.activity_logs || []).filter(l => l.type === 'flow_exec' && new Date(l.created_at) > new Date(Date.now() - 86400000)).length, color: C.neon, icon: TrendingUp },
                ].map((s, i) => (
                  <GlassCard key={i}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs" style={{ color: C.textDim }}>{s.label}</span>
                      <s.icon size={16} style={{ color: s.color }} />
                    </div>
                    <p className="text-3xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  </GlassCard>
                ))}
              </div>

              <div className="space-y-4">
                {flows.map((flow, idx) => (
                  <motion.div key={flow.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}>
                    <GlassCard>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: flow.active ? 'rgba(52,211,153,0.1)' : 'rgba(0,0,0,0.05)',
                              border: `1px solid ${flow.active ? 'rgba(52,211,153,0.3)' : C.border}` }}>
                            <Zap size={18} style={{ color: flow.active ? '#34D399' : C.textDim }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: C.text }}>{flow.label}</p>
                            <p className="text-xs" style={{ color: C.textDim }}>Tetikleyici: {triggerLabels[flow.trigger] || flow.trigger}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleFlow(flow.id)}
                            className="w-12 h-6 rounded-full relative transition-all"
                            style={{ background: flow.active ? '#34D399' : 'rgba(255,255,255,0.1)' }}>
                            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
                              style={{ left: flow.active ? 26 : 2 }} />
                          </button>
                        </div>
                      </div>
                      {/* Flow actions pipeline */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: `${C.neon}15`, color: C.neon, border: `1px solid ${C.neon}33` }}>
                          {triggerLabels[flow.trigger]}
                        </div>
                        {flow.actions.map((action, ai) => (
                          <React.Fragment key={ai}>
                            <span style={{ color: C.textDim }}>→</span>
                            <div className="px-3 py-1.5 rounded-lg text-xs"
                              style={{ background: `${actionColors[action] || C.textDim}12`, color: actionColors[action] || C.textDim, border: `1px solid ${actionColors[action] || C.textDim}33` }}>
                              {actionLabels[action] || action}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <AdminButton size="sm" onClick={() => simulateFlow(flow)} disabled={!flow.active}>
                          <Zap size={12} /> Simüle Et
                        </AdminButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </>
          );
        })()}

        {/* ═══ WhatsApp Şablon Mesajları ═══ */}
        {section === 'whatsapp_tpl' && (
          <WhatsAppTemplatesSection db={db} setDb={setDb} />
        )}

        {section === 'activity_logs' && (
          <ActivityLogPanel db={db} setDb={setDb} />
        )}
      </main>
      <MobileBottomNav items={adminNavItems} active={section} onChange={setSection}
        onHome={onHome} onLogout={handleLogout} />
      {openCustomer && <CustomerDetailDrawer customer={openCustomer} db={db} setDb={setDb} onClose={() => setOpenCustomer(null)} currentUser={user} />}
    </div>
  );
}

// ─── Customer Portal ────────────────────────────
function CustomerApp({ user, onLogout, onHome }) {
  const [db, setDb] = useDB();
  const [section, setSection] = useState('overview');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyAppraisal, setSurveyAppraisal] = useState(null);
  const fileInputRef = useRef(null);
  const myRecord = db.customers.find(c => c.email.toLowerCase() === (user.email || '').toLowerCase())
    || { id: 'self', full_name: user.name || user.email, email: user.email, type: 'bireysel', phone: '—' };
  const customerActor = { id: myRecord.id, name: myRecord.full_name || myRecord.company || user.email, role: 'customer' };

  useEffect(() => {
    const sessionKey = 'gecit_kfz_session_logged_' + (user?.email || user?.id || 'anon');
    if (!sessionStorage.getItem(sessionKey)) {
      logActivity(setDb, makeLogEntry({
        user: customerActor, action: 'login',
        details: `Müşteri ${customerActor.name} portala giriş yaptı`,
      }));
      sessionStorage.setItem(sessionKey, '1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    const sessionKey = 'gecit_kfz_session_logged_' + (user?.email || user?.id || 'anon');
    sessionStorage.removeItem(sessionKey);
    logActivity(setDb, makeLogEntry({ user: customerActor, action: 'logout', details: `Müşteri ${customerActor.name} çıkış yaptı` }));
    onLogout();
  };
  const myVehicles = db.vehicles.filter(v => v.owner_id === myRecord.id);
  const myAppraisals = db.appraisals.filter(ap => myVehicles.some(v => v.id === ap.vehicle_id));
  const myInvoices = db.invoices.filter(i => i.customer_id === myRecord.id);
  const myDocs = (db.customer_documents || []).filter(d => d.customer_id === myRecord.id);
  const myMessages = (db.messages || []).filter(m => m.contact_id === myRecord.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const myNotifications = (db.notifications || []).filter(n => n.user_id === myRecord.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const unreadNotifs = myNotifications.filter(n => !n.read).length;
  const myAppointments = (db.appointments || []).filter(ap => ap.customer_id === myRecord.id || ap.email === myRecord.email);
  const myLoyalty = (db.loyalty_points || {})[myRecord.id] || { points: 0, history: [] };

  const today = new Date();
  const hour = today.getHours();
  let greeting = 'Günaydın';
  if (hour >= 12 && hour < 17) greeting = 'İyi Günler';
  else if (hour >= 17) greeting = 'İyi Akşamlar';

  // Document upload handler
  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const doc = {
          id: 'cd' + uid(),
          customer_id: myRecord.id,
          vehicle_id: myVehicles[0]?.id || '',
          name: file.name,
          type: 'diger',
          size: file.size,
          data: reader.result,
          uploaded_at: new Date().toISOString().slice(0, 10),
          mime: file.type,
          uploaded_by: 'customer',
        };
        setDb(withLog(
          prev => ({ ...prev, customer_documents: [...(prev.customer_documents || []), doc] }),
          makeLogEntry({
            user: customerActor, action: 'doc_upload',
            target: { kind: 'customer', id: myRecord.id, label: customerActor.name },
            details: `${customerActor.name} belge yükledi: ${file.name}`,
            metadata: { doc_id: doc.id, size: file.size },
          })
        ));
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const myClaims = (db.insurance_claims || []).filter(c => c.customer_id === myRecord.id);
  const myDamagePhotos = (db.damage_photos || []).filter(p => myVehicles.some(v => v.id === p.vehicle_id));
  const myTimeline = (db.damage_timeline || []).filter(t => t.customer_id === myRecord.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  const navItems = [
    { k: 'overview', l: 'Genel Bakış', icon: LayoutDashboard },
    { k: 'vehicles', l: 'Araçlarım', icon: CarIcon },
    { k: 'photos', l: 'Fotoğraflar', icon: CameraIcon, badge: myDamagePhotos.length },
    { k: 'insurance', l: 'Sigorta', icon: ShieldIcon, badge: myClaims.filter(c => c.status !== 'kapali').length },
    { k: 'documents', l: 'Belgelerim', icon: FileText, badge: myDocs.length },
    { k: 'messages', l: 'Mesajlar', icon: MessageIcon, badge: myMessages.filter(m => m.sender === 'admin' && !m.read_by_customer).length },
    { k: 'appointments', l: 'Randevularım', icon: CalendarIcon },
    { k: 'invoices', l: 'Faturalarım', icon: Receipt },
    { k: 'reports', l: 'Raporlar', icon: Wrench },
    { k: 'timeline', l: 'Geçmiş', icon: ClockIcon },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: C.bg }}>
      <MeshBackground />
      {/* Premium sticky header */}
      <header className="sticky top-[26px] z-30"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`,
          paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto px-3 md:px-4 lg:px-6 py-2 md:py-3 flex items-center gap-3 md:gap-4" style={{ maxWidth: 1400 }}>
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-shrink-0">
            <div className="flex items-center gap-0 font-mono text-lg md:text-xl flex-shrink-0" style={{ color: C.text }}>
              <span>GE</span>
              <span style={{ color: C.neon, textShadow: `0 0 12px ${C.glow}` }}>C</span>
              <span>IT</span>
              <span className="ml-2 lg:ml-3 text-[10px] md:text-xs px-2 lg:px-2.5 py-1 rounded-full font-medium hidden md:inline-flex flex-shrink-0 max-w-[180px] lg:max-w-[260px] truncate"
                style={{ color: C.cyan, border: `1px solid ${C.cyan}44`, background: 'rgba(0,0,0,0.04)', letterSpacing: '0.05em' }}
                title={myRecord.type === 'kurumsal' ? (myRecord.company || myRecord.full_name) : myRecord.full_name}>
                {myRecord.type === 'kurumsal' ? (myRecord.company || myRecord.full_name) : myRecord.full_name}
              </span>
            </div>
            {/* Mobile: show current section label */}
            <span className="md:hidden text-xs truncate px-2 py-1 rounded-full" style={{ color: C.cyan, border: `1px solid ${C.cyan}33`, background: 'rgba(0,0,0,0.03)', maxWidth: 120 }}>
              {navItems.find(n => n.k === section)?.l || 'Genel Bakış'}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-0.5 rounded-full p-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide"
            style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
            {navItems.map(t => (
              <button key={t.k} onClick={() => setSection(t.k)}
                className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-xs lg:text-sm transition-all relative flex-shrink-0"
                style={{
                  background: section === t.k ? `linear-gradient(135deg, ${C.neon}20, ${C.neon2}10)` : 'transparent',
                  color: section === t.k ? C.text : C.textDim,
                  border: section === t.k ? `1px solid ${C.neon}44` : '1px solid transparent',
                }}>
                <t.icon size={13} />
                <span className="whitespace-nowrap">{t.l}</span>
                {t.badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: C.magenta, color: '#fff' }}>{t.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Notification Bell */}
            <button onClick={() => setSection('notifications')} className="relative w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition"
              style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
              <BellIcon size={15} />
              {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: '#EF4444', color: '#fff' }}>{unreadNotifs}</span>}
            </button>
            {/* Ana Sayfa - her boyutta gozuksun */}
            <button onClick={onHome} title="Ana Sayfa"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors hover:bg-black/5"
              style={{ color: C.text, border: `1px solid ${C.neon}55`, background: 'rgba(227,6,19,0.06)' }}>
              <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-full"
              style={{ background: 'rgba(227,6,19,0.05)', border: `1px solid ${C.border}` }}>
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-mono text-[10px] md:text-xs"
                style={{ background: `linear-gradient(135deg, ${C.neon}, ${C.magenta})`, color: '#FFFFFF' }}>
                {(myRecord.full_name || 'M').slice(0,2).toUpperCase()}
              </div>
              <span className="hidden md:inline text-sm" style={{ color: C.text }}>{myRecord.full_name?.split(' ')[0]}</span>
            </div>
            {/* Cikis - her boyutta gozuksun */}
            <button onClick={handleLogout} title="Çıkış Yap"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:bg-red-500/10 text-xs"
              style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
              <LogOutIcon size={14} />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto px-4 lg:px-6 py-4 lg:py-8" style={{ maxWidth: 1200, zIndex: 2,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)' }}>

        {/* Overview Section */}
        {section === 'overview' && (
          <>
            {/* Welcome Hero */}
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl overflow-hidden mb-8 relative"
              style={{ background: `linear-gradient(135deg, ${C.neon}12, ${C.magenta}08, ${C.cyan}06)`,
                border: `1px solid ${C.border}` }}>
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${C.neon}22, transparent 70%)`, filter: 'blur(60px)' }} />
              <div className="relative p-8 md:p-10">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase mb-4"
                  style={{ background: 'rgba(227,6,19,0.07)', border: `1px solid ${C.neon}33`, color: C.neon, letterSpacing: '0.2em' }}>
                  <Sparkles size={12} /> {greeting}
                </motion.div>
                <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: C.text, letterSpacing: '-0.03em' }}>
                  {myRecord.full_name?.split(' ')[0] || 'Değerli Müşteri'}, portale hoş geldin
                </h1>
                <p className="text-base md:text-lg max-w-2xl" style={{ color: C.textDim }}>
                  Araçlarının ekspertiz sürecini canlı takip et, belgelerini yönet ve faturalarını görüntüle.
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <button onClick={() => {
                    const phone = '4917XXXXXXXX';
                    const text = encodeURIComponent(`Merhaba, ben ${myRecord.full_name}. Ekspertiz hakkında bilgi almak istiyorum.`);
                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                  }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                    style={{ background: '#25D366', color: '#fff', boxShadow: '0 4px 14px rgba(37,211,102,0.3)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp ile Ulaş
                  </button>
                  <button onClick={() => setSection('messages')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                    style={{ background: `${C.neon}18`, color: C.neon, border: `1px solid ${C.neon}44` }}>
                    <MessageIcon size={14} /> Portal Mesajı Gönder
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Kayıtlı Araç', value: myVehicles.length, icon: CarIcon, color: C.cyan },
                { label: 'Aktif Ekspertiz', value: myAppraisals.filter(a => a.status !== 'tamamlandi').length, icon: Wrench, color: C.neon },
                { label: 'Toplam Fatura', value: myInvoices.length, icon: Receipt, color: '#34D399' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }} whileHover={{ y: -4 }}>
                  <GlassCard>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}33`,
                          boxShadow: `0 0 20px ${s.color}15` }}>
                        <s.icon size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-3xl font-bold font-mono" style={{ color: C.text }}>{s.value}</p>
                        <p className="text-xs uppercase mt-1" style={{ color: C.textDim, letterSpacing: '0.15em' }}>{s.label}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Active Vehicle Cards with Progress */}
            {myVehicles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: C.text }}>Aktif Ekspertiz Süreçleri</h2>
                  <button onClick={() => setSection('vehicles')} className="text-xs flex items-center gap-1" style={{ color: C.neon }}>
                    Tümünü Gör <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myVehicles.slice(0, 2).map((v, idx) => {
                    const apr = myAppraisals.find(a => a.vehicle_id === v.id);
                    const stage = STAGES.find(s => s.key === (apr?.status || 'bekliyor'));
                    return (
                      <motion.div key={v.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.15 }}>
                        <GlassCard>
                          <div className="flex items-start justify-between mb-5">
                            <div>
                              <p className="font-mono text-2xl tracking-wider font-bold" style={{ color: C.text }}>{v.plate}</p>
                              <p className="text-sm mt-1" style={{ color: C.textDim }}>{v.brand} {v.model} · {v.year}</p>
                            </div>
                            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                              style={{ background: `${stage.color}15`, color: stage.color, border: `1px solid ${stage.color}44`,
                                boxShadow: `0 0 12px ${stage.color}22` }}>
                              {stage.label}
                            </span>
                          </div>
                          {/* Step Progress */}
                          <div className="flex items-center gap-1 mb-3">
                            {STAGES.map((s, sIdx) => (
                              <React.Fragment key={s.key}>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                  transition={{ delay: 0.8 + sIdx * 0.1 }}
                                  className="flex items-center justify-center rounded-full flex-shrink-0"
                                  style={{
                                    width: 32, height: 32,
                                    background: s.pct <= stage.pct ? `${stage.color}20` : 'rgba(0,0,0,0.05)',
                                    border: `2px solid ${s.pct <= stage.pct ? stage.color : C.border}`,
                                    boxShadow: s.key === stage.key ? `0 0 12px ${stage.color}66` : 'none',
                                  }}>
                                  {s.pct <= stage.pct ? (
                                    <Check size={14} style={{ color: stage.color }} />
                                  ) : (
                                    <span className="text-[10px] font-mono" style={{ color: C.textDim }}>{sIdx + 1}</span>
                                  )}
                                </motion.div>
                                {sIdx < STAGES.length - 1 && (
                                  <div className="flex-1 h-0.5 rounded-full"
                                    style={{ background: s.pct < stage.pct ? stage.color : 'rgba(0,0,0,0.06)',
                                      boxShadow: s.pct < stage.pct ? `0 0 6px ${stage.color}44` : 'none' }} />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="flex justify-between text-[9px] uppercase px-1"
                            style={{ color: C.textDim, letterSpacing: '0.1em' }}>
                            {STAGES.map(s => (
                              <span key={s.key} className="text-center" style={{ color: s.pct <= stage.pct ? stage.color : C.textDim, maxWidth: 60 }}>
                                {s.label.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                          {apr?.notes && (
                            <div className="mt-4 p-3 rounded-xl text-sm flex items-start gap-2"
                              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
                              <FileText size={14} style={{ color: C.neon, marginTop: 2, flexShrink: 0 }} />
                              <span style={{ color: C.textDim }}>{apr.notes}</span>
                            </div>
                          )}
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {myVehicles.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <GlassCard className="text-center py-16">
                  <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `linear-gradient(135deg, ${C.neon}15, ${C.cyan}10)`, border: `1px solid ${C.neon}33` }}>
                    <CarIcon size={36} style={{ color: C.neon }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: C.text }}>Henüz araç kaydın yok</h3>
                  <p className="text-sm max-w-md mx-auto" style={{ color: C.textDim }}>
                    Online termin aldığında veya admin tarafından araç eklendiğinde buradan canlı takip edebileceksin.
                  </p>
                  <div className="mt-6">
                    <MagneticButton variant="primary" ariaLabel="Termin Al" onClick={() => window.dispatchEvent(new CustomEvent('gecit-kfz:book'))}>
                      Online Termin Al <ArrowRight size={16} />
                    </MagneticButton>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </>
        )}

        {/* Vehicles Tab */}
        {section === 'vehicles' && (
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Araçlarım</h2>
                <p className="text-sm mt-1" style={{ color: C.textDim }}>{myVehicles.length} kayıtlı araç</p>
              </div>
            </motion.div>
            {myVehicles.length === 0 ? (
              <GlassCard className="text-center py-16">
                <CarIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p style={{ color: C.textDim }}>Henüz kayıtlı aracın yok.</p>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {myVehicles.map((v, idx) => {
                  const apr = myAppraisals.find(a => a.vehicle_id === v.id);
                  const stage = STAGES.find(s => s.key === (apr?.status || 'bekliyor'));
                  return (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}>
                      <GlassCard>
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(0,0,0,0.04)', color: C.cyan, border: `1px solid rgba(0,0,0,0.08)` }}>
                              <CarIcon size={24} />
                            </div>
                            <div>
                              <p className="font-mono text-xl tracking-wider font-bold" style={{ color: C.text }}>{v.plate}</p>
                              <p className="text-sm" style={{ color: C.textDim }}>{v.brand} {v.model} · {v.year}</p>
                              <p className="text-xs font-mono mt-1" style={{ color: C.textDim }}>Şasi: {v.chassis}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center text-xs mb-2">
                              <span style={{ color: C.textDim }}>Ekspertiz</span>
                              <span className="font-mono font-medium" style={{ color: stage.color }}>{stage.label} · %{stage.pct}</span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }}
                                transition={{ duration: 1.2, ease: easeOut }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${C.neon}, ${stage.color})`, boxShadow: `0 0 14px ${stage.color}88` }} />
                            </div>
                          </div>
                          <span className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0"
                            style={{ background: `${stage.color}15`, color: stage.color, border: `1px solid ${stage.color}44` }}>
                            {stage.label}
                          </span>
                        </div>
                        {apr?.notes && (
                          <p className="text-sm p-3 rounded-xl mt-4" style={{ background: 'rgba(0,0,0,0.04)', color: C.textDim, border: `1px solid ${C.border}` }}>
                            {apr.notes}
                          </p>
                        )}
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Documents Tab — Functional Upload + List */}
        {section === 'documents' && <Iife>{() => {
          const [qrModal, setQrModal] = React.useState(false);
          const [qrDocId, setQrDocId] = React.useState(null);
          const qrCanvasRef = React.useRef(null);

          // Simple QR code generator using canvas
          const generateQR = (text) => {
            const canvas = qrCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            // Simple visual QR pattern (placeholder — in production use qrcode library)
            ctx.fillStyle = '#000000';
            const moduleSize = 4;
            const data = text.split('').map(c => c.charCodeAt(0));
            // Position patterns (corners)
            const drawFinder = (x, y) => {
              ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
              ctx.fillStyle = '#000000';
              ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
            };
            drawFinder(8, 8);
            drawFinder(size - 36, 8);
            drawFinder(8, size - 36);
            // Data area
            for (let i = 0; i < data.length && i < 400; i++) {
              const byte = data[i % data.length];
              for (let bit = 0; bit < 8; bit++) {
                if ((byte >> bit) & 1) {
                  const col = ((i * 8 + bit) % 30) + 10;
                  const row = Math.floor((i * 8 + bit) / 30) + 10;
                  if (col < 48 && row < 48) {
                    ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
                  }
                }
              }
            }
          };

          React.useEffect(() => {
            if (qrModal && qrDocId) {
              const doc = myDocs.find(d => d.id === qrDocId);
              if (doc) {
                setTimeout(() => generateQR(`gecit-kfz://doc/${doc.id}/${doc.name}`), 100);
              }
            }
          }, [qrModal, qrDocId]);

          return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Belgelerim</h2>
                <p className="text-sm mt-1" style={{ color: C.textDim }}>{myDocs.length} belge yüklendi</p>
              </div>
              <div className="flex items-center gap-2">
                <AdminButton variant="primary" onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon size={14} /> Belge Yükle
                </AdminButton>
              </div>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleDocUpload} style={{ display: 'none' }} />
            </div>

            {/* Upload Zone */}
            <GlassCard className="mb-6">
              <div className="rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-black/[0.03]"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = C.neon; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = C.border; const dt = e.dataTransfer; if (dt.files.length) { const inp = fileInputRef.current; const dT = new DataTransfer(); Array.from(dt.files).forEach(f => dT.items.add(f)); inp.files = dT.files; handleDocUpload({ target: inp }); }}}
                style={{ border: `2px dashed ${C.border}` }}>
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `linear-gradient(135deg, ${C.neon}15, ${C.magenta}10)`, color: C.neon, border: `1px solid ${C.neon}33` }}>
                  <UploadIcon size={28} />
                </div>
                <p className="text-sm" style={{ color: C.text }}>Sürükle & Bırak veya tıkla</p>
                <p className="text-xs mt-1" style={{ color: C.textDim }}>PDF, PNG, JPG, DOC — max 10MB</p>
              </div>
            </GlassCard>

            {/* Document List */}
            {myDocs.length > 0 && (
              <div className="space-y-3">
                {myDocs.map((doc, idx) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}>
                    <GlassCard padding="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: doc.mime?.startsWith('image') ? 'rgba(0,0,0,0.05)' : 'rgba(227,6,19,0.07)',
                            color: doc.mime?.startsWith('image') ? C.cyan : C.neon }}>
                          <FileText size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: C.text }}>{doc.name}</p>
                          <p className="text-xs" style={{ color: C.textDim }}>{doc.uploaded_at} · {doc.size < 1048576 ? (doc.size / 1024).toFixed(1) + ' KB' : (doc.size / 1048576).toFixed(1) + ' MB'}</p>
                        </div>
                        <button onClick={() => { setQrDocId(doc.id); setQrModal(true); }}
                          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                          style={{ color: C.cyan, border: `1px solid ${C.border}` }} title="QR ile Paylaş">
                          <QrCodeIcon size={16} />
                        </button>
                        {doc.data && (
                          <a href={doc.data} download={doc.name}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 transition"
                            style={{ color: C.neon, border: `1px solid ${C.border}` }}>
                            <DownloadIcon size={16} />
                          </a>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
            {myDocs.length === 0 && (
              <GlassCard className="text-center py-10">
                <FileText size={36} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p style={{ color: C.textDim }} className="text-sm">Henüz belge yüklemediniz.</p>
              </GlassCard>
            )}

            {/* QR Code Modal */}
            <GecitKfzModal open={qrModal} onClose={() => { setQrModal(false); setQrDocId(null); }} title="QR ile Paylaş" subtitle="Bu QR kodu taratarak belgeye erişin">
              <div className="text-center">
                <div className="inline-block p-4 rounded-2xl mb-4" style={{ background: '#fff' }}>
                  <canvas ref={qrCanvasRef} width="200" height="200" style={{ display: 'block' }} />
                </div>
                {qrDocId && (() => {
                  const doc = myDocs.find(d => d.id === qrDocId);
                  return doc ? (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: C.text }}>{doc.name}</p>
                      <p className="text-xs mb-4" style={{ color: C.textDim }}>Bu QR kodu sigortacı veya avukatınıza göstererek belgeyi paylaşabilirsiniz.</p>
                      <div className="flex items-center justify-center gap-2">
                        {doc.data && (
                          <AdminButton size="sm" variant="primary" onClick={() => {
                            const a = document.createElement('a');
                            a.href = doc.data; a.download = doc.name; a.click();
                          }}>
                            <DownloadIcon size={14} /> İndir
                          </AdminButton>
                        )}
                        <AdminButton size="sm" onClick={() => {
                          const phone = '4917XXXXXXXX';
                          const text = encodeURIComponent(`Merhaba, "${doc.name}" belgesini paylaşmak istiyorum. (Dosya ID: ${doc.id})`);
                          window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                        }}>
                          WhatsApp ile Gönder
                        </AdminButton>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </GecitKfzModal>
          </motion.div>
          );
        }}</Iife>}

        {/* Messages Tab — Chat with Admin */}
        {section === 'messages' && <Iife>{() => {
          const [msgText, setMsgText] = React.useState('');
          const messagesEndRef = React.useRef(null);
          React.useEffect(() => {
            if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            // Mark admin messages as read
            const unread = myMessages.filter(m => m.sender === 'admin' && !m.read_by_customer);
            if (unread.length > 0) {
              setDb(prev => ({
                ...prev,
                messages: (prev.messages || []).map(m => unread.find(u => u.id === m.id) ? { ...m, read_by_customer: true } : m)
              }));
            }
          }, [myMessages.length]);
          const sendMessage = () => {
            const txt = msgText.trim();
            if (!txt) return;
            const msg = {
              id: 'msg' + uid(),
              contact_id: myRecord.id,
              contact_type: 'customer',
              sender: 'customer',
              sender_name: myRecord.full_name,
              text: txt,
              created_at: new Date().toISOString(),
            };
            setDb(prev => ({ ...prev, messages: [...(prev.messages || []), msg] }));
            setMsgText('');
          };
          const groupByDate = (msgs) => {
            const groups = {};
            msgs.forEach(m => {
              const d = new Date(m.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
              if (!groups[d]) groups[d] = [];
              groups[d].push(m);
            });
            return groups;
          };
          const dateGroups = groupByDate(myMessages);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col" style={{ height: 'calc(100vh - 150px - env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Mesajlar</h2>
                  <p className="text-sm" style={{ color: C.textDim }}>Gecit Kfz Sachverständiger ile iletişim</p>
                </div>
                {/* Kapat / Genel bakisa don */}
                <button onClick={() => setSection('overview')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition hover:scale-[1.02] flex-shrink-0"
                  style={{ background: 'rgba(227,6,19,0.07)', color: C.text,
                    border: `1px solid ${C.neon}55` }}>
                  <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
                  <span className="hidden sm:inline">Genel Bakış</span>
                  <span className="sm:hidden">Kapat</span>
                </button>
              </div>
              <GlassCard padding="p-0" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {myMessages.length === 0 && (
                    <div className="text-center py-12">
                      <MessageIcon size={36} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                      <p className="text-sm" style={{ color: C.textDim }}>Henüz mesaj yok. Bir soru sorun, size yardımcı olalım.</p>
                    </div>
                  )}
                  {Object.entries(dateGroups).map(([date, msgs]) => (
                    <React.Fragment key={date}>
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px" style={{ background: C.border }} />
                        <span className="text-[10px] uppercase px-3 py-1 rounded-full" style={{ color: C.textDim, background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>{date}</span>
                        <div className="flex-1 h-px" style={{ background: C.border }} />
                      </div>
                      {msgs.map(m => (
                        <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[75%] rounded-2xl px-4 py-3"
                            style={{
                              background: m.sender === 'customer' ? `linear-gradient(135deg, ${C.neon}25, ${C.neon2}15)` : 'rgba(0,0,0,0.05)',
                              border: `1px solid ${m.sender === 'customer' ? C.neon + '44' : C.border}`,
                              borderBottomRightRadius: m.sender === 'customer' ? 4 : 16,
                              borderBottomLeftRadius: m.sender === 'admin' ? 4 : 16,
                            }}>
                            <p className="text-sm" style={{ color: C.text, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                            <p className="text-[10px] mt-1.5 text-right" style={{ color: C.textDim }}>
                              {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 flex items-end gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                    placeholder="Mesajınızı yazın..."
                    rows={1}
                    className="flex-1 rounded-xl px-4 py-3 text-sm resize-none outline-none"
                    style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text, maxHeight: 120 }} />
                  <button onClick={sendMessage}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${C.neon}, ${C.neon2})`, color: '#fff' }}>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        }}</Iife>}

        {/* Appointments Tab */}
        {section === 'appointments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Randevularım</h2>
                <p className="text-sm mt-1" style={{ color: C.textDim }}>{myAppointments.length} randevu</p>
              </div>
              <AdminButton variant="primary" onClick={() => setBookingOpen(true)}>
                <CalendarIcon size={14} /> Yeni Randevu
              </AdminButton>
            </div>
            {myAppointments.length === 0 ? (
              <GlassCard className="text-center py-16">
                <CalendarIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p className="text-lg font-medium mb-2" style={{ color: C.text }}>Randevunuz bulunmuyor</p>
                <p className="text-sm mb-6" style={{ color: C.textDim }}>Online termin alarak araç ekspertizinizi planlayın.</p>
                <MagneticButton variant="primary" ariaLabel="Randevu Al" onClick={() => setBookingOpen(true)}>
                  Termin Al <ArrowRight size={16} />
                </MagneticButton>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((apt, idx) => {
                  const isPast = new Date(apt.date) < new Date(new Date().toISOString().slice(0, 10));
                  const statusColor = isPast ? '#6B7280' : apt.status === 'iptal' ? '#EF4444' : '#34D399';
                  return (
                    <motion.div key={apt.id || idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}>
                      <GlassCard padding="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
                              style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}33` }}>
                              <span className="text-lg font-bold font-mono" style={{ color: statusColor }}>{new Date(apt.date).getDate()}</span>
                              <span className="text-[9px] uppercase" style={{ color: statusColor }}>{new Date(apt.date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: C.text }}>{apt.service || 'Ekspertiz'}</p>
                              <p className="text-sm" style={{ color: C.textDim }}>{apt.date} · Saat {apt.time}</p>
                              {apt.plate && <p className="text-xs font-mono mt-1" style={{ color: C.cyan }}>{apt.plate}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-3 py-1.5 rounded-full"
                              style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}44` }}>
                              {isPast ? 'Tamamlandı' : apt.status === 'iptal' ? 'İptal Edildi' : 'Aktif'}
                            </span>
                            {!isPast && apt.status !== 'iptal' && (
                              <AdminButton size="sm" onClick={() => {
                                if (confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) {
                                  setDb(prev => ({
                                    ...prev,
                                    appointments: (prev.appointments || []).map(a => a.id === apt.id ? { ...a, status: 'iptal' } : a)
                                  }));
                                }
                              }}>
                                <XClose size={14} /> İptal
                              </AdminButton>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Invoices Tab — Enhanced with PDF + Payment */}
        {section === 'invoices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Faturalarım</h2>
                <p className="text-sm mt-1" style={{ color: C.textDim }}>{myInvoices.length} fatura · Toplam: €{myInvoices.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString('tr-TR')}</p>
              </div>
            </div>
            {myInvoices.length === 0 ? (
              <GlassCard className="text-center py-16">
                <Receipt size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p className="text-lg font-medium mb-1" style={{ color: C.text }}>Fatura bulunmuyor</p>
                <p style={{ color: C.textDim }} className="text-sm">Ekspertiz tamamlandığında faturalarınız burada görünecek.</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {[...myInvoices]
                  .sort((a, b) => {
                    if (!!b.favorite !== !!a.favorite) return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
                    return new Date(b.date || 0) - new Date(a.date || 0);
                  })
                  .map((inv, idx) => {
                  const generateInvoicePDF = () => {
                    const doc = new jsPDF();
                    doc.setFontSize(20);
                    doc.text('Gecit Kfz Sachverständiger', 20, 25);
                    doc.setFontSize(12);
                    doc.text('Fatura / Rechnung', 20, 35);
                    doc.setFontSize(10);
                    doc.text(`Fatura No: ${inv.no}`, 20, 50);
                    doc.text(`Tarih: ${inv.date}`, 20, 57);
                    doc.text(`Müşteri: ${myRecord.full_name || myRecord.company}`, 20, 64);
                    doc.text(`Durum: ${inv.status}`, 20, 71);
                    doc.line(20, 78, 190, 78);
                    doc.setFontSize(14);
                    doc.text(`Toplam: €${inv.amount.toLocaleString('tr-TR')}`, 20, 90);
                    doc.setFontSize(8);
                    doc.text('Gecit Kfz Sachverständiger · Alle Rechte vorbehalten', 20, 280);
                    doc.save(`Fatura_${inv.no}.pdf`);
                  };
                  const toggleFav = () => {
                    const next = !inv.favorite;
                    setDb(withLog(
                      prev => ({ ...prev, invoices: (prev.invoices || []).map(x => x.id === inv.id ? { ...x, favorite: next } : x) }),
                      makeLogEntry({
                        user: customerActor, action: 'invoice_status',
                        target: { kind: 'invoice', id: inv.id, label: inv.no },
                        details: `${inv.no} ${next ? 'favorilere eklendi' : 'favorilerden çıkarıldı'} (${customerActor.name})`,
                        before: { favorite: !next }, after: { favorite: next },
                      })
                    ));
                  };
                  return (
                    <motion.div key={inv.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}>
                      <GlassCard>
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap"
                          style={inv.favorite ? { boxShadow: '0 0 0 1px rgba(245,158,11,0.35) inset', borderRadius: 12, padding: 4 } : {}}>
                          <button onClick={toggleFav}
                            title={inv.favorite ? 'Favoriden çıkar' : 'Favorilere ekle'}
                            aria-pressed={!!inv.favorite}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 hover:scale-110"
                            style={{
                              background: inv.favorite ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.04)',
                              color: inv.favorite ? '#F59E0B' : C.textDim,
                              border: `1px solid ${inv.favorite ? '#F59E0B66' : C.border}`,
                            }}>
                            <StarIcon size={16} filled={!!inv.favorite} />
                          </button>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: inv.status === 'ödendi' ? 'rgba(52,211,153,0.1)' : 'rgba(227,6,19,0.07)',
                              color: inv.status === 'ödendi' ? '#34D399' : C.magenta,
                              border: `1px solid ${inv.status === 'ödendi' ? 'rgba(52,211,153,0.25)' : 'rgba(227,6,19,0.18)'}` }}>
                            <Receipt size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-medium truncate" style={{ color: C.text }}>{inv.no}</p>
                            <p className="text-xs mt-1" style={{ color: C.textDim }}>{inv.date}</p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full capitalize"
                            style={{ background: inv.status === 'ödendi' ? 'rgba(52,211,153,0.1)' : 'rgba(227,6,19,0.07)',
                              color: inv.status === 'ödendi' ? '#34D399' : C.magenta,
                              border: `1px solid ${inv.status === 'ödendi' ? 'rgba(52,211,153,0.3)' : 'rgba(227,6,19,0.20)'}` }}>
                            {inv.status}
                          </span>
                          <p className="font-mono text-lg font-bold" style={{ color: C.text }}>€{inv.amount.toLocaleString('tr-TR')}</p>
                          <AdminButton size="sm" onClick={generateInvoicePDF}><DownloadIcon size={14} /> PDF</AdminButton>
                          {inv.status !== 'ödendi' && (
                            <AdminButton size="sm" variant="primary" onClick={() => {
                              const phone = '4917XXXXXXXX'; // Gecit Kfz Sachverständiger WhatsApp numarası
                              const text = encodeURIComponent(`Merhaba, ${inv.no} numaralı fatura hakkında bilgi almak istiyorum. Tutar: €${inv.amount}`);
                              window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                            }}>
                              WhatsApp ile Sor
                            </AdminButton>
                          )}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Reports Tab — Ekspertiz Rapor + Boya Haritası */}
        {section === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Ekspertiz Raporları</h2>
                <p className="text-sm mt-1" style={{ color: C.textDim }}>Araçlarınızın ekspertiz sonuçları ve boya haritaları</p>
              </div>
            </div>
            {myAppraisals.length === 0 ? (
              <GlassCard className="text-center py-16">
                <Wrench size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p className="text-lg font-medium mb-1" style={{ color: C.text }}>Rapor bulunmuyor</p>
                <p style={{ color: C.textDim }} className="text-sm">Ekspertiz tamamlandığında raporlarınız burada görünecek.</p>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {myAppraisals.map((apr, idx) => {
                  const vehicle = myVehicles.find(v => v.id === apr.vehicle_id);
                  const stage = STAGES.find(s => s.key === (apr.status || 'bekliyor'));
                  const paintMap = db.paint_maps?.[apr.vehicle_id] || {};
                  const hasPaintData = Object.keys(paintMap).length > 0;
                  return (
                    <motion.div key={apr.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}>
                      <GlassCard>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-mono text-xl tracking-wider font-bold" style={{ color: C.text }}>
                              {vehicle?.plate || 'Araç'}
                            </p>
                            <p className="text-sm" style={{ color: C.textDim }}>
                              {vehicle?.brand} {vehicle?.model} · {vehicle?.year}
                            </p>
                          </div>
                          <span className="text-xs px-3 py-1.5 rounded-full"
                            style={{ background: `${stage.color}15`, color: stage.color, border: `1px solid ${stage.color}44` }}>
                            {stage.label}
                          </span>
                        </div>

                        {/* Appraisal Details */}
                        {apr.status === 'tamamlandi' && (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {[
                                { l: 'Kilometre', v: vehicle?.km ? vehicle.km.toLocaleString('tr-TR') + ' km' : '—' },
                                { l: 'Şasi No', v: vehicle?.chassis || '—' },
                                { l: 'Tarih', v: apr.date || '—' },
                                { l: 'Uzman', v: apr.expert || 'Gecit Kfz' },
                              ].map((d, i) => (
                                <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
                                  <p className="text-[10px] uppercase" style={{ color: C.textDim, letterSpacing: '0.12em' }}>{d.l}</p>
                                  <p className="text-sm font-mono mt-1" style={{ color: C.text }}>{d.v}</p>
                                </div>
                              ))}
                            </div>
                            {apr.notes && (
                              <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
                                <p className="text-xs uppercase mb-2" style={{ color: C.textDim, letterSpacing: '0.12em' }}>Notlar</p>
                                <p className="text-sm" style={{ color: C.text }}>{apr.notes}</p>
                              </div>
                            )}

                            {/* Read-only Paint Map */}
                            {hasPaintData && (
                              <div className="mt-4">
                                <p className="text-xs uppercase mb-3 flex items-center gap-2" style={{ color: C.textDim, letterSpacing: '0.12em' }}>
                                  <Wrench size={12} /> Boya Kalınlık Haritası
                                </p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                  {Object.entries(paintMap).map(([part, data]) => {
                                    const statusObj = PAINT_STATUSES.find(s => s.key === data.status) || PAINT_STATUSES[0];
                                    const partObj = CAR_PARTS.find(p => p.key === part);
                                    return (
                                      <div key={part} className="p-2.5 rounded-xl text-center"
                                        style={{ background: statusObj.bg, border: `1px solid ${statusObj.border}` }}>
                                        <p className="text-[10px]" style={{ color: C.textDim }}>{partObj?.label || part}</p>
                                        <p className="text-xs font-bold mt-0.5" style={{ color: statusObj.color }}>{statusObj.short}</p>
                                        {data.thickness && <p className="text-[9px] font-mono" style={{ color: C.textDim }}>{data.thickness}μm</p>}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {PAINT_STATUSES.map(s => (
                                    <span key={s.key} className="text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1"
                                      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-5">
                              <AdminButton variant="primary" onClick={() => {
                                if (typeof generateGutachtenPDF === 'function') {
                                  generateGutachtenPDF(vehicle, apr, paintMap);
                                } else {
                                  alert('PDF raporu oluşturuluyor...');
                                }
                              }}>
                                <DownloadIcon size={14} /> Rapor İndir (PDF)
                              </AdminButton>
                              {/* Satisfaction Survey */}
                              {!(db.satisfaction_surveys || []).find(s => s.appraisal_id === apr.id) && (
                                <AdminButton onClick={() => { setSurveyAppraisal(apr); setSurveyOpen(true); }}>
                                  Memnuniyet Anketi
                                </AdminButton>
                              )}
                            </div>
                          </>
                        )}

                        {apr.status !== 'tamamlandi' && (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                              <div className="h-full rounded-full" style={{ width: `${stage.pct}%`, background: `linear-gradient(90deg, ${C.neon}, ${stage.color})` }} />
                            </div>
                            <span className="text-xs font-mono" style={{ color: stage.color }}>%{stage.pct}</span>
                          </div>
                        )}
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ Hasar Fotoğraf Galerisi — Önce/Sonra Karşılaştırma ═══ */}
        {section === 'photos' && <Iife>{() => {
          const [selectedVehicle, setSelVeh] = React.useState(myVehicles[0]?.id || '');
          const [compareMode, setCompareMode] = React.useState(false);
          const [lightbox, setLightbox] = React.useState(null);
          const photos = myDamagePhotos.filter(p => !selectedVehicle || p.vehicle_id === selectedVehicle);
          const beforePhotos = photos.filter(p => p.type === 'before');
          const afterPhotos = photos.filter(p => p.type === 'after');
          const detailPhotos = photos.filter(p => p.type === 'detail');
          const parts = [...new Set(photos.map(p => p.part).filter(Boolean))];

          const PhotoCard = ({ photo, idx }) => {
            const colors = { before: '#EF4444', after: '#34D399', detail: C.cyan };
            const labels = { before: 'ÖNCE', after: 'SONRA', detail: 'DETAY' };
            return (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }} whileHover={{ y: -4, scale: 1.02 }}
                className="cursor-pointer group" onClick={() => setLightbox(photo)}>
                <div className="rounded-2xl overflow-hidden relative aspect-[4/3]"
                  style={{ background: `linear-gradient(135deg, ${colors[photo.type]}08, ${colors[photo.type]}04)`,
                    border: `1px solid ${colors[photo.type]}33` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <CameraIcon size={40} style={{ color: colors[photo.type] + '44', margin: '0 auto' }} />
                      <p className="text-[10px] mt-2" style={{ color: C.textDim }}>Fotoğraf Alanı</p>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="text-[9px] px-2 py-1 rounded-full font-bold uppercase"
                      style={{ background: colors[photo.type] + '20', color: colors[photo.type], border: `1px solid ${colors[photo.type]}44`, letterSpacing: '0.1em' }}>
                      {labels[photo.type]}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3"
                    style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                    <p className="text-xs font-medium" style={{ color: '#fff' }}>{photo.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{photo.created_at}</p>
                  </div>
                </div>
              </motion.div>
            );
          };

          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Hasar Fotoğrafları</h2>
                  <p className="text-sm mt-1" style={{ color: C.textDim }}>{photos.length} fotoğraf · Önce/Sonra karşılaştırma</p>
                </div>
                <div className="flex items-center gap-2">
                  {myVehicles.length > 1 && (
                    <select value={selectedVehicle} onChange={e => setSelVeh(e.target.value)}
                      className="rounded-lg px-3 py-2 text-xs outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }}>
                      {myVehicles.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
                    </select>
                  )}
                  <AdminButton variant={compareMode ? 'primary' : 'ghost'} size="sm" onClick={() => setCompareMode(!compareMode)}>
                    {compareMode ? '✕ Kapat' : '⇄ Karşılaştır'}
                  </AdminButton>
                </div>
              </div>

              {/* Compare Mode — Side by Side */}
              {compareMode && parts.length > 0 && (
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} />
                    <span className="text-xs uppercase font-bold" style={{ color: '#EF4444', letterSpacing: '0.1em' }}>Önce</span>
                    <span className="text-xs mx-2" style={{ color: C.textDim }}>vs</span>
                    <div className="w-3 h-3 rounded-full" style={{ background: '#34D399' }} />
                    <span className="text-xs uppercase font-bold" style={{ color: '#34D399', letterSpacing: '0.1em' }}>Sonra</span>
                  </div>
                  {parts.map(part => {
                    const bef = photos.find(p => p.part === part && p.type === 'before');
                    const aft = photos.find(p => p.part === part && p.type === 'after');
                    const partObj = CAR_PARTS.find(cp => cp.key === part);
                    return (
                      <GlassCard key={part}>
                        <p className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: C.text }}>
                          <Wrench size={14} style={{ color: C.neon }} /> {partObj?.label || part}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {bef ? <PhotoCard photo={bef} idx={0} /> : (
                            <div className="rounded-2xl aspect-[4/3] flex items-center justify-center"
                              style={{ background: 'rgba(239,68,68,0.04)', border: `1px dashed rgba(239,68,68,0.3)` }}>
                              <span className="text-xs" style={{ color: '#EF4444' }}>Önce fotoğrafı yok</span>
                            </div>
                          )}
                          {aft ? <PhotoCard photo={aft} idx={1} /> : (
                            <div className="rounded-2xl aspect-[4/3] flex items-center justify-center"
                              style={{ background: 'rgba(52,211,153,0.04)', border: `1px dashed rgba(52,211,153,0.3)` }}>
                              <span className="text-xs" style={{ color: '#34D399' }}>Sonra fotoğrafı yok</span>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}

              {/* Normal Gallery Grid */}
              {!compareMode && (
                <>
                  {beforePhotos.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#EF4444' }}>
                        <CameraIcon size={14} /> Hasar Öncesi ({beforePhotos.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {beforePhotos.map((p, i) => <PhotoCard key={p.id} photo={p} idx={i} />)}
                      </div>
                    </div>
                  )}
                  {afterPhotos.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#34D399' }}>
                        <CameraIcon size={14} /> Onarım Sonrası ({afterPhotos.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {afterPhotos.map((p, i) => <PhotoCard key={p.id} photo={p} idx={i} />)}
                      </div>
                    </div>
                  )}
                  {detailPhotos.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: C.cyan }}>
                        <CameraIcon size={14} /> Detay Fotoğrafları ({detailPhotos.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {detailPhotos.map((p, i) => <PhotoCard key={p.id} photo={p} idx={i} />)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {photos.length === 0 && (
                <GlassCard className="text-center py-16">
                  <CameraIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                  <p className="text-lg font-medium mb-1" style={{ color: C.text }}>Fotoğraf bulunmuyor</p>
                  <p style={{ color: C.textDim }} className="text-sm">Ekspertiz sırasında çekilen fotoğraflar burada görünecek.</p>
                </GlassCard>
              )}

              {/* Lightbox */}
              {lightbox && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}
                  onClick={() => setLightbox(null)}>
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="relative max-w-2xl w-full mx-4 rounded-2xl overflow-hidden"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}
                    onClick={e => e.stopPropagation()}>
                    <div className="aspect-video flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <CameraIcon size={60} style={{ color: C.textDim + '44' }} />
                    </div>
                    <div className="p-5">
                      <p className="font-medium" style={{ color: C.text }}>{lightbox.label}</p>
                      <p className="text-sm mt-1" style={{ color: C.textDim }}>{lightbox.created_at} · {lightbox.type === 'before' ? 'Hasar Öncesi' : lightbox.type === 'after' ? 'Onarım Sonrası' : 'Detay'}</p>
                    </div>
                    <button onClick={() => setLightbox(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                      <XClose size={16} />
                    </button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          );
        }}</Iife>}

        {/* ═══ Sigorta Talebi Yönetimi ═══ */}
        {section === 'insurance' && <Iife>{() => {
          const [claimModal, setClaimModal] = React.useState(false);
          const [claimVehicle, setClaimVehicle] = React.useState(myVehicles[0]?.id || '');
          const [claimDesc, setClaimDesc] = React.useState('');
          const [claimInsurer, setClaimInsurer] = React.useState('');
          const insurers = db.insurers || [];

          const submitClaim = () => {
            if (!claimVehicle || !claimDesc) return;
            const vehicle = myVehicles.find(v => v.id === claimVehicle);
            const apr = myAppraisals.find(a => a.vehicle_id === claimVehicle);
            const claim = {
              id: 'ic' + uid(),
              customer_id: myRecord.id,
              vehicle_id: claimVehicle,
              insurer_id: claimInsurer || null,
              appraisal_id: apr?.id || null,
              status: 'inceleniyor',
              claim_date: new Date().toISOString().slice(0, 10),
              damage_description: claimDesc,
              claim_amount: 0,
              offer_amount: null,
              notes: '',
            };
            const timelineEntry = {
              id: 'dt' + uid(),
              vehicle_id: claimVehicle,
              customer_id: myRecord.id,
              event: 'hasar_bildirimi',
              date: new Date().toISOString().slice(0, 10),
              description: `${myRecord.full_name} tarafından hasar bildirimi yapıldı: ${claimDesc.slice(0, 80)}`,
              actor: 'customer',
            };
            setDb(withLog(
              prev => ({
                ...prev,
                insurance_claims: [...(prev.insurance_claims || []), claim],
                damage_timeline: [...(prev.damage_timeline || []), timelineEntry],
                notifications: [...(prev.notifications || []), {
                  id: 'n' + uid(), user_id: myRecord.id, text: `Sigorta talebiniz oluşturuldu. Plaka: ${vehicle?.plate}`, read: false, created_at: new Date().toISOString()
                }],
              }),
              makeLogEntry({
                user: { ...user, ...myRecord },
                action: 'claim_create',
                target: { kind: 'claim', id: claim.id, label: vehicle?.plate || claim.id },
                details: `${myRecord.full_name} sigorta talebi oluşturdu — ${vehicle?.plate || ''} · ${claimDesc.slice(0, 60)}`,
              })
            ));
            setClaimModal(false);
            setClaimDesc('');
          };

          const statusColors = { inceleniyor: '#F59E0B', teklif_verildi: C.cyan, onaylandi: '#34D399', reddedildi: '#EF4444', kapali: '#6B7280' };
          const statusLabels = { inceleniyor: 'İnceleniyor', teklif_verildi: 'Teklif Verildi', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi', kapali: 'Kapalı' };

          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Sigorta Talepleri</h2>
                  <p className="text-sm mt-1" style={{ color: C.textDim }}>{myClaims.length} talep · 1-Click hasar bildirimi</p>
                </div>
                <AdminButton variant="primary" onClick={() => setClaimModal(true)}>
                  <ShieldIcon size={14} /> Hasar Bildir
                </AdminButton>
              </div>

              {/* Claims List */}
              {myClaims.length > 0 ? (
                <div className="space-y-4">
                  {myClaims.map((claim, idx) => {
                    const vehicle = db.vehicles.find(v => v.id === claim.vehicle_id);
                    const insurer = insurers.find(i => i.id === claim.insurer_id);
                    const offer = (db.insurance_offers || []).find(o => o.claim_id === claim.id);
                    const sc = statusColors[claim.status] || C.textDim;
                    return (
                      <motion.div key={claim.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}>
                        <GlassCard>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: `${sc}12`, color: sc, border: `1px solid ${sc}33` }}>
                                <ShieldIcon size={22} />
                              </div>
                              <div>
                                <p className="font-mono text-lg font-bold" style={{ color: C.text }}>{vehicle?.plate || '—'}</p>
                                <p className="text-xs" style={{ color: C.textDim }}>{vehicle?.brand} {vehicle?.model} · Talep: {claim.claim_date}</p>
                              </div>
                            </div>
                            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                              style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}44` }}>
                              {statusLabels[claim.status]}
                            </span>
                          </div>

                          <p className="text-sm mb-3" style={{ color: C.textDim }}>{claim.damage_description}</p>

                          {insurer && (
                            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
                              <ShieldIcon size={14} style={{ color: C.cyan }} />
                              <span className="text-xs" style={{ color: C.text }}>{insurer.company}</span>
                              <span className="text-xs" style={{ color: C.textDim }}>· {insurer.name}</span>
                            </div>
                          )}

                          {offer && (
                            <div className="p-3 rounded-xl mb-3"
                              style={{ background: `${C.cyan}08`, border: `1px solid ${C.cyan}33` }}>
                              <p className="text-xs uppercase mb-1" style={{ color: C.cyan, letterSpacing: '0.1em' }}>Kostenvoranschlag / Teklif</p>
                              <p className="text-xl font-bold font-mono" style={{ color: C.text }}>€{offer.amount?.toLocaleString('tr-TR')}</p>
                              {offer.description && <p className="text-xs mt-1" style={{ color: C.textDim }}>{offer.description}</p>}
                            </div>
                          )}

                          {claim.status === 'reddedildi' && (
                            <div className="flex items-center gap-2 mt-3">
                              <AdminButton variant="primary" size="sm" onClick={() => {
                                const phone = '4917XXXXXXXX';
                                const text = encodeURIComponent(`Merhaba, ${vehicle?.plate} plakalı aracımın sigorta talebi reddedildi. Hukuki süreç hakkında bilgi almak istiyorum.`);
                                window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                              }}>
                                Avukat İle İletişim
                              </AdminButton>
                              <AdminButton size="sm" onClick={() => {
                                const phone = '4917XXXXXXXX';
                                const text = encodeURIComponent(`Merhaba, ${vehicle?.plate} plakalı aracımın sigorta talebi reddedildi. İtiraz süreci hakkında yardım istiyorum.`);
                                window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                              }}>
                                WhatsApp ile Sor
                              </AdminButton>
                            </div>
                          )}
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <GlassCard className="text-center py-16">
                  <ShieldIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                  <p className="text-lg font-medium mb-2" style={{ color: C.text }}>Aktif sigorta talebi yok</p>
                  <p className="text-sm mb-6" style={{ color: C.textDim }}>Hasar bildirimi yaparak sigorta sürecini başlatabilirsiniz.</p>
                  <MagneticButton variant="primary" ariaLabel="Hasar Bildir" onClick={() => setClaimModal(true)}>
                    <ShieldIcon size={16} /> Hasar Bildir
                  </MagneticButton>
                </GlassCard>
              )}

              {/* New Claim Modal */}
              <GecitKfzModal open={claimModal} onClose={() => setClaimModal(false)} title="Hasar Bildirimi" subtitle="1-Click sigorta talebi oluştur">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase mb-2 block" style={{ color: C.textDim, letterSpacing: '0.1em' }}>Araç</label>
                    <select value={claimVehicle} onChange={e => setClaimVehicle(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }}>
                      {myVehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase mb-2 block" style={{ color: C.textDim, letterSpacing: '0.1em' }}>Sigorta Şirketi (opsiyonel)</label>
                    <select value={claimInsurer} onChange={e => setClaimInsurer(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }}>
                      <option value="">Seçiniz...</option>
                      {insurers.map(ins => <option key={ins.id} value={ins.id}>{ins.company}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase mb-2 block" style={{ color: C.textDim, letterSpacing: '0.1em' }}>Hasar Açıklaması</label>
                    <textarea value={claimDesc} onChange={e => setClaimDesc(e.target.value)}
                      placeholder="Hasarın ne zaman, nerede, nasıl oluştuğunu açıklayın..."
                      rows={4}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                      style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
                  </div>
                  <AdminButton variant="primary" onClick={submitClaim} disabled={!claimVehicle || !claimDesc}>
                    <ShieldIcon size={14} /> Talebi Gönder
                  </AdminButton>
                </div>
              </GecitKfzModal>
            </motion.div>
          );
        }}</Iife>}

        {/* ═══ Hasar Geçmişi Timeline ═══ */}
        {section === 'timeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Hasar Geçmişi</h2>
                <p className="text-sm mt-1" style={{ color: C.textDim }}>Tüm süreç adımları kronolojik sırada</p>
              </div>
            </div>
            {myTimeline.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: `linear-gradient(to bottom, ${C.neon}44, ${C.border}, transparent)` }} />
                <div className="space-y-4">
                  {myTimeline.map((event, idx) => {
                    const vehicle = db.vehicles.find(v => v.id === event.vehicle_id);
                    const eventConfig = {
                      hasar_bildirimi: { icon: AlertTriangle, color: '#EF4444', label: 'Hasar Bildirimi' },
                      ekspertiz_basladi: { icon: Wrench, color: C.neon, label: 'Ekspertiz Başladı' },
                      ekspertiz_tamamlandi: { icon: Check, color: '#34D399', label: 'Ekspertiz Tamamlandı' },
                      sigorta_bildirim: { icon: ShieldIcon, color: C.cyan, label: 'Sigorta Bildirimi' },
                      teklif_alindi: { icon: Receipt, color: '#F59E0B', label: 'Teklif Alındı' },
                      teklif_onaylandi: { icon: CheckSquare, color: '#34D399', label: 'Teklif Onaylandı' },
                      teklif_reddedildi: { icon: XClose, color: '#EF4444', label: 'Teklif Reddedildi' },
                      avukat_atandi: { icon: Users, color: C.magenta, label: 'Avukat Atandı' },
                      mahkeme_tarihi: { icon: CalendarIcon, color: '#F97316', label: 'Mahkeme Tarihi' },
                    };
                    const cfg = eventConfig[event.event] || { icon: ClockIcon, color: C.textDim, label: event.event };
                    const Icon = cfg.icon;
                    return (
                      <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }} className="relative pl-14">
                        <div className="absolute left-3.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                          style={{ background: `${cfg.color}20`, border: `2px solid ${cfg.color}`, boxShadow: `0 0 10px ${cfg.color}33` }}>
                          <Icon size={10} style={{ color: cfg.color }} />
                        </div>
                        <GlassCard padding="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium flex items-center gap-2" style={{ color: C.text }}>
                                {cfg.label}
                                {vehicle && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.05)', color: C.cyan, border: `1px solid ${C.border}` }}>{vehicle.plate}</span>}
                              </p>
                              <p className="text-sm mt-1" style={{ color: C.textDim }}>{event.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <p className="text-xs font-mono" style={{ color: C.textDim }}>{event.date}</p>
                              <p className="text-[10px] capitalize mt-0.5" style={{ color: cfg.color }}>{event.actor === 'customer' ? 'Siz' : event.actor === 'admin' ? 'Gecit Kfz Sachverständiger' : event.actor === 'insurance' ? 'Sigorta' : event.actor === 'lawyer' ? 'Avukat' : 'Sistem'}</p>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <GlassCard className="text-center py-16">
                <ClockIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p className="text-lg font-medium mb-1" style={{ color: C.text }}>Geçmiş bulunmuyor</p>
                <p style={{ color: C.textDim }} className="text-sm">Hasar bildirimi yaptığınızda süreç adımları burada görünecek.</p>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* Notifications Section */}
        {section === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: C.text }}>Bildirimler</h2>
                <p className="text-sm mt-1" style={{ color: C.textDim }}>{myNotifications.length} bildirim</p>
              </div>
              {unreadNotifs > 0 && (
                <AdminButton size="sm" onClick={() => {
                  setDb(prev => ({
                    ...prev,
                    notifications: (prev.notifications || []).map(n => n.user_id === myRecord.id ? { ...n, read: true } : n)
                  }));
                }}>
                  Tümünü Okundu İşaretle
                </AdminButton>
              )}
            </div>
            {myNotifications.length === 0 ? (
              <GlassCard className="text-center py-16">
                <BellIcon size={40} style={{ color: C.textDim, margin: '0 auto 12px' }} />
                <p style={{ color: C.textDim }} className="text-sm">Bildirim bulunmuyor.</p>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {myNotifications.map((n, idx) => (
                  <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}>
                    <GlassCard padding="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: !n.read ? 'rgba(227,6,19,0.10)' : 'rgba(0,0,0,0.05)', color: !n.read ? C.neon : C.textDim }}>
                          <BellIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: !n.read ? C.text : C.textDim }}>{n.text}</p>
                          <p className="text-xs mt-1" style={{ color: C.textDim }}>
                            {new Date(n.created_at).toLocaleDateString('tr-TR')} · {new Date(n.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2" style={{ background: C.neon }} />}
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </main>
      <MobileBottomNav items={navItems} active={section} onChange={setSection}
        onHome={onHome} onLogout={handleLogout} />

      {/* Floating WhatsApp Button — raised on mobile to avoid bottom nav overlap */}
      <a href="https://wa.me/4915732624362" target="_blank" rel="noopener noreferrer"
        className="fixed z-50 flex items-center justify-center rounded-full shadow-xl transition-all hover:scale-110 bottom-[110px] md:bottom-[90px] right-4 md:right-5 w-12 h-12 md:w-14 md:h-14"
        style={{ background: '#25D366', boxShadow: '0 6px 20px rgba(37,211,102,0.4)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)}
        onBook={(data) => {
          const apt = { id: 'apt' + uid(), customer_id: myRecord.id, email: myRecord.email, name: myRecord.full_name, ...data, status: 'aktif', created_at: new Date().toISOString() };
          setDb(prev => ({ ...prev, appointments: [...(prev.appointments || []), apt] }));
          setBookingOpen(false);
        }} />

      {/* Satisfaction Survey Modal */}
      <GecitKfzModal open={surveyOpen} onClose={() => { setSurveyOpen(false); setSurveyAppraisal(null); }} title="Memnuniyet Anketi" subtitle="Deneyiminizi puanlayın">
        {<Iife>{() => {
          const [rating, setRating] = React.useState(0);
          const [comment, setComment] = React.useState('');
          const submit = () => {
            if (rating === 0) return;
            const survey = {
              id: 'srv' + uid(),
              appraisal_id: surveyAppraisal?.id,
              customer_id: myRecord.id,
              rating,
              comment,
              created_at: new Date().toISOString(),
            };
            setDb(prev => ({ ...prev, satisfaction_surveys: [...(prev.satisfaction_surveys || []), survey] }));
            setSurveyOpen(false);
            setSurveyAppraisal(null);
          };
          return (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm mb-4" style={{ color: C.textDim }}>Ekspertiz hizmetimizi nasıl değerlendirirsiniz?</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRating(star)}
                      className="text-3xl transition-transform hover:scale-125"
                      style={{ color: star <= rating ? '#F59E0B' : C.textDim, textShadow: star <= rating ? '0 0 12px rgba(245,158,11,0.5)' : 'none' }}>
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: C.textDim }}>
                  {rating === 0 ? 'Puanlayın' : rating <= 2 ? 'Geliştirmemiz gereken noktalar var' : rating <= 4 ? 'Teşekkürler!' : 'Mükemmel!'}
                </p>
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Yorumunuz (opsiyonel)..."
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, color: C.text }} />
              <AdminButton variant="primary" onClick={submit} disabled={rating === 0}>
                Gönder
              </AdminButton>
            </div>
          );
        }}</Iife>}
      </GecitKfzModal>
    </div>
  );
}

// ─── Appointment Booking Modal (public) ─────────
function AppointmentBookingModal({ open, onClose, onBook }) {
  const today = new Date();
  const [days] = useState(() => [...Array(14)].map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return { iso: d.toISOString().slice(0,10), day: d.getDate(), wd: d.toLocaleDateString('tr-TR', { weekday: 'short' }) };
  }));
  const slots = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [service, setService] = useState('Premium Ekspertiz');
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => { if (open) { setDate(null); setTime(null); setForm({}); setDone(false); setService('Premium Ekspertiz'); } }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (onBook) onBook({ date, time, service, ...form });
    setDone(true);
  };

  return (
    <GecitKfzModal open={open} onClose={onClose} title={done ? "Terminin Oluşturuldu 🎉" : "Online Termin Al"}
      subtitle={done ? "Google Takvim'e eklendi, SMS ile onay gönderildi" : "Boş saatlerden seç, 30 saniyede tamamla"} width={720}>
      {done ? (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }}>
            <Check size={28} />
          </div>
          <p className="text-lg font-medium" style={{ color: C.text }}>{date} · {time}</p>
          <p className="text-sm mt-2" style={{ color: C.textDim }}>{service}</p>
          <div className="mt-6"><AdminButton variant="primary" onClick={onClose}>Tamam</AdminButton></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Hizmet Paketi</p>
            <div className="grid grid-cols-3 gap-2">
              {['Standart Ekspertiz','Premium Ekspertiz','Kurumsal Filo'].map(s => (
                <button type="button" key={s} onClick={() => setService(s)}
                  className="p-3 rounded-xl text-xs text-left transition-all"
                  style={{
                    background: service === s ? 'rgba(227,6,19,0.07)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${service === s ? C.neon : C.border}`,
                    color: service === s ? C.text : C.textDim,
                    boxShadow: service === s ? `0 0 16px ${C.glow}` : 'none',
                  }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Tarih</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map(d => (
                <button type="button" key={d.iso} onClick={() => setDate(d.iso)}
                  className="flex-shrink-0 w-16 p-3 rounded-xl text-center transition-all"
                  style={{
                    background: date === d.iso ? `linear-gradient(135deg, ${C.neon}, ${C.neon2})` : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${date === d.iso ? 'transparent' : C.border}`,
                    color: date === d.iso ? '#FFFFFF' : C.text,
                  }}>
                  <p className="text-[10px] uppercase" style={{ letterSpacing: '0.15em' }}>{d.wd}</p>
                  <p className="text-xl font-mono mt-1">{d.day}</p>
                </button>
              ))}
            </div>
          </div>
          {date && (
            <div>
              <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Saat</p>
              <div className="grid grid-cols-4 gap-2">
                {slots.map(s => (
                  <button type="button" key={s} onClick={() => setTime(s)}
                    className="p-2.5 rounded-xl text-sm font-mono transition-all"
                    style={{
                      background: time === s ? 'rgba(227,6,19,0.07)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${time === s ? C.neon : C.border}`,
                      color: time === s ? C.text : C.textDim,
                    }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {date && time && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <Field label="Ad Soyad" required><TextInput value={form.full_name} onChange={(e) => setForm(f => ({...f, full_name: e.target.value}))} required /></Field>
                <Field label="Telefon" required><TextInput value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} required /></Field>
                <Field label="E-posta"><TextInput type="email" value={form.email} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} /></Field>
                <Field label="Plaka"><TextInput value={form.plate} onChange={(e) => setForm(f => ({...f, plate: e.target.value}))} /></Field>
              </div>
              <div className="flex justify-between pt-2">
                <p className="text-xs self-center" style={{ color: C.textDim }}>✓ Google Takvim'e otomatik eklenir</p>
                <AdminButton type="submit" variant="primary">Termin Oluştur <ArrowRight size={14} /></AdminButton>
              </div>
            </>
          )}
        </form>
      )}
    </GecitKfzModal>
  );
}

// ─── AppPanel dispatcher (role-based routing) ───
function AppPanel({ user, onHome, onLogout }) {
  if (user?.role === 'customer') return <CustomerApp user={user} onLogout={onLogout} onHome={onHome} />;
  if (user?.role === 'lawyer') return <LawyerApp user={user} onLogout={onLogout} onHome={onHome} />;
  return <AdminApp user={user} onLogout={onLogout} onHome={onHome} />;
}

function GlobalServiceInfo() {
  const { t } = useLang();
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] bg-[#F9FAFB] border-b border-gray-100 h-[26px] overflow-hidden">
      <div className="h-full flex items-center justify-center">
        {/* Desktop View */}
        <div className="hidden md:flex items-center gap-8 text-[9px] font-bold tracking-[0.15em] text-gray-400 uppercase">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🇩🇪</span>
            <span>{t('topbar.service')}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-gray-300" />
            <span>{t('topbar.recognized')}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-gray-300" />
            <span>{t('topbar.emergency')}</span>
          </div>
        </div>

        {/* Mobile View - Marquee */}
        <div className="flex md:hidden w-full h-full items-center">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex whitespace-nowrap gap-10 px-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-10 text-[8px] font-bold tracking-widest text-gray-400 uppercase">
                <div className="flex items-center gap-1.5">
                  <span>🇩🇪</span>
                  <span>{t('topbar.service')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={9} />
                  <span>DEKRA/TÜV Standards</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap size={9} />
                  <span>{t('topbar.emergency')}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── App ────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');

  useEffect(() => {
    let mounted = true;

    // Eski (güvensiz) localStorage session'larını temizle.
    try { localStorage.removeItem('gecit_kfz_user'); } catch (e) {}

    // Mevcut Supabase session'ı varsa profili yükle.
    (async () => {
      try {
        const session = await SupabaseAuth.getSession();
        if (!mounted || !session) return;
        const sb = getSupabase();
        if (!sb) return;
        const { data: profile, error } = await sb.from('user_profiles')
          .select('*').eq('id', session.user.id).single();
        if (!mounted) return;
        if (error || !profile || profile.active === false || !profile.role) {
          await SupabaseAuth.signOut();
          return;
        }
        setUser({
          email: session.user.email,
          role: profile.role,
          name: profile.full_name || session.user.email,
          lawyer_id: profile.role === 'lawyer' ? profile.linked_id : undefined,
          insurer_id: profile.role === 'insurance' ? profile.linked_id : undefined,
        });
        setView('app');
      } catch (e) {
        console.warn('[Gecit-KFZ] Session restore failed:', e?.message);
      }
    })();

    // Auth değişimlerinde otomatik logout (token refresh fail, başka sekmede çıkış vb.)
    const unsubscribe = SupabaseAuth.onAuthChange((session) => {
      if (!session && mounted) {
        setUser(null);
        setView('landing');
      }
    });

    return () => { mounted = false; unsubscribe(); };
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    setView('app');
  };

  const handleLogout = async () => {
    try { await SupabaseAuth.signOut(); } catch (e) {}
    try { localStorage.removeItem('gecit_kfz_user'); } catch (e) {}
    setUser(null);
    setView('landing');
  };

  const content = view === 'app' && user ? (
    <>
      <AppPanel user={user} onHome={() => setView('landing')} onLogout={handleLogout} />
      <PWAInstallBanner />
    </>
  ) : (
    <Landing
      user={user}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onEnterApp={() => setView('app')}
    />
  );

  return (
    <div className="flex flex-col min-h-screen pt-[26px]">
      <GlobalServiceInfo />
      <main className="flex-1 flex flex-col relative">
        {content}
      </main>
    </div>
  );
}

export default App;
