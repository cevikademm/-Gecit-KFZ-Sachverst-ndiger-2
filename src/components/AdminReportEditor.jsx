// Rapor Düzenleyici — AutoiXpert "Beteiligte" sayfasının iskeleti.
// Üst kısımda 7 adımlı süreç çubuğu, altta 3 sütunlu form
// (Davacı / Kaza+Ziyaretler / Karşı taraf+Sigorta+İmzalar).

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { C } from '../utils/tokens.js';
import { getSupabaseClient } from '../utils/supabaseAuth.js';
import FahrzeugauswahlPanel from './FahrzeugauswahlPanel.jsx';
import DruckVersandPanel from './DruckVersandPanel.jsx';

// ─── Plaka parser: "34 ABC 123" → { city: '34', initials: 'ABC', number: '123' }
function parsePlate(raw) {
  const empty = { city: '', initials: '', number: '' };
  if (!raw || typeof raw !== 'string') return empty;
  const parts = raw.trim().toUpperCase().split(/[\s•·\-]+/).filter(Boolean);
  if (parts.length >= 3) return { city: parts[0], initials: parts[1], number: parts.slice(2).join('') };
  if (parts.length === 2) return { city: parts[0], initials: '', number: parts[1] };
  return { ...empty, city: parts[0] || '' };
}

// İsmi "İlk Soy" → { firstName, lastName } olarak ayır.
function splitName(full) {
  if (!full) return { firstName: '', lastName: '' };
  const tokens = String(full).trim().split(/\s+/);
  if (tokens.length === 1) return { firstName: tokens[0], lastName: '' };
  return { firstName: tokens[0], lastName: tokens.slice(1).join(' ') };
}

// Müşteri + araç → claimant & vehicle taslak alanlarını üret.
function buildAutofillPatch(customer, vehicle) {
  const { firstName, lastName } = splitName(customer?.full_name);
  const claimantPatch = {
    company:       customer?.company || '',
    salutation:    '',
    firstName,
    lastName,
    street:        customer?.address || customer?.street || '',
    zip:           customer?.zip     || customer?.postal_code || '',
    city:          customer?.city    || '',
    phone:         customer?.phone   || '',
    email:         customer?.email   || '',
    plate:         vehicle ? parsePlate(vehicle.plate) : { city: '', initials: '', number: '' },
    isOwner:       true,
  };
  const vehiclePatch = vehicle ? {
    vin:                vehicle.chassis || vehicle.vin || '',
    manufacturer:       vehicle.brand   || '',
    mainType:           vehicle.model   || '',
    yearOfManufacture:  vehicle.year ? String(vehicle.year) : '',
    firstRegistration:  vehicle.first_registration || '',
  } : null;
  return { claimantPatch, vehiclePatch };
}

// Agent'tan gelen draft'ı boş initialDraft üzerine deep-merge eder.
// Eksik alanlar default değerlerini korur, dolu alanlar üzerine yazılır.
function mergeDraft(base, override) {
  if (!override || typeof override !== 'object') return base;
  const out = { ...base };
  for (const key of Object.keys(override)) {
    const ov = override[key];
    const bv = base[key];
    if (ov && typeof ov === 'object' && !Array.isArray(ov) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[key] = { ...bv, ...ov };
    } else if (ov !== undefined && ov !== null) {
      out[key] = ov;
    }
  }
  return out;
}

const STEPS = [
  { key: 'beteiligte',  label: 'Katılımcılar' },
  { key: 'fahrzeug',    label: 'Araç' },
  { key: 'zustand',     label: 'Durum' },
  { key: 'fotos',       label: 'Fotoğraflar' },
  { key: 'kalkulation', label: 'Hesaplama' },
  { key: 'rechnung',    label: 'Fatura' },
  { key: 'druck',       label: 'Baskı & Gönderim' },
];

const initialDraft = {
  // Davacı
  claimant: {
    company: '', salutation: '', firstName: '', lastName: '',
    street: '', zip: '', city: '', phone: '', email: '',
    plate: { city: '', initials: '', number: '' },
    canDeductTax: false,
    isOwner: true,
    representedByLawyer: false,
  },
  // Rapor özellikleri
  report: {
    type: 'Sorumluluk talebi',
    assessor: 'Rohat Gecit',
    fileNumber: '',
    completionDate: '',
    orderingMethod: 'kişisel',
    orderDate: '',
    orderTime: '',
    intermediary: '',
  },
  // Kaza
  accident: {
    date: '', time: '', location: '',
    policeRecorded: false,
  },
  // Ziyaret
  visit: {
    place: '', street: '', zip: '', city: '',
    date: '', time: '',
    assessor: 'Rohat Gecit',
    carCondition: '',
    isAfterAccident: true,
    conditions: '',
    aids: [],
    notes: '',
    presentAssessor: true,
    presentClaimant: true,
  },
  // Karşı taraf
  opponent: {
    company: '', salutation: '', firstName: '', lastName: '',
    street: '', zip: '', city: '', phone: '',
    plate: { city: '', initials: '', number: '' },
    isOwner: true,
  },
  // Sigorta
  insurance: {
    company: '', street: '', zip: '', city: '', phone: '', email: '',
    insuranceNumber: '', claimNumber: '',
  },
  // İmzalar
  signatures: {
    order: false,
    cancel: false,
    dataProtection: false,
  },
  // Araç (Fahrzeug)
  vehicle: {
    vin: '',
    vinVerified: false,
    datCode: '',
    marketIndex: '',
    manufacturer: '',
    mainType: '',
    subType: '',
    kbaCode: '',
    powerKw: '',
    powerPs: '',
    engineConfig: '',
    cylinders: '',
    transmission: '',
    displacement: '',
    yearOfManufacture: '',
    firstRegistration: '',
    lastRegistration: '',
    technicalDataSource: '',
    shape: 'coupe',
    engineType: 'diesel',
    customEngineType: '',
    axles: 2,
    poweredAxles: 1,
    doors: 3,
    seats: 4,
    previousOwners: 1,
  },
  // Durum (Fahrzeugzustand)
  condition: {
    paintType: '',
    paintColor: '',
    paintCondition: '',
    generalCondition: '',
    bodyCondition: '',
    interiorCondition: '',
    drivability: '',
    emergencyRepairState: '',
    specialFeatures: '',
    notes: '',
    nextInspection: '',
    mileageRead: '',
    mileageEstimated: '',
    mileageUnit: 'km',
    emissionGroup: 4,
    emissionNorm: '',
    serviceBookKept: false,
    testDriveDone: false,
    errorMemoryRead: false,
    airbagsDeployed: false,
    // Yeni — AutoiXpert paritesi
    notrepair: { status: '', notes: '' },
    bemerkungen: '',
    // Lackschichtdickenmessung (μm) — 21 pozisyona kadar
    paintMeasurements: {}, // { frontLeft: '120', hood: '125', ... }
  },
  // Hasar bölgeleri (gövde)
  damages: {
    areas: {
      frontLeft: false, frontCenter: false, frontRight: false,
      fenderFrontLeft: false, hood: false, fenderFrontRight: false,
      doorDriver: false, windshield: false, doorFrontPassenger: false,
      doorBackPassengerLeft: false, roof: false, doorBackPassengerRight: false,
      fenderRearLeft: false, fenderRearRight: false,
      rearLeft: false, rearWindow: false, rearCenter: false, rearRight: false,
    },
    previousRepaired: '',
    oldUnrepaired: '',
    subsequentDamage: '',
    // Yeni — Schadenbeschreibung sekmesi
    description: '',
    hergang: '',
    plausibilitaet: '',
  },
  // Lastikler — flat default (4 lastik için ortak), her aks ayrı override edebilir
  tires: {
    dimension: '',
    treadMm: '',
    manufacturer: '',
    season: 'allyear',
    customSeasonType: '',
    // 4-aks override — boş bırakılırsa default'tan miras alır
    perWheel: { VL: {}, VR: {}, HL: {}, HR: {} },
  },
  // Fatura (Rechnung)
  invoice: {
    feeTable: 'BVSK 2024',
    selectedHB: 'HB III',         // BVSK koridoru seçimi
    baseFee: 185,                 // Grundhonorar
    photoFlat: false,
    photoCount: 12,
    pricePerPhoto: 2.5,
    photoSecondSet: false,
    pricePerSecondPhoto: 1.5,
    travelFlat: true,
    travelFee: 55,
    writingFlat: false,
    writingPages: 0,
    pricePerPage: 1.8,
    writingCopy: false,
    pricePerCopy: 0.5,
    postageAndPhone: 25,
    customItems: [],
    // Rechnung
    recipient: {
      salutation: 'Frau',
      firstName: '',
      lastName: '',
      street: '',
      zip: '',
      city: '',
    },
    invoiceNumber: '',
    invoiceDate: '',
    daysUntilDue: 14,
    isEInvoice: false,
    vatRate: 19,
    skipInvoice: false,
  },
  // Hasar Hesaplaması (Schadenskalkulation)
  calculation: {
    provider: 'dat',          // dat | audatex | gtmotive | manual
    repairCostNet: '',
    repairCostGross: '',
    vatRate: 19,
    laborHours: '',
    laborCostPerHour: '',
    paintCostNet: '',
    sparePartsNet: '',
    sparePartsSurcharge: 0,   // %
    smallParts: 0,            // %
    devaluation: '',          // değer kaybı (Wertminderung) ≈ merkantilerMinderwert
    replacementValue: '',     // ikame değeri (Wiederbeschaffungswert)
    residualValue: '',        // kalıntı değeri (Restwert)
    repairDuration: '',       // gün
    isTotalLoss: false,
    isEconomicTotalLoss: false,
    notes: '',
    items: [],                // pozisyon listesi

    // ─── AutoiXpert kalkulation layout — yeni alanlar ──────────
    // Werkstatt (atölye saat ücretleri)
    useDekraRates: true,
    workshop: { name: 'Alsdorf', zip: '52477', mechanik: 176.75, karosserie: 178.50, lackiohn: 201.75 },
    // Kalkulation toplam
    abzuegeNeuFuerAlt: 0,
    // Marktwert kaynakları (Privatmarkt / CARTV / VALUEpilot / winvalue / eigene)
    marketSources: [
      { id: 'mw_neutral',   name: 'Neutral (Privatmarkt)', status: 'active'  },
      { id: 'mw_cartv',     name: 'CARTV',                  status: 'idle'   },
      { id: 'mw_valuepilot',name: 'VALUEpilot',             status: 'idle'   },
      { id: 'mw_winvalue',  name: 'winvalue',               status: 'idle'   },
    ],
    // Nutzungsausfall (kullanım kaybı)
    lossOfUse: {
      group: 'B',                    // Ausfallgruppe (A..L)
      costPerDay: 35,                // €/gün
      vehicleClass: '2 - Kleinwagen',// Mietwagenklasse
      repairDays: '2-3',             // Reparaturdauer
      replacementDays: 14,           // Wiederbeschaffungsdauer
    },
    // Restwert kaynakları
    residualSources: [
      { id: 'rw_autoonline',name: 'AUTOonline', status: 'idle', ts: '', location: '' },
      { id: 'rw_cartv',     name: 'CARTV',      status: 'idle', ts: '', location: '' },
      { id: 'rw_carcasion', name: 'car.casion', status: 'idle', ts: '', location: '' },
      { id: 'rw_winvalue',  name: 'winvalue',   status: 'idle', ts: '', location: '' },
      { id: 'rw_eigene',    name: 'Eigene',     status: 'idle', ts: '', location: '' },
    ],
    // Fahrzeugwert
    replacementTaxRate: 'Neutral', // 'Neutral' | '19%' | '7%' | '0%'
    merkantilerMinderwert: '',
    technischerMinderwert: '',
    wertverbesserung: '',
    damageClass: 'Reparaturschaden', // Reparaturschaden | Totalschaden | wirtschaftlicher Totalschaden
    fictiveAccounting: true,
    // Reparatur
    achsvermessung: 'nicht erforderlich',     // nicht erforderlich | erforderlich
    karosserievermessung: 'nicht erforderlich',
    beilackierung: 'erforderlich',
    beilackierungComment: '',
    kunststoffreparatur: false,
    reparaturweg: '',
    risiken: '',
  },
};

const DAMAGE_AREAS = [
  { key: 'frontLeft',              label: 'Sol Ön Köşe' },
  { key: 'frontCenter',            label: 'Ön Orta' },
  { key: 'frontRight',             label: 'Sağ Ön Köşe' },
  { key: 'fenderFrontLeft',        label: 'Sol Ön Çamurluk' },
  { key: 'hood',                   label: 'Kaput' },
  { key: 'fenderFrontRight',       label: 'Sağ Ön Çamurluk' },
  { key: 'doorDriver',             label: 'Sürücü Kapısı' },
  { key: 'windshield',             label: 'Ön Cam' },
  { key: 'doorFrontPassenger',     label: 'Yolcu Kapısı' },
  { key: 'doorBackPassengerLeft',  label: 'Sol Arka Kapı' },
  { key: 'roof',                   label: 'Tavan' },
  { key: 'doorBackPassengerRight', label: 'Sağ Arka Kapı' },
  { key: 'fenderRearLeft',         label: 'Sol Arka Çamurluk' },
  { key: 'rearWindow',             label: 'Arka Cam' },
  { key: 'fenderRearRight',        label: 'Sağ Arka Çamurluk' },
  { key: 'rearLeft',               label: 'Sol Arka Köşe' },
  { key: 'rearCenter',             label: 'Arka Orta' },
  { key: 'rearRight',              label: 'Sağ Arka Köşe' },
];

const TIRE_SEASONS = [
  { key: 'summer',  label: 'Yaz',     icon: '☀️' },
  { key: 'winter',  label: 'Kış',     icon: '❄️' },
  { key: 'allyear', label: 'Dört Mevsim', icon: '🌦️' },
];

const CALC_PROVIDERS = [
  { key: 'dat',      label: 'DAT',         icon: '🅳' },
  { key: 'audatex',  label: 'Audatex',     icon: '🅰' },
  { key: 'gtmotive', label: 'GT Motive',   icon: '🅶' },
  { key: 'manual',   label: 'Elle Hesap',  icon: '✏️' },
];

// BVSK 2024 ücret tablosu (referans). Değerler sorumluluk hasarı (HS) içindir.
// Satırlar: hasar tutarı eşiği. Sütunlar: HB I..V honorar koridorları.
const BVSK_FEE_TABLE = {
  year: 2024,
  damageLevels: [
    { damage: 500,  HB1: 185, HB2: 211, HB3: 306, HB4: 299, HB5: '265 – 306' },
    { damage: 750,  HB1: 231, HB2: 252, HB3: 340, HB4: 333, HB5: '300 – 340' },
    { damage: 1000, HB1: 277, HB2: 292, HB3: 374, HB4: 367, HB5: '335 – 374' },
    { damage: 1250, HB1: 322, HB2: 332, HB3: 408, HB4: 401, HB5: '370 – 408' },
    { damage: 1500, HB1: 351, HB2: 366, HB3: 442, HB4: 435, HB5: '400 – 442' },
  ],
};
const HB_COLUMNS = ['HB1', 'HB2', 'HB3', 'HB4', 'HB5'];
const HB_LABELS  = { HB1: 'HB I', HB2: 'HB II', HB3: 'HB III', HB4: 'HB IV', HB5: 'HB V' };

const SHAPES = [
  { key: 'limousine',    label: 'Limousine',    icon: '🚙' },
  { key: 'kompaktwagen', label: 'Kompakt',      icon: '🚗' },
  { key: 'coupe',        label: 'Coupé',        icon: '🏎️' },
  { key: 'kombi',        label: 'Kombi',        icon: '🚐' },
  { key: 'suv',          label: 'SUV',          icon: '🚛' },
  { key: 'andere',       label: 'Diğer',        icon: '➕' },
];

const ENGINES = [
  { key: 'benzin',     label: 'Benzin',     icon: '⛽' },
  { key: 'diesel',     label: 'Dizel',      icon: '🛢️' },
  { key: 'elektro',    label: 'Elektrik',   icon: '⚡' },
  { key: 'autogas',    label: 'LPG',        icon: '🔥' },
  { key: 'erdgas',     label: 'CNG',        icon: '💨' },
  { key: 'biodiesel',  label: 'Bio-Dizel',  icon: '🌱' },
  { key: 'wasserstoff', label: 'Hidrojen',  icon: '💧' },
];

function Field({ label, value, onChange, type = 'text', placeholder = '', readOnly = false }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: C.textDim }}>
        {label}
      </span>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm outline-none transition focus:ring-2"
        style={{
          background: 'rgba(0,0,0,0.04)',
          border: `1px solid ${C.border}`,
          color: C.text,
        }}
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: C.text }}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded cursor-pointer"
        style={{ accentColor: C.neon }}
      />
      <span>{label}</span>
    </label>
  );
}

function Card({ title, icon, children, action, padding }) {
  // padding="p-0" → header'sız, içerik kendi padding'ini yönetir
  const isFlush = padding === 'p-0';
  return (
    <section className={isFlush ? 'rounded-2xl overflow-hidden' : 'rounded-2xl p-5 space-y-4'}
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {title && (
        <header className={isFlush ? 'flex items-center justify-between px-5 pt-5' : 'flex items-center justify-between'}>
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: C.text, letterSpacing: '0.05em' }}>
            {icon && <span aria-hidden>{icon}</span>}
            {title}
          </h3>
          {action}
        </header>
      )}
      {isFlush ? children : <div className="space-y-3">{children}</div>}
    </section>
  );
}

function PlateInput({ value, onChange }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v.toUpperCase() });
  return (
    <div className="flex items-center gap-1 p-2 rounded-md w-fit"
      style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderLeft: `8px solid #0066CC` }}>
      <input value={value.city} onChange={(e) => set('city')(e.target.value)} maxLength={3} placeholder="XX"
        className="w-10 text-center font-bold tracking-wider outline-none" style={{ color: '#0A0A0A' }} />
      <span style={{ color: '#0A0A0A' }}>•</span>
      <input value={value.initials} onChange={(e) => set('initials')(e.target.value)} maxLength={2} placeholder="XX"
        className="w-10 text-center font-bold tracking-wider outline-none" style={{ color: '#0A0A0A' }} />
      <input value={value.number} onChange={(e) => set('number')(e.target.value.replace(/[^0-9EH]/g, ''))} maxLength={5} placeholder="0000"
        className="w-16 text-center font-bold tracking-wider outline-none" style={{ color: '#0A0A0A' }} />
    </div>
  );
}

function CountSelector({ values, value, onChange, renderItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => {
        const isActive = value === v;
        return (
          <button key={String(v)} onClick={() => onChange(v)}
            className="w-12 h-12 rounded-lg text-sm font-semibold transition flex flex-col items-center justify-center"
            style={{
              background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
              border: `2px solid ${isActive ? C.neon : C.border}`,
              color: isActive ? C.neon : C.text,
            }}>
            {renderItem ? renderItem(v, isActive) : v}
          </button>
        );
      })}
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder = '' }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: C.textDim }}>
        {label}
      </span>
      <textarea
        value={value || ''}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm outline-none resize-y"
        style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}
      />
    </label>
  );
}

// ─── FotosPanel — Müşterinin / aracın AutoiXpert fotoğraflarını gösterir ──
function FotosPanel({ selectedCustomer, selectedVehicle, customerVehicles }) {
  const [photos, setPhotos] = useState(null); // null = yükleniyor
  const [signedMap, setSignedMap] = useState({});
  const [lightbox, setLightbox] = useState(null);

  // Hangi araç(lar)ın fotoları yüklensin?
  const targetVehicles = useMemo(() => {
    if (selectedVehicle) return [selectedVehicle];
    return (customerVehicles || []).filter(v => v.autoixpert_report_id);
  }, [selectedVehicle, customerVehicles]);

  const reportIds = useMemo(() => targetVehicles.map(v => v.autoixpert_report_id).filter(Boolean), [targetVehicles]);

  useEffect(() => {
    if (!selectedCustomer) { setPhotos([]); return; }
    if (reportIds.length === 0) { setPhotos([]); return; }
    let cancelled = false;
    setPhotos(null);
    (async () => {
      const sb = getSupabaseClient();
      if (!sb) { setPhotos([]); return; }
      // Fotoları çek
      const { data, error } = await sb.from('autoixpert_photos')
        .select('id, report_id, storage_path, storage_bucket, mimetype, size_bytes, width, height, title, original_name, included_in_report, downloaded_at')
        .in('report_id', reportIds)
        .eq('download_status', 'done')
        .order('downloaded_at', { ascending: false });
      if (cancelled) return;
      if (error) { console.error('[FotosPanel]', error.message); setPhotos([]); return; }
      const ph = data || [];
      setPhotos(ph);
      // İlk 60 fotoğraf için signed URL'leri lazy çek
      const subset = ph.slice(0, 60);
      const urls = {};
      for (const p of subset) {
        const { data: signed } = await sb.storage.from(p.storage_bucket || 'autoixpert-photos').createSignedUrl(p.storage_path, 3600);
        if (signed?.signedUrl) urls[p.id] = signed.signedUrl;
      }
      if (!cancelled) setSignedMap(urls);
    })();
    return () => { cancelled = true; };
  }, [selectedCustomer?.id, reportIds.join(',')]);

  const openPhoto = async (p) => {
    let url = signedMap[p.id];
    if (!url) {
      const sb = getSupabaseClient();
      if (!sb) return;
      const { data: signed } = await sb.storage.from(p.storage_bucket || 'autoixpert-photos').createSignedUrl(p.storage_path, 3600);
      url = signed?.signedUrl;
      if (url) setSignedMap(prev => ({ ...prev, [p.id]: url }));
    }
    if (url) setLightbox({ ...p, url });
  };

  if (!selectedCustomer) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}`, color: C.textDim }}>
        <div className="text-3xl mb-3">👤</div>
        <p className="text-sm">Önce yukarıdan bir <strong style={{ color: C.text }}>müşteri</strong> seçin.</p>
      </div>
    );
  }

  if (photos === null) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}`, color: C.textDim }}>
        <div className="text-3xl mb-3 animate-pulse">📸</div>
        <p className="text-sm">Fotoğraflar yükleniyor…</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}`, color: C.textDim }}>
        <div className="text-3xl mb-3">📸</div>
        <p className="text-sm">
          Bu {selectedVehicle ? 'araç' : 'müşteri'} için AutoiXpert fotoğrafı bulunamadı.
        </p>
        <p className="text-xs mt-1">Müşteri detay sayfasındaki <strong>Fotoğraflar</strong> sekmesi de aynı kaynağı kullanır.</p>
      </div>
    );
  }

  // Rapora göre grupla (aracın token'ı yoksa report_id)
  const grouped = photos.reduce((acc, p) => {
    const v = targetVehicles.find(vh => vh.autoixpert_report_id === p.report_id);
    const label = v?.plate || p.report_id;
    if (!acc[label]) acc[label] = [];
    acc[label].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Araç Fotoğrafları</h3>
          <p className="text-xs" style={{ color: C.textDim }}>
            {photos.length} foto · {Object.keys(grouped).length} araç · AutoiXpert kaynak
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([label, list]) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-widest mb-2 font-mono"
              style={{ color: '#3B82F6', letterSpacing: '0.15em' }}>
              {label} <span style={{ color: C.textDim }}>· {list.length}</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {list.map(p => (
                <button key={p.id} onClick={() => openPhoto(p)}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 transition hover:ring-2 hover:ring-blue-400"
                  style={{ border: `1px solid ${C.border}` }}>
                  {signedMap[p.id] ? (
                    <img src={signedMap[p.id]} alt={p.title || ''} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: C.textDim }}>📸</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <img src={lightbox.url} alt={lightbox.title || ''} className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            ✕
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            {lightbox.title || lightbox.original_name}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Damage positions (görsel araç şeması üzerinde absolute) ─────
const DAMAGE_POSITIONS = [
  { key: 'frontLeft', x: 18, y: 5 }, { key: 'frontCenter', x: 50, y: 2 }, { key: 'frontRight', x: 82, y: 5 },
  { key: 'fenderFrontLeft', x: 12, y: 22 }, { key: 'hood', x: 50, y: 18 }, { key: 'fenderFrontRight', x: 88, y: 22 },
  { key: 'doorDriver', x: 10, y: 38 }, { key: 'windshield', x: 50, y: 32 }, { key: 'doorFrontPassenger', x: 90, y: 38 },
  { key: 'doorBackPassengerLeft', x: 10, y: 56 }, { key: 'roof', x: 50, y: 50 }, { key: 'doorBackPassengerRight', x: 90, y: 56 },
  { key: 'fenderRearLeft', x: 12, y: 75 }, { key: 'rearWindow', x: 50, y: 70 }, { key: 'fenderRearRight', x: 88, y: 75 },
  { key: 'rearLeft', x: 18, y: 92 }, { key: 'rearCenter', x: 50, y: 95 }, { key: 'rearRight', x: 82, y: 92 },
];

// Lack ölçüm pozisyonları (Lackschichtdickenmessung) — 11 standart
const PAINT_POSITIONS = [
  { key: 'frontLeft', x: 22, y: 7 }, { key: 'hood', x: 50, y: 14 }, { key: 'frontRight', x: 78, y: 7 },
  { key: 'fenderFrontLeft', x: 10, y: 28 }, { key: 'fenderFrontRight', x: 90, y: 28 },
  { key: 'doorDriver', x: 10, y: 48 }, { key: 'roof', x: 50, y: 48 }, { key: 'doorFrontPassenger', x: 90, y: 48 },
  { key: 'fenderRearLeft', x: 10, y: 70 }, { key: 'fenderRearRight', x: 90, y: 70 },
  { key: 'rearCenter', x: 50, y: 92 },
];

const TIRE_AXLES = [
  { key: 'VL', label: 'VL', desc: 'Vorne Links' },
  { key: 'VR', label: 'VR', desc: 'Vorne Rechts' },
  { key: 'HL', label: 'HL', desc: 'Hinten Links' },
  { key: 'HR', label: 'HR', desc: 'Hinten Rechts' },
];

// Top-down araç silueti — basit SVG (Schäden ve Lack tab'larında ortak)
function CarSilhouette({ children, height = 380 }) {
  return (
    <div style={{ position: 'relative', width: '100%', height, margin: '0 auto', maxWidth: 280 }}>
      <svg viewBox="0 0 200 380" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <rect x="40" y="20" width="120" height="340" rx="60" ry="60"
          fill="rgba(0,0,0,0.02)" stroke="#9CA3AF" strokeWidth="1.5" />
        <path d="M 60 90 L 140 90 L 130 130 L 70 130 Z" fill="rgba(0,0,0,0.06)" stroke="#9CA3AF" strokeWidth="1" />
        <path d="M 70 250 L 130 250 L 140 295 L 60 295 Z" fill="rgba(0,0,0,0.06)" stroke="#9CA3AF" strokeWidth="1" />
        <rect x="65" y="135" width="70" height="110" rx="8" fill="rgba(0,0,0,0.04)" stroke="#9CA3AF" strokeWidth="1" />
        <line x1="40" y1="38" x2="160" y2="38" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="40" y1="342" x2="160" y2="342" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3" />
      </svg>
      {children}
    </div>
  );
}

function ZustandPanel({ draft, set }) {
  const c = draft.condition || {};
  const d = draft.damages || {};
  const t = draft.tires || {};
  const paintMeasurements = c.paintMeasurements || {};
  const perWheel = t.perWheel || { VL: {}, VR: {}, HL: {}, HR: {} };

  const [centerTab, setCenterTab] = useState('schaden');
  const [tireTab, setTireTab] = useState('VL');
  const [bottomTab, setBottomTab] = useState('voralt');

  const toggleArea = (key) => set('damages.areas')({ ...(d.areas || {}), [key]: !(d.areas || {})[key] });
  const setPaintValue = (posKey, val) => set('condition.paintMeasurements')({ ...paintMeasurements, [posKey]: val });

  const wheelVal = (axle, field) => (perWheel[axle]?.[field] ?? t[field] ?? '');
  const setWheelVal = (axle, field, val) =>
    set('tires.perWheel')({ ...perWheel, [axle]: { ...(perWheel[axle] || {}), [field]: val } });
  const applyToAll = () => {
    const cur = perWheel[tireTab] || {};
    set('tires.perWheel')({ VL: { ...cur }, VR: { ...cur }, HL: { ...cur }, HR: { ...cur } });
  };
  const applyToAxle = () => {
    const cur = perWheel[tireTab] || {};
    const partner = tireTab === 'VL' ? 'VR' : tireTab === 'VR' ? 'VL' : tireTab === 'HL' ? 'HR' : 'HL';
    set('tires.perWheel')({ ...perWheel, [partner]: { ...cur } });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ────── SOL: ZUSTAND ────── */}
        <div>
          <Card title="ZUSTAND" icon="📋">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Lackart" value={c.paintType} onChange={set('condition.paintType')} placeholder="Metallic (2-Schicht)" />
              <Field label="Lackfarbe" value={c.paintColor} onChange={set('condition.paintColor')} placeholder="Grau Silber" />
            </div>
            <Field label="Lackzustand" value={c.paintCondition} onChange={set('condition.paintCondition')} placeholder="dem Alter entsprechend" />
            <Field label="Allgemeinzustand" value={c.generalCondition} onChange={set('condition.generalCondition')} placeholder="dem Alter entsprechend" />
            <Field label="Karosseriezustand" value={c.bodyCondition} onChange={set('condition.bodyCondition')} placeholder="dem Alter entsprechend" />
            <Field label="Innenraumzustand" value={c.interiorCondition} onChange={set('condition.interiorCondition')} placeholder="dem Alter entsprechend" />
            <Field label="Fahrfähigkeit" value={c.drivability} onChange={set('condition.drivability')} placeholder="rollfähig / fahrbereit / nicht fahrbereit" />

            <div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '0.05em' }}>🔧 NOTREPARATUR</span>
              </div>
              <Field label="Status" value={c.notrepair?.status || ''}
                onChange={(v) => set('condition.notrepair')({ ...(c.notrepair || {}), status: v })}
                placeholder="erforderlich / nicht erforderlich / durchgeführt" />
            </div>

            <div style={{ paddingTop: 8 }}>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>Besonderheiten</span>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Lauflstg. abgelesen" value={c.mileageRead} onChange={set('condition.mileageRead')} type="number" />
                <Field label="Lauflstg. geschätzt" value={c.mileageEstimated} onChange={set('condition.mileageEstimated')} type="number" />
                <Field label="Einheit" value={c.mileageUnit} onChange={set('condition.mileageUnit')} placeholder="km" />
              </div>
              <Field label="Nächste HU" value={c.nextInspection} onChange={set('condition.nextInspection')} placeholder="MM.YYYY" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                <Checkbox label="Scheckheftgepflegt" checked={c.serviceBookKept} onChange={set('condition.serviceBookKept')} />
                <Checkbox label="Probefahrt durchgeführt" checked={c.testDriveDone} onChange={set('condition.testDriveDone')} />
                <Checkbox label="Fehlerspeicher ausgelesen" checked={c.errorMemoryRead} onChange={set('condition.errorMemoryRead')} />
                <Checkbox label="Airbags ausgelöst" checked={c.airbagsDeployed} onChange={set('condition.airbagsDeployed')} />
              </div>
            </div>

            <div style={{ paddingTop: 12 }}>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>Schadstoffgruppen</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((g) => {
                  const isActive = c.emissionGroup === g;
                  const colors = { 1: '#DC2626', 2: '#F59E0B', 3: '#FBBF24', 4: '#16A34A' };
                  const col = colors[g];
                  return (
                    <button key={g} onClick={() => set('condition.emissionGroup')(g)} type="button"
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '8px 4px', borderRadius: 10,
                        background: isActive ? `${col}10` : 'transparent',
                        border: 'none', cursor: 'pointer',
                      }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: isActive ? col : 'transparent',
                        border: isActive ? 'none' : `2px dashed ${col}`,
                        color: isActive ? '#fff' : col,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                      }}>{g}</div>
                      <span style={{ fontSize: 10, color: isActive ? col : C.textDim, fontWeight: 600 }}>Gruppe {g}</span>
                    </button>
                  );
                })}
              </div>
              <Field label="Abgasnorm" value={c.emissionNorm} onChange={set('condition.emissionNorm')} placeholder="EU6" />
            </div>

            <div style={{ paddingTop: 8 }}>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>Bemerkungen</span>
              <Textarea value={c.bemerkungen || ''} onChange={set('condition.bemerkungen')} rows={3} placeholder="Sonstige Bemerkungen…" />
            </div>
          </Card>
        </div>

        {/* ────── ORTA: SCHÄDEN / LACK ────── */}
        <div>
          <Card title={null} padding="p-0">
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '14px 16px 8px', borderBottom: `1px solid ${C.border}` }}>
              <button onClick={() => setCenterTab('schaden')} type="button"
                style={{
                  padding: '6px 4px', background: 'transparent', border: 'none',
                  color: centerTab === 'schaden' ? C.text : C.textDim,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
                  borderBottom: centerTab === 'schaden' ? `2px solid ${C.neon}` : '2px solid transparent',
                }}>SCHÄDEN</button>
              <button onClick={() => setCenterTab('lack')} type="button"
                style={{
                  padding: '6px 4px', background: 'transparent', border: 'none',
                  color: centerTab === 'lack' ? C.text : C.textDim,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
                  borderBottom: centerTab === 'lack' ? `2px solid ${C.neon}` : '2px solid transparent',
                }}>LACK</button>
            </div>

            <div style={{ padding: 14 }}>
              {centerTab === 'schaden' ? (
                <CarSilhouette>
                  {DAMAGE_POSITIONS.map((p) => {
                    const isOn = !!d.areas?.[p.key];
                    return (
                      <button key={p.key} onClick={() => toggleArea(p.key)} type="button" title={p.key}
                        style={{
                          position: 'absolute', top: `${p.y}%`, left: `${p.x}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 22, height: 22, borderRadius: 4,
                          background: isOn ? C.neon : '#fff',
                          border: `2px solid ${isOn ? C.neon : '#9CA3AF'}`,
                          color: '#fff', cursor: 'pointer', padding: 0,
                          fontSize: 12, fontWeight: 700, lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isOn ? `0 0 0 3px ${C.neon}33` : 'none', transition: 'all 0.15s',
                        }}>{isOn && '✓'}</button>
                    );
                  })}
                </CarSilhouette>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.textDim }}>Standard ▾</span>
                    <div style={{ display: 'flex', gap: 0, height: 6, flex: 1, marginLeft: 12, borderRadius: 3, overflow: 'hidden' }}>
                      <span style={{ flex: 1, background: '#06B6D4' }} />
                      <span style={{ flex: 1, background: '#3B82F6' }} />
                      <span style={{ flex: 1, background: '#10B981' }} />
                      <span style={{ flex: 1, background: '#FBBF24' }} />
                      <span style={{ flex: 1, background: '#EF4444' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.textDim, marginBottom: 10, paddingLeft: 60 }}>
                    <span>&lt; 70</span><span>&gt;= 70</span><span>&gt; 165</span><span>&gt; 300</span><span>&gt; 700</span>
                  </div>
                  <CarSilhouette>
                    {PAINT_POSITIONS.map((p) => (
                      <div key={p.key} style={{
                        position: 'absolute', top: `${p.y}%`, left: `${p.x}%`, transform: 'translate(-50%, -50%)',
                      }}>
                        <input type="number" value={paintMeasurements[p.key] || ''}
                          onChange={(e) => setPaintValue(p.key, e.target.value)}
                          placeholder="µm"
                          style={{
                            width: 56, padding: '4px 6px', borderRadius: 6,
                            background: '#fff', border: `1px solid ${C.border}`,
                            fontSize: 11, textAlign: 'center', outline: 'none',
                          }} />
                      </div>
                    ))}
                  </CarSilhouette>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button type="button"
                      style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: 'transparent', color: C.neon, border: `1px dashed ${C.neon}`, cursor: 'pointer',
                      }}>⊕ Position hinzufügen</button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ────── SAĞ: REIFEN ────── */}
        <div>
          <Card title="REIFEN" icon="🛞" padding="p-0">
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.02)' }}>
              {TIRE_AXLES.map((a) => {
                const isOn = tireTab === a.key;
                return (
                  <button key={a.key} onClick={() => setTireTab(a.key)} type="button" title={a.desc}
                    style={{
                      flex: 1, padding: '10px 6px',
                      background: 'transparent', border: 'none',
                      color: isOn ? C.text : C.textDim,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      borderBottom: isOn ? `2px solid ${C.neon}` : '2px solid transparent',
                    }}>{a.label}</button>
                );
              })}
            </div>

            <div style={{ padding: 16 }}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Reifendimension" value={wheelVal(tireTab, 'dimension')}
                  onChange={(v) => setWheelVal(tireTab, 'dimension', v)} placeholder="165/65 R 15" />
                <Field label="Profil (mm)" value={wheelVal(tireTab, 'treadMm')}
                  onChange={(v) => setWheelVal(tireTab, 'treadMm', v)} placeholder="5 mm" />
              </div>
              <Field label="Hersteller" value={wheelVal(tireTab, 'manufacturer')}
                onChange={(v) => setWheelVal(tireTab, 'manufacturer', v)} placeholder="Continental, Michelin..." />

              <div style={{ paddingTop: 8 }}>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>Saison</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'summer',  label: 'Sommer',   color: '#F59E0B' },
                    { key: 'winter',  label: 'Winter',   color: '#3B82F6' },
                    { key: 'allyear', label: 'Ganzjahr', color: '#FBBF24' },
                  ].map((s) => {
                    const isOn = (wheelVal(tireTab, 'season') || 'allyear') === s.key;
                    return (
                      <button key={s.key} onClick={() => setWheelVal(tireTab, 'season', s.key)} type="button"
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          padding: '8px 4px', borderRadius: 10,
                          background: isOn ? `${s.color}10` : 'transparent',
                          border: 'none', cursor: 'pointer',
                        }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: isOn ? `${s.color}25` : 'rgba(0,0,0,0.04)',
                          border: `${isOn ? '2.5px' : '2px'} solid ${isOn ? s.color : C.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        }}>🛞</div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: isOn ? s.color : C.textDim, textDecoration: isOn ? 'underline' : 'none' }}>
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={applyToAll} type="button"
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8,
                    background: '#3B82F6', color: '#fff', border: 'none',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>Alle angleichen</button>
                <button onClick={applyToAxle} type="button"
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8,
                    background: 'transparent', color: '#3B82F6',
                    border: `1px solid #3B82F6`, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>Achse angleichen</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── ALT SUB-TAB BLOĞU ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0, borderRadius: 14, overflow: 'hidden',
        background: C.surface, border: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', background: '#475569', minWidth: 90 }}>
          <button onClick={() => setBottomTab('voralt')} type="button"
            style={{
              padding: '20px 12px', textAlign: 'center',
              background: bottomTab === 'voralt' ? '#1F2937' : 'transparent',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, lineHeight: 1.4,
              borderLeft: bottomTab === 'voralt' ? `3px solid ${C.neon}` : '3px solid transparent',
            }}>🔧<br />Vor- &<br />Altschäden</button>
          <button onClick={() => setBottomTab('beschreibung')} type="button"
            style={{
              padding: '20px 12px', textAlign: 'center',
              background: bottomTab === 'beschreibung' ? '#1F2937' : 'transparent',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, lineHeight: 1.4,
              borderLeft: bottomTab === 'beschreibung' ? `3px solid ${C.neon}` : '3px solid transparent',
            }}>📄<br />Schaden-<br />beschreibung</button>
        </div>
        <div style={{ flex: 1, padding: 18 }}>
          {bottomTab === 'voralt' ? (
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.text, marginBottom: 14 }}>VOR- & ALTSCHÄDEN</h4>
              <div className="space-y-4">
                <Field label="Vorschäden (repariert)" value={d.previousRepaired} onChange={set('damages.previousRepaired')} />
                <Field label="Altschäden (nicht repariert)" value={d.oldUnrepaired} onChange={set('damages.oldUnrepaired')} />
                <Field label="Nachschäden (zwischen Unfall & Besichtigung geschehen)" value={d.subsequentDamage} onChange={set('damages.subsequentDamage')} />
              </div>
            </div>
          ) : (
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.text, marginBottom: 14 }}>SCHADENBESCHREIBUNG & -HERGANG</h4>
              <div className="space-y-4">
                <Field label="Schadenbeschreibung" value={d.description || ''} onChange={set('damages.description')} />
                <Field label="Schadenhergang" value={d.hergang || ''} onChange={set('damages.hergang')} />
                <Field label="Plausibilität" value={d.plausibilitaet || ''} onChange={set('damages.plausibilitaet')} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RechnungPanel({ draft, set }) {
  const i = draft.invoice;
  const num = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };
  const fmt = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Alt toplamlar
  const photoFee = i.photoFlat
    ? num(i.pricePerPhoto)
    : num(i.photoCount) * num(i.pricePerPhoto) +
      (i.photoSecondSet ? num(i.photoCount) * num(i.pricePerSecondPhoto) : 0);
  const writingFee = i.writingFlat
    ? num(i.pricePerPage)
    : num(i.writingPages) * num(i.pricePerPage) +
      (i.writingCopy ? num(i.writingPages) * num(i.pricePerCopy) : 0);
  const customSum = (i.customItems || [])
    .filter((c) => c.active !== false)
    .reduce((sum, it) => sum + num(it.qty) * num(it.unitPrice), 0);

  const netTotal = num(i.baseFee) + photoFee + num(i.travelFee) + writingFee + num(i.postageAndPhone) + customSum;
  const vatAmount = netTotal * (num(i.vatRate) / 100);
  const grossTotal = netTotal + vatAmount;

  const setBaseFee = (val) => set('invoice.baseFee')(val);
  const addCustomItem = () => {
    set('invoice.customItems')([
      ...(i.customItems || []),
      { id: Date.now(), active: true, description: '', qty: 1, unit: 'Stk', unitPrice: '' },
    ]);
  };
  const updateCustom = (id, key, val) => {
    set('invoice.customItems')((i.customItems || []).map((c) => c.id === id ? { ...c, [key]: val } : c));
  };
  const removeCustom = (id) => {
    set('invoice.customItems')((i.customItems || []).filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* BVSK Ücret Tablosu */}
      <Card title={`BVSK ${BVSK_FEE_TABLE.year} Ücret Tablosu`} icon="📜" action={
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-1 rounded-full"
          style={{ background: `${C.neon}15`, color: C.neon, border: `1px solid ${C.neon}33` }}>
          Sorumluluk (HS)
        </span>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ color: C.text }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="py-2 px-2 text-left font-semibold" style={{ color: C.textDim }}>Hasar</th>
                {HB_COLUMNS.map((c) => (
                  <th key={c} className="py-2 px-2 text-center font-semibold" style={{ color: C.textDim }}>
                    {HB_LABELS[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BVSK_FEE_TABLE.damageLevels.map((row) => (
                <tr key={row.damage} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2 px-2 font-semibold">{row.damage} €</td>
                  {HB_COLUMNS.map((c) => {
                    const val = row[c];
                    const numVal = typeof val === 'number' ? val : null;
                    return (
                      <td key={c} className="py-1 px-1 text-center">
                        <button
                          onClick={() => numVal && setBaseFee(numVal)}
                          disabled={!numVal}
                          className="inline-block px-2 py-1 rounded-md text-xs font-semibold transition"
                          style={{
                            background: numVal ? 'rgba(0,0,0,0.04)' : 'transparent',
                            border: `1px solid ${numVal ? C.border : 'transparent'}`,
                            color: C.text,
                            cursor: numVal ? 'pointer' : 'default',
                            opacity: numVal ? 1 : 0.5,
                          }}
                          title={numVal ? `${val} € değerini Grundhonorar olarak kullan` : ''}>
                          {val} €
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px]" style={{ color: C.textDim }}>
          Tabloya tıklayarak <strong style={{ color: C.text }}>Grundhonorar</strong> alanını otomatik doldurabilirsin.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SOL + ORTA — Ücret kalemleri */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Grundhonorar (Temel Honorar)" icon="💼">
            <Field label="Honorar (€)" value={i.baseFee} onChange={set('invoice.baseFee')} type="number" />
            <input type="range" min="100" max="500" step="1" value={num(i.baseFee)}
              onChange={(e) => setBaseFee(e.target.value)}
              className="w-full" style={{ accentColor: C.neon }} />
            <div className="flex justify-between text-[11px]" style={{ color: C.textDim }}>
              <span>100 €</span><span>500 €</span>
            </div>
          </Card>

          <Card title="Fotoğraf Ücreti" icon="📷">
            <div className="flex flex-wrap gap-3">
              <Checkbox label="Pauschal (sabit)" checked={i.photoFlat} onChange={set('invoice.photoFlat')} />
              <Checkbox label="İkinci foto seti" checked={i.photoSecondSet} onChange={set('invoice.photoSecondSet')} />
            </div>
            {!i.photoFlat ? (
              <div className="grid grid-cols-3 gap-2">
                <Field label="Adet" value={i.photoCount} onChange={set('invoice.photoCount')} type="number" />
                <Field label="Foto Birim (€)" value={i.pricePerPhoto} onChange={set('invoice.pricePerPhoto')} type="number" />
                <Field label="2. Set Birim (€)" value={i.pricePerSecondPhoto} onChange={set('invoice.pricePerSecondPhoto')} type="number" />
              </div>
            ) : (
              <Field label="Pauschal (€)" value={i.pricePerPhoto} onChange={set('invoice.pricePerPhoto')} type="number" />
            )}
            <div className="text-xs flex justify-between" style={{ color: C.textDim }}>
              <span>Foto ücreti toplamı</span>
              <strong style={{ color: C.text }}>{fmt(photoFee)} €</strong>
            </div>
          </Card>

          <Card title="Yol Masrafı (Fahrtkosten)" icon="🚗">
            <Checkbox label="Pauschal (sabit)" checked={i.travelFlat} onChange={set('invoice.travelFlat')} />
            <Field label="Tutar (€)" value={i.travelFee} onChange={set('invoice.travelFee')} type="number" />
          </Card>

          <Card title="Yazışma (Schreibkosten)" icon="📝">
            <div className="flex flex-wrap gap-3">
              <Checkbox label="Pauschal" checked={i.writingFlat} onChange={set('invoice.writingFlat')} />
              <Checkbox label="Kopya dahil" checked={i.writingCopy} onChange={set('invoice.writingCopy')} />
            </div>
            {!i.writingFlat ? (
              <div className="grid grid-cols-3 gap-2">
                <Field label="Sayfa" value={i.writingPages} onChange={set('invoice.writingPages')} type="number" />
                <Field label="Sayfa (€)" value={i.pricePerPage} onChange={set('invoice.pricePerPage')} type="number" />
                <Field label="Kopya (€)" value={i.pricePerCopy} onChange={set('invoice.pricePerCopy')} type="number" />
              </div>
            ) : (
              <Field label="Pauschal (€)" value={i.pricePerPage} onChange={set('invoice.pricePerPage')} type="number" />
            )}
            <div className="text-xs flex justify-between" style={{ color: C.textDim }}>
              <span>Yazışma toplamı</span>
              <strong style={{ color: C.text }}>{fmt(writingFee)} €</strong>
            </div>
          </Card>

          <Card title="Posta & Telefon" icon="📞">
            <Field label="Tutar (€)" value={i.postageAndPhone} onChange={set('invoice.postageAndPhone')} type="number" />
          </Card>

          <Card title="Diğer Pozisyonlar" icon="➕" action={
            <button onClick={addCustomItem}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition"
              style={{ background: C.neon, color: '#fff' }}>
              + Pozisyon Ekle
            </button>
          }>
            {(i.customItems || []).length === 0 && (
              <p className="text-xs" style={{ color: C.textDim }}>
                Henüz pozisyon yok. <strong>+ Pozisyon Ekle</strong> ile manuel kalem (örn. "Fahrzeug ausgelesen") tanımlayabilirsin.
              </p>
            )}
            <div className="space-y-2">
              {(i.customItems || []).map((it) => {
                const total = num(it.qty) * num(it.unitPrice);
                return (
                  <div key={it.id} className="rounded-lg p-3"
                    style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-1 flex items-center pb-2">
                        <input type="checkbox" checked={it.active !== false}
                          onChange={(e) => updateCustom(it.id, 'active', e.target.checked)}
                          className="w-4 h-4" style={{ accentColor: C.neon }} />
                      </div>
                      <div className="col-span-6">
                        <Field label="Açıklama" value={it.description} onChange={(v) => updateCustom(it.id, 'description', v)} placeholder="Fahrzeug ausgelesen" />
                      </div>
                      <div className="col-span-1">
                        <Field label="Adet" value={it.qty} onChange={(v) => updateCustom(it.id, 'qty', v)} type="number" />
                      </div>
                      <div className="col-span-2">
                        <Field label="Birim" value={it.unit} onChange={(v) => updateCustom(it.id, 'unit', v)} placeholder="Stk" />
                      </div>
                      <div className="col-span-2">
                        <Field label="Birim € (net)" value={it.unitPrice} onChange={(v) => updateCustom(it.id, 'unitPrice', v)} type="number" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] mt-1" style={{ color: C.textDim }}>
                      <span>Satır toplamı</span>
                      <div className="flex items-center gap-3">
                        <strong style={{ color: C.text }}>{fmt(total)} €</strong>
                        <button onClick={() => removeCustom(it.id)}
                          className="w-6 h-6 rounded-md text-xs"
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {(i.customItems || []).length > 0 && (
              <div className="pt-2 mt-2 flex justify-between text-sm border-t"
                style={{ borderColor: C.border, color: C.text }}>
                <span>Diğer pozisyonlar toplamı</span>
                <strong>{fmt(customSum)} €</strong>
              </div>
            )}
          </Card>
        </div>

        {/* SAĞ — Fatura özeti */}
        <div className="space-y-5">
          <Card title="Fatura" icon="🧾">
            <div className="space-y-2 pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase block" style={{ color: C.textDim }}>
                Fatura Alıcısı
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Selamlama" value={i.recipient.salutation} onChange={set('invoice.recipient.salutation')} placeholder="Bay/Bayan" />
                <Field label="Ad" value={i.recipient.firstName} onChange={set('invoice.recipient.firstName')} />
                <Field label="Soyad" value={i.recipient.lastName} onChange={set('invoice.recipient.lastName')} />
              </div>
              <Field label="Sokak ve Ev No" value={i.recipient.street} onChange={set('invoice.recipient.street')} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Posta Kodu" value={i.recipient.zip} onChange={set('invoice.recipient.zip')} />
                <div className="col-span-2">
                  <Field label="Şehir" value={i.recipient.city} onChange={set('invoice.recipient.city')} />
                </div>
              </div>
            </div>

            <Field label="Fatura Numarası" value={i.invoiceNumber} onChange={set('invoice.invoiceNumber')} placeholder="2026-001" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Fatura Tarihi" value={i.invoiceDate} onChange={set('invoice.invoiceDate')} type="date" />
              <Field label="Vade (gün)" value={i.daysUntilDue} onChange={set('invoice.daysUntilDue')} type="number" />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Checkbox label="E-Rechnung (XRechnung/ZUGFeRD)" checked={i.isEInvoice} onChange={set('invoice.isEInvoice')} />
              <Checkbox label="Fatura kesme — atla (Sammelrechnung)" checked={i.skipInvoice} onChange={set('invoice.skipInvoice')} />
            </div>

            <div className="pt-2">
              <Field label="KDV (%)" value={i.vatRate} onChange={set('invoice.vatRate')} type="number" />
            </div>

            <div className="rounded-xl p-4 mt-2"
              style={{ background: 'linear-gradient(135deg, #415682, #2c3e5c)', color: '#fff' }}>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80 mb-1">Toplam (Net)</div>
              <div className="text-3xl font-bold mb-3">{fmt(netTotal)} €</div>
              <div className="flex justify-between text-xs opacity-80 pt-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <span>KDV ({i.vatRate}%)</span>
                <strong>{fmt(vatAmount)} €</strong>
              </div>
              <div className="flex justify-between text-sm pt-1" style={{ color: '#fff' }}>
                <span>Brüt</span>
                <strong>{fmt(grossTotal)} €</strong>
              </div>
            </div>

            <button
              disabled
              className="w-full py-2.5 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed"
              style={{ background: C.neon, color: '#fff' }}>
              Önizleme (yakında)
            </button>
          </Card>

          <Card title="Alt Toplamlar" icon="📊">
            <div className="space-y-1.5 text-sm">
              {[
                ['Grundhonorar',   num(i.baseFee)],
                ['Fotoğraf',       photoFee],
                ['Yol masrafı',    num(i.travelFee)],
                ['Yazışma',        writingFee],
                ['Posta & Telefon', num(i.postageAndPhone)],
                ['Diğer',          customSum],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between" style={{ color: C.textDim }}>
                  <span>{label}</span>
                  <strong style={{ color: C.text }}>{fmt(val)} €</strong>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1 text-sm border-t"
                style={{ borderColor: C.border, color: C.text }}>
                <span>Net Toplam</span>
                <strong>{fmt(netTotal)} €</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Kalkulation yardımcıları (AutoiXpert tarzı düzen) ──────────────────
const fmtEur = (n) => Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numOf = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };

function KalkSectionCard({ title, action, children }) {
  return (
    <section className="rounded-xl"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <header className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
        <h4 className="text-[11px] font-bold tracking-[0.20em] uppercase" style={{ color: C.textDim }}>{title}</h4>
        {action}
      </header>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

// İnce yatay alan: sol etiket / sağ değer (€/Tage). Tıklanabilir input.
function InlineInput({ label, value, onChange, suffix = '€', type = 'number', placeholder = '' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs flex-1" style={{ color: C.textDim }}>{label}</span>
      <div className="flex items-center gap-1.5 min-w-0" style={{ minWidth: 130 }}>
        <input
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-right text-sm outline-none px-2 py-1 rounded-md"
          style={{ background: 'transparent', borderBottom: `1px solid ${C.border}`, color: C.text }}
        />
        {suffix && <span className="text-xs" style={{ color: C.textDim }}>{suffix}</span>}
      </div>
    </div>
  );
}

// Etiket altında dropdown
function InlineSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] tracking-[0.10em] uppercase" style={{ color: C.textDim }}>{label}</span>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 rounded-md text-sm outline-none cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}`, color: C.text }}>
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Marktwert / Restwert satırı
function ProviderRow({ name, brand, status, onOpen, onMore }) {
  const dotColor = status === 'active' ? '#3B82F6' : status === 'done' ? '#10B981' : C.border;
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {brand && <span className="text-[11px] font-bold" style={{ color: brand.color || C.text }}>{brand.label}</span>}
        <span className="text-sm truncate" style={{ color: C.text }}>{name}</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onOpen} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5"
          aria-label="Aç" style={{ color: C.textDim }}>↗</button>
        <button onClick={onMore} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5"
          aria-label="Daha fazla" style={{ color: C.textDim }}>⋮</button>
      </div>
    </div>
  );
}

function KalkulationPanel({ draft, set }) {
  const k = draft.calculation;

  // Toplamlar
  const repairCostGross = numOf(k.repairCostGross) || (numOf(k.repairCostNet) * (1 + numOf(k.vatRate) / 100));
  const repairCostNet = numOf(k.repairCostNet);
  const abzuegeNFA = numOf(k.abzuegeNeuFuerAlt);
  const sumNet = repairCostNet - abzuegeNFA;
  const sumGross = repairCostGross - abzuegeNFA * (1 + numOf(k.vatRate) / 100);

  // İlerleme barı: WBW ↔ RK oranı
  const wbw = numOf(k.replacementValue);
  const rk = repairCostGross;
  const rkPct = wbw > 0 ? Math.min(100, (rk / wbw) * 100) : 0;

  const ws = k.workshop || {};
  const setWorkshop = (key) => (v) => set('calculation.workshop')({ ...ws, [key]: v });

  const lou = k.lossOfUse || {};
  const setLou = (key) => (v) => set('calculation.lossOfUse')({ ...lou, [key]: v });

  const NICHT_ERF = ['nicht erforderlich', 'erforderlich'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ─── SOL: Werkstatt ─── */}
      <div className="space-y-4">
        <KalkSectionCard title="Werkstatt">
          <Checkbox label="DEKRA-Sätze verwenden"
            checked={!!k.useDekraRates}
            onChange={set('calculation.useDekraRates')} />
          <div className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
            <span style={{ color: '#3B82F6' }}>📍</span>
            <span className="font-medium">{ws.name || '—'}</span>
            <span style={{ color: C.textDim }}>{ws.zip || ''}</span>
          </div>
          <div className="space-y-2 pt-1">
            <InlineInput label="Mechanik"   value={ws.mechanik}   onChange={setWorkshop('mechanik')}   suffix="€" />
            <InlineInput label="Karosserie" value={ws.karosserie} onChange={setWorkshop('karosserie')} suffix="€" />
            <InlineInput label="Lackiohn"   value={ws.lackiohn}   onChange={setWorkshop('lackiohn')}   suffix="€" />
          </div>
          <button type="button"
            className="text-[11px] underline mt-1"
            style={{ color: C.textDim }}>
            Weitere Kostensätze ablegen
          </button>
        </KalkSectionCard>
      </div>

      {/* ─── ORTA: Kalkulation, Marktwert, Nutzungsausfall ─── */}
      <div className="space-y-4">
        <KalkSectionCard title="Kalkulation"
          action={
            <button type="button" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5"
              style={{ color: C.textDim }} aria-label="Düzenle">✎</button>
          }>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: C.textDim }}>Reparaturkosten</span>
            <strong style={{ color: C.text }}>{fmtEur(repairCostGross)} €</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: C.textDim }}>Abzüge Neu-für-alt</span>
            <strong style={{ color: C.text }}>{fmtEur(abzuegeNFA)} €</strong>
          </div>
          <div className="border-t pt-2" style={{ borderColor: C.border }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: C.text, fontWeight: 600 }}>Summe</span>
              <strong style={{ color: C.text }}>{fmtEur(sumGross)} €</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-0.5" style={{ color: C.textDim }}>
              <span>netto</span>
              <span>{fmtEur(sumNet)} €</span>
            </div>
          </div>
          <div className="rounded-lg p-2.5 text-center"
            style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>Reparaturkosten</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: '#0EA5E9' }}>{fmtEur(repairCostGross)} €</p>
            <p className="text-[11px]" style={{ color: C.textDim }}>{fmtEur(repairCostGross * 0.84)} €</p>
          </div>
        </KalkSectionCard>

        <KalkSectionCard title="Marktwert">
          {(k.marketSources || []).map((s) => (
            <ProviderRow key={s.id} name={s.name} status={s.status} />
          ))}
          <button type="button" className="text-xs flex items-center gap-1 pt-1" style={{ color: C.neon }}>
            + Eigene Recherche
          </button>
        </KalkSectionCard>

        <KalkSectionCard title="Nutzungsausfall">
          <div className="grid grid-cols-2 gap-2">
            <InlineSelect label="Ausfallgruppe" value={lou.group} onChange={setLou('group')}
              options={['A','B','C','D','E','F','G','H','I','J','K','L']} />
            <InlineInput label="Kosten pro Tag" value={lou.costPerDay} onChange={setLou('costPerDay')} suffix="€" />
          </div>
          <InlineSelect label="Mietwagenklasse" value={lou.vehicleClass} onChange={setLou('vehicleClass')}
            options={['1 - Kleinstwagen','2 - Kleinwagen','3 - Kompaktklasse','4 - Mittelklasse','5 - Obere Mittelklasse','6 - Oberklasse']} />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <InlineInput label="Reparaturdauer" value={lou.repairDays} onChange={setLou('repairDays')} suffix="Tage" type="text" />
            <InlineInput label="Wiederbeschaffungsdauer" value={lou.replacementDays} onChange={setLou('replacementDays')} suffix="Tage" />
          </div>
        </KalkSectionCard>
      </div>

      {/* ─── SAĞ: Restwert, Fahrzeugwert, Reparatur ─── */}
      <div className="space-y-4">
        <KalkSectionCard title="Restwert"
          action={
            <button type="button" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5"
              style={{ color: C.textDim }} aria-label="Liste">≡</button>
          }>
          <div className="flex items-center gap-2 text-[11px] flex-wrap" style={{ color: C.textDim }}>
            <span>📅 {new Date().toLocaleDateString('de-DE')}</span>
            <span>· {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
            <span>· 📍 {ws.zip || ''}</span>
          </div>
          {(k.residualSources || []).map((s) => (
            <ProviderRow key={s.id} name={s.name} status={s.status} />
          ))}
        </KalkSectionCard>

        <KalkSectionCard title="Fahrzeugwert"
          action={
            <button type="button" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5"
              style={{ color: C.textDim }} aria-label="Daha fazla">⋮</button>
          }>
          <div className="grid grid-cols-2 gap-2 items-end">
            <InlineInput label="Wiederbeschaffungswert" value={k.replacementValue} onChange={set('calculation.replacementValue')} suffix="€" />
            <InlineSelect label="Steuersatz" value={k.replacementTaxRate} onChange={set('calculation.replacementTaxRate')}
              options={['Neutral','19%','7%','0%']} />
          </div>
          <div className="pt-1 space-y-1">
            <InlineInput label="Restwert"               value={k.residualValue}          onChange={set('calculation.residualValue')}          suffix="€" />
            <InlineInput label="Merkantiler Minderwert" value={k.merkantilerMinderwert}   onChange={set('calculation.merkantilerMinderwert')}  suffix="€" />
            <InlineInput label="Technischer Minderwert" value={k.technischerMinderwert}   onChange={set('calculation.technischerMinderwert')}  suffix="€" />
            <InlineInput label="Wertverbesserung"       value={k.wertverbesserung}        onChange={set('calculation.wertverbesserung')}       suffix="€" />
          </div>
          <button type="button" className="text-xs" style={{ color: C.neon }}>
            + Sonderkosten
          </button>

          {/* WBW & RK ilerleme barları */}
          <div className="space-y-2 pt-2">
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: C.textDim }}>
                <span>WBW</span><span>{fmtEur(wbw)} €</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(14,165,233,0.6)' }} />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: C.textDim }}>
                <span>RK</span><span>{rkPct.toFixed(0)}% · {fmtEur(rk)} €</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(14,165,233,0.15)' }}>
                <div className="h-1 rounded-full" style={{ width: `${rkPct}%`, background: '#0EA5E9' }} />
              </div>
            </div>
          </div>

          <InlineSelect label="Schadenklasse" value={k.damageClass} onChange={set('calculation.damageClass')}
            options={['Reparaturschaden','wirtschaftlicher Totalschaden','Totalschaden','Bagatellschaden']} />
          <Checkbox label="Fiktive Abrechnung"
            checked={!!k.fictiveAccounting}
            onChange={set('calculation.fictiveAccounting')} />
        </KalkSectionCard>

        <KalkSectionCard title="Reparatur">
          <InlineSelect label="Achsvermessung"        value={k.achsvermessung}        onChange={set('calculation.achsvermessung')}        options={NICHT_ERF} />
          <InlineSelect label="Karosserievermessung"  value={k.karosserievermessung}  onChange={set('calculation.karosserievermessung')}  options={NICHT_ERF} />
          <InlineSelect label="Beilackierung"          value={k.beilackierung}         onChange={set('calculation.beilackierung')}         options={NICHT_ERF} />
          <Textarea label="Kommentar Beilackierung" rows={2}
            value={k.beilackierungComment} onChange={set('calculation.beilackierungComment')} />
          <Checkbox label="Kunststoffreparatur"
            checked={!!k.kunststoffreparatur}
            onChange={set('calculation.kunststoffreparatur')} />
          <Field label="Reparaturweg" value={k.reparaturweg} onChange={set('calculation.reparaturweg')} />
          <Field label="Risiken"      value={k.risiken}      onChange={set('calculation.risiken')} />
        </KalkSectionCard>
      </div>
    </div>
  );
}

// AdminReportEditor'da kullanılan field isimleri ile FahrzeugauswahlPanel'in
// beklediği AutoiXpert isimleri arasında bidirectional mapping.
const VEHICLE_FIELD_MAP = {
  // panel-key            → editor-key
  vin: 'vin',
  vinChecked: 'vinVerified',
  dateCode: 'datCode',
  marktindex: 'marketIndex',
  hersteller: 'manufacturer',
  haupttyp: 'mainType',
  untertyp: 'subType',
  kba: 'kbaCode',
  kw: 'powerKw',
  ps: 'powerPs',
  motorbauart: 'engineConfig',
  zylinder: 'cylinders',
  getriebe: 'transmission',
  hubraum: 'displacement',
  baujahr: 'yearOfManufacture',
  erstzulassung: 'firstRegistration',
  letzteZulassung: 'lastRegistration',
  quelle: 'technicalDataSource',
  fahrzeugart: 'shape',
  motorart: 'engineType',
  achsen: 'axles',
  angetriebeneAchsen: 'poweredAxles',
  tueren: 'doors',
  sitze: 'seats',
  vorbesitzer: 'previousOwners',
};

// Önceki sahip — panel ↔ editor değer çevirimi (Mehrere/Unbekannt ↔ multiple/unknown)
const PREVOWNER_PANEL_TO_EDITOR = { Mehrere: 'multiple', Unbekannt: 'unknown' };
const PREVOWNER_EDITOR_TO_PANEL = { multiple: 'Mehrere', unknown: 'Unbekannt' };

function vehicleEditorToPanel(v) {
  if (!v) return {};
  const out = {};
  Object.entries(VEHICLE_FIELD_MAP).forEach(([panelKey, editorKey]) => {
    out[panelKey] = v[editorKey];
  });
  // Önceki sahip değer çevirimi
  if (typeof out.vorbesitzer === 'string' && PREVOWNER_EDITOR_TO_PANEL[out.vorbesitzer]) {
    out.vorbesitzer = PREVOWNER_EDITOR_TO_PANEL[out.vorbesitzer];
  }
  return out;
}

function FahrzeugPanel({ draft, set }) {
  // Panel-format vehicle objesi (editor-format'tan dönüştürülmüş)
  const panelVehicle = useMemo(() => vehicleEditorToPanel(draft.vehicle), [draft.vehicle]);

  // Panel'den gelen değişiklikleri editor-format'a geri çevir ve set'i çağır
  const handlePanelChange = (next) => {
    Object.entries(VEHICLE_FIELD_MAP).forEach(([panelKey, editorKey]) => {
      const oldVal = panelVehicle[panelKey];
      let newVal = next[panelKey];
      if (oldVal === newVal) return;
      // Önceki sahip — panel'den gelen Mehrere/Unbekannt → multiple/unknown
      if (panelKey === 'vorbesitzer' && typeof newVal === 'string' && PREVOWNER_PANEL_TO_EDITOR[newVal]) {
        newVal = PREVOWNER_PANEL_TO_EDITOR[newVal];
      }
      set(`vehicle.${editorKey}`)(newVal);
    });
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <FahrzeugauswahlPanel vehicle={panelVehicle} onChange={handlePanelChange} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Eski FahrzeugPanel (yedek) — kaldırılan kod aşağıdaki sahte fonksiyonda
// referans amaçlı tutulmuyor; gerekirse git history'den geri alınır.
function _LegacyFahrzeugPanelDeleted({ draft, set }) {
  const v = draft.vehicle;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* SOL — Basisdaten */}
      <div className="space-y-5">
        <Card title="Temel Bilgiler" icon="🚘">
          <div>
            <Field label="Şasi Numarası (VIN)" value={v.vin} onChange={set('vehicle.vin')} placeholder="17 hane" />
            <div className="mt-2">
              <Checkbox label="VIN araç üzerinde doğrulandı" checked={v.vinVerified} onChange={set('vehicle.vinVerified')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="DAT-Kodu" value={v.datCode} onChange={set('vehicle.datCode')} />
            <Field label="Pazar İndeksi" value={v.marketIndex} onChange={set('vehicle.marketIndex')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Üretici" value={v.manufacturer} onChange={set('vehicle.manufacturer')} placeholder="VW, BMW…" />
            <Field label="Ana Tip" value={v.mainType} onChange={set('vehicle.mainType')} />
          </div>
          <Field label="Alt Tip" value={v.subType} onChange={set('vehicle.subType')} />

          <Field label="Anahtar No (KBA)" value={v.kbaCode} onChange={set('vehicle.kbaCode')} placeholder="2.1 / 2.2" />

          <div className="grid grid-cols-2 gap-2">
            <Field label="Güç (kW)" value={v.powerKw} onChange={set('vehicle.powerKw')} type="number" />
            <Field label="Güç (PS)" value={v.powerPs} onChange={set('vehicle.powerPs')} type="number" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Motor Tipi" value={v.engineConfig} onChange={set('vehicle.engineConfig')} placeholder="Sıralı / V / Boxer" />
            <Field label="Silindir" value={v.cylinders} onChange={set('vehicle.cylinders')} type="number" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Şanzıman" value={v.transmission} onChange={set('vehicle.transmission')} placeholder="Manuel / Otomatik" />
            <Field label="Hacim (cc)" value={v.displacement} onChange={set('vehicle.displacement')} type="number" />
          </div>

          <Field label="Üretim Yılı" value={v.yearOfManufacture} onChange={set('vehicle.yearOfManufacture')} placeholder="2018" />

          <div className="grid grid-cols-2 gap-2">
            <Field label="İlk Tescil" value={v.firstRegistration} onChange={set('vehicle.firstRegistration')} type="date" />
            <Field label="Son Tescil" value={v.lastRegistration} onChange={set('vehicle.lastRegistration')} type="date" />
          </div>

          <Field label="Teknik Veri Kaynağı" value={v.technicalDataSource} onChange={set('vehicle.technicalDataSource')} placeholder="Ruhsat, üretici, vb." />
        </Card>
      </div>

      {/* SAĞ — Erweitert */}
      <div className="lg:col-span-2 space-y-5">
        <Card title="Araç Tipi" icon="🚗">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SHAPES.map((s) => {
              const isActive = v.shape === s.key;
              return (
                <button key={s.key} onClick={() => set('vehicle.shape')(s.key)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl transition"
                  style={{
                    background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `2px solid ${isActive ? C.neon : C.border}`,
                    color: isActive ? C.neon : C.text,
                  }}>
                  <span className="text-2xl mb-1">{s.icon}</span>
                  <span className="text-[11px] font-semibold">{s.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Motor (Yakıt)" icon="⛽">
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {ENGINES.map((e) => {
              const isActive = v.engineType === e.key;
              return (
                <button key={e.key} onClick={() => set('vehicle.engineType')(e.key)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl transition"
                  style={{
                    background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `2px solid ${isActive ? C.neon : C.border}`,
                    color: isActive ? C.neon : C.text,
                  }}>
                  <span className="text-xl mb-1">{e.icon}</span>
                  <span className="text-[10px] font-semibold whitespace-nowrap">{e.label}</span>
                </button>
              );
            })}
          </div>
          <Field label="Özel Motor Tipi (opsiyonel)" value={v.customEngineType} onChange={set('vehicle.customEngineType')} />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Aks Sayısı" icon="⚙️">
            <CountSelector values={[1, 2, 3, 4, 5]} value={v.axles} onChange={set('vehicle.axles')} />
          </Card>
          <Card title="Tahrikli Aks" icon="🔧">
            <CountSelector values={[0, 1, 2, 3, 4, 5]} value={v.poweredAxles} onChange={set('vehicle.poweredAxles')} />
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Kapı Sayısı" icon="🚪">
            <CountSelector values={[0, 1, 2, 3, 4, 5, 6]} value={v.doors} onChange={set('vehicle.doors')} />
          </Card>
          <Card title="Koltuk Sayısı" icon="💺">
            <CountSelector values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} value={v.seats} onChange={set('vehicle.seats')} />
          </Card>
        </div>

        <Card title="Önceki Sahip" icon="👥">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => {
              const isActive = v.previousOwners === n;
              return (
                <button key={n} onClick={() => set('vehicle.previousOwners')(n)}
                  className="w-12 h-12 rounded-lg text-sm font-semibold transition"
                  style={{
                    background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `2px solid ${isActive ? C.neon : C.border}`,
                    color: isActive ? C.neon : C.text,
                  }}>
                  {n}
                </button>
              );
            })}
            {['multiple', 'unknown'].map((k) => {
              const isActive = v.previousOwners === k;
              return (
                <button key={k} onClick={() => set('vehicle.previousOwners')(k)}
                  className="px-4 h-12 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `2px solid ${isActive ? C.neon : C.border}`,
                    color: isActive ? C.neon : C.text,
                  }}>
                  {k === 'multiple' ? 'Birden fazla' : 'Bilinmiyor'}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AdminReportEditor({ db, initialDraftOverride } = {}) {
  const [step, setStep] = useState('beteiligte');
  // Agent ile gelen draft varsa onu kullan; yoksa boş initialDraft.
  // Deep merge: override'da olmayan alanlar default'tan korunur.
  const [draft, setDraft] = useState(() => {
    if (!initialDraftOverride) return initialDraft;
    return mergeDraft(initialDraft, initialDraftOverride);
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [vehiclePicker, setVehiclePicker] = useState(null); // { vehicles, customer }

  const customers = db?.customers || [];
  const vehicles  = db?.vehicles  || [];

  const set = (path) => (val) => {
    setDraft((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = val;
      return next;
    });
  };

  // Tüm patch'i tek seferde uygula (state batch'lenmesi için).
  const applyAutofill = (customer, vehicle) => {
    const { claimantPatch, vehiclePatch } = buildAutofillPatch(customer, vehicle);
    setDraft((prev) => ({
      ...prev,
      claimant: { ...prev.claimant, ...claimantPatch },
      vehicle:  vehiclePatch ? { ...prev.vehicle, ...vehiclePatch } : prev.vehicle,
    }));
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomerId(customer.id);
    const ownVehicles = vehicles.filter((v) => v.owner_id === customer.id);
    if (ownVehicles.length === 0) {
      setSelectedVehicleId(null);
      applyAutofill(customer, null);
    } else if (ownVehicles.length === 1) {
      setSelectedVehicleId(ownVehicles[0].id);
      applyAutofill(customer, ownVehicles[0]);
    } else {
      // Birden fazla araç → seçim modalı aç
      setSelectedVehicleId(null);
      applyAutofill(customer, null);
      setVehiclePicker({ vehicles: ownVehicles, customer });
    }
  };

  const handleVehiclePick = (vehicle) => {
    const customer = vehiclePicker?.customer || customers.find((c) => c.id === selectedCustomerId);
    if (customer) {
      setSelectedVehicleId(vehicle.id);
      applyAutofill(customer, vehicle);
    }
    setVehiclePicker(null);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setSelectedVehicleId(null);
    setDraft((prev) => ({
      ...prev,
      claimant: { ...initialDraft.claimant },
      vehicle:  { ...initialDraft.vehicle },
    }));
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const selectedVehicle  = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const selectedCustomerVehicles = selectedCustomer
    ? vehicles.filter((v) => v.owner_id === selectedCustomer.id)
    : [];

  const handleSwitchVehicle = () => {
    if (!selectedCustomer) return;
    if (selectedCustomerVehicles.length > 1) {
      setVehiclePicker({ vehicles: selectedCustomerVehicles, customer: selectedCustomer });
    }
  };

  return (
    <div className="space-y-6">
      {/* Süreç çubuğu */}
      <nav className="rounded-2xl p-2 flex items-center gap-1 overflow-x-auto"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {STEPS.map((s, i) => {
          const isActive = step === s.key;
          return (
            <button key={s.key} onClick={() => setStep(s.key)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition"
              style={{
                background: isActive ? C.neon : 'transparent',
                color: isActive ? '#fff' : C.textDim,
              }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                  color: isActive ? '#fff' : C.text,
                }}>
                {i + 1}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      {/* ── Müşteri & Araç Hızlı Seçim Bandı (her sekmede üstte görünür) ── */}
      <CustomerVehicleBanner
        customers={customers}
        vehicles={vehicles}
        selectedCustomer={selectedCustomer}
        selectedVehicle={selectedVehicle}
        ownVehiclesCount={selectedCustomerVehicles.length}
        onSelectCustomer={handleCustomerSelect}
        onClearCustomer={handleClearCustomer}
        onSwitchVehicle={handleSwitchVehicle}
      />

      {step === 'beteiligte' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* SOL — Davacı */}
          <div className="space-y-5">
            <Card title="Davacı" icon="👤">
              <Field label="Şirket" value={draft.claimant.company} onChange={set('claimant.company')} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Selamlama" value={draft.claimant.salutation} onChange={set('claimant.salutation')} placeholder="Bay/Bayan" />
                <Field label="İlk Adı" value={draft.claimant.firstName} onChange={set('claimant.firstName')} />
                <Field label="Soy İsim" value={draft.claimant.lastName} onChange={set('claimant.lastName')} />
              </div>
              <Field label="Sokak ve Ev No / Posta Kutusu" value={draft.claimant.street} onChange={set('claimant.street')} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Posta Kodu" value={draft.claimant.zip} onChange={set('claimant.zip')} />
                <div className="col-span-2">
                  <Field label="Şehir" value={draft.claimant.city} onChange={set('claimant.city')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Telefon" value={draft.claimant.phone} onChange={set('claimant.phone')} type="tel" />
                <Field label="E-posta" value={draft.claimant.email} onChange={set('claimant.email')} type="email" />
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>
                  Plaka
                </span>
                <PlateInput value={draft.claimant.plate} onChange={set('claimant.plate')} />
              </div>

              <div className="pt-2 space-y-2">
                <Checkbox label="Giriş vergisi indirimine uygundur" checked={draft.claimant.canDeductTax} onChange={set('claimant.canDeductTax')} />
                <Checkbox label="Araç sahibi" checked={draft.claimant.isOwner} onChange={set('claimant.isOwner')} />
                <Checkbox label="Bir avukat tarafından temsil ediliyor" checked={draft.claimant.representedByLawyer} onChange={set('claimant.representedByLawyer')} />
              </div>
            </Card>

            <Card title="Uzman Görüşünün Özellikleri" icon="📝">
              <Field label="Rapor Tipi" value={draft.report.type} onChange={set('report.type')} readOnly />
              <Field label="Uzman" value={draft.report.assessor} onChange={set('report.assessor')} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Dosya No" value={draft.report.fileNumber} onChange={set('report.fileNumber')} placeholder="GA-HS-..." />
                <Field label="Tamamlanma" value={draft.report.completionDate} onChange={set('report.completionDate')} type="date" />
              </div>
              <Field label="Sipariş Verildi" value={draft.report.orderingMethod} onChange={set('report.orderingMethod')} placeholder="kişisel / e-posta / telefon" />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Sipariş Tarihi" value={draft.report.orderDate} onChange={set('report.orderDate')} type="date" />
                <Field label="Saat" value={draft.report.orderTime} onChange={set('report.orderTime')} type="time" />
              </div>
              <Field label="Aracı" value={draft.report.intermediary} onChange={set('report.intermediary')} />
            </Card>
          </div>

          {/* ORTA — Kaza + Ziyaretler */}
          <div className="space-y-5">
            <Card title="Kaza Verileri" icon="💥">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Kaza Günü" value={draft.accident.date} onChange={set('accident.date')} type="date" />
                <Field label="Saat" value={draft.accident.time} onChange={set('accident.time')} type="time" />
              </div>
              <Field label="Kaza Yeri" value={draft.accident.location} onChange={set('accident.location')} />
              <Checkbox label="Polis kaydı var" checked={draft.accident.policeRecorded} onChange={set('accident.policeRecorded')} />
            </Card>

            <Card title="Ziyaretler" icon="📍" action={
              <button className="text-xs font-semibold px-3 py-1.5 rounded-md transition"
                style={{ background: 'rgba(0,0,0,0.05)', color: C.text, border: `1px solid ${C.border}` }}>
                + Yeni Görüntüleme
              </button>
            }>
              <Field label="Görüntüleme Yeri" value={draft.visit.place} onChange={set('visit.place')} />
              <Field label="Sokak ve Ev No" value={draft.visit.street} onChange={set('visit.street')} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Posta Kodu" value={draft.visit.zip} onChange={set('visit.zip')} />
                <div className="col-span-2">
                  <Field label="Şehir" value={draft.visit.city} onChange={set('visit.city')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Tarih" value={draft.visit.date} onChange={set('visit.date')} type="date" />
                <Field label="Saat" value={draft.visit.time} onChange={set('visit.time')} type="time" />
              </div>
              <Field label="Uzman" value={draft.visit.assessor} onChange={set('visit.assessor')} />
              <Field label="Araç Durumu" value={draft.visit.carCondition} onChange={set('visit.carCondition')} placeholder="Kaza sonrası, demonte, vb." />
              <Checkbox label="Kaza sonrası durum" checked={draft.visit.isAfterAccident} onChange={set('visit.isAfterAccident')} />
              <Field label="Koşullar" value={draft.visit.conditions} onChange={set('visit.conditions')} placeholder="ışık / hava / zemin" />

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: C.textDim }}>
                  Notlar
                </span>
                <textarea
                  value={draft.visit.notes}
                  onChange={(e) => set('visit.notes')(e.target.value)}
                  rows={3}
                  className="px-3 py-2 rounded-lg text-sm outline-none resize-y"
                  style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}
                />
              </label>

              <div className="pt-2">
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>
                  Hazır bulunanlar
                </span>
                <div className="space-y-2">
                  <Checkbox label={`Uzman ${draft.visit.assessor || '-'}`} checked={draft.visit.presentAssessor} onChange={set('visit.presentAssessor')} />
                  <Checkbox label={`Davacı ${draft.claimant.lastName || draft.claimant.firstName || '-'}`} checked={draft.visit.presentClaimant} onChange={set('visit.presentClaimant')} />
                </div>
              </div>
            </Card>
          </div>

          {/* SAĞ — Karşı taraf + Sigorta + İmzalar */}
          <div className="space-y-5">
            <Card title="Kazada Rakip" icon="🚗">
              <Field label="Şirket" value={draft.opponent.company} onChange={set('opponent.company')} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Selamlama" value={draft.opponent.salutation} onChange={set('opponent.salutation')} />
                <Field label="İlk Adı" value={draft.opponent.firstName} onChange={set('opponent.firstName')} />
                <Field label="Soy İsim" value={draft.opponent.lastName} onChange={set('opponent.lastName')} />
              </div>
              <Field label="Sokak ve Ev No" value={draft.opponent.street} onChange={set('opponent.street')} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Posta Kodu" value={draft.opponent.zip} onChange={set('opponent.zip')} />
                <div className="col-span-2">
                  <Field label="Şehir" value={draft.opponent.city} onChange={set('opponent.city')} />
                </div>
              </div>
              <Field label="Telefon" value={draft.opponent.phone} onChange={set('opponent.phone')} type="tel" />

              <div className="pt-2">
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>
                  Plaka
                </span>
                <PlateInput value={draft.opponent.plate} onChange={set('opponent.plate')} />
              </div>

              <Checkbox label="Araç sahibi" checked={draft.opponent.isOwner} onChange={set('opponent.isOwner')} />
            </Card>

            <Card title="Sigorta" icon="🛡️">
              <Field label="Sigorta Şirketi" value={draft.insurance.company} onChange={set('insurance.company')} />
              <Field label="Sokak ve Ev No" value={draft.insurance.street} onChange={set('insurance.street')} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Posta Kodu" value={draft.insurance.zip} onChange={set('insurance.zip')} />
                <div className="col-span-2">
                  <Field label="Şehir" value={draft.insurance.city} onChange={set('insurance.city')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Telefon" value={draft.insurance.phone} onChange={set('insurance.phone')} type="tel" />
                <Field label="E-posta" value={draft.insurance.email} onChange={set('insurance.email')} type="email" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Sigorta Numarası" value={draft.insurance.insuranceNumber} onChange={set('insurance.insuranceNumber')} />
                <Field label="Talep Numarası" value={draft.insurance.claimNumber} onChange={set('insurance.claimNumber')} />
              </div>
            </Card>

            <Card title="İmzalar" icon="✍️">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { key: 'order',           label: 'Emir',          icon: '📜' },
                  { key: 'cancel',          label: 'İptal',         icon: '↩️' },
                  { key: 'dataProtection',  label: 'Veri Koruma',   icon: '🔐' },
                ].map((d) => {
                  const active = draft.signatures[d.key];
                  return (
                    <button key={d.key} onClick={() => set(`signatures.${d.key}`)(!active)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl transition"
                      style={{
                        background: active ? `${C.neon}10` : 'rgba(0,0,0,0.04)',
                        border: `2px solid ${active ? C.neon : C.border}`,
                        color: active ? C.neon : C.text,
                      }}>
                      <span className="text-xl mb-1">{d.icon}</span>
                      <span className="text-[11px] font-semibold">{d.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                disabled
                className="w-full py-2.5 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed"
                style={{ background: C.neon, color: '#fff' }}>
                İmza al (yakında)
              </button>
            </Card>
          </div>
        </div>
      )}

      {step === 'fahrzeug' && <FahrzeugPanel draft={draft} set={set} />}
      {step === 'zustand' && <ZustandPanel draft={draft} set={set} />}
      {step === 'fotos' && <FotosPanel selectedCustomer={selectedCustomer} selectedVehicle={selectedVehicle} customerVehicles={selectedCustomerVehicles} />}
      {step === 'kalkulation' && <KalkulationPanel draft={draft} set={set} />}
      {step === 'rechnung' && <RechnungPanel draft={draft} set={set} />}
      {step === 'druck' && <DruckVersandPanel draft={draft} set={set} />}

      {step !== 'beteiligte' && step !== 'fahrzeug' && step !== 'zustand' && step !== 'fotos' && step !== 'kalkulation' && step !== 'rechnung' && step !== 'druck' && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: C.surface, border: `1px dashed ${C.border}`, color: C.textDim }}>
          <div className="text-3xl mb-3">🚧</div>
          <p className="text-sm">
            <strong style={{ color: C.text }}>{STEPS.find((s) => s.key === step)?.label}</strong>{' '}
            adımı henüz iskelet halinde — sıradaki sürümde eklenecek.
          </p>
        </div>
      )}

      {vehiclePicker && (
        <VehiclePickerModal
          customer={vehiclePicker.customer}
          vehicles={vehiclePicker.vehicles}
          onPick={handleVehiclePick}
          onClose={() => setVehiclePicker(null)}
        />
      )}
    </div>
  );
}

// ─── Sayfa üstü banner: müşteri & araç hızlı seçim ──────────────────────────
function CustomerVehicleBanner({
  customers, vehicles, selectedCustomer, selectedVehicle, ownVehiclesCount,
  onSelectCustomer, onClearCustomer, onSwitchVehicle,
}) {
  // Seçim yoksa: arama kutulu boş durum
  if (!selectedCustomer) {
    return (
      <div className="rounded-2xl p-4"
        style={{ background: `${C.neon}06`, border: `1px dashed ${C.neon}55` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: '#fff', border: `1px solid ${C.border}` }}>
            👤
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold" style={{ color: C.text }}>
              Müşteri Seç → Form Otomatik Dolsun
            </div>
            <div className="text-[11px]" style={{ color: C.textDim }}>
              Mevcut müşteriden başla; davacı bilgileri ve araç verileri tek tıkla yerleşir.
            </div>
          </div>
        </div>
        <CustomerSearchInput
          customers={customers} vehicles={vehicles}
          onSelect={onSelectCustomer}
        />
      </div>
    );
  }

  // Seçim varsa: müşteri + araç özet kartı
  const subtitle = [];
  if (selectedCustomer.email) subtitle.push(selectedCustomer.email);
  if (selectedCustomer.phone) subtitle.push(selectedCustomer.phone);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: `1px solid ${C.neon}33` }}>
      {/* Üst şerit: kırmızı dolgu */}
      <div style={{ height: 3, background: C.neon }} />
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderTop: `1px solid ${C.border}` }}>
        {/* Müşteri kutusu */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: C.neon, color: '#fff' }}>
            {(selectedCustomer.full_name || selectedCustomer.company || '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold truncate" style={{ color: C.text }}>
                {selectedCustomer.full_name || selectedCustomer.company}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{
                  background: selectedCustomer.type === 'kurumsal' ? `${C.neon}15` : 'rgba(0,0,0,0.06)',
                  color: selectedCustomer.type === 'kurumsal' ? C.neon : C.textDim,
                }}>
                {selectedCustomer.type === 'kurumsal' ? 'Kurumsal' : 'Bireysel'}
              </span>
            </div>
            {selectedCustomer.company && selectedCustomer.full_name && (
              <div className="text-[11px]" style={{ color: C.textDim }}>{selectedCustomer.company}</div>
            )}
            <div className="text-[11px] truncate" style={{ color: C.textDim }}>
              {subtitle.join(' · ') || '—'}
            </div>
          </div>
          <button onClick={onClearCustomer} type="button"
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md transition"
            style={{ background: 'rgba(0,0,0,0.04)', color: C.textDim }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}>
            Temizle
          </button>
        </div>

        {/* Araç kutusu */}
        <div className="flex items-center gap-3 p-4"
          style={{ background: '#FAFAF8', borderLeft: `1px solid ${C.border}` }}>
          {selectedVehicle ? (
            <>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: '#fff', border: `1px solid ${C.border}` }}>
                🚗
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-bold" style={{ color: C.text }}>
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </span>
                  {selectedVehicle.year && (
                    <span className="text-[11px]" style={{ color: C.textDim }}>· {selectedVehicle.year}</span>
                  )}
                  <span style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontWeight: 700, fontSize: 11, color: C.text,
                    background: '#fff', padding: '2px 8px', borderRadius: 4,
                    border: `1px solid ${C.border}`,
                  }}>
                    {selectedVehicle.plate || '—'}
                  </span>
                </div>
                {/* ŞASE / VIN — tam halde, mono font */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-bold tracking-wider uppercase"
                    style={{ color: C.textDim }}>Şase</span>
                  <code style={{
                    fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    color: C.text, background: '#fff', padding: '1px 6px', borderRadius: 4,
                    border: `1px solid ${C.border}`, letterSpacing: '0.02em', wordBreak: 'break-all',
                  }}>
                    {selectedVehicle.chassis || selectedVehicle.vin || '—'}
                  </code>
                  {(selectedVehicle.chassis || selectedVehicle.vin) && (
                    <button type="button"
                      onClick={() => navigator.clipboard?.writeText(selectedVehicle.chassis || selectedVehicle.vin)}
                      title="Kopyala"
                      className="text-[10px] px-1.5 py-0.5 rounded transition"
                      style={{ color: C.textDim, background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      ⧉
                    </button>
                  )}
                </div>
              </div>
              {ownVehiclesCount > 1 && (
                <button onClick={onSwitchVehicle} type="button"
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md transition"
                  style={{ background: `${C.neon}15`, color: C.neon }}>
                  Değiştir ({ownVehiclesCount})
                </button>
              )}
            </>
          ) : ownVehiclesCount > 1 ? (
            <div className="flex items-center gap-3 w-full">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: '#fff', border: `1px dashed ${C.neon}55` }}>
                ⚠️
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: C.text }}>
                  {ownVehiclesCount} araç bulundu
                </div>
                <div className="text-[11px]" style={{ color: C.textDim }}>
                  Devam etmek için bir araç seç.
                </div>
              </div>
              <button onClick={onSwitchVehicle} type="button"
                className="text-[11px] font-bold px-3 py-1.5 rounded-md"
                style={{ background: C.neon, color: '#fff' }}>
                Araç Seç →
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: '#fff', border: `1px dashed ${C.border}`, color: C.textDim }}>
                🚗
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: C.textDim }}>
                  Bu müşterinin kayıtlı aracı yok
                </div>
                <div className="text-[11px]" style={{ color: C.textDim }}>
                  Araç bilgilerini elle girin.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Müşteri arama kutusu (autocomplete dropdown) ───────────────────────────
function CustomerSearchInput({ customers, vehicles, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 50);
    return customers.filter((c) => {
      const haystack = `${c.full_name || ''} ${c.company || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase();
      return haystack.includes(q);
    }).slice(0, 50);
  }, [customers, query]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Ad, şirket, e-posta veya telefon ile ara…"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition"
          style={{
            background: '#fff',
            border: `1px solid ${open ? C.neon : C.border}`,
            color: C.text,
            paddingLeft: 32,
          }}
        />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)', maxHeight: 320, overflow: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div className="text-xs text-center py-6" style={{ color: C.textDim }}>
              {customers.length === 0 ? 'Henüz müşteri yok' : `"${query}" için sonuç yok`}
            </div>
          ) : (
            filtered.map((c) => {
              const ovCount = vehicles.filter((v) => v.owner_id === c.id).length;
              return (
                <button key={c.id} type="button"
                  onClick={() => { onSelect(c); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{
                      background: c.type === 'kurumsal' ? `${C.neon}15` : 'rgba(0,0,0,0.06)',
                      color: c.type === 'kurumsal' ? C.neon : C.text,
                    }}>
                    {(c.full_name || c.company || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: C.text }}>
                      {c.full_name || c.company}
                      {c.company && c.full_name && (
                        <span className="text-[10px] font-normal ml-1.5" style={{ color: C.textDim }}>
                          · {c.company}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: C.textDim }}>
                      {c.email || c.phone || '—'}
                    </div>
                  </div>
                  {ovCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${C.neon}15`, color: C.neon }}>
                      {ovCount} 🚗
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Birden fazla araç varsa seçim modalı ───────────────────────────────────
function VehiclePickerModal({ customer, vehicles, onPick, onClose }) {
  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(20,20,18,0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold" style={{ color: C.text }}>
                Araç Seçin
              </div>
              <div className="text-xs mt-0.5" style={{ color: C.textDim }}>
                <strong>{customer?.full_name || customer?.company}</strong> için{' '}
                <strong style={{ color: C.neon }}>{vehicles.length}</strong> araç bulundu — birini seçin.
              </div>
            </div>
            <button onClick={onClose} type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xl"
              style={{ color: C.textDim, background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              ×
            </button>
          </div>
        </div>
        <div style={{ padding: 14, maxHeight: 480, overflow: 'auto' }}>
          <div className="space-y-2">
            {vehicles.map((v) => (
              <button key={v.id} type="button" onClick={() => onPick(v)}
                className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition"
                style={{ background: '#FAFAF8', border: `1px solid ${C.border}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${C.neon}08`;
                  e.currentTarget.style.borderColor = `${C.neon}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FAFAF8';
                  e.currentTarget.style.borderColor = C.border;
                }}>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: '#fff', border: `1px solid ${C.border}` }}>
                  🚗
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold" style={{ color: C.text }}>
                      {v.brand} {v.model}
                    </span>
                    {v.year && (
                      <span className="text-[11px]" style={{ color: C.textDim }}>· {v.year}</span>
                    )}
                    <span style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontWeight: 700, fontSize: 11, color: C.text,
                      background: '#fff', padding: '2px 8px', borderRadius: 4,
                      border: `1px solid ${C.border}`,
                    }}>
                      {v.plate || '—'}
                    </span>
                  </div>
                  {(v.chassis || v.vin) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-bold tracking-wider uppercase"
                        style={{ color: C.textDim }}>Şase</span>
                      <code style={{
                        fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        color: C.text, background: '#fff', padding: '1px 6px', borderRadius: 4,
                        border: `1px solid ${C.border}`, letterSpacing: '0.02em',
                        wordBreak: 'break-all',
                      }}>
                        {v.chassis || v.vin}
                      </code>
                    </div>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
