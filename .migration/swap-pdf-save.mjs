import fs from 'node:fs';
const path = 'src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const oldBlock = `                        <AdminButton onClick={() => {
                          const doc = { id: 'cd' + uid(), customer_id: fillCustomer, vehicle_id: '', name: \`\${selectedTpl.title} — \${new Date().toISOString().slice(0, 10)}.txt\`, type: 'hukuki', size: fillTemplate(selectedTpl).length, data: 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(fillTemplate(selectedTpl)))), uploaded_at: new Date().toISOString().slice(0, 10), mime: 'text/plain', uploaded_by: user.lawyer_id };
                          const cust = (db.customers || []).find(c => c.id === fillCustomer);
                          const lbl = cust ? (cust.full_name || cust.company || cust.email) : fillCustomer;
                          setDb(withLog(
                            prev => ({ ...prev, customer_documents: [...(prev.customer_documents || []), doc] }),
                            makeLogEntry({
                              user: lawyerActor, action: 'doc_upload',
                              target: { kind: 'customer', id: fillCustomer, label: lbl },
                              details: \`Avukat \${lawyerActor.name} hukuki belge oluşturdu: \${doc.name} → \${lbl}\`,
                              metadata: { doc_id: doc.id, template: selectedTpl.title },
                            })
                          ));
                          setFillModal(false);
                        }}>
                          Dosya Olarak Kaydet
                        </AdminButton>`;

const newBlock = `                        <AdminButton onClick={() => {
                          // Itiraz sablonunu PDF olarak musteri kartina kaydet
                          const cust = (db.customers || []).find(c => c.id === fillCustomer);
                          const lbl = cust ? (cust.full_name || cust.company || cust.email) : fillCustomer;
                          const filledText = fillTemplate(selectedTpl);
                          const today = new Date().toLocaleDateString('tr-TR');

                          const pdf = new jsPDF('p', 'mm', 'a4');
                          const pageWidth = pdf.internal.pageSize.getWidth();
                          const pageHeight = pdf.internal.pageSize.getHeight();
                          const marginX = 20;
                          const marginY = 22;
                          const contentWidth = pageWidth - marginX * 2;

                          // Mor ust serit
                          pdf.setFillColor(124, 58, 237);
                          pdf.rect(0, 0, pageWidth, 12, 'F');

                          // Baslik
                          pdf.setFont('helvetica', 'bold');
                          pdf.setFontSize(16);
                          pdf.setTextColor(20, 20, 20);
                          pdf.text(selectedTpl.title, marginX, marginY);

                          // Meta satiri
                          pdf.setFont('helvetica', 'normal');
                          pdf.setFontSize(9);
                          pdf.setTextColor(110, 110, 110);
                          pdf.text(\`Musteri: \${lbl}\`, marginX, marginY + 7);
                          pdf.text(\`Tarih: \${today}\`, pageWidth - marginX, marginY + 7, { align: 'right' });

                          // Cizgi
                          pdf.setDrawColor(220, 220, 220);
                          pdf.line(marginX, marginY + 11, pageWidth - marginX, marginY + 11);

                          // Govde metni
                          pdf.setFont('helvetica', 'normal');
                          pdf.setFontSize(11);
                          pdf.setTextColor(30, 30, 30);
                          const lines = pdf.splitTextToSize(filledText, contentWidth);
                          let y = marginY + 22;
                          const lineH = 6;
                          lines.forEach(line => {
                            if (y > pageHeight - marginY) { pdf.addPage(); y = marginY; }
                            pdf.text(line, marginX, y);
                            y += lineH;
                          });

                          // Footer
                          pdf.setFontSize(8);
                          pdf.setTextColor(150, 150, 150);
                          pdf.text(\`Olusturan: \${lawyer?.name || user.name || '—'} (Avukat)  |  Gecit Kfz Sachverstandiger\`,
                            marginX, pageHeight - 10);

                          const pdfDataUri = pdf.output('datauristring');
                          const pdfSize = Math.round(pdfDataUri.length * 0.75);
                          const safeName = selectedTpl.title.replace(/[\\\\/:*?"<>|]/g, '').slice(0, 80);
                          const fileName = \`\${safeName} - \${today.replace(/\\./g, '-')}.pdf\`;

                          const docFile = {
                            id: 'cd' + uid(),
                            customer_id: fillCustomer,
                            vehicle_id: '',
                            name: fileName,
                            type: 'hukuki',
                            size: pdfSize,
                            data: pdfDataUri,
                            uploaded_at: new Date().toISOString().slice(0, 10),
                            mime: 'application/pdf',
                            uploaded_by: user.lawyer_id,
                          };

                          setDb(withLog(
                            prev => ({ ...prev, customer_documents: [...(prev.customer_documents || []), docFile] }),
                            makeLogEntry({
                              user: lawyerActor, action: 'doc_upload',
                              target: { kind: 'customer', id: fillCustomer, label: lbl },
                              details: \`Avukat \${lawyerActor.name} itiraz sablonunu PDF olarak kaydetti: \${docFile.name} -> \${lbl}\`,
                              metadata: { doc_id: docFile.id, template: selectedTpl.title, format: 'pdf' },
                            })
                          ));
                          setFillModal(false);
                        }}>
                          PDF Olarak Kaydet
                        </AdminButton>`;

const idx = s.indexOf(oldBlock);
console.log('Bulundu:', idx >= 0 ? 'EVET pos=' + idx : 'HAYIR');
if (idx >= 0) {
  s = s.replace(oldBlock, newBlock);
  fs.writeFileSync(path, s);
  console.log('Yazildi.');
}
