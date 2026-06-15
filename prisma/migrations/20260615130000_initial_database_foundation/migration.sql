CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE record_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'PENDING_REVIEW',
  'VERIFIED',
  'REJECTED',
  'ARCHIVED',
  'DELETED'
);

CREATE TYPE source_type AS ENUM (
  'DRAP',
  'DRAP_UPDATE',
  'MANUFACTURER',
  'ONLINE_PHARMACY',
  'USER_BILL',
  'USER_PRESCRIPTION',
  'ADMIN_IMPORT',
  'ADMIN_REVIEW',
  'SYSTEM'
);

CREATE TYPE user_role AS ENUM (
  'USER',
  'ADMIN',
  'REVIEWER'
);

CREATE TYPE audit_action AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'IMPORT',
  'NORMALIZE',
  'REVIEW',
  'MATCH',
  'PRICE_OBSERVATION',
  'SEARCH'
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  name text,
  role user_role NOT NULL DEFAULT 'USER',
  status record_status NOT NULL DEFAULT 'ACTIVE',
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

CREATE TABLE manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  country text,
  website_url text,
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

CREATE TABLE generics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}',
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

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid REFERENCES manufacturers(id),
  brand_name text NOT NULL,
  normalized_brand text NOT NULL,
  display_name text NOT NULL,
  dosage_form text,
  normalized_form text,
  strength_text text,
  pack_size text,
  registration_number text,
  signature text,
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

CREATE TABLE product_compositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  generic_id uuid NOT NULL REFERENCES generics(id),
  ingredient_order integer NOT NULL DEFAULT 1,
  strength_value numeric(12,4),
  strength_unit text,
  strength_text text,
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
  deleted_by_id uuid,
  CONSTRAINT product_compositions_product_generic_order_key UNIQUE (product_id, generic_id, ingredient_order)
);

CREATE TABLE equivalence_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  signature text NOT NULL,
  equivalence_type text NOT NULL,
  dosage_form text,
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

CREATE TABLE product_equivalence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  equivalence_group_id uuid NOT NULL REFERENCES equivalence_groups(id),
  reason_code text,
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
  deleted_by_id uuid,
  CONSTRAINT product_equivalence_product_group_key UNIQUE (product_id, equivalence_group_id)
);

CREATE TABLE pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  city text,
  license_number text,
  address text,
  phone text,
  website_url text,
  is_partner boolean NOT NULL DEFAULT false,
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

CREATE TABLE product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  pharmacy_id uuid REFERENCES pharmacies(id),
  city text,
  price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  observed_at timestamptz NOT NULL DEFAULT now(),
  availability text,
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

CREATE TABLE prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  upload_url text,
  ocr_text text,
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

CREATE TABLE prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id),
  product_id uuid REFERENCES products(id),
  raw_text text NOT NULL,
  parsed_name text,
  dosage_text text,
  quantity numeric(12,4),
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

CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  pharmacy_id uuid REFERENCES pharmacies(id),
  upload_url text,
  ocr_text text,
  purchased_at timestamptz,
  total_amount numeric(12,2),
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

CREATE TABLE bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id),
  product_id uuid REFERENCES products(id),
  raw_text text NOT NULL,
  parsed_name text,
  quantity numeric(12,4),
  unit_price numeric(12,2),
  line_total numeric(12,2),
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

CREATE TABLE crawl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  adapter_name text NOT NULL,
  target_url text,
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  result_summary jsonb,
  error_message text,
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

CREATE TABLE search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  query text NOT NULL,
  normalized_query text,
  city text,
  result_count integer,
  status record_status NOT NULL DEFAULT 'ACTIVE',
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

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id),
  action audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  correlation_id text,
  before_data jsonb,
  after_data jsonb,
  reason text,
  status record_status NOT NULL DEFAULT 'ACTIVE',
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

CREATE INDEX manufacturers_normalized_name_idx ON manufacturers (normalized_name);
CREATE INDEX manufacturers_status_idx ON manufacturers (status);
CREATE INDEX generics_status_idx ON generics (status);
CREATE INDEX products_manufacturer_id_idx ON products (manufacturer_id);
CREATE INDEX products_normalized_brand_idx ON products (normalized_brand);
CREATE INDEX products_signature_idx ON products (signature);
CREATE INDEX products_registration_number_idx ON products (registration_number);
CREATE INDEX products_status_idx ON products (status);
CREATE INDEX product_compositions_generic_id_idx ON product_compositions (generic_id);
CREATE INDEX product_compositions_status_idx ON product_compositions (status);
CREATE INDEX equivalence_groups_signature_idx ON equivalence_groups (signature);
CREATE INDEX equivalence_groups_status_idx ON equivalence_groups (status);
CREATE INDEX product_equivalence_equivalence_group_id_idx ON product_equivalence (equivalence_group_id);
CREATE INDEX product_equivalence_status_idx ON product_equivalence (status);
CREATE INDEX pharmacies_normalized_name_idx ON pharmacies (normalized_name);
CREATE INDEX pharmacies_city_idx ON pharmacies (city);
CREATE INDEX pharmacies_status_idx ON pharmacies (status);
CREATE INDEX product_prices_product_observed_at_idx ON product_prices (product_id, observed_at);
CREATE INDEX product_prices_pharmacy_id_idx ON product_prices (pharmacy_id);
CREATE INDEX product_prices_city_idx ON product_prices (city);
CREATE INDEX product_prices_source_type_idx ON product_prices (source_type);
CREATE INDEX prescriptions_user_id_idx ON prescriptions (user_id);
CREATE INDEX prescriptions_status_idx ON prescriptions (status);
CREATE INDEX prescription_items_prescription_id_idx ON prescription_items (prescription_id);
CREATE INDEX prescription_items_product_id_idx ON prescription_items (product_id);
CREATE INDEX prescription_items_status_idx ON prescription_items (status);
CREATE INDEX bills_user_id_idx ON bills (user_id);
CREATE INDEX bills_pharmacy_id_idx ON bills (pharmacy_id);
CREATE INDEX bills_status_idx ON bills (status);
CREATE INDEX bill_items_bill_id_idx ON bill_items (bill_id);
CREATE INDEX bill_items_product_id_idx ON bill_items (product_id);
CREATE INDEX bill_items_status_idx ON bill_items (status);
CREATE INDEX crawl_jobs_adapter_name_idx ON crawl_jobs (adapter_name);
CREATE INDEX crawl_jobs_status_idx ON crawl_jobs (status);
CREATE INDEX crawl_jobs_scheduled_at_idx ON crawl_jobs (scheduled_at);
CREATE INDEX search_logs_normalized_query_idx ON search_logs (normalized_query);
CREATE INDEX search_logs_city_idx ON search_logs (city);
CREATE INDEX search_logs_created_at_idx ON search_logs (created_at);
CREATE INDEX audit_logs_actor_user_id_idx ON audit_logs (actor_user_id);
CREATE INDEX audit_logs_action_idx ON audit_logs (action);
CREATE INDEX audit_logs_entity_type_entity_id_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_correlation_id_idx ON audit_logs (correlation_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at);

CREATE INDEX products_search_idx ON products USING gin (
  to_tsvector('simple', coalesce(display_name, '') || ' ' || coalesce(brand_name, '') || ' ' || coalesce(strength_text, '') || ' ' || coalesce(registration_number, ''))
);

CREATE INDEX generics_search_idx ON generics USING gin (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(normalized_name, ''))
);

CREATE INDEX manufacturers_search_idx ON manufacturers USING gin (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(normalized_name, ''))
);

