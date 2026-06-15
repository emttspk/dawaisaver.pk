CREATE TYPE source_provider_kind AS ENUM (
  'DAWAAI',
  'SEHAT',
  'DVAGO',
  'SERVAID',
  'ONLINE_PHARMACY',
  'API'
);

CREATE TYPE source_sync_status AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED'
);

CREATE TYPE stock_status AS ENUM (
  'IN_STOCK',
  'OUT_OF_STOCK',
  'LIMITED',
  'UNKNOWN'
);

CREATE TYPE price_change_direction AS ENUM (
  'INCREASE',
  'DECREASE',
  'UNCHANGED',
  'NEW'
);

CREATE TABLE source_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  provider_kind source_provider_kind NOT NULL,
  base_url text,
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE source_provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_provider_id uuid NOT NULL REFERENCES source_providers(id),
  config_key text NOT NULL,
  config_value jsonb NOT NULL,
  is_secret boolean NOT NULL DEFAULT false,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid,
  CONSTRAINT source_provider_configs_provider_key UNIQUE (source_provider_id, config_key)
);

CREATE TABLE source_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_provider_id uuid NOT NULL REFERENCES source_providers(id),
  job_type text NOT NULL,
  status source_sync_status NOT NULL DEFAULT 'PENDING',
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  result_summary jsonb,
  error_message text,
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE source_sync_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_sync_job_id uuid NOT NULL REFERENCES source_sync_jobs(id),
  source_provider_id uuid NOT NULL REFERENCES source_providers(id),
  total_products integer NOT NULL DEFAULT 0,
  matched_products integer NOT NULL DEFAULT 0,
  price_snapshots integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  status source_sync_status NOT NULL DEFAULT 'COMPLETED',
  raw_data jsonb,
  normalized_data jsonb,
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE source_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_provider_id uuid NOT NULL REFERENCES source_providers(id),
  healthy boolean NOT NULL,
  status_code integer,
  response_time_ms integer,
  checked_at timestamptz NOT NULL DEFAULT now(),
  message text,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE price_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_provider_id uuid NOT NULL REFERENCES source_providers(id),
  product_id uuid REFERENCES products(id),
  external_product_id text,
  brand_name text,
  normalized_brand text,
  generic_name text,
  normalized_generic text,
  strength_text text,
  dosage_form text,
  medicine_signature text,
  price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  stock_status stock_status NOT NULL DEFAULT 'UNKNOWN',
  city text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE price_change_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_snapshot_id uuid NOT NULL REFERENCES price_snapshots(id),
  source_provider_id uuid NOT NULL REFERENCES source_providers(id),
  product_id uuid REFERENCES products(id),
  previous_price numeric(12,2),
  current_price numeric(12,2) NOT NULL,
  change_amount numeric(12,2),
  change_percent numeric(8,4),
  direction price_change_direction NOT NULL,
  city text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE product_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_provider_id uuid NOT NULL REFERENCES source_providers(id),
  product_id uuid REFERENCES products(id),
  external_product_id text,
  medicine_signature text,
  stock_status stock_status NOT NULL DEFAULT 'UNKNOWN',
  city text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'ONLINE_PHARMACY',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE INDEX source_providers_provider_kind_idx ON source_providers (provider_kind);
CREATE INDEX source_providers_status_idx ON source_providers (status);
CREATE INDEX source_provider_configs_status_idx ON source_provider_configs (status);
CREATE INDEX source_sync_jobs_provider_idx ON source_sync_jobs (source_provider_id);
CREATE INDEX source_sync_jobs_job_type_idx ON source_sync_jobs (job_type);
CREATE INDEX source_sync_jobs_status_idx ON source_sync_jobs (status);
CREATE INDEX source_sync_jobs_scheduled_at_idx ON source_sync_jobs (scheduled_at);
CREATE INDEX source_sync_results_job_idx ON source_sync_results (source_sync_job_id);
CREATE INDEX source_sync_results_provider_idx ON source_sync_results (source_provider_id);
CREATE INDEX source_sync_results_status_idx ON source_sync_results (status);
CREATE INDEX source_health_logs_provider_idx ON source_health_logs (source_provider_id);
CREATE INDEX source_health_logs_healthy_idx ON source_health_logs (healthy);
CREATE INDEX source_health_logs_checked_at_idx ON source_health_logs (checked_at);
CREATE INDEX price_snapshots_provider_idx ON price_snapshots (source_provider_id);
CREATE INDEX price_snapshots_product_idx ON price_snapshots (product_id);
CREATE INDEX price_snapshots_signature_idx ON price_snapshots (medicine_signature);
CREATE INDEX price_snapshots_city_idx ON price_snapshots (city);
CREATE INDEX price_snapshots_captured_at_idx ON price_snapshots (captured_at);
CREATE INDEX price_snapshots_stock_status_idx ON price_snapshots (stock_status);
CREATE INDEX price_change_events_snapshot_idx ON price_change_events (price_snapshot_id);
CREATE INDEX price_change_events_provider_idx ON price_change_events (source_provider_id);
CREATE INDEX price_change_events_product_idx ON price_change_events (product_id);
CREATE INDEX price_change_events_direction_idx ON price_change_events (direction);
CREATE INDEX price_change_events_captured_at_idx ON price_change_events (captured_at);
CREATE INDEX product_availability_provider_idx ON product_availability (source_provider_id);
CREATE INDEX product_availability_product_idx ON product_availability (product_id);
CREATE INDEX product_availability_signature_idx ON product_availability (medicine_signature);
CREATE INDEX product_availability_city_idx ON product_availability (city);
CREATE INDEX product_availability_stock_status_idx ON product_availability (stock_status);
CREATE INDEX product_availability_captured_at_idx ON product_availability (captured_at);
