CREATE TYPE catalog_build_status AS ENUM (
  'PENDING',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED'
);

CREATE TYPE catalog_build_phase AS ENUM (
  'IMPORT_ITEMS',
  'CANONICAL_PRODUCTS'
);

CREATE TABLE catalog_build_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status catalog_build_status NOT NULL DEFAULT 'PENDING',
  phase catalog_build_phase NOT NULL DEFAULT 'IMPORT_ITEMS',
  dry_run boolean NOT NULL DEFAULT false,
  batch_size integer NOT NULL DEFAULT 500,
  limit_rows integer,
  current_import_batch_id uuid,
  current_import_batch_created_at timestamptz,
  current_import_row_number integer,
  current_product_id uuid,
  current_product_created_at timestamptz,
  total_import_items integer NOT NULL DEFAULT 0,
  processed_import_items integer NOT NULL DEFAULT 0,
  processed_products integer NOT NULL DEFAULT 0,
  manufacturers_created integer NOT NULL DEFAULT 0,
  manufacturers_reused integer NOT NULL DEFAULT 0,
  generics_created integer NOT NULL DEFAULT 0,
  generics_reused integer NOT NULL DEFAULT 0,
  products_created integer NOT NULL DEFAULT 0,
  products_updated integer NOT NULL DEFAULT 0,
  product_compositions_created integer NOT NULL DEFAULT 0,
  product_compositions_updated integer NOT NULL DEFAULT 0,
  canonical_products_created integer NOT NULL DEFAULT 0,
  canonical_products_updated integer NOT NULL DEFAULT 0,
  canonical_aliases_created integer NOT NULL DEFAULT 0,
  matches_created integer NOT NULL DEFAULT 0,
  match_reviews_created integer NOT NULL DEFAULT 0,
  skipped_items integer NOT NULL DEFAULT 0,
  validation_report jsonb,
  progress_report jsonb,
  resume_token jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX catalog_build_jobs_status_phase_idx ON catalog_build_jobs (status, phase);
CREATE INDEX catalog_build_jobs_created_at_idx ON catalog_build_jobs (created_at);
