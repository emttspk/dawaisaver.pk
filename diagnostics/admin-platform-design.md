# DawaiSaver Admin Platform Design

Date: 2026-06-23

Sources used:

- `diagnostics/catalogue-architecture-audit.md`
- `diagnostics/catalogue-refactor-plan.md`
- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`
- `diagnostics/golden-catalogue-feasibility.md`
- `diagnostics/multi-source-data-architecture.md`
- `diagnostics/pharmacy-data-recovery-investigation.md`

Scope:

- Design only.
- No implementation, code changes, schema changes, migrations, commits, builds, or pushes.

## Executive finding

The admin platform should be built as a single operational control plane for catalogue quality, source evidence, review, and release readiness.

It should not be a generic dashboard collection.

The admin system needs to manage four linked truths:

1. regulated medicine identity,
2. commercial listing truth,
3. evidence quality and confidence,
4. customer-facing catalogue readiness.

The design below centers those truths and aligns with the current backend surfaces already present in the repository, including DRAP admin controls, OCR review, prescription review, discovery review, price intelligence, source sync, and matching services.

## 1. Admin modules

### Core modules

1. Catalogue Overview
2. Molecule Management
3. Composition Group Management
4. Product Review Queue
5. Pack Variant Management
6. Source Evidence Viewer
7. Price Intelligence Dashboard
8. Pharmacy Matching Dashboard
9. AI Audit Center
10. Catalogue Health Dashboard
11. Approval Workbench
12. Confidence Review Workbench
13. User & Role Management
14. Alert Center
15. Source Operations
16. Release Readiness
17. Audit Trail

### Supporting modules

1. DRAP Mirror Control
2. OCR Review
3. Prescription Review
4. Discovery Review
5. Data Quality Flags
6. Manual Override Log
7. System Settings

## 2. Admin navigation structure

The navigation should be grouped by job-to-be-done, not by database table.

### Primary navigation

1. Overview
2. Catalogue
3. Evidence
4. Matching
5. Pricing
6. Reviews
7. Quality
8. Sources
9. Users
10. Alerts
11. Audit

### Secondary navigation by group

#### Overview

- Catalogue Overview
- Catalogue Health Dashboard
- Release Readiness

#### Catalogue

- Molecule Management
- Composition Group Management
- Product Review Queue
- Pack Variant Management

#### Evidence

- Source Evidence Viewer
- DRAP Mirror Control
- OCR Review
- Packaging Image Review

#### Matching

- Pharmacy Matching Dashboard
- Prescription Review
- Discovery Review

#### Pricing

- Price Intelligence Dashboard
- Pack Price Review
- Savings Validation

#### Reviews

- Product Review Queue
- Confidence Review Workbench
- Approval Workbench

#### Quality

- AI Audit Center
- Data Quality Flags
- Anomaly Review

#### Sources

- DRAP Sync Status
- Pharmacy Source Sync
- Distributor Source Sync
- Source Health

#### Users

- User Roles
- Permissions
- Reviewer Assignment

#### Alerts

- Alert Center
- Threshold Rules
- Escalations

#### Audit

- Activity Log
- Change History
- Evidence History

## 3. Molecule Management

### Purpose

Manage canonical molecules as reviewed active pharmaceutical moieties.

### Key responsibilities

- create and review canonical molecule records,
- manage synonyms and spelling variants,
- manage salt, hydrate, and ester policy outcomes,
- flag broad molecules and biologics,
- link canonical molecules to WHO/ATC and DRAP evidence,
- track review status and confidence.

### Views

- Molecule list
- Molecule detail
- Alias review
- Unmatched molecule queue
- Duplicate molecule queue
- Broad molecule queue

### Molecule detail should show

- canonical name,
- normalized key,
- approved aliases,
- rejected aliases,
- source evidence,
- confidence score,
- review status,
- salt/hydrate/ester classification,
- linked composition groups,
- linked ATC categories,
- duplicate or conflict warnings.

### Key actions

- approve canonical molecule,
- merge aliases,
- split unsafe aliases,
- mark as broad or manual review,
- attach evidence,
- freeze molecule after approval,
- reopen for re-review when source evidence changes.

### Special rules

- brand names must never be stored as canonical molecule aliases,
- combination products must not be represented as one canonical molecule,
- ester-qualified molecules must be review-gated,
- salt normalization must show source and rule version.

## 4. Composition Group Management

### Purpose

Manage the authoritative comparison identity.

### Key responsibilities

- create and review composition groups,
- verify ingredient order,
- verify strength normalization,
- verify dosage form normalization,
- verify route normalization,
- detect duplicate or unsafe groups,
- bind composition groups to brand products.

### Views

- composition group list,
- composition group detail,
- compare candidate groups,
- duplicate group finder,
- unresolved group queue,
- route mismatch queue.

### Composition group detail should show

- canonical signature,
- canonical molecule list,
- ingredient order,
- per-ingredient strength and unit,
- dosage form,
- route,
- source inputs,
- generated confidence,
- linked brand products,
- linked pack variants,
- linked prices,
- comparison eligibility.

### Key actions

- approve group,
- edit normalization annotations,
- split group,
- merge group,
- freeze group,
- reopen group for review,
- mark as comparison-safe or comparison-blocked.

### Hard rules

- brand cannot appear in the signature,
- manufacturer cannot appear in the signature,
- price cannot appear in the signature,
- incomplete groups are not comparison-safe,
- metformin release types must not collapse into one group,
- combination products require deterministic ingredient ordering.

## 5. Product Review Queue

### Purpose

Review regulated brand product records before they become customer-visible.

### Queue types

- DRAP import review,
- pharmacy product match review,
- distributor product match review,
- OCR candidate review,
- customer submission review,
- unresolved duplicate review.

### Review list columns

- brand name,
- canonical composition group,
- registration number,
- manufacturer,
- pack status,
- price status,
- confidence score,
- source count,
- alerts,
- reviewer status.

### Product detail panel should show

- registration number,
- registration status,
- registration date,
- brand,
- manufacturer,
- manufacturer country,
- source evidence trail,
- linked composition group,
- pack variants,
- approved price,
- market price,
- images,
- alerts,
- reviewer notes.

### Actions

- approve product,
- mark for follow-up,
- reject match,
- split duplicate,
- assign reviewer,
- escalate to auditor,
- freeze record.

## 6. Pack Variant Management

### Purpose

Manage all independently purchasable pack presentations.

### Why this matters

Pack is the unit of commercial comparison and savings.

### Pack detail should show

- pack size text,
- normalized pack quantity,
- unit count,
- volume,
- weight,
- presentation type,
- linked product,
- linked price records,
- source evidence,
- pack image,
- confidence score,
- comparison eligibility.

### Key actions

- approve pack variant,
- split pack variant,
- merge equivalent pack representations,
- flag ambiguous pack text,
- mark non-normalizable pack,
- attach pack price,
- mark pack as deprecated.

### Rules

- `10 tablets` and `20 tablets` are separate pack variants.
- `1x10's` and `10's` may be equivalent canonical forms if evidence supports it.
- pack variants must never be overwritten by another quantity without review.

## 7. Source Evidence Viewer

### Purpose

Show every source observation behind a field or record.

### Evidence types

- DRAP page capture,
- pharmacy product page,
- distributor catalogue page,
- OCR text extraction,
- product image,
- customer submission,
- internal derived annotation.

### Viewer features

- raw text,
- normalized text,
- source timestamp,
- screenshot or image preview,
- field-level provenance,
- confidence explanation,
- conflicting evidence side-by-side.

### Evidence comparisons

- DRAP vs pharmacy price,
- DRAP vs pharmacy pack size,
- OCR vs structured field,
- distributor vs pharmacy manufacturer,
- multiple pharmacy sources for availability.

### Critical rule

The evidence viewer should never silently pick a winner without showing why.

## 8. Price Intelligence Dashboard

### Purpose

Track market and regulatory price signals and detect anomalies.

### Dashboard sections

- current price spread,
- cheapest equivalent pack,
- price trend by city,
- price trend by pharmacy,
- regulatory approved price vs market price,
- anomaly list,
- change events,
- savings opportunities.

### Core metrics

- average market price,
- lowest market price,
- highest market price,
- approved price,
- price per unit,
- price per tablet,
- price per ml,
- discount percentage,
- price volatility,
- stale price count.

### Views

- product-level price view,
- pack-level price view,
- city view,
- pharmacy view,
- anomaly review queue.

### Rules

- approved price and market price must stay separate,
- pack-level price is the unit used for savings,
- product-only price is informational, not comparison-authoritative.

## 9. Pharmacy Matching Dashboard

### Purpose

Show how pharmacy and distributor products map to canonical composition groups.

### Dashboard sections

- match coverage,
- unresolved products,
- ambiguous products,
- confidence distribution,
- top mismatch reasons,
- recovery by source,
- manual review backlog.

### Rows should show

- source product name,
- source brand,
- source generic,
- source pack,
- source price,
- resolved canonical molecule,
- resolved composition group,
- strength,
- dosage form,
- route,
- confidence,
- review state.

### Core use cases

- identify exact match,
- identify salt/hydrate normalization match,
- identify combination split needed,
- identify broad molecule manual review,
- identify brand contamination.

## 10. AI Audit Center

### Purpose

Detect catalogue quality problems before they reach customers.

### Audit categories

- wrong composition,
- wrong strength,
- duplicate products,
- incorrect pack size,
- invalid substitutions,
- salt normalization error,
- broad molecule contamination,
- release-type collapse,
- brand contamination,
- price inconsistency,
- route mismatch.

### Audit outputs

- issue type,
- severity,
- impacted record,
- source conflict,
- confidence delta,
- suggested action,
- assigned reviewer,
- SLA clock.

### Actions

- quarantine record,
- open review,
- auto-accept with evidence,
- escalate to auditor,
- suppress from customer search,
- restore after correction.

## 11. Catalogue Health Dashboard

### Purpose

Show catalogue completeness and readiness by source, module, and field.

### KPI groups

- identity completeness,
- pack completeness,
- price completeness,
- manufacturer completeness,
- evidence completeness,
- review backlog,
- conflict rate,
- auto-match rate,
- suppressed record count,
- customer-ready record count.

### Recommended health cards

- DRAP field coverage,
- pharmacy recovery coverage,
- distributor recovery coverage,
- unresolved molecules,
- unresolved composition groups,
- pack price coverage,
- image coverage,
- market-price coverage,
- release-type coverage,
- approved-savings readiness.

## 12. User roles

### Super Admin

- full access,
- manage roles and permissions,
- override approvals,
- control source settings,
- release catalogue cutover.

### Data Manager

- manage catalogue records,
- review matches,
- approve packs and products,
- manage evidence,
- operate review queues.

### Auditor

- inspect evidence,
- review anomalies,
- verify confidence logic,
- approve or reject high-risk changes,
- sign off on release readiness.

### Reviewer

- process assigned queues,
- compare evidence,
- mark records ready or blocked,
- add annotations,
- escalate conflicts.

### Analyst

- inspect metrics and trends,
- review dashboards,
- analyze gaps and recovery,
- no write access to authoritative records.

## 13. Approval workflows

### Workflow 1: Molecule approval

1. Source evidence arrives.
2. System proposes canonical molecule.
3. Reviewer checks salt/spelling/broad-molecule policy.
4. Auditor approves or rejects.
5. Molecule becomes eligible for composition grouping.

### Workflow 2: Composition group approval

1. Candidate group is generated.
2. Route, strength, and dosage form are normalized.
3. System checks for duplicates and release conflicts.
4. Reviewer validates evidence.
5. Auditor approves group.
6. Group becomes comparison-safe.

### Workflow 3: Product approval

1. Brand product is matched to a group.
2. Registration number and manufacturer are checked.
3. Pack variants and prices are attached.
4. Reviewer confirms evidence.
5. Auditor signs off.

### Workflow 4: Pack and price approval

1. Pack is extracted from pharmacy/distributor evidence.
2. Normalized pack variant is proposed.
3. Price is attached to pack.
4. Confidence and anomaly checks run.
5. Reviewer approves or flags.

### Workflow 5: Release readiness approval

1. Catalogue health thresholds are checked.
2. Golden samples are validated.
3. High-risk queues are cleared.
4. Auditor approves release.
5. Super Admin authorizes launch.

## 14. Confidence review workflows

### Review levels

- automatic accept,
- reviewer accept,
- reviewer with auditor sign-off,
- quarantine,
- suppress from customer view.

### Rules by confidence band

- 0.95 to 1.00: may auto-accept if no conflict exists.
- 0.80 to 0.9499: reviewer must confirm.
- 0.60 to 0.7999: reviewer plus evidence comparison.
- below 0.60: quarantine or manual rewrite.

### Required explanation fields

- why this field is trusted,
- what sources agree,
- what sources disagree,
- what normalization rule was applied,
- what must happen next.

## 15. KPI dashboards

### Primary KPIs

- total products reviewed,
- percent products customer-ready,
- percent composition groups approved,
- percent pack variants approved,
- percent price records pack-linked,
- percent manufacturer coverage,
- percent route coverage,
- percent registration coverage,
- percent unresolved OCR items,
- average review turnaround time,
- percent automated match success,
- anomaly count by severity.

### Suggested release KPIs

- 95%+ golden sample pass rate,
- 90%+ pack-linked price coverage for active catalogue,
- 90%+ route coverage for comparison-safe products,
- 80%+ manufacturer recovery for customer-facing catalogue,
- review backlog under agreed SLA.

## 16. Alerts and anomaly system

### Alert classes

- regulated identity conflict,
- pack mismatch,
- price anomaly,
- source freshness lapse,
- confidence drop,
- unresolved review aging,
- duplicate product spike,
- molecule normalization regression,
- composition-group split/merge risk,
- customer-facing suppression event.

### Example alert triggers

- DRAP registration number changes unexpectedly.
- Same product appears with two incompatible pack sizes.
- Market price deviates sharply from historical norm.
- OCR claims a salt form that conflicts with curated molecule rules.
- A review queue item remains unresolved beyond SLA.

### Alert delivery

- in-app alert center,
- email for critical issues,
- dashboard badges,
- escalation log.

## 17. MVP admin features

### Must-have MVP

1. Molecule Management.
2. Composition Group Management.
3. Product Review Queue.
4. Pack Variant Management.
5. Source Evidence Viewer.
6. Price Intelligence Dashboard.
7. Pharmacy Matching Dashboard.
8. AI Audit Center.
9. Catalogue Health Dashboard.
10. User Roles and approvals.
11. Alerts for critical anomalies.
12. Release readiness checks.

### MVP operating goal

Enable safe shadow validation and manual approval of the golden catalogue.

## 18. Phase-2 features

1. Advanced analytics and cohort reporting.
2. Per-city comparison heatmaps.
3. Supplier and distributor scorecards.
4. Detailed workflow SLA tracking.
5. Evidence search across images and OCR text.
6. Assisted bulk review tools.
7. Rule simulation and what-if normalization.
8. Reviewer productivity analytics.
9. Automated duplicate clustering.
10. Pack image annotation tools.
11. Customer submission moderation console.
12. Historical release comparisons.

## Recommended MVP Admin Features

- Molecule Management.
- Composition Group Management.
- Product Review Queue.
- Pack Variant Management.
- Source Evidence Viewer.
- Price Intelligence Dashboard.
- Pharmacy Matching Dashboard.
- AI Audit Center.
- Catalogue Health Dashboard.
- User Roles.
- Approval workflows.
- Confidence review workflows.
- Critical alerting.

## Required Before Customer Launch

- composition groups must be approved and comparison-safe,
- pack variants must be normalized and tied to pack prices,
- manufacturer evidence must be sufficient for customer-visible records,
- critical anomalies must be cleared,
- golden samples must pass validation,
- DRAP approved price must remain separate from market price,
- release-type and combination-product edge cases must be resolved,
- customer-facing confidence indicators must be live,
- audit trail and rollback visibility must be ready.

## Can Be Deferred

- advanced analytics,
- cohort reporting,
- deep search over images,
- productivity dashboards,
- detailed SLA trend charts,
- supplier scorecards,
- bulk-assisted review automation,
- what-if rule simulation,
- richer annotation tooling,
- customer submission moderation enhancements,
- historical release comparison views.

## Final recommendation

Build the admin platform as a control center for evidence, confidence, and release readiness.

The platform should not expose raw tables first and workflows second.

It should instead expose:

- a trusted canonical record,
- all supporting evidence,
- the queue state,
- the confidence state,
- and the launch readiness state.

That structure best matches the current codebase, the catalogue refactor plan, and the multi-source architecture DawaiSaver needs for safe customer launch.
