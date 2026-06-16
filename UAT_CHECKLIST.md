# UAT Checklist

## Infrastructure Gate

- [ ] Railway API service is Online.
- [ ] `DATABASE_URL` is configured.
- [ ] Startup diagnostics show `databaseConfigured=true`.
- [ ] `/health/application` returns OK.
- [ ] `/health/database` returns OK.
- [ ] `/health` returns OK.
- [ ] Prisma migrations are deployed.
- [ ] Minimal seed data is applied.
- [ ] R2 runtime variables are configured in Railway.
- [ ] Upload persistence stores files in R2.
- [ ] GitHub SSH push succeeds.

## Functional Gate

- [ ] User registration works.
- [ ] User login works.
- [ ] Medicine search works.
- [ ] Product details load.
- [ ] Alternatives display with approved safety wording.
- [ ] Prescription text processing works.
- [ ] OCR upload flow works with R2 persistence.
- [ ] Admin review queues load.
- [ ] Admin/reviewer authorization works.

## Beta Exit Criteria

- [ ] No critical auth issues.
- [ ] No data loss in prescription workflows.
- [ ] No local filesystem persistence for user uploads.
- [ ] Search and alternatives work on seeded data.
- [ ] Known limitations are shared with testers.
