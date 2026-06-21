-- Fix script to set the correct mirror runtime state and identify active batch
-- Run this against the DawaiSaver.pk PostgreSQL database

-- 1. Check current mirror_runtime_control state
SELECT * FROM mirror_runtime_control;

-- 2. Set the control state to 'running' for production
INSERT INTO mirror_runtime_control (key, state, created_at, updated_at)
VALUES ('drap_mirror:control', 'running', NOW(), NOW())
ON CONFLICT (key) 
DO UPDATE SET state = 'running', updated_at = NOW();

-- 3. List all drap-mirror batches with their metadata
SELECT 
  id,
  status,
  total_rows,
  created_at,
  metadata->'acquisition'->>'mirrorRunId' as mirror_run_id,
  metadata->'acquisition'->'checkpoint' as checkpoint
FROM import_batches 
WHERE adapter_type = 'drap-mirror'
ORDER BY created_at DESC;

-- 4. Count items in each batch
SELECT 
  b.id as batch_id,
  b.status,
  COUNT(i.id) as item_count
FROM import_batches b
LEFT JOIN import_batch_items i ON i.import_batch_id = b.id
WHERE b.adapter_type = 'drap-mirror'
GROUP BY b.id, b.status
ORDER BY b.created_at DESC;