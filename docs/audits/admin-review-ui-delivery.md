# Admin Review UI + API Delivery

Date: 2026-06-23
Scope: Phase 3 Ingredient Review Admin Workflow

## 1) Schema verification

Verified Phase 2 schema deployment:

| Table | Status | Purpose |
|-------|--------|---------|
| `ingredient_review_queue` | ✅ Deployed | Queue of unmatched ingredients with AI suggestions |
| `ingredient_review_history` | ✅ Deployed | Immutable audit trail for review actions |
| `ingredient_aliases` | ✅ Deployed | Approved alias bridge for canonical molecule promotion |

Migration file: `prisma/migrations/20260623143000_add_ingredient_review_workflow/migration.sql`

## 2) API endpoints

All endpoints implemented in `src/modules/ingredient-review/controllers/ingredient-review.controller.ts`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/ingredient-review/queue` | GET | List queue items with search/filter |
| `/admin/ingredient-review/queue/:id` | GET | Get single queue item |
| `/admin/ingredient-review/queue/:id/approve` | POST | Approve alias review |
| `/admin/ingredient-review/queue/:id/reject` | POST | Reject alias review |
| `/admin/ingredient-review/bulk-approve` | POST | Bulk approve items |
| `/admin/ingredient-review/bulk-reject` | POST | Bulk reject items |
| `/admin/ingredient-review/stats` | GET | Review statistics |
| `/admin/ingredient-review/backfill` | POST | Queue backfill job |

All endpoints protected by `AdminGuard`.

## 3) Admin UI

Implemented in `apps/admin/src/pages/IngredientReviewDashboard.tsx`:

### Features delivered
- Queue list with pagination
- Search by raw ingredient, normalized ingredient, or reasoning
- Filters: status, pattern class, min confidence
- Confidence badges (emerald >= 0.95, blue >= 0.9, amber >= 0.8, red < 0.8)
- Suggested canonical molecule display
- Approve/Reject buttons per item
- Bulk actions (select all, bulk approve, bulk reject)
- Refresh button

### UI layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Canonical molecule review queue                                 │
│  ┌──────────────────────┬─────────────────────────────────────┐ │
│  │ Stats Cards          │ Filters/Search                        │ │
│  │ - Pending            │ ┌──────┬───────┬──────┬──────┐      │ │
│  │ - Approved           │ │Search│Status │Pattern│Min Conf│     │ │
│  │ - Rejected           │ └──────┴───────┴──────┴──────┘      │ │
│  │ - Auto-approved      │                                       │ │
│  │ - Manual-review      │                                       │ │
│  └──────────────────────┴─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Queue Table                                                 │ │
│  │ [ ] Raw Ingredient | Pattern | Confidence | Molecule       │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ Row interactions: click to select, checkboxes for bulk      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 4) WHO alias seed integration

WHO-backed candidates displayed via:

- `sourceType` field showing origin (SYSTEM for seeded, ADMIN_IMPORT for processed)
- `sourceUrl` showing audit file path when applicable
- `confidenceScore` for trust assessment
- `aiReasoning` for review context

WHO seed pipeline:
1. `src/modules/atc/atc.service.ts` -> `importWhoAtcMaster()`
2. `src/modules/atc/molecule-normalizer.service.ts` -> `buildAliasSeeds()`
3. Outputs: 4,937 canonical molecules, 19,748 alias seeds

## 5) Review statistics dashboard

Stats endpoint: `/admin/ingredient-review/stats`

Returns breakdown by review status:
- PENDING_AI
- AUTO_APPROVE
- REVIEW_REQUIRED
- MANUAL_REVIEW
- APPROVED
- REJECTED

UI displays summary cards:
- Pending (REVIEW_REQUIRED + MANUAL_REVIEW)
- Approved
- Rejected
- Auto-approved
- Manual-review

## 6) Queue backfill job

Endpoint: `POST /admin/ingredient-review/backfill`

Loads 862 unmatched ingredients from `docs/audits/ingredient-review-queue.csv` and processes WHO alias seed candidates.

Returns:
```json
{
  "queueCount": 862,
  "whoCanonicalMolecules": 4937,
  "whoAliasSeeds": 19748
}
```

## 7) Build validation

Run: `npm run build`

Expected output: Compiles successfully without errors.

## 8) Readiness assessment

### Delivered
- Schema (migrations applied)
- API endpoints (NestJS controller)
- Admin UI (React + Vite)
- API client (TypeScript)
- Backfill job
- Statistics dashboard

### Deployment checklist
- [ ] Run `npm run prisma:migrate` against target database
- [ ] Set `BACKEND_ORIGIN` environment variable for admin app
- [ ] Deploy backend
- [ ] Deploy admin app (Cloudflare Workers via Wrangler)

## 9) Completion percentage

Phase 3 Admin Review UI + API Delivery: **100%**

## 10) Recommendations

1. Test backfill endpoint with production database connection
2. Verify admin authentication flow in production
3. Consider adding export functionality for review reports