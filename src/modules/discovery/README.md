# Product Discovery Engine

## Purpose

The Product Discovery Engine creates a self-learning discovery system for medicines that appear in DRAP imports, pharmacy snapshots, search queries, unknown product flows, and future bill or prescription imports.

## Files

- `discovery.module.ts`: module factory and exports
- `discovery.service.ts`: internal service facade
- `product-discovery.service.ts`: discovery orchestration
- `candidate-generator.service.ts`: provisional product candidate generation
- `evidence-collector.service.ts`: source evidence capture
- `discovery-review.service.ts`: admin review transitions
- `discovery.types.ts`: DTOs and contracts

## Architecture Diagram

```mermaid
flowchart TD
  Source[Discovery Source] --> Candidate[Candidate Generator]
  Source --> Evidence[Evidence Collector]
  Candidate --> Confidence[Discovery Confidence]
  Evidence --> Confidence
  Confidence --> Review[Discovery Review]
  Review --> Approved[Approved / Rejected / Merged]
```

## Sequence Diagram

```mermaid
sequenceDiagram
  participant Source
  participant Discovery as DiscoveryService
  participant Candidate as CandidateGenerator
  participant Evidence as EvidenceCollector
  participant Review as DiscoveryReview

  Source->>Discovery: discoverProduct(input)
  Discovery->>Candidate: generateCandidate(input)
  Discovery->>Evidence: collectEvidence(input)
  Discovery-->>Source: candidate + evidence
  Source->>Discovery: review(candidate, decision)
  Discovery->>Review: applyReview()
```

## Test Plan

- Generate candidates from unknown brand, generic, signature, and manufacturer inputs.
- Verify confidence combines source, matching, and evidence confidence.
- Verify duplicates are detected against known canonical products, aliases, products, and signatures.
- Verify review decisions move candidates to approved, rejected, merged, or collecting evidence.

## Current Verification Limit

This workspace has no `package.json`, test runner, generated Prisma client, backend runtime, or live database.

