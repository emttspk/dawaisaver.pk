# Data Sources

## Planned Sources

### DRAP Product Database

Primary source for registered products and registration metadata.

### DRAP Registration Updates

Source for new approvals, changes, and discontinuations.

### Manufacturer Websites

Source for product details, pack sizes, strengths, and product availability signals.

### Online Pharmacies

Source for price observations, stock signals, and city-level price intelligence.

### User Bills

Source for real-world purchase prices and product discovery.

### User Prescriptions

Source for demand intelligence and unknown medicine workflows.

### Admin Imports

Controlled import path for verified datasets and manual corrections.

## Required Source Metadata

- source type
- source URL or upload reference
- collection timestamp
- raw payload reference
- confidence score
- adapter version
- audit log reference

## Storage Policy

**Cloudflare R2 Storage Policy:**

- All uploaded files must be stored in Cloudflare R2
- PostgreSQL stores metadata references only
- Railway/Docker local storage is ephemeral
- Files must have checksums for integrity verification

## Historical Policy

Source observations must be preserved. Canonical records can be corrected, but source evidence must not be overwritten.

