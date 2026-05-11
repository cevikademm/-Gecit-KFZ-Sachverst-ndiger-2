// Mail içeriğini PDF'e döker. Arka planda Gecit logo'sunu hologram watermark olarak yerleştirir.
// CommunicationsPanel mail attıktan sonra çağırır → blob → File → uploadCustomerDocument → customer_documents.

import { jsPDF } from 'jspdf';

const LOGO_URL = '/logo-master.png';
const BRAND = {
  red: '#E30613',
  redDark: '#B0050F',
  ink: '#0B0B0F',
  inkDim: '#4B4B55',
  inkSoft: '#8B8B93',
  rule: '#E5E5EA',
  bg: '#FAFAFA',
};

// Logo'yu bir kez fetch edip cache'le (her mail için yeniden yüklememek için).
let _logoDataCache = null;
async function getLogoDataUrl() {
  if (_logoDataCache !== undefined) return _logoDataCache;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) { _logoDataCache = null; return null; }
    const blob = await res.blob();
    const reader = new FileReader();
    _logoDataCache = await new Promise((resolve, reject) => {
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

// Tek bir watermark logo'yu sayfanın ortasına %12 opacity ile basar.
// jsPDF'in GState opacity API'sini kullanır.
function applyHologramWatermark(doc, logoDataUrl) {
  if (!logoDataUrl) return;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // GState ile opacity ayarla (jsPDF 2.x)
  try {
    const gs = new doc.GState({ opacity: 0.07 });
    doc.setGState(gs);
  } catch (e) {
    // GState yoksa fade gradient simülasyonu olmaz, sessizce devam et
  }

  // Ortalanmış, büyük logo — sayfa yüksekliğinin %50'si kadar
  const logoH = pageH * 0.5;
  const logoW = logoH; // kare varsayım; logo aslında dikey-yatay ratio'sunu kendi koruyacak
  const x = (pageW - logoW) / 2;
  const y = (pageH - logoH) / 2;
  try {
    doc.addImage(logoDataUrl, 'PNG', x, y, logoW, logoH, undefined, 'FAST');
  } catch (e) {
    // PNG decode hatası — sessizce atla
  }

  // Opacity'yi normale döndür
  try {
    const gsBack = new doc.GState({ opacity: 1 });
    doc.setGState(gsBack);
  } catch (e) {}
}

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

function setFill(doc, hex) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}
function setText(doc, hex) {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}
function setDraw(doc, hex) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60) || 'mail';
}

/**
 * Mail içeriğinden PDF blob üretir.
 *
 * @param {object} mail
 * @param {string} mail.subject
 * @param {string} mail.body           — plain text (multi-line)
 * @param {string} mail.recipientName  — alıcı adı
 * @param {string} mail.recipientEmail — alıcı email
 * @param {string[]} [mail.cc]
 * @param {string[]} [mail.bcc]
 * @param {string} [mail.ctaLabel]
 * @param {string} [mail.ctaUrl]
 * @param {string} [mail.senderName]   — varsayılan: "Gecit KFZ Sachverständigenbüro"
 * @param {string} [mail.senderEmail]  — varsayılan: "info@kfzgutachter.ac"
 * @param {Date}   [mail.sentAt]       — varsayılan: now
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

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;

  const logoData = await getLogoDataUrl();

  // ─── Watermark (her sayfada arka plan) ──
  applyHologramWatermark(doc, logoData);

  // ─── Üst şerit (brand renk) ──
  setFill(doc, BRAND.red);
  doc.rect(0, 0, pageW, 6, 'F');

  // ─── Header: logo + gönderen ──
  let y = margin;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, y - 6, 38, 38, undefined, 'FAST');
    } catch (e) {}
  }
  setText(doc, BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(senderName, margin + 48, y + 8);
  setText(doc, BRAND.inkDim);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Lützowstraße 102-104 · 10785 Berlin · ' + senderEmail, margin + 48, y + 22);

  // Tarih (sağ üst)
  setText(doc, BRAND.inkDim);
  doc.setFontSize(9);
  const dateStr = sentAt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = sentAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  doc.text(`${dateStr}  ·  ${timeStr}`, pageW - margin, y + 8, { align: 'right' });
  setText(doc, BRAND.inkSoft);
  doc.text('E-Mail-Korrespondenz', pageW - margin, y + 22, { align: 'right' });

  y += 50;
  // Ayraç
  setDraw(doc, BRAND.rule);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 22;

  // ─── Alıcı bloğu ──
  setText(doc, BRAND.inkSoft);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EMPFÄNGER', margin, y);
  y += 14;
  setText(doc, BRAND.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  if (recipientName) {
    doc.text(recipientName, margin, y);
    y += 14;
  }
  setText(doc, BRAND.inkDim);
  doc.setFontSize(10);
  doc.text(recipientEmail || '—', margin, y);
  y += 12;

  if (cc && cc.length) {
    setText(doc, BRAND.inkSoft);
    doc.setFontSize(8);
    doc.text('CC: ' + cc.join(', '), margin, y);
    y += 11;
  }
  if (bcc && bcc.length) {
    setText(doc, BRAND.inkSoft);
    doc.setFontSize(8);
    doc.text('BCC: ' + bcc.join(', '), margin, y);
    y += 11;
  }

  y += 14;

  // ─── Konu ──
  setText(doc, BRAND.inkSoft);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BETREFF', margin, y);
  y += 14;
  setText(doc, BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const subjectLines = doc.splitTextToSize(subject || '(kein Betreff)', contentW);
  doc.text(subjectLines, margin, y);
  y += subjectLines.length * 17 + 10;

  // Ayraç
  setDraw(doc, BRAND.rule);
  doc.line(margin, y, pageW - margin, y);
  y += 22;

  // ─── Body ──
  setText(doc, BRAND.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const lineHeight = 16;
  const bodyLines = doc.splitTextToSize(body || '', contentW);

  const ensureSpace = (need) => {
    if (y + need > pageH - margin - 40) {
      doc.addPage();
      applyHologramWatermark(doc, logoData);
      // Yeni sayfada üst şerit
      setFill(doc, BRAND.red);
      doc.rect(0, 0, pageW, 6, 'F');
      y = margin;
    }
  };

  for (const line of bodyLines) {
    ensureSpace(lineHeight);
    doc.text(line, margin, y);
    y += lineHeight;
  }

  // ─── CTA kutusu ──
  if (ctaLabel && ctaUrl) {
    y += 14;
    ensureSpace(54);
    setFill(doc, BRAND.red);
    doc.roundedRect(margin, y, 240, 40, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setText(doc, '#FFFFFF');
    doc.text(ctaLabel, margin + 120, y + 25, { align: 'center' });
    y += 50;

    setText(doc, BRAND.inkSoft);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Link: ' + ctaUrl, margin, y);
    y += 12;
  }

  // ─── Footer (her sayfada) ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    setDraw(doc, BRAND.rule);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - margin - 22, pageW - margin, pageH - margin - 22);

    setText(doc, BRAND.inkSoft);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Gecit KFZ Sachverständigenbüro · Lützowstraße 102-104, 10785 Berlin · info@kfzgutachter.ac · www.kfzgutachter.ac',
      margin, pageH - margin - 8);
    doc.text(`Seite ${p} / ${pageCount}`, pageW - margin, pageH - margin - 8, { align: 'right' });
  }

  // Blob üret
  const blob = doc.output('blob');
  const fileName = `Mail_${dateStr.replace(/\s/g, '')}_${slugify(subject)}.pdf`;
  return { blob, fileName };
}
