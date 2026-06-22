# CURRENT UPDATE

Date: 2026-06-22
Project: DawaiSaver.pk
Update: Mirror Status Dashboard - Stale Metrics Fix

## Update Status: COMPLETED

## Problem

The Mirror Status dashboard was displaying stale metrics:
- UI showed: Processed: 47,550, Success: 45,178, Failed: 2,372
- Database contains: SAVED: 372,149, FAILED: 25,919

## Root Cause

The `getMirrorStatus()` method in `mirror-status.service.ts` was calculating metrics from batch checkpoints (metadata/importReport), which were stale. The `fallbackCurrentRun()` method excluded PENDING batches older than 5 minutes from the latest batch, causing most batches to be filtered out.

## Solution

Modified `src/modules/drap/mirror-status.service.ts` to query actual totals from `import_batch_items` table via Prisma groupBy:

```typescript
private async getCurrentBatchItemTotals(): Promise<{
  processedCount: number;
  successCount: number;
  failedCount: number;
}> {
  const counts = await this.prisma.importBatchItem.groupBy({
    by: ["status"],
    where: {
      importBatch: {
        adapterType: "drap-mirror",
      },
    },
    _count: {
      status: true,
    },
  });

  const processedCount = counts.reduce((sum, c) => sum + Number(c._count.status), 0);
  const successCount = counts.find((c) => c.status === "SAVED")?._count.status ?? 0;
  const failedCount = counts.find((c) => c.status === "FAILED")?._count.status ?? 0;

  return { processedCount, successCount, failedCount };
}
```

## Changes Made

| File | Change |
|------|--------|
| `src/modules/drap/mirror-status.service.ts` | Added `getCurrentBatchItemTotals()` method; updated `getMirrorStatus()` to use actual database counts |

## Build & Deployment

- Build: **PASS** (`npm run build` completed successfully)
- Deploy: Use Coolify deployment process
- Production verification: Check dashboard cards after deployment

## Expected Results

After deployment, the dashboard should display:
- Processed: 398,068 (372,149 + 25,919)
- Success: 372,149
- Failed: 25,919

## Files

- `src/modules/drap/mirror-status.service.ts` - Updated
- `docs/archive/CURRENT_UPDATE-2026-06-22.md` - Archived previous investigation