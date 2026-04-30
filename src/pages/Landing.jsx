// ═══════════════════════════════════════════════════════════════════
// ⚠️  HOMEPAGE / LANDING — IZOLE DOSYA
//
// Bu dosya ana sayfa (giris yapmamis ziyaretci) icin TUM UI'i icerir.
// Diger panellerde (admin, musteri, avukat) yapilan degisikler bu
// dosyaya HIC dokunmamali. Sadece homepage tasarimi/icerigi
// degistirilecekse buradan duzenle.
//
// Icerigi:
//  - Decoratif: NoiseOverlay, ScrollProgress, MeshBackground, MagneticButton
//  - Layout: Navbar, Footer
//  - Icerik bolumleri: Hero, BannerShowcase, Marquee, Features, KostenlosBanner,
//    RechteSection, WhyGecitKfz, HowItWorks, Stats, Testimonial, Pricing, FooterCTA
//  - Modaller: LoginDrawer, AppointmentBookingModal, PWAInstallBanner
//  - Default export: Landing (props: user, onLogin, onLogout, onEnterApp)
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  motion, useScroll, useTransform, useMotionValue, useSpring, useInView, AnimatePresence,
} from 'framer-motion';
import { C, easeOut, spring } from '../utils/tokens.js';
import { useReducedMotion, useTouchDevice, useMousePosition } from '../utils/hooks.js';
import {
  Svg, ArrowRight, Play, Check, ChevronRight, Sparkles, Brain, Zap, Target,
  TrendingUp, Rocket, Shield, BarChart3, Globe, Layers, Cpu, Database, Code, Quote,
  XClose, LogOutIcon, Wrench, MailIcon, ScaleIcon, ShieldIcon, GlobeIcon,
  InfinityIcon, UsersGroupIcon, RadioTowerIcon, FolderCheckIcon,
} from '../components/icons.jsx';
import { GecitKfzModal } from '../components/Modal.jsx';

// IIFE-with-hooks pattern icin kucuk yardimci.
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
    <motion.div className="fixed top-0 left-0 right-0 z-50 origin-left"
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
      <motion.div style={{ ...base, width: 560, height: 560, top: '-10%', left: '-5%', background: C.neon2, opacity: 0.35, x: offX, y: offY }}
        animate={rm ? {} : { x: [0, 60, -30, 0], y: [0, -40, 50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div style={{ ...base, width: 480, height: 480, top: '40%', right: '-8%', background: C.cyan, opacity: 0.2 }}
        animate={rm ? {} : { x: [0, -80, 30, 0], y: [0, 40, -40, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div style={{ ...base, width: 520, height: 520, bottom: '-10%', left: '30%', background: C.magenta, opacity: 0.22 }}
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
  const baseCls = 'relative inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-full px-7 py-3.5 transition-colors focus:outline-none';
  const style = variant === 'primary'
    ? { background: '#E30613', color: '#FFFFFF',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 12px 40px -12px rgba(227, 6, 19, 0.45)` }
    : { background: 'rgba(255,255,255,0.04)', color: C.text, border: `1px solid ${C.border}`,
        backdropFilter: 'blur(8px)' };
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
  const [bgCss, setBg] = useState('rgba(255,255,255,0.02)');
  const [brCss, setBr] = useState('rgba(255,255,255,0.04)');
  const [blCss, setBl] = useState('blur(6px)');
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const u1 = bgOp.on('change', v => setBg(`rgba(255,255,255,${v})`));
    const u2 = brOp.on('change', v => setBr(`rgba(255,255,255,${v})`));
    const u3 = blur.on('change', v => setBl(`blur(${v}px)`));
    return () => { u1(); u2(); u3(); };
  }, [bgOp, brOp, blur]);
  const links = ['Hizmetler', 'Nasıl Çalışır', 'Paketler', 'İletişim'];
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
      <div className="flex items-center justify-between pl-6 pr-5 py-3 gap-3">
        <a href="#" className="flex items-center gap-4 font-sans flex-shrink-0 min-w-0 tracking-tight"
          style={{ lineHeight: 1 }}>
          <img src="./logo-car-only.png" alt="Logo" className="h-12 md:h-14 w-auto object-contain flex-shrink-0"
               style={{ filter: 'url(#remove-white) brightness(1.05) contrast(1.05)' }} />
          <div className="flex flex-col items-start gap-1 min-w-0">
            <div className="text-2xl md:text-3xl lg:text-4xl font-black italic tracking-tighter" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#E30613' }}>GECIT</span>
              <span style={{ color: '#0A0A0A', margin: '0 2px' }}>-</span>
              <span style={{ color: '#0A0A0A' }}>KFZ</span>
            </div>
            <div className="flex items-center gap-2 w-full">
              <div className="h-[2px] w-3 md:w-4 bg-[#E30613] flex-shrink-0" />
              <span className="text-[11px] md:text-xs font-bold tracking-[0.18em] uppercase" style={{ whiteSpace: 'nowrap', color: '#0A0A0A' }}>
                Sachverständigenbüro
              </span>
              <div className="h-[2px] flex-1 bg-[#E30613]" />
            </div>
          </div>
        </a>

        {/* SVG Filter to remove white background from logo */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id="remove-white" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              -1 -1 -1 1 1
            " />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 0 1" />
            </feComponentTransfer>
          </filter>
        </svg>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: C.textDim }}>
          {links.map(l => <a key={l} href="#" className="transition-colors hover:text-white">{l}</a>)}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
            <button onClick={onEnterApp}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full transition-all"
              style={{ background: 'rgba(167,139,250,0.1)', border: `1px solid rgba(167,139,250,0.3)`, color: C.neon }}>
              Panele Git
              <ArrowRight size={14} />
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)} onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-full transition-colors"
                style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', color: C.text }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs"
                  style={{ background: `linear-gradient(135deg, ${C.neon}, ${C.magenta})`, color: '#0B0818' }}>
                  {initials}
                </span>
                <span className="hidden sm:inline" style={{ color: C.text }}>{user.role === 'super_admin' ? 'Süper Admin' : 'Kullanıcı'}</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl p-2 text-sm"
                    style={{ background: C.surface2, border: `1px solid ${C.border}`,
                      boxShadow: `0 20px 40px -12px rgba(0,0,0,0.6), 0 0 30px ${C.glow}` }}>
                    <div className="px-3 py-2" style={{ color: C.textDim }}>
                      <p className="truncate" style={{ color: C.text }}>{user.email}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.neon }}>
                        {user.role === 'super_admin' ? '● Süper Admin' : '● Kullanıcı'}
                      </p>
                    </div>
                    <div className="h-px my-1" style={{ background: C.border }} />
                    <button onMouseDown={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl transition-colors hover:bg-white/5"
                      style={{ color: C.text }}>
                      Çıkış Yap
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <button onClick={onLoginClick}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 sm:px-4 py-2 rounded-full transition-all"
              style={{ background: 'rgba(167,139,250,0.12)', border: `1px solid ${C.neon}55`, color: C.neon }}>
              <Svg size={14}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></Svg>
              <span className="hidden sm:inline">Giriş Yap</span>
              <span className="sm:hidden">Giriş</span>
            </button>
          )}
          <MagneticButton variant="primary" ariaLabel="Online Termin Al" className="text-sm !px-4 sm:!px-7 !py-2.5 sm:!py-3.5" onClick={onBook}>
            <span className="hidden sm:inline">Online Termin Al</span>
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

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const em = email.trim().toLowerCase();
      if (em === 'cevikademm@gmail.com' && password === 'Adem123') {
        const user = { email: 'cevikademm@gmail.com', role: 'super_admin', name: 'Adem Çevik' };
        try { localStorage.setItem('gecit_kfz_user', JSON.stringify(user)); } catch(err) {}
        onLogin(user);
        setEmail(''); setPassword('');
        onClose();
      } else {
        // Check lawyer login
        const dbRaw = localStorage.getItem('gecit_kfz_db_v6');
        const dbData = dbRaw ? JSON.parse(dbRaw) : null;
        const lawyer = (dbData?.lawyers || []).find(l => l.email.toLowerCase() === em && l.password === password && l.active);
        if (lawyer) {
          const user = { email: lawyer.email, role: 'lawyer', name: lawyer.name, lawyer_id: lawyer.id };
          try { localStorage.setItem('gecit_kfz_user', JSON.stringify(user)); } catch(err) {}
          onLogin(user);
          setEmail(''); setPassword('');
          onClose();
        } else if (em && password.length >= 4) {
          const name = em.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const user = { email: em, role: 'customer', name };
          try { localStorage.setItem('gecit_kfz_user', JSON.stringify(user)); } catch(err) {}
          onLogin(user);
          setEmail(''); setPassword('');
          onClose();
        } else {
          setError('E-posta veya şifre hatalı. Şifre en az 4 karakter olmalı.');
        }
      }
      setLoading(false);
    }, 350);
  };

  const quickLogin = (role) => {
    const dbRaw = localStorage.getItem('gecit_kfz_db_v6');
    const dbData = dbRaw ? (() => { try { return JSON.parse(dbRaw); } catch(e) { return null; } })() : null;
    let user = null;
    if (role === 'admin') {
      user = { email: 'cevikademm@gmail.com', role: 'super_admin', name: 'Adem Çevik' };
    } else if (role === 'customer') {
      const c = (dbData?.customers || [])[0];
      user = c
        ? { email: c.email, role: 'customer', name: c.full_name || c.company || c.email }
        : { email: 'demo.musteri@gmail.com', role: 'customer', name: 'Demo Müşteri' };
    } else if (role === 'lawyer') {
      const l = (dbData?.lawyers || []).find(x => x.active) || (dbData?.lawyers || [])[0];
      user = l
        ? { email: l.email, role: 'lawyer', name: l.name, lawyer_id: l.id }
        : { email: 'demo.avukat@hukuk.com', role: 'lawyer', name: 'Demo Avukat', lawyer_id: 'demo' };
    }
    if (!user) return;
    try { localStorage.setItem('gecit_kfz_user', JSON.stringify(user)); } catch(err) {}
    onLogin(user);
    setEmail(''); setPassword('');
    onClose();
  };

  const googleLogin = () => quickLogin('customer');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0"
            style={{ zIndex: 60, background: 'rgba(7,6,11,0.65)', backdropFilter: 'blur(6px)' }} />
          {/* Ortali kart konteyner - backdrop click ile kapanmasi icin tikla-gec */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 61,
              paddingTop: 'max(16px, env(safe-area-inset-top))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <motion.aside key="drawer"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              role="dialog" aria-modal="true" aria-label="Giriş Yap"
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col overflow-y-auto pointer-events-auto rounded-2xl"
              style={{ width: 'min(440px, 100%)', maxHeight: '90vh',
                background: `linear-gradient(180deg, ${C.surface2} 0%, ${C.surface} 100%)`,
                border: `1px solid ${C.border}`,
                boxShadow: `0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 ${C.glow}` }}>
            <div className="absolute top-0 right-0 pointer-events-none"
              style={{ width: 320, height: 320,
                background: `radial-gradient(circle, ${C.glow} 0%, transparent 70%)`,
                filter: 'blur(40px)' }} />
            <div className="relative flex items-center justify-between p-6"
              style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="text-xl font-black italic tracking-tighter" style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                <span style={{ color: '#E30613' }}>GECIT</span>
                <span style={{ color: '#FFFFFF', margin: '0 2px' }}>-</span>
                <span style={{ color: '#FFFFFF' }}>KFZ</span>
              </div>
              <button onClick={onClose} aria-label="Kapat"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                <Svg size={16}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Svg>
              </button>
            </div>

            <div className="relative flex-1 p-8">
              <p className="text-xs uppercase mb-3" style={{ color: C.neon, letterSpacing: '0.25em' }}>
                Hesap Girişi
              </p>
              <h2 className="text-3xl font-semibold mb-2"
                style={{ color: C.text, letterSpacing: '-0.02em' }}>
                Tekrar hoş geldin.
              </h2>
              <p className="text-sm mb-8" style={{ color: C.textDim }}>
                Gecit Kfz Sachverständiger Yönetim Paneli'ne erişmek için giriş yapın.
              </p>

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase mb-2"
                    style={{ color: C.textDim, letterSpacing: '0.2em' }}>E-posta</label>
                  <input type="email" required value={email} autoFocus
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="sen@sirket.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${C.border}`, color: C.text }}
                    onFocus={(e) => e.target.style.border = `1px solid ${C.neon}`}
                    onBlur={(e) => e.target.style.border = `1px solid ${C.border}`} />
                </div>
                <div>
                  <label className="block text-xs uppercase mb-2"
                    style={{ color: C.textDim, letterSpacing: '0.2em' }}>Şifre</label>
                  <input type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${C.border}`, color: C.text }}
                    onFocus={(e) => e.target.style.border = `1px solid ${C.neon}`}
                    onBlur={(e) => e.target.style.border = `1px solid ${C.border}`} />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(244,114,182,0.08)',
                        border: '1px solid rgba(244,114,182,0.3)', color: C.magenta }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between text-xs" style={{ color: C.textDim }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked
                      style={{ accentColor: C.neon }} />
                    Beni hatırla
                  </label>
                  <a href="#" className="hover:text-white transition-colors">Şifremi unuttum</a>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${C.neon} 0%, ${C.neon2} 100%)`,
                    color: '#0B0818',
                    boxShadow: `0 12px 40px -12px ${C.glow}` }}>
                  {loading ? 'Giriş yapılıyor…' : <>Giriş Yap <ArrowRight size={16} /></>}
                </motion.button>
              </form>

              <div className="my-8 flex items-center gap-3 text-xs" style={{ color: C.textDim }}>
                <div className="flex-1 h-px" style={{ background: C.border }} />
                HIZLI GİRİŞ (DEMO)
                <div className="flex-1 h-px" style={{ background: C.border }} />
              </div>

              <p className="text-xs mb-3 text-center" style={{ color: C.textDim }}>
                Tek tıkla istediğin role gir — şifreler henüz devre dışı
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { role: 'admin',     label: 'Admin',     desc: 'Yönetim Paneli', color: C.neon,   bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.35)', icon: <Svg size={14}><path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z"/></Svg> },
                  { role: 'customer',  label: 'Müşteri',   desc: 'Müşteri Portalı', color: '#22D3EE', bg: 'rgba(34,211,238,0.10)',  border: 'rgba(34,211,238,0.35)',  icon: <Svg size={14}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Svg> },
                  { role: 'lawyer',    label: 'Avukat',    desc: 'Avukat Portalı',  color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.35)',  icon: <Svg size={14}><path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 8l-2 6a4 4 0 0 0 8 0L9 8"/><path d="M19 8l-2 6a4 4 0 0 0 8 0l-2-6"/></Svg> },
                ].map(b => (
                  <motion.button
                    key={b.role}
                    type="button"
                    onClick={() => quickLogin(b.role)}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
                    style={{ background: b.bg, border: `1px solid ${b.border}` }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${b.color}22`, color: b.color, border: `1px solid ${b.color}55` }}>
                      {b.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-medium" style={{ color: C.text }}>{b.label}</span>
                      <span className="block text-[10px]" style={{ color: C.textDim }}>{b.desc}</span>
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-[11px] mt-5" style={{ color: C.textDim }}>
                Şifreyle giriş için yukarıdaki formu kullan · Hızlı giriş yalnızca demo amaçlıdır
              </p>
            </div>

            <div className="relative p-6 text-xs" style={{ color: C.textDim, borderTop: `1px solid ${C.border}` }}>
              <p>Güvenli bağlantı · KVKK uyumlu · Supabase Auth</p>
            </div>
            </motion.aside>
          </div>
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
    <section className="relative flex items-center overflow-hidden" style={{ minHeight: 'auto', paddingTop: 'calc(env(safe-area-inset-top) + 120px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)', background: '#FFFFFF' }}>
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(227,6,19,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(227,6,19,0.04) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 30% 50%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 30% 50%, #000 30%, transparent 75%)' }} />

      {/* Soft red ambient glows */}
      <motion.div className="absolute pointer-events-none rounded-full" aria-hidden="true"
        style={{ width: 480, height: 480, top: '-120px', left: '-120px', zIndex: 0,
          background: 'radial-gradient(circle, rgba(227,6,19,0.18) 0%, transparent 65%)', filter: 'blur(20px)' }}
        animate={rm ? {} : { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute pointer-events-none rounded-full" aria-hidden="true"
        style={{ width: 380, height: 380, bottom: '-80px', left: '35%', zIndex: 0,
          background: 'radial-gradient(circle, rgba(227,6,19,0.12) 0%, transparent 70%)', filter: 'blur(24px)' }}
        animate={rm ? {} : { scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} />

      <div className="relative mx-auto px-6 w-full" style={{ maxWidth: 1200, zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs uppercase"
          style={{ background: 'linear-gradient(135deg, rgba(227,6,19,0.08), rgba(227,6,19,0.02))', border: '1px solid #E30613',
            color: '#7A0309', letterSpacing: '0.2em', backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 24px rgba(227,6,19,0.15), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: '#E30613' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#E30613' }} />
          </span>
          <Sparkles size={12} style={{ color: '#E30613' }} /> Yapay Zeka Destekli Oto Ekspertiz
        </motion.div>
        <div className="relative">
          {/* Red accent bar */}
          <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease: easeOut, delay: 0.4 }}
            className="absolute -left-4 md:-left-6 top-1 bottom-1 w-1 rounded-full hidden md:block"
            style={{ background: 'linear-gradient(180deg, #E30613, #7A0309)', transformOrigin: 'top',
              boxShadow: '0 0 20px rgba(227,6,19,0.4)' }} aria-hidden="true" />
          <RevealHeading text="Aracının Gerçek Durumunu"
            className="text-5xl md:text-7xl lg:text-8xl font-semibold"
            style={{ color: '#0A0A0A', letterSpacing: '-0.04em', lineHeight: 0.92, textShadow: '0 2px 24px #FFFFFF' }} />
          <RevealHeading text="Saniyeler İçinde Öğren."
            className="text-5xl md:text-7xl lg:text-8xl font-semibold mt-2"
            style={{ background: 'linear-gradient(135deg, #E30613 0%, #B0050F 50%, #7A0309 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              letterSpacing: '-0.04em', lineHeight: 0.92, filter: 'drop-shadow(0 2px 16px #FFFFFF) drop-shadow(0 4px 20px rgba(227,6,19,0.25))' }} delay={0.3} />
        </div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut, delay: 1.1 }}
          className="mt-8 text-base md:text-xl max-w-2xl leading-relaxed"
          style={{ color: '#1F1F1F', textShadow: '0 1px 12px #FFFFFF' }}>
          Gecit Kfz Sachverständiger, ruhsat fotoğrafından aracın tüm künyesini saniyeler içinde okur. Tramer geçmişi, değişen parça kayıtları ve 120 noktalık ekspertiz sürecini
          <span style={{ color: '#000000', fontWeight: 600 }}> tek platformda</span> birleştirir.
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
    </section>
  );
}

// ─── Banner Showcase (One-File / Vier Portale) ─────
function BannerShowcase() {
  const [lightbox, setLightbox] = useState(null);
  const banners = [
    {
      src: '/banner/unnamed%20(13).png',
      alt: 'Gecit Kfz Sachverständiger — Ein Index, Vier Welten: Kunde, Anwalt, Versicherer, Admin',
      title: 'Vier Portale, Ein Index',
      desc: 'Müşteri, avukat, sigortacı ve admin — dört rolün dört portali, tek `index.html` dosyasında.',
      accent: C.neon,
    },
    {
      src: '/banner/unnamed%20(14).png',
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
              style={{ background: 'rgba(255,255,255,0.08)', color: C.text, border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}>
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
    <section className="relative py-12 overflow-hidden" style={{ zIndex: 2, background: '#E30613' }}>
      <p className="text-center text-xs uppercase mb-6 font-bold" style={{ color: '#FFFFFF', letterSpacing: '0.25em' }}>
        Almanya'nın güvenilir ekspertiz ağı · 500+ servis
      </p>
      <div className="relative">
        <motion.div className="flex gap-20 whitespace-nowrap"
          animate={rm ? {} : { x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 flex-shrink-0" style={{ color: '#FFFFFF' }}>
              <Shield size={24} strokeWidth={2.5} />
              <span className="text-3xl font-black italic tracking-tighter uppercase">24/7 SERVICE</span>
            </div>
          ))}
        </motion.div>
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
          background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(225,6,0,0.14), transparent 40%)` }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, rgba(225,6,0,0.35), transparent 40%)`,
          WebkitMask: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, black, transparent 40%)`,
          mask: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, black, transparent 40%)`,
          opacity: active ? 0.5 : 0, transition: 'opacity 500ms',
          padding: 1, borderRadius: 24, border: `1px solid #e10600` }} />
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
          transition={{ duration: 0.8, ease: easeOut }} className="mb-16 md:mb-24 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>Özellikler</p>
            <h2 className="text-4xl md:text-6xl font-semibold max-w-3xl" style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Oto Ekspertizin <span style={{ color: C.neon }}>Dijital Standardı</span>.
            </h2>
            <p className="mt-6 text-lg max-w-2xl" style={{ color: C.textDim }}>
              Ruhsat tarama, tramer geçmişi, termin yönetimi, canlı ekspertiz takibi ve müşteri portalı — hepsi tek çatı altında.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden w-full md:w-80 h-56 md:h-64"
            style={{ border: `1px solid ${C.border}`, boxShadow: `0 0 40px ${C.glow}` }}>
            <img src="/images/keys.jpg" alt="Schlüsselübergabe" loading="lazy"
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${C.neon}22, transparent 60%)` }} />
          </div>
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
          style={{ background: `linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(124,58,237,0.08) 50%, rgba(34,211,238,0.08) 100%)`,
            border: '1px solid rgba(239,68,68,0.2)' }}>
          {/* Glow effects */}
          <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.08), transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)', filter: 'blur(40px)' }} />

          <div className="relative p-10 md:p-16">
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Left: Photo */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-shrink-0">
                <div className="relative w-full md:w-80 h-56 md:h-64 rounded-3xl overflow-hidden"
                  style={{ border: '1px solid rgba(239,68,68,0.25)',
                    boxShadow: '0 0 40px rgba(239,68,68,0.12)' }}>
                  <img src="/images/inspection.jpg" alt="Unfallgutachten Inspektion" loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.18), transparent 60%)' }} />
                  <div className="absolute top-3 left-3 w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(6px)' }}>
                    <ScaleIcon size={22} style={{ color: '#fff' }} />
                  </div>
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
      <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center mb-14">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="relative rounded-3xl overflow-hidden"
            style={{ border: '1px solid rgba(227,6,19,0.25)', boxShadow: '0 0 50px rgba(227,6,19,0.12)' }}>
            <img src="/images/accident.jpg" alt="Unfall mit Warndreieck" loading="lazy"
              className="w-full h-64 md:h-80 object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.35) 100%)' }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold mb-4"
              style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Ihre Rechte nach einem <span style={{ color: '#E30613' }}>Unfall</span>
            </h2>
            <p className="text-lg" style={{ color: C.textDim }}>
              Als Geschädigter stehen Ihnen viele Rechte zu. Wir setzen diese für Sie durch.
            </p>
          </motion.div>
        </div>
        <div className="mx-auto" style={{ maxWidth: 800 }}>
        <div className="space-y-4">
          {items.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.1 }}
              className="rounded-2xl p-6 md:p-8 flex gap-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`,
                backdropFilter: 'blur(4px)' }}>
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #E30613, #B0050F)',
                    boxShadow: '0 0 20px rgba(227,6,19,0.25)' }}>
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
          <h2 className="text-4xl md:text-6xl font-semibold max-w-4xl mx-auto" style={{ color: '#000', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Neden <span style={{ color: '#e10600' }}>Gecit</span> Kfz Sachverständiger'u Tercih Etmelisiniz?
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
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}` }}>
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
          style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(34,211,238,0.05))',
            border: `1px solid ${C.border}`, backdropFilter: 'blur(16px)' }}>
          <Quote size={48} style={{ color: C.neon, opacity: 0.6 }} />
          <blockquote className="mt-6 text-3xl md:text-5xl italic leading-tight"
            style={{ color: C.text, letterSpacing: '-0.02em', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            "İkinci el araç aldık; Gecit Kfz Sachverständiger ruhsattan saniyede okudu, 20 yıllık galericinin bile kaçırdığı değişen parçayı yakaladı. Paranın tam karşılığı."
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg"
              style={{ background: `linear-gradient(135deg, ${C.neon}, ${C.magenta})`, color: '#0B0818' }}>MY</div>
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
        border: highlighted ? '1px solid rgba(167,139,250,0.35)' : `1px solid ${C.border}`,
        boxShadow: highlighted ? `0 0 60px ${C.glow}` : 'none' }}>
      {highlighted && (
        <div className="absolute px-4 py-1 rounded-full text-xs uppercase font-medium"
          style={{ top: -12, left: '50%', transform: 'translateX(-50%)',
            background: `linear-gradient(135deg, ${C.neon}, ${C.magenta})`, color: '#0B0818',
            letterSpacing: '0.15em' }}>En Popüler</div>
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
      <button data-magnetic className="w-full py-3 rounded-full font-medium text-sm transition-colors"
        style={highlighted
          ? { background: `linear-gradient(135deg, ${C.neon}, ${C.neon2})`, color: '#0B0818' }
          : { background: 'rgba(255,255,255,0.04)', color: C.text, border: `1px solid ${C.border}` }}>
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
          background: 'radial-gradient(circle, rgba(167,139,250,0.27) 0%, rgba(124,58,237,0.13) 40%, transparent 70%)',
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
            <div className="mt-5 text-sm leading-relaxed" style={{ color: C.textDim }}>
              <p style={{ color: C.text, fontWeight: 600, marginBottom: 4 }}>Adresse</p>
              <p>Am Gutshof 37</p>
              <p>52080 Aachen</p>
              <p>Deutschland</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Am+Gutshof+37,+52080+Aachen,+Deutschland"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs underline"
                style={{ color: C.neon }}
              >
                Google Maps'te aç →
              </a>
            </div>
          </div>
          {cols.map((col, i) => (
            <div key={i}>
              <p className="text-xs uppercase mb-4" style={{ color: C.text, letterSpacing: '0.2em' }}>{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l, j) => (
                  <li key={j}><a href="#" className="text-sm transition-colors hover:text-white" style={{ color: C.textDim }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mb-10 rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <iframe
            title="Gecit Kfz Sachverständiger - Standort"
            src="https://www.google.com/maps?q=Am+Gutshof+37,+52080+Aachen,+Deutschland&output=embed"
            width="100%"
            height="320"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
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
          background: 'linear-gradient(135deg, #1a1030 0%, #0E0B18 100%)',
          border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20,
          padding: '20px', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>
            📲
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#EDE9FE', marginBottom: 4 }}>
              Gecit Kfz Sachverständiger'u Ana Ekrana Ekle
            </div>
            {isIOS ? (
              <div style={{ fontSize: 13, color: '#8B85A8', lineHeight: 1.5 }}>
                <span style={{ color: '#22D3EE' }}>Safari</span>'de alttaki{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(124,58,237,0.15)',
                  borderRadius: 6, padding: '2px 6px', fontSize: 12, verticalAlign: 'middle' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </span>{' '}
                paylaş butonuna bas, sonra <strong style={{ color: '#EDE9FE' }}>"Ana Ekrana Ekle"</strong> seç.
                Push bildirimleri sadece PWA'da çalışır.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#8B85A8', lineHeight: 1.5 }}>
                Uygulamayı telefonuna yükle — push bildirimleri al, çevrimdışı çalış.
              </div>
            )}
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#8B85A8',
            fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
        {!isIOS && deferredPrompt && (
          <button onClick={handleInstall}
            style={{ width: '100%', marginTop: 14, padding: '12px 0', borderRadius: 12,
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Şimdi Yükle
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

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
                    background: service === s ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
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
                    background: date === d.iso ? `linear-gradient(135deg, ${C.neon}, ${C.neon2})` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${date === d.iso ? 'transparent' : C.border}`,
                    color: date === d.iso ? '#0B0818' : C.text,
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
                      background: time === s ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
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

// ═══════════════════════════════════════════════════════════════════
// Landing — varsayilan export. App.jsx bunu cagiriyor.
// ═══════════════════════════════════════════════════════════════════
export default function Landing({ user, onLogin, onLogout, onEnterApp }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    const h = () => setBookOpen(true);
    window.addEventListener('gecit-kfz:book', h);
    return () => window.removeEventListener('gecit-kfz:book', h);
  }, []);

  return (
    <div className="landing-light relative min-h-screen overflow-x-hidden"
      style={{ background: '#ffffff', color: '#000000' }}>
      <style>{`
        /* Not: Tarayici inline style'i rgb()'ye normalize ediyor.
           Bu yuzden hex degil rgb formatinda hedef aliyoruz. */

        /* 1) Beyaz / gri / acik renk yazilar -> SIYAH */
        /* #EDE9FE = rgb(237,233,254) | #8B85A8 = rgb(139,133,168) | beyaz = rgb(255,255,255) | #FFFFF0 = rgb(255,255,240) */
        .landing-light [style*="color: rgb(237, 233, 254)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(237,233,254)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(139, 133, 168)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(139,133,168)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(255, 255, 255)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(255,255,255)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(255, 255, 240)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(255,255,240)"]:not(footer):not(footer *),
        .landing-light [style*="color: white"]:not(footer):not(footer *),
        .landing-light [style*="color:white"]:not(footer):not(footer *) {
          color: #000000 !important;
        }

        /* 2) Mor / mavi / pembe vurgular -> KIRMIZI */
        /* #A78BFA = rgb(167,139,250) | #7C3AED = rgb(124,58,237) | #22D3EE = rgb(34,211,238) | #F472B6 = rgb(244,114,182) */
        .landing-light [style*="color: rgb(167, 139, 250)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(167,139,250)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(124, 58, 237)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(124,58,237)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(34, 211, 238)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(34,211,238)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(244, 114, 182)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(244,114,182)"]:not(footer):not(footer *) {
          color: #e10600 !important;
        }

        /* 2b) Koyu yuzey arka planlarini acik gri yap (kart icleri okunabilir olsun) */
        /* C.surface = #0E0B18 = rgb(14,11,24) | C.surface2 = #141027 = rgb(20,16,39) | C.bg = #07060B = rgb(7,6,11) */
        .landing-light [style*="background: rgb(14, 11, 24)"]:not(footer):not(footer *),
        .landing-light [style*="background:rgb(14,11,24)"]:not(footer):not(footer *),
        .landing-light [style*="background-color: rgb(14, 11, 24)"]:not(footer):not(footer *),
        .landing-light [style*="background-color:rgb(14,11,24)"]:not(footer):not(footer *),
        .landing-light [style*="background: rgb(20, 16, 39)"]:not(footer):not(footer *),
        .landing-light [style*="background:rgb(20,16,39)"]:not(footer):not(footer *),
        .landing-light [style*="background-color: rgb(20, 16, 39)"]:not(footer):not(footer *),
        .landing-light [style*="background-color:rgb(20,16,39)"]:not(footer):not(footer *),
        .landing-light [style*="background: rgb(7, 6, 11)"]:not(footer):not(footer *),
        .landing-light [style*="background:rgb(7,6,11)"]:not(footer):not(footer *) {
          background: #f5f5f7 !important;
          background-color: #f5f5f7 !important;
          border-color: rgba(0,0,0,0.08) !important;
        }

        /* 2d) MeshBackground'taki mor/cyan/pembe blob'lari hafifletip kirmiziya cevir */
        .landing-light [style*="background: rgb(124, 58, 237)"]:not(footer):not(footer *),
        .landing-light [style*="background:rgb(124,58,237)"]:not(footer):not(footer *) {
          background: #e10600 !important;
          opacity: 0.06 !important;
        }
        .landing-light [style*="background: rgb(34, 211, 238)"]:not(footer):not(footer *),
        .landing-light [style*="background:rgb(34,211,238)"]:not(footer):not(footer *) {
          background: #fca5a5 !important;
          opacity: 0.05 !important;
        }
        .landing-light [style*="background: rgb(244, 114, 182)"]:not(footer):not(footer *),
        .landing-light [style*="background:rgb(244,114,182)"]:not(footer):not(footer *) {
          background: #fecaca !important;
          opacity: 0.05 !important;
        }
        .landing-light [style*="background: rgb(167, 139, 250)"]:not(footer):not(footer *),
        .landing-light [style*="background:rgb(167,139,250)"]:not(footer):not(footer *) {
          background: #e10600 !important;
          opacity: 0.05 !important;
        }

        /* 2e) Mor glow (rgba(167,139,250,...)) iceren box-shadow ve textShadow'lari notrlestir */
        .landing-light [style*="rgba(167, 139, 250"]:not(footer):not(footer *),
        .landing-light [style*="rgba(167,139,250"]:not(footer):not(footer *),
        .landing-light [style*="rgba(124, 58, 237"]:not(footer):not(footer *),
        .landing-light [style*="rgba(124,58,237"]:not(footer):not(footer *) {
          box-shadow: 0 4px 16px rgba(225, 6, 0, 0.08) !important;
          text-shadow: none !important;
        }

        /* 2f) Beyaz textShadow'lari kaldir (siyah yazi uzerinde anlamsiz) */
        .landing-light [style*="text-shadow: rgb(255, 255, 255)"]:not(footer):not(footer *),
        .landing-light [style*="text-shadow:rgb(255,255,255)"]:not(footer):not(footer *),
        .landing-light [style*="text-shadow: rgb(255, 255, 240)"]:not(footer):not(footer *) {
          text-shadow: none !important;
        }

        /* 2g) Beyaz/seffaf borderlari acik griye ceviri */
        .landing-light [style*="rgba(255, 255, 255, 0.08)"]:not(footer):not(footer *),
        .landing-light [style*="rgba(255,255,255,0.08)"]:not(footer):not(footer *),
        .landing-light [style*="rgba(255, 255, 255, 0.16)"]:not(footer):not(footer *),
        .landing-light [style*="rgba(255,255,255,0.16)"]:not(footer):not(footer *) {
          border-color: rgba(0, 0, 0, 0.12) !important;
        }

        /* 2h) Tailwind hover:text-white -> beyaz arkaplanda gorunmez; siyah yap */
        .landing-light .hover\\:text-white:hover {
          color: #000000 !important;
        }

        /* 2i) Footer'daki .hover:text-white DOKUNULMASIN — footer hala koyu zeminli */
        .landing-light footer .hover\\:text-white:hover {
          color: #ffffff !important;
        }

        /* 2j) NoiseOverlay opacity'i daha da dusur (beyazda dikkat dagitiyor) */
        .landing-light [style*="mix-blend-mode: overlay"]:not(footer):not(footer *) {
          opacity: 0.02 !important;
        }

        /* 4) Hero/sayfa arkaplanindaki dekoratif blob'lari tamamen kapat (minimalist) */
        .landing-light .fixed.inset-0.overflow-hidden[aria-hidden="true"] {
          display: none !important;
        }

        /* 5) Kart hover spotlight kenari mor yerine KIRMIZI olsun */
        .landing-light [style*="rgba(167, 139, 250, 0.4)"]:not(footer):not(footer *),
        .landing-light [style*="rgba(167,139,250,0.4)"]:not(footer):not(footer *) {
          border-color: #e10600 !important;
        }

        /* 3) Gradient text-fill (WebkitBackgroundClip + TextFillColor transparent) -> KIRMIZI dolgu */
        .landing-light [style*="-webkit-text-fill-color"]:not(footer):not(footer *) {
          -webkit-text-fill-color: #e10600 !important;
          color: #e10600 !important;
          background: none !important;
          background-image: none !important;
          background-color: transparent !important;
        }
      `}</style>
      <MeshBackground />
      <NoiseOverlay />
      <ScrollProgress />
      <Navbar user={user} onLoginClick={() => setLoginOpen(true)} onLogout={onLogout}
        onEnterApp={onEnterApp} onBook={() => setBookOpen(true)} />
      <LoginDrawer open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={onLogin} />
      <AppointmentBookingModal open={bookOpen} onClose={() => setBookOpen(false)} onBook={() => {}} />
      <main className="relative" style={{ zIndex: 2 }}>
        <Hero />
        <BannerShowcase />
        <Marquee />
        <Features />
        <KostenlosBanner />
        <RechteSection />
        <WhyGecitKfz />
        <HowItWorks />
        <Stats />
        <Testimonial />
        <Pricing />
        <FooterCTA />
      </main>
      <Footer />
      <PWAInstallBanner />
    </div>
  );
}
