// Rapor Oluştur — admin panelinde yeni ekspertiz raporu hazırlama akışı.
// Akış: choice landing → (agent drawer | manuel form)

import React, { useState } from 'react';
import { C } from '../utils/tokens.js';
import { FileText, Database, Wrench } from './icons.jsx';
import AdminAutoiXpert from './AdminAutoiXpert.jsx';
import AdminReportEditor from './AdminReportEditor.jsx';
import GutachtenAgentWizard from './GutachtenAgentWizard.jsx';
import AgentCustomerPicker from './AgentCustomerPicker.jsx';

// AutoiXpert alt sekmesi geçici olarak gizli — yayına alınacağı zaman
// AUTOIXPERT_VISIBLE bayrağını true yap.
const AUTOIXPERT_VISIBLE = false;

const ALL_SUBTABS = [
  { key: 'editor',     label: 'Rapor Düzenleyici', icon: Wrench },
  { key: 'autoixpert', label: 'AutoiXpert',        icon: Database, hidden: !AUTOIXPERT_VISIBLE },
];
const SUBTABS = ALL_SUBTABS.filter((t) => !t.hidden);

export default function AdminReportCreate({ db, setDb, user } = {}) {
  // mode:
  //   'choice'  — başlangıç ekranı (Agent ile Doldur / Manuel Doldur)
  //   'agent'   — manuel form arkada açık + sağda agent drawer'ı
  //   'manual'  — sadece manuel form
  const [mode, setMode] = useState('choice');
  const [tab, setTab] = useState('editor');
  // Agent tamamladıktan sonra form'a inject edilen draft
  const [agentDraft, setAgentDraft] = useState(null);
  // Agent drawer açık mı
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Müşteri seçim modal'ı açık mı (agent başlatma adımı)
  const [pickerOpen, setPickerOpen] = useState(false);
  // Picker'dan gelen müşteri/araç ID'si — drawer'a geçirilir
  const [agentBindings, setAgentBindings] = useState({ customerId: null, vehicleId: null });
  // Editor'ı remount etmek için key (yeni draft geldiğinde fresh state)
  const [editorKey, setEditorKey] = useState(0);

  // Agent başlatılır → önce picker
  const handleStartAgent = () => {
    setPickerOpen(true);
  };

  // Picker'dan müşteri (ve varsa araç) seçildi → drawer'ı aç
  const handlePickerComplete = ({ customerId, vehicleId }) => {
    setAgentBindings({ customerId, vehicleId });
    setPickerOpen(false);
    setMode('agent');
    setDrawerOpen(true);
  };

  const handlePickerClose = () => {
    setPickerOpen(false);
  };

  // Manuel doldur seçildi
  const handleStartManual = () => {
    setAgentDraft(null);
    setMode('manual');
  };

  // Toast bildirim
  const [toast, setToast] = useState(null);

  // Agent tamamlandı — drafti DB'ye appraisal olarak kaydet, sonra form'a inject
  const handleAgentComplete = (draft) => {
    // Vehicle ID'yi belirle — picker'dan gelen veya müşterinin ilk aracı
    let vehicleId = agentBindings.vehicleId;
    const customerId = agentBindings.customerId;
    if (!vehicleId && customerId) {
      const ownVehicles = (db?.vehicles || []).filter((v) => v.owner_id === customerId);
      if (ownVehicles.length > 0) vehicleId = ownVehicles[0].id;
    }

    // Appraisal kaydet (sadece vehicle_id varsa — vehicle_id NOT NULL)
    if (vehicleId) {
      const newAppraisal = {
        id: 'ap_ai_' + Math.random().toString(36).slice(2, 10),
        vehicle_id: vehicleId,
        customer_id: customerId || null,
        status: 'tamamlandi',
        date: new Date().toISOString().slice(0, 10),
        expert: draft?.report?.assessor || 'Rohat Gecit',
        notes: draft?.calculation?.notes || 'AI Agent tarafından oluşturuldu.',
        result: { summary: draft?.report || {} },
        draft_data: draft,
        created_by: 'ai_agent',
        report_type: draft?.report?.type || null,
        source: 'ai_agent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setDb((prev) => ({
        ...prev,
        appraisals: [...(prev.appraisals || []), newAppraisal],
      }));

      setToast({
        kind: 'success',
        text: '🤖 Rapor müşterinin Ekspertiz alanına kaydedildi.',
      });
    } else {
      // Vehicle yoksa kayıt atlayacak — sadece form'a inject
      setToast({
        kind: 'info',
        text: 'ℹ️ Araç seçilmediği için rapor henüz Ekspertiz\'e kaydedilmedi. Form\'da düzenle ve manuel kaydet.',
      });
    }

    // Form'a inject (tüm durumlarda)
    setAgentDraft(draft);
    setEditorKey((k) => k + 1);
    setDrawerOpen(false);
    setMode('manual');

    // Toast otomatik kapansın
    setTimeout(() => setToast(null), 5000);
  };

  // Drawer kapatıldı (X veya backdrop)
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // Eğer agent modundaysa ve draft inject edilmediyse → choice'a dön
    if (mode === 'agent' && !agentDraft) {
      setMode('choice');
    }
  };

  // Choice ekranına dön (manuel mod'dan vazgeçme)
  const backToChoice = () => {
    setAgentDraft(null);
    setMode('choice');
  };

  // ─── CHOICE LANDING ─────────────────────────────────────────────────
  if (mode === 'choice') {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${C.neon}15`, border: `1px solid ${C.neon}33`, color: C.neon }}>
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: C.text, letterSpacing: '-0.02em' }}>
              Rapor Oluştur
            </h1>
            <p className="text-sm mt-1" style={{ color: C.textDim }}>
              Yeni ekspertiz raporunu nasıl hazırlamak istersin?
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          maxWidth: 880,
        }}>
          {/* Card 1: Agent ile Doldur — DEVRE DIŞI (geçici, sadece manuel mod aktif) */}
          <ChoiceCard
            icon="🤖"
            iconBg={`${C.neon}15`}
            iconBorder={C.neon}
            title="Agent ile Doldur"
            description="Yapay zeka asistanı sorular sorarak gerekli bilgileri toplar, ardından formu otomatik doldurur."
            tags={['🚀 Hızlı', '🎯 Akıllı default\'lar', '✨ DAT entegrasyonu']}
            cta="Yakında"
            disabled
            disabledReason="🔒 AI ile rapor oluşturma şu anda devre dışı — yakında aktif olacak."
          />

          {/* Card 2: Manuel Doldur — TEK AKTIF SEÇENEK */}
          <ChoiceCard
            icon="✏️"
            iconBg="rgba(0,0,0,0.04)"
            iconBorder={C.border}
            title="Manuel Doldurma"
            description="Tüm alanları kendin doldurursun. Mevcut müşteri seçince otomatik patch uygulanır."
            tags={['📋 Tam kontrol', '🧩 7 adımlı sihirbaz']}
            cta="Forma Geç"
            ctaPrimary
            onClick={handleStartManual}
          />
        </div>

        {/* Picker — choice mod'unda da görünmeli */}
        <AgentCustomerPicker
          open={pickerOpen}
          onClose={handlePickerClose}
          onPick={handlePickerComplete}
          db={db}
        />
      </div>
    );
  }

  // ─── MANUEL / AGENT FORM ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={backToChoice} type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.textDim, cursor: 'pointer',
            }}>
            ← Geri
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${C.neon}15`, border: `1px solid ${C.neon}33`, color: C.neon }}>
            <FileText size={20} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: C.text, letterSpacing: '-0.02em' }}>
            Rapor Oluştur
          </h1>
          {agentDraft && (
            <span style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: `${C.neon}15`, color: C.neon, border: `1px solid ${C.neon}33`,
            }}>
              🤖 Agent ile dolduruldu
            </span>
          )}
        </div>
        {/* Agent drawer'ı tekrar açma */}
        {!drawerOpen && (
          <button onClick={() => setDrawerOpen(true)} type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{
              background: `${C.neon}10`, border: `1px solid ${C.neon}40`,
              color: C.neon, cursor: 'pointer',
            }}>
            🤖 Agent ile Doldur
          </button>
        )}
      </div>

      <div role="tablist"
        className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: C.surface, border: `1px solid ${C.border}`, width: 'fit-content', maxWidth: '100%' }}>
        {SUBTABS.map((s) => {
          const Icon = s.icon;
          const isActive = tab === s.key;
          return (
            <button key={s.key} role="tab" aria-selected={isActive}
              onClick={() => setTab(s.key)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              style={{
                background: isActive ? C.neon : 'transparent',
                color: isActive ? '#fff' : C.text,
                boxShadow: isActive ? `0 4px 14px ${C.glow}` : 'none',
              }}>
              <Icon size={14} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === 'editor' && (
          <AdminReportEditor
            key={editorKey}
            db={db}
            initialDraftOverride={agentDraft}
          />
        )}
        {AUTOIXPERT_VISIBLE && tab === 'autoixpert' && <AdminAutoiXpert />}
      </div>

      {/* Agent wizard — kart-bazlı çok adımlı sürgülü panel */}
      <GutachtenAgentWizard
        open={drawerOpen}
        onClose={handleDrawerClose}
        onComplete={handleAgentComplete}
        customerId={agentBindings.customerId}
        vehicleId={agentBindings.vehicleId}
        db={db}
      />

      {/* Müşteri seçim modal'ı — choice'dan agent'a geçişte */}
      <AgentCustomerPicker
        open={pickerOpen}
        onClose={handlePickerClose}
        onPick={handlePickerComplete}
        db={db}
      />

      {/* Toast — agent kayıt sonrası */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ─── Toast komponenti ──────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const colors = {
    success: { bg: 'rgba(22,163,74,0.95)', border: '#16A34A' },
    info:    { bg: 'rgba(59,130,246,0.95)', border: '#3B82F6' },
    error:   { bg: 'rgba(220,38,38,0.95)', border: '#DC2626' },
  };
  const c = colors[toast.kind] || colors.info;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      maxWidth: 400, padding: '14px 18px',
      borderRadius: 12, color: '#fff',
      background: c.bg, border: `1px solid ${c.border}`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      fontSize: 13, fontWeight: 500, lineHeight: 1.5,
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideUp 0.25s ease-out',
    }}>
      <span style={{ flex: 1 }}>{toast.text}</span>
      <button onClick={onClose} type="button"
        style={{
          background: 'rgba(255,255,255,0.2)', border: 'none',
          color: '#fff', width: 22, height: 22, borderRadius: 6,
          cursor: 'pointer', fontSize: 14, lineHeight: 1,
        }}>×</button>
    </div>
  );
}

// ─── Choice Card ────────────────────────────────────────────────────────
function ChoiceCard({ icon, iconBg, iconBorder, title, description, tags, cta, ctaPrimary, onClick, disabled, disabledReason }) {
  return (
    <button onClick={disabled ? undefined : onClick} type="button" disabled={disabled}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
        padding: 24, borderRadius: 14,
        background: disabled ? 'rgba(0,0,0,0.02)' : C.surface,
        border: `1px solid ${C.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s',
        opacity: disabled ? 0.55 : 1,
        filter: disabled ? 'grayscale(0.6)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = C.neon;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${C.glow}`;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
      {/* Devre dışı rozeti — sağ üst */}
      {disabled && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(0,0,0,0.7)', color: '#fff',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          🔒 Yakında
        </span>
      )}
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: iconBg, border: `1px solid ${iconBorder}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.55 }}>
          {description}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((t, i) => (
          <span key={i} style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 10.5,
            background: 'rgba(0,0,0,0.04)', color: C.textDim,
            border: `1px solid ${C.border}`,
          }}>{t}</span>
        ))}
      </div>
      {disabled && disabledReason && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginTop: -4,
          background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`,
          fontSize: 11.5, color: C.textDim, lineHeight: 1.5,
        }}>
          {disabledReason}
        </div>
      )}
      <div style={{
        marginTop: 'auto', padding: '8px 14px', borderRadius: 8,
        background: disabled
          ? 'rgba(0,0,0,0.06)'
          : (ctaPrimary ? C.neon : 'transparent'),
        color: disabled
          ? C.textDim
          : (ctaPrimary ? '#fff' : C.text),
        border: disabled
          ? `1px solid ${C.border}`
          : (ctaPrimary ? 'none' : `1px solid ${C.border}`),
        fontSize: 13, fontWeight: 600,
        boxShadow: !disabled && ctaPrimary ? `0 2px 8px ${C.glow}` : 'none',
      }}>
        {cta} {!disabled && '→'}
      </div>
    </button>
  );
}
