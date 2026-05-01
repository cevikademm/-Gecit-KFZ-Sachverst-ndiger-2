// AutoiXpert Spiegel — Admin görünümü
// Supabase'deki autoixpert_* tablolarını okur, read-only listeler.
// Ref: docs/ADR/0001-autoixpert-mirror.md

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { getSupabaseClient } from '../utils/supabaseAuth.js';

const TABS = [
  { key: 'reports',  label: 'Gutachten',  emoji: '📋' },
  { key: 'contacts', label: 'Kontakte',   emoji: '👥' },
  { key: 'invoices', label: 'Rechnungen', emoji: '💶' },
];

const PAGE_LIMIT = 500;

export default function AdminAutoiXpert() {
  const [activeTab, setActiveTab] = useState('reports');
  const [data, setData] = useState({ reports: null, contacts: null, invoices: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [counts, setCounts] = useState({ reports: 0, contacts: 0, invoices: 0 });
  const [lastSyncMap, setLastSyncMap] = useState({});

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;
    let mounted = true;
    (async () => {
      try {
        const [r, c, i, sync] = await Promise.all([
          sb.from('autoixpert_reports').select('id', { count: 'exact', head: true }),
          sb.from('autoixpert_contacts').select('id', { count: 'exact', head: true }),
          sb.from('autoixpert_invoices').select('id', { count: 'exact', head: true }),
          sb.from('autoixpert_sync_status').select('*'),
        ]);
        if (!mounted) return;
        setCounts({
          reports:  r.count ?? 0,
          contacts: c.count ?? 0,
          invoices: i.count ?? 0,
        });
        if (sync.data) {
          const map = {};
          for (const row of sync.data) map[row.resource] = row;
          setLastSyncMap(map);
        }
      } catch (e) {
        console.warn('[AdminAutoiXpert] count load failed:', e?.message);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (data[activeTab] !== null) return;
    const sb = getSupabaseClient();
    if (!sb) { setError('Supabase bağlantısı yok'); return; }
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const table = `autoixpert_${activeTab}`;
        const { data: rows, error: dbErr } = await sb
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(PAGE_LIMIT);
        if (!mounted) return;
        if (dbErr) throw dbErr;
        setData((prev) => ({ ...prev, [activeTab]: rows ?? [] }));
      } catch (e) {
        if (mounted) setError(e?.message || 'Bilinmeyen hata');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeTab, data]);

  const rows = data[activeTab];
  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: C.text }}>
          AutoiXpert Spiegel
        </h1>
        <p className="text-sm" style={{ color: C.textDim }}>
          Read-only Mirror der AutoiXpert-Daten. Quelle: app.autoixpert.de · Befehl{' '}
          <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.05)' }}>
            npm run autoixpert:import
          </code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {TABS.map((t) => {
          const ls = lastSyncMap[t.key]?.last_complete_run_at;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className="text-left rounded-xl p-4 transition-all hover:translate-y-[-2px]"
              style={{
                background: activeTab === t.key ? `${C.neon}10` : 'rgba(0,0,0,0.04)',
                border: `1px solid ${activeTab === t.key ? C.neon : C.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider" style={{ color: C.textDim }}>
                  {t.emoji} {t.label}
                </span>
              </div>
              <p className="text-3xl font-bold font-mono" style={{ color: C.text }}>
                {counts[t.key]}
              </p>
              {ls && (
                <p className="text-[10px] mt-1" style={{ color: C.textDim }}>
                  Letzte Sync: {formatDateTime(ls)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: C.border }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === t.key ? C.text : C.textDim,
              borderBottom: activeTab === t.key ? `2px solid ${C.neon}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.emoji} {t.label}
            <span className="ml-2 text-xs font-mono" style={{ color: C.textDim }}>
              ({counts[t.key]})
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche (Volltext über JSON)…"
          className="w-full md:max-w-sm px-4 py-2 rounded-lg text-sm outline-none transition-colors"
          style={{
            background: 'rgba(0,0,0,0.04)',
            border: `1px solid ${C.border}`,
            color: C.text,
          }}
          onFocus={(e) => (e.target.style.borderColor = C.neon)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        {filtered && (
          <span className="ml-3 text-xs" style={{ color: C.textDim }}>
            {filtered.length} / {rows?.length ?? 0} Einträge
            {rows?.length === PAGE_LIMIT && ` (Limit: ${PAGE_LIMIT})`}
          </span>
        )}
      </div>

      {loading && <div className="text-sm py-8 text-center" style={{ color: C.textDim }}>Wird geladen…</div>}
      {error && (
        <div
          className="text-sm rounded-lg px-4 py-3"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#B91C1C' }}
        >
          Fehler beim Laden: {error}
        </div>
      )}

      {!loading && !error && filtered && (
        <>
          {activeTab === 'reports' && <ReportsTable rows={filtered} onRowClick={setDetail} />}
          {activeTab === 'contacts' && <ContactsTable rows={filtered} onRowClick={setDetail} />}
          {activeTab === 'invoices' && <InvoicesTable rows={filtered} onRowClick={setDetail} />}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: C.textDim }}>
              Keine Einträge gefunden.
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {detail && <DetailModal record={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
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
          <tr
            key={r.id}
            onClick={() => onRowClick(r)}
            className="cursor-pointer transition-colors hover:bg-black/5"
          >
            <Td>
              <span className="font-mono text-xs">{r.token || '—'}</span>
            </Td>
            <Td>{formatPerson(r.claimant)}</Td>
            <Td>
              <span className="text-xs">{formatCar(r.car)}</span>
            </Td>
            <Td>
              <Badge tone="info">{r.type}</Badge>
            </Td>
            <Td>
              <Badge tone={r.state === 'done' ? 'success' : 'warn'}>{r.state}</Badge>
            </Td>
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
          <tr
            key={r.id}
            onClick={() => onRowClick(r)}
            className="cursor-pointer transition-colors hover:bg-black/5"
          >
            <Td>
              <Badge tone="info">{r.organization_type}</Badge>
            </Td>
            <Td>
              {r.organization_name ||
                `${r.first_name || ''} ${r.last_name || ''}`.trim() ||
                '—'}
            </Td>
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
          <tr
            key={r.id}
            onClick={() => onRowClick(r)}
            className="cursor-pointer transition-colors hover:bg-black/5"
          >
            <Td>
              <span className="font-mono text-xs">{r.number || '—'}</span>
            </Td>
            <Td>{formatPerson(r.recipient)}</Td>
            <Td className="text-xs whitespace-nowrap">{formatDate(r.date)}</Td>
            <Td className="text-right font-mono">
              {r.total_gross != null ? `${Number(r.total_gross).toFixed(2)} €` : '—'}
            </Td>
            <Td>
              {r.has_outstanding_payments ? (
                <Badge tone="warn">Offen</Badge>
              ) : (
                <Badge tone="success">Bezahlt</Badge>
              )}
            </Td>
            <Td>
              {r.is_fully_canceled ? (
                <Badge tone="error">Storniert</Badge>
              ) : (
                <Badge tone="info">Aktiv</Badge>
              )}
            </Td>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        style={{ border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: C.border }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: C.text }}>
              Datensatz Details
            </h3>
            <p className="text-xs font-mono mt-0.5" style={{ color: C.textDim }}>
              ID: {record.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none px-3 py-1 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: C.textDim }}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-auto">
          <pre
            className="text-xs font-mono whitespace-pre-wrap"
            style={{ color: C.text, lineHeight: 1.6 }}
          >
            {JSON.stringify(record.raw_payload || record, null, 2)}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TableShell({ children }) {
  return (
    <div
      className="overflow-x-auto rounded-xl"
      style={{ border: `1px solid ${C.border}` }}
    >
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th
      className={`text-left text-[10px] uppercase tracking-wider font-semibold py-3 px-3 ${className}`}
      style={{ color: C.textDim }}
    >
      {children}
    </th>
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
    <span
      className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium font-mono"
      style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}
    >
      {children}
    </span>
  );
}

function formatPerson(obj) {
  if (!obj) return '—';
  const name =
    obj.organization_name ||
    `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
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
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (e) {
    return String(iso).slice(0, 10);
  }
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return String(iso);
  }
}
