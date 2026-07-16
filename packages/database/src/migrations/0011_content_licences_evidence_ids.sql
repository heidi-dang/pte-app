-- Hotfix: retroactive DDL for content_licences.evidence_ids.
-- 0003_provenance_ext.sql was updated with this column after production
-- had already applied 0003, so this migration ensures in-flight and future
-- databases all carry the column.
-- This migration is safe to apply on databases that already have the column
-- (e.g. fresh dev databases where 0003 was applied with the column present)
-- via IF NOT EXISTS.

ALTER TABLE content_licences
  ADD COLUMN IF NOT EXISTS evidence_ids UUID[] NOT NULL DEFAULT '{}';
