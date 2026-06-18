# Current Update - Railway Auth Recovery Audit

## Date

2026-06-18

## Status

Railway authentication sources were inspected and a likely user-level token source was found, but Railway still rejects it. Production backup prerequisites remain blocked, and no production data was modified.

## Auth Findings

- Current process environment contains stale Railway tokens.
- Windows user environment contains a different Railway token value.
- System environment does not expose Railway tokens.
- PowerShell profile auto-loads the Windows user token into new sessions and clears `RAILWAY_API_TOKEN`.
- Railway CLI returns `Unauthorized` or `Invalid RAILWAY_TOKEN` with both the inherited process token and the user token.
- Local Railway config cache is empty.
- Windows Credential Manager has no Railway entries.
- Git Bash profile does not define Railway auth.

## Token Findings

- Current process token: invalid or stale.
- Windows user token: invalid or wrong-account from this shell’s perspective.
- No valid workspace token is available in the current environment.
- No project transfer or auth refresh could be confirmed from this shell.

## Production Access

- Local project metadata remains present at `.railway/project.json`.
- Recorded IDs:
  - Project: `e38bb3da-7ab5-4654-b504-101e74c92d5b`
  - Environment: `8c0cc558-e375-4d41-8286-21706161c538`
  - Service: `d9fc0b7d-535b-4db4-b2eb-93dfc39d31c9`
- Live access to Railway variables, PostgreSQL, and service metadata is blocked until Railway auth is restored.

## Backup Prerequisite Status

- `backup-prerequisites-check.md` was created in the latest backup folder.
- `DATABASE_URL`: blocked
- R2 credentials: blocked
- Required production variables: blocked
- Safest retrieval method: fresh valid Railway auth in an interactive terminal, then `railway variable list` for the linked service.

## Deletion Report

- `deletion-report.md` was created.
- No markdown files were deleted.
- The unused markdown review did not produce any safely deletable files.

## Migration Readiness

- Dockerfile compatibility with Coolify: good.
- Prisma migrations: present and deploy-ready in structure.
- Startup command: `node dist/main.js`.
- Build command: `npm.cmd run build` passes.
- Health endpoints: `/health/application` and `/health/database` are present.
- Cloudflare Pages apps still depend on `VITE_API_URL` for non-default environments.
- DRAP autorun remains disabled by policy for migration work.

## Command Results

- `railway whoami`: unauthorized
- `railway status`: unauthorized / invalid token
- `railway status --json`: unauthorized / invalid token
- `railway login --browserless`: not usable in non-interactive mode
- `cmdkey /list`: no Railway stored credentials
- `npm.cmd run build`: pass

## Completion

- Backup readiness: `55%`
- Migration readiness: `70%`
- Auth recovery: `40%`

## Blockers

- Railway auth cannot be recovered from this shell without a fresh valid token or interactive login.
- `DATABASE_URL` and R2 secrets cannot be read until Railway auth is restored.
- `psql` is not installed in this shell, so even with `DATABASE_URL` the backup dry run would still need a local client install.

## Next Action

Open an interactive terminal, refresh Railway auth with a valid token or browser login, then rerun `railway status`, `railway variable list`, and the backup prerequisite audit before attempting `pg_dump` or R2 verification.
