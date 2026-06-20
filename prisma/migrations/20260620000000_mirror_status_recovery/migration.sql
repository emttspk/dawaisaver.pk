-- Recovery migration for medicine master data structure
-- This migration is safe to run multiple times (uses IF NOT EXISTS)
-- If production already has the schema, this will be a no-op

DO $$ 
BEGIN
    -- therapeutic_categories
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'therapeutic_categories') THEN
        CREATE TABLE therapeutic_categories (
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
        CREATE INDEX therapeutic_categories_code_idx ON therapeutic_categories(code);
        CREATE INDEX therapeutic_categories_status_idx ON therapeutic_categories(status);
    END IF;

    -- atc_classifications
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'atc_classifications') THEN
        CREATE TABLE atc_classifications (
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
        CREATE INDEX atc_classifications_code_idx ON atc_classifications(code);
        CREATE INDEX atc_classifications_therapeutic_category_id_idx ON atc_classifications(therapeutic_category_id);
    END IF;

    -- composition_groups
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'composition_groups') THEN
        CREATE TABLE composition_groups (
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
        CREATE INDEX composition_groups_signature_idx ON composition_groups(signature);
        CREATE INDEX composition_groups_molecules_hash_idx ON composition_groups(molecules_hash);
    END IF;

    -- composition_group_compositions
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'composition_group_compositions') THEN
        CREATE TABLE composition_group_compositions (
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
        CREATE INDEX composition_group_compositions_composition_group_id_idx ON composition_group_compositions(composition_group_id);
        CREATE INDEX composition_group_compositions_generic_id_idx ON composition_group_compositions(generic_id);
    END IF;

    -- product_packs
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_packs') THEN
        CREATE TABLE product_packs (
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
        CREATE INDEX product_packs_product_id_idx ON product_packs(product_id);
        CREATE INDEX product_packs_status_idx ON product_packs(status);
    END IF;

    -- product_pack_prices
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_pack_prices') THEN
        CREATE TABLE product_pack_prices (
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
        CREATE INDEX product_pack_prices_product_pack_id_idx ON product_pack_prices(product_pack_id, observed_at);
        CREATE INDEX product_pack_prices_city_idx ON product_pack_prices(city);
    END IF;

    -- data_sources
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'data_sources') THEN
        CREATE TABLE data_sources (
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
        CREATE INDEX data_sources_source_type_idx ON data_sources(source_type);
        CREATE INDEX data_sources_trust_level_idx ON data_sources(trust_level);
    END IF;

    -- user_reports
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_reports') THEN
        CREATE TABLE user_reports (
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
        CREATE INDEX user_reports_entity_type_idx ON user_reports(entity_type, entity_id);
        CREATE INDEX user_reports_report_type_idx ON user_reports(report_type);
        CREATE INDEX user_reports_status_idx ON user_reports(status);
    END IF;

    -- data_quality_flags
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'data_quality_flags') THEN
        CREATE TABLE data_quality_flags (
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
        CREATE INDEX data_quality_flags_entity_type_idx ON data_quality_flags(entity_type, entity_id);
        CREATE INDEX data_quality_flags_flag_type_idx ON data_quality_flags(flag_type);
        CREATE INDEX data_quality_flags_severity_idx ON data_quality_flags(severity);
        CREATE INDEX data_quality_flags_resolved_idx ON data_quality_flags(resolved);
    END IF;

    -- generic_atc_classifications
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generic_atc_classifications') THEN
        CREATE TABLE generic_atc_classifications (
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
    END IF;

    -- product_therapeutic_categories
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_therapeutic_categories') THEN
        CREATE TABLE product_therapeutic_categories (
            product_id UUID NOT NULL REFERENCES products(id),
            category_id UUID NOT NULL REFERENCES therapeutic_categories(id),
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
    END IF;

    -- manufacturer_profiles
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'manufacturer_profiles') THEN
        CREATE TABLE manufacturer_profiles (
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
        CREATE INDEX manufacturer_profiles_manufacturer_id_idx ON manufacturer_profiles(manufacturer_id);
    END IF;
END $$;
