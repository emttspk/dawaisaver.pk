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
- Coolify auto-deploy, container hash verification, route checks, and mirror resume still require live production access.
- GitHub repository integration settings are not exposed in this workspace, so the retired Railway webhook/app connection cannot be removed from code alone.

## DRAP

- Last recorded progress: 43,000 processed of 199,000 (21.6%), 41,175 successful, 1,825 failed.
- Mirror remains paused pending a successful migration deployment and route verification.
