CREATE TYPE import_batch_status AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED'
);

CREATE TYPE import_item_status AS ENUM (
  'PENDING',
  'VALIDATED',
  'NORMALIZED',
  'SAVED',
  'DUPLICATE',
  'FAILED'
);

CREATE TABLE import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type source_type NOT NULL,
  source_url text,
  file_name text,
  adapter_type text NOT NULL,
  status import_batch_status NOT NULL DEFAULT 'PENDING',
  total_rows integer NOT NULL DEFAULT 0,
  valid_rows integer NOT NULL DEFAULT 0,
  invalid_rows integer NOT NULL DEFAULT 0,
  duplicate_rows integer NOT NULL DEFAULT 0,
  saved_rows integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  import_report jsonb,
  confidence_score numeric(5,4),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE import_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL REFERENCES import_batches(id),
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL,
  normalized_data jsonb,
  validation_data jsonb,
  status import_item_status NOT NULL DEFAULT 'PENDING',
  product_id uuid,
  manufacturer_id uuid,
  confidence_score numeric(5,4),
  source_type source_type NOT NULL,
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid,
  CONSTRAINT import_batch_items_batch_row_key UNIQUE (import_batch_id, row_number)
);

CREATE TABLE import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL REFERENCES import_batches(id),
  row_number integer,
  error_code text NOT NULL,
  error_message text NOT NULL,
  raw_data jsonb,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL,
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

ALTER TABLE import_batch_items
  ADD CONSTRAINT import_batch_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id),
  ADD CONSTRAINT import_batch_items_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id);

CREATE INDEX import_batches_source_type_idx ON import_batches (source_type);
CREATE INDEX import_batches_adapter_type_idx ON import_batches (adapter_type);
CREATE INDEX import_batches_status_idx ON import_batches (status);
CREATE INDEX import_batches_created_at_idx ON import_batches (created_at);
CREATE INDEX import_batch_items_status_idx ON import_batch_items (status);
CREATE INDEX import_batch_items_product_id_idx ON import_batch_items (product_id);
CREATE INDEX import_batch_items_manufacturer_id_idx ON import_batch_items (manufacturer_id);
CREATE INDEX import_batch_items_source_type_idx ON import_batch_items (source_type);
CREATE INDEX import_errors_import_batch_id_idx ON import_errors (import_batch_id);
CREATE INDEX import_errors_error_code_idx ON import_errors (error_code);
CREATE INDEX import_errors_source_type_idx ON import_errors (source_type);
