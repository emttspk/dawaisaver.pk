# Distributor Onboarding Guide

## Overview

Welcome to DawaiSaver.pk! This guide helps distributors register and submit verified prices for the products you distribute.

## Step 1: Registration

### Access the Platform
1. Visit `https://admin.dawaisaver.pk`
2. Contact admin@dawaisaver.pk for distributor registration access
3. Provide your company details:
   - Distributor name
   - License number
   - Governing authority
   - Territory (cities/regions served)
   - Contact information

### Registration Form
```
Entity Type: DISTRIBUTOR
Entity Name: [Your Company]
Contact Person: [Name]
Contact Email: [email@distributor.com]
Contact Phone: [+92-xxx-xxxxxx]
License Number: [Distributor License]
Registration Number: [Company Reg]
Address: [Full address]
City: [City]
Territory: ["Karachi", "Lahore", "Islamabad"]
Website URL: [https://distributor.com]
```

## Step 2: Product Authorization

### Claim Products
Submit product ownership claims for each product you distribute:

```json
{
  "claimType": "DISTRIBUTOR_AUTHORIZATION",
  "entityId": "your-distributor-id",
  "productId": "product-uuid",
  "productSignature": "paracetamol_500mg_tablet",
  "supportingDocs": {
    "authorizationLetter": "url-to-document",
    "agreementCopy": "url-to-agreement"
  }
}
```

### Verification Process
1. Submit authorization documents
2. Our team verifies your authorization
3. Products appear in your catalog

## Step 3: Price Submission

### Submission Format
```json
{
  "productId": "uuid",
  "packSize": "100 tablets",
  "price": 1350.00,
  "currency": "PKR",
  "effectiveFrom": "2026-06-01",
  "effectiveTo": "2026-12-01"
}
```

### Bulk Submission
For multiple products:
```json
{
  "type": "PRICE",
  "entityId": "your-distributor-id",
  "payload": [
    { "productId": "uuid1", "packSize": "10s", "price": 100 },
    { "productId": "uuid2", "packSize": "10s", "price": 150 }
  ]
}
```

## Step 4: Territory Management

### Configure Your Territory
Set the cities where you operate:
```json
{
  "territory": ["Karachi", "Hyderabad", "Mirpurkhas"]
}
```

Prices are filtered by territory for localized comparisons.

## Step 5: Product Images & Leaflets

### Upload Product Media
```json
{
  "type": "IMAGE",
  "productId": "uuid",
  "payload": {
    "productImage": "https://storage.url/image.jpg",
    "leaflet": "https://storage.url/leaflet.pdf"
  }
}
```

## Support

- Email: admin@dawaisaver.pk
- Phone: +92-x-xxx-xxxxxx
- Hours: 9AM - 5PM PKT, Monday-Friday