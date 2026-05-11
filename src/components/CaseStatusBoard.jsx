// CaseStatusBoard — Dosya Durum Paneli (ana sayfa).
// 5 KPI tile + filtre çubuğu + tablo. Satıra tıkla → CaseTimeline drawer açılır.
//
// Props:
//   db, setDb            — global durum
//   currentUser          — log için
//   viewMode             — 'admin' | 'lawyer' | 'customer'
//   appraisals (opt)     — override; verilmezse db.appraisals + viewMode'a göre filtre
//   defaultFilter (opt)  — { party?: string, slaOnly?: boolean } — initial filter
//   onSeeFlowEngine (opt)— admin'in "Flow Engine" linki

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { C, PARTY_COLORS, PARTY_LABELS } from '../utils/tokens.js';
import {
  ActivityIcon, AlertTriangle, SearchIcon, ClockIcon, ChevronRight, Zap, FolderCheckIcon,
} from './icons.jsx';
import { getCaseOwnership, getAssignedLawyer } from '../utils/caseOwnership.js';
import CaseTimeline from './CaseTimeline.jsx';

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)} dk`;
  if (h < 48) return `${Math.round(h)} sa`;
  return `${Math.round(h / 24)} gün`;
}

const STAGE_OPTIONS = [
  { v: 'all', label: 'Tümü' },
  { v: 'bekliyor', label: 'Bekliyor' },
  { v: 'mekanik', label: 'Mekanik' },
  { v: 'kaporta', label: 'Kaporta' },
  { v: 'rapor', label: 'Rapor' },
  { v: 'tamamlandi', label: 'Tamamlandı' },
];

export default function CaseStatusBoard({
  db,
  setDb,
  currentUser,
  viewMode = 'admin',
  appraisals: appraisalsProp,
  defaultFilter,
  onSeeFlowEngine,
}) {
  // viewMode'a göre default appraisal kümesi
  const baseAppraisals = useMemo(() => {
    if (appraisalsProp) return appraisalsProp;
    const all = db?.appraisals || [];
    if (viewMode === 'lawyer' && currentUser?.id) {
      // currentUser bir avukatsa → onun atandığı müşterilerin dosyaları
      const myAssignments = (db?.lawyer_assignments || []).filter((x) => x.lawyer_id === currentUser.id);
      const myCustomerIds = new Set(myAssignments.map((x) => x.customer_id));
      const myVehicleIds = new Set(
        (db?.vehicles || []).filter((v) => myCustomerIds.has(v.owner_id)).map((v) => v.id)
      );
      return all.filter((ap) => myVehicleIds.has(ap.vehicle_id));
    }
    if (viewMode === 'customer' && currentUser?.id) {
      const myVehicleIds = new Set((db?.vehicles || []).filter((v) => v.owner_id === currentUser.id).map((v) => v.id));
      return all.filter((ap) => myVehicleIds.has(ap.vehicle_id));
    }
    return all;
  }, [appraisalsProp, db, viewMode, currentUser]);

  // State: filtreler
  const [partyFilter, setPartyFilter] = useState(defaultFilter?.party || 'all');
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [slaOnly, setSlaOnly] = useState(!!defaultFilter?.slaOnly);
  const [activeAppraisalId, setActiveAppraisalId] = useState(null);

  // defaultFilter prop değişirse senkronize et
  useEffect(() => {
    if (defaultFilter?.party) setPartyFilter(defaultFilter.party);
    if (defaultFilter?.slaOnly != null) setSlaOnly(defaultFilter.slaOnly);
  }, [defaultFilter?.party, defaultFilter?.slaOnly]);

  // Hesapla: tüm appraisal'lar için ownership + meta
  const enriched = useMemo(() => {
    return baseAppraisals.map((ap) => {
      const own = getCaseOwnership(ap, db);
      const veh = (db?.vehicles || []).find((v) => v.id === ap.vehicle_id);
      const cust = veh ? (db?.customers || []).find((c) => c.id === veh.owner_id) : null;
      return { appraisal: ap, vehicle: veh, customer: cust, own };
    });
  }, [baseAppraisals, db]);

  // KPI sayıları
  const kpis = useMemo(() => {
    const counts = { admin: 0, customer: 0, insurance: 0, lawyer: 0, sla: 0 };
    enriched.forEach((x) => {
      counts[x.own.currentParty] = (counts[x.own.currentParty] || 0) + 1;
      if (x.own.slaWarning) counts.sla += 1;
    });
    return counts;
  }, [enriched]);

  // Filtre uygula
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ appraisal, vehicle, customer, own }) => {
      if (partyFilter !== 'all' && own.currentParty !== partyFilter) return false;
      if (stageFilter !== 'all' && own.stage !== stageFilter) return false;
      if (slaOnly && !own.slaWarning) return false;
      if (q) {
        const hay = [vehicle?.plate, vehicle?.brand, vehicle?.model, customer?.full_name, customer?.company, customer?.email]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enriched, partyFilter, stageFilter, search, slaOnly]);

  // Sırala — SLA aşanlar önce, sonra en uzun bekleyenler
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.own.slaWarning !== b.own.slaWarning) return a.own.slaWarning ? -1 : 1;
      return (b.own.waitingHours || 0) - (a.own.waitingHours || 0);
    });
  }, [filtered]);

  const activeAppraisal = activeAppraisalId
    ? baseAppraisals.find((ap) => ap.id === activeAppraisalId)
    : null;

  const KPI_TILES = [
    { key: 'admin',     label: PARTY_LABELS.admin,     value: kpis.admin,     color: PARTY_COLORS.admin },
    { key: 'customer',  label: PARTY_LABELS.customer,  value: kpis.customer,  color: PARTY_COLORS.customer },
    { key: 'insurance', label: PARTY_LABELS.insurance, value: kpis.insurance, color: PARTY_COLORS.insurance },
    { key: 'lawyer',    label: PARTY_LABELS.lawyer,    value: kpis.lawyer,    color: PARTY_COLORS.lawyer },
    { key: 'sla',       label: 'SLA Aşımı',            value: kpis.sla,       color: '#DC2626' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: C.text }}>
            <ActivityIcon size={20} style={{ color: C.neon }} /> Dosya Durum Paneli
          </h2>
          <p className="text-sm mt-1" style={{ color: C.textDim }}>
            {viewMode === 'admin'
              ? 'Tüm dosyalar — şu an kimde, hangi adımda, ne kadar bekliyor'
              : viewMode === 'lawyer'
                ? 'Atanmış müşterilerinizin dosya durumu'
                : 'Dosyalarımın anlık durumu'}
          </p>
        </div>
        {viewMode === 'admin' && onSeeFlowEngine && (
          <button onClick={onSeeFlowEngine}
            className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }}>
            <Zap size={12} /> Akış Motoru'na Git
          </button>
        )}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {KPI_TILES.map((k) => {
          const active = k.key === 'sla' ? slaOnly : partyFilter === k.key;
          return (
            <motion.button
              key={k.key}
              whileHover={{ y: -2 }}
              onClick={() => {
                if (k.key === 'sla') {
                  setSlaOnly((v) => !v);
                } else {
                  setPartyFilter(partyFilter === k.key ? 'all' : k.key);
                }
              }}
              className="rounded-2xl p-4 text-left transition"
              style={{
                background: active ? `${k.color}10` : '#FFFFFF',
                border: `1px solid ${active ? `${k.color}55` : C.border}`,
                boxShadow: active ? `0 0 0 3px ${k.color}15` : '0 1px 2px rgba(0,0,0,0.04)',
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: k.color, letterSpacing: '0.1em' }}>
                  {k.label}
                </span>
                {k.key === 'sla' && k.value > 0 && <AlertTriangle size={12} style={{ color: k.color }} />}
              </div>
              <p className="text-3xl font-bold font-mono" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[10px] mt-1" style={{ color: C.textDim }}>
                {active ? '✓ Filtre aktif — temizlemek için tekrar tıkla' : 'Filtrele'}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Filtre çubuğu */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-2xl"
        style={{ background: '#FFFFFF', border: `1px solid ${C.border}` }}>
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.04)' }}>
          <SearchIcon size={14} style={{ color: C.textDim }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plaka, müşteri, marka ara..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: C.text }}
          />
        </div>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(0,0,0,0.04)', color: C.text, border: `1px solid ${C.border}` }}>
          {STAGE_OPTIONS.map((s) => <option key={s.v} value={s.v}>Aşama: {s.label}</option>)}
        </select>
        {(partyFilter !== 'all' || stageFilter !== 'all' || search || slaOnly) && (
          <button onClick={() => { setPartyFilter('all'); setStageFilter('all'); setSearch(''); setSlaOnly(false); }}
            className="text-xs px-3 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.3)' }}>
            Filtreleri Temizle
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: C.textDim }}>
          {sorted.length} / {enriched.length} dosya
        </span>
      </div>

      {/* Tablo */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: `1px solid ${C.border}` }}>
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <FolderCheckIcon size={40} style={{ color: '#16A34A', margin: '0 auto 10px' }} />
            <p className="text-sm font-medium" style={{ color: C.text }}>Eşleşen dosya yok</p>
            <p className="text-xs mt-1" style={{ color: C.textDim }}>Filtreleri temizleyip tekrar dene.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textDim }}>Plaka</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textDim }}>Müşteri</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textDim }}>Aşama</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textDim }}>Şu an kimde</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textDim }}>Sonraki adım</th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textDim }}>Bekleme</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ appraisal, vehicle, customer, own }) => (
                  <tr key={appraisal.id}
                    onClick={() => setActiveAppraisalId(appraisal.id)}
                    className="cursor-pointer transition hover:bg-black/[0.025]"
                    style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-sm" style={{ color: C.text }}>{vehicle?.plate || '—'}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.textDim }}>{vehicle?.brand} {vehicle?.model}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm truncate max-w-[180px]" style={{ color: C.text }}>
                        {customer?.full_name || customer?.company || '—'}
                      </p>
                      {customer?.email && (
                        <p className="text-[10px] truncate max-w-[180px]" style={{ color: C.textDim }}>{customer.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                          <div style={{ width: `${own.stagePct}%`, height: '100%', background: own.partyColor }} />
                        </div>
                        <span className="text-[11px]" style={{ color: C.textDim }}>%{own.stagePct}</span>
                      </div>
                      <p className="text-[10px] mt-1 capitalize" style={{ color: C.textDim }}>{own.stage}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                          style={{
                            background: `${own.partyColor}15`,
                            color: own.partyColor,
                            border: `1px solid ${own.partyColor}40`,
                            letterSpacing: '0.06em',
                          }}>
                          {own.partyLabel}
                        </span>
                        {own.slaWarning && (
                          <AlertTriangle size={11} style={{ color: '#DC2626' }} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] truncate max-w-[220px]" style={{ color: C.text }}>{own.nextAction}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-[11px] flex items-center gap-1 justify-end font-mono"
                        style={{ color: own.slaWarning ? '#DC2626' : C.textDim }}>
                        <ClockIcon size={9} /> {fmtHours(own.waitingHours)}
                      </p>
                      {own.slaThreshold && (
                        <p className="text-[9px] mt-0.5" style={{ color: C.textDim }}>
                          eşik: {fmtHours(own.slaThreshold)}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <ChevronRight size={14} style={{ color: C.textDim }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      <CaseTimeline
        open={!!activeAppraisal}
        appraisal={activeAppraisal}
        db={db}
        viewMode={viewMode}
        onClose={() => setActiveAppraisalId(null)}
      />
    </div>
  );
}
