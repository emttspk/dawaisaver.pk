# Current Update - P43F Production Database Verification

## Date

2026-06-18

## Status

P43F verified from production mirror data

## Verification Summary

Railway CLI authentication was blocked in this shell session, so the direct `railway run` PostgreSQL query could not be executed here. The live production mirror status API was successfully authenticated and used as the production-backed source of truth for the active mirror run.

## Verified Live Snapshot

- Active run ID: `dc30a1d4-bb6b-4bff-a967-047a45dfcb7a`
- Status: `RUNNING`
- Started at: `2026-06-18T10:59:10.681Z`
- Total rows: `150000`
- Processed rows: `59600`
- Success rows: `55551`
- Failed rows: `4049`
- Retries: `0`
- Duplicates: `0`
- Worker count: `12`
- Last registration seen: `053849`
- Highest last registration in batch snapshots: `091349`
- Archive uploads: `56`
- Throughput: `7.57` registrations/sec
- ETA: `2026-06-18T14:17:06.888Z`
- Checkpoint integrity: `healthy`
- Archive integrity: `healthy`
- R2 integrity: `healthy`

## Batch Snapshot Breakdown

- Running batches: `8`
- Completed batches: `0`
- Completed with errors batches: `4`
- Distinct mirror run IDs surfaced in batch metadata: `1`

## Target Determination

The verified actual target is `150,000` registrations.

This rules out the earlier `50,000` default and the speculative `250,000` target for the current active run.

## Recommendation

Continue the current crawl.

The run is active, healthy, and still materially below completion. Do not start a new crawl or restart the mirror.

## Notes

- The top-level `run_id` field from the live mirror status response was null in this snapshot because the monitor fell back to time-window aggregation.
- The batch metadata still shows one distinct `mirror_run_id`, which is sufficient to identify the active run.
- No schema changes were required.

