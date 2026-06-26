-- Create DrapWebProduct table
CREATE TABLE IF NOT EXISTS "drap_web_products" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "registration_number" TEXT NOT NULL UNIQUE,
    "tracking_id" TEXT,
    "brand_name" TEXT NOT NULL,
    "normalized_brand_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "normalized_generic_name" TEXT,
    "dosage_form" TEXT,
    "normalized_dosage_form" TEXT,
    "route_of_administration" TEXT,
    "pack_size" TEXT,
    "pack_size_description" TEXT,
    "registration_date" TIMESTAMP,
    "meeting_number" TEXT,
    "product_category" TEXT,
    "used_for" TEXT,
    "manufacturing_type" TEXT,
    "shelf_life" TEXT,
    "shelf_life_unit" TEXT,
    "storage_condition" TEXT,
    "approved_price" DECIMAL(12, 2),
    "pricing_type" TEXT,
    "label_claim" TEXT,
    "active_ingredient" TEXT,
    "composition" TEXT,
    "indications" TEXT,
    "contraindications" TEXT,
    "side_effects" TEXT,
    "precautions" TEXT,
    "warnings" TEXT,
    "drug_interactions" TEXT,
    "therapeutic_category" TEXT,
    "atc_code" TEXT,
    "atc_code_description" TEXT,
    "source_status" TEXT,
    "source_verification_status" TEXT,
    "status" TEXT DEFAULT 'PENDING_REVIEW',
    "confidence_score" DECIMAL(5, 4),
    "raw_html" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "product_id" UUID,
    "manufacturer_id" UUID,
    "import_batch_item_id" UUID,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "drap_web_products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "drap_web_products_import_batch_item_id_fkey" FOREIGN KEY ("import_batch_item_id") REFERENCES "import_batch_items"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_products_registration_number_idx" ON "drap_web_products" ("registration_number");
CREATE INDEX IF NOT EXISTS "drap_web_products_brand_name_idx" ON "drap_web_products" ("brand_name");
CREATE INDEX IF NOT EXISTS "drap_web_products_generic_name_idx" ON "drap_web_products" ("generic_name");
CREATE INDEX IF NOT EXISTS "drap_web_products_manufacturing_type_idx" ON "drap_web_products" ("manufacturing_type");
CREATE INDEX IF NOT EXISTS "drap_web_products_product_category_idx" ON "drap_web_products" ("product_category");
CREATE INDEX IF NOT EXISTS "drap_web_products_status_idx" ON "drap_web_products" ("status");

-- Create DrapWebUpdateHistory table
CREATE TABLE IF NOT EXISTS "drap_web_update_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "product_id" UUID NOT NULL,
    "update_number" TEXT,
    "update_date" TIMESTAMP,
    "update_type" TEXT,
    "remarks" TEXT,
    "raw_html" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_update_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "drap_web_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_update_history_product_id_idx" ON "drap_web_update_history" ("product_id");
CREATE INDEX IF NOT EXISTS "drap_web_update_history_update_date_idx" ON "drap_web_update_history" ("update_date");

-- Create DrapWebVariationHistory table
CREATE TABLE IF NOT EXISTS "drap_web_variation_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "product_id" UUID NOT NULL,
    "variation_number" TEXT,
    "filed_date" TIMESTAMP,
    "effective_date" TIMESTAMP,
    "type" TEXT,
    "description" TEXT,
    "raw_html" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_variation_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "drap_web_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_variation_history_product_id_idx" ON "drap_web_variation_history" ("product_id");

-- Create DrapWebRenewalHistory table
CREATE TABLE IF NOT EXISTS "drap_web_renewal_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "product_id" UUID NOT NULL,
    "renewal_number" TEXT,
    "renewal_date" TIMESTAMP,
    "remarks" TEXT,
    "raw_html" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_renewal_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "drap_web_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_renewal_history_product_id_idx" ON "drap_web_renewal_history" ("product_id");

-- Create DrapWebMeetingRecords table
CREATE TABLE IF NOT EXISTS "drap_web_meeting_records" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "product_id" UUID NOT NULL,
    "meeting_number" TEXT,
    "meeting_date" TIMESTAMP,
    "meeting_type" TEXT,
    "remarks" TEXT,
    "raw_html" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_meeting_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "drap_web_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_meeting_records_product_id_idx" ON "drap_web_meeting_records" ("product_id");

-- Create DrapWebEvaluationRecords table
CREATE TABLE IF NOT EXISTS "drap_web_evaluation_records" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "product_id" UUID NOT NULL,
    "evaluation_number" TEXT,
    "evaluation_date" TIMESTAMP,
    "result" TEXT,
    "remarks" TEXT,
    "raw_html" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_evaluation_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "drap_web_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_evaluation_records_product_id_idx" ON "drap_web_evaluation_records" ("product_id");

-- Create DrapWebImportData table
CREATE TABLE IF NOT EXISTS "drap_web_import_data" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "product_id" UUID NOT NULL,
    "importer_name" TEXT,
    "importer_address" TEXT,
    "import_license" TEXT,
    "country_of_origin" TEXT,
    "customs_broker" TEXT,
    "remarks" TEXT,
    "raw_html" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_import_data_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "drap_web_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_import_data_product_id_idx" ON "drap_web_import_data" ("product_id");

-- Create DrapWebBatchData table
CREATE TABLE IF NOT EXISTS "drap_web_batch_data" (
    "id" UUID PRIMARY KEY DEFAULT uuid(),
    "product_id" UUID NOT NULL,
    "batch_number" TEXT,
    "batch_size" TEXT,
    "manufacturing_date" TEXT,
    "expiry_date" TEXT,
    "remarks" TEXT,
    "raw_html" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "deleted_at" TIMESTAMP,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "deleted_by_id" UUID,
    CONSTRAINT "drap_web_batch_data_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "drap_web_products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "drap_web_batch_data_product_id_idx" ON "drap_web_batch_data" ("product_id");