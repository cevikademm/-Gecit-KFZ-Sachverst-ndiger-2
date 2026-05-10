// Fahrzeugauswahl — AutoiXpert Fahrzeugauswahl ekranının birebir kopyası.
// Sol: BASISDATEN form. Sağ: FAHRZEUGDATEN ERWEITERT (ikon seçiciler) + AUSSTATTUNGEN tab.
// İkonlar /public/dat-icons/ altında; kaynak: AutoiXpert klon dosyası.

import React, { useState, useMemo } from 'react';
import { C } from '../utils/tokens.js';

// ─── Sabit veri setleri ───────────────────────────────────────────────────
const FAHRZEUGART_OPTIONS = [
  { key: 'Limousine',     label: 'Limousine',     icon: '/dat-icons/sedan_64x32.png',         w: 64, h: 32 },
  { key: 'Kompaktwagen',  label: 'Kompaktwagen',  icon: '/dat-icons/compact_64x32.png',       w: 64, h: 32 },
  { key: 'Coupé',         label: 'Coupé',         icon: '/dat-icons/coupe_64x32.png',         w: 64, h: 32 },
  { key: 'Kombi',         label: 'Kombi',         icon: '/dat-icons/station-wagon_64x32.png', w: 64, h: 32 },
  { key: 'SUV',           label: 'SUV',           icon: '/dat-icons/suv_64x32.png',           w: 64, h: 32 },
  { key: 'Andere',        label: 'Andere',        icon: null,                                 w: 32, h: 32 },
];

const MOTOR_OPTIONS = [
  { key: 'Benzin',     label: 'Benzin',     icon: '/dat-icons/gasoline_48.png' },
  { key: 'Diesel',     label: 'Diesel',     icon: '/dat-icons/diesel_48.png' },
  { key: 'Elektro',    label: 'Elektro',    icon: '/dat-icons/electric_48.png' },
  { key: 'Autogas',    label: 'Autogas',    icon: '/dat-icons/autogas_48.png' },
  { key: 'Erdgas',     label: 'Erdgas',     icon: '/dat-icons/methane_48.png' },
  { key: 'Bio-Diesel', label: 'Bio-Diesel', icon: '/dat-icons/biodiesel_48.png' },
  { key: 'Wasserstoff',label: 'Wasserstoff',icon: '/dat-icons/hydrogen_48.png' },
  { key: 'Anderer',    label: 'Anderer',    icon: null },
];

const AXLES_RANGE       = [1, 2, 3, 4, 5];
const AXLES_DRIVEN      = [0, 1, 2, 3, 4, 5];
const DOORS_RANGE       = [0, 1, 2, 3, 4, 5, 6];
const SEATS_RANGE       = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const VORBESITZER_RANGE = [0, 1, 2, 3, 4, 5, 6, 7];

// ─── Yardımcı stiller ──────────────────────────────────────────────────────
const labelTextStyle = {
  fontSize: 11,
  color: C.textDim,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
  marginBottom: 6,
};

const sectionLabelStyle = {
  fontSize: 11.5,
  fontWeight: 700,
  color: C.textDim,
  letterSpacing: '0.12em',
  marginBottom: 14,
  marginTop: 22,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${C.border}`,
  fontSize: 14,
  color: C.text,
  padding: '6px 0',
  outline: 'none',
  fontFamily: 'inherit',
};

const inputFocusBorder = `1.5px solid ${C.neon || '#3B82F6'}`;

// ─── Field bileşeni: label + input ────────────────────────────────────────
function Field({ label, children, suffix }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={labelTextStyle}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {children}
        {suffix}
      </div>
    </div>
  );
}

// ─── Icon picker — bir grup ikon seçici ───────────────────────────────────
function IconPicker({ options, value, onChange, iconSize = 48 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const isSel = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              padding: '8px 10px',
              minWidth: 84,
              background: isSel ? 'rgba(59,130,246,0.08)' : 'transparent',
              border: `1px solid ${isSel ? '#3B82F6' : 'transparent'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isSel) e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
            }}
            onMouseLeave={(e) => {
              if (!isSel) e.currentTarget.style.background = 'transparent';
            }}
          >
            {opt.icon ? (
              <img
                src={opt.icon}
                alt={opt.label}
                width={opt.w || iconSize}
                height={opt.h || iconSize}
                style={{
                  opacity: isSel ? 1 : 0.55,
                  filter: isSel ? 'none' : 'grayscale(50%)',
                  transition: 'all 0.15s',
                }}
              />
            ) : (
              <div
                style={{
                  width: iconSize,
                  height: iconSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: isSel ? '#3B82F6' : C.textDim,
                  opacity: isSel ? 1 : 0.55,
                }}
              >
                +
              </div>
            )}
            <span
              style={{
                fontSize: 11,
                color: isSel ? '#3B82F6' : C.textDim,
                fontWeight: isSel ? 600 : 400,
                textDecoration: isSel ? 'underline' : 'none',
                textDecorationThickness: 1,
                textUnderlineOffset: 2,
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Number picker — sayısal değer seçici (axle, door, seat) ─────────────
function NumberPicker({ values, value, onChange, iconActive, iconInactive, includeMehr = true, iconSize = 48 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {values.map((n) => {
        const isSel = value === n;
        const useActive = n > 0;
        const icon = useActive ? iconActive : (iconInactive || iconActive);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 10px',
              minWidth: 60,
              background: isSel ? 'rgba(59,130,246,0.08)' : 'transparent',
              border: `1px solid ${isSel ? '#3B82F6' : 'transparent'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isSel) e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
            }}
            onMouseLeave={(e) => {
              if (!isSel) e.currentTarget.style.background = 'transparent';
            }}
          >
            <img
              src={icon}
              alt={String(n)}
              width={iconSize}
              height={iconSize}
              style={{
                opacity: isSel ? 1 : 0.5,
                filter: isSel ? 'none' : 'grayscale(50%)',
                transition: 'all 0.15s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: isSel ? '#3B82F6' : C.textDim,
                fontWeight: isSel ? 600 : 400,
                textDecoration: isSel ? 'underline' : 'none',
                textUnderlineOffset: 2,
              }}
            >
              {n}
            </span>
          </button>
        );
      })}
      {includeMehr && (
        <button
          type="button"
          onClick={() => onChange('mehr')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 10px',
            minWidth: 60,
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 8,
            cursor: 'pointer',
          }}
          title="Mehr"
        >
          <div
            style={{
              width: iconSize,
              height: iconSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: C.textDim,
              opacity: 0.6,
            }}
          >
            +
          </div>
          <span style={{ fontSize: 11, color: C.textDim }}>Mehr</span>
        </button>
      )}
    </div>
  );
}

// ─── Vorbesitzer picker (özel: 0-7 + Mehrere + Unbekannt) ────────────────
function VorbesitzerPicker({ value, onChange }) {
  const items = [
    ...VORBESITZER_RANGE.map((n) => ({
      key: n,
      label: String(n),
      icon: n === 0 ? '/dat-icons/person-crossed-out_48.png' : '/dat-icons/person-blue_48.png',
    })),
    { key: 'Mehrere',   label: 'Mehrere',   icon: '/dat-icons/people-blue_48.png' },
    { key: 'Unbekannt', label: 'Unbekannt', icon: '/dat-icons/people-unknown.png' },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((it) => {
        const isSel = value === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 10px',
              minWidth: 60,
              background: isSel ? 'rgba(59,130,246,0.08)' : 'transparent',
              border: `1px solid ${isSel ? '#3B82F6' : 'transparent'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isSel) e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
            }}
            onMouseLeave={(e) => {
              if (!isSel) e.currentTarget.style.background = 'transparent';
            }}
          >
            <img
              src={it.icon}
              alt={it.label}
              width={48}
              height={48}
              style={{
                opacity: isSel ? 1 : 0.55,
                filter: isSel ? 'none' : 'grayscale(50%)',
                transition: 'all 0.15s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: isSel ? '#3B82F6' : C.textDim,
                fontWeight: isSel ? 600 : 400,
                textDecoration: isSel ? 'underline' : 'none',
                textUnderlineOffset: 2,
              }}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── BASISDATEN paneli (sol) ─────────────────────────────────────────────
function BasisdatenPanel({ data, onChange }) {
  const set = (k) => (e) => onChange({ ...data, [k]: e.target?.value ?? e });
  const setVal = (k) => (v) => onChange({ ...data, [k]: v });

  // Hersteller bazlı logo (sadece Smart için klonda var; diğerleri yoksa fallback)
  const brandLogo = useMemo(() => {
    const b = (data.hersteller || data.brand || '').toLowerCase();
    if (b.includes('smart')) return '/dat-icons/smart_128.png';
    return null;
  }, [data.hersteller, data.brand]);

  return (
    <div
      style={{
        background: C.surface || '#FFFFFF',
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '24px 20px',
        height: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          letterSpacing: '0.18em',
          marginBottom: 22,
          textAlign: 'center',
        }}
      >
        BASISDATEN
      </div>

      <Field label="Fahrgestellnummer (VIN)">
        <input
          type="text"
          maxLength={17}
          value={data.vin || ''}
          onChange={set('vin')}
          style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }}
          placeholder="17-stellig"
        />
        {data.vin && data.vin.length === 17 && (
          <img src="/dat-icons/done_24.svg" alt="✓" width={16} height={16} style={{ flexShrink: 0 }} />
        )}
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="DAT€Code">
          <input type="text" value={data.dateCode || ''} onChange={set('dateCode')} style={inputStyle} />
        </Field>
        <Field label="Marktindex">
          <input type="text" value={data.marktindex || ''} onChange={set('marktindex')} style={inputStyle} />
        </Field>
      </div>

      <Field label="Hersteller">
        <input type="text" value={data.hersteller || data.brand || ''} onChange={set('hersteller')} style={inputStyle} />
        {brandLogo && (
          <img
            src={brandLogo}
            alt={data.hersteller}
            width={42}
            height={42}
            style={{ objectFit: 'contain', flexShrink: 0 }}
          />
        )}
      </Field>

      <Field label="Haupttyp">
        <input type="text" value={data.haupttyp || data.model || ''} onChange={set('haupttyp')} style={inputStyle} />
      </Field>

      <Field label="Untertyp">
        <input type="text" value={data.untertyp || ''} onChange={set('untertyp')} style={inputStyle} />
      </Field>

      <Field label="Schlüsselnummer (KBA)">
        <input
          type="text"
          value={data.kba || (data.hsn && data.tsn ? `${data.hsn}/${data.tsn}` : '')}
          onChange={set('kba')}
          placeholder="HSN/TSN"
          style={inputStyle}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Leistung (KW)">
          <input type="number" value={data.kw || ''} onChange={set('kw')} style={inputStyle} />
        </Field>
        <Field label="Leistung (PS)">
          <input type="number" value={data.ps || ''} onChange={set('ps')} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Motorbauart">
          <input type="text" value={data.motorbauart || ''} onChange={set('motorbauart')} style={inputStyle} placeholder="z.B. Reihenmotor" />
        </Field>
        <Field label="Zylinder">
          <input type="number" value={data.zylinder || ''} onChange={set('zylinder')} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Getriebe">
          <input type="text" value={data.getriebe || ''} onChange={set('getriebe')} style={inputStyle} placeholder="z.B. 5-Gang manuell" />
        </Field>
        <Field label="Hubraum (ccm)">
          <input type="number" value={data.hubraum || data.engine_cc || ''} onChange={set('hubraum')} style={inputStyle} />
        </Field>
      </div>

      <Field label="Baujahr">
        <input type="number" value={data.baujahr || data.year || ''} onChange={set('baujahr')} style={inputStyle} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Erstzulassung">
          <input type="date" value={data.erstzulassung || data.first_reg || ''} onChange={set('erstzulassung')} style={inputStyle} />
        </Field>
        <Field label="Letzte Zulassung">
          <input type="date" value={data.letzteZulassung || ''} onChange={set('letzteZulassung')} style={inputStyle} />
        </Field>
      </div>

      <Field label="Quelle der technischen Daten">
        <select
          value={data.quelle || 'Fahrzeugschein (Original)'}
          onChange={set('quelle')}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option>Fahrzeugschein (Original)</option>
          <option>Fahrzeugschein (Kopie)</option>
          <option>COC-Papiere</option>
          <option>DAT VIN-Abfrage</option>
          <option>Datenkarte</option>
          <option>Halterangabe</option>
          <option>Sonstige</option>
        </select>
      </Field>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          padding: '12px 0',
          marginTop: 8,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <input
          type="checkbox"
          checked={!!data.vinChecked}
          onChange={(e) => setVal('vinChecked')(e.target.checked)}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#3B82F6' }}
        />
        <span style={{ fontSize: 13, color: C.text }}>VIN am Fahrzeug überprüft</span>
      </label>
    </div>
  );
}

// ─── FAHRZEUGDATEN ERWEITERT paneli (sağ) ────────────────────────────────
function FahrzeugdatenErweitert({ data, onChange }) {
  const set = (k) => (v) => onChange({ ...data, [k]: v });

  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={sectionLabelStyle}>Fahrzeugart</div>
      <IconPicker options={FAHRZEUGART_OPTIONS} value={data.fahrzeugart} onChange={set('fahrzeugart')} />

      <div style={sectionLabelStyle}>Motor</div>
      <IconPicker options={MOTOR_OPTIONS} value={data.motorart || data.fuel} onChange={set('motorart')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={sectionLabelStyle}>Achsen</div>
          <NumberPicker
            values={AXLES_RANGE}
            value={data.achsen}
            onChange={set('achsen')}
            iconActive="/dat-icons/axle_48.png"
          />
        </div>
        <div>
          <div style={sectionLabelStyle}>Davon angetrieben</div>
          <NumberPicker
            values={AXLES_DRIVEN}
            value={data.angetriebeneAchsen}
            onChange={set('angetriebeneAchsen')}
            iconActive="/dat-icons/axle-powered_48.png"
            iconInactive="/dat-icons/axle-powered-crossed-out_48.png"
          />
        </div>
      </div>

      <div style={sectionLabelStyle}>Türen</div>
      <NumberPicker
        values={DOORS_RANGE}
        value={data.tueren}
        onChange={set('tueren')}
        iconActive="/dat-icons/door_48.png"
        iconInactive="/dat-icons/door-crossed-out_48.png"
      />

      <div style={sectionLabelStyle}>Sitze</div>
      <NumberPicker
        values={SEATS_RANGE}
        value={data.sitze}
        onChange={set('sitze')}
        iconActive="/dat-icons/car-seat_48.png"
        iconInactive="/dat-icons/car-seat-crossed-out_48.png"
      />

      <div style={sectionLabelStyle}>Vorbesitzer</div>
      <VorbesitzerPicker value={data.vorbesitzer} onChange={set('vorbesitzer')} />

      <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px dashed ${C.border}` }}>
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: C.textDim,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <img src="/dat-icons/add-grey.png" alt="+" width={20} height={20} />
          <span>Individuelle Fahrzeugdaten</span>
        </button>
      </div>
    </div>
  );
}

// ─── Ausstattungen tab (donanım listesi — placeholder) ───────────────────
// ─── Ausstattungen — donanım listesi (AutoiXpert birebir) ────────────────
// Sol: MÖGLİCH (olası — eklenebilecek), Sağ: VORHANDEN (araçta var olan).
// Yıldıza tıklayarak öğe MÖGLİCH ↔ VORHANDEN arasında taşınır.
// "K" rozeti = Komfort/Kategorize donanım işareti (DAT'tan gelir).

// AutoiXpert ekran görüntüsündeki Smart forfour 2016 örnek VORHANDEN listesi.
// DAT VIN-Abfrage gelene kadar manuel default. Her öğe: { name, k?: bool, kind?: 'serie'|'sonder'|'zusatz' }
const SAMPLE_VORHANDEN = [
  'Ablage-Paket',
  'Airbag Fahrer-/Beifahrerseite',
  'Ambiente-Beleuchtung',
  'Änderungsjahr mit Code 806',
  'Anti-Blockier-System (ABS)',
  'Audiosystem Smart',
  'Außenspiegel elektr. verstell- und heizbar',
  'Außentemperaturanzeige',
  'AUX-IN-Anschluss',
  'Blinkleuchten seitlich Weiß',
  'Bordcomputer',
  'Cool & Audio-Paket',
  'Design- und Ausstattungslinie passion',
  'Design- und Ausstattungslinie passion',
  'Direktlenkung mit variabler Lenkkraft-Unterstützung',
  'Einparkhilfe hinten',
  'Elektron. Stabilitäts-Programm (ESP) mit Anfahr-Assistent',
  'Erste Hilfe-Kasten / Verbandkasten',
  'Fensterheber elektr. vorn, mit Einklemmschutz',
  'Fensterheber elektrisch vorn',
  'Freisprecheinrichtung Bluetooth',
  'Fußgänger-Aufprallschutz vorn und seitlich',
  'Fußmatten Velours',
  'Fzg. ohne Abgasreinigung',
  'Fzg. ohne Lenkrad mit Schaltwippen/-tasten',
  'Fzg. ohne Lenkradheizung',
  'Fzg. ohne Navigationssystem',
  'Fzg. ohne Sport-Paket',
  'Fzg. ohne Spurhalteassistent',
  'Fzg. ohne Staub-Kit',
  'Fzg. ohne Tempomat mit Abstandsregelung',
  'Geschwindigkeits-Regelanlage (Tempomat)',
  'Getriebe 5-Gang',
  'Handschuhfach abschließbar',
  'Heckleuchten LED',
  'Isofix-Aufnahmen für Kindersitz',
  'Karosserie: 5-türig',
  'Klimaautomatik',
  'Knieairbag Fahrerseite',
  'Kombiinstrument mit Farbdisplay',
  'Komfort-Paket',
  'Kopf-Airbag-System / Seitenairbag',
  'Kraftstofftank: vergrößert',
  'Kühlermaske Cool Silver',
  'Laderaumabdeckung',
  'LED & Sensor-Paket',
  'Lenkrad (Leder)',
  'Lenkrad mit Multifunktion',
  'Lenksäule (Lenkrad) verstellbar',
  'LM-Felgen vorn/hinten: 5x15 / 5,5x15 (8-Speichen)',
  'Metallic-Lackierung',
  'Mittelkonsole mit Ablagenetz seitlich',
  'Motor 0,9 Ltr. - 66 kW Turbo KAT',
  'Motorhaube / Wartungsklappe abschließbar',
  'Nebelscheinwerfer',
  'Regen-/Lichtsensor',
  'Reifen vorn/hinten: 165/65 R15 ..T / 185/60 R15 ..T',
  'Reifen-Reparaturkit (Kompressor)',
  'Reifendruck-Kontrollsystem',
  'Schadstoffarm nach Abgasnorm Euro 6',
  'Schadstoffarm nach Abgasnorm Euro 6',
  'Scheinwerfer mit Begrüßungsfunktion',
  'Seitenfenster hinten ausstellbar',
  'Sitz vorn links höhenverstellbar',
  'Sitzbezug / Polsterung: Stoff',
  'Sitzheizung',
  'Sitzlehne vorn rechts umklappbar',
  'Sonnenblende links mit Spiegel',
  'Sonnenblende rechts mit Spiegel',
  'Sound-System JBL',
  'Start/Stop-Anlage',
  'Steckdose (12V-Anschluß)',
  'Steuer-AV Smart Line Up',
  'Tagfahrlicht LED',
  'Tridion-Sicherheitszelle Cool Silber Metallic (Farbcode ER2U)',
  'USB-Anschluss',
  'Volldach',
  'Warnanlage / Statusanzeige für Sicherheitsgurte im Fond',
  'Warndreieck',
  'Winterreifen/M+S',
  'Zentralverriegelung mit Fernbedienung und Wegfahrsperre',
];

// MÖGLİCH örnek — AutoiXpert ekran görüntüsünde sol sütunda görünenler.
// Bunlar DAT'ın "olası ama seçili değil" önerileridir.
const SAMPLE_MOEGLICH = [
  'Sitzbezug / Polsterung: Stoff / Leder-Optik',
  'Smart Sportsitze',
  'Sonderlackierung Uni',
  'Sport-Fahrwerk',
  'Sport-Paket',
  'Sport-Paket Brabus',
  'Stahlfelgen vorn/hinten: 5x15 / 5,5x15',
  'Tablet-Halterung für iPad Air',
  'Tempomat mit Abstandsregelung',
  'Tridion-Sicherheitszelle Graphite-grey',
  'Tridion-Sicherheitszelle Lava Orange',
  'Tridion-Sicherheitszelle Rot (Farbcode EB6)',
  'Tridion-Sicherheitszelle Weiß (Farbcode)',
  'Türgriffe außen lackiert',
  'Urban-Style-Paket',
  'Verzurrösen Koffer-/Laderaum',
  'Vorrüstung Tablet-Halterung',
  'Zusatzinstrumente für Cockpituhr und Drehzahlmesser',
];

// "K" rozeti DAT katalogu işareti — bazı öğelerde görünür (ekran görüntüsü).
// Şimdilik sezgisel: sürücü destek/güvenlik içerenleri K say.
const KOMFORT_PATTERNS = [
  /Sitz vorn links höhenverstellbar/i,
  /Sonnenblende/i,
  /Steuer-AV/i,
  /USB-Anschluss/i,
  /Volldach/i,
];
const isKomfort = (name) => KOMFORT_PATTERNS.some((re) => re.test(name));

// ID generator (item taşırken karışmasın diye stabil)
let _ausstattungIdCounter = 0;
const newAusstattungId = () => `aus_${++_ausstattungIdCounter}_${Math.random().toString(36).slice(2, 7)}`;

function buildSampleData() {
  const vorhanden = SAMPLE_VORHANDEN.map((name) => ({
    id: newAusstattungId(), name, k: isKomfort(name), kind: 'serie',
  }));
  const moeglich = SAMPLE_MOEGLICH.map((name) => ({
    id: newAusstattungId(), name, k: false, kind: 'serie',
  }));
  return { vorhanden, moeglich };
}

function AusstattungenColumn({ title, count, items, onToggle, onAdd, addAlign = 'right', emptyText }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.015)',
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        minHeight: 520,
        maxHeight: 560,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: C.textDim }}>
            {title}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.textDim,
              background: 'rgba(0,0,0,0.05)',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {count}
          </span>
        </div>
        {onAdd && addAlign === 'right' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={onAdd}
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                color: '#3B82F6', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, lineHeight: 1,
              }}
              title="Ekle"
            >+</button>
            <button
              type="button"
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'transparent', border: 'none',
                color: C.textDim, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Diğer"
            >⋮</button>
          </div>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
        {items.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: C.textDim, fontSize: 12, opacity: 0.6 }}>
            {emptyText || 'Liste boş'}
          </div>
        )}
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onToggle(it.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid rgba(0,0,0,0.04)`,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.12s',
              fontSize: 12.5,
              color: C.text,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ flex: 1, lineHeight: 1.35 }}>{it.name}</span>
            {it.k && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.textDim,
                  width: 14,
                  textAlign: 'center',
                }}
                title="Komfort/Kategorize"
              >K</span>
            )}
            <span
              style={{
                fontSize: 14,
                color: '#3B82F6',
                width: 16,
                textAlign: 'center',
                lineHeight: 1,
              }}
            >★</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AusstattungenPanel({ data, onChange }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'serie' | 'sonder' | 'zusatz'
  const [sort, setSort]     = useState('source'); // 'source' | 'alpha'

  // İlk açılışta default sample data ile başla (data.ausstattungen yoksa).
  // data.ausstattungen yapısı: { vorhanden: [...], moeglich: [...] }
  const initial = useMemo(() => {
    if (data?.ausstattungen?.vorhanden) return data.ausstattungen;
    return buildSampleData();
  }, [data?.ausstattungen]);

  const [vorhanden, setVorhanden] = useState(initial.vorhanden);
  const [moeglich, setMoeglich]   = useState(initial.moeglich || []);

  const persist = (newVorhanden, newMoeglich) => {
    onChange({ ...data, ausstattungen: { vorhanden: newVorhanden, moeglich: newMoeglich } });
  };

  // Item'i karşı listeye taşı
  const moveToVorhanden = (id) => {
    const it = moeglich.find((x) => x.id === id);
    if (!it) return;
    const nm = moeglich.filter((x) => x.id !== id);
    const nv = [...vorhanden, it];
    setMoeglich(nm); setVorhanden(nv);
    persist(nv, nm);
  };
  const moveToMoeglich = (id) => {
    const it = vorhanden.find((x) => x.id === id);
    if (!it) return;
    const nv = vorhanden.filter((x) => x.id !== id);
    const nm = [...moeglich, it];
    setVorhanden(nv); setMoeglich(nm);
    persist(nv, nm);
  };
  const addNew = (target) => {
    const name = window.prompt('Donanım adı:');
    if (!name?.trim()) return;
    const it = { id: newAusstattungId(), name: name.trim(), k: false, kind: 'serie' };
    if (target === 'vorhanden') {
      const nv = [...vorhanden, it]; setVorhanden(nv); persist(nv, moeglich);
    } else {
      const nm = [...moeglich, it]; setMoeglich(nm); persist(vorhanden, nm);
    }
  };

  // Search + filter + sort uygula
  const applyView = (list) => {
    let out = list;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((x) => x.name.toLowerCase().includes(q));
    }
    if (filter !== 'all') {
      out = out.filter((x) => (x.kind || 'serie') === filter);
    }
    if (sort === 'alpha') {
      out = [...out].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    }
    return out;
  };

  const moeglichView   = applyView(moeglich);
  const vorhandenView  = applyView(vorhanden);

  const FilterPill = ({ k, label, icon, color = '#3B82F6' }) => {
    const active = filter === k;
    return (
      <button
        type="button"
        onClick={() => setFilter(active ? 'all' : k)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px',
          background: active ? `${color}15` : 'transparent',
          border: `1px solid ${active ? color : 'transparent'}`,
          borderRadius: 999,
          fontSize: 12,
          color: active ? color : C.textDim,
          fontWeight: active ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div style={{ padding: '8px 4px' }}>
      {/* Toolbar — search + filters + sort */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: '1 1 220px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.04)',
            borderRadius: 8,
            padding: '6px 12px',
          }}
        >
          <span style={{ fontSize: 13, color: C.textDim }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen"
            style={{
              flex: 1, background: 'transparent', border: 'none',
              fontSize: 13, color: C.text, outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FilterPill k="serie"  label="Serie"  icon="✓" />
          <FilterPill k="sonder" label="Sonder" icon="★" />
          <FilterPill k="zusatz" label="Zusatz" icon="☆" />
        </div>

        <button
          type="button"
          onClick={() => setSort(sort === 'alpha' ? 'source' : 'alpha')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px',
            background: sort === 'alpha' ? 'rgba(59,130,246,0.1)' : 'transparent',
            border: `1px solid ${sort === 'alpha' ? '#3B82F6' : 'transparent'}`,
            borderRadius: 999, fontSize: 12,
            color: sort === 'alpha' ? '#3B82F6' : C.textDim,
            fontWeight: sort === 'alpha' ? 600 : 400,
            cursor: 'pointer',
          }}
          title="Alfabetik sırala"
        >
          <span>⇅</span><span>Alphabetisch</span>
        </button>
      </div>

      {/* İki sütun: MÖGLİCH | VORHANDEN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AusstattungenColumn
          title="MÖGLICH"
          count={moeglichView.length}
          items={moeglichView}
          onToggle={moveToVorhanden}
          onAdd={() => addNew('moeglich')}
          emptyText="Olası donanım kalmadı — hepsi araçta mevcut."
        />
        <AusstattungenColumn
          title="VORHANDEN"
          count={vorhandenView.length}
          items={vorhandenView}
          onToggle={moveToMoeglich}
          onAdd={() => addNew('vorhanden')}
          emptyText="Henüz donanım eklenmedi."
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN — FahrzeugauswahlPanel
// ═══════════════════════════════════════════════════════════════════════════
export default function FahrzeugauswahlPanel({ vehicle = {}, onChange = () => {} }) {
  const [rightTab, setRightTab] = useState('erweitert'); // 'erweitert' | 'ausstattungen'

  // Çift yönlü merge: vehicle prop'undan alınan değerler + lokal değişiklikler.
  // onChange üst component'e patch'i geçirir.
  const handleChange = (next) => {
    onChange(next);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* SOL: BASISDATEN */}
      <BasisdatenPanel data={vehicle} onChange={handleChange} />

      {/* SAĞ: FAHRZEUGDATEN ERWEITERT / AUSSTATTUNGEN */}
      <div
        style={{
          background: C.surface || '#FFFFFF',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '24px 24px 28px',
          minHeight: 600,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Tab başlıkları */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 18,
            paddingBottom: 4,
          }}
        >
          {[
            { key: 'erweitert',     label: 'FAHRZEUGDATEN ERWEITERT' },
            { key: 'ausstattungen', label: 'AUSSTATTUNGEN' },
          ].map((t) => {
            const active = rightTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setRightTab(t.key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 4px',
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? C.text : C.textDim,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  borderBottom: active ? `2px solid #3B82F6` : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {rightTab === 'erweitert' && (
          <FahrzeugdatenErweitert data={vehicle} onChange={handleChange} />
        )}
        {rightTab === 'ausstattungen' && (
          <AusstattungenPanel data={vehicle} onChange={handleChange} />
        )}
      </div>
    </div>
  );
}
