-- Create manufacturer_master table
CREATE TABLE IF NOT EXISTS "manufacturer_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    country TEXT,
    website_url TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS manufacturer_master_normalized_name_idx ON "manufacturer_master" (normalized_name);
CREATE INDEX IF NOT EXISTS manufacturer_master_approval_status_idx ON "manufacturer_master" (approval_status);

-- Create ingredient_master table
CREATE TABLE IF NOT EXISTS "ingredient_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    who_matched BOOLEAN,
    who_code TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ingredient_master_normalized_name_idx ON "ingredient_master" (normalized_name);
CREATE INDEX IF NOT EXISTS ingredient_master_approval_status_idx ON "ingredient_master" (approval_status);

-- Create applicant_master table
CREATE TABLE IF NOT EXISTS "applicant_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    country TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS applicant_master_normalized_name_idx ON "applicant_master" (normalized_name);
CREATE INDEX IF NOT EXISTS applicant_master_approval_status_idx ON "applicant_master" (approval_status);

-- Create dosage_form_master table
CREATE TABLE IF NOT EXISTS "dosage_form_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS dosage_form_master_normalized_name_idx ON "dosage_form_master" (normalized_name);
CREATE INDEX IF NOT EXISTS dosage_form_master_approval_status_idx ON "dosage_form_master" (approval_status);

-- Create strength_master table
CREATE TABLE IF NOT EXISTS "strength_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT,
    unit TEXT,
    normalized_value TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS strength_master_normalized_value_idx ON "strength_master" (normalized_value);
CREATE INDEX IF NOT EXISTS strength_master_approval_status_idx ON "strength_master" (approval_status);

-- Create pack_master table
CREATE TABLE IF NOT EXISTS "pack_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_count INTEGER,
    unit_type TEXT,
    volume_ml TEXT,
    weight_g TEXT,
    container_count INTEGER,
    normalized_pack_label TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS pack_master_normalized_pack_label_idx ON "pack_master" (normalized_pack_label);
CREATE INDEX IF NOT EXISTS pack_master_approval_status_idx ON "pack_master" (approval_status);

-- Create route_master table
CREATE TABLE IF NOT EXISTS "route_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS route_master_normalized_name_idx ON "route_master" (normalized_name);
CREATE INDEX IF NOT EXISTS route_master_approval_status_idx ON "route_master" (approval_status);

-- Create atc_master table
CREATE TABLE IF NOT EXISTS "atc_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT,
    level INTEGER,
    parent_code TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS atc_master_code_idx ON "atc_master" (code);
CREATE INDEX IF NOT EXISTS atc_master_approval_status_idx ON "atc_master" (approval_status);

-- Create therapeutic_category_master table
CREATE TABLE IF NOT EXISTS "therapeutic_category_master" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER,
    status TEXT DEFAULT 'PENDING_REVIEW',
    confidence_score DECIMAL(5,4),
    source_type TEXT,
    source_url TEXT,
    raw_html JSONB,
    normalized_json JSONB,
    validation_status TEXT,
    approval_status TEXT DEFAULT 'PENDING',
    linked_registrations INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS therapeutic_category_master_code_idx ON "therapeutic_category_master" (code);
CREATE INDEX IF NOT EXISTS therapeutic_category_master_approval_status_idx ON "therapeutic_category_master" (approval_status);