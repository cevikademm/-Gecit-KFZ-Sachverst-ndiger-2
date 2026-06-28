// ─── Hata Bildir Widget ──────────────────────────────────────────────
// Ekranın altında WhatsApp ikonu (FAB). Yalnızca admin (super_admin/admin)
// girişinde görünür. Tıklayınca:
//   1) Görünür sayfanın ekran görüntüsünü alır (html2canvas)
//   2) Açan modalda görüntüyü "dosya eki" olarak gösterir
//   3) Admin hatayı açıklar, önem derecesi seçer
//   4) Kayıt error_reports tablosuna durable olarak yazılır (onSubmit)
//   5) WhatsApp destek hattı önceden doldurulmuş metinle açılır + görüntü indirilir
//
// Tablo/SQL: supabase_migration_error_reports.sql · Yardımcı: utils/errorReportClient.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { C } from '../utils/tokens.js';
import {
  captureScreenshot, uploadScreenshot, makeReportId,
  buildWhatsAppText, openWhatsApp, downloadDataUrl, getAdminPhone,
  dataUrlToFile, shareScreenshotFile,
} from '../utils/errorReportClient.js';

const WA_GREEN = '#25D366';
const WA_GREEN_DARK = '#128C7E';
const Z_FAB = 2147480000;
const Z_MODAL = 2147481000;

const ADMIN_ROLES = ['super_admin', 'admin'];

// WhatsApp glyph (App.jsx'teki ile aynı path).
function WhatsAppGlyph({ size = 28, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const SEVERITIES = [
  { key: 'low',    label: 'Düşük',       color: '#16A34A' },
  { key: 'normal', label: 'Normal',      color: '#F59E0B' },
  { key: 'high',   label: 'Yüksek/Acil', color: '#EF4444' },
];

function collectMeta() {
  if (typeof window === 'undefined') return {};
  return {
    page_url: window.location?.href || '',
    page_path: (window.location?.pathname || '') + (window.location?.hash || ''),
    user_agent: navigator?.userAgent || '',
    screen_size: `${window.innerWidth}×${window.innerHeight}`,
    app_version: (import.meta.env?.VITE_APP_VERSION || '0.1.0'),
  };
}

export default function HataBildirWidget({ user, onSubmit }) {
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState(null); // data URL veya null
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('normal');
  const [meta, setMeta] = useState({});
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null); // { type, text }
  const fileInputRef = useRef(null);

  const reset = useCallback(() => {
    setScreenshot(null);
    setDescription('');
    setSeverity('normal');
    setSending(false);
  }, []);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && !sending) closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sending]);

  const showToast = useCallback((type, text, ms = 4200) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), ms);
  }, []);

  const closeModal = useCallback(() => { setOpen(false); reset(); }, [reset]);

  // FAB → önce görüntü al, sonra modalı aç (modal görüntüde çıkmasın diye).
  const handleOpen = useCallback(async () => {
    if (open || capturing) return;
    setCapturing(true);
    setMeta(collectMeta());
    // FAB'ın gizlenmesi (capture sırasında) için bir frame bekle.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const shot = await captureScreenshot();
    setScreenshot(shot);
    setCapturing(false);
    setOpen(true);
    if (!shot) {
      showToast('warn', 'Otomatik ekran görüntüsü alınamadı. Manuel ekleyebilirsiniz.');
    }
  }, [open, capturing, showToast]);

  const handleRecapture = useCallback(async () => {
    setOpen(false);
    // modal kapanır kapanmaz tekrar yakala
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const shot = await captureScreenshot();
    setScreenshot(shot);
    setMeta(collectMeta());
    setOpen(true);
    if (!shot) showToast('warn', 'Ekran görüntüsü alınamadı.');
  }, [showToast]);

  const handleFilePick = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const buildRecord = useCallback(async ({ id, created_at } = {}) => {
    id = id || makeReportId();
    created_at = created_at || new Date().toISOString();
    let screenshot_url = null;
    let screenshot_path = null;
    let screenshot_data = null;

    if (screenshot) {
      const up = await uploadScreenshot(screenshot, id);
      if (up) {
        screenshot_url = up.url;
        screenshot_path = up.path;
      } else {
        // Yükleme yoksa (local mod / hata) base64 sakla — kayıp olmasın.
        screenshot_data = screenshot;
      }
    }

    return {
      id,
      reporter_name: user?.name || user?.email || 'Admin',
      reporter_email: user?.email || null,
      reporter_role: user?.role || 'admin',
      description: description.trim(),
      page_url: meta.page_url || null,
      page_path: meta.page_path || null,
      user_agent: meta.user_agent || null,
      screen_size: meta.screen_size || null,
      app_version: meta.app_version || null,
      severity,
      status: 'new',
      screenshot_path,
      screenshot_url,
      screenshot_data,
      console_errors: null,
      created_at,
      resolved_at: null,
    };
  }, [screenshot, user, description, meta, severity]);

  const persist = useCallback((rec) => {
    try { onSubmit && onSubmit(rec); } catch (e) { console.error('[HataBildir] persist:', e); }
  }, [onSubmit]);

  // WhatsApp ile gönder
  const handleSend = useCallback(async () => {
    if (sending) return;
    if (!description.trim()) { showToast('warn', 'Lütfen hatayı kısaca açıklayın.'); return; }
    setSending(true);
    const shot = screenshot;
    const id = makeReportId();
    const created_at = new Date().toISOString();
    try {
      // 1) ÖNCE native paylaşım: ekran görüntüsünü DOSYA olarak mesaja iliştir.
      //    wa.me deep-link dosya taşıyamaz; görüntüyü gerçekten eklemenin tek
      //    web yolu Web Share API'dir. Kullanıcı jesti (tıklama) hâlâ geçerliyken
      //    çağrılmalı (özellikle iOS için) → upload'tan ÖNCE deniyoruz.
      let shareOutcome = false;
      if (shot) {
        const baseRec = {
          id, created_at,
          reporter_name: user?.name || user?.email || 'Admin',
          reporter_role: user?.role || 'admin',
          description: description.trim(),
          page_url: meta.page_url || null,
          page_path: meta.page_path || null,
          screen_size: meta.screen_size || null,
          severity,
          screenshot_url: null, // dosya doğrudan ekleniyor
        };
        const file = dataUrlToFile(shot, `hata-${id}.jpg`);
        shareOutcome = await shareScreenshotFile({
          file,
          text: buildWhatsAppText(baseRec, { attached: true }),
        });
      }

      // 2) Kalıcı kayıt: Storage'a yükle + DB'ye yaz (her durumda yapılır).
      const rec = await buildRecord({ id, created_at });
      persist(rec);

      // 3) Görüntü native olarak paylaşıldıysa iş bitti. Aksi halde (desteklenmiyor
      //    VEYA kullanıcı paylaşımı iptal etti) → eski yol: görüntüyü indir +
      //    wa.me'yi metinle aç (yükleme başarılıysa Storage URL'i de metinde olur).
      if (shareOutcome === 'shared') {
        showToast('ok', 'Kaydedildi ve ekran görüntüsü WhatsApp\'a eklenerek paylaşıldı.');
      } else {
        if (shot) downloadDataUrl(shot, `hata-${rec.id}.jpg`);
        openWhatsApp(buildWhatsAppText(rec));
        showToast('ok', 'Kaydedildi. WhatsApp açıldı — görüntüyü ek olarak iliştirin.');
      }
      setOpen(false);
      reset();
    } catch (e) {
      console.error('[HataBildir] gönderim hatası:', e);
      showToast('warn', 'Bir sorun oluştu, tekrar deneyin.');
      setSending(false);
    }
  }, [sending, description, screenshot, meta, severity, user, buildRecord, persist, reset, showToast]);

  // Yalnızca kaydet (WhatsApp açmadan)
  const handleSaveOnly = useCallback(async () => {
    if (sending) return;
    if (!description.trim()) { showToast('warn', 'Lütfen hatayı kısaca açıklayın.'); return; }
    setSending(true);
    try {
      const rec = await buildRecord();
      persist(rec);
      setOpen(false);
      reset();
      showToast('ok', 'Hata bildirimi kaydedildi.');
    } catch (e) {
      console.error('[HataBildir] kayıt hatası:', e);
      showToast('warn', 'Kaydedilemedi, tekrar deneyin.');
      setSending(false);
    }
  }, [sending, description, buildRecord, persist, reset, showToast]);

  if (!isAdmin) return null;

  const phonePretty = `+${getAdminPhone()}`;

  return (
    <div data-hata-bildir-skip="1">
      {/* ─── FAB (ekranın altında WhatsApp ikonu) ─── */}
      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={capturing}
          title="Hata Bildir (WhatsApp)"
          aria-label="Hata Bildir"
          style={{
            position: 'fixed', right: 18, bottom: 18, zIndex: Z_FAB,
            width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: capturing ? 'wait' : 'pointer',
            background: `linear-gradient(145deg, ${WA_GREEN}, ${WA_GREEN_DARK})`,
            boxShadow: '0 10px 28px rgba(18,140,126,0.45), 0 2px 8px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .15s ease, box-shadow .15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.07)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {capturing
            ? <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'hb-spin 0.7s linear infinite' }} />
            : <WhatsAppGlyph size={30} />}
          {/* küçük "hata" rozeti */}
          <span style={{
            position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: '50%',
            background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>!</span>
        </button>
      )}

      {/* ─── Modal ─── */}
      {open && (
        <>
          <div
            onClick={() => !sending && closeModal()}
            style={{ position: 'fixed', inset: 0, zIndex: Z_MODAL, background: 'rgba(7,6,11,0.55)', backdropFilter: 'blur(3px)' }}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: Z_MODAL + 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0, pointerEvents: 'none' }}>
            <div
              role="dialog" aria-modal="true" aria-label="Hata Bildir"
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: 'auto', width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto',
                background: C.surface, color: C.text,
                borderTopLeftRadius: 22, borderTopRightRadius: 22,
                border: `1px solid ${C.border}`, borderBottom: 'none',
                boxShadow: '0 -20px 60px -15px rgba(0,0,0,0.4)',
                animation: 'hb-slideup .26s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              {/* Üst şerit */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${WA_GREEN}, ${WA_GREEN_DARK})` }} />

              <div style={{ padding: '18px 20px 22px' }}>
                {/* Başlık */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: `${WA_GREEN}1f`, border: `1px solid ${WA_GREEN}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WhatsAppGlyph size={22} color={WA_GREEN_DARK} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>Hata Bildir</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textDim }}>Destek hattına iletilir · {phonePretty}</p>
                  </div>
                  <button onClick={() => !sending && closeModal()} aria-label="Kapat"
                    style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, color: C.textDim, cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>

                {/* Ekran görüntüsü eki */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>📎 Ekran Görüntüsü</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleRecapture} style={miniBtn(C)}>Yeniden Çek</button>
                      <button onClick={() => fileInputRef.current?.click()} style={miniBtn(C)}>Dosya Ekle</button>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePick} style={{ display: 'none' }} />
                  {screenshot ? (
                    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, background: '#0b0b0b' }}>
                      <img src={screenshot} alt="Ekran görüntüsü" style={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'contain', background: '#f3f4f6' }} />
                      <button onClick={() => setScreenshot(null)} title="Kaldır"
                        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
                    </div>
                  ) : (
                    <div style={{ borderRadius: 12, border: `1px dashed ${C.borderStrong}`, padding: '18px 14px', textAlign: 'center', color: C.textDim, fontSize: 13 }}>
                      Ekran görüntüsü yok. <b>Yeniden Çek</b> veya <b>Dosya Ekle</b> ile ekleyin.
                    </div>
                  )}
                </div>

                {/* Açıklama */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>
                    📝 Hata Açıklaması <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ne yapıyordunuz? Hata tam olarak nerede / ne zaman oluştu? (örn. 'Gutachten kaydederken Speichern butonu çalışmadı')"
                    rows={4}
                    autoFocus
                    style={{
                      width: '100%', resize: 'vertical', minHeight: 90, borderRadius: 12,
                      border: `1px solid ${C.border}`, background: C.surface, color: C.text,
                      padding: '11px 13px', fontSize: 14, lineHeight: 1.45, outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = WA_GREEN; }}
                    onBlur={(e) => { e.target.style.borderColor = C.border; }}
                  />
                </div>

                {/* Önem derecesi */}
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>⚠️ Önem Derecesi</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {SEVERITIES.map((s) => {
                      const active = severity === s.key;
                      return (
                        <button key={s.key} onClick={() => setSeverity(s.key)}
                          style={{
                            flex: 1, padding: '9px 6px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                            border: `1.5px solid ${active ? s.color : C.border}`,
                            background: active ? `${s.color}1a` : C.surface,
                            color: active ? s.color : C.textDim,
                            transition: 'all .12s ease',
                          }}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Otomatik meta */}
                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}`, fontSize: 11.5, color: C.textDim, lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: 6 }}><b style={{ minWidth: 54, color: C.textDim }}>Sayfa</b><span style={{ wordBreak: 'break-all' }}>{meta.page_path || '—'}</span></div>
                  <div style={{ display: 'flex', gap: 6 }}><b style={{ minWidth: 54 }}>Ekran</b><span>{meta.screen_size || '—'}</span></div>
                  <div style={{ display: 'flex', gap: 6 }}><b style={{ minWidth: 54 }}>Bildiren</b><span>{user?.name || user?.email || 'Admin'}</span></div>
                </div>

                {/* Aksiyonlar */}
                <button onClick={handleSend} disabled={sending}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 13, border: 'none', cursor: sending ? 'wait' : 'pointer',
                    background: `linear-gradient(145deg, ${WA_GREEN}, ${WA_GREEN_DARK})`, color: '#fff', fontSize: 15, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 8px 22px rgba(18,140,126,0.4)', opacity: sending ? 0.7 : 1,
                  }}>
                  {sending ? <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'hb-spin 0.7s linear infinite' }} />
                    : <WhatsAppGlyph size={20} />}
                  {sending ? 'Gönderiliyor…' : 'WhatsApp ile Gönder'}
                </button>
                <button onClick={handleSaveOnly} disabled={sending}
                  style={{
                    width: '100%', marginTop: 9, padding: '11px', borderRadius: 13, cursor: sending ? 'wait' : 'pointer',
                    background: C.surface, color: C.text, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600,
                  }}>
                  Sadece Kaydet
                </button>
                <p style={{ margin: '10px 2px 0', fontSize: 11, color: C.textDim, textAlign: 'center', lineHeight: 1.5 }}>
                  Destekleyen cihazlarda görüntü <b>doğrudan mesaja eklenir</b>; aksi halde
                  cihaza indirilir, sohbette <b>📎 ile iliştirin</b>.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 92, transform: 'translateX(-50%)', zIndex: Z_MODAL + 2,
          maxWidth: 'calc(100vw - 32px)', padding: '11px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
          color: '#fff', background: toast.type === 'ok' ? WA_GREEN_DARK : (toast.type === 'warn' ? '#B45309' : '#111827'),
          boxShadow: '0 8px 26px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>{toast.type === 'ok' ? '✓' : '⚠'}</span>{toast.text}
        </div>
      )}

      {/* Animasyonlar */}
      <style>{`
        @keyframes hb-spin { to { transform: rotate(360deg); } }
        @keyframes hb-slideup { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

const miniBtn = (C) => ({
  padding: '5px 10px', borderRadius: 8, border: `1px solid ${C.border}`,
  background: C.surface, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
});
