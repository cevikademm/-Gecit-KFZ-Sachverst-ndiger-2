// Rapor Oluştur — admin panelinde yeni ekspertiz raporu hazırlama akışı.
// Alt sekmeler: "Yeni Rapor" (form/iskelet) ve "AutoiXpert" (mirror).

import React, { useState } from 'react';
import { C } from '../utils/tokens.js';
import { FileText, PlusIcon, Database, CameraIcon, Wrench } from './icons.jsx';
import AdminAutoiXpert from './AdminAutoiXpert.jsx';
import AdminReportEditor from './AdminReportEditor.jsx';

const STEPS = [
  { key: 'customer',  icon: PlusIcon,   title: 'Müşteri & Araç',            desc: 'Mevcut müşteriden seç veya yeni kayıt aç. Plaka, VIN, model bilgilerini doğrula.' },
  { key: 'photos',    icon: CameraIcon, title: 'Fotoğraf & Hasar',          desc: 'Hasar fotoğraflarını yükle, hasarlı bölgeleri etiketle.' },
  { key: 'valuation', icon: Database,   title: 'DAT / Audatex Değerlemesi', desc: 'DAT veya Audatex hesaplamasını çek, parça/iş gücü kalemlerini içeri al.' },
  { key: 'finalize',  icon: Wrench,     title: 'Sonuçlandır',               desc: 'Toplam tutar, KDV ve özet metni gözden geçir, PDF olarak yayımla.' },
];

// AutoiXpert alt sekmesi geçici olarak gizli — yayına alınacağı zaman
// AUTOIXPERT_VISIBLE bayrağını true yap.
const AUTOIXPERT_VISIBLE = false;

const ALL_SUBTABS = [
  { key: 'new',        label: 'Yeni Rapor',       icon: FileText },
  { key: 'editor',     label: 'Rapor Düzenleyici', icon: Wrench },
  { key: 'autoixpert', label: 'AutoiXpert',        icon: Database, hidden: !AUTOIXPERT_VISIBLE },
];
const SUBTABS = ALL_SUBTABS.filter((t) => !t.hidden);

function NewReportPanel() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: C.text, letterSpacing: '-0.02em' }}>
            Yeni Ekspertiz Raporu
          </h2>
          <p className="text-sm" style={{ color: C.textDim }}>
            Aşağıdaki adımları takip edin. Akış geliştirme aşamasında — DAT entegrasyonu yakında bağlanacak.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition opacity-60 cursor-not-allowed"
          style={{ background: C.neon, color: '#fff', boxShadow: `0 8px 24px ${C.glow}` }}
        >
          <PlusIcon size={16} />
          Yeni Rapor (yakında)
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key}
              className="rounded-2xl p-5 flex gap-4 items-start"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: C.textDim }}>
                  Adım {i + 1}
                </div>
                <div className="text-base font-semibold mb-1" style={{ color: C.text }}>
                  {step.title}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: C.textDim }}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(227,6,19,0.04)', border: `1px dashed ${C.neon}55`, color: C.text }}>
        <div className="text-xs font-bold tracking-[0.2em] uppercase mb-1" style={{ color: C.neon }}>
          Geliştirme notu
        </div>
        <p className="text-sm leading-relaxed" style={{ color: C.textDim }}>
          Bu form şu an iskelet halinde. DAT Deutschland erişim bilgileri tanımlandı; sonraki sürümde
          rapor formu ve canlı DAT değerleme entegrasyonu eklenecek.
        </p>
      </div>
    </div>
  );
}

export default function AdminReportCreate(/* { db, setDb, user } */) {
  const [tab, setTab] = useState('new');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${C.neon}15`, border: `1px solid ${C.neon}33`, color: C.neon }}>
          <FileText size={20} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: C.text, letterSpacing: '-0.02em' }}>
          Rapor Oluştur
        </h1>
      </div>

      <div role="tablist"
        className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: C.surface, border: `1px solid ${C.border}`, width: 'fit-content', maxWidth: '100%' }}>
        {SUBTABS.map((s) => {
          const Icon = s.icon;
          const isActive = tab === s.key;
          return (
            <button key={s.key} role="tab" aria-selected={isActive}
              onClick={() => setTab(s.key)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              style={{
                background: isActive ? C.neon : 'transparent',
                color: isActive ? '#fff' : C.text,
                boxShadow: isActive ? `0 4px 14px ${C.glow}` : 'none',
              }}>
              <Icon size={14} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === 'new' && <NewReportPanel />}
        {tab === 'editor' && <AdminReportEditor />}
        {AUTOIXPERT_VISIBLE && tab === 'autoixpert' && <AdminAutoiXpert />}
      </div>
    </div>
  );
}
