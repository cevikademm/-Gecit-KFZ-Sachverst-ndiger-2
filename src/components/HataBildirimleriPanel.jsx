// ─── Hata Bildirimleri Paneli (Admin) ───────────────────────────────
// error_reports kayıtlarını listeler: ekran görüntüsü, açıklama, önem, durum.
// Admin durumu değiştirebilir, görüntüyü büyütebilir, WhatsApp'tan iletebilir.
// FAB/gönderim: src/components/HataBildirWidget.jsx
import React, { useState, useMemo } from 'react';
import { C } from '../utils/tokens.js';
import { buildWhatsAppText, openWhatsApp } from '../utils/errorReportClient.js';

const SEV = {
  low:    { label: 'Düşük',       color: '#16A34A' },
  normal: { label: 'Normal',      color: '#F59E0B' },
  high:   { label: 'Yüksek/Acil', color: '#EF4444' },
};
const STATUS = {
  new:         { label: 'Yeni',        color: '#EF4444' },
  in_progress: { label: 'İnceleniyor', color: '#F59E0B' },
  resolved:    { label: 'Çözüldü',     color: '#16A34A' },
};
const FILTERS = [
  { key: 'all',         label: 'Tümü' },
  { key: 'new',         label: 'Yeni' },
  { key: 'in_progress', label: 'İnceleniyor' },
  { key: 'resolved',    label: 'Çözüldü' },
];

const fmtDate = (s) => { try { return new Date(s).toLocaleString('tr-TR'); } catch (e) { return s || ''; } };

export default function HataBildirimleriPanel({ db, setDb }) {
  const [filter, setFilter] = useState('all');
  const [zoom, setZoom] = useState(null); // büyütülen görüntü src

  const reports = useMemo(() => {
    const list = Array.isArray(db?.error_reports) ? [...db.error_reports] : [];
    return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }, [db?.error_reports]);

  const filtered = useMemo(
    () => (filter === 'all' ? reports : reports.filter((r) => (r.status || 'new') === filter)),
    [reports, filter]
  );

  const counts = useMemo(() => ({
    all: reports.length,
    new: reports.filter((r) => (r.status || 'new') === 'new').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  }), [reports]);

  const setStatus = (id, status) => {
    setDb((prev) => ({
      ...prev,
      error_reports: (prev.error_reports || []).map((r) =>
        r.id === id ? { ...r, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null } : r
      ),
    }));
  };

  const remove = (id) => {
    if (!window.confirm('Bu hata bildirimini silmek istediğinize emin misiniz?')) return;
    setDb((prev) => ({ ...prev, error_reports: (prev.error_reports || []).filter((r) => r.id !== id) }));
  };

  const imgSrc = (r) => r.screenshot_url || r.screenshot_data || null;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text }}>🐞 Hata Bildirimleri</h1>
        <p style={{ margin: '4px 0 0', color: C.textDim, fontSize: 14 }}>
          Kullanıcıların WhatsApp ile ilettiği hatalar, ekran görüntüsü ve açıklamasıyla burada toplanır.
        </p>
      </div>

      {/* Filtre sekmeleri */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                border: `1.5px solid ${active ? C.primary : C.border}`,
                background: active ? `${C.primary}14` : C.surface,
                color: active ? C.primary : C.textDim,
              }}>
              {f.label} <span style={{ opacity: 0.7 }}>({counts[f.key] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', color: C.textDim, border: `1px dashed ${C.borderStrong}`, borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Bu filtrede hata bildirimi yok.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.map((r) => {
            const sev = SEV[r.severity] || SEV.normal;
            const st = STATUS[r.status || 'new'] || STATUS.new;
            const src = imgSrc(r);
            return (
              <div key={r.id} style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {/* Görüntü */}
                {src ? (
                  <button onClick={() => setZoom(src)} title="Büyüt"
                    style={{ border: 'none', padding: 0, cursor: 'zoom-in', background: '#f3f4f6', display: 'block' }}>
                    <img src={src} alt="Hata ekran görüntüsü" style={{ display: 'block', width: '100%', height: 160, objectFit: 'cover' }} />
                  </button>
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: C.textDim, fontSize: 13 }}>
                    Ekran görüntüsü yok
                  </div>
                )}

                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {/* Rozetler */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={badge(st.color)}>{st.label}</span>
                    <span style={badge(sev.color)}>{sev.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: C.textDim }}>{fmtDate(r.created_at)}</span>
                  </div>

                  {/* Açıklama */}
                  <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.description}</p>

                  {/* Meta */}
                  <div style={{ fontSize: 11.5, color: C.textDim, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                    <div><b>Sayfa:</b> {r.page_path || '—'}</div>
                    <div><b>Bildiren:</b> {r.reporter_name || '—'} {r.reporter_email ? `· ${r.reporter_email}` : ''}</div>
                    <div><b>Ekran:</b> {r.screen_size || '—'}</div>
                  </div>

                  {/* Aksiyonlar */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 4 }}>
                    {(r.status || 'new') !== 'in_progress' && (r.status || 'new') !== 'resolved' && (
                      <button onClick={() => setStatus(r.id, 'in_progress')} style={actBtn(C, '#F59E0B')}>İncele</button>
                    )}
                    {(r.status || 'new') !== 'resolved' && (
                      <button onClick={() => setStatus(r.id, 'resolved')} style={actBtn(C, '#16A34A')}>Çözüldü</button>
                    )}
                    {r.status === 'resolved' && (
                      <button onClick={() => setStatus(r.id, 'new')} style={actBtn(C, C.textDim)}>Yeniden Aç</button>
                    )}
                    <button onClick={() => openWhatsApp(buildWhatsAppText(r))} style={actBtn(C, '#128C7E')}>WhatsApp</button>
                    {r.page_url && (
                      <button onClick={() => window.open(r.page_url, '_blank', 'noopener')} style={actBtn(C, C.textDim)}>Sayfaya Git</button>
                    )}
                    <button onClick={() => remove(r.id)} style={actBtn(C, '#EF4444')} title="Sil">Sil</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Görüntü büyütme */}
      {zoom && (
        <div onClick={() => setZoom(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2147482000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
          <img src={zoom} alt="Hata ekran görüntüsü (büyük)" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setZoom(null)} style={{ position: 'fixed', top: 18, right: 18, width: 40, height: 40, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  );
}

const badge = (color) => ({
  fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
  background: `${color}1a`, color, border: `1px solid ${color}44`,
});
const actBtn = (C, color) => ({
  padding: '6px 11px', borderRadius: 9, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
  border: `1px solid ${color}55`, background: `${color}12`, color,
});
