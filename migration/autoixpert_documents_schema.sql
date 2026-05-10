-- AutoiXpert Documents — schema + Storage bucket

CREATE TABLE IF NOT EXISTS autoixpert_documents (
  id text PRIMARY KEY,
  report_id text NOT NULL REFERENCES autoixpert_reports(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'autoixpert-documents',
  storage_path text,

  type text,
  title text,
  mimetype text DEFAULT 'application/pdf',
  size_bytes bigint,

  download_status text NOT NULL DEFAULT 'pending'
    CHECK (download_status IN ('pending', 'downloading', 'done', 'failed', 'skipped')),
  download_error text,
  download_attempts integer NOT NULL DEFAULT 0,
  downloaded_at timestamptz,

  external_updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb
);

CREATE INDEX IF NOT EXISTS idx_axdocs_report ON autoixpert_documents(report_id);
CREATE INDEX IF NOT EXISTS idx_axdocs_status ON autoixpert_documents(download_status);
CREATE INDEX IF NOT EXISTS idx_axdocs_type ON autoixpert_documents(type);

ALTER TABLE autoixpert_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS autoixpert_documents_admin_all ON autoixpert_documents;
CREATE POLICY autoixpert_documents_admin_all ON autoixpert_documents
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
