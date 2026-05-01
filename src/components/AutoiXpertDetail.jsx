// AutoiXpert kayit detay görünümleri
// Rapor / Kontakt / Fatura için tam alanları organize bölümlerde gösterir.
// AutoiXpert'in orijinal Gutachten editörü mantığında: her party / car / accident
// kendi kart bölümü olarak.

import React from 'react';
import { motion } from 'framer-motion';
import { C } from '../utils/tokens.js';

// ─── Yardımcılar ─────────────────────────────────────────────────────

function fmtDate(v) {
  if (!v) return null;
  try {
    return new Date(v).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return String(v); }
}

function fmtDateTime(v) {
  if (!v) return null;
  try {
    return new Date(v).toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return String(v); }
}

function fmtBool(v) {
  if (v === true) return 'Ja';
  if (v === false) return 'Nein';
  return null;
}

function fmtNumber(v, decimals = 2) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtMoney(v) {
  const f = fmtNumber(v, 2);
  return f ? `${f} €` : null;
}

function isEmpty(v) {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && Object.keys(v).length === 0) return true;
  return false;
}

// ─── Düzen bileşenleri ────────────────────────────────────────────────

export function DetailLayout({ title, subtitle, badges, onBack, children }) {
  return (
    <div>
      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 text-sm rounded-lg transition-colors hover:bg-black/5"
          style={{ color: C.textDim, border: `1px solid ${C.border}` }}
        >
          ← Liste
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold mb-1" style={{ color: C.text }}>{title}</h1>
          {subtitle && <p className="text-sm" style={{ color: C.textDim }}>{subtitle}</p>}
          {badges && badges.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">{badges}</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export function Section({ title, icon, children, fullWidth = false, empty = false }) {
  if (empty) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl ${fullWidth ? 'lg:col-span-2' : ''}`}
      style={{ background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.border}` }}
    >
      <header className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: C.border }}>
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>{title}</h2>
      </header>
      <div className="p-5 space-y-3">{children}</div>
    </motion.section>
  );
}

export function Field({ label, value, mono = false }) {
  if (isEmpty(value)) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>{label}</span>
      <span
        className={mono ? 'font-mono text-xs' : 'text-sm'}
        style={{ color: C.text, wordBreak: 'break-word' }}
      >
        {value}
      </span>
    </div>
  );
}

export function FieldGrid({ children, cols = 2 }) {
  const colClass = cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1';
  return <div className={`grid ${colClass} gap-3`}>{children}</div>;
}

export function Badge({ tone = 'info', children }) {
  const tones = {
    success: { bg: 'rgba(16,185,129,0.10)', color: '#059669', border: 'rgba(16,185,129,0.30)' },
    warn:    { bg: 'rgba(245,158,11,0.10)', color: '#D97706', border: 'rgba(245,158,11,0.30)' },
    error:   { bg: 'rgba(239,68,68,0.10)',  color: '#DC2626', border: 'rgba(239,68,68,0.30)' },
    info:    { bg: 'rgba(99,102,241,0.10)', color: '#4F46E5', border: 'rgba(99,102,241,0.30)' },
    neutral: { bg: 'rgba(0,0,0,0.05)',      color: C.textDim, border: C.border },
  };
  const t = tones[tone] || tones.info;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}
    >
      {children}
    </span>
  );
}

function PartySection({ title, icon, party }) {
  if (!party) return null;
  if (Object.values(party).every(isEmpty)) return null;

  const fullName = [party.salutation, party.first_name, party.last_name].filter(Boolean).join(' ');
  const address = [party.street_and_housenumber_or_lockbox, [party.zip, party.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

  return (
    <Section title={title} icon={icon}>
      {party.organization_name && (
        <Field label="Firma / Organisation" value={party.organization_name} />
      )}
      {fullName && (
        <Field label="Name" value={fullName} />
      )}
      <FieldGrid>
        <Field label="E-Mail" value={party.email} />
        <Field label="Telefon" value={party.phone} mono />
        {party.phone2 && <Field label="Telefon 2" value={party.phone2} mono />}
        {party.license_plate && <Field label="Kennzeichen" value={party.license_plate} mono />}
      </FieldGrid>
      {address && <Field label="Adresse" value={address} />}
      <FieldGrid>
        {party.case_number && <Field label="Aktenzeichen" value={party.case_number} mono />}
        {party.contract_number && <Field label="Versicherungsnummer" value={party.contract_number} mono />}
        {party.vat_id && <Field label="USt-IdNr." value={party.vat_id} mono />}
        {party.iban && <Field label="IBAN" value={party.iban} mono />}
      </FieldGrid>
      <FieldGrid>
        {fmtMoney(party.deductible_partial_kasko) && (
          <Field label="SB Teilkasko" value={fmtMoney(party.deductible_partial_kasko)} />
        )}
        {fmtMoney(party.deductible_full_kasko) && (
          <Field label="SB Vollkasko" value={fmtMoney(party.deductible_full_kasko)} />
        )}
        {party.is_owner !== undefined && party.is_owner !== null && (
          <Field label="Ist Halter" value={fmtBool(party.is_owner)} />
        )}
        {party.may_deduct_taxes !== undefined && party.may_deduct_taxes !== null && (
          <Field label="Vorsteuerabzug" value={fmtBool(party.may_deduct_taxes)} />
        )}
        {party.represented_by_lawyer !== undefined && party.represented_by_lawyer !== null && (
          <Field label="Vertreten durch Anwalt" value={fmtBool(party.represented_by_lawyer)} />
        )}
      </FieldGrid>
      {party.notes && <Field label="Notizen" value={party.notes} />}
    </Section>
  );
}

// ─── Rapor (Gutachten) Detay ──────────────────────────────────────────

const REPORT_TYPE_LABELS = {
  liability: 'Haftpflichtgutachten',
  short_assessment: 'Kostenvoranschlag / Kurzgutachten',
  partial_kasko: 'Teilkaskogutachten',
  full_kasko: 'Vollkaskogutachten',
  valuation: 'Wertgutachten',
  oldtimer_valuation_small: 'Oldtimer-Wertgutachten (klein)',
  lease_return: 'Leasingrückläufer',
  used_vehicle_check: 'Gebrauchtwagencheck',
  invoice_audit: 'Rechnungsprüfung',
};

const STATE_TONES = {
  done: 'success',
  recorded: 'warn',
  locked: 'success',
  deleted: 'error',
};

const STATE_LABELS = {
  done: 'Abgeschlossen',
  recorded: 'In Bearbeitung',
  locked: 'Gesperrt',
  deleted: 'Gelöscht',
};

export function ReportDetail({ report, onBack }) {
  const r = report;
  const typeLabel = REPORT_TYPE_LABELS[r.type] || r.type;
  const stateTone = STATE_TONES[r.state] || 'info';
  const stateLabel = STATE_LABELS[r.state] || r.state;

  const claimantName =
    r.claimant?.organization_name ||
    [r.claimant?.first_name, r.claimant?.last_name].filter(Boolean).join(' ') ||
    'Unbekannt';

  return (
    <DetailLayout
      title={`Gutachten ${r.token || r.id}`}
      subtitle={`${typeLabel} · ${claimantName}`}
      onBack={onBack}
      badges={[
        <Badge key="state" tone={stateTone}>{stateLabel}</Badge>,
        <Badge key="type" tone="info">{r.type}</Badge>,
      ]}
    >
      {/* Stammdaten */}
      <Section title="Stammdaten" icon="📋">
        <FieldGrid>
          <Field label="Aktenzeichen" value={r.token} mono />
          <Field label="AutoiXpert ID" value={r.id} mono />
          <Field label="Externe ID" value={r.external_id} mono />
          <Field label="Status" value={stateLabel} />
          <Field label="Auftragsdatum" value={fmtDate(r.order_date)} />
          <Field label="Fertigstellungsdatum" value={fmtDate(r.completion_date)} />
          <Field label="Erstellt am" value={fmtDateTime(r.created_at)} />
          <Field label="Standort" value={r.location_id} />
          <Field label="Sachverständiger" value={r.responsible_assessor_id} />
        </FieldGrid>
      </Section>

      {/* Konfiguration */}
      <Section title="Konfiguration" icon="⚙️">
        <FieldGrid>
          <Field label="Faktoring aktiv" value={fmtBool(r.use_factoring)} />
          <Field label="DEKRA-Sätze nutzen" value={fmtBool(r.use_dekra_fees)} />
          <Field label="VIN geprüft" value={fmtBool(r.vin_was_checked)} />
          <Field label="Probefahrt" value={fmtBool(r.test_drive_carried_out)} />
        </FieldGrid>
        {r.source_of_technical_data && (
          <Field label="Quelle technische Daten" value={r.source_of_technical_data} />
        )}
      </Section>

      {/* Beteiligte Parteien */}
      <PartySection title="Anspruchsteller" icon="👤" party={r.claimant} />
      <PartySection title="Halter d. Anspruchstellerfahrzeugs" icon="🚗" party={r.owner_of_claimants_car} />
      <PartySection title="Schadenverursacher" icon="⚠️" party={r.author_of_damage} />
      <PartySection title="Halter d. Schädiger-Fahrzeugs" icon="🚙" party={r.owner_of_author_of_damages_car} />
      <PartySection title="Versicherung" icon="🛡️" party={r.insurance} />
      <PartySection title="Werkstatt" icon="🔧" party={r.garage} />
      <PartySection title="Anwalt" icon="⚖️" party={r.lawyer} />
      <PartySection title="Vermittler" icon="🤝" party={r.intermediary} />

      {/* Fahrzeug */}
      {r.car && Object.values(r.car).some((v) => !isEmpty(v)) && (
        <Section title="Fahrzeug" icon="🚘" fullWidth>
          <FieldGrid cols={3}>
            <Field label="Kennzeichen" value={r.car.license_plate} mono />
            <Field label="VIN" value={r.car.vin} mono />
            <Field label="Hersteller" value={r.car.make} />
            <Field label="Modell" value={r.car.model} />
            <Field label="Fahrzeugart" value={r.car.shape} />
            <Field label="Leistung kW" value={fmtNumber(r.car.performance_kw, 0)} />
            <Field label="Leistung PS" value={fmtNumber(r.car.performance_hp, 0)} />
            <Field label="Erstzulassung" value={fmtDate(r.car.first_registration_date)} />
            <Field label="Letzte Zulassung" value={fmtDate(r.car.latest_registration_date)} />
            <Field label="Nächste HU" value={fmtDate(r.car.next_general_inspection_date)} />
            <Field label="Kilometerstand (Tacho)" value={fmtNumber(r.car.mileage_meter, 0)} />
            <Field label="Kilometerstand (geschätzt)" value={fmtNumber(r.car.mileage_estimated, 0)} />
          </FieldGrid>
          <FieldGrid>
            <Field label="Allgemeinzustand" value={r.car.general_condition} />
            <Field label="Lackzustand" value={r.car.paint_condition} />
            <Field label="Karosseriezustand" value={r.car.body_condition} />
            <Field label="Innenraumzustand" value={r.car.interior_condition} />
          </FieldGrid>
          {r.car.condition_comment && <Field label="Bemerkung Zustand" value={r.car.condition_comment} />}
          {r.car.damage_description && <Field label="Schadenbeschreibung" value={r.car.damage_description} />}
          {r.car.repaired_previous_damage && <Field label="Vorschäden (repariert)" value={r.car.repaired_previous_damage} />}
          {r.car.unrepaired_previous_damage && <Field label="Vorschäden (nicht repariert)" value={r.car.unrepaired_previous_damage} />}

          {Array.isArray(r.car.axles) && r.car.axles.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textDim }}>Achsen ({r.car.axles.length})</p>
              <div className="space-y-2">
                {r.car.axles.map((axle, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.03)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: C.text }}>
                      Achse {axle.axle_number} ({axle.axle_position})
                    </p>
                    <FieldGrid cols={3}>
                      <Field label="Achslast" value={fmtNumber(axle.axle_load, 0)} />
                      <Field label="Lenkbar" value={fmtBool(axle.is_steerable)} />
                      {axle.left_tire?.type && <Field label="Reifen links" value={`${axle.left_tire.type} (${axle.left_tire.tread_in_mm}mm)`} mono />}
                      {axle.right_tire?.type && <Field label="Reifen rechts" value={`${axle.right_tire.type} (${axle.right_tire.tread_in_mm}mm)`} mono />}
                    </FieldGrid>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Unfall */}
      {r.accident && Object.values(r.accident).some((v) => !isEmpty(v)) && (
        <Section title="Unfall" icon="💥">
          <FieldGrid>
            <Field label="Unfallort" value={r.accident.location} />
            <Field label="Unfalldatum" value={fmtDate(r.accident.date)} />
            <Field label="Unfallzeit" value={fmtDateTime(r.accident.time)} />
            <Field label="Polizei-Az." value={r.accident.police_case_number} mono />
            <Field label="Polizeidienststelle" value={r.accident.police_department} />
          </FieldGrid>
          {r.accident.circumstances && (
            <div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>Hergang</span>
              <div
                className="text-sm mt-1"
                style={{ color: C.text }}
                dangerouslySetInnerHTML={{ __html: r.accident.circumstances }}
              />
            </div>
          )}
        </Section>
      )}

      {/* Lackschichtdickenmessung */}
      {Array.isArray(r.paint_thickness_measurements) && r.paint_thickness_measurements.length > 0 && (
        <Section title="Lackschichtdicken" icon="🎨" fullWidth>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {r.paint_thickness_measurements.map((m, i) => (
              <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.03)' }}>
                <p className="text-[11px] font-semibold" style={{ color: C.text }}>{m.title || m.position}</p>
                {Array.isArray(m.values) && m.values.length > 0 && (
                  <p className="text-xs font-mono" style={{ color: C.textDim }}>
                    {m.values.join(', ')} µm
                  </p>
                )}
                {m.manual_type && <p className="text-[10px]" style={{ color: C.textDim }}>{m.manual_type}</p>}
                {m.no_measurement_reason && <p className="text-[10px] italic" style={{ color: C.textDim }}>⚠ {m.no_measurement_reason}</p>}
              </div>
            ))}
          </div>
          {r.paint_thickness_measurement_comment && (
            <Field label="Kommentar zur Lackmessung" value={r.paint_thickness_measurement_comment} />
          )}
        </Section>
      )}

      {/* Etiketten */}
      {Array.isArray(r.labels) && r.labels.length > 0 && (
        <Section title="Etiketten" icon="🏷️">
          <div className="flex flex-wrap gap-2">
            {r.labels.map((l, i) => {
              const name = typeof l === 'string' ? l : (l.name || l.id);
              const color = typeof l === 'object' ? l.color : null;
              return (
                <span
                  key={i}
                  className="inline-block px-2 py-1 rounded text-xs"
                  style={{
                    background: color ? `${color}22` : 'rgba(0,0,0,0.05)',
                    color: color || C.text,
                    border: `1px solid ${color ? `${color}55` : C.border}`,
                  }}
                >
                  {name}
                </span>
              );
            })}
          </div>
        </Section>
      )}

      {/* Custom Fields */}
      {r.custom_fields && Object.keys(r.custom_fields).length > 0 && (
        <Section title="Eigene Felder" icon="📝">
          <FieldGrid>
            {Object.entries(r.custom_fields).map(([k, v]) => (
              <Field
                key={k}
                label={k}
                value={typeof v === 'boolean' ? fmtBool(v) : v}
              />
            ))}
          </FieldGrid>
        </Section>
      )}

      {/* Lease Return */}
      {r.lease_return && Object.values(r.lease_return).some((v) => !isEmpty(v)) && (
        <Section title="Leasingrückläufer" icon="📦" fullWidth>
          <FieldGrid>
            <Field label="Titel" value={r.lease_return.title} />
            <Field label="Restwert (%)" value={fmtNumber(r.lease_return.relative_residual_value, 1)} />
            <Field label="Besteuerung" value={r.lease_return.lease_return_item_taxation_type} />
          </FieldGrid>
          {Array.isArray(r.lease_return.sections) && r.lease_return.sections.map((s, i) => (
            <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: C.text }}>{s.title}</p>
              {Array.isArray(s.items) && s.items.length > 0 ? (
                <div className="space-y-2">
                  {s.items.map((it, j) => (
                    <div key={j} className="text-xs" style={{ color: C.textDim }}>
                      <span style={{ color: C.text }}>{it.title}</span>
                      {it.repair_costs_gross != null && <> · Reparatur: {fmtMoney(it.repair_costs_gross)}</>}
                      {it.above_average_wear_costs_gross != null && it.above_average_wear_costs_gross > 0 && <> · Verschleiß: {fmtMoney(it.above_average_wear_costs_gross)}</>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: C.textDim }}>(keine Positionen)</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Sync Meta */}
      <Section title="Synchronisation" icon="🔄" fullWidth>
        <FieldGrid cols={3}>
          <Field label="Letzte Sync" value={fmtDateTime(r.synced_at)} />
          <Field label="Externe Aktualisierung" value={fmtDateTime(r.external_updated_at)} />
          <Field label="Datenquelle" value="AutoiXpert Mirror" />
        </FieldGrid>
      </Section>

      {/* Ham JSON (debug) */}
      <RawJsonSection record={r} />
    </DetailLayout>
  );
}

// ─── Kontakt Detay ────────────────────────────────────────────────────

const ORG_TYPE_LABELS = {
  claimant: 'Anspruchsteller',
  insurance: 'Versicherung',
  garage: 'Werkstatt',
  lawyer: 'Anwalt',
  visit_location_favorite: 'Besichtigungsort (Favorit)',
};

export function ContactDetail({ contact, onBack }) {
  const c = contact;
  const fullName = c.organization_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unbekannt';
  const orgLabel = ORG_TYPE_LABELS[c.organization_type] || c.organization_type;

  return (
    <DetailLayout
      title={fullName}
      subtitle={orgLabel}
      onBack={onBack}
      badges={[<Badge key="t" tone="info">{c.organization_type}</Badge>]}
    >
      <Section title="Stammdaten" icon="📇">
        <FieldGrid>
          <Field label="Anrede" value={c.salutation} />
          <Field label="Vorname" value={c.first_name} />
          <Field label="Nachname" value={c.last_name} />
          <Field label="Firma" value={c.organization_name} />
          <Field label="AutoiXpert ID" value={c.id} mono />
          <Field label="Externe ID" value={c.external_id} mono />
          <Field label="Erstellt am" value={fmtDateTime(c.created_at)} />
        </FieldGrid>
      </Section>

      <Section title="Kontakt" icon="📞">
        <FieldGrid>
          <Field label="E-Mail" value={c.email} />
          <Field label="Telefon" value={c.phone} mono />
          <Field label="Telefon 2" value={c.phone2} mono />
        </FieldGrid>
        <Field label="Adresse" value={[c.street_and_housenumber_or_lockbox, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')} />
      </Section>

      <Section title="Steuer & Buchhaltung" icon="🧾">
        <FieldGrid>
          <Field label="USt-IdNr." value={c.vat_id} mono />
          <Field label="Debitorennummer" value={c.debtor_number} mono />
          <Field label="Vorsteuerabzug" value={fmtBool(c.may_deduct_taxes)} />
        </FieldGrid>
      </Section>

      {c.notes && (
        <Section title="Notizen" icon="📝" fullWidth>
          <p className="text-sm whitespace-pre-wrap" style={{ color: C.text }}>{c.notes}</p>
        </Section>
      )}

      {/* Werkstatt-Kostensätze */}
      {Array.isArray(c.garage_fee_sets) && c.garage_fee_sets.length > 0 && (
        <Section title={`Werkstatt-Kostensätze (${c.garage_fee_sets.length})`} icon="💰" fullWidth>
          <div className="space-y-3">
            {c.garage_fee_sets.map((fs, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.03)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{fs.title}</p>
                  {fs.is_default && <Badge tone="success">Standard</Badge>}
                </div>
                <FieldGrid cols={3}>
                  <Field label="Gültig ab" value={fmtDate(fs.valid_from)} />
                  <Field label="AW-Einheit" value={fs.selected_work_fraction_unit} />
                  <Field label="Beulen €/h" value={fmtMoney(fs.dents_wage)} />
                  {fs.mechanics && <Field label="Mechanik (1/2/3)" value={`${fs.mechanics.first_level} / ${fs.mechanics.second_level} / ${fs.mechanics.third_level}`} mono />}
                  {fs.electrics && <Field label="Elektrik (1/2/3)" value={`${fs.electrics.first_level} / ${fs.electrics.second_level} / ${fs.electrics.third_level}`} mono />}
                  {fs.car_body && <Field label="Karosserie (1/2/3)" value={`${fs.car_body.first_level} / ${fs.car_body.second_level} / ${fs.car_body.third_level}`} mono />}
                  {fs.car_paint && <Field label="Lackierung €/h" value={fmtMoney(fs.car_paint.wage)} />}
                  {fs.car_paint?.paint_system && <Field label="Lacksystem" value={fs.car_paint.paint_system} />}
                </FieldGrid>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Synchronisation" icon="🔄" fullWidth>
        <FieldGrid cols={3}>
          <Field label="Letzte Sync" value={fmtDateTime(c.synced_at)} />
          <Field label="Externe Aktualisierung" value={fmtDateTime(c.external_updated_at)} />
          <Field label="Zuletzt gesehen" value={fmtDateTime(c.last_seen_at)} />
        </FieldGrid>
      </Section>

      <RawJsonSection record={c} />
    </DetailLayout>
  );
}

// ─── Fatura Detay ─────────────────────────────────────────────────────

export function InvoiceDetail({ invoice, onBack }) {
  const i = invoice;
  const recipientName = i.recipient?.organization_name
    || [i.recipient?.first_name, i.recipient?.last_name].filter(Boolean).join(' ')
    || 'Unbekannt';

  const tone = i.is_fully_canceled ? 'error' : i.has_outstanding_payments ? 'warn' : 'success';
  const stateLabel = i.is_fully_canceled ? 'Vollständig storniert' : i.has_outstanding_payments ? 'Offen' : 'Bezahlt';

  return (
    <DetailLayout
      title={`Rechnung ${i.number || i.id}`}
      subtitle={recipientName}
      onBack={onBack}
      badges={[
        <Badge key="s" tone={tone}>{stateLabel}</Badge>,
        i.cancels_invoice_id && <Badge key="c" tone="warn">Stornorechnung</Badge>,
        i.is_electronic_invoice_enabled && <Badge key="e" tone="info">XRechnung aktiv</Badge>,
      ].filter(Boolean)}
    >
      <Section title="Rechnungsdaten" icon="🧾">
        <FieldGrid>
          <Field label="Rechnungsnummer" value={i.number} mono />
          <Field label="AutoiXpert ID" value={i.id} mono />
          <Field label="Rechnungsdatum" value={fmtDate(i.date)} />
          <Field label="Leistungsdatum" value={fmtDate(i.date_of_supply)} />
          <Field label="Erstellt am" value={fmtDateTime(i.created_at)} />
          <Field label="Standort" value={i.location_id} />
        </FieldGrid>
      </Section>

      <Section title="Beträge" icon="💶">
        <FieldGrid>
          <Field label="Netto" value={fmtMoney(i.total_net)} />
          <Field label="Brutto" value={fmtMoney(i.total_gross)} />
          <Field label="USt-Satz" value={i.vat_rate != null ? `${(i.vat_rate * 100).toFixed(0)} %` : null} />
          <Field label="Offener Betrag" value={fmtMoney(i.current_unpaid_amount)} />
          <Field label="Fälligkeitsdatum" value={fmtDate(i.due_date)} />
          <Field label="Tage bis fällig" value={i.days_until_due} />
        </FieldGrid>
      </Section>

      {i.recipient && (
        <Section title="Rechnungsempfänger" icon="👤">
          <FieldGrid>
            <Field label="Anrede" value={i.recipient.salutation} />
            <Field label="Name" value={[i.recipient.first_name, i.recipient.last_name].filter(Boolean).join(' ')} />
            <Field label="Firma" value={i.recipient.organization_name} />
            <Field label="E-Mail" value={i.recipient.email} />
            <Field label="Telefon" value={i.recipient.phone} mono />
          </FieldGrid>
          <Field label="Adresse" value={[i.recipient.street_and_housenumber_or_lockbox, [i.recipient.zip, i.recipient.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')} />
        </Section>
      )}

      {Array.isArray(i.line_items) && i.line_items.length > 0 && (
        <Section title={`Positionen (${i.line_items.length})`} icon="📋" fullWidth>
          <table className="w-full text-sm">
            <thead style={{ background: 'rgba(0,0,0,0.04)' }}>
              <tr>
                <th className="text-left text-[10px] uppercase tracking-wider py-2 px-3" style={{ color: C.textDim }}>#</th>
                <th className="text-left text-[10px] uppercase tracking-wider py-2 px-3" style={{ color: C.textDim }}>Beschreibung</th>
                <th className="text-right text-[10px] uppercase tracking-wider py-2 px-3" style={{ color: C.textDim }}>Menge</th>
                <th className="text-left text-[10px] uppercase tracking-wider py-2 px-3" style={{ color: C.textDim }}>Einheit</th>
                <th className="text-right text-[10px] uppercase tracking-wider py-2 px-3" style={{ color: C.textDim }}>Einzelpreis</th>
              </tr>
            </thead>
            <tbody>
              {i.line_items.map((li, idx) => (
                <tr key={idx} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="py-2 px-3 text-xs" style={{ color: C.textDim }}>{li.position ?? idx + 1}</td>
                  <td className="py-2 px-3" style={{ color: C.text }}>{li.description}</td>
                  <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: C.text }}>{fmtNumber(li.quantity, 2)}</td>
                  <td className="py-2 px-3 text-xs" style={{ color: C.textDim }}>{li.unit}</td>
                  <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: C.text }}>{fmtMoney(li.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {Array.isArray(i.payments) && i.payments.length > 0 && (
        <Section title={`Zahlungen (${i.payments.length})`} icon="✅">
          <div className="space-y-2">
            {i.payments.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span style={{ color: C.text }}>{p.payer || '—'}</span>
                <span style={{ color: C.textDim }}>{fmtDate(p.date)}</span>
                <span className="font-mono font-semibold" style={{ color: '#059669' }}>{fmtMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {Array.isArray(i.short_payments) && i.short_payments.length > 0 && (
        <Section title={`Kürzungen (${i.short_payments.length})`} icon="✂️">
          <div className="space-y-2">
            {i.short_payments.map((sp, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span style={{ color: C.text }}><Badge tone={sp.status === 'paid' ? 'success' : sp.status === 'written_off' ? 'neutral' : 'warn'}>{sp.status}</Badge></span>
                <span style={{ color: C.textDim }}>{fmtDate(sp.date)}</span>
                <span className="font-mono" style={{ color: '#D97706' }}>{fmtMoney(sp.amount)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {Array.isArray(i.documents) && i.documents.length > 0 && (
        <Section title={`Dokumente (${i.documents.length})`} icon="📎" fullWidth>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {i.documents.map((d, idx) => (
              <a
                key={idx}
                href={d.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-black/5"
                style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: C.text }}>{d.title || d.type}</p>
                  <p className="text-[11px]" style={{ color: C.textDim }}>{d.recipient_role}</p>
                </div>
                <span className="text-[11px]" style={{ color: C.textDim }}>↓ Öffnen</span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {Array.isArray(i.report_ids) && i.report_ids.length > 0 && (
        <Section title="Verknüpfte Gutachten" icon="📋">
          <div className="flex flex-wrap gap-2">
            {i.report_ids.map((rid) => (
              <span key={rid} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(0,0,0,0.05)', color: C.text }}>
                {rid}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Synchronisation" icon="🔄" fullWidth>
        <FieldGrid cols={3}>
          <Field label="Letzte Sync" value={fmtDateTime(i.synced_at)} />
          <Field label="Externe Aktualisierung" value={fmtDateTime(i.external_updated_at)} />
        </FieldGrid>
      </Section>

      <RawJsonSection record={i} />
    </DetailLayout>
  );
}

// ─── Ham JSON (geliştirici için) ──────────────────────────────────────

function RawJsonSection({ record }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Section title="Rohdaten (JSON)" icon="🔧" fullWidth>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
        style={{ background: 'rgba(0,0,0,0.04)', color: C.textDim, border: `1px solid ${C.border}` }}
      >
        {open ? 'Verbergen' : 'Vollständige JSON-Daten anzeigen'}
      </button>
      {open && (
        <pre
          className="mt-2 text-[11px] font-mono whitespace-pre-wrap p-4 rounded-lg overflow-auto"
          style={{ background: 'rgba(0,0,0,0.04)', color: C.text, maxHeight: 400 }}
        >
          {JSON.stringify(record.raw_payload || record, null, 2)}
        </pre>
      )}
    </Section>
  );
}
