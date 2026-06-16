# Next Actions

## Blocked

### GitHub SSH

- Add `C:\Users\Nazim\.ssh\id_ed25519_emttspk.pub` to the `emttspk` GitHub account under `Settings > SSH and GPG Keys > New SSH Key`.
- Re-run `ssh -T git@github.com`.
- Confirm the account response is `emttspk`.

### Railway

- Obtain a new Railway token with access to `dawaisaver.pk` (`e38bb3da-7ab5-4654-b504-101e74c92d5b`).
- Set the token for the CLI and verify `railway whoami`.
- Verify `railway status` returns the `dawaisaver.pk` project.

## After Access

1. Check whether the project already has Postgres.
2. Attach `DATABASE_URL`.
3. Verify `databaseConfigured=true`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate deploy`.
6. Run `npx prisma db seed`.
7. Verify R2 variables.
8. Replace local upload persistence with R2 persistence.
9. Verify `/health`, `/health/database`, and `/health/application`.
10. Run `npm run build` and `npm test`.

## Current State

- Local repository is clean.
- No production mutation was performed in this turn.
- Railway and GitHub access are the remaining blockers.
