# Known Limitations

## Production Infrastructure

- `DATABASE_URL` is missing from Railway.
- No Railway Postgres resource is visible in the current project resource list.
- Production migrations have not been applied.
- Production seed data has not been applied.
- Railway R2 runtime variables are missing.
- GitHub SSH push is blocked by public key rejection.

## Product Capability

- Provider-specific pharmacy source adapters are not implemented.
- OCR providers are scaffolded; production provider credentials are not configured.
- Upload service currently writes to local filesystem and must be migrated to R2.
- Minimal seed data is intentionally tiny and is not a full medicine corpus.
- Marketplace and warehouse workflows are out of scope for closed beta.

## Operational

- Railway public domain was not generated during this task to avoid creating an unrequested external endpoint.
- Reports avoid raw secret values by design.
