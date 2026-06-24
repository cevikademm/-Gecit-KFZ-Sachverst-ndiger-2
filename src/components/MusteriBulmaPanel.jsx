// ═══════════════════════════════════════════════════════════════
// MusteriBulmaPanel — "Müşteri Bulma" admin sekmesi
// ───────────────────────────────────────────────────────────────
// Apify Google Maps ile işletme bulur, musteri_adaylari'na kaydeder,
// hazır şablonlarla mail + ÇOK DİLLİ WhatsApp ile iletişime geçer,
// durum (Yeni/Arandı/İlgilendi/Müşteri/Olumsuz) takibi yapar.
// Satıra tıklayınca SAĞ PANELDE şirket kartı açılır (Google Maps DEĞİL —
// harita yalnızca kart içindeki "Google Haritalar'da aç" butonuyla açılır).
//
// Bağımlılıklar: musteriBulmaClient (Apify), mailService (sendMail),
//   supabaseAuth (RLS admin), data/mailTemplates (mail şablonları).
//   DB: 12_musteri_bulma.sql + supabase_musteri_iletisim.sql
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { runSearch } from '../utils/musteriBulmaClient.js';
import { sendMail } from '../utils/mailService.js';
import { getSupabaseClient } from '../utils/supabaseAuth.js';
import { templatesFor, fillTemplate } from '../data/mailTemplates.js';
import {
  SearchIcon, Target, MailIcon, DownloadIcon, TrashIcon, StarIcon,
  PhoneIcon, GlobeIcon, Building, PinIcon, Check, XClose, Database, PlusIcon,
} from './icons.jsx';

const C = {
  surface: '#FFFFFF', border: '#E5E5EA', borderSoft: '#F0F0F2',
  text: '#0B0B0F', textDim: '#6B6B73', textMute: '#9494A0',
  brand: '#E11D2E', brandDark: '#B0162A', brandSoft: 'rgba(225,29,46,0.08)', brandBorder: 'rgba(225,29,46,0.25)',
  ok: '#16A34A', okSoft: 'rgba(34,197,94,0.10)',
  warn: '#F59E0B', warnSoft: 'rgba(245,158,11,0.10)',
  err: '#DC2626', errSoft: 'rgba(239,68,68,0.10)',
  blue: '#2563EB', blueSoft: 'rgba(37,99,235,0.08)',
  violet: '#8B5CF6', violetSoft: 'rgba(139,92,246,0.10)',
  wa: '#25D366', waDark: '#128C7E',
};

const STATUS_LABELS = {
  READY: 'Sıraya alındı…', RUNNING: 'Aranıyor…', 'TIMING-OUT': 'Zaman aşımı…',
  SUCCEEDED: 'Tamamlandı', FAILED: 'Başarısız', ABORTED: 'İptal edildi', 'TIMED-OUT': 'Zaman aşımı',
};

// Referans (2MCGastro) ile aynı durum seti
const LEAD_DURUMU = {
  yeni:      { label: 'Yeni',      color: C.blue,   soft: C.blueSoft },
  arandi:    { label: 'Arandı',    color: C.ok,     soft: C.okSoft },
  ilgilendi: { label: 'İlgilendi', color: C.violet, soft: C.violetSoft },
  musteri:   { label: 'Müşteri',   color: C.brandDark, soft: C.brandSoft },
  olumsuz:   { label: 'Olumsuz',   color: C.textMute, soft: '#F0F0F2' },
};
const DURUM_SIRA = ['yeni', 'arandi', 'ilgilendi', 'musteri', 'olumsuz'];

const MAIL_DURUMU_BADGE = {
  gonderildi: { label: 'Gönderildi', icon: '📨', color: C.ok, soft: C.okSoft },
  hata: { label: 'Hata', icon: '⚠', color: C.err, soft: C.errSoft },
  gonderilmedi: { label: '—', icon: '', color: C.textMute, soft: '#F0F0F2' },
};

const FIRMA_SABLONLARI = templatesFor('firma');
const DEFAULT_TEMPLATE = FIRMA_SABLONLARI.find((t) => t.id === 'b2b_collab') || FIRMA_SABLONLARI[0];

// ─── WhatsApp çok dilli hazır mesajlar ───────────────────────────
const WA_LANGS = [
  ['de', 'Deutsch'], ['en', 'English'], ['tr', 'Türkçe'],
  ['nl', 'Nederlands'], ['fr', 'Français'], ['es', 'Español'], ['pt', 'Português'],
];
const WA_MESSAGES = [
  {
    id: 'kisa_selam', label: 'Kısa selam',
    text: {
      de: 'Hallo {{isim}}, wir sind das Gecit KFZ Sachverständigenbüro. Könnten wir kurz über eine mögliche Zusammenarbeit sprechen?',
      en: 'Hello {{isim}}, we are Gecit KFZ Sachverständigenbüro. Could we briefly talk about a possible cooperation?',
      tr: 'Merhaba {{isim}}, biz Gecit KFZ Sachverständigenbüro\'yuz. Olası bir iş birliği için kısaca görüşebilir miyiz?',
      nl: 'Hallo {{isim}}, wij zijn Gecit KFZ Sachverständigenbüro. Kunnen we kort over een mogelijke samenwerking spreken?',
      fr: 'Bonjour {{isim}}, nous sommes Gecit KFZ Sachverständigenbüro. Pourrions-nous parler brièvement d\'une coopération possible ?',
      es: 'Hola {{isim}}, somos Gecit KFZ Sachverständigenbüro. ¿Podríamos hablar brevemente sobre una posible colaboración?',
      pt: 'Olá {{isim}}, somos a Gecit KFZ Sachverständigenbüro. Podemos falar brevemente sobre uma possível cooperação?',
    },
  },
  {
    id: 'isbirligi', label: 'İş birliği',
    text: {
      de: 'Hallo {{isim}}, als unabhängiges Kfz-Sachverständigenbüro unterstützen wir Sie und Ihre Kunden schnell bei Unfall- und Wertgutachten. Interesse an einer Zusammenarbeit?',
      en: 'Hello {{isim}}, as an independent Kfz expert office we quickly support you and your customers with accident and value reports. Interested in a cooperation?',
      tr: 'Merhaba {{isim}}, bağımsız Kfz ekspertiz büromuzla kaza ve değer ekspertizlerinde size ve müşterilerinize hızlı destek veriyoruz. İş birliğine ne dersiniz?',
      nl: 'Hallo {{isim}}, als onafhankelijk Kfz-expertisebureau ondersteunen wij u en uw klanten snel bij schade- en waardetaxaties. Interesse in samenwerking?',
      fr: 'Bonjour {{isim}}, en tant que bureau d\'expertise auto indépendant, nous vous assistons rapidement pour les expertises accident et valeur. Intéressé par une coopération ?',
      es: 'Hola {{isim}}, como oficina pericial de automóviles independiente, le apoyamos rápidamente con peritajes de accidentes y de valor. ¿Le interesa colaborar?',
      pt: 'Olá {{isim}}, como gabinete pericial automóvel independente, apoiamos rapidamente perícias de acidente e de valor. Interesse numa cooperação?',
    },
  },
  {
    id: 'takip', label: 'Takip / Hatırlatma',
    text: {
      de: 'Hallo {{isim}}, kurze Erinnerung zu unserer Anfrage bezüglich einer Zusammenarbeit. Gerne stehen wir für ein kurzes Gespräch zur Verfügung.',
      en: 'Hello {{isim}}, a short reminder about our cooperation request. We are happy to arrange a quick call.',
      tr: 'Merhaba {{isim}}, iş birliği talebimizle ilgili kısa bir hatırlatma. Kısa bir görüşme için memnuniyetle müsaitiz.',
      nl: 'Hallo {{isim}}, een korte herinnering over ons verzoek tot samenwerking. We staan klaar voor een kort gesprek.',
      fr: 'Bonjour {{isim}}, petit rappel concernant notre demande de coopération. Nous sommes disponibles pour un bref échange.',
      es: 'Hola {{isim}}, un breve recordatorio sobre nuestra solicitud de colaboración. Estamos disponibles para una llamada corta.',
      pt: 'Olá {{isim}}, um breve lembrete sobre o nosso pedido de cooperação. Estamos disponíveis para uma conversa rápida.',
    },
  },
];

// Lead alanlarını yer tutuculara eşle
const leadVars = (l) => ({ sirket: l.isim || '', ad: l.isim || '', isim: l.isim || '', email: l.email || '', telefon: l.telefon || '', adres: l.adres || '' });
// Telefon → wa.me numarası (yalnız rakam)
const waDigits = (phone) => String(phone || '').replace(/[^\d]/g, '');

export default function MusteriBulmaPanel({ currentUser }) {
  const [form, setForm] = useState({ ulke: 'Deutschland', sehir: '', kategori: '', limit: 30, language: 'de' });
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const abortRef = useRef(null);

  const [filters, setFilters] = useState({ minPuan: 0, onlyEmail: false, onlyPhone: false, onlyWeb: false });

  const [tab, setTab] = useState('musteriler'); // musteriler | mailgecmisi
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [needsIletisimMigration, setNeedsIletisimMigration] = useState(false);
  const [durumFilter, setDurumFilter] = useState('hepsi');
  const [searchOpen, setSearchOpen] = useState(true);

  const [saving, setSaving] = useState(false);
  const [mailing, setMailing] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [mail, setMail] = useState({ templateId: DEFAULT_TEMPLATE.id, subject: DEFAULT_TEMPLATE.subject, body: DEFAULT_TEMPLATE.body });

  // Sağ panel: { kind:'lead', id } veya { kind:'result', data }
  const [detail, setDetail] = useState(null);

  const showToast = useCallback((type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); }, []);
  const upd = (patch) => setForm((f) => ({ ...f, ...patch }));

  // ─── Arama ───────────────────────────────────────────────────
  const handleSearch = async () => {
    setError('');
    if (!form.kategori.trim()) { setError('Kategori zorunlu (örn. "Autohaus", "Werkstatt").'); return; }
    if (!form.sehir.trim()) { setError('Şehir zorunlu (örn. "Berlin").'); return; }
    setSearching(true); setProgress({ status: 'READY', items: 0 }); setResults([]); setSelected(new Set());
    abortRef.current = new AbortController();
    try {
      const { items } = await runSearch(
        { ulke: form.ulke, sehir: form.sehir, kategori: form.kategori, limit: form.limit, language: form.language },
        { onProgress: (p) => setProgress(p), signal: abortRef.current.signal });
      setResults(items);
      if (items.length) await autoSaveResults(items); // tüm sonuçlar otomatik Supabase'e
      else showToast('warn', 'Sonuç bulunamadı.');
    } catch (e) {
      if (!/iptal/i.test(e.message || '')) setError(e.message || 'Arama başarısız.');
    } finally { setSearching(false); setProgress(null); }
  };
  const handleCancel = () => { abortRef.current?.abort(); };

  const filtered = useMemo(() => results.filter((r) => {
    if (filters.minPuan > 0 && (r.puan == null || r.puan < filters.minPuan)) return false;
    if (filters.onlyEmail && !r.email) return false;
    if (filters.onlyPhone && !r.telefon) return false;
    if (filters.onlyWeb && !r.website) return false;
    return true;
  }), [results, filters]);

  const rowKey = (r, i) => r.placeId || `${r.isim}-${i}`;
  const allSelected = filtered.length > 0 && filtered.every((r, i) => selected.has(rowKey(r, i)));
  const toggleRow = (key) => setSelected((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleAll = () => setSelected((prev) => filtered.every((r, i) => prev.has(rowKey(r, i))) ? new Set() : new Set(filtered.map((r, i) => rowKey(r, i))));
  const selectedRows = useMemo(() => filtered.filter((r, i) => selected.has(rowKey(r, i))), [filtered, selected]);

  // ─── Kayıtlı adaylar ─────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    setLeadsLoading(true);
    const { data, error: e } = await sb.from('musteri_adaylari').select('*').order('created_at', { ascending: false }).limit(500);
    setLeadsLoading(false);
    if (e) { if (/does not exist|relation|schema cache/i.test(e.message || '')) setTableMissing(true); return; }
    setTableMissing(false); setLeads(data || []);
  }, []);
  useEffect(() => { loadLeads(); }, [loadLeads]);

  const rowsToLeadPayload = (rows) => rows.map((r) => ({
    place_id: r.placeId || r.place_id || null, isim: r.isim || '(isimsiz)', kategori: r.kategori || null,
    adres: r.adres || null, sehir: r.sehir || form.sehir || null, ulke: r.ulke || form.ulke || null,
    telefon: r.telefon || null, email: r.email || null, website: r.website || null,
    puan: r.puan ?? null, yorum_sayisi: r.yorum_sayisi ?? null, lat: r.lat ?? null, lng: r.lng ?? null,
    google_maps_url: r.google_maps_url || null, durum: r.durum || 'acik',
    arama_kategori: form.kategori || null, arama_konum: [form.sehir, form.ulke].filter(Boolean).join(', ') || null,
    created_by: currentUser?.id || null,
  }));

  // TÜM arama sonuçlarını otomatik Supabase'e kaydet (upsert by place_id).
  // Mevcut kayıtların lead_durumu/mail_durumu/notlar/geçmiş alanları korunur
  // (payload'da yoklar → ON CONFLICT'te dokunulmaz).
  const autoSaveResults = async (items) => {
    const sb = getSupabaseClient();
    if (!sb) { showToast('warn', `${items.length} işletme bulundu — Supabase bağlantısı yok, kaydedilemedi.`); return; }
    setSaving(true);
    const { error: e } = await sb.from('musteri_adaylari').upsert(rowsToLeadPayload(items), { onConflict: 'place_id', ignoreDuplicates: false });
    setSaving(false);
    if (e) {
      if (/does not exist|relation|schema cache/i.test(e.message || '')) { setTableMissing(true); showToast('err', `${items.length} bulundu ama tablo yok — 12_musteri_bulma.sql çalıştırın.`); }
      else showToast('err', `${items.length} bulundu, kayıt hatası: ${e.message}`);
      return;
    }
    showToast('ok', `${items.length} işletme bulundu ve Supabase'e kaydedildi.`);
    loadLeads();
  };

  const handleSave = async () => {
    if (selectedRows.length === 0) { showToast('warn', 'Önce işletme seçin.'); return; }
    const sb = getSupabaseClient();
    if (!sb) { showToast('err', 'Supabase bağlantısı yok.'); return; }
    setSaving(true);
    const { error: e } = await sb.from('musteri_adaylari').upsert(rowsToLeadPayload(selectedRows), { onConflict: 'place_id', ignoreDuplicates: false });
    setSaving(false);
    if (e) {
      if (/does not exist|relation|schema cache/i.test(e.message || '')) { setTableMissing(true); showToast('err', 'Tablo yok — 12_musteri_bulma.sql çalıştırın.'); }
      else showToast('err', `Kayıt hatası: ${e.message}`);
      return;
    }
    showToast('ok', `${selectedRows.length} aday kaydedildi.`); loadLeads(); setTab('musteriler');
  };

  // Tek bir arama sonucunu kaydet → kayıtlı lead olarak detayda aç
  const saveSingle = async (result) => {
    const sb = getSupabaseClient();
    if (!sb) { showToast('err', 'Supabase bağlantısı yok.'); return null; }
    const { data, error: e } = await sb.from('musteri_adaylari')
      .upsert(rowsToLeadPayload([result]), { onConflict: 'place_id', ignoreDuplicates: false }).select();
    if (e) { showToast('err', `Kayıt hatası: ${e.message}`); return null; }
    const saved = data?.[0];
    if (saved) { setLeads((prev) => [saved, ...prev.filter((l) => l.id !== saved.id)]); showToast('ok', 'Aday kaydedildi.'); }
    loadLeads();
    return saved || null;
  };

  // Patch + opsiyonel geçmiş kaydı
  const updateLead = useCallback(async (id, patch, historyEntry) => {
    const sb = getSupabaseClient();
    if (!sb || !id) return;
    const lead = leads.find((l) => l.id === id);
    const full = { ...patch };
    if (historyEntry) { full.iletisim_gecmisi = [...((lead && lead.iletisim_gecmisi) || []), historyEntry]; full.son_iletisim_at = historyEntry.at; }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...full } : l)));
    const { error: e } = await sb.from('musteri_adaylari').update(full).eq('id', id);
    if (e) {
      if (/column|schema cache|iletisim_gecmisi|arama_durumu|son_iletisim/i.test(e.message || '')) {
        setNeedsIletisimMigration(true); showToast('warn', 'İletişim kolonları yok — supabase_musteri_iletisim.sql çalıştırın.');
      } else showToast('err', `Güncelleme hatası: ${e.message}`);
    }
  }, [leads, showToast]);

  const deleteLead = async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (detail?.id === id) setDetail(null);
    const { error: e } = await sb.from('musteri_adaylari').delete().eq('id', id);
    if (e) showToast('err', `Silme hatası: ${e.message}`);
  };

  // Durum değiştir
  const setDurum = (lead, durum) => {
    const at = new Date().toISOString();
    updateLead(lead.id, { lead_durumu: durum }, { tip: 'durum', durum, ozet: `Durum: ${LEAD_DURUMU[durum]?.label || durum}`, at });
  };

  // Mail gönder (tek lead)
  const sendMailToLead = async (lead, subject, body) => {
    if (!lead.email) { showToast('warn', 'Bu işletmenin e-postası yok.'); return; }
    const at = new Date().toISOString(); const vars = leadVars(lead);
    try {
      await sendMail({ to: lead.email, subject: fillTemplate(subject, vars), message: fillTemplate(body, vars) });
      updateLead(lead.id, { mail_durumu: 'gonderildi', mail_gonderim_at: at, lead_durumu: lead.lead_durumu === 'musteri' ? 'musteri' : 'ilgilendi' },
        { tip: 'mail', durum: 'gonderildi', konu: fillTemplate(subject, vars), ozet: fillTemplate(body, vars).slice(0, 140), at });
      showToast('ok', `Mail gönderildi: ${lead.email}`);
    } catch (e) {
      updateLead(lead.id, { mail_durumu: 'hata' }, { tip: 'mail', durum: 'hata', konu: fillTemplate(subject, vars), ozet: e?.message || 'Gönderim hatası', at });
      showToast('err', `Mail hatası: ${e?.message || ''}`);
    }
  };

  // WhatsApp aç (deep link) + geçmişe yaz
  const openWhatsApp = (lead, text) => {
    const num = waDigits(lead.telefon);
    if (!num) { showToast('warn', 'Telefon numarası yok.'); return; }
    const msg = fillTemplate(text, leadVars(lead));
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    if (lead.id) {
      const at = new Date().toISOString();
      updateLead(lead.id, { lead_durumu: lead.lead_durumu === 'yeni' || !lead.lead_durumu ? 'arandi' : lead.lead_durumu },
        { tip: 'whatsapp', durum: 'acildi', ozet: msg.slice(0, 140), at });
    }
  };

  // Toplu mail
  const mailTargets = useMemo(() => selectedRows.filter((r) => r.email), [selectedRows]);
  const handleSendMails = async () => {
    if (mailTargets.length === 0) { showToast('warn', 'E-postası olan seçili işletme yok.'); return; }
    setMailing(true); const sb = getSupabaseClient(); let ok = 0, fail = 0; const sentIds = [], failIds = [];
    for (const r of mailTargets) {
      const vars = leadVars(r);
      try { await sendMail({ to: r.email, subject: fillTemplate(mail.subject, vars), message: fillTemplate(mail.body, vars) }); ok++; if (r.placeId) sentIds.push(r.placeId); }
      catch (e) { fail++; if (r.placeId) failIds.push(r.placeId); console.error('[MusteriBulma] mail', r.email, e?.message); }
      await new Promise((res) => setTimeout(res, 1200));
    }
    if (sb) {
      try {
        await sb.from('musteri_adaylari').upsert(rowsToLeadPayload(mailTargets), { onConflict: 'place_id' });
        const now = new Date().toISOString();
        if (sentIds.length) await sb.from('musteri_adaylari').update({ mail_durumu: 'gonderildi', mail_gonderim_at: now, son_iletisim_at: now, lead_durumu: 'ilgilendi' }).in('place_id', sentIds);
        if (failIds.length) await sb.from('musteri_adaylari').update({ mail_durumu: 'hata' }).in('place_id', failIds);
      } catch (e) { /* sessiz */ }
    }
    setMailing(false); setMailOpen(false);
    showToast(fail === 0 ? 'ok' : 'warn', `Mail: ${ok} gönderildi${fail ? `, ${fail} hata` : ''}.`); loadLeads();
  };

  const handleCsv = () => {
    if (filtered.length === 0) { showToast('warn', 'İndirilecek sonuç yok.'); return; }
    const cols = ['isim', 'kategori', 'adres', 'telefon', 'email', 'website', 'puan', 'yorum_sayisi', 'durum', 'google_maps_url'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...filtered.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `musteri-adaylari-${form.sehir || 'arama'}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  // ─── Sayaçlar / filtre ───────────────────────────────────────
  const durumCounts = useMemo(() => {
    const c = { hepsi: leads.length, yeni: 0, arandi: 0, ilgilendi: 0, musteri: 0, olumsuz: 0 };
    for (const l of leads) { const d = l.lead_durumu || 'yeni'; if (c[d] != null) c[d]++; }
    return c;
  }, [leads]);
  const visibleLeads = useMemo(() => durumFilter === 'hepsi' ? leads : leads.filter((l) => (l.lead_durumu || 'yeni') === durumFilter), [leads, durumFilter]);

  const mailHistory = useMemo(() => {
    const out = [];
    for (const l of leads) for (const h of (l.iletisim_gecmisi || [])) if (h.tip === 'mail') out.push({ ...h, firma: l.isim, leadId: l.id });
    return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }, [leads]);

  // Aktif detay lead'i (kayıtlı ise güncel state'ten türet)
  const detailLead = useMemo(() => {
    if (!detail) return null;
    if (detail.kind === 'lead') return leads.find((l) => l.id === detail.id) || null;
    return { ...detail.data, isim: detail.data.isim, _transient: true };
  }, [detail, leads]);

  // Sonuçlar otomatik kaydedildiği için: place_id ile kayıtlı lead'i bul, varsa
  // tam kartı aç (durum/not/geçmiş). Henüz görünmüyorsa geçici karta düş.
  const openResult = (r) => {
    const pid = r.placeId || r.place_id;
    const existing = pid && leads.find((l) => l.place_id === pid);
    setDetail(existing ? { kind: 'lead', id: existing.id } : { kind: 'result', data: r });
  };
  const openLead = (l) => setDetail({ kind: 'lead', id: l.id });

  // ─── UI ──────────────────────────────────────────────────────
  return (
    <div style={{ color: C.text }}>
      <header className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`, boxShadow: '0 6px 18px rgba(225,29,46,0.25)' }}><Target size={24} style={{ color: '#fff' }} /></div>
          <div>
            <h1 className="text-xl font-bold" style={{ letterSpacing: -0.3 }}>Müşteri Bulma</h1>
            <p className="text-sm" style={{ color: C.textDim }}>Google Haritalar'dan sektör ve şehre göre potansiyel müşteri bulun, kaydedin, iletişime geçin.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: C.borderSoft }}>
          <TabBtn active={tab === 'musteriler'} onClick={() => setTab('musteriler')}>👥 Müşteriler ({leads.length})</TabBtn>
          <TabBtn active={tab === 'mailgecmisi'} onClick={() => setTab('mailgecmisi')}>✉ Mail Geçmişi ({mailHistory.length})</TabBtn>
        </div>
      </header>

      {toast && (
        <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4"
          style={{ background: toast.type === 'ok' ? C.okSoft : toast.type === 'err' ? C.errSoft : C.warnSoft, color: toast.type === 'ok' ? C.ok : toast.type === 'err' ? C.err : C.warn, border: `1px solid ${toast.type === 'ok' ? C.ok : toast.type === 'err' ? C.err : C.warn}33` }}>
          {toast.type === 'ok' ? <Check size={16} /> : <XClose size={16} />}{toast.msg}
        </div>
      )}
      {needsIletisimMigration && (
        <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warn}33` }}>
          ⚠ İletişim/durum kolonları eksik. <code className="text-xs">supabase_musteri_iletisim.sql</code> dosyasını Supabase SQL Editor'de çalıştırın.
        </div>
      )}

      {tab === 'musteriler' && (
        <div className="space-y-4">
          {/* YENİ ARAMA (katlanır) */}
          <section className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => setSearchOpen((v) => !v)} className="w-full px-5 py-3 flex items-center justify-between" style={{ borderBottom: searchOpen ? `1px solid ${C.borderSoft}` : 'none' }}>
              <span className="flex items-center gap-2 font-semibold text-sm"><SearchIcon size={15} style={{ color: C.brand }} /> YENİ ARAMA</span>
              <span style={{ color: C.textMute }}>{searchOpen ? '▾' : '▸'}</span>
            </button>
            {searchOpen && (
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <Field label="Ülke" className="md:col-span-3"><input value={form.ulke} onChange={(e) => upd({ ulke: e.target.value })} placeholder="Deutschland" style={inputStyle} /></Field>
                  <Field label="Şehir *" className="md:col-span-3"><input value={form.sehir} onChange={(e) => upd({ sehir: e.target.value })} placeholder="Berlin" style={inputStyle} /></Field>
                  <Field label="Sektör / Kategori *" className="md:col-span-3"><input value={form.kategori} onChange={(e) => upd({ kategori: e.target.value })} placeholder="Autohaus / Werkstatt" style={inputStyle} /></Field>
                  <Field label="Sayı (max 120)" className="md:col-span-1"><input type="number" min={1} max={120} value={form.limit} onChange={(e) => upd({ limit: e.target.value })} style={inputStyle} /></Field>
                  <Field label="Dil" className="md:col-span-2">
                    <select value={form.language} onChange={(e) => upd({ language: e.target.value })} style={inputStyle}><option value="de">Deutsch</option><option value="tr">Türkçe</option><option value="en">English</option></select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3 items-end">
                  <Field label="Min. puan" className="md:col-span-2">
                    <select value={filters.minPuan} onChange={(e) => setFilters((f) => ({ ...f, minPuan: Number(e.target.value) }))} style={inputStyle}>{[0, 3, 3.5, 4, 4.5].map((v) => <option key={v} value={v}>{v === 0 ? 'Hepsi' : `${v}+`}</option>)}</select>
                  </Field>
                  <div className="md:col-span-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm pb-2" style={{ color: C.textDim }}>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={filters.onlyEmail} onChange={(e) => setFilters((f) => ({ ...f, onlyEmail: e.target.checked }))} /> Sadece e-postası olanlar</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={filters.onlyPhone} onChange={(e) => setFilters((f) => ({ ...f, onlyPhone: e.target.checked }))} /> Sadece telefonu olanlar</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={filters.onlyWeb} onChange={(e) => setFilters((f) => ({ ...f, onlyWeb: e.target.checked }))} /> Sadece web sitesi olanlar</label>
                  </div>
                  <div className="md:col-span-3 flex md:justify-end pb-1">
                    {searching ? (
                      <button onClick={handleCancel} className="w-full md:w-auto px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: C.errSoft, color: C.err }}>İptal</button>
                    ) : (
                      <button onClick={handleSearch} className="w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition" style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`, color: '#fff' }}><SearchIcon size={16} /> Ara</button>
                    )}
                  </div>
                </div>
                {searching && <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: C.textDim }}><Spinner /> {STATUS_LABELS[progress?.status] || 'Çalışıyor…'}{progress?.items ? ` · ${progress.items} kayıt` : ''}</div>}
                {error && <p className="mt-3 text-sm" style={{ color: C.err }}>{error}</p>}
              </div>
            )}
          </section>

          {/* Arama sonuçları (geçici) */}
          {results.length > 0 && (
            <section className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="p-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                <span className="text-sm font-medium flex items-center gap-2">Arama Sonuçları <span style={{ color: C.textMute }}>· {filtered.length} işletme · {selected.size} seçili</span>
                  {saving ? <span className="text-xs flex items-center gap-1" style={{ color: C.textDim }}><Spinner /> kaydediliyor…</span>
                    : <span className="text-xs flex items-center gap-1" style={{ color: C.ok }}><Check size={13} /> Supabase'e kaydedildi</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={handleCsv} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ border: `1px solid ${C.border}`, color: C.textDim }}><DownloadIcon size={15} /> CSV</button>
                  <button onClick={() => setMailOpen(true)} disabled={mailTargets.length === 0} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ border: `1px solid ${C.border}`, color: mailTargets.length ? C.blue : C.textMute, background: mailTargets.length ? C.blueSoft : 'transparent' }}><MailIcon size={15} /> Toplu Mail ({mailTargets.length})</button>
                </div>
              </div>
              <BusinessTable
                rows={filtered} keyOf={rowKey} selectable allSelected={allSelected} onToggleAll={toggleAll}
                isSelected={(r, i) => selected.has(rowKey(r, i))} onToggle={(r, i) => toggleRow(rowKey(r, i))}
                onRowClick={openResult} durumOf={() => null} mailOf={() => null}
              />
            </section>
          )}

          {/* Kayıtlı müşteriler */}
          {tableMissing ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <Database size={28} style={{ color: C.textMute, margin: '0 auto 12px' }} />
              <p className="font-medium">Tablo bulunamadı</p>
              <p className="text-sm mt-1" style={{ color: C.textDim }}>Migration: <code className="text-xs">12_musteri_bulma.sql</code></p>
            </div>
          ) : (
            <section className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              {/* Durum filtre pill'leri */}
              <div className="p-4 flex items-center gap-2 flex-wrap" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                <DurumPill active={durumFilter === 'hepsi'} onClick={() => setDurumFilter('hepsi')} label="Tümü" count={durumCounts.hepsi} color={C.text} />
                {DURUM_SIRA.map((k) => <DurumPill key={k} active={durumFilter === k} onClick={() => setDurumFilter(k)} label={LEAD_DURUMU[k].label} count={durumCounts[k]} color={LEAD_DURUMU[k].color} />)}
              </div>
              {leadsLoading ? (
                <div className="p-8 text-center" style={{ color: C.textDim }}><Spinner /> Yükleniyor…</div>
              ) : visibleLeads.length === 0 ? (
                <div className="p-10 text-center" style={{ color: C.textDim }}><div className="text-3xl mb-2">🗂️</div>{leads.length === 0 ? 'Henüz kayıtlı müşteri yok. Yukarıdan arama yapıp kaydedin.' : 'Bu durumda müşteri yok.'}</div>
              ) : (
                <BusinessTable
                  rows={visibleLeads} keyOf={(l) => l.id} onRowClick={openLead}
                  durumOf={(l) => LEAD_DURUMU[l.lead_durumu || 'yeni']}
                  mailOf={(l) => MAIL_DURUMU_BADGE[l.mail_durumu] || MAIL_DURUMU_BADGE.gonderilmedi}
                  activeId={detail?.kind === 'lead' ? detail.id : null}
                />
              )}
            </section>
          )}
        </div>
      )}

      {/* Mail Geçmişi */}
      {tab === 'mailgecmisi' && (
        <section className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {mailHistory.length === 0 ? (
            <div className="p-10 text-center" style={{ color: C.textDim }}><div className="text-3xl mb-2">✉️</div>Henüz mail gönderilmemiş.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: C.borderSoft }}>
              {mailHistory.map((h, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer" style={{ borderTop: i ? `1px solid ${C.borderSoft}` : 'none' }} onClick={() => h.leadId && setDetail({ kind: 'lead', id: h.leadId })}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: h.durum === 'hata' ? C.errSoft : C.okSoft, color: h.durum === 'hata' ? C.err : C.ok }}>✉</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{h.firma} <span className="font-normal" style={{ color: C.textMute }}>— {h.konu || 'Mail'}</span></div>
                    {h.ozet && <div className="text-xs truncate" style={{ color: C.textMute }}>{h.ozet}</div>}
                  </div>
                  <div className="text-xs shrink-0" style={{ color: h.durum === 'hata' ? C.err : C.textMute }}>{h.durum === 'hata' ? 'Hata' : 'Gönderildi'} · {fmtDate(h.at)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sağ panel — Şirket Kartı */}
      {detailLead && (
        <LeadDrawer
          lead={detailLead} onClose={() => setDetail(null)}
          onSetDurum={setDurum} onSendMail={sendMailToLead} onWhatsApp={openWhatsApp}
          onSaveNote={(notlar) => detailLead.id && updateLead(detailLead.id, { notlar })}
          onDelete={() => detailLead.id && deleteLead(detailLead.id)}
          onSave={async () => { const saved = await saveSingle(detailLead); if (saved) setDetail({ kind: 'lead', id: saved.id }); }}
        />
      )}

      {/* Toplu mail modal */}
      {mailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => !mailing && setMailOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: C.surface }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold flex items-center gap-2"><MailIcon size={18} style={{ color: C.blue }} /> Toplu Mail ({mailTargets.length})</h3><button onClick={() => !mailing && setMailOpen(false)}><XClose size={18} style={{ color: C.textDim }} /></button></div>
            <TemplatePicker value={mail.templateId} onPick={(t) => setMail({ templateId: t.id, subject: t.subject, body: t.body })} />
            <p className="text-xs my-3" style={{ color: C.textDim }}><code>{'{{sirket}}'}</code> işletme adıyla değişir. Her mail arası ~1.2sn beklenir.</p>
            <input value={mail.subject} onChange={(e) => setMail((m) => ({ ...m, subject: e.target.value }))} placeholder="Konu" style={{ ...inputStyle, marginBottom: 10 }} />
            <textarea value={mail.body} onChange={(e) => setMail((m) => ({ ...m, body: e.target.value }))} rows={9} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => !mailing && setMailOpen(false)} className="px-4 py-2 rounded-xl text-sm" style={{ border: `1px solid ${C.border}`, color: C.textDim }}>Vazgeç</button><button onClick={handleSendMails} disabled={mailing} className="px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: C.blue, color: '#fff' }}>{mailing ? <><Spinner light /> Gönderiliyor…</> : 'Gönder'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── İşletme listesi (satır/kart tıklayınca onRowClick → kart) ───
// Masaüstü: tablo · Mobil: kart listesi (tüm bilgiler + ikonlar görünür).
// Adres SADECE düz metin; Google Maps yalnızca kart içindeki butonla açılır.
function BusinessTable({ rows, keyOf, selectable, allSelected, onToggleAll, isSelected, onToggle, onRowClick, durumOf, mailOf, activeId }) {
  const Contact = ({ r, small }) => (
    <div className={`flex flex-col gap-0.5 ${small ? 'text-xs' : 'text-xs'}`}>
      {r.telefon && <a href={`tel:${r.telefon}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1" style={{ color: C.text }}><PhoneIcon size={12} /> {r.telefon}</a>}
      {r.email ? <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 truncate" style={{ color: C.blue }}><MailIcon size={12} /> {r.email}</a> : <span style={{ color: C.textMute }} className="flex items-center gap-1"><MailIcon size={12} /> e-posta yok</span>}
      {r.website && <a href={r.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 truncate" style={{ color: C.textDim }}><GlobeIcon size={12} /> Web sitesi</a>}
    </div>
  );
  const Rating = ({ r }) => r.puan != null
    ? <span className="inline-flex items-center gap-1"><StarIcon filled size={13} style={{ color: C.warn }} /> {r.puan}{r.yorum_sayisi ? <span style={{ color: C.textMute }} className="text-xs">({r.yorum_sayisi})</span> : null}</span>
    : <span style={{ color: C.textMute }}>—</span>;
  const Durum = ({ d }) => d ? <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: d.soft, color: d.color, fontWeight: 600 }}>{d.label}</span> : null;
  const Mail = ({ mb }) => mb && mb.label !== '—' ? <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: mb.soft, color: mb.color }}>{mb.icon} {mb.label}</span> : null;

  return (
    <>
      {/* MASAÜSTÜ — tablo (lg+) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead><tr style={{ color: C.textDim, textAlign: 'left' }}>
            {selectable && <th style={thStyle}><input type="checkbox" checked={allSelected} onChange={onToggleAll} onClick={(e) => e.stopPropagation()} /></th>}
            <th style={thStyle}>İŞLETME</th><th style={thStyle}>İLETİŞİM</th><th style={thStyle}>PUAN</th><th style={thStyle}>DURUM</th><th style={thStyle}>MAİL</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const k = keyOf(r, i); const sel = selectable && isSelected(r, i); const active = activeId && r.id === activeId;
              const durum = durumOf ? durumOf(r) : null; const mb = mailOf ? mailOf(r) : null;
              return (
                <tr key={k} onClick={() => onRowClick(r)} className="cursor-pointer transition"
                  style={{ borderTop: `1px solid ${C.borderSoft}`, background: active ? C.brandSoft : sel ? 'rgba(37,99,235,0.04)' : 'transparent' }}>
                  {selectable && <td style={tdStyle} onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel} onChange={() => onToggle(r, i)} /></td>}
                  <td style={tdStyle}>
                    <div className="font-medium">{r.isim}</div>
                    <div style={{ color: C.textMute }} className="text-xs flex items-center gap-1"><Building size={11} /> {r.kategori || '—'}{r.sehir ? ` · ${r.sehir}` : ''}</div>
                  </td>
                  <td style={tdStyle}><Contact r={r} /></td>
                  <td style={tdStyle}><Rating r={r} /></td>
                  <td style={tdStyle}>{durum ? <Durum d={durum} /> : <span style={{ color: C.textMute }}>—</span>}</td>
                  <td style={tdStyle}>{mb && mb.label !== '—' ? <Mail mb={mb} /> : <span style={{ color: C.textMute }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBİL — kart listesi (lg altı) */}
      <div className="lg:hidden divide-y" style={{ borderColor: C.borderSoft }}>
        {rows.map((r, i) => {
          const k = keyOf(r, i); const sel = selectable && isSelected(r, i); const active = activeId && r.id === activeId;
          const durum = durumOf ? durumOf(r) : null; const mb = mailOf ? mailOf(r) : null;
          return (
            <div key={k} onClick={() => onRowClick(r)} className="p-4 flex gap-3 cursor-pointer"
              style={{ borderTop: i ? `1px solid ${C.borderSoft}` : 'none', background: active ? C.brandSoft : sel ? 'rgba(37,99,235,0.04)' : 'transparent' }}>
              {selectable && <input type="checkbox" checked={sel} onClick={(e) => e.stopPropagation()} onChange={() => onToggle(r, i)} className="mt-1" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{r.isim}</div>
                  <Rating r={r} />
                </div>
                <div style={{ color: C.textMute }} className="text-xs flex items-center gap-1 mb-2"><Building size={11} /> {r.kategori || '—'}{r.sehir ? ` · ${r.sehir}` : ''}</div>
                <Contact r={r} small />
                {(durum || (mb && mb.label !== '—')) && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {durum && <Durum d={durum} />}{mb && mb.label !== '—' && <Mail mb={mb} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Sağ slide-in: Şirket kartı ──────────────────────────────────
function LeadDrawer({ lead, onClose, onSetDurum, onSendMail, onWhatsApp, onSaveNote, onDelete, onSave }) {
  const saved = !lead._transient && !!lead.id;
  const [mailMode, setMailMode] = useState(false);
  const [tpl, setTpl] = useState(DEFAULT_TEMPLATE);
  const [subject, setSubject] = useState(DEFAULT_TEMPLATE.subject);
  const [body, setBody] = useState(DEFAULT_TEMPLATE.body);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState(lead.notlar || '');
  const [waLang, setWaLang] = useState('de');
  const [waMsgId, setWaMsgId] = useState(WA_MESSAGES[0].id);
  const [waText, setWaText] = useState(WA_MESSAGES[0].text.de);
  useEffect(() => { setNote(lead.notlar || ''); }, [lead.id]);

  const waMsg = WA_MESSAGES.find((m) => m.id === waMsgId) || WA_MESSAGES[0];
  const applyWa = (msgId, lang) => { const m = WA_MESSAGES.find((x) => x.id === msgId) || WA_MESSAGES[0]; setWaText(m.text[lang] || m.text.de); };

  const history = [...(lead.iletisim_gecmisi || [])].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const vars = leadVars(lead);
  const durum = LEAD_DURUMU[lead.lead_durumu || 'yeni'];

  const doSend = async () => { setSending(true); await onSendMail(lead, subject, body); setSending(false); setMailMode(false); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: C.surface, boxShadow: '-8px 0 32px rgba(0,0,0,0.18)' }} onClick={(e) => e.stopPropagation()}>
        {/* Başlık */}
        <div className="p-5 sticky top-0 z-10" style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`, color: '#fff' }}>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-lg font-bold truncate">{lead.isim}</div>
              {lead.kategori && <span className="text-[11px] px-2 py-0.5 rounded mt-1 inline-block" style={{ background: 'rgba(255,255,255,0.2)' }}>{lead.kategori}</span>}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}><XClose size={18} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* İLETİŞİM */}
          <Section title="İLETİŞİM">
            <div className="space-y-1.5 text-sm">
              {lead.adres && <div className="flex items-start gap-2" style={{ color: C.textDim }}><PinIcon size={14} /> {lead.adres}</div>}
              {lead.telefon && <a href={`tel:${lead.telefon}`} className="flex items-center gap-2" style={{ color: C.text }}><PhoneIcon size={14} style={{ color: C.textDim }} /> {lead.telefon}</a>}
              {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 truncate" style={{ color: C.textDim }}><GlobeIcon size={14} /> {lead.website.replace(/^https?:\/\//, '')}</a>}
              {lead.google_maps_url && <a href={lead.google_maps_url} target="_blank" rel="noreferrer" className="flex items-center gap-2" style={{ color: C.blue }}><PinIcon size={14} /> Google Haritalar'da aç</a>}
              {lead.puan != null && <div className="flex items-center gap-1.5" style={{ color: C.warn }}><StarIcon filled size={14} /> {lead.puan}{lead.yorum_sayisi ? <span style={{ color: C.textMute }}> ({lead.yorum_sayisi} yorum)</span> : null}</div>}
            </div>
          </Section>

          {/* DURUM */}
          <Section title="DURUM">
            {saved ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {DURUM_SIRA.map((k) => (
                  <button key={k} onClick={() => onSetDurum(lead, k)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                    style={{ background: (lead.lead_durumu || 'yeni') === k ? LEAD_DURUMU[k].color : LEAD_DURUMU[k].soft, color: (lead.lead_durumu || 'yeni') === k ? '#fff' : LEAD_DURUMU[k].color }}>{LEAD_DURUMU[k].label}</button>
                ))}
              </div>
            ) : (
              <button onClick={onSave} className="w-full px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: C.brand, color: '#fff' }}><PlusIcon size={15} /> Kaydet ve takip et</button>
            )}
          </Section>

          {/* MAIL */}
          {lead.email ? (
            <Section title="E-POSTA">
              {!mailMode ? (
                <button onClick={() => setMailMode(true)} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2" style={{ background: C.blueSoft, color: C.blue }}><MailIcon size={15} /> Şablonla Mail Gönder</button>
              ) : (
                <div className="space-y-2">
                  <TemplatePicker value={tpl.id} onPick={(t) => { setTpl(t); setSubject(t.subject); setBody(t.body); }} />
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Konu" style={{ ...inputStyle, fontSize: 13 }} />
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={{ ...inputStyle, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                  <div className="rounded-lg p-2 text-xs" style={{ background: C.borderSoft, color: C.textDim }}><b>Önizleme:</b> {fillTemplate(subject, vars)}</div>
                  <div className="flex gap-2"><button onClick={() => setMailMode(false)} className="px-3 py-2 rounded-lg text-sm flex-1" style={{ border: `1px solid ${C.border}`, color: C.textDim }}>Vazgeç</button>
                    <button onClick={doSend} disabled={sending} className="px-3 py-2 rounded-lg text-sm font-semibold flex-1 flex items-center justify-center gap-2" style={{ background: C.blue, color: '#fff' }}>{sending ? <Spinner light /> : <MailIcon size={14} />} Gönder</button></div>
                </div>
              )}
            </Section>
          ) : (
            <div className="px-4 py-2.5 rounded-xl text-sm text-center" style={{ background: C.borderSoft, color: C.textMute }}>E-posta adresi yok</div>
          )}

          {/* WHATSAPP */}
          <Section title="WHATSAPP">
            <div className="flex items-center gap-1 flex-wrap mb-2">
              {WA_LANGS.map(([code, label]) => (
                <button key={code} onClick={() => { setWaLang(code); applyWa(waMsgId, code); }} className="px-2 py-1 rounded-lg text-xs transition"
                  style={{ background: waLang === code ? C.wa : '#fff', color: waLang === code ? '#fff' : C.textDim, border: `1px solid ${waLang === code ? C.wa : C.border}` }}>{label}</button>
              ))}
            </div>
            <label className="text-xs" style={{ color: C.textDim }}>Hazır mesaj</label>
            <select value={waMsgId} onChange={(e) => { setWaMsgId(e.target.value); applyWa(e.target.value, waLang); }} style={{ ...inputStyle, marginTop: 4, marginBottom: 8 }}>
              {WA_MESSAGES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <textarea value={waText} onChange={(e) => setWaText(e.target.value)} rows={4} style={{ ...inputStyle, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
            <button onClick={() => onWhatsApp(lead, waText)} disabled={!lead.telefon} className="w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: lead.telefon ? C.wa : C.borderSoft, color: lead.telefon ? '#fff' : C.textMute, cursor: lead.telefon ? 'pointer' : 'not-allowed' }}>
              💬 WhatsApp'ta aç ve gönder
            </button>
            <p className="text-[11px] mt-1.5" style={{ color: C.textMute }}>WhatsApp açılır, mesaj hazır gelir; "gönder"e sen basarsın. Ücretsiz, kredi harcamaz.</p>
          </Section>

          {/* GOOGLE YORUMLARI */}
          {lead.google_maps_url && (
            <Section title="GOOGLE YORUMLARI">
              <a href={lead.google_maps_url} target="_blank" rel="noreferrer" className="w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2" style={{ background: C.violetSoft, color: C.violet }}>
                <StarIcon filled size={15} /> Google yorumlarını aç
              </a>
            </Section>
          )}

          {/* NOT */}
          {saved && (
            <Section title="NOT">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Bu işletmeyle ilgili not…" style={{ ...inputStyle, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
              <button onClick={() => onSaveNote(note)} className="mt-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: C.text, color: '#fff' }}>Notu kaydet</button>
            </Section>
          )}

          {/* İLETİŞİM GEÇMİŞİ */}
          {saved && (
            <Section title={`İLETİŞİM GEÇMİŞİ (${history.length})`}>
              {history.length === 0 ? (
                <div className="text-xs py-3 text-center rounded-lg" style={{ color: C.textMute, background: C.borderSoft }}>Henüz iletişim kaydı yok.</div>
              ) : (
                <div className="space-y-2">
                  {history.map((h, i) => {
                    const ico = h.tip === 'mail' ? '✉' : h.tip === 'whatsapp' ? '💬' : h.tip === 'durum' ? '🏷' : '📞';
                    const col = h.durum === 'hata' ? C.err : h.tip === 'whatsapp' ? C.wa : h.tip === 'mail' ? C.blue : C.textDim;
                    return (
                      <div key={i} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: `${col}14`, color: col }}>{ico}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium" style={{ color: C.text }}>{h.konu || h.ozet || h.tip}{h.durum === 'hata' && <span style={{ color: C.err }}> · hata</span>}</div>
                          {h.konu && h.ozet && <div className="text-[11px] truncate" style={{ color: C.textMute }}>{h.ozet}</div>}
                          <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>{fmtDate(h.at)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          )}

          {saved && <button onClick={onDelete} className="w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2" style={{ color: C.err, border: `1px solid ${C.err}33` }}><TrashIcon size={15} /> Adayı Sil</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Küçük bileşenler ────────────────────────────────────────────
function Section({ title, children }) {
  return <div><div className="text-xs font-semibold mb-2 tracking-wide" style={{ color: C.textMute }}>{title}</div>{children}</div>;
}
function DurumPill({ active, onClick, label, count, color }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5"
      style={{ background: active ? color : C.surface, color: active ? '#fff' : color, border: `1px solid ${active ? color : C.border}` }}>
      {label} <span style={{ opacity: 0.85 }}>· {count}</span>
    </button>
  );
}
function TabBtn({ active, onClick, children }) {
  return <button onClick={onClick} className="px-3.5 py-1.5 rounded-lg text-sm transition-all" style={{ background: active ? C.surface : 'transparent', color: active ? C.brand : C.textDim, fontWeight: active ? 700 : 500, boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>{children}</button>;
}
function TemplatePicker({ value, onPick }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FIRMA_SABLONLARI.map((t) => {
        const sel = t.id === value;
        return (
          <button key={t.id} onClick={() => onPick(t)} title={t.description} className="shrink-0 px-3 py-2 rounded-xl text-xs text-left transition" style={{ background: sel ? `${t.accent}14` : '#fff', border: `1.5px solid ${sel ? t.accent : C.border}`, minWidth: 120 }}>
            <div className="text-base">{t.icon}</div><div className="font-semibold mt-0.5" style={{ color: sel ? t.accent : C.text }}>{t.title}</div>
          </button>
        );
      })}
    </div>
  );
}
function fmtDate(iso) { if (!iso) return ''; try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } }

const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: '#fff', outline: 'none' };
const thStyle = { padding: '10px 14px', fontWeight: 600, fontSize: 11, letterSpacing: 0.3, whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 14px', verticalAlign: 'top' };

function Field({ label, className = '', children }) { return <div className={className}><label className="block text-xs mb-1.5" style={{ color: C.textDim }}>{label}</label>{children}</div>; }
function Spinner({ light }) { return <span className="inline-block w-4 h-4 rounded-full animate-spin" style={{ border: `2px solid ${light ? 'rgba(255,255,255,0.4)' : C.border}`, borderTopColor: light ? '#fff' : C.brand }} />; }
