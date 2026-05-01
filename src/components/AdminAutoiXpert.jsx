// AutoiXpert Spiegel — admin & avukat panelinde AutoiXpert'in
// modul yapisini ayna olarak sunan iskelet component.
//
// AutoiXpert'in orijinal UI'sindeki 6 modul:
//   Aufgaben       (Görevler)
//   Auswertungen   (Analitik)
//   Kontakte       (Kişiler)
//   Meine Gutachten (Raporlarım)
//   Optionen       (Ayarlar)
//   Rechnungen     (Faturalar)
//
// admin: RLS sayesinde verilere erişebilir → dolu görüntü
// lawyer: RLS bloklar → otomatik boş iskelet
//
// Ref: docs/ADR/0001-autoixpert-mirror.md

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { getSupabaseClient } from '../utils/supabaseAuth.js';
import { ReportDetail, ContactDetail, InvoiceDetail } from './AutoiXpertDetail.jsx';
import GutachtenWorkbench from './GutachtenWorkbench.jsx';

const MODULES = [
  { key: 'aufgaben',     label: 'Aufgaben',       emoji: '✅', kind: 'placeholder', subtitle: 'Görevler ve takip' },
  { key: 'auswertungen', label: 'Auswertungen',   emoji: '📊', kind: 'placeholder', subtitle: 'İstatistik ve grafik' },
  { key: 'kontakte',     label: 'Kontakte',       emoji: '👥', kind: 'data', table: 'autoixpert_contacts',  subtitle: 'Kişi yönetimi' },
  { key: 'gutachten',    label: 'Meine Gutachten', emoji: '📋', kind: 'data', table: 'autoixpert_reports',   subtitle: 'Ekspertiz raporları' },
  { key: 'optionen',     label: 'Optionen',       emoji: '⚙️', kind: 'placeholder', subtitle: 'Tercih ve ayarlar' },
  { key: 'rechnungen',   label: 'Rechnungen',     emoji: '💶', kind: 'data', table: 'autoixpert_invoices',  subtitle: 'Faturalandırma' },
];

const PAGE_LIMIT = 500;

// List view'da çekilecek sütunlar — raw_payload gibi büyük JSONB'leri
// dahil etmiyoruz (timeout'u önlemek için). Detay tıklanınca tek satır
// için raw_payload da dahil tüm alanlar ayrı sorguyla çekilir.
const LIST_COLUMNS = {
  gutachten: 'id,external_id,type,state,token,created_at,order_date,completion_date,location_id,responsible_assessor_id,claimant,car,external_updated_at,synced_at',
  kontakte:  'id,external_id,organization_type,salutation,first_name,last_name,organization_name,email,phone,phone2,city,zip,vat_id,debtor_number,created_at,external_updated_at,synced_at',
  rechnungen: 'id,number,date,date_of_supply,total_net,total_gross,vat_rate,due_date,has_outstanding_payments,current_unpaid_amount,is_fully_canceled,cancels_invoice_id,is_electronic_invoice_enabled,location_id,recipient,created_at,external_updated_at,synced_at',
};

export default function AdminAutoiXpert({ mode = 'admin' }) {
  const [activeModule, setActiveModule] = useState('gutachten');
  const [counts, setCounts] = useState({});
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [lastSyncMap, setLastSyncMap] = useState({});

  // Sayım + sync durumu (tek seferlik)
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;
    let mounted = true;
    (async () => {
      try {
        const dataModules = MODULES.filter((m) => m.kind === 'data');
        const [results, syncRes] = await Promise.all([
          Promise.all(
            dataModules.map((m) =>
              sb.from(m.table).select('id', { count: 'exact', head: true })
            )
          ),
          sb.from('autoixpert_sync_status').select('*'),
        ]);
        if (!mounted) return;
        const c = {};
        dataModules.forEach((m, i) => { c[m.key] = results[i].count ?? 0; });
        setCounts(c);
        if (syncRes.data) {
          const map = {};
          for (const row of syncRes.data) map[row.resource] = row;
          setLastSyncMap(map);
        }
      } catch (e) {
        console.warn('[AutoiXpert] count failed:', e?.message);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Aktif modul verisini lazy yükle
  // Performans: raw_payload (büyük JSONB) list view'da çekilmez —
  // satıra tıklayınca detay için ayrı sorgu yapılır.
  useEffect(() => {
    const mod = MODULES.find((m) => m.key === activeModule);
    if (!mod || mod.kind !== 'data' || data[activeModule]) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // List view: sadece UI'da görünen sütunları çek (timeout'u önlemek için)
        const listColumns = LIST_COLUMNS[activeModule] || '*';
        const { data: rows, error: dbErr } = await sb
          .from(mod.table)
          .select(listColumns)
          .order('created_at', { ascending: false })
          .limit(PAGE_LIMIT);
        if (!mounted) return;
        if (dbErr) throw dbErr;
        setData((prev) => ({ ...prev, [activeModule]: rows ?? [] }));
      } catch (e) {
        if (mounted) setError(e?.message || 'Bilinmeyen hata');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeModule, data]);

  const activeMod = MODULES.find((m) => m.key === activeModule);
  const rows = activeMod?.kind === 'data' ? data[activeModule] : null;
  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, search]);

  // Satıra tıklayınca tam kaydı (raw_payload dahil) ayrı sorguyla çek
  const openDetail = async (record) => {
    if (!record?.id || !activeMod?.table) return;
    setDetail(record); // önce hızlı görünüm (mevcut alanlarla)
    const sb = getSupabaseClient();
    if (!sb) return;
    const { data: full, error } = await sb
      .from(activeMod.table)
      .select('*')
      .eq('id', record.id)
      .maybeSingle();
    if (!error && full) {
      setDetail(full); // tam veriyle güncelle (raw_payload dahil)
    }
  };

  // Detay modu — bir kayıt seçildiyse tam detay görünümü göster
  // Gutachten: AutoiXpert tarzı düzenlenebilir Workbench
  // Kontakte / Rechnungen: read-only detay
  if (detail && activeMod?.kind === 'data') {
    if (activeMod.key === 'gutachten') return <GutachtenWorkbench report={detail} onBack={() => setDetail(null)} />;
    if (activeMod.key === 'kontakte') return <ContactDetail contact={detail} onBack={() => setDetail(null)} />;
    if (activeMod.key === 'rechnungen') return <InvoiceDetail invoice={detail} onBack={() => setDetail(null)} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: C.text }}>
          AutoiXpert Spiegel
        </h1>
        <p className="text-sm" style={{ color: C.textDim }}>
          Spiegel der AutoiXpert-Daten · 6 Module wie im Original
          {mode === 'lawyer' && ' · Lese-Modus (Anwalt)'}
        </p>
      </div>

      {/* Module quick stats / nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {MODULES.map((m) => {
          const isActive = activeModule === m.key;
          const count = m.kind === 'data' ? counts[m.key] : null;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveModule(m.key)}
              className="text-left rounded-xl p-3 transition-all"
              style={{
                background: isActive ? `${C.neon}10` : 'rgba(0,0,0,0.04)',
                border: `1px solid ${isActive ? C.neon : C.border}`,
              }}
            >
              <div className="text-xl mb-1">{m.emoji}</div>
              <div className="text-xs font-semibold" style={{ color: C.text }}>
                {m.label}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: C.textDim }}>
                {m.subtitle}
              </div>
              {count !== null && (
                <div className="text-base font-bold font-mono mt-2" style={{ color: C.text }}>
                  {count}
                </div>
              )}
              {m.kind === 'placeholder' && (
                <div
                  className="text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.05)', color: C.textDim }}
                >
                  bald verfügbar
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      {activeMod?.kind === 'placeholder' && (
        <PlaceholderSection module={activeMod} />
      )}

      {activeMod?.kind === 'data' && (
        <DataSection
          module={activeMod}
          rows={rows}
          filtered={filtered}
          loading={loading}
          error={error}
          search={search}
          setSearch={setSearch}
          onRowClick={openDetail}
          lastSync={lastSyncMap[activeMod.key]?.last_complete_run_at}
        />
      )}

    </div>
  );
}

// ─── Placeholder modules (Aufgaben / Auswertungen / Optionen) ──────────
function PlaceholderSection({ module: m }) {
  return (
    <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(0,0,0,0.02)', border: `1px dashed ${C.border}` }}>
      <div className="text-5xl mb-4">{m.emoji}</div>
      <h2 className="text-xl font-bold mb-2" style={{ color: C.text }}>{m.label}</h2>
      <p className="text-sm mb-6" style={{ color: C.textDim }}>{m.subtitle}</p>
      <div className="max-w-md mx-auto space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}` }}
          >
            <div className="w-10 h-10 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(0,0,0,0.06)' }} />
              <div className="h-2 rounded-full w-1/2" style={{ background: 'rgba(0,0,0,0.04)' }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs mt-6" style={{ color: C.textDim }}>
        Bu modül için içerik henüz hazırlanmadı. Yapı tamamlandığında veriler burada görünecek.
      </p>
    </div>
  );
}

// ─── Data modules (Kontakte / Gutachten / Rechnungen) ──────────────────
function DataSection({ module: m, rows, filtered, loading, error, search, setSearch, onRowClick, lastSync }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche…"
          className="flex-1 md:max-w-sm px-4 py-2 rounded-lg text-sm outline-none transition-colors"
          style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`, color: C.text }}
          onFocus={(e) => (e.target.style.borderColor = C.neon)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        {filtered && (
          <span className="text-xs" style={{ color: C.textDim }}>
            {filtered.length} / {rows?.length ?? 0}
            {rows?.length === PAGE_LIMIT && ` (Limit ${PAGE_LIMIT})`}
          </span>
        )}
        {lastSync && (
          <span className="text-xs ml-auto" style={{ color: C.textDim }}>
            Letzte Sync: {formatDateTime(lastSync)}
          </span>
        )}
      </div>

      {loading && (
        <div className="text-sm py-12 text-center" style={{ color: C.textDim }}>
          Wird geladen…
        </div>
      )}

      {error && (
        <div
          className="text-sm rounded-lg px-4 py-3"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#B91C1C' }}
        >
          Erişim engellendi: {error}
          <p className="mt-1 text-[11px]" style={{ color: '#9B2C2C' }}>
            (Bu rol için RLS izinleri kısıtlı olabilir.)
          </p>
        </div>
      )}

      {!loading && !error && filtered && filtered.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: C.textDim }}>
          Henüz kayıt yok.
        </div>
      )}

      {!loading && !error && filtered && filtered.length > 0 && (
        <>
          {m.key === 'gutachten'  && <ReportsTable  rows={filtered} onRowClick={onRowClick} />}
          {m.key === 'kontakte'   && <ContactsTable rows={filtered} onRowClick={onRowClick} />}
          {m.key === 'rechnungen' && <InvoicesTable rows={filtered} onRowClick={onRowClick} />}
        </>
      )}
    </div>
  );
}

function ReportsTable({ rows, onRowClick }) {
  return (
    <TableShell>
      <thead style={{ background: 'rgba(0,0,0,0.04)' }}>
        <tr>
          <Th>Aktenzeichen</Th>
          <Th>Anspruchsteller</Th>
          <Th>Fahrzeug</Th>
          <Th>Typ</Th>
          <Th>Status</Th>
          <Th>Erstellt</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} onClick={() => onRowClick(r)} className="cursor-pointer transition-colors hover:bg-black/5">
            <Td><span className="font-mono text-xs">{r.token || '—'}</span></Td>
            <Td>{formatPerson(r.claimant)}</Td>
            <Td><span className="text-xs">{formatCar(r.car)}</span></Td>
            <Td><Badge tone="info">{r.type}</Badge></Td>
            <Td><Badge tone={r.state === 'done' ? 'success' : 'warn'}>{r.state}</Badge></Td>
            <Td className="text-xs whitespace-nowrap">{formatDate(r.created_at)}</Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function ContactsTable({ rows, onRowClick }) {
  return (
    <TableShell>
      <thead style={{ background: 'rgba(0,0,0,0.04)' }}>
        <tr>
          <Th>Typ</Th>
          <Th>Name / Firma</Th>
          <Th>E-Mail</Th>
          <Th>Telefon</Th>
          <Th>Ort</Th>
          <Th>Erstellt</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} onClick={() => onRowClick(r)} className="cursor-pointer transition-colors hover:bg-black/5">
            <Td><Badge tone="info">{r.organization_type}</Badge></Td>
            <Td>{r.organization_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—'}</Td>
            <Td className="text-xs">{r.email || '—'}</Td>
            <Td className="text-xs font-mono">{r.phone || '—'}</Td>
            <Td>{r.city || '—'}</Td>
            <Td className="text-xs whitespace-nowrap">{formatDate(r.created_at)}</Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function InvoicesTable({ rows, onRowClick }) {
  return (
    <TableShell>
      <thead style={{ background: 'rgba(0,0,0,0.04)' }}>
        <tr>
          <Th>Nr.</Th>
          <Th>Empfänger</Th>
          <Th>Datum</Th>
          <Th className="text-right">Brutto</Th>
          <Th>Bezahlt</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} onClick={() => onRowClick(r)} className="cursor-pointer transition-colors hover:bg-black/5">
            <Td><span className="font-mono text-xs">{r.number || '—'}</span></Td>
            <Td>{formatPerson(r.recipient)}</Td>
            <Td className="text-xs whitespace-nowrap">{formatDate(r.date)}</Td>
            <Td className="text-right font-mono">{r.total_gross != null ? `${Number(r.total_gross).toFixed(2)} €` : '—'}</Td>
            <Td>{r.has_outstanding_payments ? <Badge tone="warn">Offen</Badge> : <Badge tone="success">Bezahlt</Badge>}</Td>
            <Td>{r.is_fully_canceled ? <Badge tone="error">Storniert</Badge> : <Badge tone="info">Aktiv</Badge>}</Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function DetailModal({ record, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        style={{ border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: C.border }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: C.text }}>Datensatz Details</h3>
            <p className="text-xs font-mono mt-0.5" style={{ color: C.textDim }}>ID: {record.id}</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-2xl leading-none px-3 py-1 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: C.textDim }} aria-label="Schließen">×</button>
        </div>
        <div className="p-5 overflow-auto">
          <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: C.text, lineHeight: 1.6 }}>
            {JSON.stringify(record.raw_payload || record, null, 2)}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Cell helpers ──────────────────────────────────────────────────────
function TableShell({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${C.border}` }}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th className={`text-left text-[10px] uppercase tracking-wider font-semibold py-3 px-3 ${className}`}
        style={{ color: C.textDim }}>{children}</th>
  );
}

function Td({ children, className = '' }) {
  return (
    <td className={`py-3 px-3 ${className}`} style={{ color: C.text, borderTop: `1px solid ${C.border}` }}>
      {children}
    </td>
  );
}

const TONES = {
  success: { bg: 'rgba(52,211,153,0.10)', color: '#059669', border: 'rgba(52,211,153,0.30)' },
  warn:    { bg: 'rgba(245,158,11,0.10)', color: '#D97706', border: 'rgba(245,158,11,0.30)' },
  error:   { bg: 'rgba(239,68,68,0.10)',  color: '#DC2626', border: 'rgba(239,68,68,0.30)' },
  info:    { bg: 'rgba(99,102,241,0.10)', color: '#4F46E5', border: 'rgba(99,102,241,0.30)' },
};

function Badge({ tone = 'info', children }) {
  const t = TONES[tone] || TONES.info;
  return (
    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium font-mono"
      style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
      {children}
    </span>
  );
}

function formatPerson(obj) {
  if (!obj) return '—';
  const name = obj.organization_name || `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
  return name || '—';
}

function formatCar(car) {
  if (!car) return '—';
  const plate = car.license_plate ? `[${car.license_plate}]` : '';
  const model = `${car.make || ''} ${car.model || ''}`.trim();
  return [plate, model].filter(Boolean).join(' ') || '—';
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' }); }
  catch (e) { return String(iso).slice(0, 10); }
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return String(iso); }
}
