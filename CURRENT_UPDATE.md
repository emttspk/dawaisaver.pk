# CURRENT UPDATE

Date: 2026-06-23
Project: DawaiSaver.pk
Update: DRAP worker launcher stale-batch gate fix

## Production Verification

### Active worker PIDs

- None found.
- `pgrep`/`ps` showed only the API container's own `node dist/main.js` processes and no live `drap` worker process.

### Database snapshots, 60 seconds apart

First snapshot:
- `import_batch_items` count: `427924`
- latest running batch: `c26982ac-534d-4a9c-b7b3-4b487be5a9e1`
- checkpoint: `processed=1050`, `nextIndex=1050`, `lastRegistrationNumber=092399`

Second snapshot, 60 seconds later:
- `import_batch_items` count: `427924`
- latest running batch: `c26982ac-534d-4a9c-b7b3-4b487be5a9e1`
- checkpoint: `processed=1050`, `nextIndex=1050`, `lastRegistrationNumber=092399`

### Control state

- `mirror_runtime_control` row: `drap_mirror:control = running`
- `updated_at = 2026-06-22 21:05:58.138 UTC`

### Running batch set

- `8` DRAP batches are marked `RUNNING`
- newest running batches have `workerCount=4`
- none of the running rows include a `lastActivityAt` heartbeat
- the newest running batch heartbeat stayed frozen for the full 60-second comparison window

## Root Cause

The launcher was using `import_batches.status = RUNNING` plus a 30-minute `updatedAt` freshness check as proof that a worker was alive.

In production, that produced a false positive:
- the DB still contained `RUNNING` batches
- no worker process existed on the host
- the start/control path therefore treated the run as already active and did not launch a replacement worker

So the verified failure is:
- workers are not running
- acquisition is not advancing
- the dashboard is stale because it is reading stale `RUNNING` rows as live progress

Exact state: `D. Dashboard stale`

## Fix Applied

Updated `src/modules/drap/drap-mirror-worker-launcher.service.ts` so the launcher now:
- treats a batch as stale after 5 minutes instead of 30
- prefers `metadata.acquisition.lastActivityAt` when present
- logs when it is replacing a stale batch instead of silently assuming a worker is alive

Added `src/modules/drap/testing/drap-mirror-worker-launcher.service.test.ts` to lock in:
- fresh batch => no duplicate spawn
- stale batch => spawn replacement worker
- heartbeat present => treated as live

## Validation

- Targeted launcher test passed
- Full build passed

## Acquisition Status

**NO** - acquisition is not actively advancing in production yet.

## Notes

- The production `running` control row was updated at `2026-06-22 21:05:58.138 UTC`, but it did not correspond to a live worker process.
- The prior launcher behavior was too optimistic about `RUNNING` rows and did not verify actual process liveness.
