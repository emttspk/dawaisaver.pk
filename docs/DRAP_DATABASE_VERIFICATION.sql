-- DRAP Mirror Database Verification Queries
-- Run these against the DawaiSaver.pk PostgreSQL database

-- 1. Total products (imported from DRAP)
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN source_type IN ('DRAP', 'DRAP_UPDATE') THEN 1 END) as drap_products
FROM products 
WHERE deleted_at IS NULL;

-- 2. Total registrations in mirror items
SELECT COUNT(*) as total_mirror_items FROM import_batch_items;

-- 3. Total unique DRAP registrations
SELECT 
  COUNT(DISTINCT raw_data->>'registrationNumber') as unique_registrations
FROM import_batch_items 
WHERE raw_data->>'registrationNumber' IS NOT NULL 
  AND import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type = 'drap-mirror');

-- 4. Min/Max registration numbers
SELECT 
  MIN((raw_data->>'registrationNumber')::integer) as min_registration,
  MAX((raw_data->>'registrationNumber')::integer) as max_registration
FROM import_batch_items 
WHERE raw_data->>'registrationNumber' IS NOT NULL 
  AND (raw_data->>'registrationNumber') ~ '^[0-9]+$'
  AND import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type = 'drap-mirror');

-- 5. Duplicate registrations
WITH reg_counts AS (
  SELECT raw_data->>'registrationNumber' as reg, COUNT(*) as cnt
  FROM import_batch_items
  WHERE raw_data->>'registrationNumber' IS NOT NULL
  AND import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type = 'drap-mirror')
  GROUP BY raw_data->>'registrationNumber'
)
SELECT COUNT(*) as duplicate_registrations
FROM reg_counts
WHERE cnt > 1;

-- 6. Failed registrations
SELECT 
  COUNT(*) as failed_registrations,
  COUNT(DISTINCT raw_data->>'registrationNumber') as failed_unique
FROM import_batch_items
WHERE status = 'FAILED'
AND import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type = 'drap-mirror');

-- 7. Archive coverage
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN raw_data->>'archiveKey' IS NOT NULL THEN 1 END) as archived_items,
  COUNT(CASE WHEN raw_data->>'r2Key' IS NOT NULL THEN 1 END) as r2_uploaded_items,
  ROUND(
    COUNT(CASE WHEN raw_data->>'archiveKey' IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2
  ) as archive_coverage_pct
FROM import_batch_items
WHERE import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type = 'drap-mirror');

-- 8. Breakdown by status
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as pct
FROM import_batch_items
WHERE import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type = 'drap-mirror')
GROUP BY status
ORDER BY count DESC;

-- 9. Mirror run summary
SELECT 
  b.id as batch_id,
  b.status,
  b.total_rows,
  b.created_at,
  m.acquisition->>'mirrorRunId' as run_id,
  m.acquisition->'checkpoint' as checkpoint
FROM import_batches b
LEFT JOIN LATERAL (
  SELECT metadata as acquisition 
  FROM import_batches b2 
  WHERE b2.id = b.id
) m ON true
WHERE b.adapter_type = 'drap-mirror'
ORDER BY b.created_at DESC;

-- 10. Total DRAP coverage estimate
SELECT 
  COUNT(DISTINCT raw_data->>'registrationNumber') as downloaded_registrations,
  MAX((raw_data->>'registrationNumber')::integer) as max_registration,
  MIN((raw_data->>'registrationNumber')::integer) as min_registration,
  MAX((raw_data->>'registrationNumber')::integer) - MIN((raw_data->>'registrationNumber')::integer) + 1 as estimated_total_range,
  ROUND(
    COUNT(DISTINCT raw_data->>'registrationNumber') * 100.0 / 
    NULLIF(MAX((raw_data->>'registrationNumber')::integer) - MIN((raw_data->>'registrationNumber')::integer) + 1, 0),
    2
  ) as coverage_pct
FROM import_batch_items
WHERE raw_data->>'registrationNumber' IS NOT NULL 
  AND (raw_data->>'registrationNumber') ~ '^[0-9]+$'
  AND import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type = 'drap-mirror');