// Ek bir araç: legacy index.html'den çıkardığımız App body'sini
// proper ES Module imports'lu src/App.jsx'e dönüştürür.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, '.migration', 'app_body_in.jsx');
const OUT = path.join(ROOT, 'src', 'App.jsx');

let code = fs.readFileSync(SRC, 'utf8');

// 1) Bas/sondaki bos satirlari, IIFE'leri ve ilk 2 IIFE wrapper'ini sil
//    (boot CDN check + SW kill-switch). Vite ortam?nda gereksiz.
//    `(function() { ... boot.remove(); })();` blogu
code = code.replace(/^\s*\(function\(\)\s*\{[\s\S]*?if\s*\(boot\)\s*boot\.remove\(\);\s*\}\)\(\);\s*/m, '');

//    `// ─── KILL SWITCH ...` yorumu + ardindaki async IIFE
code = code.replace(/\/\/\s*─*\s*KILL SWITCH[\s\S]*?\}\)\(\);\s*/m, '');

// 2) `const { useState, ... } = React;` -> ES import
code = code.replace(
  /const\s*\{\s*useState\s*,\s*useEffect\s*,\s*useRef\s*,\s*useMemo\s*,\s*useCallback\s*\}\s*=\s*React;\s*/,
  ''
);

// 3) `const { motion, useScroll, ... } = window.Motion;` -> ES import
//    Çok satırlı destructuring olabilir.
code = code.replace(
  /const\s*\{\s*([^}]+?)\s*\}\s*=\s*window\.Motion;\s*/,
  ''
);

// 4) `window.jspdf.jsPDF` veya `const { jsPDF } = window.jspdf;` -> jsPDF
code = code.replace(/const\s*\{\s*jsPDF\s*\}\s*=\s*window\.jspdf;\s*/g, '');
code = code.replace(/window\.jspdf\.jsPDF/g, 'jsPDF');
code = code.replace(/window\.jspdf/g, '{ jsPDF }');

// 5) window.supabase.createClient -> createClient
code = code.replace(/typeof\s+window\.supabase\s*!==\s*['"]undefined['"]\s*&&\s*window\.supabase\.createClient/g, 'true');
code = code.replace(/typeof\s+window\.supabase\s*===\s*['"]undefined['"]/g, 'false');
code = code.replace(/typeof\s+window\.supabase\s*!==\s*['"]undefined['"]/g, 'true');
code = code.replace(/window\.supabase\.createClient/g, 'createClient');

// 6) ReactDOM.createRoot(...).render(<App />) satirini sil — main.jsx halleder
code = code.replace(/^\s*ReactDOM\.createRoot\([^)]+\)\.render\(\s*<App\s*\/>\s*\);.*$/gm, '');

// 7) Bas?ndaki 4 spaceli indent'? sil (eski script <script> i?inde 4 space indent'liydi)
code = code.split('\n').map(line => line.replace(/^\s{4}/, '')).join('\n');

// 7b) Tokens, hooks ve icons bloklarini sil — ayri dosyalara tasindi
function stripBetween(content, startMarker, endMarker, includeStart = true, includeEnd = false) {
  const lines = content.split('\n');
  const out = [];
  let inBlock = false;
  for (const line of lines) {
    if (!inBlock && line.includes(startMarker)) {
      inBlock = true;
      if (!includeStart) out.push(line);
      continue;
    }
    if (inBlock && line.includes(endMarker)) {
      inBlock = false;
      if (includeEnd) continue;
      out.push(line);
      continue;
    }
    if (inBlock) continue;
    out.push(line);
  }
  return out.join('\n');
}

// Design tokens blogu -> tokens.js
code = stripBetween(code, '// ─── Design tokens', '// ─── Inline lucide-style icons');
// Inline icons blogu -> icons.jsx
code = stripBetween(code, '// ─── Inline lucide-style icons', '// ─── Hooks');
// Hooks blogu -> hooks.js
code = stripBetween(code, '// ─── Hooks', '// ─── Noise overlay');
// Additional icons blogu -> icons.jsx
code = stripBetween(code, '// ─── Additional icons', '// ─── Mock database');

// 8) En basa import'lari ekle
const header = `// Bu dosya legacy/index.html'den otomatik tasindi. Asama asama bilesenler
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
  CheckSquare, HashIcon, QrCodeIcon, ClipboardIcon, ScaleIcon, ShieldIcon, UserPlusIcon,
  TrashIcon, GlobeIcon, InfinityIcon, UsersGroupIcon, RadioTowerIcon, FolderCheckIcon,
  CameraIcon, GridIcon, MaximizeIcon,
} from './components/icons.jsx';

`;

// 9) Sonuna export default App; ekle
const footer = `\nexport default App;\n`;

const final = header + code.trimEnd() + footer;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, final, 'utf8');

console.log('OK. Yazildi:', OUT);
console.log('Boyut:', fs.statSync(OUT).size, 'byte');
console.log('Satir sayisi:', final.split('\n').length);
