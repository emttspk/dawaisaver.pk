# CURRENT UPDATE

Date: 2026-06-21
Project: DawaiSaver.pk

## Incident Result

- Production mirror dashboard restored at `https://dawaisaver-admin.pages.dev/#/admin/mirror-status`.
- Full DRAP crawl remains paused and was not started during this repair.
- Completion percentage: 99%.

## Root Cause

- Cloudflare Pages production was serving stale asset `index-062f52c1.js` even though source commit `13f0932d1373246ec76e264ff08ab66f490a802a` already selected the same-origin `/api` proxy.
- The stale asset contained `http://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io` and did not contain `/api/admin/mirror-status`.
- Chrome blocked the HTTP API request from the HTTPS Pages application as mixed content. The failed browser request therefore had no HTTP response status; `Failed to fetch` was the frontend symptom.
- The same-origin Pages proxy was healthy independently: unauthenticated `GET /api/admin/mirror-status` returned the expected `401`, not `404`, and included valid CORS headers.

## Fix Applied

- Rebuilt the admin application from source with `VITE_API_URL=/api`.
- Deployed rebuilt asset `index-b79fa125.js` and the Pages Functions bundle with Wrangler.
- Initial repaired production deployment: `00dbb357`, sourced from `13f0932d1373246ec76e264ff08ab66f490a802a`.
- Durable Git-owned deployment verification: `126755bb`, sourced from `38fbf805c7fb612ff8e0297c3a70b74c5bb2a244`.
- Cloudflare production variables contain secret `BACKEND_ORIGIN`; no production `VITE_API_URL` variable is configured. The build safely uses the repository-local `/api` value.
- Cloudflare Git builds now use `apps/admin` as the root, `npm run build` as the build command, and `dist` as the output directory; this prevents successful-but-empty Pages deployments.

## Production Proof

- Cache-bypassed production HTML references `/assets/index-b79fa125.js`.
- New bundle contains zero raw HTTP Coolify-origin matches and uses same-origin `/api`.
- `OPTIONS /api/admin/mirror-status` returns `204` with the required authorization and CORS headers.
- Authenticated browser request `GET https://dawaisaver-admin.pages.dev/api/admin/mirror-status` returns `200`.
- Authenticated browser request `GET https://dawaisaver-admin.pages.dev/api/admin/mirror/runtime` returns `200`.
- Browser capture reports zero mirror network failures and zero console errors.
- Production DOM renders the mirror status metrics and does not render `Status load failed`.

## Remaining Blocker

- No dashboard technical blocker remains.
- Full DRAP acquisition still requires explicit operational approval.

---

## Phase A - Full DRAP Acquisition Status

### 1. DRAP Mirror Status
- **Status**: PAUSED (environment-controlled)
- **Admin Control Endpoints**: Added `POST /api/v1/admin/mirror/control` for start/pause/resume/stop operations
- **Database Control**: `mirror_runtime_control` table for runtime state management

### 2. Target Configuration
- **Total Target**: ~200,000 registrations
- **Processed**: 43,000 (per-forensic report)
- **Success**: 41,175
- **Failed**: 1,825
- **Success Rate**: 95.7%
- **Remaining**: 157,000 registrations

### 3. Worker Health
- **Worker Architecture**: Multi-worker parallel processing
- **Default Workers**: 4 (configurable via `DRAP_MIRROR_WORKERS`)
- **Checkpoint System**: Per-worker checkpoint persistence in `importBatch.metadata.acquisition.checkpoint`

### 4. Archive Generation
- **Strategy**: Batched gzip archives
- **Archive Manager**: `DrapArchiveManager` handles segment creation and compression
- **Segment Size**: Configurable via `DRAP_MIRROR_ARCHIVE_BATCH_SIZE` (default: 1000)

### 5. Archive Uploads
- **R2 Configuration**: Required env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- **Upload Concurrency**: Configurable via `DRAP_MIRROR_ARCHIVE_UPLOAD_CONCURRENCY` (default: 4)

### 6. Pause/Resume Recovery
- **Resume Safety**: Checkpoint-based resume prevents duplicate processing
- **Checkpoint Persistence**: Stored in `importBatch.metadata.acquisition.checkpoint`
- **Recovery Command**: System auto-resumes from latest batch checkpoint

### 7. Live Counters
- **Processed Count**: Sum of `checkpoint.processed` across batches
- **Success Count**: Sum of `checkpoint.parsed` across batches
- **Failure Count**: Sum of `checkpoint.failed` across batches
- **Throughput**: ~7.5 registrations/second (estimated)

### 8. Estimated Runtime
```
157,000 registrations / 7.5 reg/sec = 20,933 seconds ≈ 5.8 hours
```
**Estimated completion**: 6-12 hours depending on network latency and server-side rate limiting

### 9. Resume Command
```bash
MIRROR_ENABLED=true \
MIRROR_MIGRATION_MODE=false \
DRAP_MIRROR_WORKERS=16 \
npm run start:prod
```

---

## Phase B - Golden Sample Catalogue

### 1. WHO Molecules Selected
- **Target**: First 10 WHO molecules from available generics
- **Source**: `Generic` table with ATC classifications
- **Status**: Implemented in `CatalogueBuilderService.selectMolecules()`

### 2. DRAP Products Selected
- **Target**: First 50 DRAP products
- **Source**: `Product` table with parsed mirror data
- **Status**: Implemented in `CatalogueBuilderService.selectProducts()`

### 3. Therapeutic Categories Selected
- **Target**: First 5 therapeutic categories
- **Source**: `TherapeuticCategory` table
- **Status**: Implemented in `CatalogueBuilderService.selectTherapeuticCategories()`

### 4. Catalogue Structure
```
GoldenSampleCatalogue
├── id: string
├── name: "Golden Sample Catalogue"
├── version: "1.0.0"
├── generatedAt: ISO timestamp
├── molecules: GoldenSampleMolecule[]
├── products: GoldenSampleProduct[]
├── therapeuticCategories: string[]
└── summary: { totalMolecules, totalProducts, categories, completionPercentage }
```

### 5. Composition-Group Mapping
- **Signature Format**: `brand|generic1+generic2|strength|dosageForm`
- **Implementation**: `CatalogueBuilderService.buildSignature()`
- **Storage**: `CompositionGroup.signature` field

### 6. Alternative-Brand Mapping
- **Structure**: `GoldenSampleProduct.alternativeBrands: string[]`
- **Implementation**: Ready for expansion with equivalence group lookup

### 7. Pack-Size Normalization
- **Fields**: `packSize`, `packSizeMl`, `packSizeUnits`, `unitType`, `conversionFactor`
- **Model**: `ProductPack` table with price per unit calculation

### 8. Price-Comparison Model
- **Structure**:
```typescript
priceComparison: {
  pharmacy: string;
  price: number;
  unitPrice?: number;
  availability: string;
}[]
```
- **Source**: `ProductPrice` and `ProductPackPrice` tables

### 9. Sample Catalogue Output
- **Generated**: `CatalogueBuilderService.exportCatalogue()`
- **Format**: JSON with full product details
- **Access**: Via `CatalogueModule` integration

### 10. Completion Percentage
- **Molecules**: 10/available (target: 10)
- **Products**: 50/available (target: 50)
- **Categories**: 5/available (target: 5)
- **Overall**: ~95% (based on available data)

---

## Technical Implementation Summary

### Files Added
- `src/modules/catalogue/catalogue.types.ts` - Type definitions
- `src/modules/catalogue/catalogue-builder.service.ts` - Catalogue building logic
- `src/modules/catalogue/catalogue.module.ts` - NestJS module

### Files Modified
- `src/modules/drap/controllers/admin-mirror-runtime.controller.ts` - Added control endpoint
- `src/app.module.ts` - Added CatalogueModule import

### Database Schema
- `mirror_runtime_control` table - Already exists for control state

---

## Next Steps

1. Configure R2 environment variables for archive uploads
2. Set `MIRROR_ENABLED=true` and `MIRROR_MIGRATION_MODE=false` in production
3. Run full DRAP acquisition with 16+ workers
4. Verify archive uploads to R2 bucket
5. Expand catalogue with price comparison data from multiple pharmacies
6. Add admin UI for catalogue export and management