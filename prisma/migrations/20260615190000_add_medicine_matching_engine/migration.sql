CREATE TYPE match_result_status AS ENUM (
  'MATCHED',
  'POSSIBLE_MATCH',
  'NEEDS_REVIEW',
  'UNMATCHED'
);

CREATE TYPE match_review_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'MERGED',
  'SPLIT'
);

CREATE TYPE canonical_alias_type AS ENUM (
  'BRAND',
  'GENERIC',
  'MANUFACTURER',
  'SIGNATURE',
  'REGISTRATION_NUMBER',
  'PACK_SIZE'
);

CREATE TYPE matching_rule_type AS ENUM (
  'BRAND',
  'GENERIC',
  'STRENGTH',
  'DOSAGE_FORM',
  'MANUFACTURER',
  'PACK_SIZE',
  'REGISTRATION_NUMBER',
  'SIGNATURE',
  'CONFIDENCE'
);

CREATE TABLE canonical_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE REFERENCES products(id),
  canonical_name text NOT NULL,
  normalized_brand text NOT NULL,
  normalized_generic text NOT NULL,
  normalized_strength text,
  normalized_dosage_form text,
  normalized_manufacturer text,
  pack_size text,
  registration_number text,
  medicine_signature text NOT NULL UNIQUE,
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

CREATE TABLE canonical_product_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_id uuid NOT NULL REFERENCES canonical_products(id),
  alias_type canonical_alias_type NOT NULL,
  alias_value text NOT NULL,
  normalized_value text NOT NULL,
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
  deleted_by_id uuid,
  CONSTRAINT canonical_product_aliases_unique_alias UNIQUE (canonical_product_id, alias_type, normalized_value)
);

CREATE TABLE product_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id uuid REFERENCES products(id),
  canonical_product_id uuid REFERENCES canonical_products(id),
  source_table text,
  source_record_id uuid,
  match_status match_result_status NOT NULL,
  brand_score numeric(5,4) NOT NULL,
  generic_score numeric(5,4) NOT NULL,
  strength_score numeric(5,4) NOT NULL,
  manufacturer_score numeric(5,4) NOT NULL,
  signature_score numeric(5,4) NOT NULL,
  final_confidence numeric(5,4) NOT NULL,
  explanation jsonb NOT NULL,
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

CREATE TABLE match_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_match_id uuid NOT NULL REFERENCES product_matches(id),
  canonical_product_id uuid REFERENCES canonical_products(id),
  reviewer_user_id uuid REFERENCES users(id),
  review_status match_review_status NOT NULL DEFAULT 'PENDING',
  review_notes text,
  confidence_breakdown jsonb,
  explanation jsonb,
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

CREATE TABLE matching_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  rule_type matching_rule_type NOT NULL,
  weight numeric(6,4) NOT NULL,
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

CREATE INDEX canonical_products_normalized_brand_idx ON canonical_products (normalized_brand);
CREATE INDEX canonical_products_normalized_generic_idx ON canonical_products (normalized_generic);
CREATE INDEX canonical_products_signature_idx ON canonical_products (medicine_signature);
CREATE INDEX canonical_products_registration_number_idx ON canonical_products (registration_number);
CREATE INDEX canonical_products_status_idx ON canonical_products (status);
CREATE INDEX canonical_product_aliases_type_idx ON canonical_product_aliases (alias_type);
CREATE INDEX canonical_product_aliases_normalized_value_idx ON canonical_product_aliases (normalized_value);
CREATE INDEX canonical_product_aliases_status_idx ON canonical_product_aliases (status);
CREATE INDEX product_matches_source_product_idx ON product_matches (source_product_id);
CREATE INDEX product_matches_canonical_product_idx ON product_matches (canonical_product_id);
CREATE INDEX product_matches_match_status_idx ON product_matches (match_status);
CREATE INDEX product_matches_source_record_idx ON product_matches (source_table, source_record_id);
CREATE INDEX product_matches_final_confidence_idx ON product_matches (final_confidence);
CREATE INDEX match_reviews_product_match_idx ON match_reviews (product_match_id);
CREATE INDEX match_reviews_canonical_product_idx ON match_reviews (canonical_product_id);
CREATE INDEX match_reviews_reviewer_idx ON match_reviews (reviewer_user_id);
CREATE INDEX match_reviews_review_status_idx ON match_reviews (review_status);
CREATE INDEX matching_rules_rule_type_idx ON matching_rules (rule_type);
CREATE INDEX matching_rules_enabled_idx ON matching_rules (enabled);
CREATE INDEX matching_rules_status_idx ON matching_rules (status);
