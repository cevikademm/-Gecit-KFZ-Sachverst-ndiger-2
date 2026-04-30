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
import { LangProvider, useLang } from '../i18n/LangContext.jsx';
import { LanguageSelector } from '../i18n/LanguageSelector.jsx';

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
  // Beyaz tema: animasyonlu blob kaldırıldı, sadece çok soluk kırmızı vinyetler
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
function Navbar({ user, onLoginClick, onLogout, onEnterApp, onBook }) {
  const { t } = useLang();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const u = scrollY.on('change', v => setScrolled(v > 20));
    return () => u();
  }, [scrollY]);

  const links = [t('nav.services'), t('nav.howItWorks'), t('nav.packages'), t('nav.contact')];
  const initials = user ? user.email.slice(0, 2).toUpperCase() : '';

  return (
    <motion.nav initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: easeOut }}
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        background: '#FFFFFF',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.06)' : 'none',
      }}>
      <div className="mx-auto flex items-center justify-between px-6 py-4 gap-4" style={{ maxWidth: 1280 }}>
        {/* Logo + Name */}
        <a href="#" className="flex items-center gap-3 flex-shrink-0" style={{ textDecoration: 'none', lineHeight: 1 }}>
          <img src="./logo-car-only.png" alt="Gecit KFZ Logo" className="h-10 md:h-12 w-auto object-contain"
               style={{ filter: 'brightness(0) saturate(100%)' }} />
          <div className="flex flex-col items-start">
            <div className="text-xl md:text-2xl font-black tracking-tight" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', lineHeight: 1 }}>
              <span style={{ color: '#E30613' }}>GECIT</span>
              <span style={{ color: '#0A0A0A', margin: '0 1px' }}>-</span>
              <span style={{ color: '#0A0A0A' }}>KFZ</span>
            </div>
            <span className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: '#6B6B6B', whiteSpace: 'nowrap' }}>
              Sachverständigenbüro
            </span>
          </div>
        </a>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Ana menü">
          {links.map(l => (
            <a key={l} href="#"
              className="text-sm font-medium uppercase tracking-wide transition-colors relative group"
              style={{ color: '#1F1F1F', textDecoration: 'none', letterSpacing: '0.06em' }}>
              {l}
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#E30613] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageSelector />
          {user ? (
            <>
              <button onClick={onEnterApp}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md transition-all"
                style={{ background: 'rgba(227,6,19,0.06)', border: '1px solid rgba(227,6,19,0.2)', color: '#E30613' }}>
                {t('nav.toPanel')}
                <ArrowRight size={14} />
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)} onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md transition-colors"
                  style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.10)', color: '#0A0A0A' }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                    style={{ background: '#E30613', color: '#FFFFFF' }}>
                    {initials}
                  </span>
                  <span className="hidden sm:inline" style={{ color: '#0A0A0A' }}>{user.role === 'super_admin' ? 'Süper Admin' : 'Kullanıcı'}</span>
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl p-2 text-sm"
                      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.10)',
                        boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15)' }}>
                      <div className="px-3 py-2">
                        <p className="truncate font-medium" style={{ color: '#0A0A0A' }}>{user.email}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#E30613' }}>
                          {user.role === 'super_admin' ? '● Süper Admin' : '● Kullanıcı'}
                        </p>
                      </div>
                      <div className="h-px my-1" style={{ background: 'rgba(0,0,0,0.08)' }} />
                      <button onMouseDown={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-gray-50"
                        style={{ color: '#0A0A0A' }}>
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <button onClick={onLoginClick}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md transition-all hover:bg-gray-50"
              style={{ color: '#0A0A0A', border: '1px solid rgba(0,0,0,0.12)' }}>
              <Svg size={14}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></Svg>
              <span>{t('nav.login')}</span>
            </button>
          )}
          <button onClick={onBook}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-lg transition-all"
            style={{ background: '#E30613', color: '#FFFFFF', letterSpacing: '0.02em' }}
            onMouseEnter={e => e.currentTarget.style.background = '#B0050F'}
            onMouseLeave={e => e.currentTarget.style.background = '#E30613'}>
            <Svg size={15}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>
            <span className="hidden sm:inline">{t('nav.book')}</span>
            <span className="sm:hidden">{t('nav.bookShort')}</span>
          </button>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-md" onClick={() => setMobileOpen(v => !v)}
            style={{ color: '#0A0A0A' }} aria-label="Menüyü aç/kapat">
            <Svg size={22}>{mobileOpen
              ? <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }</Svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: '#FFFFFF' }}>
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map(l => (
                <a key={l} href="#" className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: '#1F1F1F' }} onClick={() => setMobileOpen(false)}>{l}</a>
              ))}
              <button onClick={() => { onBook(); setMobileOpen(false); }}
                className="w-full py-3 rounded-lg text-sm font-semibold"
                style={{ background: '#E30613', color: '#FFFFFF' }}>
                {t('nav.book')}
              </button>
            </div>
          </motion.div>
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
              role="dialog" aria-modal="true" aria-label="Giriş Yap"
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col overflow-y-auto pointer-events-auto rounded-2xl"
              style={{ width: 'min(440px, 100%)', maxHeight: '90vh',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: '0 24px 64px -16px rgba(0,0,0,0.18)' }}>

            <div className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-1 font-black tracking-tight" style={{ lineHeight: 1 }}>
                <span style={{ color: '#E30613', fontSize: 18 }}>GECIT</span>
                <span style={{ color: '#0A0A0A', fontSize: 18, margin: '0 1px' }}>-</span>
                <span style={{ color: '#0A0A0A', fontSize: 18 }}>KFZ</span>
              </div>
              <button onClick={onClose} aria-label="Kapat"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ color: '#6B6B6B', border: '1px solid rgba(0,0,0,0.10)' }}>
                <Svg size={16}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Svg>
              </button>
            </div>

            <div className="flex-1 p-8">
              <p className="text-xs uppercase mb-2 font-semibold" style={{ color: '#E30613', letterSpacing: '0.22em' }}>
                Hesap Girişi
              </p>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#0A0A0A' }}>
                Tekrar hoş geldin.
              </h2>
              <p className="text-sm mb-7" style={{ color: '#6B6B6B' }}>
                Gecit Kfz Sachverständiger paneline erişmek için giriş yapın.
              </p>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase"
                    style={{ color: '#6B6B6B', letterSpacing: '0.15em' }}>E-posta</label>
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
                  <label className="block text-xs font-semibold mb-1.5 uppercase"
                    style={{ color: '#6B6B6B', letterSpacing: '0.15em' }}>Şifre</label>
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
                    <input type="checkbox" defaultChecked style={{ accentColor: '#E30613' }} />
                    Beni hatırla
                  </label>
                  <a href="#" className="hover:text-[#E30613] transition-colors">Şifremi unuttum</a>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ background: '#E30613', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(227,6,19,0.30)' }}>
                  {loading ? 'Giriş yapılıyor…' : <>Giriş Yap <ArrowRight size={16} /></>}
                </motion.button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs" style={{ color: '#6B6B6B' }}>
                <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
                HIZLI GİRİŞ (DEMO)
                <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
              </div>

              <p className="text-xs mb-3 text-center" style={{ color: '#6B6B6B' }}>
                Tek tıkla istediğin role gir
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'admin',    label: 'Admin',   desc: 'Yönetim',  color: '#E30613', bg: 'rgba(227,6,19,0.06)',  border: 'rgba(227,6,19,0.20)', icon: <Svg size={13}><path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z"/></Svg> },
                  { role: 'customer', label: 'Müşteri', desc: 'Portal',   color: '#0A0A0A', bg: 'rgba(0,0,0,0.04)',    border: 'rgba(0,0,0,0.12)',    icon: <Svg size={13}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Svg> },
                  { role: 'lawyer',   label: 'Avukat',  desc: 'Hukuk',   color: '#B0050F', bg: 'rgba(176,5,15,0.06)', border: 'rgba(176,5,15,0.20)', icon: <Svg size={13}><path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 8l-2 6a4 4 0 0 0 8 0L9 8"/><path d="M19 8l-2 6a4 4 0 0 0 8 0l-2-6"/></Svg> },
                ].map(b => (
                  <motion.button
                    key={b.role}
                    type="button"
                    onClick={() => quickLogin(b.role)}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -2 }}
                    className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl text-center transition-colors"
                    style={{ background: b.bg, border: `1px solid ${b.border}` }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${b.color}18`, color: b.color }}>
                      {b.icon}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold" style={{ color: '#0A0A0A' }}>{b.label}</span>
                      <span className="block text-[10px]" style={{ color: '#6B6B6B' }}>{b.desc}</span>
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-[11px] mt-4" style={{ color: '#6B6B6B' }}>
                Hızlı giriş yalnızca demo amaçlıdır
              </p>
            </div>

            <div className="p-5 text-xs" style={{ color: '#6B6B6B', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
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
  const { t } = useLang();
  const rm = useReducedMotion();
  return (
    <section className="relative overflow-hidden" style={{
      background: '#FFFFFF',
      paddingTop: 'calc(env(safe-area-inset-top) + 88px)',
      paddingBottom: 0,
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1280 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" style={{ minHeight: 'min(80vh, 680px)' }}>
          {/* Left column — text */}
          <div className="py-16 md:py-20">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-semibold uppercase"
              style={{ background: 'rgba(227,6,19,0.06)', border: '1px solid rgba(227,6,19,0.20)',
                color: '#7A0309', letterSpacing: '0.18em' }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: '#E30613' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#E30613' }} />
              </span>
              {t('hero.badge')}
            </motion.div>

            {/* Headline */}
            <div>
              <RevealHeading text={t('hero.title1')}
                className="text-5xl md:text-6xl lg:text-7xl font-black leading-none"
                style={{ color: '#0A0A0A', letterSpacing: '-0.03em', lineHeight: 0.95 }} />
              <RevealHeading text={t('hero.title2')}
                className="text-5xl md:text-6xl lg:text-7xl font-black mt-1"
                style={{ color: '#E30613', letterSpacing: '-0.03em', lineHeight: 0.95 }} delay={0.25} />
            </div>

            {/* Red accent line */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: easeOut, delay: 0.6 }}
              className="h-1 w-20 rounded-full mt-6 mb-6 origin-left"
              style={{ background: '#E30613' }} aria-hidden="true" />

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeOut, delay: 0.8 }}
              className="text-base md:text-lg leading-relaxed max-w-md"
              style={{ color: '#6B6B6B' }}>
              {t('hero.subtitle')}
            </motion.p>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeOut, delay: 1.0 }}
              className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('gecit-kfz:book'))}
                className="inline-flex items-center gap-2.5 text-sm font-bold px-6 py-3.5 rounded-lg transition-all"
                style={{ background: '#E30613', color: '#FFFFFF', letterSpacing: '0.02em',
                  boxShadow: '0 4px 20px rgba(227,6,19,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#B0050F'}
                onMouseLeave={e => e.currentTarget.style.background = '#E30613'}>
                <Svg size={16}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>
                {t('hero.cta')}
              </button>
              <a href="tel:+490000000000"
                className="inline-flex items-center gap-2 text-sm font-medium px-5 py-3.5 rounded-lg transition-all hover:bg-gray-50"
                style={{ color: '#1F1F1F', border: '1px solid rgba(0,0,0,0.12)' }}>
                <Svg size={15}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16h.5z"/></Svg>
                Jetzt anrufen
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.3 }}
              className="mt-8 flex flex-wrap items-center gap-4">
              {['Kostenlos für Geschädigte', 'Schnell & Unabhängig', 'Aachen & Umgebung'].map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#6B6B6B' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E30613" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {s}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right column — image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: easeOut, delay: 0.3 }}
            className="relative hidden md:flex items-end justify-center h-full"
            style={{ minHeight: 480 }}>
            {/* Image wrapper — full height right panel */}
            <div className="absolute inset-0 overflow-hidden rounded-l-3xl"
              style={{ background: 'linear-gradient(160deg, #F8F8F8 0%, #EEEEEE 100%)' }}>
              <img src="/images/accident.jpg" alt="Beschädigtes Fahrzeug"
                className="w-full h-full object-cover"
                style={{ opacity: 0.9 }}
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              {/* Overlay gradient */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(270deg, transparent 40%, rgba(255,255,255,0.7) 100%)' }} />
              {/* Red accent corner */}
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: '#E30613' }} />
            </div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              className="absolute bottom-8 left-8 rounded-xl p-4"
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 180 }}>
              <p className="text-2xl font-black" style={{ color: '#E30613' }}>15.000+</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#6B6B6B' }}>Tamamlanan Ekspertiz</p>
            </motion.div>
          </motion.div>
        </div>
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
  const { t } = useLang();
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
        {t('marquee.title')}
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

// ─── Leistungen / Features ──────────────────────
function Features() {
  const features = [
    {
      icon: Wrench,
      title: 'SCHADENGUTACHTEN',
      subtitle: 'Kaza Ekspertizi',
      desc: 'Detaylı ve bağımsız ekspertiz raporları, kaza sonrası sigortaya karşı haklarınızı korumak için.',
      bullets: ['Kaza tespiti ve analiz', 'Hasar boyutunun belirlenmesi', 'Tamir yolu ve değer kaybı', 'Sigorta süreci desteği'],
    },
    {
      icon: ScaleIcon,
      title: 'KFZ-GUTACHTEN',
      subtitle: 'Araç Ekspertizi',
      desc: 'Çeşitli durumlar için kapsamlı raporlar — bağımsız, tarafsız ve hukuki olarak güvenli.',
      bullets: ['Kaza ekspertizi', 'Delil güvenceleme raporu', 'Klasik araç ekspertizi', 'Diğer özel durumlar'],
    },
    {
      icon: TrendingUp,
      title: 'WERTGUTACHTEN',
      subtitle: 'Değer Tespiti',
      desc: 'Aracınızın güncel piyasa değerinin belirlenmesi — satış, sigorta veya finansman amaçlı.',
      bullets: ['Piyasa değer analizi', 'Kalan değer tespiti', 'Klasik ve koleksiyon araç değerleme'],
    },
    {
      icon: Target,
      title: 'KOSTENVORANSCHLÄGE',
      subtitle: 'Maliyet Tahmini',
      desc: 'Onarımlar için detaylı maliyet tahminleri — hızlı, şeffaf ve takip edilebilir.',
      bullets: ['Onarım maliyet listesi', 'Parça ve işçilik bedelleri', 'Hasar süreci için temel'],
    },
    {
      icon: Brain,
      title: 'ERSTE KUNDENBERATUNG',
      subtitle: 'İlk Müşteri Danışmanlığı',
      desc: 'Kişisel danışmanlık ve ilk değerlendirme — yetkin, bağımsız ve ücretsiz.',
      bullets: ['Olayın ilk değerlendirmesi', 'Sorularınızın açıklanması', 'Sonraki adımlar için öneri'],
    },
    {
      icon: ShieldIcon,
      title: 'LEASINGRÜCKLÄUFER-CHECK',
      subtitle: 'Leasing İade Kontrolü',
      desc: 'Aracınızın iade öncesi profesyonel kontrolü — ek ödemeleri ve anlaşmazlıkları önleyin.',
      bullets: ['Hasar ve eksik kontrolü', 'Leasing kriterlerine göre değerleme', 'Kontrol raporu ile belgeleme', 'Tarafsız ve adil değerlendirme'],
    },
  ];

  return (
    <section id="leistungen" className="relative py-20 md:py-28" style={{ background: '#FFFFFF' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1280 }}>
        {/* Header — left/right split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16 md:mb-20">
          {/* Left — title + description */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: easeOut }}>
            <p className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: '#0A0A0A' }}>
              Unsere
            </p>
            <h2 className="text-5xl md:text-7xl font-black uppercase leading-[0.95] mt-1" style={{ color: '#E30613', letterSpacing: '-0.02em' }}>
              Leistungen
            </h2>
            <div className="mt-5 h-1 w-20 rounded-full" style={{ background: '#E30613' }} />
            <p className="mt-7 text-base md:text-lg leading-relaxed max-w-md" style={{ color: '#4B4B4B' }}>
              Bağımsız bir KFZ ekspertiz uzmanı olarak, aracınızla ilgili tüm konularda profesyonel ve objektif
              ekspertizler ile danışmanlık hizmetleri sunuyoruz. Hızlı, güvenilir ve şeffaf — güvenliğiniz için.
            </p>
          </motion.div>

          {/* Right — B&W image */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.15 }}
            className="relative h-[280px] md:h-[340px] rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2A2A2A 0%, #4A4A4A 50%, #6B6B6B 100%)' }}>
            <img src="/logo-gecit.png" alt="" aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain p-10"
              style={{ filter: 'grayscale(100%) brightness(1.4) opacity(0.35)', mixBlendMode: 'screen' }} />
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)' }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 80px rgba(255,255,255,0.05)' }} />
          </motion.div>
        </div>

        {/* 3x2 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group relative bg-white p-8 md:p-10 flex flex-col items-center text-center transition-all"
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
              {/* Icon circle */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                style={{ background: '#F5F5F5', color: '#E30613', border: '1px solid rgba(0,0,0,0.04)' }}>
                <f.icon size={36} strokeWidth={1.8} />
              </div>
              {/* Title */}
              <h3 className="text-lg md:text-xl font-black uppercase tracking-wide mb-1" style={{ color: '#0A0A0A', letterSpacing: '0.04em' }}>
                {f.title}
              </h3>
              <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#E30613', letterSpacing: '0.15em' }}>
                {f.subtitle}
              </p>
              {/* Desc */}
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
                {f.desc}
              </p>
              {/* Bullets */}
              <ul className="w-full text-left space-y-2 mt-auto">
                {f.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color: '#1F1F1F' }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: '#E30613' }}>
                      <Svg size={16}>
                        <circle cx="12" cy="12" r="10" fill="none" strokeWidth="1.8" />
                        <polyline points="9 12 11 14 15 10" strokeWidth="2" />
                      </Svg>
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
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
    <section style={{ background: '#E30613' }}>
      <div className="mx-auto px-6 py-10 md:py-12" style={{ maxWidth: 1280 }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <Svg size={22} style={{ color: '#FFFFFF', flexShrink: 0 }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16h.5z"/>
              </Svg>
              <p className="text-xl md:text-2xl font-black tracking-wide" style={{ color: '#FFFFFF' }}>
                HIZLI · BAĞIMSIZ · GÜVENİLİR
              </p>
            </div>
            <p className="text-sm md:text-base font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Profesyonel araç ekspertiz hizmetiniz — Aachen ve çevresinde
            </p>
          </div>
          {/* Right — CTA button */}
          <a href="tel:+490000000000"
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-lg font-bold text-sm flex-shrink-0 transition-all"
            style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.80)',
              color: '#FFFFFF', letterSpacing: '0.04em', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <Svg size={16} style={{ color: '#FFFFFF' }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16h.5z"/>
            </Svg>
            ŞİMDİ ARA
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Verkehrsunfall Support Intro ─────────────────
function VerkehrsunfallSection() {
  const points = [
    { title: 'Unabhängig & neutral', desc: 'Wir arbeiten ausschließlich in Ihrem Interesse — nicht im Auftrag der Versicherung.' },
    { title: 'Schnelle Terminvergabe', desc: 'Begutachtung meist innerhalb von 24 Stunden. Kein langes Warten, kein Druck.' },
    { title: 'Volle Ansprüche sichern', desc: 'Wir dokumentieren jeden Schaden lückenlos, damit Ihnen kein Cent verloren geht.' },
  ];
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch mb-12">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="relative rounded-3xl overflow-hidden order-2 md:order-1"
            style={{ border: '1px solid rgba(227,6,19,0.25)', boxShadow: '0 0 50px rgba(227,6,19,0.15)' }}>
            <img src="/images/unfall.jpg" alt="Unfallfahrzeug mit Warndreieck" loading="lazy"
              className="block w-full h-full object-cover" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="order-1 md:order-2">
            <p className="text-xs uppercase mb-4 font-semibold tracking-widest" style={{ color: '#E30613' }}>
              Verkehrsunfall?
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6"
              style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              So unterstützen wir Sie <span style={{ color: '#E30613' }}>sicher und schnell</span>!
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: C.textDim }}>
              Nach einem Verkehrsunfall haben Sie das Recht, einen unabhängigen Sachverständigen zu beauftragen.
              Lassen Sie sich nicht von der Versicherung unter Druck setzen, deren Gutachter zu akzeptieren,
              denn diese arbeiten oft nicht in Ihrem besten Interesse. Vertrauen Sie auf unsere Expertise,
              um Ihre Ansprüche zu wahren.
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {points.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.1 }}
              className="rounded-2xl p-6 flex gap-5"
              style={{ background: '#FAFAFA', border: `1px solid ${C.border}`,
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
                <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>{p.title}</h3>
                <p className="leading-relaxed" style={{ color: C.textDim }}>{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Vehicle classes / Fahrzeugklassen ────────────
function FahrzeugklassenSection() {
  const RED = '#E30613';
  const iconProps = { width: 36, height: 36, viewBox: '0 0 24 24', fill: 'none', stroke: RED, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const items = [
    {
      title: 'PKW',
      desc: 'Präzise Gutachten für alle Pkw-Typen, unabhängig von Marke und Modell.',
      icon: (
        <svg {...iconProps}><path d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5"/><path d="M3 13h18v4a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2H8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-4z"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="16.5" cy="16" r="1.2"/></svg>
      ),
    },
    {
      title: 'Elektrofahrzeuge',
      desc: 'Ob Elektroauto oder E-Bike — wir bieten spezialisierte Gutachten, die technische Besonderheiten berücksichtigen.',
      icon: (
        <svg {...iconProps}><path d="M3 13l2-5a3 3 0 0 1 2.8-2h6.4A3 3 0 0 1 17 8l2 5"/><path d="M3 13h16v4a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2H8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-4z"/><path d="M21 9v6"/><path d="M11 9l-2 3h3l-2 3"/></svg>
      ),
    },
    {
      title: 'LKW',
      desc: 'Vom leichten Nutzfahrzeug bis zum schweren Lkw, maßgeschneidert auf die speziellen Einsatzbereiche.',
      icon: (
        <svg {...iconProps}><path d="M2 17V7a1 1 0 0 1 1-1h11v11"/><path d="M14 10h4l3 4v3h-7"/><circle cx="6.5" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/></svg>
      ),
    },
    {
      title: 'Caravan',
      desc: 'Detaillierte Bewertungen für Wohnwagen und Wohnmobile, inkl. Wohnbereich und Sonderausstattung.',
      icon: (
        <svg {...iconProps}><path d="M3 8a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v6H3V8z"/><path d="M19 15h2v2h-2"/><rect x="6" y="9" width="4" height="3"/><circle cx="8" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/></svg>
      ),
    },
    {
      title: 'Anhänger',
      desc: 'Umfassende Gutachten für Last- und Spezialanhänger, mit Fokus auf Sicherheitsaspekte.',
      icon: (
        <svg {...iconProps}><rect x="3" y="7" width="14" height="9" rx="1"/><path d="M17 14h4"/><circle cx="21.5" cy="14.5" r="1"/><circle cx="8" cy="18" r="1.5"/><circle cx="13" cy="18" r="1.5"/></svg>
      ),
    },
    {
      title: 'Motorräder',
      desc: 'Sorgfältige Schadens- und Wertgutachten für Motorräder.',
      icon: (
        <svg {...iconProps}><circle cx="5.5" cy="16" r="3"/><circle cx="18.5" cy="16" r="3"/><path d="M5.5 16l4-6h5l3 6"/><path d="M14 7h3v3"/></svg>
      ),
    },
  ];
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-14">
          <div className="text-sm md:text-base font-semibold mb-3" style={{ color: RED, letterSpacing: '0.02em' }}>
            Ihr Partner für umfassende Bewertungen
          </div>
          <h2 className="text-3xl md:text-5xl font-bold"
            style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Gutachten für alle <span style={{ color: RED }}>Fahrzeugklassen</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.08 }}
              className="rounded-2xl p-6 md:p-7"
              style={{ background: '#FAFAFA', border: `1px solid ${C.border}`,
                backdropFilter: 'blur(4px)' }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.25)' }}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold" style={{ color: RED }}>{item.title}</h3>
              </div>
              <p className="leading-relaxed" style={{ color: C.textDim }}>{item.desc}</p>
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
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
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
    <section className="relative py-32 md:py-40 overflow-hidden" style={{ zIndex: 2, background: '#FFFFFF' }}>

      <div className="mx-auto px-6 relative" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-20">
          <p className="text-xs uppercase mb-5 font-semibold" style={{ color: '#E30613', letterSpacing: '0.25em' }}>Warum Gecit Kfz Sachverständiger?</p>
          <h2 className="text-4xl md:text-6xl font-semibold max-w-4xl mx-auto" style={{ color: '#0A0A0A', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
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
              style={{ background: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.08)' }}>
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
    <section ref={ref} className="relative py-32 md:py-40 overflow-hidden" style={{ zIndex: 2, background: '#FAFAFA' }}>
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
      <div className="font-mono tabular-nums text-5xl md:text-7xl font-black"
        style={{ color: '#E30613', letterSpacing: '-0.04em' }}>
        {prefix}{disp}{suffix}
      </div>
      <p className="mt-3 text-sm uppercase" style={{ color: C.textDim, letterSpacing: '0.2em' }}>{label}</p>
    </motion.div>
  );
}

function Stats() {
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2, background: '#FFFFFF' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="mb-16">
          <p className="text-xs uppercase mb-4 font-bold" style={{ color: '#E30613', letterSpacing: '0.25em' }}>Güven</p>
          <h2 className="text-4xl md:text-6xl font-black max-w-3xl" style={{ color: '#0A0A0A', letterSpacing: '-0.03em' }}>
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
    <section className="relative py-24 md:py-32" style={{ zIndex: 2, background: '#FAFAFA' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1000 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: easeOut }}
          className="relative p-10 md:p-16 rounded-3xl"
          style={{ background: '#F8F8F8', border: '1px solid rgba(0,0,0,0.08)' }}>
          <Quote size={48} style={{ color: C.neon, opacity: 0.6 }} />
          <blockquote className="mt-6 text-3xl md:text-5xl italic leading-tight"
            style={{ color: C.text, letterSpacing: '-0.02em', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            "İkinci el araç aldık; Gecit Kfz Sachverständiger ruhsattan saniyede okudu, 20 yıllık galericinin bile kaçırdığı değişen parçayı yakaladı. Paranın tam karşılığı."
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg font-bold"
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
      style={{ background: highlighted ? '#FFFFFF' : '#FAFAFA',
        border: highlighted ? '2px solid #E30613' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: highlighted ? '0 8px 40px rgba(227,6,19,0.15)' : 'none' }}>
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
          : { background: 'transparent', color: '#0A0A0A', border: '1px solid rgba(0,0,0,0.12)' }}
        onMouseEnter={e => { if (highlighted) e.currentTarget.style.background = '#B0050F'; else e.currentTarget.style.background = '#F5F5F5'; }}
        onMouseLeave={e => { if (highlighted) e.currentTarget.style.background = '#E30613'; else e.currentTarget.style.background = 'transparent'; }}>
        {cta}
      </button>
    </motion.div>
  );
}

function Pricing() {
  return (
    <section className="relative py-24 md:py-32" style={{ zIndex: 2, background: '#FFFFFF' }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }} className="text-center mb-16">
          <p className="text-xs uppercase mb-4 font-bold" style={{ color: '#E30613', letterSpacing: '0.25em' }}>Paketler</p>
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
  return (
    <section className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Subtle red vignette top */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#E30613' }} />
      <div className="relative text-center px-6 mx-auto" style={{ maxWidth: 800 }}>
        <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: easeOut }}
          className="text-xs font-bold uppercase mb-6" style={{ color: '#E30613', letterSpacing: '0.25em' }}>
          Jetzt Termin vereinbaren
        </motion.p>
        <RevealHeading text="Aracının Gerçek Hikayesini Öğren."
          className="text-4xl md:text-6xl lg:text-7xl font-black"
          style={{ color: '#0A0A0A', letterSpacing: '-0.03em', lineHeight: 1.0 }} />
        <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: easeOut, delay: 0.5 }}
          className="mt-6 text-base md:text-lg" style={{ color: '#6B6B6B' }}>
          İlk ekspertizinde %15 indirim. 5 dakikada online termin.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: easeOut, delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="inline-flex items-center justify-center gap-2 text-sm font-bold px-8 py-4 rounded-lg transition-all"
            style={{ background: '#E30613', color: '#FFFFFF', boxShadow: '0 6px 24px rgba(227,6,19,0.35)' }}
            onClick={() => window.dispatchEvent(new CustomEvent('gecit-kfz:book'))}
            onMouseEnter={e => e.currentTarget.style.background = '#B0050F'}
            onMouseLeave={e => e.currentTarget.style.background = '#E30613'}>
            Online Termin Al <ArrowRight size={18} />
          </button>
          <a href="tel:+490000000000"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-8 py-4 rounded-lg transition-all hover:bg-gray-50"
            style={{ color: '#0A0A0A', border: '1px solid rgba(0,0,0,0.14)', textDecoration: 'none' }}>
            Jetzt anrufen
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────
function Footer() {
  const contactItems = [
    { icon: <Svg size={14}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16h.5z"/></Svg>, label: '+49 241 000 0000' },
    { icon: <Svg size={14}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Svg>, label: 'info@gecit-kfz.de' },
    { icon: <Svg size={14}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>, label: 'www.gecit-kfz.de' },
  ];
  return (
    <footer style={{ background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.08)', zIndex: 2 }}>
      <div className="mx-auto px-6 py-16" style={{ maxWidth: 1280 }}>
        {/* 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Left: Logo + tagline */}
          <div>
            <div className="flex items-center gap-1 font-black tracking-tight mb-3" style={{ lineHeight: 1 }}>
              <span style={{ color: '#E30613', fontSize: 22 }}>GECIT</span>
              <span style={{ color: '#0A0A0A', fontSize: 22, margin: '0 1px' }}>-</span>
              <span style={{ color: '#0A0A0A', fontSize: 22 }}>KFZ</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#6B6B6B' }}>
              Sachverständigenbüro
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>
              Bağımsız, hızlı ve güvenilir araç ekspertiz hizmetleri. Kaza anından itibaren yanınızdayız.
            </p>
          </div>

          {/* Middle: Address */}
          <div>
            <p className="text-xs font-bold uppercase mb-4" style={{ color: '#0A0A0A', letterSpacing: '0.16em' }}>
              ADRESSE
            </p>
            <div className="text-sm leading-relaxed space-y-1" style={{ color: '#6B6B6B' }}>
              <p>Am Gutshof 37</p>
              <p>52080 Aachen</p>
              <p>Deutschland</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Am+Gutshof+37,+52080+Aachen,+Deutschland"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold transition-colors hover:opacity-70"
                style={{ color: '#E30613', textDecoration: 'none' }}>
                Google Maps'te aç <ChevronRight size={12} />
              </a>
            </div>
          </div>

          {/* Right: Contact */}
          <div>
            <p className="text-xs font-bold uppercase mb-4" style={{ color: '#0A0A0A', letterSpacing: '0.16em' }}>
              KONTAKT
            </p>
            <div className="space-y-3">
              {contactItems.map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm" style={{ color: '#6B6B6B' }}>
                  <span className="flex-shrink-0" style={{ color: '#E30613' }}>{c.icon}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mb-10 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          <iframe
            title="Gecit Kfz Sachverständiger - Standort"
            src="https://www.google.com/maps?q=Am+Gutshof+37,+52080+Aachen,+Deutschland&output=embed"
            width="100%" height="280"
            style={{ border: 0, display: 'block' }}
            loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(0,0,0,0.08)', color: '#6B6B6B' }}>
          <p>© 2026 Gecit Kfz Sachverständiger. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            {['Gizlilik', 'KVKK', 'Impressum'].map(l => (
              <a key={l} href="#" className="hover:text-[#E30613] transition-colors" style={{ color: '#6B6B6B', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
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
                    background: service === s ? 'rgba(227,6,19,0.08)' : '#FAFAFA',
                    border: `1px solid ${service === s ? C.neon : C.border}`,
                    color: service === s ? '#E30613' : C.textDim,
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
                    background: date === d.iso ? '#E30613' : '#FAFAFA',
                    border: `1px solid ${date === d.iso ? '#E30613' : C.border}`,
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
                      background: time === s ? 'rgba(227,6,19,0.08)' : '#FAFAFA',
                      border: `1px solid ${time === s ? C.neon : C.border}`,
                      color: time === s ? '#E30613' : C.textDim,
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
// LangProvider ile saralanir; tum ic component'ler useLang() kullanabilir.
// ═══════════════════════════════════════════════════════════════════
export default function Landing(props) {
  return (
    <LangProvider>
      <LandingInner {...props} />
    </LangProvider>
  );
}

function LandingInner({ user, onLogin, onLogout, onEnterApp }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    const h = () => setBookOpen(true);
    window.addEventListener('gecit-kfz:book', h);
    return () => window.removeEventListener('gecit-kfz:book', h);
  }, []);

  return (
    <div className="landing-root relative min-h-screen overflow-x-hidden"
      style={{ background: '#FAFAFA', color: '#0A0A0A' }}>
      <style>{`
        /* Kirmizi+beyaz tema — token degerleri guncellendi, minimal override gerekiyor */

        /* hover:text-white tailwind class -> siyah arkaplanda anlamsiz, kirmizi yap */
        .landing-root .hover\\:text-white:hover {
          color: #E30613 !important;
        }

        /* BannerShowcase ve SpotlightCard koyu surface background'lari acik griye */
        .landing-root [style*="background: rgb(14, 11, 24)"],
        .landing-root [style*="background: rgb(20, 16, 39)"],
        .landing-root [style*="background: rgb(7, 6, 11)"] {
          background: #F8F8F8 !important;
          border-color: rgba(0,0,0,0.08) !important;
        }

        /* Gradient text-fill -> kirmizi */
        .landing-root [style*="-webkit-text-fill-color: transparent"] {
          -webkit-text-fill-color: #E30613 !important;
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
        onEnterApp={onEnterApp} onBook={() => setBookOpen(true)} />
      <LoginDrawer open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={onLogin} />
      <AppointmentBookingModal open={bookOpen} onClose={() => setBookOpen(false)} onBook={() => {}} />
      <main className="relative" style={{ zIndex: 2 }}>
        <Hero />
        <BannerShowcase />
        <Marquee />
        <Features />
        <KostenlosBanner />
        <FahrzeugklassenSection />
        <RechteSection />
        <VerkehrsunfallSection />
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
