// Mail içeriğini profesyonel bir A4 mektup formatında PDF'e döker.
// Yöntem: HTML şablon → html2canvas → jsPDF. Bu yaklaşımın avantajları:
//   - Türkçe karakterler (Sayın, hazır, ı/ş/ğ/ç/ö/ü) doğal browser font'larıyla render edilir
//   - CSS ile profesyonel mektup tasarımı (kırmızı şerit, header, watermark logo)
//   - Çoklu sayfa otomatik bölünür
//
// Logo: public/logo-gecit.png (büyüteç + G-Class + GECIT-KFZ Sachverständigenbüro)

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const LOGO_URL = '/logo-gecit.png';

let _logoDataCache = null;
async function getLogoDataUrl() {
  if (_logoDataCache !== undefined && _logoDataCache !== null) return _logoDataCache;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) { _logoDataCache = null; return null; }
    const blob = await res.blob();
    _logoDataCache = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return _logoDataCache;
  } catch (e) {
    console.warn('[mailPdfExport] logo fetch failed:', e?.message);
    _logoDataCache = null;
    return null;
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60) || 'mail';
}

// HTML mektup şablonu — A4 portrait (794×1123 px @ 96 DPI)
function buildMailHtml({ subject, body, recipientName, recipientEmail, cc, bcc, ctaLabel, ctaUrl, senderName, senderEmail, sentAt, logoDataUrl }) {
  const dateStr = sentAt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = sentAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const ccBlock = (cc && cc.length)
    ? `<div style="font-size:11px;color:#6B6B73;margin-top:4px;"><span style="color:#9494A0;font-weight:600;">CC:</span> ${escapeHtml(cc.join(', '))}</div>`
    : '';
  const bccBlock = (bcc && bcc.length)
    ? `<div style="font-size:11px;color:#6B6B73;margin-top:2px;"><span style="color:#9494A0;font-weight:600;">BCC:</span> ${escapeHtml(bcc.join(', '))}</div>`
    : '';

  const ctaBlock = (ctaLabel && ctaUrl) ? `
    <div style="margin: 28px 0 8px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#E30613,#B0050F);
                  color:#FFFFFF;padding:14px 28px;border-radius:8px;
                  font-size:13px;font-weight:600;letter-spacing:0.01em;
                  box-shadow:0 4px 12px rgba(227,6,19,0.25);">
        ${escapeHtml(ctaLabel)}
      </div>
      <div style="font-size:10px;color:#9494A0;margin-top:8px;font-family:'Courier New',monospace;">
        ${escapeHtml(ctaUrl)}
      </div>
    </div>` : '';

  const watermark = logoDataUrl ? `
    <img src="${logoDataUrl}" alt=""
      style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
             width:520px;opacity:0.05;pointer-events:none;user-select:none;z-index:0;" />` : '';

  const headerLogo = logoDataUrl ? `
    <img src="${logoDataUrl}" alt="Gecit KFZ"
      style="height:56px;width:auto;flex-shrink:0;" />` : '';

  // Body'yi paragraflara böl ve HTML olarak yaz
  const bodyHtml = escapeHtml(body || '')
    .split(/\n\s*\n/)
    .map(p => `<p style="margin:0 0 14px 0;line-height:1.65;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
<div id="gecit-mail-pdf" style="
  width: 794px;
  min-height: 1123px;
  background: #FFFFFF;
  font-family: 'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif;
  color: #0B0B0F;
  position: relative;
  box-sizing: border-box;
  padding: 70px 70px 110px 70px;
  overflow: hidden;
">
  <!-- Üst kırmızı şerit -->
  <div style="position:absolute;top:0;left:0;right:0;height:6px;
              background:linear-gradient(90deg,#E30613 0%,#B0050F 50%,#7A0309 100%);"></div>

  <!-- Watermark logo (arka plan) -->
  ${watermark}

  <!-- Tüm içerik watermark'ın üstünde olsun diye z-index'li wrapper -->
  <div style="position:relative;z-index:1;">

    <!-- HEADER: logo + sender + tarih -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;
                gap:24px;padding-bottom:24px;margin-bottom:32px;
                border-bottom:1px solid #E5E5EA;">
      <div style="display:flex;align-items:center;gap:18px;min-width:0;">
        ${headerLogo}
        <div>
          <div style="font-size:17px;font-weight:700;color:#0B0B0F;letter-spacing:-0.01em;line-height:1.2;">
            ${escapeHtml(senderName)}
          </div>
          <div style="font-size:11px;color:#6B6B73;margin-top:6px;line-height:1.5;">
            Lützowstraße 102-104 · 10785 Berlin
          </div>
          <div style="font-size:11px;color:#6B6B73;line-height:1.5;">
            ${escapeHtml(senderEmail)} · www.kfzgutachter.ac
          </div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:9px;color:#9494A0;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">
          Datum
        </div>
        <div style="font-size:14px;font-weight:700;color:#0B0B0F;margin-top:4px;">
          ${escapeHtml(dateStr)}
        </div>
        <div style="font-size:10px;color:#9494A0;margin-top:2px;font-family:'Courier New',monospace;">
          ${escapeHtml(timeStr)} Uhr
        </div>
        <div style="font-size:9px;color:#E30613;margin-top:8px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">
          E-Mail-Korrespondenz
        </div>
      </div>
    </div>

    <!-- ALICI -->
    <div style="margin-bottom:24px;">
      <div style="font-size:9px;color:#9494A0;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;margin-bottom:8px;">
        An / Empfänger
      </div>
      <div style="font-size:14px;font-weight:600;color:#0B0B0F;">
        ${escapeHtml(recipientName || '—')}
      </div>
      <div style="font-size:12px;color:#4B4B55;margin-top:2px;font-family:'Courier New',monospace;">
        ${escapeHtml(recipientEmail || '—')}
      </div>
      ${ccBlock}
      ${bccBlock}
    </div>

    <!-- KONU -->
    <div style="margin-bottom:18px;padding:18px 20px;
                background:linear-gradient(135deg,rgba(227,6,19,0.04),rgba(227,6,19,0.01));
                border-left:3px solid #E30613;border-radius:0 8px 8px 0;">
      <div style="font-size:9px;color:#9494A0;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;margin-bottom:6px;">
        Betreff
      </div>
      <div style="font-size:17px;font-weight:700;color:#0B0B0F;line-height:1.35;letter-spacing:-0.01em;">
        ${escapeHtml(subject || '(kein Betreff)')}
      </div>
    </div>

    <!-- BODY -->
    <div style="font-size:12.5px;color:#0B0B0F;margin-top:26px;">
      ${bodyHtml}
    </div>

    ${ctaBlock}
  </div>

  <!-- FOOTER (mutlak konum, her sayfanın altında) -->
  <div style="position:absolute;left:70px;right:70px;bottom:40px;
              padding-top:14px;border-top:1px solid #E5E5EA;
              display:flex;justify-content:space-between;align-items:center;
              font-size:9px;color:#9494A0;line-height:1.5;">
    <div>
      <div style="font-weight:600;color:#6B6B73;">Gecit KFZ Sachverständigenbüro</div>
      <div>Lützowstraße 102-104 · 10785 Berlin · info@kfzgutachter.ac</div>
    </div>
    <div style="text-align:right;">
      <div style="font-weight:600;color:#E30613;letter-spacing:0.05em;">kfzgutachter.ac</div>
      <div style="font-size:8px;color:#9494A0;">Vertraulich · Nur für den genannten Empfänger</div>
    </div>
  </div>
</div>
  `;
}

/**
 * Mail içeriğinden PDF blob üretir.
 *
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function generateMailPdf(mail) {
  const {
    subject = '',
    body = '',
    recipientName = '',
    recipientEmail = '',
    cc = [],
    bcc = [],
    ctaLabel,
    ctaUrl,
    senderName = 'Gecit KFZ Sachverständigenbüro',
    senderEmail = 'info@kfzgutachter.ac',
    sentAt = new Date(),
  } = mail || {};

  const logoDataUrl = await getLogoDataUrl();

  // 1) Off-screen container oluştur
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  container.style.background = '#FFFFFF';
  container.innerHTML = buildMailHtml({
    subject, body, recipientName, recipientEmail, cc, bcc,
    ctaLabel, ctaUrl, senderName, senderEmail, sentAt, logoDataUrl,
  });
  document.body.appendChild(container);

  try {
    const el = container.querySelector('#gecit-mail-pdf');

    // 2) Görselleri yüklemesini bekle (html2canvas inline image'ları okuyacak)
    const imgs = Array.from(el.querySelectorAll('img'));
    await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
      img.onload = res; img.onerror = res;
    })));

    // 3) html2canvas ile render et — yüksek çözünürlük için scale=2
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      windowWidth: 794,
    });

    // 4) jsPDF A4 — canvas'ı sayfa sayfa kes ve ekle
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const a4w = pdf.internal.pageSize.getWidth();   // 595.28pt
    const a4h = pdf.internal.pageSize.getHeight();  // 841.89pt

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    // Canvas'ı A4 genişliğine ölçekle
    const ratio = a4w / canvasW;
    const fullHeightPt = canvasH * ratio;

    if (fullHeightPt <= a4h) {
      // Tek sayfa
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, a4w, fullHeightPt, undefined, 'FAST');
    } else {
      // Çoklu sayfa — canvas'ı A4 yüksekliği bazında kes
      const pageCanvasH = Math.floor(a4h / ratio); // px cinsinden bir A4'ün karşılığı
      const pageCount = Math.ceil(canvasH / pageCanvasH);

      for (let i = 0; i < pageCount; i++) {
        if (i > 0) pdf.addPage();
        const slice = document.createElement('canvas');
        slice.width = canvasW;
        slice.height = Math.min(pageCanvasH, canvasH - i * pageCanvasH);
        const ctx = slice.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, -i * pageCanvasH);
        const sliceData = slice.toDataURL('image/jpeg', 0.92);
        const sliceHeightPt = slice.height * ratio;
        pdf.addImage(sliceData, 'JPEG', 0, 0, a4w, sliceHeightPt, undefined, 'FAST');
      }
    }

    const blob = pdf.output('blob');
    const fileName = `Mail_${sentAt.toISOString().slice(0,10)}_${slugify(subject)}.pdf`;
    return { blob, fileName };
  } finally {
    container.remove();
  }
}
