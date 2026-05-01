// AutoiXpert tarzı Gutachten Editörü
// app.autoixpert.de/Gutachten/{id}/Beteiligte sayfasının klonu.
//
// Üstte tab navigasyonu (Beteiligte / Fahrzeug / Unfall / ...)
// Beteiligte: 8 collapsible party kartı, her birinde düzenlenebilir form
// Save: autoixpert_reports tablosuna UPSERT (yerel mirror)

import React, { useState, useMemo } from 'react';
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
export default function GutachtenWorkbench({ report, onBack }) {
  const [activeTab, setActiveTab] = useState('beteiligte');
  const [draft, setDraft] = useState(() => structuredClone(report || {}));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [errMsg, setErrMsg] = useState(null);

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
        <button
          type="button"
          onClick={onBack}
          className="text-sm mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: C.textDim, border: `1px solid ${C.border}` }}
        >
          ← Liste
        </button>
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

      {activeTab !== 'beteiligte' && (
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
