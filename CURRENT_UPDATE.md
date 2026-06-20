# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk

## Migration Forensics

- Original migration commit: `2e99f7d205655c6b68d53736355d31f0a6974b9e`.
- UTF-8 conversion commit: `aa3596cea88685ba08469badfb6973a2ed3d467e`.
- Reserved-column fix commit: `fc3892e6db88562a71bbc151a977b6ae6a5d8c8f`.
- Repository migration SHA-256: `240E1AE8BAE927988B2CF293A30D208569BAAD1736C4D9782DBCB785E0444291`.
- Repository blob: `223652053098d8aa0312445f779d7349746434a1`.
- Repository file is valid UTF-8, has no BOM, has no NUL bytes, and line 193 is `is_primary BOOLEAN DEFAULT false`.
- Production byte signature `ff fe 2d 00 2d 00` and unquoted line 193 prove the running image predates both repair commits.
- The repo has no `.github/workflows` directory and `railway.json` plus `.railway/project.json` were removed in `52f7e2e`, so the codebase expects Coolify rather than Railway.
- The remaining fix is source-of-truth alignment: the migration and Prisma model now use `is_primary`, with `ProductTherapeuticCategory.isPrimary` mapped to the database column.
- Docker copies `/app/prisma` from the current builder stage; the stale artifact therefore came from an external deployment trigger / old platform linkage, not the current Docker COPY path.

## Guardrails

- `.gitattributes` now enforces UTF-8 with LF endings for SQL files.
- `.editorconfig` already enforces UTF-8 editor saves.
- Docker build now fails if the migration has a BOM, NUL bytes, invalid UTF-8, or an unquoted reserved column.

## Deployment

- Guardrail commit `3d8cf0c645ace918c60029900e79d416f0049953` is pushed and verified on GitHub `main`.
- Local `npm run build` succeeds after Prisma client regeneration.
- `prisma migrate status` and `prisma migrate deploy` are blocked locally because no reachable `DATABASE_URL` endpoint is available in this workspace.
- Mirror routes are present in source and guarded by `AdminGuard` plus bearer auth: `/admin/mirror-status`, `/admin/mirror/runtime`, `/admin/mirror/archive-status`, `/admin/mirror/start`, `/admin/mirror/pause`, `/admin/mirror/resume`, and `/admin/mirror/stop`.
- The acquisition job resumes from the stored checkpoint in `import_batches.metadata.acquisition.checkpoint`; it does not reset progress unless a fresh batch is created.
- `getMirrorRuntimeState()` keeps the mirror paused whenever `MIRROR_ENABLED=false`, `MIRROR_MIGRATION_MODE=true`, or the control record is `paused`/`stopped`.
- Coolify auto-deploy, container hash verification, route checks, and live mirror resume still require production access through Coolify or SSH.
- GitHub repository integration settings are not exposed in this workspace, so the retired Railway webhook/app connection cannot be removed from code alone.
- Archive docs have been refreshed to reflect the DRAP mirror resume phase.

## DRAP

- Last recorded progress remains around 43,000 processed of 199,000, with the mirror paused awaiting live resume from the existing checkpoint.
- Mirror remains paused pending a successful production resume and verification pass.
