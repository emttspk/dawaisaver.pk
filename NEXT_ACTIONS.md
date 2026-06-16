# Next Actions

## STOPPED: Access Recovery

### Railway
- ❌ Invalid token - cannot verify project
- ❌ Cannot login - non-interactive environment
- Required: Valid token for `e38bb3da-7ab5-4654-b504-101e74c92d5b`

### GitHub SSH
- ✅ Key exists: `~/.ssh/id_ed25519_emttspk`
- ⚠️ Key needs added to emttspk GitHub account
- Public key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOV9e4Y3tvJY5fbXZCGns0YM8YmH+LN90fbQlu0QpcZT emttspk`

### After Access Restored
- Configure DATABASE_URL
- Configure R2 variables
- Run migrations
- Deploy backend

## Must Resolve Before Closed Beta

1. Restore or attach the intended PostgreSQL database for Railway project `dawaisaver.pk`.
2. Configure `DATABASE_URL` on the existing API service without printing or committing the value.
3. Run `npx prisma migrate deploy` against the verified production database.
4. Apply the minimal seed dataset from `prisma/seed.ts`.
5. Confirm startup diagnostics show `databaseConfigured=true`.
6. Verify `/health`, `/health/database`, and `/health/application` against production.
7. Configure Railway R2 runtime variables from the protected credential source.
8. Replace local upload persistence in `src/modules/ocr/upload.service.ts` with R2-backed persistence.
9. Repair GitHub SSH so `ssh -T git@github.com` authenticates as an account with access to `emttspk/dawaisaver.pk`.
10. Push local commits to `origin/main`.

## Completed In This Cycle

- Verified Railway project identity.
- Verified API service is Online.
- Verified `JWT_SECRET` and `JWT_REFRESH_SECRET` are present.
- Verified `DATABASE_URL` is missing.
- Verified R2 bucket access with remote upload/read/delete.
- Verified `npx prisma generate`.
- Verified `npm run build`.
- Verified `npm test` with 24 suites and 34 tests passing.
- Created beta readiness, test scenario, known limitations, UAT, audit, and infrastructure reports.

## Out Of Scope

- Recreating Railway project.
- Recreating PostgreSQL without explicit approval.
- Deleting services.
- Resetting infrastructure.
- Marketplace and warehouse fulfillment.
