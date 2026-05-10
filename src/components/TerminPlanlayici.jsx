// TerminPlanlayici.jsx — Modern admin appointment scheduler
// Sekmeler: Takvim (haftalık/günlük), Çalışma Saatleri, Hizmetler, Google Calendar
// DB: appointments, admin_availability, admin_availability_exception, admin_calendar_settings, appointment_services

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { getSupabaseClient as getSupabase } from '../utils/supabaseAuth.js';
import { GecitKfzModal } from './Modal.jsx';
import {
  CalendarIcon, ClockIcon, PlusIcon, XClose, Check, TrashIcon, EditIcon,
  ArrowLeft, ArrowRight, SettingsIcon, UsersIcon, CarIcon, PhoneIcon,
  MapPin, GlobeIcon, Wrench, Building, ChevronRight,
} from './icons.jsx';

// ─── Yardımcılar ───────────────────────────────────────────────
const DOW_LABELS = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const DOW_LABELS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// Local responsive breakpoint hook'u — App.jsx içindeki ile aynı mantık
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e) => setM(e.matches);
    mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); };
  }, []);
  return m;
}
function useIsTablet() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const h = (e) => setM(e.matches);
    mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); };
  }, []);
  return m;
}

function startOfWeek(d) {
  const x = new Date(d);
  const dow = x.getDay(); // 0=Pzr
  const offset = dow === 0 ? -6 : 1 - dow; // Pzt başlangıç
  x.setDate(x.getDate() + offset);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toISO(d) { return d.toISOString().slice(0, 10); }
function fmtDate(d) { return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }); }
function fmtDateLong(d) { return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' }); }
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}
function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function addMinutesToTime(t, n) {
  return minutesToTime(timeToMinutes(t) + n);
}

const STATUS_COLOR = {
  bekliyor:    { fg: '#F59E0B', bg: 'rgba(245,158,11,0.10)', label: 'Bekliyor'    },
  onaylandi:   { fg: '#3B82F6', bg: 'rgba(59,130,246,0.10)', label: 'Onaylandı'   },
  tamamlandi:  { fg: '#10B981', bg: 'rgba(16,185,129,0.10)', label: 'Tamamlandı'  },
  iptal:       { fg: '#EF4444', bg: 'rgba(239,68,68,0.10)',  label: 'İptal'       },
  no_show:     { fg: '#6B7280', bg: 'rgba(107,114,128,0.10)', label: 'Gelmedi'    },
  aktif:       { fg: '#3B82F6', bg: 'rgba(59,130,246,0.10)', label: 'Aktif'       },
};

// ─── Ana Bileşen ──────────────────────────────────────────────
export default function TerminPlanlayici({ db, setDb, currentUser }) {
  const [tab, setTab] = useState('calendar'); // calendar | availability | services | google
  const [availability, setAvailability] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSlot, setCreateSlot] = useState(null); // takvim'de boş alana tıklayınca pre-fill
  const [editApt, setEditApt] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminId = currentUser?.id || null;

  // Yükle
  const reload = useCallback(async () => {
    if (!adminId) { setLoading(false); return; }
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    setLoading(true);
    try {
      const [avlRes, srvRes, setRes] = await Promise.all([
        sb.from('admin_availability').select('*').eq('admin_id', adminId).order('day_of_week').order('start_time'),
        sb.from('appointment_services').select('*').eq('admin_id', adminId).order('sort_order'),
        sb.from('admin_calendar_settings').select('*').eq('admin_id', adminId).maybeSingle(),
      ]);
      setAvailability(avlRes.data || []);
      setServices(srvRes.data || []);
      setSettings(setRes.data || null);
    } catch (e) {
      console.warn('[TerminPlanlayici] reload failed:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => { reload(); }, [reload]);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const TABS = [
    { k: 'calendar',     l: 'Takvim',     mLabel: 'Takvim',  icon: CalendarIcon },
    { k: 'availability', l: 'Çalışma Saatleri', mLabel: 'Saatler', icon: ClockIcon },
    { k: 'services',     l: 'Hizmetler',  mLabel: 'Hizmet',  icon: Wrench },
    { k: 'google',       l: 'Google Calendar', mLabel: 'GCal', icon: GlobeIcon },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Topbar */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: C.text, letterSpacing: '-0.02em' }}>
            Termin Planlayıcı
          </h1>
          <p className="text-xs md:text-sm mt-1 hidden sm:block" style={{ color: C.textDim }}>
            Randevular, çalışma saatleri, hizmet kataloğu ve Google Calendar senkronizasyonu
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition hover:scale-[1.02] flex-shrink-0"
          style={{ background: C.neon, color: '#fff', boxShadow: `0 6px 18px ${C.glow}` }}>
          <PlusIcon size={14} /> <span className="hidden sm:inline">Yeni Randevu</span><span className="sm:hidden">Yeni</span>
        </button>
      </div>

      {/* Tab strip — mobilde scroll */}
      <div role="tablist" className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto -mx-1 px-1 scrollbar-hide"
        style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: '100%' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.k;
          return (
            <button key={t.k} role="tab" aria-selected={active}
              onClick={() => setTab(t.k)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap flex-shrink-0"
              style={{
                background: active ? C.neon : 'transparent',
                color: active ? '#fff' : C.text,
                boxShadow: active ? `0 4px 12px ${C.glow}` : 'none',
              }}>
              <Icon size={13} /> <span>{isMobile ? t.mLabel : t.l}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center" style={{ color: C.textDim }}>Yükleniyor…</div>
      ) : (
        <>
          {tab === 'calendar' && (
            <CalendarView db={db} setDb={setDb} availability={availability} settings={settings}
              onEditApt={setEditApt}
              onCreateAtSlot={(date, time) => { setCreateSlot({ date, time }); setCreateOpen(true); }} />
          )}
          {tab === 'availability' && (
            <AvailabilityEditor adminId={adminId} availability={availability} onChange={reload} />
          )}
          {tab === 'services' && (
            <ServicesEditor adminId={adminId} services={services} onChange={reload} />
          )}
          {tab === 'google' && (
            <GoogleCalendarPanel settings={settings} onChange={reload} />
          )}
        </>
      )}

      {/* Yeni Randevu modal */}
      <AppointmentCreateModal open={createOpen} onClose={() => { setCreateOpen(false); setCreateSlot(null); }}
        db={db} setDb={setDb} services={services} availability={availability} settings={settings}
        currentUser={currentUser} preset={createSlot} />

      {/* Düzenle modal — edit aynı modal'da prefill */}
      <AppointmentCreateModal open={!!editApt} onClose={() => setEditApt(null)}
        db={db} setDb={setDb} services={services} availability={availability} settings={settings}
        currentUser={currentUser} editApt={editApt} />
    </div>
  );
}

// ─── Calendar View (Haftalık + Günlük) ─────────────────────────
function CalendarView({ db, setDb, availability, settings, onEditApt, onCreateAtSlot }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompact = isMobile || isTablet;  // ≤1023px — week mode kapali
  const [anchor, setAnchor] = useState(new Date());
  // Mobilde/tablette 'day' varsayılan — haftalık 7 sütun dar ekrana sığmaz
  const [mode, setModeState] = useState(isCompact ? 'day' : 'week'); // week | day | list
  const setMode = (m) => setModeState(m);
  useEffect(() => {
    // Compact'a geçerse week → day
    if (isCompact && mode === 'week') setModeState('day');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompact]);

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekDays = useMemo(() => [...Array(7)].map((_, i) => addDays(weekStart, i)), [weekStart]);

  // Takvimdeki tüm randevuları topla (saat aralığı genişletmek için kullanılacak)
  const allApts = useMemo(() => {
    return (db.appointments || []).filter(a => {
      if (!a.date || !a.time) return false;
      const d = new Date(a.date);
      if (mode === 'day') return toISO(d) === toISO(anchor);
      return d >= weekStart && d < addDays(weekStart, 7);
    });
  }, [db.appointments, mode, anchor, weekStart]);

  // Saat aralığı: çalışma saatleri + görünür randevuların saatleri.
  // Mevcut çalışma saatleri DIŞINDA randevu varsa onlar da görünür olsun.
  const [minMin, maxMin] = useMemo(() => {
    let mi = 8 * 60, ma = 19 * 60;
    if (availability.length) {
      mi = Math.min(...availability.map(a => timeToMinutes(a.start_time)));
      ma = Math.max(...availability.map(a => timeToMinutes(a.end_time)));
    }
    // Randevular grid dışına taşıyorsa genişlet
    allApts.forEach(a => {
      const start = timeToMinutes(a.time);
      const end = start + (a.duration_minutes || 30);
      if (start < mi) mi = start;
      if (end > ma) ma = end;
    });
    // 30dk buffer
    mi = Math.max(0, mi - 30);
    ma = Math.min(24 * 60, ma + 30);
    return [Math.floor(mi / 60) * 60, Math.ceil(ma / 60) * 60];
  }, [availability, allApts]);

  const hours = useMemo(() => {
    const arr = [];
    for (let m = minMin; m <= maxMin; m += 60) arr.push(m);
    return arr;
  }, [minMin, maxMin]);

  const slotMin = settings?.slot_duration_minutes || 30;
  const pxPerMin = 1.2; // 1 dakika = 1.2px

  const apts = allApts;

  const goToday = () => setAnchor(new Date());
  const goPrev = () => setAnchor(addDays(anchor, mode === 'day' ? -1 : -7));
  const goNext = () => setAnchor(addDays(anchor, mode === 'day' ? 1 : 7));

  // Compact (≤1023px) — week modu gizli
  const MODE_OPTIONS = isCompact
    ? [{ k: 'day', l: 'Gün' }, { k: 'list', l: 'Liste' }]
    : [{ k: 'week', l: 'Hafta' }, { k: 'day', l: 'Gün' }, { k: 'list', l: 'Liste' }];

  return (
    <div className="space-y-3">
      {/* Toolbar — mobilde 2 satır olabilir */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 sm:p-3 rounded-xl"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <button onClick={goPrev} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-black/5 flex-shrink-0"
            style={{ color: C.text, border: `1px solid ${C.border}` }} aria-label="Önceki">
            <ArrowLeft size={14} />
          </button>
          <button onClick={goToday}
            className="px-2 sm:px-3 h-8 sm:h-9 rounded-lg text-[11px] sm:text-xs font-medium hover:bg-black/5 flex-shrink-0"
            style={{ color: C.neon, background: `${C.neon}10`, border: `1px solid ${C.neon}30` }}>
            Bugün
          </button>
          <button onClick={goNext} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-black/5 flex-shrink-0"
            style={{ color: C.text, border: `1px solid ${C.border}` }} aria-label="Sonraki">
            <ArrowRight size={14} />
          </button>
          <h3 className="ml-2 sm:ml-3 text-sm sm:text-base font-semibold truncate" style={{ color: C.text }}>
            {mode === 'day'
              ? (isMobile
                  ? new Date(anchor).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', weekday: 'short' })
                  : fmtDateLong(anchor))
              : `${fmtDate(weekStart)} – ${fmtDate(addDays(weekStart, 6))}`}
          </h3>
        </div>
        <div className="inline-flex rounded-lg p-0.5 sm:p-1" style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}` }}>
          {MODE_OPTIONS.map(m => {
            const active = mode === m.k;
            return (
              <button key={m.k} onClick={() => setMode(m.k)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition"
                style={{ background: active ? C.text : 'transparent', color: active ? C.surface : C.textDim }}>
                {m.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar grid */}
      {(mode === 'week' || mode === 'day') && (
        <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="grid" style={{
            gridTemplateColumns: mode === 'week' ? '48px repeat(7, 1fr)' : '48px 1fr',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div></div>
            {(mode === 'week' ? weekDays : [anchor]).map((d, i) => {
              const isToday = toISO(d) === toISO(new Date());
              return (
                <div key={i} className="px-3 py-2 text-center"
                  style={{ borderLeft: `1px solid ${C.border}` }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>
                    {DOW_LABELS[d.getDay()]}
                  </p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: isToday ? C.neon : C.text }}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="relative" style={{ height: (maxMin - minMin) * pxPerMin }}>
            <div className="grid h-full" style={{
              gridTemplateColumns: mode === 'week' ? '48px repeat(7, 1fr)' : '48px 1fr',
            }}>
              {/* Saat etiketleri */}
              <div className="relative">
                {hours.map((h, i) => (
                  <div key={i}
                    className="text-[10px] font-mono text-right pr-2"
                    style={{
                      position: 'absolute',
                      top: (h - minMin) * pxPerMin - 6,
                      right: 0, width: '100%', color: C.textDim,
                    }}>
                    {minutesToTime(h)}
                  </div>
                ))}
              </div>
              {/* Gün sütunları */}
              {(mode === 'week' ? weekDays : [anchor]).map((d, di) => {
                const dayApts = apts.filter(a => toISO(new Date(a.date)) === toISO(d));
                const dow = d.getDay();
                const dayAvl = availability.filter(a => a.day_of_week === dow);
                const handleColClick = (e) => {
                  if (!onCreateAtSlot) return;
                  // Tıklanan bir buton/randevu kartıysa bypass
                  if (e.target.closest('button')) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const min = Math.max(0, Math.round(((y / pxPerMin) + minMin) / 15) * 15); // 15dk yuvarla
                  const hh = Math.floor(min / 60), mm = min % 60;
                  const time = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
                  onCreateAtSlot(toISO(d), time);
                };
                return (
                  <div key={di} className="relative cursor-pointer hover:bg-black/[0.015]"
                    onClick={handleColClick}
                    style={{ borderLeft: `1px solid ${C.border}`, background: toISO(d) === toISO(new Date()) ? 'rgba(227,6,19,0.02)' : 'transparent' }}>
                    {/* Saat çizgileri */}
                    {hours.map((h, i) => (
                      <div key={i}
                        style={{
                          position: 'absolute', left: 0, right: 0,
                          top: (h - minMin) * pxPerMin,
                          borderTop: `1px solid ${C.border}`, opacity: 0.4,
                        }} />
                    ))}
                    {/* Çalışma saatleri bantları */}
                    {dayAvl.map((a, i) => (
                      <div key={'avl' + i}
                        style={{
                          position: 'absolute', left: 2, right: 2,
                          top: (timeToMinutes(a.start_time) - minMin) * pxPerMin,
                          height: (timeToMinutes(a.end_time) - timeToMinutes(a.start_time)) * pxPerMin,
                          background: 'rgba(16,185,129,0.04)',
                          borderLeft: '2px solid rgba(16,185,129,0.30)',
                        }} />
                    ))}
                    {/* Randevular */}
                    {dayApts.map((apt) => {
                      const start = timeToMinutes(apt.time);
                      const dur = apt.duration_minutes || 30;
                      const col = STATUS_COLOR[apt.status] || STATUS_COLOR.aktif;
                      return (
                        <button key={apt.id}
                          onClick={() => onEditApt(apt)}
                          className="absolute left-1 right-1 rounded-md px-2 py-1.5 text-left overflow-hidden transition hover:shadow-md"
                          style={{
                            top: (start - minMin) * pxPerMin + 1,
                            height: dur * pxPerMin - 2,
                            background: col.bg,
                            border: `1px solid ${col.fg}55`,
                            borderLeft: `3px solid ${col.fg}`,
                          }}>
                          <p className="text-[11px] font-semibold truncate" style={{ color: col.fg }}>
                            {apt.time} · {apt.service || apt.attendee_name || 'Randevu'}
                          </p>
                          {dur >= 30 && (
                            <p className="text-[10px] truncate" style={{ color: C.textDim }}>
                              {apt.attendee_name || (db.customers || []).find(c => c.id === apt.customer_id)?.full_name || apt.attendee_email || ''}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mode === 'list' && (
        <AppointmentList apts={apts} db={db} setDb={setDb} onEdit={onEditApt} />
      )}
    </div>
  );
}

function AppointmentList({ apts, db, setDb, onEdit }) {
  const sorted = useMemo(() => [...apts].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  }), [apts]);

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl" style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
        <CalendarIcon size={32} style={{ color: C.textDim, margin: '0 auto 8px' }} />
        <p className="text-sm" style={{ color: C.textDim }}>Bu aralıkta randevu yok.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {sorted.map((a, i) => {
        const c = (db.customers || []).find(x => x.id === a.customer_id);
        const col = STATUS_COLOR[a.status] || STATUS_COLOR.aktif;
        return (
          <button key={a.id} onClick={() => onEdit(a)}
            className="w-full text-left px-3 sm:px-4 py-3 hover:bg-black/[0.02] transition flex items-center gap-2 sm:gap-4"
            style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div className="w-10 sm:w-12 text-center flex-shrink-0">
              <p className="text-sm sm:text-base font-bold" style={{ color: C.text }}>{new Date(a.date).getDate()}</p>
              <p className="text-[9px] sm:text-[10px] uppercase" style={{ color: C.textDim }}>{new Date(a.date).toLocaleDateString('tr-TR', { month: 'short' })}</p>
            </div>
            <div className="w-12 sm:w-16 font-mono text-xs sm:text-sm flex-shrink-0" style={{ color: C.textDim }}>{a.time}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate" style={{ color: C.text }}>{a.service || 'Randevu'}</p>
              <p className="text-[11px] sm:text-xs truncate" style={{ color: C.textDim }}>
                {c?.full_name || c?.company || a.attendee_name || a.attendee_email || '—'}
                {a.plate && ` · ${a.plate}`}
              </p>
            </div>
            <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 hidden sm:inline-block"
              style={{ background: col.bg, color: col.fg, border: `1px solid ${col.fg}33` }}>
              {col.label}
            </span>
            <span className="w-2 h-2 rounded-full flex-shrink-0 sm:hidden"
              style={{ background: col.fg }} title={col.label} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Çalışma Saatleri Editör ────────────────────────────────────
function AvailabilityEditor({ adminId, availability, onChange }) {
  const [busy, setBusy] = useState(false);

  const addSlot = async (dow) => {
    if (!adminId) return;
    const sb = getSupabase(); if (!sb) return;
    setBusy(true);
    await sb.from('admin_availability').insert({
      admin_id: adminId, day_of_week: dow,
      start_time: '09:00', end_time: '17:00', is_active: true,
    });
    setBusy(false);
    onChange();
  };
  const updateSlot = async (id, patch) => {
    const sb = getSupabase(); if (!sb) return;
    await sb.from('admin_availability').update(patch).eq('id', id);
    onChange();
  };
  const removeSlot = async (id) => {
    if (!confirm('Bu çalışma saati bloğu silinsin mi?')) return;
    const sb = getSupabase(); if (!sb) return;
    await sb.from('admin_availability').delete().eq('id', id);
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <p className="text-sm" style={{ color: C.text }}>
          Bu saatlerde müşteriler online randevu alabilir. Pazartesi-Cuma 09:00-12:30 ve 13:30-18:00 ile başlatıldı.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 0].map(dow => {
          const daySlots = availability.filter(a => a.day_of_week === dow);
          return (
            <div key={dow} className="rounded-xl p-4"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: C.text }}>{DOW_LABELS_LONG[dow]}</h4>
                <button onClick={() => addSlot(dow)} disabled={busy}
                  className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5"
                  style={{ color: C.neon, background: `${C.neon}10`, border: `1px solid ${C.neon}30` }}
                  title="Zaman bloğu ekle">
                  <PlusIcon size={12} />
                </button>
              </div>
              {daySlots.length === 0 && (
                <p className="text-xs italic" style={{ color: C.textDim }}>Kapalı</p>
              )}
              <div className="space-y-2">
                {daySlots.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <div className="flex-1 grid grid-cols-2 sm:flex sm:items-center gap-1.5 min-w-0">
                      <input type="time" value={s.start_time}
                        onChange={(e) => updateSlot(s.id, { start_time: e.target.value })}
                        className="w-full sm:flex-1 px-2 py-2 rounded-md text-xs font-mono outline-none"
                        style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text, minWidth: 0 }} />
                      <span className="hidden sm:inline" style={{ color: C.textDim }}>→</span>
                      <input type="time" value={s.end_time}
                        onChange={(e) => updateSlot(s.id, { end_time: e.target.value })}
                        className="w-full sm:flex-1 px-2 py-2 rounded-md text-xs font-mono outline-none"
                        style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text, minWidth: 0 }} />
                    </div>
                    <button onClick={() => removeSlot(s.id)}
                      className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-red-500/10 flex-shrink-0"
                      style={{ color: '#EF4444' }} title="Sil">
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hizmetler Editör ────────────────────────────────────────────
function ServicesEditor({ adminId, services, onChange }) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const startNew = () => setEditing({
    slug: '', label: '', description: '', duration_minutes: 30, color: '#3B82F6', icon: '📅', is_public: true,
  });

  const save = async (s) => {
    if (!adminId || !s.label || !s.slug) return;
    const sb = getSupabase(); if (!sb) return;
    setBusy(true);
    const payload = { ...s, admin_id: adminId };
    if (s.id) {
      delete payload.id;
      await sb.from('appointment_services').update(payload).eq('id', s.id);
    } else {
      await sb.from('appointment_services').insert(payload);
    }
    setBusy(false);
    setEditing(null);
    onChange();
  };
  const remove = async (id) => {
    if (!confirm('Hizmet silinsin mi?')) return;
    const sb = getSupabase(); if (!sb) return;
    await sb.from('appointment_services').delete().eq('id', id);
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: C.textDim }}>
          Müşterilerin online seçebileceği hizmetler. Her hizmet için süre + renk.
        </p>
        <button onClick={startNew}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition"
          style={{ background: C.neon, color: '#fff' }}>
          <PlusIcon size={12} /> Yeni Hizmet
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map(s => (
          <div key={s.id} className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${s.color}15`, border: `1px solid ${s.color}33` }}>
              {s.icon || '📅'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: C.text }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: C.textDim }}>
                {s.duration_minutes} dk
                {s.price_eur != null && ` · ${s.price_eur} €`}
                {!s.is_public && ' · Özel'}
              </p>
              {s.description && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: C.textDim }}>{s.description}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setEditing(s)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5"
                style={{ color: '#3B82F6' }} title="Düzenle">
                <EditIcon size={12} />
              </button>
              <button onClick={() => remove(s.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-red-500/10"
                style={{ color: '#EF4444' }} title="Sil">
                <TrashIcon size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && <ServiceEditorModal service={editing} onSave={save} onClose={() => setEditing(null)} busy={busy} />}
    </div>
  );
}

function ServiceEditorModal({ service, onSave, onClose, busy }) {
  const [s, setS] = useState(service);
  useEffect(() => setS(service), [service]);
  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  return (
    <GecitKfzModal open={true} onClose={onClose} title={s.id ? 'Hizmet Düzenle' : 'Yeni Hizmet'} width={520}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Slug</span>
            <input value={s.slug || ''} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              placeholder="ekspertiz_standart"
              className="px-3 py-2 rounded-lg text-sm font-mono outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Süre (dk)</span>
            <input type="number" value={s.duration_minutes || 30} onChange={(e) => set('duration_minutes', parseInt(e.target.value) || 30)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Ad</span>
          <input value={s.label || ''} onChange={(e) => set('label', e.target.value)}
            placeholder="Standart Ekspertiz"
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Açıklama</span>
          <textarea value={s.description || ''} onChange={(e) => set('description', e.target.value)}
            rows={2}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Renk</span>
            <input type="color" value={s.color || '#3B82F6'} onChange={(e) => set('color', e.target.value)}
              className="h-10 rounded-lg cursor-pointer"
              style={{ background: 'transparent', border: `1px solid ${C.border}` }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>İkon (emoji)</span>
            <input value={s.icon || ''} onChange={(e) => set('icon', e.target.value)}
              placeholder="📅"
              className="px-3 py-2 rounded-lg text-lg text-center outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Fiyat (€)</span>
            <input type="number" step="0.01" value={s.price_eur || ''} onChange={(e) => set('price_eur', parseFloat(e.target.value) || null)}
              placeholder="0.00"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!s.is_public} onChange={(e) => set('is_public', e.target.checked)}
            style={{ accentColor: C.neon }} />
          <span className="text-sm" style={{ color: C.text }}>Müşteri portalında görünür (public)</span>
        </label>
        <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: C.text, border: `1px solid ${C.border}` }}>İptal</button>
          <button onClick={() => onSave(s)} disabled={busy || !s.label || !s.slug}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: C.neon, color: '#fff' }}>
            <Check size={14} className="inline mr-1" /> Kaydet
          </button>
        </div>
      </div>
    </GecitKfzModal>
  );
}

// ─── Google Calendar Panel ─────────────────────────────────────
function GoogleCalendarPanel({ settings, onChange }) {
  const connected = settings?.google_sync_enabled && settings?.google_access_token;
  return (
    <div className="rounded-xl p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(66,133,244,0.10)', border: '1px solid rgba(66,133,244,0.30)' }}>
          <GlobeIcon size={24} style={{ color: '#4285F4' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold" style={{ color: C.text }}>Google Calendar</h3>
          <p className="text-sm mt-1" style={{ color: C.textDim }}>
            {connected
              ? `Bağlı · Son sync: ${settings.google_last_sync_at ? new Date(settings.google_last_sync_at).toLocaleString('tr-TR') : '—'}`
              : 'Henüz bağlanmadı. OAuth credentials eklendikten sonra burada bağlanabilirsin.'}
          </p>
          {!connected && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <p className="text-xs" style={{ color: C.text }}>
                <strong>Beklemede:</strong> Google Cloud Console'dan OAuth Client ID/Secret oluşturup proje admin'ine ver.
                Edge Function deploy edildikten sonra bu butonla bağlantı kurulabilir.
              </p>
            </div>
          )}
          <button disabled
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
            style={{ background: '#4285F4', color: '#fff' }}>
            <GlobeIcon size={14} /> Google ile Bağlan (Yakında)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Yeni Randevu / Düzenle Modalı ─────────────────────────────
function AppointmentCreateModal({ open, onClose, db, setDb, services, availability, settings, currentUser, editApt, preset }) {
  const [form, setForm] = useState({});
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editApt) {
      setForm({
        id: editApt.id,
        date: editApt.date, time: editApt.time,
        service: editApt.service || '',
        service_id: editApt.service_id || '',
        duration_minutes: editApt.duration_minutes || 30,
        customer_id: editApt.customer_id || '',
        attendee_name: editApt.attendee_name || '',
        attendee_email: editApt.attendee_email || '',
        attendee_phone: editApt.attendee_phone || '',
        plate: editApt.plate || '',
        location: editApt.location || settings?.default_location || '',
        location_type: editApt.location_type || 'office',
        notes: editApt.notes || '',
        status: editApt.status || 'bekliyor',
      });
    } else {
      const first = services[0];
      setForm({
        date: preset?.date || toISO(new Date()),
        time: preset?.time || '',
        service: first?.label || '',
        service_id: first?.id || '',
        duration_minutes: first?.duration_minutes || 30,
        customer_id: '',
        attendee_name: '', attendee_email: '', attendee_phone: '', plate: '',
        location: settings?.default_location || '',
        location_type: settings?.default_location_type || 'office',
        notes: '', status: 'onaylandi',
      });
    }
  }, [open, editApt, services, settings, preset]);

  // Müşteri seçilince ad/email/phone otomatik doldur
  const onCustomerChange = (customerId) => {
    const c = (db.customers || []).find(x => x.id === customerId);
    setForm(f => ({
      ...f,
      customer_id: customerId,
      attendee_name: c?.full_name || c?.company || f.attendee_name,
      attendee_email: c?.email || f.attendee_email,
      attendee_phone: c?.phone || f.attendee_phone,
    }));
  };

  // Hizmet değişince duration otomatik
  const onServiceChange = (sid) => {
    const s = services.find(x => x.id === sid);
    setForm(f => ({
      ...f,
      service_id: sid,
      service: s?.label || f.service,
      duration_minutes: s?.duration_minutes || f.duration_minutes,
    }));
  };

  // Tarih + hizmet seçilince boş slot'ları getir
  useEffect(() => {
    if (!open || !form.date || !currentUser?.id) return;
    const sb = getSupabase(); if (!sb) return;
    setLoadingSlots(true);
    sb.rpc('get_available_slots', {
      p_admin_id: currentUser.id,
      p_start_date: form.date,
      p_end_date: form.date,
      p_duration_min: form.duration_minutes || 30,
    }).then(({ data, error }) => {
      if (error) console.warn('[slots]', error.message);
      setSlots(data || []);
      setLoadingSlots(false);
    });
  }, [open, form.date, form.duration_minutes, currentUser?.id]);

  const submit = (e) => {
    e?.preventDefault?.();
    const orNull = (v) => (v == null || String(v).trim() === '') ? null : v;
    const apt = {
      id: form.id || ('apt' + Math.random().toString(36).slice(2, 9)),
      customer_id: orNull(form.customer_id),
      date: form.date,
      time: form.time,
      end_time: form.time ? addMinutesToTime(form.time, form.duration_minutes || 30) : null,
      service: orNull(form.service),
      service_id: orNull(form.service_id),
      duration_minutes: form.duration_minutes || 30,
      location: orNull(form.location),
      location_type: form.location_type || 'office',
      attendee_name: orNull(form.attendee_name),
      attendee_email: orNull(form.attendee_email),
      attendee_phone: orNull(form.attendee_phone),
      plate: orNull(form.plate),
      notes: orNull(form.notes),
      status: form.status || 'onaylandi',
      booked_by: 'admin',
      created_at: form.id ? undefined : new Date().toISOString(),
    };
    setDb(prev => {
      const exists = (prev.appointments || []).some(a => a.id === apt.id);
      return {
        ...prev,
        appointments: exists
          ? (prev.appointments || []).map(a => a.id === apt.id ? { ...a, ...apt } : a)
          : [...(prev.appointments || []), apt],
      };
    });
    onClose();
  };

  const remove = () => {
    if (!form.id) return;
    if (!confirm('Bu randevu silinsin mi?')) return;
    setDb(prev => ({ ...prev, appointments: (prev.appointments || []).filter(a => a.id !== form.id) }));
    onClose();
  };

  if (!open) return null;

  return (
    <GecitKfzModal open={open} onClose={onClose}
      title={editApt ? 'Randevu Düzenle' : 'Yeni Randevu'}
      width={680}>
      <form onSubmit={submit} className="space-y-4">
        {/* Hizmet */}
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>Hizmet</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {services.map(s => {
              const active = form.service_id === s.id;
              return (
                <button key={s.id} type="button" onClick={() => onServiceChange(s.id)}
                  className="p-3 rounded-lg text-left transition min-h-[60px]"
                  style={{
                    background: active ? `${s.color}15` : 'rgba(0,0,0,0.03)',
                    border: `1.5px solid ${active ? s.color : C.border}`,
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{s.icon || '📅'}</span>
                    <span className="text-xs font-semibold truncate" style={{ color: active ? s.color : C.text }}>{s.label}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: C.textDim }}>{s.duration_minutes} dk</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tarih + Saat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Tarih</span>
            <input type="date" value={form.date || ''} onChange={(e) => setForm(f => ({ ...f, date: e.target.value, time: '' }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Saat</span>
            <input type="time" value={form.time || ''} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} required
              className="px-3 py-2 rounded-lg text-sm font-mono outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
        </div>

        {/* Boş slot önerileri */}
        {form.date && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>
              Boş Slot Önerileri {loadingSlots && '(yükleniyor…)'}
            </p>
            {slots.length === 0 ? (
              <p className="text-xs italic" style={{ color: C.textDim }}>
                {loadingSlots ? 'Hesaplanıyor…' : 'Bu gün için uygun slot yok (çalışma saatleri dışı veya dolu).'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {slots.slice(0, 24).map(sl => {
                  const active = form.time === sl.slot_start;
                  return (
                    <button key={sl.slot_start} type="button" onClick={() => setForm(f => ({ ...f, time: sl.slot_start }))}
                      className="px-2.5 py-1 rounded-md text-xs font-mono transition"
                      style={{
                        background: active ? C.neon : 'rgba(16,185,129,0.08)',
                        border: `1px solid ${active ? C.neon : 'rgba(16,185,129,0.3)'}`,
                        color: active ? '#fff' : '#059669',
                      }}>
                      {sl.slot_start}
                    </button>
                  );
                })}
                {slots.length > 24 && (
                  <span className="text-xs px-2 py-1" style={{ color: C.textDim }}>+{slots.length - 24}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Müşteri */}
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>Müşteri (kayıtlı)</p>
          <select value={form.customer_id || ''} onChange={(e) => onCustomerChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}>
            <option value="">— Müşteri seçmek için (opsiyonel) —</option>
            {(db.customers || []).slice(0, 200).map(c => (
              <option key={c.id} value={c.id}>{c.full_name || c.company} {c.email && `· ${c.email}`}</option>
            ))}
          </select>
        </div>

        {/* Katılımcı bilgileri (override edilebilir) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Ad Soyad</span>
            <input value={form.attendee_name || ''} onChange={(e) => setForm(f => ({ ...f, attendee_name: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Telefon</span>
            <input value={form.attendee_phone || ''} onChange={(e) => setForm(f => ({ ...f, attendee_phone: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>E-posta</span>
            <input type="email" value={form.attendee_email || ''} onChange={(e) => setForm(f => ({ ...f, attendee_email: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Plaka</span>
            <input value={form.plate || ''} onChange={(e) => setForm(f => ({ ...f, plate: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm font-mono outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
        </div>

        {/* Lokasyon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Lokasyon Türü</span>
            <select value={form.location_type || 'office'} onChange={(e) => setForm(f => ({ ...f, location_type: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}>
              <option value="office">Ofis / Atölye</option>
              <option value="onsite">Saha (müşteri adresi)</option>
              <option value="video">Video görüşme</option>
              <option value="phone">Telefon</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Adres / Detay</span>
            <input value={form.location || ''} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
        </div>

        {/* Notlar + status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Durum</span>
            <select value={form.status || 'onaylandi'} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}>
              <option value="bekliyor">Bekliyor</option>
              <option value="onaylandi">Onaylandı</option>
              <option value="tamamlandi">Tamamlandı</option>
              <option value="iptal">İptal</option>
              <option value="no_show">Gelmedi</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Süre (dk)</span>
            <input type="number" value={form.duration_minutes || 30} onChange={(e) => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 30 }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Not</span>
          <textarea value={form.notes || ''} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
        </label>

        <div className="flex justify-between gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <div>
            {editApt && (
              <button type="button" onClick={remove}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ color: '#EF4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.30)' }}>
                <TrashIcon size={12} className="inline mr-1" /> Sil
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: C.text, border: `1px solid ${C.border}` }}>İptal</button>
            <button type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: C.neon, color: '#fff' }}>
              <Check size={14} className="inline mr-1" /> Kaydet
            </button>
          </div>
        </div>
      </form>
    </GecitKfzModal>
  );
}
