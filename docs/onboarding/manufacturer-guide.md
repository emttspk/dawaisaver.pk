# Manufacturer Onboarding Guide

## Overview

Welcome to DawaiSaver.pk! This guide helps manufacturers register and submit verified prices to our platform.

## Step 1: Registration

### Access the Platform
1. Visit `https://admin.dawaisaver.pk`
2. Contact admin@dawaisaver.pk for manufacturer registration access
3. Provide your company details:
   - Company name
   - License number
   - Registration number
   - Contact person and email
   - Website URL

### Registration Form
```
Entity Type: MANUFACTURER
Entity Name: [Your Company]
Contact Person: [Name]
Contact Email: [email@company.com]
Contact Phone: [+92-xxx-xxxxxx]
License Number: [DRAP License]
Registration Number: [Company Reg]
Address: [Full address]
City: [City]
Website URL: [https://company.com]
```

## Step 2: Verification Process

### What We Verify
1. Company registration documents
2. Drug manufacturing license
3. Product portfolio list
4. Authorized product pack sizes

### Timeline
- Submission: Immediate
- Review: 1-3 business days
- Approval: Email notification

## Step 3: Price Submission

### Submission Format
```json
{
  "productId": "uuid",
  "packSize": "100 tablets",
  "price": 1250.00,
  "currency": "PKR",
  "registrationNumber": "012345",
  "effectiveFrom": "2026-06-01",
  "effectiveTo": "2026-12-01"
}
```

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| productId | UUID | Product identifier from catalog |
| packSize | string | Pack configuration (e.g., "100 tablets") |
| price | number | Price in PKR |
| registrationNumber | string | Product registration number |

### Submission Endpoint
```
POST /api/v1/submissions
Authorization: Bearer <token>
Content-Type: application/json
```

## Step 4: Product Information

### Product Catalog
- View your products at `/catalog/manufacturer/{id}`
- Search by registration number or brand name
- Products pre-loaded from DRAP data

### Pack Corrections
If pack size is incorrect:
```json
{
  "type": "PACK",
  "productId": "uuid",
  "corrections": {
    "packSize": "New pack size",
    "registrationNumber": "Updated reg number"
  }
}
```

## Support

- Email: admin@dawaisaver.pk
- Phone: +92-x-xxx-xxxxxx
- Hours: 9AM - 5PM PKT, Monday-Friday