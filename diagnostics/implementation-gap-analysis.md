# DawaiSaver Implementation Gap Analysis

Date: 2026-06-23

Basis used:

- `diagnostics/medicine-master-data-model.md`
- `diagnostics/master-record-build-engine.md`
- `diagnostics/catalogue-architecture-audit.md`
- `diagnostics/catalogue-refactor-plan.md`
- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`
- `diagnostics/golden-catalogue-feasibility.md`
- `diagnostics/multi-source-data-architecture.md`
- `diagnostics/pharmacy-data-recovery-investigation.md`
- `diagnostics/golden-catalogue-data-validation.md`
- `diagnostics/golden-catalogue-pipeline-design.md`
- `diagnostics/mvp-source-validation.md`
- `diagnostics/mvp-implementation-plan.md`

## 1. Current database schema inventory

The current Prisma schema already contains a broad medicine platform, but it is still split across several overlapping identity, price, comparison, discovery, and review models.

### Core medicine and commercial tables

| Table | Current purpose | Key relationships | Key indexes / constraints |
|---|---|---|---|
| `users` | App/auth users | links to prescriptions, bills, search logs, audit logs, reviews, reports | unique email, unique phone, role/status fields |
| `manufacturers` | manufacturer master | referenced by products, import items, manufacturer profile | `normalized_name`, `status` |
| `generics` | generic molecule master | referenced by product compositions, ATC mappings, aliases, composition groups | unique `normalized_name`, `status` |
| `products` | current product/brand master | manufacturer, compositions, prices, prescription items, bill items, price snapshots, canonical product, packs, categories | `manufacturer_id`, `normalized_brand`, `signature`, `registration_number`, `status` |
| `product_compositions` | product ingredients | product + generic | unique `(product_id, generic_id, ingredient_order)`, `generic_id`, `status` |
| `equivalence_groups` | legacy brand-based equivalence bucket | product equivalences | `signature`, `status` |
| `product_equivalence` | link products to equivalence groups | product + equivalence group | unique `(product_id, equivalence_group_id)`, `equivalence_group_id`, `status` |
| `pharmacies` | pharmacy master | product prices, bills | `normalized_name`, `city`, `status` |
| `product_prices` | product-level prices | product + pharmacy | `(product_id, observed_at)`, `pharmacy_id`, `city`, `source_type` |
| `product_packs` | pack shape attached to product | product + pack prices | `product_id`, `status` |
| `product_pack_prices` | pack-linked prices | product pack | `(product_pack_id, observed_at)`, `city` |
| `therapeutic_categories` | therapeutic taxonomy | products, ATC classification | `code`, `status` |
| `atc_classifications` | WHO/ATC hierarchy | therapeutic categories, generics | `code`, `therapeutic_category_id` |
| `molecule_aliases` | generic aliases | generics | unique `(generic_id, normalized_alias_name, alias_type)`, `normalized_alias_name`, `alias_type` |
| `generic_atc_classifications` | generic-to-ATC mapping | generics + ATC | unique `(generic_id, atc_id)` |
| `product_therapeutic_categories` | product-to-therapeutic mapping | products + therapeutic categories | unique `(product_id, category_id)` |
| `manufacturer_profiles` | manufacturer enrichment | manufacturer | unique `manufacturer_id` |

### Import, source, and build tables

| Table | Current purpose | Key relationships | Key indexes / constraints |
|---|---|---|---|
| `import_batches` | DRAP / source import runs | batch items, import errors | `source_type`, `adapter_type`, `status`, `created_at` |
| `import_batch_items` | row-level import records | import batch, product, manufacturer | unique `(import_batch_id, row_number)`, `status`, `product_id`, `manufacturer_id`, `source_type` |
| `import_errors` | row-level import failures | import batch | `import_batch_id`, `error_code`, `source_type` |
| `catalog_build_jobs` | catalog build workflow | import batches, products, canonical products | `status, phase`, `created_at` |
| `source_providers` | external source registry | configs, sync jobs, health logs, results | `provider_kind`, `status` |
| `source_provider_configs` | source-specific config | source provider | unique `(source_provider_id, config_key)`, `status` |
| `source_sync_jobs` | source sync runs | source provider | `source_provider_id`, `job_type`, `status`, `scheduled_at` |
| `source_sync_results` | source sync results | source sync job, source provider | `source_sync_job_id`, `source_provider_id`, `status` |
| `source_health_logs` | source health history | source provider | `source_provider_id`, `healthy`, `checked_at` |
| `crawl_jobs` | crawler scheduling | none central | `adapter_name`, `status`, `scheduled_at` |
| `data_sources` | source trust registry | standalone | `source_type`, `trust_level` |
| `mirror_runtime_control` | DRAP mirror runtime lock/state | standalone | primary key `key` |

### Matching, canonicalization, search, and discovery tables

| Table | Current purpose | Key relationships | Key indexes / constraints |
|---|---|---|---|
| `canonical_products` | legacy canonical medicine identity | product, aliases | `normalized_brand`, `normalized_generic`, `medicine_signature`, `registration_number`, `status` |
| `canonical_product_aliases` | aliases for canonical products | canonical product | unique `(canonical_product_id, alias_type, normalized_value)`, `alias_type`, `normalized_value`, `status` |
| `product_matches` | product-to-canonical match results | source product, canonical product | `source_product_id`, `canonical_product_id`, `match_status`, `source_table + source_record_id`, `final_confidence` |
| `match_reviews` | match review workflow | product match, canonical product, reviewer | `product_match_id`, `canonical_product_id`, `reviewer_user_id`, `review_status` |
| `matching_rules` | matching configuration | standalone | `rule_type`, `enabled`, `status` |
| `search_cache` | cached search responses | standalone | `normalized_query`, `entity_type`, `expires_at`, `status` |
| `search_popularity` | trending search signal | standalone | unique `(entity_type, normalized_query, city)`, `entity_type`, `entity_id`, `normalized_query`, `city`, `trending_score` |
| `search_suggestions` | autocomplete suggestions | standalone | unique `(suggestion_type, normalized_suggestion)`, `normalized_suggestion`, `suggestion_type`, `popularity_score`, `status` |
| `search_synonyms` | search synonym map | standalone | unique `(normalized_term, normalized_synonym, language)`, `normalized_term`, `normalized_synonym`, `status` |
| `discovery_candidates` | discovered products needing review | evidence, reviews | `medicine_signature`, `normalized_brand`, `normalized_generic`, `discovery_status`, `overall_confidence` |
| `discovery_evidence` | evidence for discovery candidates | discovery candidate | `discovery_candidate_id`, `discovery_source_type`, `capture_date`, `confidence` |
| `discovery_reviews` | discovery review records | discovery candidate, reviewer | `discovery_candidate_id`, `reviewer_user_id`, `decision` |
| `discovery_jobs` | discovery pipeline runs | none central | `job_type`, `discovery_source_type`, `discovery_status`, `scheduled_at` |
| `discovery_rules` | discovery configuration | standalone | `rule_type`, `enabled`, `status` |

### OCR, prescription, price intelligence, and audit tables

| Table | Current purpose | Key relationships | Key indexes / constraints |
|---|---|---|---|
| `ocr_jobs` | OCR jobs | none central | `job_type`, `job_status` |
| `ocr_results` | OCR extraction results | OCR job | `job_id`, `provider_name`, `confidence_score`, `review_required` |
| `ocr_provider_logs` | OCR provider trace | OCR job | `provider_name`, `job_id`, `status_code` |
| `prescriptions` | patient prescription records | user, items, jobs, reviews, cost estimates | `user_id`, `status` |
| `prescription_items` | prescription line items | prescription, product | `prescription_id`, `product_id`, `status` |
| `prescription_processing_jobs` | prescription pipeline jobs | prescription | `prescription_id`, `job_type`, `status` |
| `prescription_reviews` | prescription review workflow | prescription, item, reviewer | `prescription_id`, `prescription_item_id`, `status` |
| `prescription_cost_estimates` | cost estimates for prescriptions | prescription, item | `prescription_id`, `prescription_item_id`, `city`, `status` |
| `bills` | pharmacy bills | user, pharmacy | `user_id`, `pharmacy_id`, `status` |
| `bill_items` | bill line items | bill, product | `bill_id`, `product_id`, `status` |
| `price_snapshots` | source price observations | source provider, product | `source_provider_id`, `product_id`, `medicine_signature`, `city`, `captured_at`, `stock_status` |
| `price_change_events` | price deltas | price snapshot, source provider, product | `price_snapshot_id`, `source_provider_id`, `product_id`, `direction`, `captured_at` |
| `product_availability` | availability observations | source provider, product | `source_provider_id`, `product_id`, `medicine_signature`, `city`, `stock_status`, `captured_at` |
| `product_price_statistics` | product-level price analytics | product | `product_id`, `medicine_signature`, `calculated_at` |
| `city_price_statistics` | city-level price analytics | product | `product_id`, `medicine_signature`, `city`, `calculated_at` |
| `market_price_signals` | price intelligence signals | product | `product_id`, `medicine_signature`, `signal_type`, `city`, `calculated_at` |
| `price_anomalies` | anomaly detection outputs | product, price snapshot | `product_id`, `price_snapshot_id`, `medicine_signature`, `anomaly_type`, `detected_at` |
| `price_trends` | price trend analytics | product | `product_id`, `medicine_signature`, `city`, `window_days`, `calculated_at` |
| `search_logs` | search activity logs | user | `normalized_query`, `city`, `created_at` |
| `audit_logs` | system audit trail | user | `actor_user_id`, `action`, `entity_type + entity_id`, `correlation_id`, `created_at` |
| `user_reports` | user-submitted reports | user, reviewer | `entity_type + entity_id`, `report_type`, `status` |
| `data_quality_flags` | data quality issues | entity reference | `entity_type + entity_id`, `flag_type`, `severity`, `resolved` |

### Composition-group and master-data-shaped tables already present

| Table | Current purpose | Key relationships | Key indexes / constraints |
|---|---|---|---|
| `composition_groups` | normalized composition identity | `composition_group_compositions` | unique `signature`, `molecules_hash` |
| `composition_group_compositions` | ingredient rows in a composition group | composition group, generic | unique `(composition_group_id, generic_id, ingredient_order)`, `composition_group_id`, `generic_id` |
| `DataSource` / `data_sources` | source trust registry | standalone | `source_type`, `trust_level` |

### Existing schema relationships that matter most

- `products` owns the current brand-centric commercial identity.
- `product_compositions` binds products to generics.
- `canonical_products` is the current canonical identity used by matching, search, and prescriptions.
- `composition_groups` exists, but it is not the runtime primary identity for search or customer comparison.
- `product_prices` and `product_pack_prices` coexist, which splits the price model across product and pack.
- `price_snapshots`, `price_change_events`, `price_anomalies`, and `price_trends` all still key off `product` or `medicine_signature`, not a master record.
- `discovery_candidates`, `match_reviews`, `discovery_reviews`, and `ocr_results` are review artifacts, but they are not unified under a single medicine master record lifecycle.

## 2. Current catalog pipeline inventory

### Importers and acquisition

- DRAP import path:
  - `DrapImporter`
  - `DrapNormalizer`
  - `DrapValidationService`
  - `DrapAcquisitionService`
  - `DrapService`
  - `DrapImportController`
  - `DrapMirrorWorker`
  - `runDrapMirrorJob`
  - `DrapMirrorController`
  - `AdminMirrorRuntimeController`
  - `AdminMirrorStatusController`
  - `AdminMirrorValidationController`
- Source sync path:
  - `SourceFactory`
  - `SourceRegistry`
  - `SourceSyncWorker`
  - `PriceSyncWorker`
  - `SourcesController`
  - `SourceProvider` and sync/health tables

### Matchers and canonicalization

- `MatchingService`
- `SignatureGeneratorService`
- `BrandMatcherService`
- `GenericMatcherService`
- `StrengthMatcherService`
- `ManufacturerMatcherService`
- `ConfidenceEngineService`
- `MatchingController`

Observed behavior:

- The matching engine still computes a weighted confidence score across brand, generic, strength, dosage form, manufacturer, pack size, registration number, and signature.
- `signature` still includes brand in some current pathways, which is not compatible with the approved comparison rule.
- `canonical_products` is still the current source for canonical candidates in matching, search, and prescriptions.

### Catalog builders

- `CatalogService` in `src/modules/catalog/catalog.service.ts`
- `CatalogueBuilderService` in `src/modules/catalogue/catalogue-builder.service.ts`
- `src/cli/catalog.ts`
- `CatalogBuildJob`

Observed behavior:

- The main catalog build pipeline still promotes import rows into `manufacturers`, `generics`, `products`, `product_compositions`, `canonical_products`, `canonical_product_aliases`, and `product_matches`.
- The golden-sample catalogue builder exports a sample catalogue from `generics`, `products`, and `therapeutic_categories`, but it is not the authoritative medicine master-record pipeline.

### Discovery and review

- `DiscoveryService`
- `CandidateGeneratorService`
- `EvidenceCollectorService`
- `DiscoveryReviewService`
- `DiscoveryController`
- `DiscoveryReviewController`

Observed behavior:

- Discovery records can collect evidence and reviews, but they do not yet flow into a unified master record.

### Price intelligence

- `PriceIntelligenceService`
- `PriceComparisonService`
- `CityPriceAnalyticsService`
- `PriceAnalyticsService`
- `PriceChangeDetectorService`
- `PriceIntelligenceController`

Observed behavior:

- Current price intelligence still operates around `price_snapshots` keyed to `productId` or `medicineSignature`.
- Pack-level price is present in schema, but the customer-facing logic still heavily uses product-level price analytics.

### Search

- `SearchService`
- `ProductSearchService`
- `GenericSearchService`
- `AutocompleteService`
- `AlternativeSearchService`
- `SearchRankingService`
- `SearchController`
- `AutocompleteController`
- `AlternativesController`
- `search.data-access`

Observed behavior:

- Search ranking is brand-heavy and signature-heavy.
- Search returns product-centric results, not composition-group-first results.
- `search.data-access` loads `canonical_products`, `product_matches`, `price_statistics`, `city_price_statistics`, `market_signals`, and `availability`.

### OCR

- `OcrController`
- `OcrService`
- `UploadService`
- OCR providers and registry

### Prescriptions

- `PrescriptionsService`
- `PrescriptionParserService`
- `PrescriptionItemMatcherService`
- `PrescriptionCostEstimatorService`
- `PrescriptionReviewService`
- `PrescriptionsController`
- `PrescriptionReviewController`

Observed behavior:

- Prescription matching still uses `canonical_products` as the candidate set.
- Cost estimation still pulls product-level price signals.

### Admin platform

Current admin UI modules are present in `apps/admin`:

- Dashboard
- OCR review
- Prescription review
- Medicine match review
- Discovery review
- Price anomaly review
- Source health
- User activity
- System health
- Mirror status

Current admin UI does not yet have dedicated screens for:

- Medicine Master Record management
- Composition Group management
- Pack Variant management
- Pack Price management
- Unified source evidence viewer
- Unified approval workflow for master records

## 3. Target architecture comparison

| Target entity | Current state | Finding |
|---|---|---|
| Medicine Master Record | Partially exists | There is no single authoritative master record. The current system spreads identity across `product`, `canonical_product`, `composition_groups`, discovery, and import tables. |
| Composition Group | Partially exists | `composition_groups` and `composition_group_compositions` exist, but runtime comparison/search still does not use them as the authoritative identity. |
| Brand Product | Exists | `products` is the current brand/product layer. |
| Pack Variant | Partially exists | `product_packs` exists, but normalization and runtime usage are not yet the authoritative pack layer. |
| Pack Price | Partially exists | `product_pack_prices` exists, but customer-facing pricing still depends on product-level price intelligence in multiple places. |
| Evidence | Partially exists | Evidence is spread across import batches, source sync results, discovery evidence, OCR results, price snapshots, audit logs, and data quality flags. |
| AI Review | Partially exists | `match_reviews`, `discovery_reviews`, OCR review flags, and price anomaly detection exist, but not as one unified AI review layer. |
| Human Review | Partially exists | Admin review screens and review tables exist, but there is no unified master-record approval workflow. |

## 4. Implementation matrix

| Target entity | Existing components | Required modifications | New components required | Complexity |
|---|---|---|---|---|
| Medicine Master Record | `products`, `canonical_products`, `product_matches`, `match_reviews`, `discovery_*`, `ocr_*`, `import_*` | unify identity, evidence, review states, and publication gates into one record lifecycle | `medicine_master_records` or equivalent master layer, master field/evidence tables, review-state orchestration | High |
| Composition Group | `composition_groups`, `composition_group_compositions`, matching helpers, DRAP composition building | make composition group authoritative for runtime compare/search and move route into the canonical signature | composition-group-aware services and resolvers | Medium-High |
| Brand Product | `products`, `canonical_products`, search results | stop treating brand as the canonical comparison key; keep brand as a leaf commercial entity | brand-product-aware views or service layer | Medium |
| Pack Variant | `product_packs`, pack parsing in source layers | normalize pack shapes consistently and link comparison / pricing to pack variant | pack normalization engine, pack comparison service | High |
| Pack Price | `product_pack_prices`, `price_snapshots` | move price authority from product to pack variant for customer comparison | pack-linked price history and comparison logic | High |
| Evidence | `import_batches`, `import_batch_items`, `import_errors`, `source_sync_results`, `source_health_logs`, `discovery_evidence`, `ocr_results`, `audit_logs`, `data_quality_flags` | unify evidence into a master-record proof chain | evidence store / evidence link model | Medium |
| AI Review | `match_reviews`, `discovery_reviews`, `ocr review_required`, `price_anomalies` | centralize AI checks and output states | AI audit queue and decision layer | Medium |
| Human Review | admin dashboards, review tables, `User.role`, `AdminGuard` | create a coherent approval workflow for master record publication | master-record review queue, approval state machine, publication gate | High |

## 5. Migration roadmap

### Phase 1: Minimum schema changes

Findings:

- The current schema is close enough to start an additive master-data layer, but not enough to publish the approved architecture without new tables or repurposed tables.
- The minimum safe path is additive, not destructive.

Minimum changes likely required:

- add a master-record table or equivalent authoritative record layer,
- add field-evidence and field-candidate tracking,
- add unified review-state storage,
- formalize pack variant and pack price ownership around the master record,
- preserve DRAP fields and source evidence in first-class form.

### Phase 2: Pipeline changes

- Switch ingestion to populate master records rather than only product/canonical-product rows.
- Route composition matching through composition-group signatures.
- Replace brand-weighted matching with comparison on composition + strength + dosage form + route.
- Make pack normalization deterministic and shared across DRAP/pharmacy/distributor/OCR flows.
- Make price updates pack-variant-based.

### Phase 3: Admin changes

- Add Medicine Master Record queue.
- Add Composition Group management.
- Add Pack Variant and Pack Price review screens.
- Add unified evidence viewer.
- Add approval workflow screens for draft/enriched/AI reviewed/human reviewed/approved/published.

### Phase 4: Customer-facing changes

- Replace brand-first search and product pages with composition-group-first customer pages.
- Show available brands, pack variants, and savings by equivalent pack.
- Surface verification state and evidence-backed trust indicators.

## 6. Complexity estimate by work item

| Work item | Complexity | Why |
|---|---|---|
| Add authoritative Medicine Master Record layer | High | Requires unifying many existing tables and workflows into one lifecycle. |
| Rebase comparison on composition + strength + dosage form + route | High | Current search/matching still depends on product/signature/brand-centric logic. |
| Pack normalization and pack-linked pricing | High | Pack exists partly, but price and comparison are still split across product and pack models. |
| Evidence unification | Medium | Evidence exists, but is fragmented. |
| AI review centralization | Medium | Several review-like systems already exist, but they are not unified. |
| Human approval workflow | High | Publication gating and review states are not yet a single workflow. |
| DRAP importer adaptation | Medium | DRAP pipeline is already rich, but it still writes to product-centric entities. |
| Pharmacy enrichment adaptation | High | Pharmacy syncing exists conceptually, but pack-level canonical alignment is still incomplete. |
| Search refactor | High | Search is deeply product/signature/brand-centric today. |
| Admin UI refactor | Medium | Admin screens exist, but they are review dashboards rather than master-data operations. |

## 7. Implementation order

Recommended order:

1. Authoritative master record layer.
2. Composition group as canonical compare identity.
3. Pack variant and pack price ownership.
4. Evidence and review-state unification.
5. Importer and pharmacy enrichment routing changes.
6. Search and comparison refactor.
7. Admin workflow and publication screens.
8. Customer listing and savings UI.

What can be deferred:

- broad WHO / ATC cleanup beyond the MVP-safe mappings,
- distributor expansion,
- customer submissions,
- OCR enrichment beyond evidence recovery,
- analytics expansion beyond launch-critical price comparison,
- non-MVP therapeutic categories.

## 8. Blockers

Current blockers against the final approved architecture:

- There is no single master record entity.
- Product, canonical product, discovery candidate, and composition group all overlap as identity layers.
- Search still ranks brand and medicine signature heavily.
- Price intelligence is still product-centric in multiple flows.
- Pack-level pricing exists, but the runtime is not pack-authoritative.
- Human review is fragmented across several modules instead of one approval pipeline.
- Customer publication lacks a single evidence-backed gate.
- `CatalogueBuilderService` is still a sample exporter, not the real master-record build engine.
- Current pharmacy/source sync is not yet consistently aligned to the master-record lifecycle.

## 9. Final implementation roadmap

Recommended build trajectory:

1. Create the master record layer as the authoritative pre-publication entity.
2. Promote composition groups to the comparison truth.
3. Bind brand products and pack variants under the master record.
4. Attach pack prices and price history to pack variants only.
5. Centralize evidence, AI review, and human review.
6. Refactor search, matching, prescriptions, and price intelligence to read from the new master model.
7. Rework admin screens around master record operations.
8. Publish customer listings from approved master records only.

## Ready To Build Components

- DRAP import and mirror acquisition plumbing.
- Source provider registry and sync scaffolding.
- OCR provider scaffolding.
- Basic admin authentication and role guarding.
- Existing schema primitives for generics, products, compositions, composition groups, packs, and pack prices.
- Existing audit and review tables that can be reused as evidence inputs.

## Requires Refactor

- `MatchingService` and its signature-driven scoring.
- `search.data-access`, `SearchRankingService`, and product-centric search results.
- `CatalogService` and the current canonical product build flow.
- `CatalogueBuilderService` golden-sample export flow.
- `PrescriptionsService` and cost estimation logic.
- Current price intelligence paths keyed to product or medicine signature.
- Product-centric usage of `canonical_products` in runtime APIs.

## Requires New Development

- Authoritative Medicine Master Record service and lifecycle.
- Master field candidate / evidence / review orchestration.
- Unified approval workflow and publication gate.
- Pack-variant-first price comparison engine.
- Composition-group-first customer comparison API and UI.
- Unified admin master-data screens.

## Recommended Phase 1 Scope

- Add the authoritative master-record layer.
- Make composition group the canonical comparison identity.
- Keep DRAP and Dawaai as the MVP source set.
- Keep pack normalization and pack-linked price in the first release scope.
- Keep human approval mandatory before customer publication.
- Limit the MVP to the three validated medicines.

