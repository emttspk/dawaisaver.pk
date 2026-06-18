# AI Code Audit Report

## Date

2026-06-18

## Phase

P43F Production Database Verification

## Scope

Audit of the live DRAP mirror monitoring layer, production-backed mirror status response, and target verification.

## Findings

| Area | Result | Evidence |
|------|--------|----------|
| Live mirror snapshot | Pass | Authenticated production API returned a `RUNNING` DRAP mirror payload |
| Active run identification | Pass | Batch metadata shows `mirror_run_id = dc30a1d4-bb6b-4bff-a967-047a45dfcb7a` |
| Target verification | Pass | Aggregated `total_rows = 150000` |
| Multiple run evidence | Pass | Only one distinct `mirror_run_id` surfaced in the active batch set |
| Checkpoint integrity | Pass | Response reported `healthy` |
| Archive integrity | Pass | Response reported `healthy` |
| R2 integrity | Pass | Response reported `healthy` |
| Railway CLI database query | Blocked | `railway.cmd` rejected the available tokens in this shell session |

## Verified Snapshot

- Status: `RUNNING`
- Started at: `2026-06-18T10:59:10.681Z`
- Processed rows: `59600`
- Success rows: `55551`
- Failed rows: `4049`
- Retries: `0`
- Duplicates: `0`
- Worker count: `12`
- Last registration seen in the active aggregate: `053849`
- Highest last registration observed in batch snapshots: `091349`
- Archive uploads: `56`
- Throughput: `7.57` registrations/sec
- ETA: `2026-06-18T14:17:06.888Z`

## Run Shape

The live response contained:

- `8` running batch snapshots
- `4` completed-with-errors batch snapshots
- `0` fully completed mirror runs

This indicates the current crawl is still active and the monitor is aggregating a single live mirror run.

## Interpretation

- The verified target is `150,000` registrations.
- The earlier `50,000` default is not the active production target.
- The speculative `250,000` target is not supported by the live production snapshot.
- The monitor aggregation appears correct for the active run, although the top-level `run_id` field was null in this specific payload because the service fell back to the active time window.

## Audit Conclusion

Continue the current crawl.

No restart is warranted from the data verified here, and there is no evidence of duplicate active mirror runs in the production snapshot.

