SELECT id, status, started_at, finished_at, created_at 
FROM import_batches 
WHERE adapter_type='drap-mirror' 
ORDER BY created_at DESC 
LIMIT 10;