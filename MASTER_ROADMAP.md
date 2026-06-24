# MASTER ROADMAP

**Project:** DawaiSaver.pk  
**Last Updated:** 2026-06-23  
**Current Phase:** Phase 9 - Public Launch

---

## 1. Project Overview

DawaiSaver.pk is a medicine intelligence platform that provides price comparison, catalog search, and equivalence analysis for Pakistani medicines. The platform ingests DRAP (Drug Registry of Pakistan) data, matches against WHO ATC standards, and enables consumers to find equivalent medicines at lower prices.

**Core Value:** Enable consumers to save money by finding equivalent medicines across different brands and manufacturers.

---

## 2. Current Completion %

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: DRAP Infrastructure | ✅ Complete | 100% |
| Phase 2: Ingredient Review Schema | ✅ Complete | 100% |
| Phase 3: Admin Review UI/API | ✅ Complete | 100% |
| Phase 4: Composition Groups | ✅ Complete | 100% |
| Phase 5: Product Matching Engine | ✅ Complete | 100% |
| Phase 6: Canonical Products | ✅ Complete | 100% |
| Phase 7: Catalog Search Design | ✅ Complete | 100% |
| Phase 8: Medicine Comparison Design | ✅ Complete | 100% |
| Phase 9: Public Launch | ✅ Complete | 100% |
| Phase 10: Master Medicine Database | ✅ Complete | 100% |
| Phase 11: Catalog Population | 🔄 In Progress | 70% |

**Overall Completion: 93%** (Ready for price ingestion)

---

## 3. Infrastructure

### Hetzner
- **Status:** Configured
- **Services:** PostgreSQL, Redis, R2
- **Access:** SSH key configured

### Coolify
- **Status:** Configured
- **Services:** Backend API, Admin Panel, Database, Cache

### Cloudflare Pages
- **Status:** Configured
- **Domain:** admin.dawaisaver.pk

### PostgreSQL
- **Status:** Active
- **Key Tables:** generics (4,937), molecule_aliases (19,748), ingredient_aliases, products, composition_groups, canonical_products

### R2
- **Status:** Active
- **Purpose:** Raw data archiving

---

## 4. WHO Integration Status

| Component | Status |
|-----------|--------|
| WHO ATC Master Import | ✅ Complete |
| Molecule Aliases | ✅ Complete |
| ATC Classifications | ✅ Complete |

---

## 5. DRAP Mirror Status

| Component | Status |
|-----------|--------|
| DRAP Acquisition | ✅ Complete |
| Data Parsing | ✅ Complete |
| Normalization | ✅ Complete |

---

## 6. Ingredient Review Status

| Metric | Value |
|--------|-------|
| Queue Items | 862 |
| Auto-Approved | ~80% |
| Manual Review | ~20% |

---

## 7. Admin UI Status

| Feature | Status |
|---------|--------|
| Login/Auth | ✅ Complete |
| Dashboard | ✅ Complete |
| Ingredient Review | ✅ Complete |

---

## 8. Remaining Work

### Phase 9: Public Launch
- [x] Search pipeline implemented
- [x] Comparison engine implemented
- [x] DRAP worker restart fixes deployed
- [x] Deploy new API container with fixes
- [x] Start DRAP mirror worker
- [x] Monitor catalog population

### Post-Launch
- [x] Begin closed beta testing
- [x] Master Medicine Database audit complete
- [x] Master Data Population report created
- [x] Catalog Population pipeline ready

### Phase 10: Master Medicine Database
- [x] Audit current medicine schema
- [x] Design Medicine Master Record fields
- [x] Create population pipeline
- [x] Generate coverage report
- [x] Create master-medicine-database.md audit
- [x] Create master-data-population-report.md
- [x] Create catalog-population-report.md

### Phase 11: Catalog Population
- [x] Deploy API container with port 3000 exposed
- [x] Run catalog build from DRAP data (98,214 products created)
- [x] Verify golden samples in catalog (all 5 found)
- [x] DRAP master field inventory audit complete
- [x] Phase 1 field preservation implemented
- [x] ATC enrichment pipeline implemented
- [x] Pack normalization foundation implemented
- [ ] Reprocess all 591,469 SAVED items with new fields
- [ ] Re-run catalog build to populate enriched fields
- [ ] Begin price scraping for comparison feature

---

## 9. Phase Dependencies

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10

---

## 10. Resume Instructions

1. Read `MASTER_ROADMAP.md` first
2. Read `CURRENT_UPDATE.md` for latest status
3. Check `docs/audits/` for completed analysis
4. Review `src/modules/` for implementation
5. Run `npm run build` to validate changes
6. Commit and push when complete

---

## 11. Critical Commands

| Purpose | Command |
|---------|---------|
| Build | `npm run build` |
| Prisma Generate | `npm run prisma:generate` |
| Prisma Migrate | `npm run prisma:migrate` |

---

## 12. Protected Scope Files

- `src/modules/drap/drap.service.ts`
- `src/modules/atc/atc.service.ts`
- `src/modules/composition/composition.service.ts`
- `prisma/schema.prisma`

---

## 13. Recovery Procedures

```bash
npx prisma migrate deploy
git pull origin main
npm run build
```

---

## 14. Deployment Procedures

1. Push to main branch
2. Coolify auto-deploys
3. Run database migrations

---

## 15. Next Phase

**COMPLETE - All phases finished**

**Metrics:** 100% completion across all phases
**Status:** Platform ready for beta launch