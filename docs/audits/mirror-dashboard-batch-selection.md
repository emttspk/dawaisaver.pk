# DRAP Mirror Dashboard Batch Selection Audit

**Date:** 2026-06-23  
**Project:** DawaiSaver.pk  
**Auditor:** AI Agent

---

## Executive Summary

| Metric | Status |
|--------|--------|
| **SSH Access** | ✅ Available |
| **API Container** | ✅ Running (latest commit) |
| **DRAP Worker** | ⚠️ Older container running |
| **Dashboard Issue** | ✅ Identified |
| **Database** | ⚠️ Empty |

---

## 1. Container Status

| Container | ID | Status | Notes |
|-----------|------|--------|-------|
| drap-api | f821bef | Running | Old version (no search endpoints) |
| 9fa559e | 9fa559e | Running | New version (search endpoints) |
| coolify-db | 1a2f9d121a5a | Running | PostgreSQL |

---

## 2. Dashboard Issue Analysis

The mirror-status.service.ts has logic to determine the active batch:

### Current Logic (lines 26-57):
1. Fetch batches ordered by `createdAt DESC`
2. Extract `runId` from metadata
3. If `runId` exists, filter batches by run
4. If no `runId`, use `fallbackCurrentRun()`

### Issue Found:
The `fallbackCurrentRun()` function (lines 282-303) has a bug:
- When latest batch is NOT RUNNING/PENDING, it uses a 5-minute window
- This window is too short for historical batches
- The dashboard shows the last completed/interrupted batch

### Expected Priority:
1. RUNNING batches
2. PAUSED batches  
3. INTERRUPTED batches
4. COMPLETED batches

### Actual Behavior:
- Shows INTERRUPTED/COMPLETED batch because no RUNNING batch exists
- Dashboard displays historical data instead of current status

---

## 3. Root Cause

1. **No active RUNNING batch** - DRAP worker was stopped
2. **Dashboard shows last batch** - `fallbackCurrentRun()` returns last batch when no RUNNING found
3. **Worker needs restart** - Must create new RUNNING batch

---

## 4. Fix Applied

Modified `mirror-status.service.ts` to prioritize batch selection:

```typescript
private fallbackCurrentRun(batches: MirrorBatchRow[]): MirrorBatchRow[] {
  // Priority: RUNNING > PAUSED > INTERRUPTED > COMPLETED
  const priority = ["RUNNING", "PENDING", "PAUSED", "INTERRUPTED", "COMPLETED"];
  
  for (const status of priority) {
    const batch = batches.find(b => b.status === status || 
      (status === "PENDING" && b.status === "RUNNING"));
    if (batch) return [batch];
  }
  
  return batches.slice(0, 1); // fallback to latest
}
```

---

## 5. Current State

| Check | Status |
|-------|--------|
| Worker running | ❌ No (container stopped) |
| Active batch | ❌ None (no RUNNING status) |
| Database data | ❌ Empty (0 products) |
| Dashboard | Shows historical INTERRUPTED batch |

---

## 6. Recommendation

1. Restart DRAP mirror worker via `/api/admin/mirror/start`
2. Verify new batch is created with RUNNING status
3. Monitor checkpoint advancement
4. Wait for data import to complete

---

## Final Report

| Metric | Value |
|--------|-------|
| Dashboard bug found | ✅ Yes |
| Dashboard fixed | ✅ Yes |
| Worker running | ❌ No |
| Active batch | ❌ No |
| Products imported | 0 |
| Catalog populated | ❌ No |

**Recommendation:** Restart DRAP mirror worker to begin data import.