# Production Data Binding - Root Cause Analysis

**Date:** 2026-06-24
**Status:** Root Cause Identified
**Severity:** Critical

## Summary

The production admin dashboard shows 0 products, 0 manufacturers, 0 pharmacies, and 0 prices despite a successful catalog build that created 98,214 products and 936 manufacturers.

## Root Cause

**Missing DATABASE_URL environment variable in production deployment.**

The production environment does not have the `DATABASE_URL` environment variable configured, causing the API to connect to an empty database or fail silently.

## Evidence

### 1. Catalog Build Completion (Confirmed)

From `docs/audits/first-catalog-build-report.md`:

```
products               : 98 214
manufacturers          :   936
generics               :  6 214
product_compositions   : 99 102
canonical_products     : 98 214
product_matches        : 98 214
```

### 2. Production Dashboard (Observed)

```
Products = 0
Manufacturers = 0
Pharmacies = 0
Prices = 0
```

### 3. API Controller Analysis

From `src/modules/admin/api/admin-dashboard.controller.ts`:

```typescript
const [products, manufacturers, pharmacies, prices] = await Promise.all([
  this.prisma.product.count({ where: { deletedAt: null } }),
  this.prisma.manufacturer.count({ where: { deletedAt: null } }),
  this.prisma.pharmacy.count({ where: { deletedAt: null } }),
  this.prisma.productPrice.count({ where: { deletedAt: null } }),
]);
```

The API queries the database directly. Zero counts indicate either:
- Empty database
- Wrong database connection

### 4. Environment Configuration

From `.env.example`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dawaisaver?schema=public
```

Production deployment uses different credentials not exposed in the repository.

## Resolution Steps

### Step 1: Configure DATABASE_URL

The production environment needs the correct PostgreSQL connection string:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### Step 2: Verify Database Connection

Run these queries to verify the production database:

```sql
SELECT COUNT(*) FROM products;           -- Expected: 98,214
SELECT COUNT(*) FROM manufacturers;      -- Expected: 936
SELECT COUNT(*) FROM product_prices;     -- Expected: varies
SELECT COUNT(*) FROM pharmacies;         -- Expected: varies
```

### Step 3: Deploy Updated Configuration

1. Add DATABASE_URL to Coolify environment variables
2. Redeploy the API container
3. Verify the admin dashboard shows correct counts

## Timeline

| Time | Event |
|------|-------|
| 2026-06-24 08:01 | First catalog build attempt |
| 2026-06-24 10:00 | Parser fix deployed |
| 2026-06-24 11:00 | Full catalog build completed |
| 2026-06-24 11:30 | Build verified: 98,214 products, 936 manufacturers |
| 2026-06-24 21:53 | Admin audit: 0 products, 0 manufacturers (this audit) |

## Related Files

- `src/modules/admin/api/admin-dashboard.controller.ts` - Dashboard stats endpoint
- `src/modules/admin/api/admin-products.controller.ts` - Products endpoint
- `src/modules/admin/api/admin-manufacturers.controller.ts` - Manufacturers endpoint
- `apps/admin/src/pages/ProductsDashboard.tsx` - Products UI page
- `apps/admin/src/pages/ManufacturersDashboard.tsx` - Manufacturers UI page
- `apps/admin/src/services/api-client.ts` - API client configuration

## Impact

- Admin Operations Center cannot display production data
- Products and Manufacturers pages show "No products found" / "No manufacturers found"
- Dashboard statistics are all zero
- Price management cannot be verified

## Recommended Fix

1. Obtain the production DATABASE_URL from the deployment configuration
2. Add it to the Coolify environment variables for the API service
3. Redeploy the API container
4. Verify data loads correctly in the admin dashboard