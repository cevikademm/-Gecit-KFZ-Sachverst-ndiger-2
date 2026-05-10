// AutoiXpert tarzı Gutachten Editörü
// app.autoixpert.de/Gutachten/{id}/Beteiligte sayfasının klonu.
//
// Üstte tab navigasyonu (Beteiligte / Fahrzeug / Unfall / ...)
// Beteiligte: 8 collapsible party kartı, her birinde düzenlenebilir form
// Save: autoixpert_reports tablosuna UPSERT (yerel mirror)

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { getSupabaseClient } from '../utils/supabaseAuth.js';

// ─── Tab tanımları ────────────────────────────────────────────────────
const TABS = [
  { key: 'beteiligte',  label: 'Beteiligte',   icon: '👥' },
  { key: 'fahrzeug',    label: 'Fahrzeug',     icon: '🚘' },
  { key: 'unfall',      label: 'Unfall',       icon: '💥' },
  { key: 'schaden',     label: 'Schaden',      icon: '🔧' },
  { key: 'fotos',       label: 'Fotos',        icon: '📸' },
  { key: 'kalkulation', label: 'Kalkulation',  icon: '🧮' },
  { key: 'druck',       label: 'Druck',        icon: '🖨️' },
];

// ─── Party tanımları (AutoiXpert standardı) ──────────────────────────
const PARTIES = [
  { key: 'claimant',                       label: 'Anspruchsteller',       icon: '👤', color: '#E30613' },
  { key: 'owner_of_claimants_car',         label: 'Halter d. Anspruchstellerfahrzeugs', icon: '🚗', color: '#0EA5E9' },
  { key: 'author_of_damage',               label: 'Schadenverursacher',    icon: '⚠️', color: '#F59E0B' },
  { key: 'owner_of_author_of_damages_car', label: 'Halter d. Schädiger-Fahrzeugs',      icon: '🚙', color: '#A855F7' },
  { key: 'insurance',                      label: 'Versicherung',          icon: '🛡️', color: '#10B981' },
  { key: 'garage',                         label: 'Werkstatt',             icon: '🔧', color: '#8B5CF6' },
  { key: 'lawyer',                         label: 'Anwalt',                icon: '⚖️', color: '#6366F1' },
  { key: 'intermediary',                   label: 'Vermittler',            icon: '🤝', color: '#EC4899' },
];

// ─── Party-spesifik ek alanlar ────────────────────────────────────────
const PARTY_EXTRA_FIELDS = {
  claimant: ['notes', 'is_owner', 'case_number', 'may_deduct_taxes', 'vat_id', 'iban', 'represented_by_lawyer'],
  owner_of_claimants_car: ['may_deduct_taxes', 'vat_id'],
  author_of_damage: ['notes', 'is_owner', 'license_plate'],
  owner_of_author_of_damages_car: ['notes'],
  insurance: ['case_number', 'contract_number', 'deductible_partial_kasko', 'deductible_full_kasko', 'notes'],
  garage: ['notes'],
  lawyer: ['case_number', 'notes'],
  intermediary: [],
};

const REPORT_TYPE_LABELS = {
  liability: 'Haftpflichtgutachten',
  short_assessment: 'Kostenvoranschlag',
  partial_kasko: 'Teilkasko',
  full_kasko: 'Vollkasko',
  valuation: 'Wertgutachten',
  oldtimer_valuation_small: 'Oldtimer (klein)',
  lease_return: 'Leasingrückläufer',
  used_vehicle_check: 'Gebrauchtwagencheck',
  invoice_audit: 'Rechnungsprüfung',
};

const STATE_LABELS = {
  done: 'Abgeschlossen',
  recorded: 'In Bearbeitung',
  locked: 'Gesperrt',
  deleted: 'Gelöscht',
};

// ─── Ana component ────────────────────────────────────────────────────
export default function GutachtenWorkbench({ report, onBack, embedded = false }) {
  const [activeTab, setActiveTab] = useState('beteiligte');
  const [draft, setDraft] = useState(() => structuredClone(report || {}));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [errMsg, setErrMsg] = useState(null);

  // Parent (AdminAutoiXpert) bazen full select * tamamlanmadan render eder —
  // car/accident/damage/raw_payload eksikse tek sorgu ile çekip draft'a merge edelim.
  useEffect(() => {
    if (!report?.id) return;
    const need = !report?.raw_payload || !report?.car || !report?.accident || !report?.damage;
    if (!need) return;
    let cancelled = false;
    (async () => {
      const sb = getSupabaseClient();
      if (!sb) return;
      const { data, error } = await sb
        .from('autoixpert_reports')
        .select('*')
        .eq('id', report.id)
        .maybeSingle();
      if (cancelled || error || !data) return;
      setDraft((prev) => ({ ...data, ...prev })); // mevcut user-edits korunur
    })();
    return () => { cancelled = true; };
  }, [report?.id]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(report), [draft, report]);

  const updateParty = (partyKey, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [partyKey]: { ...(prev[partyKey] || {}), [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrMsg(null);
    setSaveStatus(null);
    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error('Supabase bağlantısı yok');
      const updates = {};
      for (const p of PARTIES) {
        if (JSON.stringify(draft[p.key]) !== JSON.stringify(report[p.key])) {
          updates[p.key] = draft[p.key];
        }
      }
      if (Object.keys(updates).length === 0) {
        setSaveStatus('success');
        setSaving(false);
        return;
      }
      const { error } = await sb
        .from('autoixpert_reports')
        .update({ ...updates, synced_at: new Date().toISOString() })
        .eq('id', report.id);
      if (error) throw error;
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e) {
      setErrMsg(e?.message || 'Kayıt hatası');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const claimantName =
    draft.claimant?.organization_name ||
    [draft.claimant?.first_name, draft.claimant?.last_name].filter(Boolean).join(' ') ||
    'Unbekannt';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        {!embedded && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: C.textDim, border: `1px solid ${C.border}` }}
          >
            ← Liste
          </button>
        )}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#E30613', letterSpacing: '0.2em' }}>
                Gutachten
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(99,102,241,0.10)', color: '#4F46E5', border: '1px solid rgba(99,102,241,0.25)' }}>
                {REPORT_TYPE_LABELS[draft.type] || draft.type}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{
                background: draft.state === 'done' ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
                color: draft.state === 'done' ? '#059669' : '#D97706',
                border: '1px solid currentColor',
              }}>
                {STATE_LABELS[draft.state] || draft.state}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: C.text, letterSpacing: '-0.02em' }}>
              {draft.token || draft.id}
            </h1>
            <p className="text-sm mt-1" style={{ color: C.textDim }}>{claimantName}</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706', border: '1px solid rgba(245,158,11,0.30)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#D97706' }} />
                Geändert
              </span>
            )}
            {saveStatus === 'success' && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.30)' }}>
                ✓ Gespeichert
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: dirty ? 'linear-gradient(135deg, #E30613, #B0050F)' : 'rgba(0,0,0,0.05)',
                color: dirty ? '#FFFFFF' : C.textDim,
                boxShadow: dirty ? '0 4px 12px rgba(227,6,19,0.30)' : 'none',
              }}
            >
              {saving ? 'Speichert…' : 'Speichern'}
            </button>
          </div>
        </div>
        {errMsg && (
          <div className="mt-3 text-sm rounded-lg px-4 py-2"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#B91C1C' }}>
            {errMsg}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-px" style={{ borderBottom: `1px solid ${C.border}` }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap"
              style={{
                color: isActive ? C.text : C.textDim,
                borderBottom: `2px solid ${isActive ? '#E30613' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              <span>{t.icon}</span>
              <span className={isActive ? 'font-semibold' : ''}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {activeTab === 'beteiligte' && (
        <BeteiligteSection draft={draft} updateParty={updateParty} />
      )}

      {activeTab === 'fahrzeug' && (
        <FahrzeugSection report={draft} />
      )}

      {activeTab === 'unfall' && (
        <UnfallSection report={draft} />
      )}

      {activeTab === 'schaden' && (
        <SchadenSection report={draft} />
      )}

      {activeTab === 'fotos' && (
        <FotosSection report={draft} />
      )}

      {activeTab === 'kalkulation' && (
        <KalkulationSection report={draft} />
      )}

      {activeTab === 'druck' && (
        <DruckSection report={draft} />
      )}

      {!['beteiligte', 'fahrzeug', 'unfall', 'schaden', 'fotos', 'kalkulation', 'druck'].includes(activeTab) && (
        <PlaceholderTab tab={TABS.find((t) => t.key === activeTab)} />
      )}
    </div>
  );
}

// ─── Beteiligte Section ───────────────────────────────────────────────
function BeteiligteSection({ draft, updateParty }) {
  return (
    <div className="space-y-4">
      {PARTIES.map((p) => (
        <PartyCard
          key={p.key}
          party={p}
          data={draft[p.key] || {}}
          onChange={(field, value) => updateParty(p.key, field, value)}
          extraFields={PARTY_EXTRA_FIELDS[p.key] || []}
        />
      ))}
    </div>
  );
}

// ─── Party Card (Collapsible) ─────────────────────────────────────────
function PartyCard({ party, data, onChange, extraFields }) {
  const isFilled = data && Object.values(data).some((v) => v !== null && v !== undefined && v !== '');
  const [open, setOpen] = useState(isFilled);

  const displayName =
    data.organization_name ||
    [data.first_name, data.last_name].filter(Boolean).join(' ') ||
    null;

  return (
    <motion.section
      layout
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-black/[0.02]"
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${party.color}12`, border: `1px solid ${party.color}30` }}>
          {party.icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: party.color, letterSpacing: '0.2em' }}>
            {party.label}
          </p>
          <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: C.text }}>
            {displayName || <span className="italic font-normal" style={{ color: C.textDim }}>Nicht angegeben</span>}
          </p>
        </div>
        {isFilled && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
            style={{ background: `${party.color}15`, color: party.color }}>
            Ausgefüllt
          </span>
        )}
        <span className="text-lg flex-shrink-0" style={{ color: C.textDim, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ⌄
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="p-5 space-y-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <PartyForm party={party} data={data} onChange={onChange} extraFields={extraFields} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ─── Party Form ───────────────────────────────────────────────────────
function PartyForm({ party, data, onChange, extraFields }) {
  return (
    <>
      {/* Anrede + Name */}
      <FieldRow>
        <SelectField label="Anrede" value={data.salutation} options={['', 'Herr', 'Frau']} onChange={(v) => onChange('salutation', v)} cols={1} />
        <TextField label="Vorname" value={data.first_name} onChange={(v) => onChange('first_name', v)} cols={2} />
        <TextField label="Nachname" value={data.last_name} onChange={(v) => onChange('last_name', v)} cols={2} />
      </FieldRow>

      <TextField label="Firma / Organisation" value={data.organization_name} onChange={(v) => onChange('organization_name', v)} />

      {/* Kontakt */}
      <FieldRow>
        <TextField label="E-Mail" type="email" value={data.email} onChange={(v) => onChange('email', v)} cols={3} />
        <TextField label="Telefon" value={data.phone} onChange={(v) => onChange('phone', v)} cols={2} />
      </FieldRow>
      {(party.key === 'claimant' || party.key === 'author_of_damage') && (
        <TextField label="Telefon 2" value={data.phone2} onChange={(v) => onChange('phone2', v)} />
      )}

      {/* Adresse */}
      <TextField label="Straße / Postfach" value={data.street_and_housenumber_or_lockbox} onChange={(v) => onChange('street_and_housenumber_or_lockbox', v)} />
      <FieldRow>
        <TextField label="PLZ" value={data.zip} onChange={(v) => onChange('zip', v)} cols={1} />
        <TextField label="Ort" value={data.city} onChange={(v) => onChange('city', v)} cols={3} />
      </FieldRow>

      {/* Party-spesifik ek alanlar */}
      {extraFields.includes('license_plate') && (
        <TextField label="Kennzeichen" value={data.license_plate} onChange={(v) => onChange('license_plate', v)} mono />
      )}
      {extraFields.includes('case_number') && (
        <TextField label="Aktenzeichen / Schadennummer" value={data.case_number} onChange={(v) => onChange('case_number', v)} mono />
      )}
      {extraFields.includes('contract_number') && (
        <TextField label="Versicherungsscheinnummer" value={data.contract_number} onChange={(v) => onChange('contract_number', v)} mono />
      )}
      {(extraFields.includes('deductible_partial_kasko') || extraFields.includes('deductible_full_kasko')) && (
        <FieldRow>
          {extraFields.includes('deductible_partial_kasko') && (
            <NumberField label="SB Teilkasko (€)" value={data.deductible_partial_kasko} onChange={(v) => onChange('deductible_partial_kasko', v)} cols={2} />
          )}
          {extraFields.includes('deductible_full_kasko') && (
            <NumberField label="SB Vollkasko (€)" value={data.deductible_full_kasko} onChange={(v) => onChange('deductible_full_kasko', v)} cols={2} />
          )}
        </FieldRow>
      )}
      {extraFields.includes('vat_id') && (
        <TextField label="USt-IdNr." value={data.vat_id} onChange={(v) => onChange('vat_id', v)} mono />
      )}
      {extraFields.includes('iban') && (
        <TextField label="IBAN" value={data.iban} onChange={(v) => onChange('iban', v)} mono />
      )}

      {/* Boolean alanlar */}
      <div className="flex flex-wrap gap-3">
        {extraFields.includes('is_owner') && (
          <CheckboxField label="Ist Halter des Fahrzeugs" value={data.is_owner} onChange={(v) => onChange('is_owner', v)} />
        )}
        {extraFields.includes('may_deduct_taxes') && (
          <CheckboxField label="Vorsteuerabzugsberechtigt" value={data.may_deduct_taxes} onChange={(v) => onChange('may_deduct_taxes', v)} />
        )}
        {extraFields.includes('represented_by_lawyer') && (
          <CheckboxField label="Vertreten durch Anwalt" value={data.represented_by_lawyer} onChange={(v) => onChange('represented_by_lawyer', v)} />
        )}
      </div>

      {extraFields.includes('notes') && (
        <TextAreaField label="Notizen" value={data.notes} onChange={(v) => onChange('notes', v)} />
      )}
    </>
  );
}

// ─── Form alanları ────────────────────────────────────────────────────
function FieldRow({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-4 gap-3">{children}</div>;
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: C.textDim, letterSpacing: '0.18em' }}>
      {children}
    </label>
  );
}

function inputBaseStyle() {
  return {
    background: 'rgba(0,0,0,0.02)',
    border: `1px solid ${C.border}`,
    color: C.text,
    transition: 'border-color 0.15s, background 0.15s',
  };
}

function TextField({ label, value, onChange, type = 'text', mono = false, cols }) {
  const colClass = cols === 1 ? 'md:col-span-1' : cols === 2 ? 'md:col-span-2' : cols === 3 ? 'md:col-span-3' : '';
  return (
    <div className={colClass}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${mono ? 'font-mono' : ''}`}
        style={inputBaseStyle()}
        onFocus={(e) => { e.target.style.borderColor = '#E30613'; e.target.style.background = '#FFFFFF'; }}
        onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.background = 'rgba(0,0,0,0.02)'; }}
      />
    </div>
  );
}

function NumberField({ label, value, onChange, cols }) {
  const colClass = cols === 1 ? 'md:col-span-1' : cols === 2 ? 'md:col-span-2' : '';
  return (
    <div className={colClass}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
        style={inputBaseStyle()}
        onFocus={(e) => { e.target.style.borderColor = '#E30613'; e.target.style.background = '#FFFFFF'; }}
        onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.background = 'rgba(0,0,0,0.02)'; }}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange, cols }) {
  const colClass = cols === 1 ? 'md:col-span-1' : cols === 2 ? 'md:col-span-2' : '';
  return (
    <div className={colClass}>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
        style={inputBaseStyle()}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o || '— wählen —'}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5"
      style={{ background: value === true ? 'rgba(16,185,129,0.08)' : value === false ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${C.border}` }}>
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked ? true : false)}
        style={{ accentColor: '#E30613' }}
      />
      <span className="text-sm" style={{ color: C.text }}>{label}</span>
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
        style={inputBaseStyle()}
        onFocus={(e) => { e.target.style.borderColor = '#E30613'; e.target.style.background = '#FFFFFF'; }}
        onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.background = 'rgba(0,0,0,0.02)'; }}
      />
    </div>
  );
}

// ─── Fotos Section — AutoiXpert Foto Galerisi ───────────────────────────
// AutoiXpert API'den foto binary'lerini /api/autoixpert-photo proxy ile çeker.
// Tarayıcı <img> Authorization header gönderemediği için: fetch + blob URL.
function FotosSection({ report }) {
  // Parent (AdminAutoiXpert.openDetail) raw_payload'ı bazen async race nedeniyle
  // set edemiyor — fallback olarak kendimiz çekiyoruz.
  const [fetchedPayload, setFetchedPayload] = useState(null);
  useEffect(() => {
    if (!report?.id) return;
    if (report?.raw_payload?.photos || report?.photos) return;
    let cancelled = false;
    (async () => {
      const sb = getSupabaseClient();
      if (!sb) return;
      const { data, error } = await sb
        .from('autoixpert_reports')
        .select('raw_payload')
        .eq('id', report.id)
        .maybeSingle();
      if (cancelled || error) return;
      setFetchedPayload(data?.raw_payload || null);
    })();
    return () => { cancelled = true; };
  }, [report?.id]);

  const effectiveReport = useMemo(() => {
    if (report?.raw_payload?.photos || report?.photos) return report;
    if (fetchedPayload) return { ...report, raw_payload: fetchedPayload };
    return report;
  }, [report, fetchedPayload]);

  const photos = useMemo(() => normalizePhotos(effectiveReport), [effectiveReport]);
  const [lightbox, setLightbox] = useState(null); // { reportId, photo }

  if (!photos.length) {
    return (
      <div className="rounded-2xl p-12 text-center"
        style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
        <div className="text-5xl mb-4">📸</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: C.text }}>Keine Fotos</h2>
        <p className="text-sm" style={{ color: C.textDim }}>
          Bu rapor için AutoiXpert'te yüklenmiş fotoğraf bulunamadı.
        </p>
      </div>
    );
  }

  const grouped = groupPhotosByCategory(photos);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Fotoğraflar</h2>
          <p className="text-xs" style={{ color: C.textDim }}>
            {photos.length} foto · AutoiXpert üzerinden canlı çekiliyor
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            {Object.keys(grouped).length > 1 && (
              <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: C.textDim, letterSpacing: '0.15em' }}>
                {cat} <span className="font-mono" style={{ color: C.text }}>· {list.length}</span>
              </h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {list.map((p) => (
                <PhotoTile
                  key={p.id}
                  reportId={report?.id}
                  photo={p}
                  onClick={() => setLightbox({ reportId: report?.id, photo: p })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {lightbox && (
          <PhotoLightbox
            reportId={lightbox.reportId}
            photo={lightbox.photo}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// AutoiXpert raw_payload.photos esnek olabiliyor — id/title/category alanlarını
// hangi isimle gelirse gelsin yakala.
function normalizePhotos(report) {
  const raw = Array.isArray(report?.photos) ? report.photos : (Array.isArray(report?.raw_payload?.photos) ? report.raw_payload.photos : []);
  return raw
    .map((p, i) => {
      const id = p?.id || p?._id || p?.photo_id || p?.uuid || null;
      if (!id) return null;
      return {
        id,
        title: p?.title || p?.name || p?.filename || `Foto ${i + 1}`,
        description: p?.description || p?.caption || null,
        category: p?.category || p?.section || p?.group || 'Allgemein',
        is_internal: !!p?.is_internal,
        order: typeof p?.order === 'number' ? p.order : i,
        raw: p,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

function groupPhotosByCategory(photos) {
  const out = {};
  for (const p of photos) {
    const cat = p.category || 'Allgemein';
    if (!out[cat]) out[cat] = [];
    out[cat].push(p);
  }
  return out;
}

function PhotoTile({ reportId, photo, onClick }) {
  const { src, loading, error, retry } = useAutoiXpertPhoto(reportId, photo?.id, 'thumbnail');

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden transition-all hover:ring-2 hover:ring-offset-2"
      style={{
        background: 'rgba(0,0,0,0.04)',
        border: `1px solid ${C.border}`,
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: '#E30613' }} />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
          <span className="text-2xl mb-1">⚠️</span>
          <span className="text-[10px]" style={{ color: '#B91C1C' }}>{error}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); retry(); }}
            className="mt-1 text-[10px] underline"
            style={{ color: C.textDim }}
          >
            Yeniden dene
          </button>
        </div>
      )}
      {src && (
        <img
          src={src}
          alt={photo?.title || 'Foto'}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      )}
      {photo?.is_internal && (
        <span className="absolute top-1.5 left-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(245,158,11,0.95)', color: '#FFFFFF' }}>
          INTERN
        </span>
      )}
      {photo?.title && !error && (
        <span className="absolute bottom-0 inset-x-0 px-2 py-1 text-[10px] truncate text-left"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', color: '#FFFFFF' }}>
          {photo.title}
        </span>
      )}
    </button>
  );
}

function PhotoLightbox({ reportId, photo, onClose }) {
  const { src, loading, error } = useAutoiXpertPhoto(reportId, photo?.id, 'original');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full text-white text-2xl flex items-center justify-center hover:bg-white/10 transition"
        aria-label="Kapat"
      >×</button>

      <div className="max-w-[95vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className="text-white/70 text-sm flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#FFFFFF' }} />
            Wird geladen…
          </div>
        )}
        {error && (
          <div className="text-white text-sm bg-red-900/40 border border-red-500/40 rounded-lg px-4 py-3 max-w-md">
            <strong>Fehler:</strong> {error}
          </div>
        )}
        {src && (
          <motion.img
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            src={src}
            alt={photo?.title || 'Foto'}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        )}
        {photo?.title && (
          <div className="mt-3 text-white text-sm text-center max-w-xl">
            <p className="font-semibold">{photo.title}</p>
            {photo.description && <p className="text-white/60 text-xs mt-1">{photo.description}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Hook: fotoyu Supabase Storage'tan signed URL ile çek.
// Foto path'leri autoixpert_photos.storage_path kolonunda (sanitize edilmiş).
// 1 saatlik signed URL — admin RLS + storage policy ile yetki kontrolü.
function useAutoiXpertPhoto(reportId, photoId, variant = 'original') {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!reportId || !photoId) {
      setLoading(false);
      setError('Eksik id');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const sb = getSupabaseClient();
        if (!sb) throw new Error('Supabase yok');

        // 1. autoixpert_photos tablosundan storage_path al
        const { data: row, error: qErr } = await sb
          .from('autoixpert_photos')
          .select('storage_path, storage_bucket, download_status')
          .eq('id', photoId)
          .maybeSingle();
        if (qErr) throw new Error(qErr.message);
        if (!row) throw new Error('Foto kaydı yok');
        if (row.download_status !== 'done' || !row.storage_path) {
          throw new Error('Foto henüz indirilmemiş');
        }

        // 2. Signed URL üret (1 saat geçerli)
        const bucket = row.storage_bucket || 'autoixpert-photos';
        const { data: signed, error: sErr } = await sb.storage
          .from(bucket)
          .createSignedUrl(row.storage_path, 3600);
        if (sErr) throw new Error(sErr.message);
        if (!signed?.signedUrl) throw new Error('Signed URL üretilemedi');

        if (cancelled) return;
        setSrc(signed.signedUrl);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Foto yüklenemedi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [reportId, photoId, variant, reloadKey]);

  return { src, loading, error, retry: () => setReloadKey((k) => k + 1) };
}

// ─── Read-only field helper ───────────────────────────────────────────
function ReadField({ label, value, span = 1 }) {
  const display = value === null || value === undefined || value === ''
    ? '—'
    : (typeof value === 'object' ? JSON.stringify(value) : String(value));
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div className="text-xs uppercase tracking-wider mb-1" style={{ color: C.textDim, letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div className="text-sm font-medium px-3 py-2 rounded-lg break-words"
        style={{ background: 'rgba(0,0,0,0.03)', color: C.text, minHeight: '2.4rem' }}>
        {display}
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="rounded-2xl p-5 mb-5"
      style={{ background: '#fff', border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="text-base font-bold" style={{ color: C.text }}>{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

// HTML strip — AutoiXpert <p>...</p> içerir
function stripHtml(s) {
  if (!s || typeof s !== 'string') return s;
  return s.replace(/<[^>]+>/g, '').trim();
}

// Tarih: ISO → "10.06.2022"
function fmtDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('de-DE');
  } catch { return iso; }
}

// ─── Fahrzeug Section ─────────────────────────────────────────────────
function FahrzeugSection({ report }) {
  const car = report?.car || {};
  const axles = Array.isArray(car.axles) ? car.axles : [];

  return (
    <div>
      <SectionCard icon="🚘" title="Identifikation">
        <ReadField label="Marke" value={car.make} />
        <ReadField label="Modell" value={car.model} />
        <ReadField label="Kennzeichen" value={car.license_plate} />
        <ReadField label="VIN" value={car.vin} span={2} />
        <ReadField label="Karosserieform" value={car.shape || car.custom_shape_label} />
      </SectionCard>

      <SectionCard icon="📊" title="Leistung & Kilometerstand">
        <ReadField label="Leistung (kW)" value={car.performance_kw} />
        <ReadField label="Leistung (PS)" value={car.performance_hp} />
        <ReadField label="Kilometerstand" value={car.mileage_meter ? car.mileage_meter.toLocaleString('de-DE') + ' km' : null} />
        <ReadField label="Geschätzt" value={car.mileage_estimated ? car.mileage_estimated.toLocaleString('de-DE') + ' km' : null} />
        <ReadField label="Lt. Angabe" value={car.mileage_as_stated} />
      </SectionCard>

      <SectionCard icon="📅" title="Zulassung & Wartung">
        <ReadField label="Erstzulassung" value={fmtDate(car.first_registration_date)} />
        <ReadField label="Letzte Zulassung" value={fmtDate(car.latest_registration_date)} />
        <ReadField label="Nächste HU" value={fmtDate(car.next_general_inspection_date)} />
        <ReadField label="Letzte Inspektion" value={fmtDate(car.last_service_date)} />
        <ReadField label="Insp. km" value={car.last_service_mileage} />
        <ReadField label="Servicebuch komplett" value={car.service_book_complete === null ? null : (car.service_book_complete ? 'Ja' : 'Nein')} />
      </SectionCard>

      <SectionCard icon="🛠️" title="Zustand">
        <ReadField label="Allgemein" value={car.general_condition} />
        <ReadField label="Karosserie" value={car.body_condition} />
        <ReadField label="Lack" value={car.paint_condition} />
        <ReadField label="Innenraum" value={car.interior_condition} />
        <ReadField label="Fahrtüchtigkeit" value={car.roadworthiness} />
        <ReadField label="Kommentar" value={car.condition_comment} span={3} />
      </SectionCard>

      <SectionCard icon="📝" title="Vorschäden">
        <ReadField label="Reparierte Vorschäden" value={stripHtml(car.repaired_previous_damage)} span={3} />
        <ReadField label="Unreparierte Vorschäden" value={stripHtml(car.unrepaired_previous_damage)} span={3} />
      </SectionCard>

      {axles.length > 0 && (
        <SectionCard icon="🛞" title={`Achsen & Reifen (${axles.length})`}>
          {axles.map((a, i) => (
            <div key={i}
              className="rounded-xl p-3 mt-1"
              style={{ gridColumn: 'span 3', background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.border}` }}>
              <div className="font-semibold text-sm mb-2" style={{ color: C.text }}>
                Achse {a.axle_number} — {a.axle_position} {a.is_steerable ? '· lenkbar' : ''}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {a.left_tire && (
                  <ReadField label={`Links (${a.left_tire.season || ''})`}
                    value={`${a.left_tire.type || '?'} · ${a.left_tire.tread_in_mm ?? '?'} mm`} />
                )}
                {a.right_tire && (
                  <ReadField label={`Rechts (${a.right_tire.season || ''})`}
                    value={`${a.right_tire.type || '?'} · ${a.right_tire.tread_in_mm ?? '?'} mm`} />
                )}
              </div>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}

// ─── Unfall Section ───────────────────────────────────────────────────
function UnfallSection({ report }) {
  const a = report?.accident || {};
  const empty = !a.date && !a.time && !a.location && !a.circumstances && !a.police_department;

  return (
    <div>
      <SectionCard icon="💥" title="Unfalldaten">
        <ReadField label="Datum" value={fmtDate(a.date)} />
        <ReadField label="Uhrzeit" value={a.time} />
        <ReadField label="Ort" value={a.location} span={3} />
        <ReadField label="Hergang" value={stripHtml(a.circumstances)} span={3} />
      </SectionCard>

      <SectionCard icon="👮" title="Polizei">
        <ReadField label="Dienststelle" value={a.police_department} span={2} />
        <ReadField label="Aktenzeichen" value={a.police_case_number} />
      </SectionCard>

      {empty && (
        <div className="rounded-2xl p-8 text-center mt-4"
          style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
          <p className="text-sm" style={{ color: C.textDim }}>
            Bu rapor için unfalldaten henüz girilmemiş.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Schaden Section ──────────────────────────────────────────────────
function SchadenSection({ report }) {
  const d = report?.damage || {};
  const keys = Object.keys(d).filter((k) => d[k] !== null && d[k] !== '' && (typeof d[k] !== 'object' || (Array.isArray(d[k]) ? d[k].length : Object.keys(d[k] || {}).length)));

  if (keys.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center"
        style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
        <div className="text-5xl mb-4">🔧</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: C.text }}>Keine Schadenangaben</h2>
        <p className="text-sm" style={{ color: C.textDim }}>
          Bu rapor için schaden detayları AutoiXpert'te boş.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionCard icon="🔧" title="Schaden">
        {keys.map((k) => (
          <ReadField key={k} label={k.replace(/_/g, ' ')}
            value={typeof d[k] === 'string' ? stripHtml(d[k]) : d[k]}
            span={typeof d[k] === 'string' && d[k].length > 80 ? 3 : 1} />
        ))}
      </SectionCard>
    </div>
  );
}

// ─── Kalkulation Section ──────────────────────────────────────────────
function KalkulationSection({ report }) {
  const visits = Array.isArray(report?.raw_payload?.visits) ? report.raw_payload.visits : [];
  const measurements = Array.isArray(report?.paint_thickness_measurements) ? report.paint_thickness_measurements : [];
  const damage = report?.damage;

  return (
    <div>
      <SectionCard icon="🧮" title="Kalkulation Einstellungen">
        <ReadField label="Faktoring" value={report?.use_factoring ? 'Ja' : 'Nein'} />
        <ReadField label="DEKRA Honorar" value={report?.use_dekra_fees ? 'Ja' : 'Nein'} />
        <ReadField label="VIN geprüft" value={report?.vin_was_checked ? 'Ja' : 'Nein'} />
        <ReadField label="Probefahrt" value={report?.test_drive_carried_out ? 'Ja' : 'Nein'} />
        <ReadField label="Datenquelle" value={report?.source_of_technical_data} />
        <ReadField label="Bestelldatum" value={fmtDate(report?.order_date)} />
      </SectionCard>

      {visits.length > 0 && (
        <SectionCard icon="📍" title={`Besichtigungen (${visits.length})`}>
          {visits.map((v, i) => (
            <div key={v.id || i}
              className="rounded-xl p-3"
              style={{ gridColumn: 'span 3', background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.border}` }}>
              <div className="font-semibold text-sm mb-2" style={{ color: C.text }}>
                {fmtDate(v.date)} · {v.time || ''} — {v.location_name || 'unbekannt'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ReadField label="Adresse" value={[v.street, v.zip, v.city].filter(Boolean).join(', ')} span={2} />
                <ReadField label="Bedingungen" value={v.conditions} />
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {measurements.length > 0 && (
        <SectionCard icon="🎨" title={`Lackschichtdicke (${measurements.length} Messung)`}>
          {measurements.slice(0, 12).map((m, i) => (
            <ReadField key={i}
              label={m.position || `Messpunkt ${i + 1}`}
              value={m.value !== null && m.value !== undefined ? `${m.value} µm` : '—'} />
          ))}
          {measurements.length > 12 && (
            <div className="text-xs italic" style={{ color: C.textDim, gridColumn: 'span 3' }}>
              … +{measurements.length - 12} weitere Messungen
            </div>
          )}
        </SectionCard>
      )}

      {report?.paint_thickness_measurement_comment && (
        <SectionCard icon="📝" title="Lackmessungs-Kommentar">
          <ReadField label="" value={stripHtml(report.paint_thickness_measurement_comment)} span={3} />
        </SectionCard>
      )}

      {damage && Object.keys(damage).filter((k) => damage[k]).length > 0 && (
        <SectionCard icon="🔧" title="Schaden-Kalkulation">
          {Object.entries(damage).filter(([_, v]) => v).map(([k, v]) => (
            <ReadField key={k} label={k.replace(/_/g, ' ')}
              value={typeof v === 'string' ? stripHtml(v) : v}
              span={typeof v === 'string' && v.length > 80 ? 3 : 1} />
          ))}
        </SectionCard>
      )}

      {visits.length === 0 && measurements.length === 0 && !damage && (
        <div className="rounded-2xl p-8 text-center mt-4"
          style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
          <p className="text-sm" style={{ color: C.textDim }}>
            Bu rapor için kalkülasyon detayları henüz girilmemiş.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Druck Section ────────────────────────────────────────────────────
const DOC_TYPE_LABELS = {
  report: { label: 'Gutachten', icon: '📋' },
  invoice: { label: 'Rechnung', icon: '🧾' },
  letter_claimant: { label: 'Anschreiben Anspruchsteller', icon: '✉️' },
  letter_garage: { label: 'Anschreiben Werkstatt', icon: '✉️' },
  letter_lawyer: { label: 'Anschreiben Anwalt', icon: '✉️' },
  letter_insurance: { label: 'Anschreiben Versicherung', icon: '✉️' },
  letter_author_of_damage: { label: 'Anschreiben Schädiger', icon: '✉️' },
  letter_owner: { label: 'Anschreiben Halter', icon: '✉️' },
  letter_intermediary: { label: 'Anschreiben Vermittler', icon: '✉️' },
};

function DruckSection({ report }) {
  const allDocuments = Array.isArray(report?.raw_payload?.documents) ? report.raw_payload.documents : [];
  const [loading, setLoading] = useState(null);
  const [docStates, setDocStates] = useState(null); // null = henüz yüklenmedi
  const [statesLoading, setStatesLoading] = useState(true);

  useEffect(() => {
    if (!report?.id) return;
    let cancelled = false;
    setStatesLoading(true);
    (async () => {
      const sb = getSupabaseClient();
      if (!sb) { setStatesLoading(false); return; }
      const { data, error } = await sb
        .from('autoixpert_documents')
        .select('id, storage_path, storage_bucket, download_status')
        .eq('report_id', report.id)
        .eq('download_status', 'done');
      if (cancelled) return;
      if (error) { console.error('[DruckSection]', error.message); setStatesLoading(false); return; }
      const map = {};
      for (const r of data || []) map[r.id] = r;
      setDocStates(map);
      setStatesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [report?.id]);

  // SADECE gerçekten indirilmiş ve storage'da olan PDF'leri göster
  const documents = docStates ? allDocuments.filter((d) => d?.id && docStates[d.id]) : [];

  const openDocument = async (doc) => {
    if (loading) return;
    setLoading(doc.id);
    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error('Supabase yok');
      const state = (docStates || {})[doc.id];
      if (!state || state.download_status !== 'done' || !state.storage_path) {
        throw new Error('PDF henüz indirilmemiş — toplu indirme tamamlandığında erişilebilir');
      }
      const bucket = state.storage_bucket || 'autoixpert-documents';
      const { data: signed, error } = await sb.storage.from(bucket).createSignedUrl(state.storage_path, 3600);
      if (error) throw new Error(error.message);
      if (!signed?.signedUrl) throw new Error('Signed URL üretilemedi');
      window.open(signed.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert('PDF açılamadı: ' + (e?.message || 'bilinmeyen hata'));
    } finally {
      setLoading(null);
    }
  };

  if (statesLoading) {
    return (
      <div className="rounded-2xl p-12 text-center"
        style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
        <div className="text-5xl mb-4 animate-pulse">🖨️</div>
        <p className="text-sm" style={{ color: C.textDim }}>Dokümanlar yükleniyor…</p>
      </div>
    );
  }

  if (documents.length === 0) {
    const totalInPayload = allDocuments.length;
    return (
      <div className="rounded-2xl p-12 text-center"
        style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
        <div className="text-5xl mb-4">🖨️</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: C.text }}>Keine Dokumente</h2>
        <p className="text-sm" style={{ color: C.textDim }}>
          {totalInPayload > 0
            ? `Bu rapora ait ${totalInPayload} doküman henüz indirilmemiş. Yöneticiye bildir.`
            : 'Bu rapor için PDF dokümanları AutoiXpert\'te oluşturulmamış.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionCard icon="🖨️" title={`Dokumente (${documents.length})`}>
        <div style={{ gridColumn: 'span 3' }} className="space-y-2">
          {documents.map((d) => {
            const meta = DOC_TYPE_LABELS[d.type] || { label: d.title || d.type, icon: '📄' };
            return (
              <button key={d.id}
                onClick={() => openDocument(d)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-blue-50"
                style={{ background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.border}` }}>
                <span className="text-2xl">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: C.text }}>
                    {d.title || meta.label}
                  </div>
                  <div className="text-xs" style={{ color: C.textDim }}>
                    {meta.label} · {d.type}
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: loading === d.id ? '#94A3B8' : '#3B82F6', color: '#fff' }}>
                  {loading === d.id ? 'Lädt…' : 'PDF Öffnen ↗'}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="text-xs italic mt-3 px-3" style={{ color: C.textDim }}>
        ℹ️ PDF'ler Supabase Storage'dan signed URL ile servis edilir. Yeni sekmede açılır.
      </div>
    </div>
  );
}

// ─── Placeholder Tab ──────────────────────────────────────────────────
function PlaceholderTab({ tab }) {
  return (
    <div className="rounded-2xl p-12 text-center"
      style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
      <div className="text-5xl mb-4">{tab?.icon}</div>
      <h2 className="text-xl font-bold mb-2" style={{ color: C.text }}>{tab?.label}</h2>
      <p className="text-sm" style={{ color: C.textDim }}>
        Bu sekme yakında eklenecek. Şu anda sadece <strong>Beteiligte</strong> sekmesi düzenlenebilir.
      </p>
      <div className="max-w-md mx-auto mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}>
            <div className="w-10 h-10 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(0,0,0,0.06)' }} />
              <div className="h-2 rounded-full w-1/2" style={{ background: 'rgba(0,0,0,0.04)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
