-- Master Table Verification Report
-- Generated: 2026-06-25
-- Database: postgresql://postgres:postgres@localhost:5433/dawaisaver?schema=public

-- Count all master tables
SELECT 
  (SELECT COUNT(*) FROM manufacturer_master WHERE deleted_at IS NULL) as manufacturer_master,
  (SELECT COUNT(*) FROM ingredient_master WHERE deleted_at IS NULL) as ingredient_master,
  (SELECT COUNT(*) FROM applicant_master WHERE deleted_at IS NULL) as applicant_master,
  (SELECT COUNT(*) FROM dosage_form_master WHERE deleted_at IS NULL) as dosage_form_master,
  (SELECT COUNT(*) FROM strength_master WHERE deleted_at IS NULL) as strength_master,
  (SELECT COUNT(*) FROM pack_master WHERE deleted_at IS NULL) as pack_master,
  (SELECT COUNT(*) FROM route_master WHERE deleted_at IS NULL) as route_master,
  (SELECT COUNT(*) FROM atc_master WHERE deleted_at IS NULL) as atc_master,
  (SELECT COUNT(*) FROM therapeutic_category_master WHERE deleted_at IS NULL) as therapeutic_category_master;

-- Count generics and manufacturers (non-master tables)
SELECT 
  (SELECT COUNT(*) FROM generics WHERE deleted_at IS NULL) as generics,
  (SELECT COUNT(*) FROM manufacturer WHERE deleted_at IS NULL) as manufacturers;

-- Check for missing fields in normalized_data
SELECT 
  COUNT(*) as total_saved,
  COUNT(*) FILTER (WHERE normalized_data IS NULL OR normalized_data = '{}') as missing_normalized_data,
  COUNT(*) FILTER (WHERE (normalized_data->>'medicineSignature') IS NULL) as missing_signature,
  COUNT(*) FILTER (WHERE (normalized_data->>'routeOfAdmin') IS NULL) as missing_route,
  COUNT(*) FILTER (WHERE (normalized_data->>'atcCode') IS NULL) as missing_atc,
  COUNT(*) FILTER (WHERE (normalized_data->>'applicant') IS NULL) as missing_applicant,
  COUNT(*) FILTER (WHERE (normalized_data->>'therapeuticCategory') IS NULL) as missing_therapeutic_category
FROM import_batch_items 
WHERE status = 'SAVED' AND deleted_at IS NULL;