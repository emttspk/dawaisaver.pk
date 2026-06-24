# Verified Pricing Network Report

**Date:** 2026-06-24
**Phase:** Verified Pricing Network Foundation

## 1. Schema Changes

### New Enums
| Enum | Values |
|------|--------|
| `OnboardingEntityType` | MANUFACTURER, DISTRIBUTOR, PHARMACY |
| `OnboardingStatus` | SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED |
| `VerificationClaimType` | PRODUCT_OWNERSHIP, DISTRIBUTOR_AUTHORIZATION, LICENSE_VALIDATION |
| `SubmissionType` | PRICE, PACK, PRODUCT, IMAGE, LEAFLET |

### New Models
| Model | Purpose |
|-------|---------|
| `OnboardingApplication` | Manufacturer/distributor/pharmacy registration |
| `VerificationClaim` | Product ownership and authorization claims |
| `Submission` | Price/pack/product/image/leaflet submissions |
| `TrustScoreHistory` | Historical trust score tracking |

### Updated SourceType
Added `DISTRIBUTOR` to existing `SourceType` enum.

## 2. Onboarding Workflow

### Registration Flow
```
SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
                    ↓
               SUSPENDED (if issues)
```

### OnboardingApplication Fields
- Entity identification: `entityType`, `entityName`
- Contact info: `contactPerson`, `contactEmail`, `contactPhone`
- License/registration: `licenseNumber`, `registrationNumber`
- Location: `address`, `city`, `territory`
- Web presence: `websiteUrl`
- Review: `reviewerId`, `reviewedAt`, `rejectionReason`
- Metrics: `trustScore`, `verifiedProducts`, `confidenceScore`

## 3. Ownership Verification Process

### VerificationClaim Types
| Type | Description |
|------|-------------|
| PRODUCT_OWNERSHIP | Manufacturer owns product |
| DISTRIBUTOR_AUTHORIZATION | Distributor authorized for products |
| LICENSE_VALIDATION | License verification |

### Flow
1. Entity submits claim with supporting docs (JSON)
2. Admin reviews claim
3. Status: PENDING_REVIEW → VERIFIED/REJECTED

## 4. Submission APIs

### Supported Submissions
| Type | Fields |
|------|--------|
| PRICE | productId, packSize, price, currency |
| PACK | productId, packSize, registrationNumber |
| PRODUCT | productId, corrections |
| IMAGE | productId, URL |
| LEAFLET | productId, URL |

### Submission Flow
1. Authenticated entity submits
2. Status: PENDING_REVIEW
3. Admin reviews and approves/correction/rejects

## 5. Trust Score Framework

### Score Calculation
| Factor | Weight |
|--------|--------|
| Verification status | 30% |
| Historical accuracy | 25% |
| Submission quality | 20% |
| Review history | 15% |
| Time since last activity | 10% |

### Storage
- `trustScore` on OnboardingApplication
- `TrustScoreHistory` for audit trail
- `confidenceScore` for individual submissions

## 6. Admin Dashboard

### Display Items
| Section | Data |
|---------|------|
| Pending Verifications | onboarding_applications, verification_claims |
| Pending Price Reviews | verified_prices with PENDING status |
| Pending Submissions | submissions with PENDING status |
| Trust Score Changes | recent TrustScoreHistory entries |

### Services
- `AdminDashboardService` in `src/modules/price/src/review/admin-dashboard.service.ts`
- `AdminReviewService` in `src/modules/price/src/review/admin-review.service.ts`

## 7. Completion Status

| Component | Status |
|-----------|--------|
| Schema Design | ✅ Complete |
| Onboarding Workflow | ✅ Complete |
| Ownership Verification | ✅ Complete |
| Submission APIs | ✅ Complete |
| Trust Score Framework | ✅ Complete |
| Admin Dashboards | ✅ Complete |

**Verified Pricing Network Readiness: 100%**