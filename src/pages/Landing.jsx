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
import { signIn as supabaseSignIn, signOut as supabaseSignOut, buildSessionUser } from '../utils/supabaseAuth.js';
import {
  Svg, ArrowRight, Play, Check, ChevronRight, Sparkles, Brain, Zap, Target,
  TrendingUp, Rocket, Shield, BarChart3, Globe, Layers, Cpu, Database, Code, Quote,
  XClose, LogOutIcon, Wrench, MailIcon, ScaleIcon, ShieldIcon, GlobeIcon,
  InfinityIcon, UsersGroupIcon, RadioTowerIcon, FolderCheckIcon,
  CarIcon, ClipboardIcon, FileText, MessageIcon, PhoneIcon, PlusIcon, ArrowLeft,
  CheckSquare, DownloadIcon
} from '../components/icons.jsx';
import { GecitKfzModal } from '../components/Modal.jsx';
import { 
  SubPageLayout, SubPageContent 
} from './SubPageContent.jsx';
import { LangProvider, useLang } from '../i18n/LangContext.jsx';
import { LanguageSelector } from '../i18n/LanguageSelector.jsx';
import Hero from './landing/Hero.jsx';
import CTA from './landing/CTA.jsx';
import Features from './landing/Features.jsx';
import Footer from './landing/Footer.jsx';
import VerkehrsunfallSection from './landing/VerkehrsunfallSection.jsx';

// IIFE-with-hooks pattern icin kucuk yardimci.
function Iife({ children }) { return children(); }

function Typewriter({ text, speed = 80 }) {
  const [disp, setDisp] = useState('');
  useEffect(() => {
    let i = 0;
    let isDeleting = false;
    const tick = () => {
      setDisp(isDeleting ? text.substring(0, i - 1) : text.substring(0, i + 1));
      i = isDeleting ? i - 1 : i + 1;
      let delta = speed - Math.random() * 40;
      if (isDeleting) delta /= 2.5;
      if (!isDeleting && i === text.length) { isDeleting = true; delta = 3000; }
      else if (isDeleting && i === 0) { isDeleting = false; delta = 1000; }
      setTimeout(tick, delta);
    };
    const t = setTimeout(tick, 1000);
    return () => clearTimeout(t);
  }, [text, speed]);
  return <span className="border-r-2 border-[#E30613] pr-1">{disp}</span>;
}

// ─── Noise overlay ──────────────────────────────
function NoiseOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40"
         style={{ mixBlendMode: 'overlay', opacity: 0.01 }} aria-hidden="true">
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
        scaleX: scale, height: 3,
        background: '#E30613',
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

// ─── Mesh BG (minimal — light theme) ────────────
function MeshBackground() {
  return null;
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
  const baseCls = 'relative inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-lg px-7 py-3.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]';
  const style = variant === 'primary'
    ? { background: '#E30613', color: '#FFFFFF',
        boxShadow: '0 4px 20px -4px rgba(227,6,19,0.45)' }
    : { background: 'transparent', color: '#0A0A0A', border: '1px solid rgba(0,0,0,0.16)' };
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
function Navbar({ user, onLoginClick, onLogout, onEnterApp, onBook, setActiveSubPage }) {
  const { t } = useLang();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setScrolled(latest > 20);
    });
  }, [scrollY]);

  const links = [
    { key: 'home',     label: t('nav.home'),     href: '#home' },
    { key: 'services', label: t('nav.services'), href: '#leistungen' },
    { key: 'about',    label: t('nav.about'),    href: '#ueber-uns' },
    { key: 'process',  label: t('nav.process'),  href: '#ablauf' },
    { key: 'contact',  label: t('nav.contact'),  href: '#kontakt' },
  ];

  const initials = user ? user.email.slice(0, 2).toUpperCase() : '';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed left-0 right-0 z-50 transition-all duration-300"
      style={{
        top: 'calc(26px + env(safe-area-inset-top))',
        background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
        height: scrolled ? '96px' : '130px',
        boxShadow: scrolled ? '0 10px 40px rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
        {/* Logo */}
        <a href="#" className="flex items-center h-full gap-3 flex-shrink-0">
          <img src="/logocustom3.png" alt="Gecit Kfz Sachverständiger" 
            className="h-14 sm:h-16 md:h-20 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
          <div className="hidden xl:flex items-center gap-2 border-l border-gray-100 pl-4 h-8">
            <span className="text-xs leading-none">🇩🇪</span>
            <span className="text-[10px] font-bold tracking-[0.1em] text-[#E30613] uppercase leading-none">
              {t('topbar.service')}
            </span>
          </div>
        </a>

        {/* Mobile Center Service Badge */}
        <div className="flex md:hidden flex-1 justify-center px-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
            <span className="text-xs leading-none">🇩🇪</span>
            <span className="text-[8px] font-black tracking-[0.05em] text-[#E30613] uppercase leading-none">
              {t('topbar.service')}
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-5 lg:gap-8 h-full">
          {links.map((link, i) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(e) => {
                if (link.key === 'contact') {
                  e.preventDefault();
                  setActiveSubPage('kontakt');
                }
              }}
              className="relative text-xs lg:text-sm font-black tracking-[0.25em] transition-all hover:text-[#E30613] hover:scale-110"
              style={{ color: i === 0 ? '#E30613' : '#0A0A0A' }}
            >
              {link.label}
              {i === 0 && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-[#E30613] rounded-full"
                />
              )}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-4 ml-auto pl-8 lg:pl-12">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 overflow-hidden"
                  >
                    <button
                      onClick={onEnterApp}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-lg"
                    >
                      {t('nav.dashboard')}
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      {t('nav.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="hidden sm:block text-xs font-bold tracking-widest text-gray-500 hover:text-black transition-colors"
            >
              {t('nav.login')}
            </button>
          )}
          <button
            onClick={onBook}
            className="hidden sm:block px-6 py-3 bg-[#E30613] text-white text-xs font-bold tracking-widest rounded-md hover:bg-[#B0050F] transition-colors shadow-lg shadow-red-500/20 keep-white"
          >
            {t('nav.book')}
          </button>
          
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>
          
          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200"
          >
            <Svg size={20}>
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 12h16M4 6h16M4 18h16" />
              )}
            </Svg>
          </button>
        </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 bottom-0 w-[85%] max-w-sm z-50 bg-white shadow-2xl flex flex-col md:hidden"
              style={{ top: 'calc(26px + env(safe-area-inset-top))' }}
            >
              <div className="p-6 flex flex-col gap-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <img src="/logocustom3.png" alt="Logo" className="h-10 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
                  <button 
                    onClick={() => setMobileOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500"
                  >
                    <XClose size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 self-start">
                  <span className="text-xs">🇩🇪</span>
                  <span className="text-[10px] font-black tracking-widest text-[#E30613] uppercase leading-none">
                    {t('topbar.service')}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-6">
                {links.map((l, idx) => (
                  <motion.a
                    key={l.key}
                    href={l.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="text-2xl font-black tracking-tighter text-[#0A0A0A] hover:text-[#E30613] transition-colors"
                    onClick={(e) => {
                      setMobileOpen(false);
                      if (l.key === 'contact') {
                        e.preventDefault();
                        setActiveSubPage('kontakt');
                      }
                    }}
                  >
                    {l.label}
                  </motion.a>
                ))}

                <div className="mt-2 pt-6 border-t border-gray-100">
                  <div className="text-[10px] font-bold tracking-[0.25em] text-gray-400 mb-3">
                    {t('lang.label').toUpperCase()}
                  </div>
                  <LanguageSelector variant="mobile" />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                {user ? (
                  <button
                    onClick={() => { onLogout(); setMobileOpen(false); }}
                    className="w-full py-3 mb-3 bg-white border border-gray-200 text-[#0A0A0A] font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50"
                  >
                    {t('nav.logout')}
                  </button>
                ) : (
                  <button
                    onClick={() => { setMobileOpen(false); onLoginClick(); }}
                    className="w-full py-3 mb-3 bg-white border border-gray-200 text-[#0A0A0A] font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50"
                  >
                    {t('nav.login')}
                  </button>
                )}
                <button
                  onClick={() => { onBook(); setMobileOpen(false); }}
                  className="w-full py-4 bg-[#E30613] text-white font-bold rounded-lg shadow-lg shadow-red-500/20 keep-white flex items-center justify-center gap-3"
                >
                  <PhoneIcon size={18} />
                  {t('nav.book')}
                </button>
                <div className="mt-6 flex flex-col gap-2">
                  <a href="tel:+4915732624362" className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#E30613]">
                      <PhoneIcon size={14} />
                    </div>
                    +49 157 326 243 62
                  </a>
                  <a href="mailto:Gecit@kfzgutachter.ac" className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#E30613]">
                      <MailIcon size={14} />
                    </div>
                    Gecit@kfzgutachter.ac
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
      const { user, error: signErr } = await supabaseSignIn(em, password);
      if (signErr || !user) {
        setError('E-Mail veya şifre hatalı.');
        return;
      }
      if (!user.role) {
        await supabaseSignOut();
        setError('Hesabınız henüz yetkilendirilmemiş. Yöneticiyle iletişime geçin.');
        return;
      }
      if (user.active === false) {
        await supabaseSignOut();
        setError('Hesabınız devre dışı bırakılmış.');
        return;
      }
      onLogin(buildSessionUser(user, user));
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
            aria-hidden="true"
            className="fixed inset-0 backdrop-blur-sm"
            style={{ zIndex: 60, background: 'rgba(0,0,0,0.40)' }} />
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
              role="dialog" aria-modal="true" aria-label="Anmelden"
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col overflow-y-auto pointer-events-auto rounded-2xl"
              style={{ width: 'min(440px, 100%)', maxHeight: '90vh',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: '0 24px 64px -16px rgba(0,0,0,0.18)' }}>

            <div className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-3 font-black tracking-tight" style={{ lineHeight: 1 }}>
                <img src="/logocustom3.png" alt="Logo" className="h-10 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
                <span style={{ color: '#0A0A0A', fontSize: 16 }}>Gecit Kfz Sachverständiger</span>
              </div>
              <button onClick={onClose} aria-label="Kapat"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ color: '#6B6B6B', border: '1px solid rgba(0,0,0,0.10)' }}>
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

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase mb-2"
                    style={{ color: C.textDim, letterSpacing: '0.2em' }}>E-Mail</label>
                  <input type="email" required value={email} autoFocus
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="sen@sirket.com"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.12)', color: '#0A0A0A' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #E30613'; e.target.style.background = '#FFFFFF'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(0,0,0,0.12)'; e.target.style.background = '#FAFAFA'; }} />
                </div>
                <div>
                  <label className="block text-xs uppercase mb-2"
                    style={{ color: C.textDim, letterSpacing: '0.2em' }}>Passwort</label>
                  <input type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.12)', color: '#0A0A0A' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #E30613'; e.target.style.background = '#FFFFFF'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(0,0,0,0.12)'; e.target.style.background = '#FAFAFA'; }} />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm px-4 py-3 rounded-lg"
                      style={{ background: 'rgba(227,6,19,0.06)', border: '1px solid rgba(227,6,19,0.2)', color: '#B0050F' }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between text-xs" style={{ color: '#6B6B6B' }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked
                      style={{ accentColor: C.neon }} />
                    Angemeldet bleiben
                  </label>
                  <a href="#" className="hover:text-white transition-colors">Passwort vergessen</a>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${C.neon} 0%, ${C.neon2} 100%)`,
                    color: '#FFFFFF',
                    boxShadow: `0 12px 40px -12px ${C.glow}` }}>
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

// Hero, CTA, Features → src/pages/landing/{Hero,CTA,Features}.jsx
// Footer → src/pages/landing/Footer.jsx

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
              Gecit Kfz Sachverständiger zum Home-Bildschirm
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
                Drücken Sie die Teilen-Schaltfläche und wählen Sie <strong style={{ color: '#EDE9FE' }}>"Zum Home-Bildschirm"</strong>.
                Push-Benachrichtigungen funktionieren nur in der PWA.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#8B85A8', lineHeight: 1.5 }}>
                Installieren Sie die App auf Ihrem Telefon — erhalten Sie Push-Benachrichtigungen und arbeiten Sie offline.
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
            Jetzt hochladen
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Banner Showcase (One-File / Vier Portale) ─────
function BannerShowcase({ setLightbox }) {
  const banners = [
    {
      src: '/banner/unnamed%20(13).png',
      alt: 'Gecit Kfz Sachverständiger — Ein Index, Vier Welten: Kunde, Anwalt, Versicherer, Admin',
      title: 'Vier Portale, Ein Index',
      desc: 'Kunden, Anwälte, Versicherer und Admin — vier Portale in einer index.html Datei.',
      accent: C.neon,
    },
    {
      src: '/banner/unnamed%20(14).png',
      alt: 'Gecit Kfz Sachverständiger — One File Architecture: Das gesamte Kfz-Expertise-Ökosystem',
      title: 'One File Architecture',
      desc: 'Keine Installation, kein Server. Das gesamte Ökosystem läuft direkt im Browser.',
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
            Eine Datei, <span style={{ color: C.neon }}>Vier Portale</span>, Ein Ökosystem
          </h2>
          <p className="mt-4 text-base md:text-lg max-w-2xl mx-auto" style={{ color: C.textDim }}>
            Architektur-Zusammenfassung: Alle Glieder der Kfz-Expertise-Kette vereint in einer Datei.
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
                    Vergrößern <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Marquee ────────────────────────────────────
function MarqueeGermany() {
  const { t } = useLang();
  const logos = [
    { Icon: Shield, label: 'OtoVERTRAUEN' }, { Icon: Rocket, label: 'Motorex' },
    { Icon: BarChart3, label: 'TramerX' }, { Icon: Globe, label: 'AutoNet' },
    { Icon: Layers, label: 'Dynamo' }, { Icon: Cpu, label: 'ChassisPro' },
    { Icon: Database, label: 'GaraBox' }, { Icon: Code, label: 'OtoLink' },
  ];
  const doubled = [...logos, ...logos];
  const rm = useReducedMotion();
  return (
    <section className="relative py-12 overflow-hidden keep-white" style={{ zIndex: 2, background: '#E30613' }}>
      <div className="relative">
        <motion.div className="flex gap-20 whitespace-nowrap"
          animate={rm ? {} : { x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 flex-shrink-0" style={{ color: '#FFFFFF' }}>
              <div className="flex items-center gap-3">
                <Shield size={24} strokeWidth={2.5} />
                <span className="text-2xl font-black italic tracking-tighter uppercase">ANERKANNT BEI ALLEN DEUTSCHEN WERKSTÄTTEN</span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.5rem' }}>🇩🇪</span>
                <span className="text-2xl font-black italic tracking-tighter uppercase">BUNDESWEITER SERVICE</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={24} strokeWidth={2.5} />
                <span className="text-2xl font-black italic tracking-tighter uppercase">UNABHÄNGIG & NEUTRAL</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function MarqueeService() {
  const rm = useReducedMotion();
  return (
    <section className="relative py-12 overflow-hidden keep-white" style={{ zIndex: 2, background: '#E30613' }}>
      <div className="relative">
        <motion.div className="flex gap-20 whitespace-nowrap"
          animate={rm ? {} : { x: ['-50%', '0%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
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
function PlatformFeatures() {
  const features = [
    { icon: Brain, title: 'KI-Fahrzeugschein-Scan (OCR)', desc: 'Laden Sie ein Foto des Fahrzeugscheins hoch — Fahrgestellnummer, Kennzeichen, Marke und Modell werden in Sekunden ausgefüllt.', span: 'col-span-12 md:col-span-8', size: 'lg', accent: C.neon },
    { icon: Zap, title: 'Echtzeit-Fahrzeughistorie', desc: 'Greifen Sie mit einem Klick auf die Historie, Unfälle und Teileberichte über Fahrgestellnummer oder Kennzeichen zu.', span: 'col-span-12 md:col-span-4', size: 'lg', accent: C.cyan },
    { icon: Target, title: 'Online-Terminsystem', desc: 'Synchronisiert mit Google Kalender. Kunden buchen Termine, die sofort in Ihren Kalender eingetragen werden.', span: 'col-span-12 md:col-span-5', size: 'md', accent: C.magenta },
    { icon: TrendingUp, title: 'Live-Begutachtungs-Tracking', desc: 'Mechanik, Karosserie, Lackierung, Bericht. Der Kunde sieht jede Phase des Prozesses in Echtzeit.', span: 'col-span-12 md:col-span-7', size: 'md', accent: C.neon2 },
  ];

  return (
    <section className="relative py-24 md:py-48" style={{ zIndex: 2 }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1400 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="mb-16 md:mb-24 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>FUNKTIONEN</p>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold max-w-3xl" style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Der <span style={{ color: C.neon }}>digitale Standard</span> der Kfz-Begutachtung.
            </h2>
            <p className="mt-6 text-lg max-w-2xl" style={{ color: C.textDim }}>
              Fahrzeugschein-Scan, Historie, Terminmanagement und Kundenportal — alles unter einem Dach.
            </p>
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
                      Details ansehen <ChevronRight size={14} />
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

// ─── Kirmizi bant CTA ────────────────────────────
function KostenlosBanner() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1400 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: '#E30613',
            border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Glow effects kaldırıldı */}

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
                <p className="text-xs uppercase mb-3 font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Ihre Vorteile mit uns
                </p>
                <h2 className="text-3xl md:text-5xl font-bold mb-4"
                  style={{ color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  Kostenlos für <span className="opacity-90">Geschädigte</span>
                </h2>
                <p className="text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Bei Fremdverschuldung zahlen Sie nichts. Wir rechnen direkt mit der gegnerischen Versicherung ab.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <span style={{ color: '#FFFFFF', fontSize: 16 }}>✓</span>
                    <span className="text-sm" style={{ color: '#FFFFFF' }}>Keine Vorauszahlung</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <span style={{ color: '#FFFFFF', fontSize: 16 }}>✓</span>
                    <span className="text-sm" style={{ color: '#FFFFFF' }}>Direkte Abrechnung</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <span style={{ color: '#FFFFFF', fontSize: 16 }}>✓</span>
                    <span className="text-sm" style={{ color: '#FFFFFF' }}>Professionelles Gutachten</span>
                  </div>
                </div>
              </div>

              {/* Right — CTA button */}
              <a href="tel:015732624362"
                className="inline-flex items-center gap-3 px-7 py-3.5 rounded-lg font-bold text-sm flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.80)',
                  color: '#FFFFFF', letterSpacing: '0.04em', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <Svg size={16} style={{ color: '#FFFFFF' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16h.5z"/>
                </Svg>
                JETZT ANRUFEN
              </a>
            </div>
            <p className="text-sm md:text-base font-medium mt-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Ihr professioneller Kfz-Gutachter — Aachen und Umgebung
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// VerkehrsunfallSection → src/pages/landing/VerkehrsunfallSection.jsx

// ─── Vehicle classes / Fahrzeugklassen ────────────
function FahrzeugklassenSection({ onBook }) {
  const RED = '#E30613';
  const iconProps = { width: 36, height: 36, viewBox: '0 0 24 24', fill: 'none', stroke: RED, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const items = [
    {
      key: 'pkw',
      icon: (
        <svg {...iconProps}><path d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5"/><path d="M3 13h18v4a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2H8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-4z"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="16.5" cy="16" r="1.2"/></svg>
      ),
    },
    {
      key: 'electric',
      icon: (
        <svg {...iconProps}><path d="M11 2L9 12h4l-2 10"/><path d="M18.5 13l2-5a3 3 0 0 0-2.8-2h-1.4"/><path d="M3 13h16v4a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2H8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-4z"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="16.5" cy="16" r="1.2"/></svg>
      ),
    },
    {
      key: 'hybrid',
      icon: (
        <svg {...iconProps}><path d="M3 13l2-5a3 3 0 0 1 2.8-2h6.4A3 3 0 0 1 17 8l2 5"/><path d="M3 13h16v4a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2H8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-4z"/><path d="M21 9v6"/><path d="M11 9l-2 3h3l-2 3"/></svg>
      ),
    },
    {
      key: 'construction',
      icon: (
        <svg {...iconProps}><path d="M2 17V7a1 1 0 0 1 1-1h11v11"/><path d="M14 10h4l3 4v3h-7"/><circle cx="6.5" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/><path d="M10 6v-4h4v4"/></svg>
      ),
    },
    {
      key: 'trailers',
      icon: (
        <svg {...iconProps}><rect x="3" y="7" width="14" height="9" rx="1"/><path d="M17 14h4"/><circle cx="21.5" cy="14.5" r="1"/><circle cx="8" cy="18" r="1.5"/><circle cx="13" cy="18" r="1.5"/></svg>
      ),
    },
    {
      key: 'trucks',
      icon: (
        <svg {...iconProps}><path d="M2 17V7a1 1 0 0 1 1-1h11v11"/><path d="M14 10h4l3 4v3h-7"/><circle cx="6.5" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/></svg>
      ),
    },
    {
      key: 'training',
      icon: (
        <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
      ),
    },
    {
      key: 'moto',
      icon: (
        <svg {...iconProps}><circle cx="5.5" cy="16" r="3"/><circle cx="18.5" cy="16" r="3"/><path d="M5.5 16l4-6h5l3 6"/><path d="M14 7h3v3"/></svg>
      ),
    },
    {
      key: 'certs',
      icon: (
        <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11l3 3 5-5"/></svg>
      ),
    },
  ];
  return (
    <section className="relative py-12 md:py-32" style={{ zIndex: 2 }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1300 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-14">
          <div className="text-sm md:text-base font-semibold mb-3" style={{ color: RED, letterSpacing: '0.02em' }}>
            {t('vehicle_classes.subheading')}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold"
            style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {t('vehicle_classes.heading')} <span style={{ color: RED }}>{t('vehicle_classes.heading_red')}</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.08 }}
              className="rounded-2xl p-6 md:p-7 flex flex-col h-full"
              style={{ 
                background: item.key === 'certs' ? 'rgba(227,6,19,0.02)' : '#FAFAFA', 
                border: item.key === 'certs' ? `1px solid rgba(227,6,19,0.2)` : `1px solid ${C.border}`,
                backdropFilter: 'blur(4px)' 
              }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.25)' }}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold" style={{ color: RED }}>
                  {t(`vehicle_classes.${item.key}.title`)}
                </h3>
              </div>
              <p className="leading-relaxed text-sm flex-1" style={{ color: C.textDim }}>
                {t(`vehicle_classes.${item.key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
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
    <section className="relative py-24 md:py-32" style={{ zIndex: 2, background: '#FAFAFA' }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1300 }}>
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
              Als Geschädigter haben Sie viele Rechte. Wir setzen diese für Sie durch.
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
                style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #E30613, #B0050F)',
                      boxShadow: '0 0 20px rgba(227,6,19,0.25)' }}>
                    <Check size={18} className="text-white" />
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
      title: 'Lebenslanger Zugriff',
      desc: 'Ihre Gutachten sind dauerhaft in Ihrem digitalen Archiv gespeichert. Jederzeit abrufbar.',
      accent: C.neon,
      gradient: `linear-gradient(135deg, ${C.neon}18, ${C.neon2}08)`,
      borderColor: `${C.neon}30`,
      stat: '∞',
      statLabel: 'Unbegrenzte Speicherung',
    },
    {
      icon: GlobeIcon,
      title: 'Zugriff von überall',
      desc: 'Smartphone, Tablet oder Computer — Ihre Dokumente sind auf jedem Gerät dabei.',
      accent: C.cyan,
      gradient: `linear-gradient(135deg, ${C.cyan}18, rgba(6,182,212,0.05))`,
      borderColor: `${C.cyan}30`,
      stat: '24/7',
      statLabel: 'Rund um die Uhr',
    },
    {
      icon: UsersGroupIcon,
      title: 'Ein Portal, drei Nutzer',
      desc: 'Kunden, Anwälte und Versicherer nutzen dieselbe Plattform für einen reibungslosen Informationsfluss.',
      accent: C.magenta,
      gradient: `linear-gradient(135deg, ${C.magenta}18, rgba(236,72,153,0.05))`,
      borderColor: `${C.magenta}30`,
      stat: '3in1',
      statLabel: 'Vereinte Plattform',
    },
    {
      icon: RadioTowerIcon,
      title: 'Live-Datenfluss',
      desc: 'Verfolgen Sie die Begutachtung live. Mechanik, Karosserie, Bericht — alles in Echtzeit.',
      accent: '#34D399',
      gradient: 'linear-gradient(135deg, rgba(52,211,153,0.09), rgba(16,185,129,0.04))',
      borderColor: 'rgba(52,211,153,0.3)',
      stat: 'LIVE',
      statLabel: 'Echtzeit',
    },
    {
      icon: FolderCheckIcon,
      title: 'Zentrale Belegverfolgung',
      desc: 'Belege in 51 Kategorien, Verwaltung über ein einziges Panel. Begutachtung, Versicherung, rechtlicher Prozess – jedes Dokument an seinem Platz.',
      accent: '#F59E0B',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.09), rgba(217,119,6,0.04))',
      borderColor: 'rgba(245,158,11,0.3)',
      stat: '51',
      statLabel: 'Dokumentenkategorien',
    },
  ];

  return (
    <section className="relative py-44 md:py-56 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-10 relative" style={{ maxWidth: 1400 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-20">
          <p className="text-xs uppercase mb-5 font-semibold" style={{ color: C.cyan, letterSpacing: '0.25em' }}>Warum Gecit Kfz Sachverständiger?</p>
          <h2 className="text-4xl md:text-6xl font-semibold max-w-4xl mx-auto" style={{ color: '#000', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Warum <span style={{ color: "#e10600" }}>Gecit</span> Kfz Sachverständiger wählen?
          </h2>
          <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: C.textDim }}>
            Ihre Dokumente sind sicher, Ihre Prozesse transparent, alle auf demselben Stand.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.1 }}
              className="group h-full">
              <SpotlightCard className="h-full relative overflow-hidden"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: b.gradient }} />
                <div className="relative p-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                      style={{ background: `${b.accent}15`, border: `1px solid ${b.accent}30`, color: b.accent }}>
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
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Expertise Grid */}
        <div className="mt-32">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: C.text }}>Unsere Zertifizierungen & Expertise</h3>
            <div className="w-20 h-1.5 bg-[#e10600] mx-auto rounded-full mb-6" />
            <p className="text-gray-500 max-w-xl mx-auto">
              Wir verfügen über offizielle Zertifikate für modernste Antriebstechniken, Spezialfahrzeuge und Fachtrainings.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Zap, title: 'Elektro & Hybrid', desc: 'Zertifiziert für Hochvolt-Systeme', color: '#10B981' },
              { icon: CarIcon, title: 'Spezial-Anhänger', desc: 'Sonder- & Schwerlast-Dorsen', color: '#6366F1' },
              { icon: Wrench, title: 'Baumaschinen', desc: 'Bagger, Kräne & Spezialgerät', color: '#F59E0B' },
              { icon: RadioTowerIcon, title: 'LKW & TIR', desc: 'Nutzfahrzeuge & Logistik-Einheiten', color: '#E30613' },
              { icon: Layers, title: 'Zweiräder', desc: 'Motorräder & E-Bikes Gutachten', color: '#06B6D4' },
              { icon: ShieldIcon, title: 'Fachtrainings', desc: 'Zertifizierte TIR Schulungen', color: '#8B5CF6' },
            ].map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                className="group p-6 rounded-[2rem] bg-white border border-gray-100 hover:border-[#E30613]/20 hover:shadow-2xl transition-all duration-500 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500"
                  style={{ color: item.color }}>
                  <item.icon size={24} />
                </div>
                <h4 className="text-sm font-bold mb-1" style={{ color: C.text }}>{item.title}</h4>
                <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PeaceOfMindSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1400 }}>
        <div className="relative rounded-[2.5rem] overflow-hidden bg-[#F9FAFB] border border-gray-100 p-8 md:p-20">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[140%] h-[140%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(227,6,19,0.05) 0%, transparent 70%)' }} />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase bg-[#E30613]/10 text-[#E30613] border border-[#E30613]/20 mb-8 inline-block">
                  Rundum-Sorglos-Service
                </span>
                <h2 className="text-4xl md:text-6xl font-bold text-[#0A0A0A] mb-8 leading-[1.05]" style={{ letterSpacing: '-0.04em' }}>
                  Wir kümmern uns um <span className="text-[#E30613]">alles</span>. <br />
                  Sie lehnen sich zurück.
                </h2>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-xl">
                  Unser Team aus zertifizierten Experten übernimmt den gesamten Prozess für Sie. 
                  Vom professionellen Gutachten über die rechtliche Abwicklung bis hin zur Kommunikation mit Versicherungen. 
                  Wir ersparen Ihnen jeglichen Stress mit Anwälten, Gutachten und lästigem Papierkram – wir erledigen alles für Sie, damit Sie den besten Service ohne eigenen Aufwand genießen.
                </p>
                <div className="space-y-4">
                  {[
                    'Professionelle & Zertifizierte Experten',
                    'Komplette Abwicklung mit Anwälten & Versicherungen',
                    'Keine bürokratischen Hürden für Sie',
                    'Maximale Entlastung im Schadensfall'
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                      <div className="w-6 h-6 rounded-full bg-[#E30613] flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                <img src="/images/inspection.jpg" alt="Professionelles KFZ-Gutachter Team" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/20 via-transparent to-transparent" />
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 md:-left-10 z-20 p-6 rounded-2xl bg-white shadow-2xl border border-gray-100 hidden md:block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <ShieldIcon size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">100% Sorgenfrei</div>
                    <div className="text-xs text-gray-500">Full-Service Abwicklung</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DownloadCenter() {
  const docs = [
    {
      title: 'Abtretungserklärung 2026',
      desc: 'Notwendiges Dokument für die direkte Abrechnung mit der Versicherung. So sparen Sie sich die Vorauszahlung.',
      file: '/downloads/abtretungserklaerung_2026.pdf',
      icon: FileText
    },
    {
      title: 'Unfall-Fragebogen 2025',
      desc: 'Erfassungsbogen für alle wichtigen Unfalldaten. Hilft uns, Ihr Gutachten noch schneller zu erstellen.',
      file: '/downloads/fragebogen_2025.pdf',
      icon: CheckSquare
    }
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white" style={{ zIndex: 2 }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1400 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: C.text, letterSpacing: '-0.03em' }}>
            Wichtige <span style={{ color: '#E30613' }}>Dokumente</span> & Downloads
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Hier finden Sie alle notwendigen Formulare für eine reibungslose Abwicklung Ihres Schadensfalls.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {docs.map((doc, i) => (
            <motion.a
              key={i}
              href={doc.file}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
              className="flex items-start gap-6 p-8 rounded-3xl border border-gray-100 bg-gray-50/50 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#E30613] group-hover:bg-[#E30613] group-hover:text-white transition-colors border border-gray-100 flex-shrink-0">
                <doc.icon size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-[#E30613] transition-colors">{doc.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{doc.desc}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-[#E30613] uppercase tracking-wider">
                  Download PDF <DownloadIcon size={14} />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
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
    { n: '01', title: 'Termin vereinbaren', desc: 'Wählen Sie einen passenden Termin im Online-Kalender. Bestätigung erfolgt per SMS und E-Mail.', align: 'left' },
    { n: '02', title: 'Fahrzeugschein hochladen', desc: 'Laden Sie den Fahrzeugschein per Drag & Drop hoch. Die KI liest die Daten in Sekunden aus.', align: 'right' },
    { n: '03', title: 'Bericht erhalten', desc: 'Nach Abschluss der Prüfung erhalten Sie das detaillierte PDF-Gutachten im Portal und per E-Mail.', align: 'left' },
  ];
  return (
    <section id="ablauf" ref={ref} className="relative py-44 md:py-56 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1400 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-20">
          <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>SO FUNKTIONIERT ES</p>
          <h2 className="text-4xl md:text-6xl font-semibold" style={{ color: C.text, letterSpacing: '-0.03em' }}>
            In 3 Schritten zum <span style={{ color: C.neon }}>Sicherem Gutachten</span>
          </h2>
        </motion.div>
        <div className="relative">
          <svg className="absolute left-1/2 top-0 pointer-events-none hidden md:block"
            width="400" height="1100" viewBox="0 0 400 1100"
            style={{ transform: 'translateX(-50%)', zIndex: 0, overflow: 'visible' }}
            aria-hidden="true">
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E30613" />
                <stop offset="50%" stopColor="#B0050F" />
                <stop offset="100%" stopColor="#7A0309" />
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
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center font-mono text-2xl md:text-3xl font-bold"
                    style={{ background: '#FFFFFF', border: '2.5px solid #E30613', color: '#E30613',
                      boxShadow: '0 0 0 6px rgba(227,6,19,0.08)' }}>
                    {s.n}
                  </div>
                </div>
                <div className="flex-1 p-8 md:p-10 rounded-3xl max-w-md"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
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
        style={{ color: C.neon, letterSpacing: '-0.04em' }}>
        {prefix}{disp}{suffix}
      </div>
      <p className="mt-3 text-sm uppercase" style={{ color: C.textDim, letterSpacing: '0.2em' }}>{label}</p>
    </motion.div>
  );
}

function Stats() {
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2, background: '#FFFFFF' }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1400 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="mb-20">
          <p className="text-xs uppercase mb-5" style={{ color: C.neon, letterSpacing: '0.25em' }}>VERTRAUEN</p>
          <h2 className="text-4xl md:text-6xl font-semibold max-w-3xl" style={{ color: C.text, letterSpacing: '-0.03em' }}>
            Vertrauen in Zahlen.
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          <Stat value={15} suffix="K+" label="Erstellte Gutachten" />
          <Stat value={3} suffix="sn" label="Scan-Zeit" />
          <Stat value={120} suffix="+" label="Prüfpunkte" />
          <Stat value={98} suffix="%" label="Kundenzufriedenheit" />
        </div>
      </div>
    </section>
  );
}

// ─── Testimonial ────────────────────────────────
function Testimonial() {
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2, background: '#FAFAFA' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1000 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: easeOut }}
          className="relative p-10 md:p-16 rounded-3xl"
          style={{ background: '#FFFFFF',
            border: `1px solid ${C.border}`, backdropFilter: 'blur(16px)' }}>
          <Quote size={48} style={{ color: C.neon, opacity: 0.6 }} />
          <blockquote className="mt-6 text-3xl md:text-5xl italic leading-tight"
            style={{ color: C.text, letterSpacing: '-0.02em', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            "Wir haben einen Gebrauchtwagen gekauft; Gecit Kfz Sachverständiger hat den Schein in Sekunden gelesen und den Mangel gefunden. Absolut empfehlenswert."
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg"
              style={{ background: `linear-gradient(135deg, ${C.neon}, ${C.magenta})`, color: '#FFFFFF' }}>MY</div>
            <div>
              <p style={{ color: C.text }} className="font-medium">Mehmet Yildiz</p>
              <p className="text-sm" style={{ color: C.textDim }}>Mitbegründer @ Yıldız Motors</p>
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
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.6 }}
      className={`relative p-8 rounded-3xl h-full flex flex-col transition-all duration-500 ${highlighted ? 'keep-white' : ''}`}
      style={{ 
        background: highlighted ? C.neon : 'white',
        border: highlighted ? 'none' : `1px solid ${C.border}`,
        boxShadow: highlighted ? `0 20px 40px ${C.glow}40` : 'none',
        color: highlighted ? '#FFFFFF' : C.text 
      }}>
      {highlighted && (
        <div className="absolute px-4 py-1 rounded-full text-[10px] uppercase font-bold"
          style={{ top: 16, right: 16, background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', letterSpacing: '0.1em' }}>AM BELIEBTESTEN</div>
      )}
      <p className="text-xs uppercase mb-4 font-bold" style={{ color: highlighted ? '#FFFFFF' : C.neon, opacity: highlighted ? 0.8 : 1, letterSpacing: '0.15em' }}>{name}</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-5xl font-bold font-mono tabular-nums"
          style={{ letterSpacing: '-0.03em' }}>{price}</span>
        {price !== 'Individuell' && <span className="text-sm opacity-60">/ay</span>}
      </div>
      <p className="mb-8 text-sm opacity-80">{desc}</p>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <Check size={16} className={highlighted ? "text-white" : "text-[#E30613]"} style={{ marginTop: 3, flexShrink: 0 }} />
            <span className={highlighted ? "text-white" : "text-[#0A0A0A]"}>{f}</span>
          </li>
        ))}
      </ul>
      <button 
        data-magnetic 
        className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
        style={highlighted
          ? { background: '#FFFFFF', color: C.neon }
          : { background: '#F9FAFB', color: '#0A0A0A', border: `1px solid ${C.border}` }}
      >
        {cta}
      </button>
    </motion.div>
  );
}

function Pricing({ onBook }) {
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2, background: '#FFFFFF' }}>
      <div className="mx-auto px-10" style={{ maxWidth: 1400 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-16">
          <p className="text-xs uppercase mb-4 font-bold" style={{ color: '#E30613', letterSpacing: '0.25em' }}>Paketler</p>
          <h2 className="text-4xl md:text-6xl font-semibold" style={{ color: C.text, letterSpacing: '-0.03em' }}>
            Das richtige Paket für jedes Fahrzeug.
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingCard name="Standard" price="₺1.490" desc="Das Basis-Paket für Privatpersonen."
            features={['60 Punkte Sichtprüfung', 'Digitaler PDF-Bericht', 'Abfrage der Fahrzeughistorie', 'Online-Termin + SMS-Benachrichtigung']} cta="Termin vereinbaren" />
          <PricingCard name="Premium" price="₺2.990" desc="Die erste Wahl für Gebrauchtwagenkäufer und Autohäuser."
            features={['120 Punkte Detailprüfung', 'KI-Fahrzeugschein-OCR-Analyse', 'Karosserie + Lackdickenmessung', 'Motor + Getriebetest', 'Vollständiger Zugriff auf das Kundenportal']}
            highlighted cta="Premium wählen" />
          <PricingCard name="Business" price="Individuell" desc="Spezielle Lösungen für Autohäuser, Versicherungen und Flotten."
            features={['Monatlich unbegrenzte Gutachten', 'CRM + API Integration', 'Rechnungsstellung & Tracking', 'Priorisierte Service-Hotline + SLA']} cta="Kontaktieren Sie uns" />
        </div>
      </div>
    </section>
  );
}

function AdminButton({ children, variant = 'ghost', size = 'md', onClick, type = 'button', disabled, className = '' }) {
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const style = variant === 'primary'
    ? { background: `linear-gradient(135deg, ${C.neon} 0%, ${C.neon2} 100%)`, color: '#FFFFFF', boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px -8px ${C.glow}` }
    : variant === 'danger'
    ? { background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)', color: C.magenta }
    : { background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all hover:opacity-90 disabled:opacity-50 ${sizeCls} ${className}`}
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
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${focus ? C.neon : C.border}`, color: C.text }} />
  );
}

function FooterCTA({ onBook }) {
  const rm = useReducedMotion();
  return (
    <section className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: '100vh', zIndex: 2 }}>
      {/* Dekoratif blob'lar kaldırıldı */}
      <div className="relative text-center px-6" style={{ maxWidth: 900 }}>
        <RevealHeading text="Entdecken Sie die wahre Geschichte Ihres Fahrzeugs."
          className="text-5xl md:text-7xl lg:text-8xl font-semibold"
          style={{ color: C.text, letterSpacing: '-0.04em', lineHeight: 0.95 }} />
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: easeOut, delay: 0.6 }}
          className="mt-8 text-lg md:text-xl" style={{ color: C.textDim }}>
          15% Rabatt auf Ihr erstes Gutachten. Termin in 5 Minuten.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: easeOut, delay: 0.8 }}
          className="mt-10 flex justify-center">
          <MagneticButton variant="primary" ariaLabel="Online termin al" className="text-base"
            onClick={() => window.dispatchEvent(new CustomEvent('gecit-kfz:book'))}>
            Online Termin vereinbaren <ArrowRight size={18} />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}


function AppointmentBookingModal({ open, onClose, onBook }) {
  const today = new Date();
  const [days] = useState(() => [...Array(14)].map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return { iso: d.toISOString().slice(0,10), day: d.getDate(), wd: d.toLocaleDateString('de-DE', { weekday: 'short' }) };
  }));
  const slots = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [service, setService] = useState('Premium-Begutachtung');
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => { if (open) { setDate(null); setTime(null); setForm({}); setDone(false); setService('Premium-Begutachtung'); } }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (onBook) onBook({ date, time, service, ...form });
    setDone(true);
  };

  return (
    <GecitKfzModal open={open} onClose={onClose} title={done ? "Termin vereinbart 🎉" : "Online Termin vereinbaren"}
      subtitle={done ? "In Google Kalender eingetragen, Bestätigung per SMS gesendet." : "Wählen Sie freie Zeiten, fertig in 30 Sekunden."} width={720}>
      {done ? (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }}>
            <Check size={28} />
          </div>
          <p className="text-lg font-medium" style={{ color: C.text }}>{date} · {time}</p>
          <p className="text-sm mt-2" style={{ color: C.textDim }}>{service}</p>
          <div className="mt-6"><AdminButton variant="primary" onClick={onClose}>Ok</AdminButton></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Service-Paket</p>
            <div className="grid grid-cols-3 gap-2">
              {['Standard-Begutachtung','Premium-Begutachtung','Unternehmensflotte'].map(s => (
                <button type="button" key={s} onClick={() => setService(s)}
                  className="p-3 rounded-xl text-xs text-left transition-all"
                  style={{
                    background: service === s ? 'rgba(227,6,19,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${service === s ? '#E30613' : C.border}`,
                    color: service === s ? C.text : C.textDim,
                    boxShadow: service === s ? `0 0 16px rgba(227,6,19,0.2)` : 'none',
                  }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Datum</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map(d => (
                <button type="button" key={d.iso} onClick={() => setDate(d.iso)}
                  className="flex-shrink-0 w-16 p-3 rounded-xl text-center transition-all"
                  style={{
                    background: date === d.iso ? `linear-gradient(135deg, ${C.neon}, ${C.neon2})` : 'rgba(255,255,255,0.03)',
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
              <p className="text-xs uppercase mb-3" style={{ color: C.textDim, letterSpacing: '0.2em' }}>Uhrzeit</p>
              <div className="grid grid-cols-4 gap-2">
                {slots.map(s => (
                  <button type="button" key={s} onClick={() => setTime(s)}
                    className="p-2.5 rounded-xl text-sm font-mono transition-all"
                    style={{
                      background: time === s ? C.neon : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${time === s ? 'transparent' : C.border}`,
                      color: time === s ? '#FFFFFF' : C.textDim,
                    }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {date && time && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <Field label="Vor- & Nachname" required><TextInput value={form.full_name} onChange={(e) => setForm(f => ({...f, full_name: e.target.value}))} required /></Field>
                <Field label="Telefon" required><TextInput value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} required /></Field>
                <Field label="E-Mail"><TextInput type="email" value={form.email} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} /></Field>
                <Field label="Kennzeichen"><TextInput value={form.plate} onChange={(e) => setForm(f => ({...f, plate: e.target.value}))} /></Field>
              </div>
              <div className="flex justify-between pt-2">
                <p className="text-xs self-center" style={{ color: C.textDim }}>✓ Wird automatisch in Google Kalender eingetragen</p>
                <AdminButton type="submit" variant="primary">Termin buchen <ArrowRight size={14} /></AdminButton>
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
// LangProvider ile saralanir; tum ic component'ler useLang() kullanabilir.
// ═══════════════════════════════════════════════════════════════════
export default function Landing(props) {
  return <LandingInner {...props} />;
}

function LandingInner({ user, onLogin, onLogout, onEnterApp }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  // Background scroll lock for lightbox
  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';
      const root = document.querySelector('.landing-root');
      if (root) root.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      const root = document.querySelector('.landing-root');
      if (root) root.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      const root = document.querySelector('.landing-root');
      if (root) root.style.overflow = '';
    };
  }, [lightbox]);

  useEffect(() => {
    if (activeSubPage) {
      window.scrollTo(0, 0);
    }
  }, [activeSubPage]);

  useEffect(() => {
    const h = () => setBookOpen(true);
    window.addEventListener('gecit-kfz:book', h);
    return () => window.removeEventListener('gecit-kfz:book', h);
  }, []);

  if (activeSubPage) {
    const subPageMap = {
      // Leistungen
      'unfallgutachten': { title: 'Unfallgutachten', type: 'unfallgutachten' },
      'wertgutachten': { title: 'Wertgutachten', type: 'wertgutachten' },
      'baumaschinen': { title: 'Baumaschinen-Gutachten', type: 'baumaschinen' },
      'elektro-hybrid': { title: 'Elektro- & Hybrid-Gutachten', type: 'elektro-hybrid' },
      'lkw-tir': { title: 'LKW- & TIR-Gutachten', type: 'lkw-tir' },
      'spezial-anhaenger': { title: 'Spezial-Anhänger-Gutachten', type: 'spezial-anhaenger' },
      'zweiraeder': { title: 'Zweiräder-Gutachten', type: 'zweiraeder' },
      'tir-schulungen': { title: 'TIR-Schulungen & Fachtrainings', type: 'tir-schulungen' },
      'reparaturkosten': { title: 'Reparaturkosten-Ermittlung', type: 'reparaturkosten' },
      'leasing-check': { title: 'Leasing-Zustandsbericht', type: 'leasing-check' },
      'oldtimer': { title: 'Oldtimer-Bewertung', type: 'oldtimer' },
      
      // Unternehmen
      'über-uns': { title: 'Über uns', type: 'ueber-uns' },
      'philosophie': { title: 'Unsere Philosophie', type: 'philosophie' },
      'standorte': { title: 'Unsere Standorte', type: 'standorte' },
      'karriere': { title: 'Karriere', type: 'karriere' },
      'kontakt': { title: 'Kontakt', type: 'kontakt' },
      
      // Rechtliches
      'impressum': { title: 'Impressum', type: 'impressum' },
      'datenschutz': { title: 'Datenschutz', type: 'datenschutz' },
      'agb': { title: 'Allgemeine Geschäftsbedingungen', type: 'agb' },
      'cookie-richtlinie': { title: 'Cookie-Richtlinie', type: 'cookie-richtlinie' },
      'erstattung': { title: 'Erstattung', type: 'erstattung' },
    };
    
    const page = subPageMap[activeSubPage] || { title: 'Seite nicht gefunden', type: 'unknown' };
    
    return (
      <SubPageLayout title={page.title} onBack={() => {
        setActiveSubPage(null);
        window.scrollTo(0, 0);
      }}>
        <SubPageContent type={page.type} onBack={() => {
          setActiveSubPage(null);
          window.scrollTo(0, 0);
        }} />
      </SubPageLayout>
    );
  }

  return (
    <div className="landing-root relative min-h-screen overflow-x-hidden"
      style={{ background: '#FAFAFA', color: '#0A0A0A' }}>
      <style>{`
        html { scroll-behavior: smooth; }
        /* Not: Tarayici inline style'i rgb()'ye normalize ediyor.
           Bu yuzden hex degil rgb formatinda hedef aliyoruz. */

        /* hover:text-white tailwind class -> siyah arkaplanda anlamsiz, kirmizi yap */
        .landing-root .hover\\:text-white:hover {
          color: #E30613 !important;
        }

        /* 2) Mor / mavi / pembe vurgular -> KIRMIZI */
        /* #A78BFA = rgb(227,6,19) | #7C3AED = rgb(124,58,237) | #22D3EE = rgb(34,211,238) | #F472B6 = rgb(244,114,182) */
        .landing-light [style*="color: rgb(167, 139, 250)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(227,6,19)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(124, 58, 237)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(124,58,237)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(34, 211, 238)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(34,211,238)"]:not(footer):not(footer *),
        .landing-light [style*="color: rgb(244, 114, 182)"]:not(footer):not(footer *),
        .landing-light [style*="color:rgb(244,114,182)"]:not(footer):not(footer *) {
          color: #E30613 !important;
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
          background: #E30613 !important;
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
        .landing-light [style*="background:rgb(227,6,19)"]:not(footer):not(footer *) {
          background: #E30613 !important;
          opacity: 0.05 !important;
        }

        /* 2e) Mor glow (rgba(227,6,19,...)) iceren box-shadow ve textShadow'lari notrlestir */
        .landing-light [style*="rgba(167, 139, 250"]:not(footer):not(footer *),
        .landing-light [style*="rgba(227,6,19"]:not(footer):not(footer *),
        .landing-light [style*="rgba(124, 58, 237"]:not(footer):not(footer *),
        .landing-light [style*="rgba(124,58,237"]:not(footer):not(footer *) {
          box-shadow: 0 4px 16px rgba(227, 6, 19, 0.08) !important;
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
        .landing-light [style*="rgba(227,6,19,0.4)"]:not(footer):not(footer *) {
          border-color: #E30613 !important;
        }

        /* 3) Gradient text-fill (WebkitBackgroundClip + TextFillColor transparent) -> KIRMIZI dolgu */
        .landing-light [style*="-webkit-text-fill-color"]:not(footer):not(footer *) {
          -webkit-text-fill-color: #E30613 !important;
          color: #E30613 !important;
          background: none !important;
        }

        /* Lightbox backdrop */
        .landing-root [style*="background: rgba(7,6,11"] {
          background: rgba(0,0,0,0.85) !important;
        }
      `}</style>
      <MeshBackground />
      <NoiseOverlay />
      <ScrollProgress />
      <Navbar user={user} onLoginClick={() => setLoginOpen(true)} onLogout={onLogout}
        onEnterApp={onEnterApp} onBook={() => setBookOpen(true)} setActiveSubPage={setActiveSubPage} />
      <LoginDrawer open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={onLogin} />
      <AppointmentBookingModal open={bookOpen} onClose={() => setBookOpen(false)} onBook={(data) => {
        console.log('Booking:', data);
        alert('Ihr Termin wurde erfolgreich vereinbart! Vielen Dank.');
      }} />
      <main className="relative" style={{ zIndex: 2 }}>
        <Hero onBook={() => setBookOpen(true)} />
        <MarqueeService />
        <Features />
        <PlatformFeatures />
        <KostenlosBanner />
        <FahrzeugklassenSection onBook={() => setBookOpen(true)} />
        <WhyGecitKfz />
        <HowItWorks />
        <Stats />
        <Testimonial />
        <CTA onBook={() => setBookOpen(true)} />
        <VerkehrsunfallSection onBook={() => setBookOpen(true)} />
        <RechteSection />
        <PeaceOfMindSection />
        <FooterCTA onBook={() => setBookOpen(true)} />
        <BannerShowcase setLightbox={setLightbox} />
        <DownloadCenter />
      </main>
      <Footer setActiveSubPage={setActiveSubPage} />
      <PWAInstallBanner />
      
      {/* Lightbox (Root Level for z-index isolation) */}
      <AnimatePresence>
        {lightbox && (
          <motion.div 
            key="lb" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 flex flex-col items-center justify-start overflow-y-auto p-4 md:p-20"
            style={{ 
              zIndex: 999999, 
              background: 'rgba(0,0,0,0.97)', 
              backdropFilter: 'blur(24px)', 
              cursor: 'zoom-out'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-6xl mx-auto flex flex-col items-center py-10"
            >
              <img
                src={lightbox.src} 
                alt={lightbox.alt}
                className="w-full h-auto max-h-none rounded-2xl shadow-2xl object-contain border border-white/20"
                style={{ 
                  boxShadow: `0 32px 80px -20px rgba(0,0,0,0.8), 0 0 120px -20px ${lightbox.accent}33`,
                }} 
              />
              <div className="mt-10 w-full max-w-3xl text-center px-8 py-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <h4 className="text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>{lightbox.title}</h4>
                <p className="text-white/80 text-lg leading-relaxed">{lightbox.desc}</p>
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => setLightbox(null)}
                    className="px-8 py-3 rounded-full bg-white text-black font-bold text-base hover:bg-gray-200 transition-all hover:scale-105"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </motion.div>
            
            <button 
              onClick={() => setLightbox(null)}
              className="fixed top-8 right-8 w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-2xl z-[1000000]"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <XClose size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
