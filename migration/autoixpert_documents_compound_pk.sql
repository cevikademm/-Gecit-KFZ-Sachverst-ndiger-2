-- autoixpert_documents — PK'yi (report_id, id) compound'a çevir.
-- Sebep: AutoiXpert aynı document.id'yi birden fazla raporda kullanıyor (şablonlar)
-- ama her rapor için farklı kişiselleştirilmiş PDF döndürüyor. Tek-id PK ile
-- 315 doğru bağ kaybolmuştu (yanlış kişinin PDF'i gösteriliyordu).

ALTER TABLE autoixpert_documents DROP CONSTRAINT IF EXISTS autoixpert_documents_pkey;
ALTER TABLE autoixpert_documents ADD PRIMARY KEY (report_id, id);

-- Cache reload bilgisi
NOTIFY pgrst, 'reload schema';
