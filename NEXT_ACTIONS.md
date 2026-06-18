# Next Actions

## Current Task

P43F Production Database Verification completed

## Completed

- `GET /api/admin/mirror-status` implemented
- `/admin/mirror-status` admin page implemented
- 10-second auto-refresh implemented
- Worker metadata and mirror run IDs persisted for aggregation
- Admin account created for monitoring access
- Live Railway endpoint verified
- Latest live production mirror snapshot captured
- Token refresh implemented in API client
- Prisma format passed
- Prisma generate passed
- Backend build passed
- Backend tests passed
- Current production target confirmed at `150,000`
- Active mirror run ID confirmed as `dc30a1d4-bb6b-4bff-a967-047a45dfcb7a`

## Next

1. Continue monitoring the active DRAP mirror run until completion
2. Do not start a new crawl
3. Re-audit the mirror status once `completed_at` is available
4. Keep the admin mirror dashboard aligned with production

## Exact Next Prompt

Project: DawaiSaver.pk

Task: P43G DRAP Mirror Completion Audit

Mode: AGENT

Protected Scope Protocol active.

No breaking changes.
No schema changes.
Preserve existing APIs.
Preserve existing matching logic.
Preserve WHO normalization.
Preserve composition generation.

Goal:

Wait for the active production DRAP mirror run to complete, then produce a final verified audit from the live monitor.

Required Work:

1. Poll the live admin mirror status until `completed_at` is present
2. Capture final `processed_count`, `success_count`, `failed_count`, `retries`, `duplicates`, `archive_uploads`, and `throughput`
3. Verify final checkpoint integrity, archive integrity, and R2 integrity
4. Confirm the final DRAP coverage estimate
5. Compare the final run against the current P43F verified snapshot
6. Update `CURRENT_UPDATE.md`, `AI_CODE_AUDIT_REPORT.md`, `AI_IMPLEMENTATION_INDEX.md`, `NEXT_ACTIONS.md`
7. Run build/tests
8. Commit and push if documentation changes are made

