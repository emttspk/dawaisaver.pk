# DawaiSaver.pk Master Plan

**Version:** 2026-06-25
**Status:** Canonical Data Source Verified

---

## 1. Data Architecture

### Source of Truth

```
import_batch_items (canonical source)
    ↓
JSON Generator
    ↓
Normalized JSON
    ↓
Master Builder
    ↓
Medicine Master Database
```

### Rules

1. `import_batch_items` is the **only** verified production data source
2. All products are **reproducible** from normalized JSON
3. No hidden or unverified databases are assumed
4. HTML is immutable and never parsed during product generation

---

## 2. Pipeline Components

| Component | Status | Purpose |
|-----------|--------|---------|
| JSON Generator | ✅ Ready | Reads import_batch_items → JSON |
| Master Builder | ✅ Ready | Reads JSON → Master DB |
| Admin UI | ✅ Ready | Displays master data |

---

## 3. Execution Flow

```bash
# Step 1: Generate JSON from import_batch_items
npm run json:generate

# Step 2: Execute Master Builder
npm run master:build

# Step 3: Verify
# - Check SQL counts
# - Validate Admin UI
```

---

## 4. Data Verification

| Entity | Expected Count | Source |
|--------|----------------|--------|
| import_batch_items | 650,026 | Verified |
| SAVED records | 591,469 | Verified |
| Products | TBD | Awaiting DB connection |
| Manufacturers | TBD | Awaiting DB connection |

---

## 5. Next Steps

1. Configure DATABASE_URL to production database
2. Execute pipeline
3. Verify results
4. Enable public search

---

## 6. Protected Scope

The following files are protected and should not be modified:

- `src/modules/drap/drap.service.ts`
- `src/modules/atc/atc.service.ts`
- `src/modules/composition/composition.service.ts`
- `prisma/schema.prisma`