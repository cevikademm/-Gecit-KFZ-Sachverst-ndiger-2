// Rapor Düzenleyici — AutoiXpert "Beteiligte" sayfasının iskeleti.
// Üst kısımda 7 adımlı süreç çubuğu, altta 3 sütunlu form
// (Davacı / Kaza+Ziyaretler / Karşı taraf+Sigorta+İmzalar).

import React, { useState } from 'react';
import { C } from '../utils/tokens.js';

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
  },
  // Lastikler
  tires: {
    dimension: '',
    treadMm: '',
    manufacturer: '',
    season: 'allyear',
    customSeasonType: '',
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
    devaluation: '',          // değer kaybı (Wertminderung)
    replacementValue: '',     // ikame değeri (Wiederbeschaffungswert)
    residualValue: '',        // kalıntı değeri (Restwert)
    repairDuration: '',       // gün
    isTotalLoss: false,
    isEconomicTotalLoss: false,
    notes: '',
    items: [],                // pozisyon listesi
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

function Card({ title, icon, children, action }) {
  return (
    <section className="rounded-2xl p-5 space-y-4"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: C.text }}>
          {icon && <span aria-hidden>{icon}</span>}
          {title}
        </h3>
        {action}
      </header>
      <div className="space-y-3">{children}</div>
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

function ZustandPanel({ draft, set }) {
  const c = draft.condition;
  const d = draft.damages;
  const t = draft.tires;

  const toggleArea = (key) => {
    set('damages.areas')({ ...d.areas, [key]: !d.areas[key] });
  };
  const damageCount = Object.values(d.areas).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* SOL — Zustand */}
      <div className="space-y-5">
        <Card title="Boya & Genel Durum" icon="🎨">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Boya Tipi" value={c.paintType} onChange={set('condition.paintType')} placeholder="Metalik / Düz / Mat" />
            <Field label="Boya Rengi" value={c.paintColor} onChange={set('condition.paintColor')} placeholder="Renk kodu" />
          </div>
          <Field label="Boya Durumu" value={c.paintCondition} onChange={set('condition.paintCondition')} placeholder="Yaşa uygun / hasarlı" />
          <Field label="Genel Durum" value={c.generalCondition} onChange={set('condition.generalCondition')} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Karoseri" value={c.bodyCondition} onChange={set('condition.bodyCondition')} />
            <Field label="İç Mekân" value={c.interiorCondition} onChange={set('condition.interiorCondition')} />
          </div>
          <Field label="Sürüş Yeteneği" value={c.drivability} onChange={set('condition.drivability')} placeholder="Sürülebilir / çekilmeli" />
          <Field label="Acil Onarım Durumu" value={c.emergencyRepairState} onChange={set('condition.emergencyRepairState')} placeholder="yapıldı / tavsiye edilir" />
          <Textarea label="Özellikler" value={c.specialFeatures} onChange={set('condition.specialFeatures')} placeholder="Tuning, folyo, vb." rows={2} />
          <Textarea label="Notlar" value={c.notes} onChange={set('condition.notes')} rows={3} />
        </Card>
      </div>

      {/* ORTA — Hasar haritası + Km/Muayene */}
      <div className="space-y-5">
        <Card title="Hasar Bölgeleri" icon="💥" action={
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-1 rounded-full"
            style={{ background: `${C.neon}15`, color: C.neon, border: `1px solid ${C.neon}33` }}>
            {damageCount} bölge
          </span>
        }>
          <div className="grid grid-cols-3 gap-2">
            {DAMAGE_AREAS.map((area) => {
              const isActive = !!d.areas[area.key];
              return (
                <button key={area.key} onClick={() => toggleArea(area.key)}
                  className="flex items-center justify-center text-center px-2 py-3 rounded-lg text-[11px] font-semibold transition leading-tight"
                  style={{
                    background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `2px solid ${isActive ? C.neon : C.border}`,
                    color: isActive ? C.neon : C.text,
                    minHeight: 56,
                  }}>
                  {area.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-3" style={{ color: C.textDim }}>
            İpucu: araç gövdesi 3 sütun (Sol / Orta / Sağ) ve 6 satır olarak düzenlendi — ön'den arkaya.
          </p>
        </Card>

        <Card title="Kilometre & Muayene" icon="📏">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Okunan KM" value={c.mileageRead} onChange={set('condition.mileageRead')} type="number" />
            <Field label="Tahmini KM" value={c.mileageEstimated} onChange={set('condition.mileageEstimated')} type="number" />
          </div>
          <Field label="Birim" value={c.mileageUnit} onChange={set('condition.mileageUnit')} placeholder="km / mil / saat" />
          <Field label="Sıradaki Muayene" value={c.nextInspection} onChange={set('condition.nextInspection')} placeholder="Ay/Yıl, ör: 03/2027" />

          <div className="pt-2">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>
              Emisyon Grubu
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((g) => {
                const isActive = c.emissionGroup === g;
                return (
                  <button key={g} onClick={() => set('condition.emissionGroup')(g)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
                    style={{
                      background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                      border: `2px solid ${isActive ? C.neon : C.border}`,
                      color: isActive ? C.neon : C.text,
                    }}>
                    Grup {g}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Emisyon Normu" value={c.emissionNorm} onChange={set('condition.emissionNorm')} placeholder="Euro 6" />
        </Card>

        <Card title="Kontroller" icon="✅">
          <Checkbox label="Servis kitabı düzenli (Scheckheft)" checked={c.serviceBookKept} onChange={set('condition.serviceBookKept')} />
          <Checkbox label="Test sürüşü yapıldı" checked={c.testDriveDone} onChange={set('condition.testDriveDone')} />
          <Checkbox label="Hata hafızası okundu" checked={c.errorMemoryRead} onChange={set('condition.errorMemoryRead')} />
          <Checkbox label="Airbag açıldı" checked={c.airbagsDeployed} onChange={set('condition.airbagsDeployed')} />
        </Card>
      </div>

      {/* SAĞ — Lastikler + Eski/Yeni hasar */}
      <div className="space-y-5">
        <Card title="Lastikler" icon="🛞">
          <Field label="Lastik Ölçüsü" value={t.dimension} onChange={set('tires.dimension')} placeholder="195/65 R 15 91 H" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Diş Derinliği (mm)" value={t.treadMm} onChange={set('tires.treadMm')} type="number" />
            <Field label="Üretici" value={t.manufacturer} onChange={set('tires.manufacturer')} placeholder="Continental, Michelin…" />
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase block mb-2" style={{ color: C.textDim }}>
              Mevsim
            </span>
            <div className="grid grid-cols-3 gap-2">
              {TIRE_SEASONS.map((s) => {
                const isActive = t.season === s.key;
                return (
                  <button key={s.key} onClick={() => set('tires.season')(s.key)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl transition"
                    style={{
                      background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                      border: `2px solid ${isActive ? C.neon : C.border}`,
                      color: isActive ? C.neon : C.text,
                    }}>
                    <span className="text-xl mb-1">{s.icon}</span>
                    <span className="text-[11px] font-semibold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Özel Tip (opsiyonel)" value={t.customSeasonType} onChange={set('tires.customSeasonType')} />
        </Card>

        <Card title="Eski & Yeni Hasarlar" icon="📋">
          <Textarea label="Önceden onarılmış hasarlar (Vorschäden)" value={d.previousRepaired} onChange={set('damages.previousRepaired')} rows={3} />
          <Textarea label="Onarılmamış eski hasarlar (Altschäden)" value={d.oldUnrepaired} onChange={set('damages.oldUnrepaired')} rows={3} />
          <Textarea label="Sonradan oluşan hasarlar (Nachschäden)" value={d.subsequentDamage} onChange={set('damages.subsequentDamage')} rows={3} />
        </Card>
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

function KalkulationPanel({ draft, set }) {
  const k = draft.calculation;

  const num = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };
  const fmt = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Otomatik hesap: işçilik + boya + parça + ek = net; net * (1 + vat) = brüt
  const laborTotal = num(k.laborHours) * num(k.laborCostPerHour);
  const partsBase = num(k.sparePartsNet);
  const partsSurcharge = partsBase * (num(k.sparePartsSurcharge) / 100);
  const smallParts = partsBase * (num(k.smallParts) / 100);
  const computedNet = laborTotal + num(k.paintCostNet) + partsBase + partsSurcharge + smallParts;
  const computedGross = computedNet * (1 + num(k.vatRate) / 100);

  const addItem = () => {
    set('calculation.items')([...(k.items || []), { id: Date.now(), name: '', qty: 1, unitPrice: '' }]);
  };
  const updateItem = (id, key, val) => {
    set('calculation.items')((k.items || []).map((it) => it.id === id ? { ...it, [key]: val } : it));
  };
  const removeItem = (id) => {
    set('calculation.items')((k.items || []).filter((it) => it.id !== id));
  };
  const itemsTotal = (k.items || []).reduce((sum, it) => sum + num(it.qty) * num(it.unitPrice), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* SOL — Sağlayıcı + İşçilik/Parça/Boya */}
      <div className="space-y-5">
        <Card title="Hesaplama Sağlayıcısı" icon="🧮">
          <div className="grid grid-cols-2 gap-2">
            {CALC_PROVIDERS.map((p) => {
              const isActive = k.provider === p.key;
              return (
                <button key={p.key} onClick={() => set('calculation.provider')(p.key)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl transition"
                  style={{
                    background: isActive ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `2px solid ${isActive ? C.neon : C.border}`,
                    color: isActive ? C.neon : C.text,
                  }}>
                  <span className="text-2xl mb-1">{p.icon}</span>
                  <span className="text-[12px] font-semibold">{p.label}</span>
                </button>
              );
            })}
          </div>
          {k.provider === 'dat' && (
            <p className="text-xs leading-relaxed pt-2" style={{ color: C.textDim }}>
              DAT hesaplaması için hesap bilgileriniz tanımlı (kullanıcı: <strong style={{ color: C.text }}>geciroha</strong>,
              müşteri no: <strong style={{ color: C.text }}>1346266</strong>). Canlı entegrasyon yakında.
            </p>
          )}
        </Card>

        <Card title="İşçilik" icon="🔧">
          <div className="grid grid-cols-2 gap-2">
            <Field label="İşçilik Saati" value={k.laborHours} onChange={set('calculation.laborHours')} type="number" />
            <Field label="Saat Ücreti (€)" value={k.laborCostPerHour} onChange={set('calculation.laborCostPerHour')} type="number" />
          </div>
          <div className="text-xs flex justify-between pt-1" style={{ color: C.textDim }}>
            <span>İşçilik toplamı</span>
            <strong style={{ color: C.text }}>{fmt(laborTotal)} €</strong>
          </div>
        </Card>

        <Card title="Parça & Boya" icon="🧰">
          <Field label="Parça Net (€)" value={k.sparePartsNet} onChange={set('calculation.sparePartsNet')} type="number" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Parça Marjı (%)" value={k.sparePartsSurcharge} onChange={set('calculation.sparePartsSurcharge')} type="number" />
            <Field label="Küçük Parça (%)" value={k.smallParts} onChange={set('calculation.smallParts')} type="number" />
          </div>
          <Field label="Boya Net (€)" value={k.paintCostNet} onChange={set('calculation.paintCostNet')} type="number" />
        </Card>
      </div>

      {/* ORTA — Pozisyonlar (manuel kalemler) */}
      <div className="space-y-5">
        <Card title="Pozisyonlar (manuel kalem)" icon="📑" action={
          <button onClick={addItem}
            className="text-xs font-semibold px-3 py-1.5 rounded-md transition"
            style={{ background: C.neon, color: '#fff' }}>
            + Ekle
          </button>
        }>
          {(k.items || []).length === 0 && (
            <p className="text-xs" style={{ color: C.textDim }}>
              Henüz pozisyon eklenmedi. Yukarıdaki <strong>+ Ekle</strong> ile parça/iş kalemlerini girebilirsin.
            </p>
          )}
          <div className="space-y-2">
            {(k.items || []).map((it) => {
              const total = num(it.qty) * num(it.unitPrice);
              return (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Field label="Açıklama" value={it.name} onChange={(v) => updateItem(it.id, 'name', v)} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Adet" value={it.qty} onChange={(v) => updateItem(it.id, 'qty', v)} type="number" />
                  </div>
                  <div className="col-span-3">
                    <Field label="Birim € (net)" value={it.unitPrice} onChange={(v) => updateItem(it.id, 'unitPrice', v)} type="number" />
                  </div>
                  <div className="col-span-1 flex items-center justify-end pb-2">
                    <button onClick={() => removeItem(it.id)}
                      className="w-8 h-8 rounded-md text-sm transition"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
                      aria-label="Sil">
                      ✕
                    </button>
                  </div>
                  <div className="col-span-12 flex justify-between text-[11px] -mt-1" style={{ color: C.textDim }}>
                    <span>Satır toplamı</span>
                    <strong style={{ color: C.text }}>{fmt(total)} €</strong>
                  </div>
                </div>
              );
            })}
          </div>
          {(k.items || []).length > 0 && (
            <div className="pt-3 mt-1 flex justify-between text-sm border-t"
              style={{ borderColor: C.border, color: C.text }}>
              <span>Pozisyonlar toplamı</span>
              <strong>{fmt(itemsTotal)} €</strong>
            </div>
          )}
        </Card>
      </div>

      {/* SAĞ — Toplam, Wertminderung, Toplam Hasar */}
      <div className="space-y-5">
        <Card title="KDV & Toplam" icon="💶">
          <Field label="KDV (%)" value={k.vatRate} onChange={set('calculation.vatRate')} type="number" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Onarım Net (€)" value={k.repairCostNet} onChange={set('calculation.repairCostNet')} type="number" placeholder={fmt(computedNet)} />
            <Field label="Onarım Brüt (€)" value={k.repairCostGross} onChange={set('calculation.repairCostGross')} type="number" placeholder={fmt(computedGross)} />
          </div>
          <div className="rounded-lg p-3 mt-1" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
            <div className="flex justify-between text-xs" style={{ color: C.textDim }}>
              <span>Hesaplanan Net</span>
              <strong style={{ color: C.text }}>{fmt(computedNet)} €</strong>
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: C.textDim }}>
              <span>Hesaplanan Brüt</span>
              <strong style={{ color: C.text }}>{fmt(computedGross)} €</strong>
            </div>
          </div>
        </Card>

        <Card title="Değerleme" icon="📊">
          <Field label="İkame Değeri (€)" value={k.replacementValue} onChange={set('calculation.replacementValue')} type="number" placeholder="Wiederbeschaffungswert" />
          <Field label="Kalıntı Değeri (€)" value={k.residualValue} onChange={set('calculation.residualValue')} type="number" placeholder="Restwert" />
          <Field label="Değer Kaybı (€)" value={k.devaluation} onChange={set('calculation.devaluation')} type="number" placeholder="Wertminderung" />
          <Field label="Onarım Süresi (gün)" value={k.repairDuration} onChange={set('calculation.repairDuration')} type="number" />
          <div className="pt-1 space-y-2">
            <Checkbox label="Toplam hasar (Totalschaden)" checked={k.isTotalLoss} onChange={set('calculation.isTotalLoss')} />
            <Checkbox label="Ekonomik toplam hasar" checked={k.isEconomicTotalLoss} onChange={set('calculation.isEconomicTotalLoss')} />
          </div>
        </Card>

        <Card title="Hesaplama Notları" icon="📝">
          <Textarea label="Notlar" value={k.notes} onChange={set('calculation.notes')} rows={4}
            placeholder="Ek açıklamalar, fee tablosu seçimi, sigorta yaklaşımı, vb." />
        </Card>
      </div>
    </div>
  );
}

function FahrzeugPanel({ draft, set }) {
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

export default function AdminReportEditor() {
  const [step, setStep] = useState('beteiligte');
  const [draft, setDraft] = useState(initialDraft);

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
      {step === 'kalkulation' && <KalkulationPanel draft={draft} set={set} />}
      {step === 'rechnung' && <RechnungPanel draft={draft} set={set} />}

      {step !== 'beteiligte' && step !== 'fahrzeug' && step !== 'zustand' && step !== 'kalkulation' && step !== 'rechnung' && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: C.surface, border: `1px dashed ${C.border}`, color: C.textDim }}>
          <div className="text-3xl mb-3">🚧</div>
          <p className="text-sm">
            <strong style={{ color: C.text }}>{STEPS.find((s) => s.key === step)?.label}</strong>{' '}
            adımı henüz iskelet halinde — sıradaki sürümde eklenecek.
          </p>
        </div>
      )}
    </div>
  );
}
