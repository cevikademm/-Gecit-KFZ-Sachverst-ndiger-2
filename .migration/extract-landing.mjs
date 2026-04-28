// Landing (homepage) bilesenlerini src/App.jsx'den cikartip
// src/pages/Landing.jsx'e tasir. Landing'i kendi izole dosyasi yapar.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const APP_PATH = path.join(ROOT, 'src', 'App.jsx');
const LANDING_PATH = path.join(ROOT, 'src', 'pages', 'Landing.jsx');

const lines = fs.readFileSync(APP_PATH, 'utf8').split('\n');

// Satir numaralarini bul: bir satirda exact match arar
function findLine(needle) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(needle)) return i;
  }
  return -1;
}

// Inputs (1-indexed satir numaralari, App.jsx'in mevcut hali):
// - Landing UI blok: line 27 (NoiseOverlay yorum) -> 1346 (Footer kapanmasi)
// - PWAInstallBanner: line 8983 -> 9087
// - AppointmentBookingModal: line 10749 -> 10851
//
// Otomatik bul ki baska splitlerde line numaralari kaymissa yine calissin.
const landingStart = findLine('// ─── Noise overlay ───');
const landingEndMarker = findLine('// ════════════════════════════════════════════════');
// landingEndMarker su anki satirin "──CRM + MUSTERI PORTALI──" yorumunu isaret ediyor
// Footer kapanma "}" satiri o yorumdan 2 satir once
const landingEnd = landingEndMarker - 2;

const pwaStart = lines.findIndex((l, i) => i > landingEnd && l.startsWith('function PWAInstallBanner'));
let pwaEnd = pwaStart;
let depth = 0;
let started = false;
for (let i = pwaStart; i < lines.length; i++) {
  const line = lines[i];
  for (const ch of line) {
    if (ch === '{') { depth++; started = true; }
    else if (ch === '}') { depth--; if (started && depth === 0) { pwaEnd = i; break; } }
  }
  if (started && depth === 0) break;
}

// AppointmentBookingModal: function basliklarinin yerini bul.
// Bir sonraki "function" satirinin -1'i kapanis.
const apptStart = lines.findIndex((l, i) => i > pwaEnd && l.startsWith('function AppointmentBookingModal'));
const nextAfterAppt = lines.findIndex((l, i) => i > apptStart && (l.startsWith('function ') || l.startsWith('// ─── AppPanel')));
// nextAfterAppt'tan geriye dogru ilk bos olmayan satira git
let apptEnd = nextAfterAppt - 1;
while (apptEnd > apptStart && lines[apptEnd].trim() === '') apptEnd--;

console.log('Landing UI block:', landingStart + 1, '-', landingEnd + 1);
console.log('PWAInstallBanner:', pwaStart + 1, '-', pwaEnd + 1);
console.log('AppointmentBookingModal:', apptStart + 1, '-', apptEnd + 1);

const landingBlock = lines.slice(landingStart, landingEnd + 1).join('\n');
const pwaBlock = lines.slice(pwaStart, pwaEnd + 1).join('\n');
const apptBlock = lines.slice(apptStart, apptEnd + 1).join('\n');

const landingFile = `// ═══════════════════════════════════════════════════════════════════
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
  LogOutIcon, Wrench, MailIcon,
} from '../components/icons.jsx';

// IIFE-with-hooks pattern icin kucuk yardimci.
function Iife({ children }) { return children(); }

${landingBlock}

${pwaBlock}

${apptBlock}

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
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: C.bg, color: C.text }}>
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
`;

fs.mkdirSync(path.dirname(LANDING_PATH), { recursive: true });
fs.writeFileSync(LANDING_PATH, landingFile, 'utf8');
console.log('OK. Yazildi:', LANDING_PATH);
console.log('Boyut:', fs.statSync(LANDING_PATH).size, 'byte');
console.log('Satir sayisi:', landingFile.split('\n').length);
