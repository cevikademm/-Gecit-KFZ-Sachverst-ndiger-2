import fs from 'node:fs';
const path = 'src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const anchor = `const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Activity Logging ───────────────────────────`;

if (s.includes('function buildCustomerPdfDoc')) {
  console.log('Helper zaten var, atliyorum.');
  process.exit(0);
}

const helper = `const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Genel Kural: Musteriye yapilan her evrak girisi PDF olur ────────────
// Avukat/admin tarafindan musteri icin olusturulan TUM kayitlar (dava dosyasi,
// itiraz yazisi, mahkeme takvimi, vb.) bu helper araciligi ile PDF'e
// donusturulur ve ilgili musterinin kartina (customer_documents) yazilir.
// Yeni bir "musteri evraki" yaratan ozellik eklerken bu fonksiyonu kullan.
function buildCustomerPdfDoc({ customer_id, customerLabel = '', title, body,
                               type = 'hukuki', signatureLine = '', uploadedBy = '' }) {
  const today = new Date().toLocaleDateString('tr-TR');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 20;
  const marginY = 22;
  const contentWidth = pageWidth - marginX * 2;

  // Mor ust serit (marka renkleri)
  pdf.setFillColor(124, 58, 237);
  pdf.rect(0, 0, pageWidth, 12, 'F');

  // Baslik
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(20, 20, 20);
  pdf.text(title, marginX, marginY);

  // Meta satiri (musteri + tarih)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(110, 110, 110);
  if (customerLabel) pdf.text(\`Musteri: \${customerLabel}\`, marginX, marginY + 7);
  pdf.text(\`Tarih: \${today}\`, pageWidth - marginX, marginY + 7, { align: 'right' });

  // Cizgi
  pdf.setDrawColor(220, 220, 220);
  pdf.line(marginX, marginY + 11, pageWidth - marginX, marginY + 11);

  // Govde metni
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  const lines = pdf.splitTextToSize(body || '', contentWidth);
  let y = marginY + 22;
  const lineH = 6;
  lines.forEach(line => {
    if (y > pageHeight - marginY) { pdf.addPage(); y = marginY; }
    pdf.text(line, marginX, y);
    y += lineH;
  });

  // Footer (imza satiri)
  if (signatureLine) {
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(\`\${signatureLine}  |  Gecit Kfz Sachverstandiger\`, marginX, pageHeight - 10);
  }

  const dataUri = pdf.output('datauristring');
  const safeTitle = title.replace(/[\\\\/:*?"<>|]/g, '').slice(0, 80);
  const fileName = \`\${safeTitle} - \${today.replace(/\\./g, '-')}.pdf\`;

  return {
    id: 'cd' + uid(),
    customer_id,
    vehicle_id: '',
    name: fileName,
    type,
    size: Math.round(dataUri.length * 0.75),
    data: dataUri,
    uploaded_at: new Date().toISOString().slice(0, 10),
    mime: 'application/pdf',
    uploaded_by: uploadedBy,
  };
}

// ─── Activity Logging ───────────────────────────`;

const idx = s.indexOf(anchor);
console.log('Anchor bulundu:', idx >= 0);
if (idx >= 0) {
  s = s.replace(anchor, helper);
  fs.writeFileSync(path, s);
  console.log('Helper eklendi.');
}
