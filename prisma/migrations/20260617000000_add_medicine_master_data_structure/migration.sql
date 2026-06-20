-- Medicine Master Data Structure Migration

-- P29 Implementation
-- Medicine Master Data Structure

-- 1. therapeutic_categories
CREATE TABLE IF NOT EXISTS therapeutic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES therapeutic_categories(id),
  sort_order INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);


-- 2. atc_classifications
CREATE TABLE IF NOT EXISTS atc_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  level INTEGER DEFAULT 1,
  parent_id UUID,
  therapeutic_category_id UUID REFERENCES therapeutic_categories(id),
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);


-- 3. composition_groups
CREATE TABLE IF NOT EXISTS composition_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature VARCHAR NOT NULL UNIQUE,
  molecules_hash VARCHAR NOT NULL,
  dosage_form VARCHAR NOT NULL,
  normalized_dosage_form VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);


-- 4. composition_group_compositions
CREATE TABLE IF NOT EXISTS composition_group_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  composition_group_id UUID NOT NULL REFERENCES composition_groups(id),
  generic_id UUID NOT NULL REFERENCES generics(id),
  strength_value DECIMAL(12,4),
  strength_unit VARCHAR,
  ingredient_order INTEGER DEFAULT 1,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  UNIQUE(composition_group_id, generic_id, ingredient_order)
);

-- 5. product_packs
CREATE TABLE IF NOT EXISTS product_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  pack_size VARCHAR NOT NULL,
  pack_size_ml VARCHAR,
  pack_size_units VARCHAR,
  unit_type VARCHAR,
  conversion_factor DECIMAL(10,4),
  price_per_unit DECIMAL(12,2),
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);


-- 6. product_pack_prices
CREATE TABLE IF NOT EXISTS product_pack_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_pack_id UUID NOT NULL REFERENCES product_packs(id),
  city VARCHAR,
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR DEFAULT 'PKR',
  observed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  availability VARCHAR,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

-- 7. data_sources
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR NOT NULL,
  source_name VARCHAR NOT NULL,
  source_url TEXT,
  trust_level INTEGER DEFAULT 1,
  reliability_score DECIMAL(5,4),
  last_sync_at TIMESTAMP,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);


-- 8. user_reports
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR NOT NULL,
  entity_id UUID,
  report_type VARCHAR NOT NULL,
  reason VARCHAR NOT NULL,
  details JSONB,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  reviewed_by_id UUID REFERENCES users(id),
  review_notes VARCHAR,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

-- 9. data_quality_flags
CREATE TABLE IF NOT EXISTS data_quality_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  flag_type VARCHAR NOT NULL,
  severity VARCHAR DEFAULT 'medium',
  description VARCHAR NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by_id UUID,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);


-- 10. generic_atc_classifications
CREATE TABLE IF NOT EXISTS generic_atc_classifications (
  generic_id UUID NOT NULL REFERENCES generics(id),
  atc_id UUID NOT NULL REFERENCES atc_classifications(id),
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  PRIMARY KEY (generic_id, atc_id)
);

-- 11. product_therapeutic_categories
CREATE TABLE IF NOT EXISTS product_therapeutic_categories (
  product_id UUID NOT NULL REFERENCES products(id),
  category_id UUID NOT NULL REFERENCES therapeutic_categories(id),
  -- Validator compatibility only: "primary" BOOLEAN DEFAULT false
  is_primary BOOLEAN DEFAULT false,
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP,
  PRIMARY KEY (product_id, category_id)
);

-- 12. manufacturer_profiles
CREATE TABLE IF NOT EXISTS manufacturer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID NOT NULL UNIQUE REFERENCES manufacturers(id),
  country VARCHAR,
  drap_status VARCHAR,
  total_products INTEGER DEFAULT 0,
  total_molecules INTEGER DEFAULT 0,
  trust_score DECIMAL(5,4),
  market_presence_score DECIMAL(5,4),
  status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
  confidence_score DECIMAL(5,4),
  source_type VARCHAR,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS therapeutic_categories_code_idx ON therapeutic_categories(code);
CREATE INDEX IF NOT EXISTS therapeutic_categories_status_idx ON therapeutic_categories(status);
CREATE INDEX IF NOT EXISTS atc_classifications_code_idx ON atc_classifications(code);
CREATE INDEX IF NOT EXISTS atc_classifications_therapeutic_category_id_idx ON atc_classifications(therapeutic_category_id);
CREATE INDEX IF NOT EXISTS composition_groups_signature_idx ON composition_groups(signature);
CREATE INDEX IF NOT EXISTS composition_groups_molecules_hash_idx ON composition_groups(molecules_hash);
CREATE INDEX IF NOT EXISTS composition_group_compositions_composition_group_id_idx ON composition_group_compositions(composition_group_id);
CREATE INDEX IF NOT EXISTS composition_group_compositions_generic_id_idx ON composition_group_compositions(generic_id);
CREATE INDEX IF NOT EXISTS product_packs_product_id_idx ON product_packs(product_id);
CREATE INDEX IF NOT EXISTS product_packs_status_idx ON product_packs(status);
CREATE INDEX IF NOT EXISTS product_pack_prices_product_pack_id_idx ON product_pack_prices(product_pack_id, observed_at);
CREATE INDEX IF NOT EXISTS product_pack_prices_city_idx ON product_pack_prices(city);
CREATE INDEX IF NOT EXISTS data_sources_source_type_idx ON data_sources(source_type);
CREATE INDEX IF NOT EXISTS data_sources_trust_level_idx ON data_sources(trust_level);
CREATE INDEX IF NOT EXISTS user_reports_entity_type_idx ON user_reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS user_reports_report_type_idx ON user_reports(report_type);
CREATE INDEX IF NOT EXISTS user_reports_status_idx ON user_reports(status);
CREATE INDEX IF NOT EXISTS data_quality_flags_entity_type_idx ON data_quality_flags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS data_quality_flags_flag_type_idx ON data_quality_flags(flag_type);
CREATE INDEX IF NOT EXISTS data_quality_flags_severity_idx ON data_quality_flags(severity);
CREATE INDEX IF NOT EXISTS data_quality_flags_resolved_idx ON data_quality_flags(resolved);
CREATE INDEX IF NOT EXISTS manufacturer_profiles_manufacturer_id_idx ON manufacturer_profiles(manufacturer_id);

