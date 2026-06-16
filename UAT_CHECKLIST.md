# UAT Checklist

## Ready

- [x] Search test
- [x] Alternative test
- [x] Login test
- [x] Prescription text test
- [x] OCR upload test at bucket level
- [x] Admin review test
- [x] Health endpoint test

## Verification Notes

- Search test: confirm seeded products return stable results.
- Alternative test: confirm alternate products appear for canonical medicine matches.
- Login test: confirm user and admin auth flows remain intact.
- Prescription text test: confirm OCR text extraction reaches the review pipeline.
- OCR upload test: confirm R2 object create/read/delete succeeds.
- Admin review test: confirm review workflow accepts and records decisions.
- Health endpoint test: confirm `/health`, `/health/application`, and `/health/database` remain healthy.
