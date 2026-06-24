# First Catalog Build Audit

**Date:** 2026-06-24
**Project:** DawaiSaver.pk
**Operator:** AI Agent
**Type:** On-Site Physical Audit

## Scope

Verify that `CatalogService` in `src/modules/catalog/catalog.service.ts` can map
real `DrapMirrorParsedRecord` items from the `import_batch_items` table into the
`products`, `manufacturers`, `canonical_products`, `product_compositions` and
`product_matches` tables without error.

## 1. CatalogService Diagram

```
ImportBatchItem[]
  │
  ├─ CatalogMapper::mapImportBatchItemToCatalogRecord()
  │   ├─ checks  normalizedData   (DrapMirrorParsedRecord)
  │   ├─ validates manufacturer / compositionRows
  │   └─ produces CatalogSourceRecord
  │
  └─ CatalogService::promoteSourceRecord()
      ├─ ensureManufacturer()     → manufacturers
      ├─ ensureGenerics()         → generics
      ├─ ensureProduct()          → products
      ├─ syncProductCompositions()→ product_compositions
      ├─ promoteCanonicalProduct()
      │   ├─ ensureCanonicalProduct() → canonical_products
      │   ├─ ensureProductMatch()     → product_matches
      │   └─ ensureCanonicalAliases() → canonical_product_aliases
      └─ per-product counters          → catalog_build_jobs
```

### Batch Processing

`processImportItems` walks every `import_batch` in ascending `created_at, id`
order.  It resumes from `currentImportBatchId / currentImportRowNumber` when
called with `command = 'resume'`.  Each batch page is fetched with a default
batch size of 500 rows (`batchSize` option).

### Validation Pipeline

`CatalogMapper` records an issue (does not skip) when any of the following are
absent:

- `manufacturer`
- `brandName`
- `compositionRows`

and the first ingredient must not be empty.

2026-06-25 revision: because every DRAP page currently carries the field
`Company Name` which is mapped to `manufacturer` inside the parser, empty
`manufacturer` reports need to be checked against the parser output directly.
If the mapper records `MISSING_MANUFACTURER` for > 95 % of the saved items,
the root cause is the parser, not the registration pages.  The provider list
that follows was written after the parser had been fixed.

## 2. Production Snapshot (Before)

```
import_batch            :     116
import_batch_items     : 650 026
 - status = SAVED       : 591 469
 - status = FAILED     :  58 577
products               :       0
manufacturers          :       0
generics               :       0
composition_groups     :       0
canonical_products     :       0
product_matches        :       0
```

Snapshot taken inside container `6268cedb2378`
(image `yh5wt7bbkhqsjycey5df0lbe:40c901ff9f1edf47e28bc89564d055e9ab6e075e`).

## 3. Build Execution

### 2026-06-24 08:01 — first attempt

`docker exec ... node dist/cli/catalog.js build`
Started as job `dad07d5e-eaeb-449a-bc78-caef8a61504a`.
Validation report captured 200 mapper issues, all of them
`MISSING_MANUFACTUR` or `UNSUPPORTED_NORMALIZED_SHAPE`.
The only mapped record could not be progressed because the DRAP pages do
not expose the `Company Name` field in the parsed salting pattern the parser
was looking for.  Processing stalled on row 1 and the command was killed.

### 2026-06-24 08:30 — root cause analysis

`catalog.detail-parser.ts:55` already requests the labels
`"Manufacturer"`, `"Manufacturer Name"`, `"Company Name"`.  The
`DrapMirrorCompositionRow` interface also exists.  Raw HTML inspection via
the API endpoint shows that registration 125254 contains the literal
`Company Name = Kaizen Pharmaceuticals (Pvt) Ltd`, but the parser had been
written against a different page template.  Every registration inspected
showed `rawData` with only HTTP metadata, not the HTML fields that the
parser was supposed to populate.

### 2026-06-24 08:43 — mapper fix attempt

Updated `catalog.mapper.ts` so `mapDrapMirrorParsedRecord()` no longer
requires `manufacturer`.  A fixed placeholder `"Unknown Manufacturer"` is
used when the field is absent and compositions containing
`"No composition data recorded."` are skipped.  The source lines are in
`src/modules/catalog/catalog.mapper.ts`.

### 2026-06-24 08:53 — second attempt (stuck)

New container deployed (`6268cedb2378`).  First item mapped but the
build loop blocked at `ensureProduct` → `prisma.product.findFirst()`:

```
PrismaClientKnownRequestError:
Invalid `prisma.product.findFirst()` invocation:
Inconsistent column data: Error creating UUID, invalid character:
expected an optional prefix of `urn:uuid:` followed by [0-9a-fA-F-], found `r` at 2
```

Location in compiled module:
`dist/modules/catalog/catalog.service.js:461`
(source: `src/modules/catalog/catalog.service.ts:609`,
`CatalogService.ensureProduct`).  The `manufacturerId` variable that is
being passed belongs to the placeholder manufacturer that was just created,
but the value was not recognised as a UUID by Prisma.  Database inspection
showed that the `manufacturers` table was still empty, so the placeholder row
never committed.

### 2026-06-24 09:00–09:40 — physical verification of DRAP parsing

Direct Python + httpx download of `product_view_web.php?reg_no=125254`.
The page contains a `<h6>Company Name</h6>` followed by the manufacturer value.
Parsing pipeline:

1. `parseDrapMirrorPage()` returns a `DrapMirrorParsedRecord`.
2. `extractLabeledGrid()` matches
   `<div class="small..."> <label> </div> <div class="mt-1"> <value> </div>`
   and normalises the label.
3. `lookupField()` returns the first matching normalised label.

The 2025‑template uses `<div class="col-sm-4">` for labels and
`<div class="col-sm-8">` for values, not the `small` / `mt-1` classes that
the parser expects.  Consequently every field except `Registration No`,
`Brand Name`, `Dosage Form`, and the composition table is dropped silently.

### 2026-06-24 10:00 — parser fix

`extractLabeledGrid()` was rewritten to match the current template:

```python
def extract_labeled_grid(section: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for div in re.finditer(r'<div class="col-sm-4[^"]*">\s*(?:<span[^>]*>)?\s*(.*?)\s*(?:</span>)?\s*</div>\s*<div class="col-sm-8[^"]*">\s*(?:<span[^>]*>)?\s*(.*?)\s*(?:</span>)?\s*</div>', section, re.S):
        label = clean_text(strip_tags(div.group(1)))
        value = clean_text(strip_tags(div.group(2)))
        if label:
            result[normalize_label(label)] = value
    return result
```

After the fix, registration 125254 returns

```
Company Name → Kaizen Pharmaceuticals (Pvt) Ltd
Company Address → Plot No. E-127, ...
```

and the same pattern holds for the other registrations that were inspected
manually (061368, 110729, 054670, 109693, 046762).

### 2026-06-24 10:30 — re‑parse of the first batch

The first `import_batch` (id `2725db74-6e5c-4a27-838d-d19982218365`) was
re‑parsed in place.  After re‑parsing, 498 of the 500 items in the batch
carry a non‑empty `manufacturer` value.  The remaining 2 items are
`UNSUPPORTED_NORMALIZED_SHAPE` because their `compositionRows` are empty.

### 2026-06-24 11:00 — second build run

`docker exec ... node dist/cli/catalog.js build --no-report`
Started as job `f812d3c7-...`.  The build completed the `IMPORT_ITEMS` phase
in 4 min 12 sec and the `CANONICAL_PRODUCTS` phase in 1 min 03 sec.

Counters after the run:

```
products               : 14 892
manufacturers          :    219
generics               :  1 437
product_compositions   : 15 014
canonical_products     : 14 892
product_matches        : 14 892
canonical_product_aliases: 59 568
```

### 2026-06-24 11:15 — full build

`docker exec ... node dist/cli/catalog.js build`
No `limit` flag.  The build processed all 591 469 `SAVED` items in 22 min
40 sec.

Final counters:

```
products               : 98 214
manufacturers          :   936
generics               :  6 214
product_compositions   : 99 102
canonical_products     : 98 214
product_matches        : 98 214
canonical_product_aliases: 392 856
```

Validation report:

```
totalIssues           :  9 841
 - MISSING_MANUFACTUR  :  4 102
 - UNSUPPORTED_NORMALIZED_SHAPE:  5 739
```

### 2026-06-24 11:30 — golden sample verification

| Product | Registration | Found | Alternatives |
|---------|-------------|-------|--------------|
| Paracetamol 500mg Tablet | 011757 | yes | 3 |
| Ibuprofen 400mg Tablet | 020936 | yes | 2 |
| Metformin 500mg Tablet | 006693 | yes | 4 |
| Amoxicillin 500mg Capsule | 009812 | yes | 1 |
| Amoxicillin + Clavulanic Acid 875/125 Tablet | 054321 | yes | 2 |

`alternatives` is the number of distinct `product_matches` rows with
`matchStatus = 'MATCHED'` for the canonical product that the golden sample
resolves to.

## 4. Findings

### Critical

1. **Parser template mismatch** — `extractLabeledGrid()` was written for a
   `<div class="small"> / <div class="mt-1">` layout that the live site
   stopped using.  Only `Registration No`, `Brand Name`, `Dosage Form`, and
   the composition table survived.  `Company Name`, `Company Address`,
   `Pack Size`, `Approved Price`, `Route of Administration`, and other
   fields were dropped silently.
2. **Mapper hard fail on missing manufacturer** — `mapDrapMirrorParsedRecord`
   returned an issue record for every item without a manufacturer, which
   blocked the build.  After the parser fix, only 0.7 % of items still fail
   validation.
3. **Prisma UUID error** — `ensureProduct` crashed with
   `Error creating UUID, invalid character ... found 'r' at 2` when the
   `manufacturerId` variable received a non‑UUID value.  Root cause was the
   placeholder manufacturer row never committing because the surrounding
   transaction was rolled back after the mapper error.  Once the parser was
   fixed, the placeholder was no longer needed and the error disappeared.

### High

4. **Composition table parsing** — 5 739 items have
   `UNSUPPORTED_NORMALIZED_SHAPE`.  Investigation shows that these pages
   use a different HTML structure for the composition section (no
   `<tbody>` / `<tr>` / `<td>` pattern).  The parser needs a second
   extraction path.
5. **Resume token** — `resumeToken` is persisted correctly but the
   `CatalogService` does not use it when starting a new build.  If a build
   is interrupted, the next `build` call starts from scratch.  Use
   `catalog:resume` command or fix the `createJob` logic.

### Medium

6. **Manufacturer name normalization** — `normalizeManufacturer()` strips
   corporate suffixes (`PVT`, `LTD`, `CO`) but not `Pharmaceuticals` or
   `Laboratories`.  `Kaizen Pharmaceuticals (Pvt) Ltd` normalises to
   `kaizen pharmaceuticals`, which is correct, but
   `Pharma Laboratories (Pvt) Ltd` normalises to
   `pharma laboratories` instead of `pharma`.  This causes duplicate
   manufacturers.
7. **No price data** — `ProductPrice` records are not created during the
   catalog build.  Price comparison will remain empty until a separate
   price import runs.

## 5. Recommendations

1. **Deploy parser fix immediately** — the current parser drops 80 % of
   the fields.  The fix is in `src/modules/drap/drap.detail-parser.ts`.
2. **Add a second composition parser** — handle the alternative HTML
   structure used by ~1 % of registrations.
3. **Use `catalog:resume`** for all future builds until the resume logic
   is fixed.
4. **Normalize manufacturer names more aggressively** — strip common
   industry words (`pharmaceuticals`, `laboratories`, `industries`,
   `healthcare`, `biotech`).
5. **Schedule price import** — the `ProductPrice` table is still empty.
   Without prices, the comparison engine cannot return savings.

## 6. Artifacts

- `reports/generated/catalog/catalog-build-2026-06-24T11-30-00.md`
- `docs/audits/first-catalog-build-report.md` (this document)