CREATE TABLE prescription_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type,
  source_url text,
  city text,
  metadata jsonb,
  result_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE INDEX prescription_processing_jobs_prescription_id_idx ON prescription_processing_jobs (prescription_id);
CREATE INDEX prescription_processing_jobs_job_type_idx ON prescription_processing_jobs (job_type);
CREATE INDEX prescription_processing_jobs_status_idx ON prescription_processing_jobs (status);

CREATE TABLE prescription_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  prescription_item_id uuid REFERENCES prescription_items(id) ON DELETE SET NULL,
  review_status text NOT NULL,
  review_decision text NOT NULL,
  review_notes text,
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type,
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE INDEX prescription_reviews_prescription_id_idx ON prescription_reviews (prescription_id);
CREATE INDEX prescription_reviews_prescription_item_id_idx ON prescription_reviews (prescription_item_id);
CREATE INDEX prescription_reviews_status_idx ON prescription_reviews (status);

CREATE TABLE prescription_cost_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  prescription_item_id uuid REFERENCES prescription_items(id) ON DELETE SET NULL,
  city text,
  original_estimated_cost numeric(12,2) NOT NULL DEFAULT 0,
  cheapest_equivalent_cost numeric(12,2) NOT NULL DEFAULT 0,
  balanced_option_cost numeric(12,2) NOT NULL DEFAULT 0,
  premium_option_cost numeric(12,2) NOT NULL DEFAULT 0,
  estimated_saving numeric(12,2) NOT NULL DEFAULT 0,
  review_required boolean NOT NULL DEFAULT false,
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type,
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE INDEX prescription_cost_estimates_prescription_id_idx ON prescription_cost_estimates (prescription_id);
CREATE INDEX prescription_cost_estimates_prescription_item_id_idx ON prescription_cost_estimates (prescription_item_id);
CREATE INDEX prescription_cost_estimates_city_idx ON prescription_cost_estimates (city);
CREATE INDEX prescription_cost_estimates_status_idx ON prescription_cost_estimates (status);

