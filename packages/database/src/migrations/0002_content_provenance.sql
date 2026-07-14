CREATE TABLE content_sources (
  id UUID PRIMARY KEY,
  source_type VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  owner VARCHAR(500) NOT NULL,
  publisher VARCHAR(500) NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  jurisdiction VARCHAR(200) NOT NULL DEFAULT '',
  source_date TIMESTAMPTZ NOT NULL,
  access_date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE content_licences (
  id UUID PRIMARY KEY,
  licence_type VARCHAR(64) NOT NULL,
  licensor VARCHAR(500) NOT NULL,
  licensee VARCHAR(500) NOT NULL,
  rights_granted JSONB NOT NULL DEFAULT '[]',
  prohibited_uses JSONB NOT NULL DEFAULT '[]',
  attribution_required BOOLEAN NOT NULL DEFAULT false,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT false,
  modification_allowed BOOLEAN NOT NULL DEFAULT false,
  redistribution_allowed BOOLEAN NOT NULL DEFAULT false,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  jurisdiction VARCHAR(200) NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  supersedes UUID REFERENCES content_licences(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE content_evidence (
  id UUID PRIMARY KEY,
  evidence_type VARCHAR(64) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  media_id VARCHAR(255) NOT NULL,
  checksum VARCHAR(128) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retained_until TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active'
);

CREATE TABLE content_provenance (
  id UUID PRIMARY KEY,
  content_id VARCHAR(128) NOT NULL,
  content_version_id VARCHAR(128) NOT NULL,
  source_id UUID NOT NULL REFERENCES content_sources(id),
  licence_id UUID REFERENCES content_licences(id),
  ownership_type VARCHAR(64) NOT NULL,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  publication_status VARCHAR(32) NOT NULL DEFAULT 'blocked',
  attribution TEXT NOT NULL DEFAULT '',
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  similarity_check_id UUID,
  created_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  supersedes UUID REFERENCES content_provenance(id),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE content_provenance_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provenance_id UUID NOT NULL REFERENCES content_provenance(id),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason VARCHAR(255) NOT NULL DEFAULT 'created'
);

CREATE TABLE content_similarity_checks (
  id UUID PRIMARY KEY,
  content_id VARCHAR(128) NOT NULL,
  content_version_id VARCHAR(128) NOT NULL,
  provider_id VARCHAR(128) NOT NULL,
  profile_version VARCHAR(64) NOT NULL DEFAULT '1.0.0',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  similarity_score DOUBLE PRECISION,
  matched_sources JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  error TEXT,
  evidence_snapshot TEXT NOT NULL DEFAULT ''
);

CREATE TABLE content_publication_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provenance_id UUID NOT NULL REFERENCES content_provenance(id),
  content_id VARCHAR(128) NOT NULL,
  content_version_id VARCHAR(128) NOT NULL,
  eligible BOOLEAN NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  policy_version VARCHAR(64) NOT NULL,
  blockers JSONB NOT NULL DEFAULT '[]',
  warnings JSONB NOT NULL DEFAULT '[]',
  decision_snapshot JSONB NOT NULL
);

CREATE TABLE content_reverification_jobs (
  id UUID PRIMARY KEY,
  provenance_id UUID NOT NULL REFERENCES content_provenance(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_content_provenance_content ON content_provenance(content_id, content_version_id);
CREATE INDEX idx_content_provenance_verification ON content_provenance(verification_status);
CREATE INDEX idx_content_licences_status ON content_licences(status);
CREATE INDEX idx_content_similarity_content ON content_similarity_checks(content_id, content_version_id);
