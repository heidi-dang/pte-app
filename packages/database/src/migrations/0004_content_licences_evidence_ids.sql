-- Corrective migration for content_licences.evidence_ids.
-- 0003_provenance_ext.sql was changed after some databases had already applied 0003.
-- This idempotently guarantees the column exists without depending on edited historical DDL.
-- Safe on fresh databases, databases with old 0003, and databases with 0005-0011.
ALTER TABLE content_licences
  ADD COLUMN IF NOT EXISTS evidence_ids UUID[] NOT NULL DEFAULT '{}';
