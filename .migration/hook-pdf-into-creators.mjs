import fs from 'node:fs';
const path = 'src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

// 1) DAVA OLUSTURMA: setDb(withLog( ... lawyer_cases ... )) bloguna PDF eklensin
const oldCase = `            const cs = { id: 'case' + uid(), lawyer_id: user.lawyer_id, ...caseForm, created_at: new Date().toISOString() };
            const cust = (db.customers || []).find(c => c.id === caseForm.customer_id);
            const lbl = cust ? (cust.full_name || cust.company || cust.email) : caseForm.customer_id;
            setDb(withLog(
              prev => ({ ...prev, lawyer_cases: [...(prev.lawyer_cases || []), cs] }),`;

const newCase = `            const cs = { id: 'case' + uid(), lawyer_id: user.lawyer_id, ...caseForm, created_at: new Date().toISOString() };
            const cust = (db.customers || []).find(c => c.id === caseForm.customer_id);
            const lbl = cust ? (cust.full_name || cust.company || cust.email) : caseForm.customer_id;
            // PDF olusturup musteri kartina yaz (genel kural: her evrak girisi PDF olur)
            const casePdf = buildCustomerPdfDoc({
              customer_id: caseForm.customer_id,
              customerLabel: lbl,
              title: 'Dava Dosyasi: ' + caseForm.title,
              body: \`Dava Basligi: \${caseForm.title}\\nDurum: \${caseForm.status}\\n\\nAciklama:\\n\${caseForm.description || '(aciklama yok)'}\\n\\nDava Olusturma Tarihi: \${new Date().toLocaleDateString('tr-TR')}\`,
              type: 'hukuki',
              signatureLine: 'Olusturan: ' + (lawyer?.name || user.name || '-') + ' (Avukat)',
              uploadedBy: user.lawyer_id,
            });
            setDb(withLog(
              prev => ({ ...prev, lawyer_cases: [...(prev.lawyer_cases || []), cs], customer_documents: [...(prev.customer_documents || []), casePdf] }),`;

if (s.includes(oldCase)) {
  s = s.replace(oldCase, newCase);
  console.log('Dava olusturma -> PDF baglandi');
} else {
  console.log('UYARI: Dava blogu bulunamadi');
}

// 2) MAHKEME TAKVIMI EKLEME
const oldCourt = `          const addCourtDate = () => {
            if (!newDate.date || !newDate.court) return;
            const cd = { id: 'cd' + uid(), lawyer_id: user.lawyer_id, ...newDate, created_at: new Date().toISOString() };
            setDb(prev => ({ ...prev, court_dates: [...(prev.court_dates || []), cd] }));
            setNewDate({ date: '', time: '', court: '', description: '', customer_id: '' });
          };`;

const newCourt = `          const addCourtDate = () => {
            if (!newDate.date || !newDate.court) return;
            const cd = { id: 'cd' + uid(), lawyer_id: user.lawyer_id, ...newDate, created_at: new Date().toISOString() };
            // Eger musteri secildiyse, PDF kaydi da olustur (genel kural)
            const cust = newDate.customer_id ? (db.customers || []).find(c => c.id === newDate.customer_id) : null;
            const lbl = cust ? (cust.full_name || cust.company || cust.email) : '';
            if (newDate.customer_id && cust) {
              const courtPdf = buildCustomerPdfDoc({
                customer_id: newDate.customer_id,
                customerLabel: lbl,
                title: 'Mahkeme Takvimi Kaydi',
                body: \`Mahkeme: \${newDate.court}\\nTarih: \${newDate.date}\${newDate.time ? ' ' + newDate.time : ''}\\n\\nAciklama:\\n\${newDate.description || '(aciklama yok)'}\`,
                type: 'hukuki',
                signatureLine: 'Olusturan: ' + (lawyer?.name || user.name || '-') + ' (Avukat)',
                uploadedBy: user.lawyer_id,
              });
              setDb(prev => ({ ...prev, court_dates: [...(prev.court_dates || []), cd], customer_documents: [...(prev.customer_documents || []), courtPdf] }));
            } else {
              setDb(prev => ({ ...prev, court_dates: [...(prev.court_dates || []), cd] }));
            }
            setNewDate({ date: '', time: '', court: '', description: '', customer_id: '' });
          };`;

if (s.includes(oldCourt)) {
  s = s.replace(oldCourt, newCourt);
  console.log('Mahkeme takvimi -> PDF baglandi');
} else {
  console.log('UYARI: Mahkeme takvimi blogu bulunamadi');
}

fs.writeFileSync(path, s);
console.log('Tamam.');
