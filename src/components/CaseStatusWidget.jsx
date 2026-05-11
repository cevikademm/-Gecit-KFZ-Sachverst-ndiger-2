// CaseStatusWidget — cross-panel kompakt dosya durumu kartı.
// UpcomingTuvWidget pattern'inin ikizi.
//
// Props:
//   db          — { appraisals, vehicles, customers, insurance_claims, ... }
//   appraisals  — opsiyonel override (yoksa db.appraisals kullanılır)
//   mode        — 'all' | 'mine' | 'critical'  (varsayılan 'critical')
//   limit       — listede gösterilecek en fazla satır (varsayılan 5)
//   title, subtitle
//   onSeeAll    — "Tümünü Gör" tıklamasında
//   onItemClick — bir satıra tıklanırsa (drawer açmak için)
//   compact     — true ise daha sıkı padding
//
// 'critical' modu: SLA aşımı olan dosyaları öncelikli gösterir.
// 'mine'     modu: pozit edildiği yerde (ör. müşteri/avukat home) zaten filtrelenmiş appraisals geçilir.

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { C, PARTY_COLORS, PARTY_LABELS } from '../utils/tokens.js';
import { ActivityIcon, AlertTriangle, ChevronRight, FolderCheckIcon, ClockIcon } from './icons.jsx';
import { getCaseOwnership } from '../utils/caseOwnership.js';

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)} dk`;
  if (h < 48) return `${Math.round(h)} sa`;
  return `${Math.round(h / 24)} gün`;
}

export default function CaseStatusWidget({
  db,
  appraisals: appraisalsProp,
  mode = 'critical',
  limit = 5,
  title,
  subtitle,
  onSeeAll,
  onItemClick,
  compact = false,
}) {
  const appraisals = appraisalsProp || db?.appraisals || [];
  const vehicles = db?.vehicles || [];
  const customers = db?.customers || [];

  const items = useMemo(() => {
    const list = appraisals.map((ap) => {
      const own = getCaseOwnership(ap, db);
      const veh = vehicles.find((v) => v.id === ap.vehicle_id);
      const cust = veh ? customers.find((c) => c.id === veh.owner_id) : null;
      return { appraisal: ap, vehicle: veh, customer: cust, own };
    });
    if (mode === 'critical') {
      // SLA aşımı + closed olmayanlar — en kötüden iyiye sırala
      return list
        .filter((x) => x.own.slaWarning && x.own.currentParty !== 'closed')
        .sort((a, b) => (b.own.waitingHours || 0) - (a.own.waitingHours || 0));
    }
    // 'all' / 'mine' — closed olmayanlar, parti gruplaması zaten karta yansır
    return list
      .filter((x) => x.own.currentParty !== 'closed')
      .sort((a, b) => (b.own.waitingHours || 0) - (a.own.waitingHours || 0));
  }, [appraisals, db, vehicles, customers, mode]);

  // Parti dağılımı (mini chip'ler için)
  const partyCounts = useMemo(() => {
    const c = { admin: 0, customer: 0, insurance: 0, lawyer: 0, closed: 0 };
    appraisals.forEach((ap) => {
      const own = getCaseOwnership(ap, db);
      c[own.currentParty] = (c[own.currentParty] || 0) + 1;
    });
    return c;
  }, [appraisals, db]);

  const visible = items.slice(0, limit);
  const totalCritical = items.filter((x) => x.own.slaWarning).length;

  const heading = title || (mode === 'critical' ? 'Kritik Dosyalar' : mode === 'mine' ? 'Dosyalarım' : 'Aktif Dosyalar');
  const sub = subtitle || (mode === 'critical'
    ? `${totalCritical} dosya SLA eşiğini aştı`
    : `${appraisals.length} aktif dosya · şu an kimde?`);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl"
      style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div className={`flex items-center justify-between ${compact ? 'p-3' : 'p-5'}`}
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: C.text }}>
            {mode === 'critical'
              ? <AlertTriangle size={14} style={{ color: '#DC2626' }} />
              : <ActivityIcon size={14} style={{ color: C.neon }} />}
            {heading}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: C.textDim }}>{sub}</p>
        </div>
        {onSeeAll && (
          <button onClick={onSeeAll}
            className="text-xs flex items-center gap-1 hover:underline"
            style={{ color: C.neon }}>
            Tümünü Gör <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Parti dağılımı chip'leri */}
      <div className={`${compact ? 'px-3 py-2' : 'px-5 py-3'} flex flex-wrap gap-1.5`} style={{ borderBottom: `1px solid ${C.border}` }}>
        {Object.entries(partyCounts).filter(([k, v]) => v > 0 && k !== 'unknown').map(([party, count]) => (
          <span key={party} className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
            style={{
              background: `${PARTY_COLORS[party]}12`,
              color: PARTY_COLORS[party],
              border: `1px solid ${PARTY_COLORS[party]}40`,
              letterSpacing: '0.06em',
            }}>
            {PARTY_LABELS[party]}: {count}
          </span>
        ))}
        {Object.values(partyCounts).every((v) => !v) && (
          <span className="text-[11px]" style={{ color: C.textDim }}>Aktif dosya yok</span>
        )}
      </div>

      {/* Liste */}
      <div className={compact ? 'p-2' : 'p-3'}>
        {visible.length === 0 ? (
          <div className="text-center py-6">
            <FolderCheckIcon size={28} style={{ color: '#16A34A', margin: '0 auto 8px' }} />
            <p className="text-[12px]" style={{ color: C.textDim }}>
              {mode === 'critical' ? 'Tüm dosyalar zamanında ilerliyor' : 'Aktif dosya yok'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {visible.map(({ appraisal, vehicle, customer, own }) => (
              <button
                key={appraisal.id}
                onClick={() => onItemClick && onItemClick(appraisal)}
                className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-black/[0.025]"
                style={{ background: 'transparent', border: `1px solid ${C.border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${own.partyColor}15`, color: own.partyColor }}>
                  <span className="text-[10px] font-bold">
                    {(vehicle?.plate || '??').slice(-3)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-mono font-semibold truncate" style={{ color: C.text }}>
                      {vehicle?.plate || '—'}
                    </p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                      style={{ background: `${own.partyColor}15`, color: own.partyColor, letterSpacing: '0.05em' }}>
                      {own.partyLabel}
                    </span>
                    {own.slaWarning && (
                      <AlertTriangle size={10} style={{ color: '#DC2626', flexShrink: 0 }} />
                    )}
                  </div>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: C.textDim }}>
                    {customer?.full_name || customer?.company || '—'} · {own.nextAction}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] flex items-center gap-1 justify-end"
                    style={{ color: own.slaWarning ? '#DC2626' : C.textDim }}>
                    <ClockIcon size={9} /> {fmtHours(own.waitingHours)}
                  </p>
                </div>
              </button>
            ))}
            {items.length > limit && onSeeAll && (
              <button onClick={onSeeAll}
                className="w-full text-[11px] py-2 rounded-xl mt-1 hover:underline"
                style={{ color: C.neon, background: 'transparent', border: `1px dashed ${C.border}` }}>
                +{items.length - limit} dosya daha — Tümünü Gör
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
