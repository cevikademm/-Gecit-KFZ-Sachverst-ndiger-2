// Hata Bildirimi modülü — yardımcı istemci (screenshot + storage + WhatsApp).
// UI: src/components/HataBildirWidget.jsx · Tablo: error_reports
// Persistans App.jsx'in durable sync yoluna (setDb) bırakılır; burada sadece
// ekran görüntüsü yakalama, Storage'a yükleme ve WhatsApp metni kurma var.

import html2canvas from 'html2canvas';
import { getSupabaseClient } from './supabaseAuth.js';

// Admin/destek WhatsApp numarası (uluslararası, + ve boşluksuz).
// Öncelik: localStorage override > env > varsayılan.
const DEFAULT_ADMIN_PHONE = '905324961412';
const SCREENSHOT_BUCKET = 'error-screenshots';

export function getAdminPhone() {
  let ls = null;
  try { ls = localStorage.getItem('gecit_kfz_hata_admin_phone'); } catch (e) {}
  const env = (import.meta.env?.VITE_HATA_ADMIN_PHONE || '').trim();
  const raw = (ls && ls.trim()) || env || DEFAULT_ADMIN_PHONE;
  // Sadece rakam — wa.me ülke kodu + numara ister, + ve boşluk istemez.
  return String(raw).replace(/[^\d]/g, '');
}

// Kısa benzersiz id (App.jsx'teki uid ile aynı stil).
export function makeReportId() {
  const rnd = Math.random().toString(36).slice(2, 8);
  // Date.now yerine performance.now da olur; burada gerçek zaman gerekiyor.
  return `err_${Date.now().toString(36)}_${rnd}`;
}

/**
 * Görünür sayfanın ekran görüntüsünü alır (html2canvas).
 * Widget'ın kendi DOM'u (FAB + modal) data-hata-bildir-skip="1" ile atlanır.
 * @returns {Promise<string|null>} JPEG data URL veya hata olursa null.
 */
export async function captureScreenshot() {
  if (typeof document === 'undefined') return null;
  try {
    // Yüksek çözünürlük (keskin metin): ekranın DPR'ı 1 olsa bile EN AZ 2x
    // supersampling yap. Eski kod min(DPR, 1.5) ile DPR=1 masaüstünde 1x
    // yakalayıp bulanık çıkarıyordu. Çok büyük ekranlarda bellek/canvas limiti
    // için üst sınır 2.5x (1920px viewport → 4800px canvas, güvenli).
    const scale = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);
    // Tüm sayfayı değil, kullanıcının O AN gördüğü alanı (viewport) yakala —
    // "hatanın tam olarak nerede olduğu" görünsün.
    const canvas = await html2canvas(document.body, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      imageTimeout: 0, // görsellerin yüklenmesini bekleme süresini sınırlama (net render)
      // Modülün kendi arayüzünü (FAB + modal + toast) görüntüye dahil etme.
      ignoreElements: (el) => el?.dataset?.hataBildirSkip === '1',
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
    });
    // JPEG kalite 0.95 — yüksek scale ile birlikte metin net, dosya boyutu makul.
    // (PNG daha keskin ama 2.5x viewport'ta çok büyür; q0.95 JPEG en iyi denge.)
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (e) {
    console.warn('[HataBildir] Ekran görüntüsü alınamadı:', e?.message || e);
    return null;
  }
}

// data: URL → Blob (Storage upload için).
export function dataUrlToBlob(dataUrl) {
  try {
    const [head, body] = String(dataUrl).split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
    const bin = atob(body);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch (e) {
    return null;
  }
}

// data: URL → File (Web Share API dosya paylaşımı File nesnesi ister).
export function dataUrlToFile(dataUrl, filename) {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return null;
  try {
    return new File([blob], filename || 'hata-ekran-goruntusu.jpg', {
      type: blob.type || 'image/jpeg',
    });
  } catch (e) {
    return null;
  }
}

/**
 * Ekran görüntüsünü Storage'a yükler.
 * @returns {Promise<{path:string,url:string}|null>} live + başarılıysa, aksi halde null.
 */
export async function uploadScreenshot(dataUrl, reportId) {
  const sb = getSupabaseClient();
  if (!sb || !dataUrl) return null;
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return null;
  const path = `${reportId}.jpg`;
  try {
    const { error } = await sb.storage.from(SCREENSHOT_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
    });
    if (error) {
      console.warn('[HataBildir] Storage upload başarısız:', error.message);
      return null;
    }
    const { data } = sb.storage.from(SCREENSHOT_BUCKET).getPublicUrl(path);
    const url = data?.publicUrl || null;
    if (!url) return null;
    return { path, url };
  } catch (e) {
    console.warn('[HataBildir] Storage upload exception:', e?.message || e);
    return null;
  }
}

const SEVERITY_LABEL = { low: 'Düşük', normal: 'Normal', high: 'Yüksek / Acil' };

/**
 * WhatsApp mesaj metnini kurar.
 * @param {object} rec - bildirim kaydı
 * @param {{attached?: boolean}} [opts] - attached=true ise görüntü mesaja DOSYA
 *   olarak (Web Share API) eklenmiştir; metindeki satır buna göre yazılır.
 */
export function buildWhatsAppText(rec, { attached = false } = {}) {
  const dt = (() => {
    try { return new Date(rec.created_at).toLocaleString('tr-TR'); } catch (e) { return rec.created_at; }
  })();
  // Görüntü satırı: önce gerçek bir Storage linki, sonra dosya-eki, en son
  // manuel iliştirme uyarısı (wa.me deep-link dosya taşıyamaz).
  const screenshotLine = rec.screenshot_url
    ? `🖼️ Ekran görüntüsü: ${rec.screenshot_url}`
    : attached
      ? '🖼️ Ekran görüntüsü bu mesaja dosya olarak eklendi.'
      : '🖼️ Ekran görüntüsü mesaja iliştirildi (lütfen ekleyin).';
  const lines = [
    '🐞 *HATA BİLDİRİMİ — Gecit KFZ*',
    `👤 Bildiren: ${rec.reporter_name || '—'}${rec.reporter_role ? ` (${rec.reporter_role})` : ''}`,
    `🗓️ ${dt}`,
    `📍 Sayfa: ${rec.page_path || '—'}`,
    rec.page_url ? `🔗 ${rec.page_url}` : null,
    `🖥️ ${rec.screen_size || '—'}`,
    `⚠️ Önem: ${SEVERITY_LABEL[rec.severity] || rec.severity || 'Normal'}`,
    '',
    '📝 *Açıklama:*',
    rec.description || '—',
    '',
    screenshotLine,
    `🆔 ${rec.id}`,
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Ekran görüntüsünü Web Share API ile DOSYA olarak paylaşır (WhatsApp/diğer).
 * wa.me deep-link dosya iliştiremediği için, görüntüyü gerçekten mesaja
 * eklemenin tek web yolu budur. Mobilde ve modern masaüstü Chromium'da çalışır.
 * @returns {Promise<'shared'|'aborted'|false>} 'shared' = paylaşıldı,
 *   'aborted' = kullanıcı paylaşım sayfasını kapattı (yine de wa.me'ye düşme),
 *   false = cihaz/tarayıcı dosya paylaşımını desteklemiyor → wa.me'ye düş.
 */
export async function shareScreenshotFile({ file, text, title }) {
  if (typeof navigator === 'undefined' || !navigator.share || !file) return false;
  try {
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
  } catch (e) {
    return false;
  }
  try {
    await navigator.share({ files: [file], text: text || '', title: title || 'Hata Bildirimi' });
    return 'shared';
  } catch (e) {
    // Kullanıcı paylaşım sayfasını iptal etti → akış çalıştı; çift mesaj
    // (ayrıca wa.me) açmamak için 'aborted' döndür.
    if (e && e.name === 'AbortError') return 'aborted';
    console.warn('[HataBildir] Web Share başarısız:', e?.message || e);
    return false;
  }
}

// WhatsApp'ı (varsa uygulama, yoksa web) önceden doldurulmuş metinle açar.
export function openWhatsApp(text, phone = getAdminPhone()) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { window.location.href = url; }
  return url;
}

// Ekran görüntüsünü cihaza indirir — kullanıcı WhatsApp sohbetinde
// dosya olarak iliştirebilsin (deep-link otomatik ekleyemez).
export function downloadDataUrl(dataUrl, filename) {
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'hata-ekran-goruntusu.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    console.warn('[HataBildir] İndirme başarısız:', e?.message || e);
  }
}
