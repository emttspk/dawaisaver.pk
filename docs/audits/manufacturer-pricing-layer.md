# Manufacturer Pricing Layer Report

**Date:** 2026-06-24
**Phase:** Manufacturer Verified Pricing

## 1. Schema Changes

### New Enums
| Enum | Values |
|------|--------|
| `PriceVerificationStatus` | PENDING, VERIFIED, REJECTED, EXPIRED |
| `PriceSourceVerification` | MANUFACTURER_VERIFIED, DISTRIBUTOR_VERIFIED, PHARMACY_OBSERVED, CUSTOMER_REPORTED |
| `SourceType` | Added `DISTRIBUTOR` |

### New Models

#### DistributorProfile (schema.prisma:2259-2293)
- `id` (UUID, primary key)
- `distributorName` (string)
- `licenseNumber` (string, optional)
- `registrationNumber` (string, optional)
- `address` (string, optional)
- `city` (string, optional)
- `phone`, `email`, `websiteUrl` (optional)
- `territory` (string array)
- `trustScore` (Decimal, optional)
- `status` (RecordStatus)
- `confidenceScore` (Decimal, optional)

#### DistributorProductOwnership (schema.prisma:2295-2327)
- `id` (UUID, primary key)
- `distributorId` (UUID, relation to DistributorProfile)
- `productId` (UUID, relation to Product)
- `packSize` (string, optional)
- `registrationNumber` (string, optional)
- `manufacturingLicense` (string, optional)
- `ownershipProof` (JSON, optional)
- `status` (RecordStatus)

#### VerifiedPrice (schema.prisma:2329-2368)
- `id` (UUID, primary key)
- `productId` (UUID, required)
- `packSize` (string, optional)
- `price` (Decimal 12,2, required)
- `currency` (string, default "PKR")
- `sourceVerification` (PriceSourceVerification)
- `verificationStatus` (PriceVerificationStatus)
- `submittedById` (UUID, optional)
- `reviewerById` (UUID, optional)
- `reviewNotes` (string, optional)
- `effectiveFrom`, `effectiveTo` (DateTime, optional)
- `status` (RecordStatus)
- `confidenceScore` (Decimal, optional)

#### PriceConfidence (schema.prisma:2370-2408)
- `id` (UUID, primary key)
- `entityType` (string)
- `entityId` (UUID)
- `priceSource` (SourceType, optional)
- `confidenceScore` (Decimal 5,4)
- `verificationStatus` (PriceVerificationStatus)
- `verifiedBy` (string, optional)
- `verifiedAt`, `effectiveDate`, `expiryDate` (DateTime, optional)
- `status` (RecordStatus)

## 2. Price Types Supported

| Type | Priority | Description |
|------|----------|-------------|
| MANUFACTURER_VERIFIED | 1 | Direct from manufacturer |
| DISTRIBUTOR_VERIFIED | 2 | Through authorized distributor |
| PHARMACY_OBSERVED | 3 | Scraped from pharmacies |
| CUSTOMER_REPORTED | 4 | User submitted prices |
| DRAP_APPROVED | 5 | Official DRAP prices |

## 3. Manufacturer Workspace Features

### Product Ownership Verification
- Distributor can claim ownership of products
- Requires license number and manufacturing proof
- Status: PENDING_REVIEW → VERIFIED/REJECTED

### Price Submission
- Submit verified prices with pack size
- Set effective date range
- Attach supporting documentation

### Pack Submission
- Submit pack configurations
- Include registration numbers
- Upload product images and leaflets (metadata field)

## 4. Confidence Model

### Score Calculation Factors
- Source verification status (50%)
- Verification method (25%)
- Historical accuracy (15%)
- Reviewer confidence (10%)

### Storage
- `confidenceScore` field on VerifiedPrice
- `PriceConfidence` model for entity-level scoring
- `effectiveDate`/`expiryDate` for temporal confidence

## 5. Admin Review Workflow

### Review Actions
1. **Price Updates**
   - Approve verified prices
   - Reject with notes
   - Request corrections

2. **Product Corrections**
   - Approve product details
   - Apply corrections to fields
   - Re-normalize signatures

3. **Pack Corrections**
   - Approve pack configurations
   - Update pack sizes
   - Verify registration numbers

### Service Layer
- `AdminReviewService` in `src/modules/price/src/review/admin-review.service.ts`
- Methods: `reviewPrice()`, `reviewProduct()`, `reviewPack()`

## 6. Integration Points

### Existing Tables Used
- `Product` - prices linked to products
- `Pharmacy` - existing price observation
- `ProductPack` - pack configurations
- `SourceProvider` - provider tracking

### New Relationships
```
DistributorProfile ────► DistributorProductOwnership ◄──── Product
                             │
                             ▼
VerifiedPrice ◄─────────── Product
```

## 7. Completion Status

| Component | Status |
|-----------|--------|
| Schema Design | ✅ Complete |
| Distributor Profile | ✅ Complete |
| Verified Price Model | ✅ Complete |
| Confidence Model | ✅ Complete |
| Admin Review Workflow | ✅ Complete |

**Manufacturer Pricing Layer Readiness: 100%**