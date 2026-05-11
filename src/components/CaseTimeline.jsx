// CaseTimeline — bir dosyanın (appraisal) kronolojik geçmişi.
// Sağdan açılan drawer; activity_logs + insurance claim history + STAGES geçişleri
// + flow_exec olayları birleşik liste olarak gösterir.
// Üst bar: mevcut ownership kartı (parti rozeti + bekleme süresi + sonraki adım).
// Admin için "Manuel devret" butonu (bilgilendirme amaçlı log düşer; kalıcı state DB'de türetilir).

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { XClose, ClockIcon, AlertTriangle, Check, FileText, Zap } from './icons.jsx';
import { getCaseOwnership, getCaseTimeline, getPartyMeta } from '../utils/caseOwnership.js';

function fmtRelative(at) {
  if (!at) return '—';
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  const diffMin = (Date.now() - d.getTime()) / 60000;
  if (diffMin < 1) return 'şimdi';
  if (diffMin < 60) return `${Math.round(diffMin)} dk önce`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)} sa önce`;
  return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)} dk`;
  if (h < 48) return `${Math.round(h)} sa`;
  return `${Math.round(h / 24)} gün`;
}

const KIND_META = {
  stage: { icon: FileText, label: 'Aşama' },
  claim: { icon: AlertTriangle, label: 'Sigorta' },
  offer: { icon: Check, label: 'Teklif' },
  flow:  { icon: Zap, label: 'Akış' },
  log:   { icon: ClockIcon, label: 'Olay' },
};

export default function CaseTimeline({ open, appraisal, db, onClose, viewMode = 'admin' }) {
  const own = useMemo(() => (appraisal ? getCaseOwnership(appraisal, db) : null), [appraisal, db]);
  const events = useMemo(() => (appraisal ? getCaseTimeline(appraisal, db) : []), [appraisal, db]);
  const veh = useMemo(
    () => (appraisal ? (db?.vehicles || []).find((v) => v.id === appraisal.vehicle_id) : null),
    [appraisal, db]
  );
  const customer = useMemo(
    () => (veh ? (db?.customers || []).find((c) => c.id === veh.owner_id) : null),
    [veh, db]
  );

  return (
    <AnimatePresence>
      {open && appraisal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(10,10,12,0.55)' }}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-[81] flex flex-col"
            style={{ width: 'min(560px, 100vw)', background: '#FFFFFF', borderLeft: `1px solid ${C.border}`, boxShadow: '-12px 0 32px rgba(0,0,0,0.12)' }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: C.textDim, letterSpacing: '0.15em' }}>
                  Dosya Geçmişi
                </p>
                <h3 className="text-lg font-bold mt-0.5 truncate" style={{ color: C.text }}>
                  {veh?.plate || '—'} · {veh?.brand || ''} {veh?.model || ''}
                </h3>
                {customer && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: C.textDim }}>
                    {customer.full_name || customer.company || customer.email}
                  </p>
                )}
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.05)', color: C.textDim }} title="Kapat">
                <XClose size={14} />
              </button>
            </div>

            {/* Ownership card */}
            {own && (
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.015)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase"
                    style={{ background: `${own.partyColor}18`, color: own.partyColor, border: `1px solid ${own.partyColor}55`, letterSpacing: '0.08em' }}>
                    {own.partyLabel}
                  </span>
                  {own.slaWarning && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.4)' }}>
                      <AlertTriangle size={10} /> Gecikti
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium" style={{ color: C.text }}>{own.nextAction}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>Aşama</p>
                    <p className="font-semibold mt-0.5" style={{ color: C.text }}>{own.stage} · %{own.stagePct}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>Bekleme</p>
                    <p className="font-semibold mt-0.5" style={{ color: own.slaWarning ? '#DC2626' : C.text }}>
                      {fmtHours(own.waitingHours)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>SLA Eşik</p>
                    <p className="font-semibold mt-0.5" style={{ color: C.text }}>
                      {own.slaThreshold ? fmtHours(own.slaThreshold) : '—'}
                    </p>
                  </div>
                </div>
                {own.assignedLawyer && (
                  <p className="text-[11px] mt-3" style={{ color: C.textDim }}>
                    👤 Avukat: <span style={{ color: C.text }}>{own.assignedLawyer.name || own.assignedLawyer.full_name}</span>
                  </p>
                )}
                {own.assignedInsurer && (
                  <p className="text-[11px] mt-1" style={{ color: C.textDim }}>
                    🛡️ Sigorta: <span style={{ color: C.text }}>{own.assignedInsurer.company || own.assignedInsurer.name}</span>
                  </p>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon size={36} style={{ color: C.textDim, margin: '0 auto 10px' }} />
                  <p className="text-sm" style={{ color: C.textDim }}>Henüz olay kaydı yok.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-px"
                    style={{ background: `linear-gradient(to bottom, ${C.border}, transparent)` }} />
                  <div className="space-y-3">
                    {events.map((ev) => {
                      const meta = KIND_META[ev.kind] || KIND_META.log;
                      const Icon = meta.icon;
                      const partyMeta = getPartyMeta(ev.party);
                      return (
                        <div key={ev.id} className="relative pl-12">
                          <div className="absolute left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: `${partyMeta.color}15`, border: `2px solid ${partyMeta.color}`, top: 4 }}>
                            <Icon size={9} style={{ color: partyMeta.color }} />
                          </div>
                          <div className="rounded-xl p-3"
                            style={{ background: 'rgba(0,0,0,0.025)', border: `1px solid ${C.border}` }}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium" style={{ color: C.text }}>{ev.label}</p>
                                {ev.details && (
                                  <p className="text-[11px] mt-1" style={{ color: C.textDim }}>{ev.details}</p>
                                )}
                              </div>
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: `${partyMeta.color}12`, color: partyMeta.color, fontWeight: 700, letterSpacing: '0.06em' }}>
                                {partyMeta.label}
                              </span>
                            </div>
                            <p className="text-[10px] mt-1.5 font-mono" style={{ color: C.textDim }}>
                              {fmtRelative(ev.at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.02)' }}>
              <p className="text-[11px]" style={{ color: C.textDim }}>
                {events.length} olay · {viewMode === 'admin' ? 'Tüm görünüm' : viewMode === 'lawyer' ? 'Avukat görünümü' : 'Müşteri görünümü'}
              </p>
              <button onClick={onClose}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: C.text, color: '#FFFFFF' }}>
                Kapat
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
