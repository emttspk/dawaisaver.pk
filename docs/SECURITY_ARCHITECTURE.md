# Security Architecture

## Data Classes

- account data
- prescription images
- pharmacy bill images
- OCR text
- medicine catalog data
- price observations
- admin actions
- audit events

## Security Controls

- role-based access control for users and admins
- least-privilege service credentials
- encrypted transport
- encrypted object storage
- audit logs for sensitive actions
- signed upload URLs
- malware and file-type validation for uploads
- retention policy for user documents
- admin review for sensitive intelligence changes

## Privacy Rules

- Collect only data needed for medicine intelligence workflows.
- Separate uploaded user documents from canonical catalog data.
- Do not expose personal prescription or bill data to crawlers or external partners.
- Redact personal information where possible before review workflows.

## Threat Model

Primary risks:

- leaking prescription or bill images
- poisoning medicine or price data
- unauthorized admin actions
- unsafe medical recommendation wording
- crawler abuse or blocking
- marketplace fraud

## Audit Requirements

Audit logs must capture actor, action, target, timestamp, source IP where available, before/after references where safe, and correlation ID.

