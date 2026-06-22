# CURRENT UPDATE

Date: 2026-06-22 22:45 PKT
Project: DawaiSaver.pk
Update: DRAP Acquisition Recovery Implementation - ROOT CAUSE IDENTIFIED

## 1. Root Cause Analysis (IDENTIFIED)

### Problem
Resume Mirror button fails with: "Cannot read properties of undefined (reading 'message')"

### Root Cause
The backend `/admin/mirror/resume` endpoint returns `{ success: boolean; message: string }` directly, without wrapping in a `{ success, data }` envelope. The frontend `api-client.ts` was checking `isEnvelope(payload)` which returned true for `{ success, message }`, then trying to access `payload.data` which was undefined.

### Fix Applied
Modified `api-client.ts` to check for `data` property existence before unwrapping:
```typescript
if (isEnvelope(payload) && "data" in payload) {
  return payload.data as T;
}
return payload as T;
```

---

## 2. Deployment Steps

### Coolify Deployment
1. Navigate to Coolify dashboard → DawaiSaver.pk application
2. Click "Restart" to deploy commit `8c66231`
3. Wait for health check to pass
4. Click "Resume Mirror" in dashboard
5. Verify status changes: `INTERRUPTED` → `RUNNING`
6. Verify checkpoints advance beyond `085249`

---

## 3. Expected Production Verification

After deployment:

- [ ] A. Resume click returns 200
- [ ] B. Status changes INTERRUPTED → RUNNING  
- [ ] C. New import_batches rows appear OR existing checkpoints advance
- [ ] D. lastRegistrationNumber exceeds 085249
- [ ] E. R2 uploads continue
- [ ] F. No duplicate registrations acquired

---

## 4. Files Changed

| File | Change |
|------|--------|
| `apps/admin/src/services/api-client.ts` | Fixed envelope detection for direct responses |