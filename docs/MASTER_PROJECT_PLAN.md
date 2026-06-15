# DawaiSaver.pk Master Project Plan

## Vision

DawaiSaver.pk is a medicine intelligence platform for Pakistan. It helps users understand prescriptions, compare equivalent medicines, optimize costs, analyze pharmacy bills, track pharmacy prices, and later connect with verified pharmacies and warehouse fulfillment.

This is not a pharmacy website clone. The core product is intelligence: normalization, equivalence, price comparison, savings analysis, and reviewable recommendations.

## Guiding Principles

- Build governance and architecture before implementation.
- Preserve historical source records; never overwrite evidence.
- Keep all intelligence explainable and reviewable.
- Treat medical, pricing, and pharmacy data as high-integrity data.
- Make the platform recoverable by future maintainers and AI agents.

## Phase Plan

### Phase 0: Governance

Deliver documentation, recovery files, architecture plans, and decision logs. No application code is implemented in this phase.

### Phase 1: Foundation

Create the data model, migration strategy, ERD, and normalization strategy for the master medicine database.

### Phase 2: Data Collection Engine

Create modular adapters for DRAP, manufacturer sites, online pharmacies, user uploads, bills, prescriptions, and admin imports.

### Phase 3: Medicine Normalization Engine

Implement canonical medicine signatures, duplicate detection, fuzzy matching, and confidence scoring.

### Phase 4: Intelligence Engine

Implement alternative recommendations, price intelligence, demand intelligence, city-wise intelligence, prescription optimization, and unknown medicine workflows.

### Phase 5: User Application

Build the mobile-first PWA with camera-first prescription and bill upload workflows.

### Phase 6: Admin Application

Build review queues, crawler monitoring, analytics, OCR review, unknown product review, and price review workflows.

### Phase 7: Pharmacy Marketplace

Design first, then later implement pharmacy onboarding, verification, quote routing, order routing, and commissions.

### Phase 8: Warehouse Expansion

Document future architecture for inventory, expiry management, batch tracking, supplier management, and fulfillment.

## Technology Direction

- Frontend: React, Vite, Tailwind, PWA
- Backend: Node.js, NestJS preferred
- Database: PostgreSQL with Prisma
- Jobs: BullMQ with Redis
- Storage: Cloudflare R2
- Crawling: Playwright and Cheerio
- Architecture: Domain Driven Design, repository pattern, service layer, adapters, event-driven processing

## Phase Gates

Each phase must include architecture, database impact, security review, test plan, and updates to recovery documentation before the next phase begins.

