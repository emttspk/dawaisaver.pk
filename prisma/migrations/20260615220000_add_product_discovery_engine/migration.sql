CREATE TYPE discovery_source_type AS ENUM (
  'DRAP_IMPORT',
  'PHARMACY_SNAPSHOT',
  'SEARCH_QUERY',
  'UNKNOWN_PRODUCT',
  'BILL_IMPORT',
  'PRESCRIPTION_IMPORT',
  'ADMIN_IMPORT'
);

CREATE TYPE discovery_status AS ENUM (
  'NEW',
  'COLLECTING_EVIDENCE',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
  'MERGED'
);

CREATE TYPE discovery_review_decision AS ENUM (
  'APPROVE',
  'REJECT',
  'MERGE',
  'REQUEST_MORE_EVIDENCE'
);

CREATE TYPE discovery_rule_type AS ENUM (
  'CANDIDATE_GENERATION',
  'EVIDENCE_CONFIDENCE',
  'DUPLICATE_DETECTION',
  'REVIEW_ROUTING',
  'AUTO_MERGE_GUARD'
);

CREATE TABLE discovery_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name text NOT NULL,
  normalized_brand text,
  normalized_generic text,
  normalized_strength text,
  normalized_dosage_form text,
  normalized_manufacturer text,
  medicine_signature text,
  registration_number text,
  pack_size text,
  discovery_status discovery_status NOT NULL DEFAULT 'NEW',
  source_confidence numeric(5,4) NOT NULL DEFAULT 0,
  matching_confidence numeric(5,4) NOT NULL DEFAULT 0,
  evidence_confidence numeric(5,4) NOT NULL DEFAULT 0,
  overall_confidence numeric(5,4) NOT NULL DEFAULT 0,
  duplicate_of_canonical_product_id uuid,
  duplicate_of_product_id uuid,
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE discovery_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_candidate_id uuid NOT NULL REFERENCES discovery_candidates(id),
  source text NOT NULL,
  discovery_source_type discovery_source_type NOT NULL,
  source_url text,
  capture_date timestamptz NOT NULL DEFAULT now(),
  supporting_fields jsonb NOT NULL,
  source_record_id uuid,
  confidence numeric(5,4) NOT NULL DEFAULT 0,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE discovery_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_candidate_id uuid NOT NULL REFERENCES discovery_candidates(id),
  reviewer_user_id uuid,
  decision discovery_review_decision NOT NULL,
  review_notes text,
  merge_target_canonical_product_id uuid,
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ADMIN_REVIEW',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE discovery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  discovery_source_type discovery_source_type NOT NULL,
  discovery_status discovery_status NOT NULL DEFAULT 'NEW',
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  result_summary jsonb,
  error_message text,
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE discovery_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  rule_type discovery_rule_type NOT NULL,
  weight numeric(6,4) NOT NULL DEFAULT 1,
  threshold numeric(6,4),
  enabled boolean NOT NULL DEFAULT true,
  description text,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE INDEX discovery_candidates_signature_idx ON discovery_candidates (medicine_signature);
CREATE INDEX discovery_candidates_brand_idx ON discovery_candidates (normalized_brand);
CREATE INDEX discovery_candidates_generic_idx ON discovery_candidates (normalized_generic);
CREATE INDEX discovery_candidates_status_idx ON discovery_candidates (discovery_status);
CREATE INDEX discovery_candidates_confidence_idx ON discovery_candidates (overall_confidence);
CREATE INDEX discovery_evidence_candidate_idx ON discovery_evidence (discovery_candidate_id);
CREATE INDEX discovery_evidence_source_type_idx ON discovery_evidence (discovery_source_type);
CREATE INDEX discovery_evidence_capture_date_idx ON discovery_evidence (capture_date);
CREATE INDEX discovery_evidence_confidence_idx ON discovery_evidence (confidence);
CREATE INDEX discovery_reviews_candidate_idx ON discovery_reviews (discovery_candidate_id);
CREATE INDEX discovery_reviews_reviewer_idx ON discovery_reviews (reviewer_user_id);
CREATE INDEX discovery_reviews_decision_idx ON discovery_reviews (decision);
CREATE INDEX discovery_jobs_job_type_idx ON discovery_jobs (job_type);
CREATE INDEX discovery_jobs_source_type_idx ON discovery_jobs (discovery_source_type);
CREATE INDEX discovery_jobs_status_idx ON discovery_jobs (discovery_status);
CREATE INDEX discovery_jobs_scheduled_at_idx ON discovery_jobs (scheduled_at);
CREATE INDEX discovery_rules_type_idx ON discovery_rules (rule_type);
CREATE INDEX discovery_rules_enabled_idx ON discovery_rules (enabled);
CREATE INDEX discovery_rules_status_idx ON discovery_rules (status);
