# Canonical Product Builder - Design Report

## Overview
Preparation for Phase 52 implementation. No schema changes in this stage.

## Canonical Identity
- **Primary Key**: `canonicalId` - UUID v1.0 format
- **Identity Source**: Bridge mapping from WHO molecule
- **Version**: Stored in `canonical_dataset_version` field

## Product Signature
- **Core Fields**:
  - `genericName` - Linked to WHO molecule
  - `strength` - Standardized format (mg, mcg, IU)
  - `form` - Tablet, capsule, injection, etc.
  - `pack` - Number of units per pack

## Brand Linkage
- **Brand-Generic Relationship**:
  - `brandId` -> `canonicalId` (many-to-one)
  - `brandName` - Manufacturer brand name
  - `manufacturerId` - Link to manufacturer registry

## Registration Linkage
- **Health Canada**:
  - `dinaId` - DINA registration number
  - `ndpbrId` - Natural Product Number (NPN)
- **FDA**:
  - `ndaAnDA` - NDA/ANDA number
- **WHO**:
  - `whoAtcCode` - ATC classification code

## Pack Variants
- **Structure**:
  - `packId` - Unique pack identifier
  - `canonicalId` - Product canonical reference
  - `unitsPerPack` - 1, 3, 5, 10, 30, 100
  - `packType` - Blister, bottle, strip, sachet

## Price History
- **Tracking**:
  - `priceId` - Price record UUID
  - `canonicalId` - Product reference
  - `drapPrice`, `drapPriceDate`
  - `pharmacy1Price`, `pharmacy2Price`, etc.
  - `source` - DRAP official, pharmacy scraping

## Manufacturer Linkage
- **Registry**:
  - `manufacturerId` - Master manufacturer record
  - `applicationId` - Application number
  - `licenseNumber` - Manufacturing license
  - `status` - ACTIVE, INACTIVE, SUSPENDED

## Applicant Linkage
- **Relationship**:
  - `applicantId` - Person/company applying
  - `manufacturerId` - Linked manufacturer
  - `applicationType` - NEW, RENEWAL, AMENDMENT

## Migration Strategy
1. **Pre-flight**: Run bridge against all DRAP generics
2. **Phase 1**: Import WHO molecules (3000+ entries)
3. **Phase 2**: Extract DRAP unique variants
4. **Phase 3**: Match + AI review
5. **Phase 4**: Freeze Canonical Dataset v1.0
6. **Phase 5**: Build canonical products from approved mappings
7. **Phase 6**: Link brands and registrations
8. **Phase 7**: Validate against production data

## Ready Indicators
- ✅ Bridge engine validated
- ✅ Coverage ≥95%
- ✅ AI review queue contains exceptional cases only