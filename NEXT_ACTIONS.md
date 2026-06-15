# Next Actions

## Immediate Next Task

Prescription Processing Pipeline.

## Scope

- Build prescription parsing and prescription-item matching workflows on top of the controller layer.
- Preserve existing REST contracts, response envelopes, and Swagger docs while adding prescription-specific endpoints later.
- Keep the new pipeline compatible with the current `/api` prefix and controller module structure.

## Preconditions

- API Controller Layer exists and builds.
- Product Discovery Engine exists.
- Search API Foundation exists.
- Canonical matching exists.
- Price intelligence exists.
- Source and DRAP ingestion foundations exist.

## Out of Scope

- Frontend
- OCR
- Marketplace
- Warehouse fulfillment
