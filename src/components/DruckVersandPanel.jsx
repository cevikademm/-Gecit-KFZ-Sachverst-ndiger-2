// Druck & Versand — AutoiXpert "Druck & Versand" sayfasının birebir kopyası.
// 4 alıcı tipi (Anspruchsteller / Werkstatt / Rechtsanwalt / Versicherung) için
// her biri kendi DOKUMENTE toggle setiyle ve 3 gönderim kartıyla:
//   1. ANSCHREIBEN  — kapak yazısı (subject + datum + nachricht + Vorlage einfügen)
//   2. E-MAIL-VERSAND — sender/recipient/cc/subject/body + ek dosya + Senden
//   3. WHATSAPP-VERSAND — text templates + WhatsApp preview + 2 buton
// Sol kenarda alıcı seçici sidebar, sağ üstte DOKUMENTE seçici paneli sabit duruyor.

import React, { useState, useMemo } from 'react';
import { C } from '../utils/tokens.js';

// ─── Alıcı tipleri ─────────────────────────────────────────────────────────
const RECIPIENT_TYPES = [
  {
    key: 'anspruchsteller',
    label: 'Anspruchstelle',
    icon: '👤',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
    source: 'claimant',
  },
  {
    key: 'werkstatt',
    label: 'Werkstatt',
    icon: '🔧',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
    source: 'workshop',
  },
  {
    key: 'rechtsanwalt',
    label: 'Rechtsanwalt',
    icon: '⚖',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
    source: 'lawyer',
  },
  {
    key: 'versicherung',
    label: 'Versicherung',
    icon: '📍',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
    source: 'insurance',
  },
];

// ─── Default DOKUMENTE toggle setleri (alıcı tipine göre) ──────────────────
const DEFAULT_DOCUMENTS = {
  anspruchsteller: { anschreiben: false, gutachten: true,  rechnung: false, werkstattInfo: false },
  werkstatt:       { anschreiben: false, gutachten: true,  rechnung: true,  werkstattInfo: true  },
  rechtsanwalt:    { anschreiben: false, gutachten: true,  rechnung: true,  werkstattInfo: false },
  versicherung:    { anschreiben: false, gutachten: true,  rechnung: true,  werkstattInfo: false },
};

// ─── DOKUMENTE — hangi belgelerin alıcıya uygun olduğu ─────────────────────
// (Werkstatt-Information yalnızca Werkstatt için görünür)
const DOC_AVAILABILITY = {
  anspruchsteller: { anschreiben: true, gutachten: true, rechnung: true, werkstattInfo: false },
  werkstatt:       { anschreiben: true, gutachten: true, rechnung: true, werkstattInfo: true  },
  rechtsanwalt:    { anschreiben: true, gutachten: true, rechnung: true, werkstattInfo: false },
  versicherung:    { anschreiben: true, gutachten: true, rechnung: true, werkstattInfo: false },
};

// ─── WhatsApp text templates (alıcı tipine göre) ───────────────────────────
const WHATSAPP_TEMPLATES = {
  anspruchsteller: [
    { id: 'fb_sie',   label: 'Fahrzeugbewertung - per Sie',
      body: 'Sehr geehrte/r {NAME},\n\nanbei finden Sie die Fahrzeugbewertung für Ihr Fahrzeug {KENNZEICHEN}.\n\nMit freundlichen Grüßen\nGecit KFZ Sachverständiger' },
    { id: 'fb_du',    label: 'Fahrzeugbewertung - per Du',
      body: 'Hallo {VORNAME},\n\nanbei findest du die Fahrzeugbewertung für dein Fahrzeug {KENNZEICHEN}.\n\nViele Grüße\nGecit KFZ Sachverständiger' },
    { id: 'mit_sie',  label: 'Mit Anwalt - per Sie',
      body: 'Sehr geehrte/r {NAME},\n\nanbei das Gutachten zu Ihrem Schadenfall. Die weitere Bearbeitung übernimmt Ihr Rechtsanwalt.\n\nMit freundlichen Grüßen\nGecit KFZ Sachverständiger' },
    { id: 'mit_du',   label: 'Mit Anwalt - per Du',
      body: 'Hallo {VORNAME},\n\nanbei das Gutachten. Dein Anwalt kümmert sich um die weitere Abwicklung.\n\nViele Grüße\nGecit KFZ Sachverständiger' },
    { id: 'ohne_sie', label: 'Ohne Anwalt - per Sie',
      body: 'Sehr geehrte/r {NAME},\n\nanbei finden Sie das Gutachten und die Rechnung. Bitte reichen Sie die Unterlagen direkt bei der Versicherung ein.\n\nMit freundlichen Grüßen\nGecit KFZ Sachverständiger' },
    { id: 'ohne_du',  label: 'Ohne Anwalt - per Du',
      body: 'Hallo {VORNAME},\n\nanbei das Gutachten und die Rechnung. Reiche die Unterlagen bitte direkt bei der Versicherung ein.\n\nViele Grüße\nGecit KFZ Sachverständiger' },
  ],
  werkstatt: [
    { id: 'wk_vxs', label: 'E-Mail-Anschreiben Werkstatt inkl. VXS-Export',
      body: 'Sehr geehrte Damen und Herren,\n\nanbei das Gutachten und der VXS-Export zur Reparaturabwicklung.\n\nMit freundlichen Grüßen\nGecit KFZ Sachverständiger' },
    { id: 'wk_std', label: 'E-Mail-Anschreiben Werkstatt',
      body: 'Sehr geehrte Damen und Herren,\n\nanbei das Gutachten zur Reparaturabwicklung.\n\nMit freundlichen Grüßen\nGecit KFZ Sachverständiger' },
  ],
  rechtsanwalt: [
    { id: 'aw_full', label: 'Anwalt: Gutachten mit Rechnung',
      body: 'Sehr geehrte/r Frau/Herr Rechtsanwalt,\n\nanbei das Gutachten und die Rechnung zur Schadenregulierung.\n\nMit freundlichen Grüßen\nGecit KFZ Sachverständiger' },
  ],
  versicherung: [
    { id: 'vs_full', label: 'Gutachten mit Rechnung & Abtretung',
      body: 'Sehr geehrte Damen und Herren,\n\nanbei das Gutachten, die Rechnung sowie die Abtretungserklärung zur Schadenregulierung.\n\nMit freundlichen Grüßen\nGecit KFZ Sachverständiger' },
  ],
};

// ─── Default state — her alıcı tipi için boş kart durumu ──────────────────
function makeDefaultRecipientState(key) {
  return {
    documents: { ...DEFAULT_DOCUMENTS[key] },
    anschreiben: { betreff: '', datum: new Date().toISOString().slice(0, 10), nachricht: '' },
    email:       { betreff: '', nachricht: '', bcc: 'gecit.kfz.sachverstandiger@gmail.com' },
    whatsappTemplateId: null,
    whatsappCustomMessage: '',
  };
}

function makeDefaultDruckState() {
  return {
    activeRecipient: 'anspruchsteller',
    recipients: {
      anspruchsteller: makeDefaultRecipientState('anspruchsteller'),
      werkstatt:       makeDefaultRecipientState('werkstatt'),
      rechtsanwalt:    makeDefaultRecipientState('rechtsanwalt'),
      versicherung:    makeDefaultRecipientState('versicherung'),
    },
  };
}

// ─── Kontak bilgilerini draft'tan çıkar ───────────────────────────────────
function getRecipientContact(draft, recipientKey) {
  if (recipientKey === 'anspruchsteller') {
    const c = draft?.claimant || {};
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.company || 'Anspruchsteller';
    return {
      name: fullName,
      email: c.email || '',
      phone: c.phone || '',
      role: 'Anspruchstelle',
    };
  }
  if (recipientKey === 'werkstatt') {
    const w = draft?.workshop || {};
    return {
      name: w.name || 'Keine Kontaktdaten',
      email: w.email || '',
      phone: w.phone || '',
      role: 'Werkstatt',
    };
  }
  if (recipientKey === 'rechtsanwalt') {
    const l = draft?.lawyer || {};
    return {
      name: l.name || 'Keine Kontaktdaten',
      email: l.email || '',
      phone: l.phone || '',
      role: 'Rechtsanwalt',
    };
  }
  if (recipientKey === 'versicherung') {
    const i = draft?.insurance || {};
    return {
      name: i.company || 'Keine Kontaktdaten',
      email: i.email || '',
      phone: i.phone || '',
      role: 'Versicherung',
    };
  }
  return { name: '—', email: '', phone: '', role: '' };
}

// ─── Atom: ToggleSwitch ─────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: 36,
        height: 20,
        borderRadius: 999,
        background: checked ? '#3B82F6' : 'rgba(0,0,0,0.18)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.18s',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'left 0.18s',
        }}
      />
    </button>
  );
}

// ─── Atom: Avatar (alıcı tipine göre ikon) ─────────────────────────────────
function RecipientAvatar({ type, size = 40 }) {
  const t = RECIPIENT_TYPES.find((r) => r.key === type);
  if (!t) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: t.iconBg,
        color: t.iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        flexShrink: 0,
      }}
    >
      {t.icon}
    </div>
  );
}

// ─── Sol sidebar (alıcı seçici) ────────────────────────────────────────────
function RecipientSidebar({ activeRecipient, onChange }) {
  return (
    <div
      style={{
        width: 56,
        background: '#3F4A5C',
        borderRadius: 12,
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        position: 'sticky',
        top: 16,
        alignSelf: 'flex-start',
      }}
    >
      {/* Üst kilit ikonu — "kilitle" / başlık */}
      <button
        type="button"
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'rgba(255,255,255,0.06)',
          color: '#9CA3AF',
          border: 'none',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Abschließen"
      >🔒</button>

      <div style={{ height: 1, width: 32, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

      {RECIPIENT_TYPES.map((t) => {
        const isActive = activeRecipient === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            title={t.label}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isActive ? '#FFFFFF' : 'transparent',
              color: isActive ? '#3B82F6' : '#9CA3AF',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sağ üst DOKUMENTE paneli ─────────────────────────────────────────────
function DokumentePanel({ activeRecipient, documents, onToggle, onGesamtPdf, onAbschliessen }) {
  const availability = DOC_AVAILABILITY[activeRecipient];
  const docs = [
    { key: 'anschreiben',    label: 'Anschreiben' },
    { key: 'gutachten',      label: 'Gutachten' },
    { key: 'rechnung',       label: 'Rechnung' },
    { key: 'werkstattInfo',  label: 'Werkstatt-Information' },
  ];

  return (
    <div
      style={{
        width: 280,
        background: '#FFFFFF',
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 16,
        alignSelf: 'flex-start',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span style={{ fontSize: 11, color: C.textDim }}>📥</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '0.1em' }}>
          DOKUMENTE
        </span>
        <span style={{ fontSize: 14, color: C.textDim, cursor: 'pointer' }}>⋮</span>
      </div>

      {/* Toggles */}
      <div style={{ padding: '12px 16px' }}>
        {docs.map((d) => {
          const enabled = availability[d.key];
          const value = !!documents[d.key];
          return (
            <div
              key={d.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                opacity: enabled ? 1 : 0.45,
              }}
            >
              <span style={{ fontSize: 13, color: C.text }}>{d.label}</span>
              <ToggleSwitch
                checked={value}
                disabled={!enabled}
                onChange={(v) => onToggle(d.key, v)}
              />
            </div>
          );
        })}
      </div>

      {/* Action butonları */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 14px 14px',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <button
          type="button"
          onClick={onGesamtPdf}
          style={{
            flex: 1,
            background: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >Gesamt-PDF</button>
        <button
          type="button"
          onClick={onAbschliessen}
          style={{
            flex: 1,
            background: 'transparent',
            color: '#3B82F6',
            border: '1px solid #3B82F6',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >🔒 Abschließen</button>
      </div>
    </div>
  );
}

// ─── Kart sarmalayıcı (3 dikey kart için ortak) ───────────────────────────
function VersandCard({ icon, title, children, headerExtra }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px',
          borderBottom: `1px solid ${C.border}`,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: '0.1em' }}>
            {title}
          </span>
        </div>
        {headerExtra && (
          <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
            {headerExtra}
          </div>
        )}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

// ─── 1. ANSCHREIBEN kartı ──────────────────────────────────────────────────
function AnschreibenCard({ contact, recipientType, state, onChange, onInsertTemplate }) {
  const set = (k) => (e) => onChange({ ...state, [k]: e.target?.value ?? e });
  return (
    <VersandCard
      icon="📄"
      title="ANSCHREIBEN"
      headerExtra={<span style={{ fontSize: 14, color: C.textDim, cursor: 'pointer' }}>⋮</span>}
    >
      {/* Alıcı satırı */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <RecipientAvatar type={recipientType} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: contact.email ? C.text : C.textDim }}>
            {contact.name}
          </div>
          <div style={{ fontSize: 12, color: C.textDim }}>{contact.role}</div>
        </div>
      </div>

      {/* Betreff + Datum */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={miniLabel}>Betreff</label>
          <input
            type="text"
            value={state.betreff}
            onChange={set('betreff')}
            style={underlineInput}
          />
        </div>
        <div>
          <label style={miniLabel}>Datum</label>
          <input
            type="date"
            value={state.datum}
            onChange={set('datum')}
            style={underlineInput}
          />
        </div>
      </div>

      {/* Nachricht */}
      <div style={{ marginBottom: 12 }}>
        <label style={miniLabel}>Nachricht</label>
        <textarea
          rows={4}
          value={state.nachricht}
          onChange={set('nachricht')}
          style={{ ...underlineInput, resize: 'vertical', fontFamily: 'inherit', minHeight: 80 }}
        />
      </div>

      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 18 }}>
        Umschalt+Enter für Umbruch mit weniger Abstand
      </div>

      {/* Vorlage einfügen butonu */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onInsertTemplate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(59,130,246,0.3)',
          }}
        >
          <span style={{ fontSize: 13 }}>📋</span>
          <span>Vorlage einfügen</span>
        </button>
      </div>
    </VersandCard>
  );
}

// ─── 2. E-MAIL-VERSAND kartı ──────────────────────────────────────────────
function EmailVersandCard({ contact, recipientType, state, onChange, onInsertTemplate, onSend, showVxsButton }) {
  const set = (k) => (e) => onChange({ ...state, [k]: e.target?.value ?? e });

  const canSend = !!contact.email;
  return (
    <VersandCard
      icon="✉"
      title="E-MAIL-VERSAND"
      headerExtra={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" style={iconBtnStyle} title="PDF görünümü">📄</button>
          <span style={{ fontSize: 14, color: C.textDim, cursor: 'pointer' }}>⋮</span>
        </div>
      }
    >
      {/* Üst: alıcı sol, gönderici-bcc sağ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <RecipientAvatar type={recipientType} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{contact.name}</div>
            {!contact.email ? (
              <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                Keine E-Mailadresse hinterlegt
                <span style={{ cursor: 'pointer', color: C.textDim }}>✎</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{contact.email}</div>
            )}
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{contact.role}</div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>
            Von: <span style={{ color: C.text }}>Rohat Gecit &lt;gecit@gkfzgutachter.ac&gt;</span>
          </div>
          <div style={{ marginBottom: 6, textAlign: 'left' }}>
            <label style={{ ...miniLabel, marginBottom: 4 }}>Bcc</label>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                color: C.text,
              }}
            >
              <span style={{ fontSize: 11, color: C.textDim }}>Ich</span>
              <span>{state.bcc}</span>
              <span style={{ cursor: 'pointer', fontSize: 12, color: C.textDim }}>×</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={miniLabel}>Betreff</label>
        <input type="text" value={state.betreff} onChange={set('betreff')} style={underlineInput} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={miniLabel}>Nachricht</label>
        <textarea
          rows={5}
          value={state.nachricht}
          onChange={set('nachricht')}
          style={{ ...underlineInput, resize: 'vertical', fontFamily: 'inherit', minHeight: 100 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <button
          type="button"
          onClick={onInsertTemplate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(59,130,246,0.3)',
          }}
        >
          <span>📋</span>
          <span>Vorlage einfügen</span>
        </button>
      </div>

      {/* Ek dosya */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 0',
          color: C.textDim,
          fontSize: 12,
          borderTop: `1px solid rgba(0,0,0,0.06)`,
          marginBottom: 12,
        }}
      >
        <span>📎</span>
        <span>Gutachten {contact.name.split(' ').slice(0, 2).join(' ')} AC AI 88…</span>
      </div>

      {/* Senden + VXS butonları */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
        <button
          type="button"
          disabled={!canSend}
          onClick={onSend}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: canSend ? '#3B82F6' : 'rgba(0,0,0,0.08)',
            color: canSend ? '#FFFFFF' : C.textDim,
            border: 'none',
            borderRadius: 8,
            padding: '8px 24px',
            fontSize: 13,
            fontWeight: 500,
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          <span>▶</span>
          <span>Senden</span>
          <span style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 6, marginLeft: 4 }}>▾</span>
        </button>

        {showVxsButton && (
          <button
            type="button"
            style={{
              background: 'transparent',
              color: '#3B82F6',
              border: '1px solid #3B82F6',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >VXS anhängen</button>
        )}
      </div>
    </VersandCard>
  );
}

// ─── 3. WHATSAPP-VERSAND kartı ────────────────────────────────────────────
function WhatsappVersandCard({ contact, recipientType, state, onChange }) {
  const templates = WHATSAPP_TEMPLATES[recipientType] || [];
  const selected = templates.find((t) => t.id === state.whatsappTemplateId);
  const hasPhone = !!contact.phone;

  const selectTemplate = (id) => {
    const t = templates.find((x) => x.id === id);
    onChange({
      ...state,
      whatsappTemplateId: id,
      whatsappCustomMessage: t ? t.body : '',
    });
  };

  return (
    <VersandCard
      icon="💬"
      title="WHATSAPP-VERSAND"
      headerExtra={<button type="button" style={iconBtnStyle} title="Yenile">📄</button>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Sol: TEXTVORLAGEN */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: '0.1em' }}>
              TEXTVORLAGEN
            </span>
            <button
              type="button"
              style={{
                fontSize: 11, color: C.textDim,
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >📝 Eigene Nachricht</button>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.02)',
              borderRadius: 8,
              padding: 10,
              display: 'grid',
              gridTemplateColumns: templates.length > 1 ? '1fr 1fr' : '1fr',
              gap: 8,
              minHeight: 120,
            }}
          >
            {templates.map((t) => {
              const active = state.whatsappTemplateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  style={{
                    background: active ? 'rgba(59,130,246,0.08)' : '#FFFFFF',
                    border: `1px solid ${active ? '#3B82F6' : C.border}`,
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: active ? '#3B82F6' : C.text,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >{t.label}</button>
              );
            })}
          </div>
        </div>

        {/* Sağ: WhatsApp önizleme */}
        <div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 8px',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '8px 8px 0 0',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <RecipientAvatar type={recipientType} size={32} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hasPhone ? C.text : C.textDim, fontStyle: hasPhone ? 'normal' : 'italic' }}>
                {hasPhone ? contact.name : 'Keine Telefonnummer gefunden'}
              </div>
            </div>
          </div>

          <div
            style={{
              minHeight: 140,
              padding: 12,
              background: '#E9E1D9',
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
              borderRadius: '0 0 8px 8px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
            }}
          >
            {selected ? (
              <div
                style={{
                  background: '#DCF8C6',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: C.text,
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4,
                  boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                }}
              >
                {state.whatsappCustomMessage || selected.body}
              </div>
            ) : (
              <div
                style={{
                  background: '#DCF8C6',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: C.textDim,
                  fontStyle: 'italic',
                  maxWidth: '85%',
                }}
              >Wähle eine Vorlage</div>
            )}
          </div>
        </div>
      </div>

      {/* Ek dosya */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 0 8px',
          color: C.textDim,
          fontSize: 12,
          borderTop: `1px solid rgba(0,0,0,0.06)`,
          marginTop: 16,
        }}
      >
        <span>📎</span>
        <span>Gutachten {contact.name.split(' ').slice(0, 2).join(' ')} AC AI 88…</span>
      </div>

      {/* Aksiyon butonları */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
        <button
          type="button"
          disabled={!hasPhone}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: hasPhone ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.04)',
            color: hasPhone ? '#3B82F6' : C.textDim,
            border: `1px solid ${hasPhone ? '#3B82F6' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 12,
            fontWeight: 500,
            cursor: hasPhone ? 'pointer' : 'not-allowed',
          }}
        >📤 Nachricht in WhatsApp öffnen</button>
        <button
          type="button"
          disabled={!hasPhone}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent',
            color: hasPhone ? '#3B82F6' : C.textDim,
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 12,
            fontWeight: 500,
            cursor: hasPhone ? 'pointer' : 'not-allowed',
          }}
        >📤 Chat in WhatsApp öffnen</button>
      </div>
    </VersandCard>
  );
}

// ─── Stiller ──────────────────────────────────────────────────────────────
const miniLabel = {
  display: 'block',
  fontSize: 10.5,
  color: C.textDim,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontWeight: 500,
  marginBottom: 4,
};

const underlineInput = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${C.border}`,
  fontSize: 13,
  color: C.text,
  padding: '6px 0',
  outline: 'none',
  fontFamily: 'inherit',
};

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: 14,
  color: C.textDim,
  cursor: 'pointer',
  padding: 4,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN — DruckVersandPanel
// ═══════════════════════════════════════════════════════════════════════════
export default function DruckVersandPanel({ draft = {}, set = () => () => {} }) {
  // Tüm druck state'i tek bir objede tut. set('druck')(newState) ile yaz.
  const druck = useMemo(() => {
    if (draft.druck && draft.druck.recipients) return draft.druck;
    return makeDefaultDruckState();
  }, [draft.druck]);

  const activeRecipient = druck.activeRecipient;
  const recipientState  = druck.recipients[activeRecipient] || makeDefaultRecipientState(activeRecipient);
  const contact         = getRecipientContact(draft, activeRecipient);

  const updateActive = (patch) => {
    const next = {
      ...druck,
      recipients: {
        ...druck.recipients,
        [activeRecipient]: { ...recipientState, ...patch },
      },
    };
    set('druck')(next);
  };

  const setActiveRecipient = (key) => {
    set('druck')({ ...druck, activeRecipient: key });
  };

  const handleDocToggle = (key, value) => {
    updateActive({ documents: { ...recipientState.documents, [key]: value } });
  };

  const handleInsertAnschreibenTemplate = () => {
    const tpl = WHATSAPP_TEMPLATES[activeRecipient]?.[0];
    if (!tpl) return;
    updateActive({
      anschreiben: {
        ...recipientState.anschreiben,
        betreff: `Gutachten — ${contact.name}`,
        nachricht: tpl.body,
      },
    });
  };
  const handleInsertEmailTemplate = () => {
    const tpl = WHATSAPP_TEMPLATES[activeRecipient]?.[0];
    if (!tpl) return;
    updateActive({
      email: {
        ...recipientState.email,
        betreff: `Gutachten — ${contact.name}`,
        nachricht: tpl.body,
      },
    });
  };

  const handleSendEmail = () => {
    if (!contact.email) {
      alert('E-Mailadresse fehlt — bitte zuerst hinterlegen.');
      return;
    }
    alert(`E-Mail-Versand simüle edildi → ${contact.email}\n(Gerçek SMTP entegrasyonu sonraki adımda)`);
  };

  const handleGesamtPdf = () => {
    alert('Gesamt-PDF oluşturma — sonraki adımda backend PDF render eklenecek.');
  };
  const handleAbschliessen = () => {
    alert('Rapor "Abschließen" durumuna alınacak — sonraki adımda Supabase status update eklenecek.');
  };

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* SOL: alıcı sidebar */}
      <RecipientSidebar activeRecipient={activeRecipient} onChange={setActiveRecipient} />

      {/* ORTA: 3 dikey kart */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <AnschreibenCard
          contact={contact}
          recipientType={activeRecipient}
          state={recipientState.anschreiben}
          onChange={(s) => updateActive({ anschreiben: s })}
          onInsertTemplate={handleInsertAnschreibenTemplate}
        />
        <EmailVersandCard
          contact={contact}
          recipientType={activeRecipient}
          state={recipientState.email}
          onChange={(s) => updateActive({ email: s })}
          onInsertTemplate={handleInsertEmailTemplate}
          onSend={handleSendEmail}
          showVxsButton={activeRecipient === 'werkstatt'}
        />
        <WhatsappVersandCard
          contact={contact}
          recipientType={activeRecipient}
          state={recipientState}
          onChange={(s) => updateActive(s)}
        />
      </div>

      {/* SAĞ: DOKUMENTE paneli */}
      <DokumentePanel
        activeRecipient={activeRecipient}
        documents={recipientState.documents}
        onToggle={handleDocToggle}
        onGesamtPdf={handleGesamtPdf}
        onAbschliessen={handleAbschliessen}
      />
    </div>
  );
}
