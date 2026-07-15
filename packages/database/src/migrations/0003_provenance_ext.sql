ALTER TABLE content_publication_decisions ALTER COLUMN provenance_id DROP NOT NULL;
ALTER TABLE content_publication_decisions ADD CONSTRAINT ck_pub_decision_prov_required
  CHECK (provenance_id IS NOT NULL OR eligible = false);
ALTER TABLE content_publication_decisions ADD COLUMN IF NOT EXISTS actor_id UUID;
ALTER TABLE content_publication_decisions ADD COLUMN IF NOT EXISTS request_id UUID;
ALTER TABLE content_publication_decisions ADD CONSTRAINT uq_pub_decision_request_content
  UNIQUE (request_id, content_id, content_version_id);
ALTER TABLE content_reverification_jobs ADD COLUMN IF NOT EXISTS attempt INTEGER NOT NULL DEFAULT 1;
ALTER TABLE content_reverification_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE TABLE content_policies (
  id UUID PRIMARY KEY,
  version VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ,
  similarity_review_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  similarity_block_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.6,
  expiry_warning_days INTEGER NOT NULL DEFAULT 30,
  evidence_retention_days INTEGER NOT NULL DEFAULT 2555,
  required_evidence_by_ownership JSONB NOT NULL DEFAULT '{}',
  prohibited_rules JSONB NOT NULL DEFAULT '[]',
  supported_source_types JSONB NOT NULL DEFAULT '[]',
  supported_licence_types JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE content_prohibited_matches (
  id UUID PRIMARY KEY,
  content_id VARCHAR(128) NOT NULL,
  content_version_id VARCHAR(128) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_by UUID NOT NULL REFERENCES users(id),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  reason TEXT NOT NULL DEFAULT ''
);

CREATE TABLE content_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(64) NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  request_id UUID,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  previous_version VARCHAR(64),
  new_version VARCHAR(64),
  reason TEXT,
  policy_id UUID,
  policy_version VARCHAR(64),
  result TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_policies_status ON content_policies(status);
CREATE INDEX idx_content_prohibited_content ON content_prohibited_matches(content_id, content_version_id);
CREATE INDEX idx_content_audit_entity ON content_audit_events(entity_type, entity_id);
CREATE INDEX idx_content_audit_event_type ON content_audit_events(event_type);
CREATE INDEX idx_content_audit_occurred ON content_audit_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_content_provenance_source ON content_provenance(source_id);
CREATE INDEX IF NOT EXISTS idx_content_provenance_licence ON content_provenance(licence_id);
CREATE INDEX IF NOT EXISTS idx_pub_decision_idempotency ON content_publication_decisions(request_id, content_id, content_version_id);
