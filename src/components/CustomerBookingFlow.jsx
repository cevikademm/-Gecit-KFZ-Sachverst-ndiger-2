// CustomerBookingFlow.jsx — Müşteri portalı için 4 adımlı randevu alma akışı
// 1. Hizmet seç → 2. Tarih → 3. Saat slot → 4. Onay
// Slot'lar real-time olarak get_available_slots RPC'den çekilir.

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { getSupabaseClient as getSupabase } from '../utils/supabaseAuth.js';
import { GecitKfzModal } from './Modal.jsx';
import {
  CalendarIcon, ClockIcon, Check, ArrowLeft, ArrowRight,
  MapPin, CarIcon, UsersIcon,
} from './icons.jsx';

function toISO(d) { return new Date(d).toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const DOW = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export default function CustomerBookingFlow({ open, onClose, onBook, customer, vehicle, adminId: adminIdProp }) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);
  const [adminId, setAdminId] = useState(adminIdProp || null);

  // adminId verilmemişse — herhangi bir super_admin'in id'sini çek
  useEffect(() => {
    if (adminIdProp || !open) return;
    const sb = getSupabase(); if (!sb) return;
    sb.from('user_profiles')
      .select('id')
      .in('role', ['super_admin', 'admin'])
      .eq('active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data?.id) setAdminId(data.id); });
  }, [open, adminIdProp]);
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotDates, setSlotDates] = useState(new Set()); // Hangi günler boş slot içeriyor
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Hizmetleri yükle (public olanlar)
  useEffect(() => {
    if (!open) return;
    const sb = getSupabase();
    if (!sb || !adminId) return;
    sb.from('appointment_services')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_public', true)
      .order('sort_order')
      .then(({ data }) => setServices(data || []));
  }, [open, adminId]);

  // Açıldığında reset
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setService(null);
    setSelectedDate(null);
    setSlots([]);
    setSlotDates(new Set());
    setSelectedSlot(null);
    setDone(false);
    setForm({
      name: customer?.full_name || customer?.company || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      plate: vehicle?.plate || '',
      notes: '',
    });
  }, [open, customer, vehicle]);

  // Ay değişince → o aydaki tüm günler için slot var mı tara (göstermek için noktalar)
  useEffect(() => {
    if (!open || step < 2 || !service || !adminId) return;
    const sb = getSupabase();
    if (!sb) return;
    const start = new Date(anchorMonth); start.setDate(1);
    const end = new Date(anchorMonth); end.setMonth(end.getMonth() + 1); end.setDate(0);
    sb.rpc('get_available_slots', {
      p_admin_id: adminId,
      p_start_date: toISO(start),
      p_end_date: toISO(end),
      p_duration_min: service.duration_minutes,
    }).then(({ data }) => {
      const dates = new Set((data || []).map(s => s.slot_date));
      setSlotDates(dates);
    });
  }, [open, step, service, anchorMonth, adminId]);

  // Tarih seçilince saat slot'larını çek
  useEffect(() => {
    if (!open || step !== 3 || !selectedDate || !service || !adminId) return;
    const sb = getSupabase();
    if (!sb) return;
    setLoadingSlots(true);
    sb.rpc('get_available_slots', {
      p_admin_id: adminId,
      p_start_date: selectedDate,
      p_end_date: selectedDate,
      p_duration_min: service.duration_minutes,
    }).then(({ data, error }) => {
      if (error) console.warn('[slots]', error.message);
      setSlots(data || []);
      setLoadingSlots(false);
    });
  }, [open, step, selectedDate, service, adminId]);

  // Takvim grid (mevcut ay)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(anchorMonth);
    const lastDay = new Date(anchorMonth); lastDay.setMonth(lastDay.getMonth() + 1); lastDay.setDate(0);
    const dowStart = (firstDay.getDay() + 6) % 7; // Pzt başlangıç (0=Pzt)
    const days = [];
    // Önceki ayın boş günleri
    for (let i = 0; i < dowStart; i++) days.push(null);
    // Bu ayın günleri
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth(), d);
      days.push(dt);
    }
    return days;
  }, [anchorMonth]);

  const submit = async () => {
    if (!service || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    const apt = {
      id: 'apt' + Math.random().toString(36).slice(2, 9),
      customer_id: customer?.id || null,
      date: selectedDate,
      time: selectedSlot.slot_start,
      end_time: selectedSlot.slot_end,
      service: service.label,
      service_id: service.id,
      duration_minutes: service.duration_minutes,
      attendee_name: form.name || null,
      attendee_email: form.email || null,
      attendee_phone: form.phone || null,
      plate: form.plate || null,
      notes: form.notes || null,
      status: 'bekliyor',
      booked_by: customer?.id ? 'customer' : 'public',
      created_at: new Date().toISOString(),
    };
    if (onBook) await onBook(apt);
    setSubmitting(false);
    setDone(true);
  };

  return (
    <GecitKfzModal open={open} onClose={onClose}
      title={done ? '✓ Randevunuz Alındı' : 'Online Termin Al'}
      subtitle={done ? 'Tebrikler — bekleme listesindesiniz' : `Adım ${step} / 4`}
      width={760}>
      {done ? (
        <DoneView appointment={{ service, date: selectedDate, slot: selectedSlot, form }} onClose={onClose} />
      ) : (
        <>
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((n, i) => {
              const active = step === n;
              const done = step > n;
              return (
                <React.Fragment key={n}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: active ? C.neon : done ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.05)',
                        color: active ? '#fff' : done ? '#10B981' : C.textDim,
                        border: `1px solid ${active ? C.neon : done ? '#10B981' : C.border}`,
                      }}>
                      {done ? <Check size={12} /> : n}
                    </div>
                    <span className="text-xs hidden sm:inline" style={{ color: active ? C.text : C.textDim }}>
                      {n === 1 ? 'Hizmet' : n === 2 ? 'Tarih' : n === 3 ? 'Saat' : 'Onay'}
                    </span>
                  </div>
                  {n < 4 && <div className="flex-1 h-px mx-2" style={{ background: done ? '#10B981' : C.border }} />}
                </React.Fragment>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}>
              {/* STEP 1 — Hizmet seçimi */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: C.textDim }}>Almak istediğiniz hizmeti seçin:</p>
                  {services.length === 0 ? (
                    <div className="py-8 text-center text-sm" style={{ color: C.textDim }}>
                      Hizmet bulunamadı.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {services.map(s => {
                        const active = service?.id === s.id;
                        return (
                          <button key={s.id} type="button" onClick={() => setService(s)}
                            className="text-left p-4 rounded-xl transition hover:-translate-y-0.5"
                            style={{
                              background: active ? `${s.color}10` : C.surface,
                              border: `1.5px solid ${active ? s.color : C.border}`,
                              boxShadow: active ? `0 4px 16px ${s.color}33` : 'none',
                            }}>
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ background: `${s.color}15`, border: `1px solid ${s.color}33` }}>
                                {s.icon || '📅'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: C.text }}>{s.label}</p>
                                <p className="text-xs mt-0.5" style={{ color: C.textDim }}>
                                  <ClockIcon size={10} className="inline mr-1" /> {s.duration_minutes} dakika
                                  {s.price_eur != null && ` · ${s.price_eur} €`}
                                </p>
                                {s.description && (
                                  <p className="text-xs mt-2 line-clamp-2" style={{ color: C.textDim }}>{s.description}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 — Tarih seçimi (aylık takvim) */}
              {step === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setAnchorMonth(addDays(anchorMonth, -28))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5"
                      style={{ color: C.text, border: `1px solid ${C.border}` }}>
                      <ArrowLeft size={14} />
                    </button>
                    <p className="text-base font-semibold" style={{ color: C.text }}>
                      {anchorMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </p>
                    <button onClick={() => setAnchorMonth(addDays(anchorMonth, 28))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5"
                      style={{ color: C.text, border: `1px solid ${C.border}` }}>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Pzr'].map(d => (
                      <div key={d} className="text-center text-[10px] uppercase font-semibold py-1"
                        style={{ color: C.textDim }}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((d, i) => {
                      if (!d) return <div key={i}></div>;
                      const iso = toISO(d);
                      const isPast = d < new Date(new Date().toISOString().slice(0, 10));
                      const isToday = iso === toISO(new Date());
                      const isAvailable = slotDates.has(iso);
                      const isSelected = selectedDate === iso;
                      return (
                        <button key={i} type="button"
                          onClick={() => isAvailable && !isPast && setSelectedDate(iso)}
                          disabled={isPast || !isAvailable}
                          className="aspect-square rounded-lg flex flex-col items-center justify-center transition relative"
                          style={{
                            background: isSelected ? C.neon : isAvailable ? 'rgba(16,185,129,0.06)' : 'transparent',
                            border: `1px solid ${isSelected ? C.neon : isAvailable ? 'rgba(16,185,129,0.30)' : 'transparent'}`,
                            color: isSelected ? '#fff' : isPast ? C.textDim : isAvailable ? C.text : C.textDim,
                            cursor: (isPast || !isAvailable) ? 'not-allowed' : 'pointer',
                            opacity: isPast ? 0.3 : 1,
                          }}>
                          <span className="text-sm font-semibold">{d.getDate()}</span>
                          {isToday && !isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: C.neon }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs" style={{ color: C.textDim }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.20)', border: '1px solid rgba(16,185,129,0.30)' }} />
                      Müsait
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ background: 'rgba(0,0,0,0.04)' }} />
                      Dolu / Kapalı
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 3 — Saat slot seçimi */}
              {step === 3 && (
                <div>
                  <p className="text-sm mb-4" style={{ color: C.text }}>
                    <strong>{selectedDate && new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                    {' '}için boş saatler — {service?.duration_minutes} dakika sürer
                  </p>
                  {loadingSlots ? (
                    <div className="py-8 text-center text-sm" style={{ color: C.textDim }}>Yükleniyor…</div>
                  ) : slots.length === 0 ? (
                    <div className="py-8 text-center text-sm" style={{ color: C.textDim }}>
                      Bu gün için boş saat yok. Başka bir gün seçin.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {slots.map(s => {
                        const active = selectedSlot?.slot_start === s.slot_start;
                        return (
                          <button key={s.slot_start} type="button" onClick={() => setSelectedSlot(s)}
                            className="px-4 py-3 rounded-xl text-sm font-mono font-semibold transition"
                            style={{
                              background: active ? C.neon : 'rgba(16,185,129,0.08)',
                              color: active ? '#fff' : '#059669',
                              border: `1.5px solid ${active ? C.neon : 'rgba(16,185,129,0.30)'}`,
                            }}>
                            {s.slot_start}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4 — Onay + form */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl"
                    style={{ background: `${service?.color || '#3B82F6'}10`, border: `1px solid ${service?.color || '#3B82F6'}33` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{service?.icon || '📅'}</span>
                      <div>
                        <p className="text-base font-bold" style={{ color: C.text }}>{service?.label}</p>
                        <p className="text-sm" style={{ color: C.textDim }}>
                          {selectedDate && new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm font-mono mt-1" style={{ color: service?.color || '#3B82F6' }}>
                          {selectedSlot?.slot_start} – {selectedSlot?.slot_end}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Ad Soyad *</span>
                      <input value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Telefon *</span>
                      <input value={form.phone || ''} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} required
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>E-posta</span>
                      <input type="email" value={form.email || ''} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
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
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>Notlarınız (opsiyonel)</span>
                    <textarea value={form.notes || ''} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={3} placeholder="Hasar detayı, soru, özel istek..."
                      className="px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }} />
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between gap-2 mt-6 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <button type="button" onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: C.text, border: `1px solid ${C.border}` }}>
              <ArrowLeft size={14} /> {step > 1 ? 'Geri' : 'İptal'}
            </button>
            {step < 4 && (
              <button type="button" onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !service) || (step === 2 && !selectedDate) || (step === 3 && !selectedSlot)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ background: C.neon, color: '#fff' }}>
                Devam <ArrowRight size={14} />
              </button>
            )}
            {step === 4 && (
              <button type="button" onClick={submit} disabled={submitting || !form.name || !form.phone}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ background: C.neon, color: '#fff', boxShadow: `0 4px 14px ${C.glow}` }}>
                <Check size={14} /> Randevuyu Oluştur
              </button>
            )}
          </div>
        </>
      )}
    </GecitKfzModal>
  );
}

function DoneView({ appointment, onClose }) {
  const { service, date, slot, form } = appointment;
  return (
    <div className="py-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5"
        style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid #10B981' }}>
        <Check size={36} style={{ color: '#10B981' }} />
      </motion.div>
      <h3 className="text-xl font-bold mb-2" style={{ color: C.text }}>Randevunuz oluşturuldu!</h3>
      <p className="text-sm mb-5" style={{ color: C.textDim }}>
        Onaylandığında telefon/e-posta ile bilgilendirileceksiniz.
      </p>
      <div className="inline-block text-left p-5 rounded-xl mb-6"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{service?.icon || '📅'}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: C.text }}>{service?.label}</p>
            <p className="text-xs" style={{ color: C.textDim }}>{service?.duration_minutes} dakika</p>
          </div>
        </div>
        <div className="text-sm space-y-1" style={{ color: C.text }}>
          <p><CalendarIcon size={12} className="inline mr-1.5" style={{ color: C.neon }} />
            {date && new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p><ClockIcon size={12} className="inline mr-1.5" style={{ color: C.neon }} />
            {slot?.slot_start} – {slot?.slot_end}
          </p>
          <p><UsersIcon size={12} className="inline mr-1.5" style={{ color: C.neon }} />
            {form?.name} · {form?.phone}
          </p>
        </div>
      </div>
      <div>
        <button onClick={onClose}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: C.neon, color: '#fff' }}>
          Tamam
        </button>
      </div>
    </div>
  );
}
