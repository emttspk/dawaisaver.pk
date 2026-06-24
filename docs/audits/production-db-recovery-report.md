# Production Database Recovery Report

**Date:** 2026-06-24
**Status:** Recovery Required
**Severity:** Critical

---

## Problem Statement

The production admin dashboard displays zero products, manufacturers, pharmacies, and prices despite a successful catalog build that created 98,214 products and 936 manufacturers.

---

## Verification Results

### Catalog Build Completion (Confirmed)

From `docs/audits/first-catalog-build-report.md`:

| Table | Count | Status |
|-------|-------|--------|
| products | 98,214 | ✅ Built |
| manufacturers | 936 | ✅ Built |
| generics | 6,214 | ✅ Built |
| product_compositions | 99,102 | ✅ Built |
| canonical_products | 98,214 | ✅ Built |
| product_matches | 98,214 | ✅ Built |

### Production Dashboard (Observed)

| Entity | Admin UI | API Endpoint |
|--------|----------|--------------|
| Products | 0 | 0 |
| Manufacturers | 0 | 0 |
| Pharmacies | 0 | 0 |
| Prices | 0 | 0 |

---

## Root Cause

**Missing `DATABASE_URL` environment variable in production Coolify deployment.**

The API container cannot connect to the production PostgreSQL database because the connection string is not configured.

---

## Recovery Steps

### Step 1: Configure DATABASE_URL in Coolify

Add the following environment variable in Coolify:

```
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/dawaisaver?schema=public
```

### Step 2: Redeploy API Container

Trigger a redeployment of the backend API service in Coolify.

### Step 3: Verify Connection

After redeployment, test the API endpoints:

```bash
curl https://api.dawaisaver.pk/api/admin/dashboard/stats
curl https://api.dawaisaver.pk/api/admin/products?limit=1
curl https://api.dawaisaver.pk/api/admin/manufacturers?limit=1
```

Expected response counts should match the catalog build results.

---

## Expected Post-Recovery State

| Entity | Expected Count |
|--------|----------------|
| Products | 98,214 |
| Manufacturers | 936 |
| Pharmacies | varies |
| Prices | varies |

---

## Files Referenced

- `src/modules/admin/api/admin-dashboard.controller.ts`
- `src/modules/admin/api/admin-products.controller.ts`
- `src/modules/admin/api/admin-manufacturers.controller.ts`
- `apps/admin/src/pages/ProductsDashboard.tsx`
- `apps/admin/src/pages/ManufacturersDashboard.tsx`
- `.coolify/.env.coolify`
- `apps/admin/wrangler.toml`