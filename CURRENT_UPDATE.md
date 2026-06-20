# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk

## Migration Forensics

- Original migration commit: `2e99f7d205655c6b68d53736355d31f0a6974b9e`.
- UTF-8 conversion commit: `aa3596cea88685ba08469badfb6973a2ed3d467e`.
- Reserved-column fix commit: `fc3892e6db88562a71bbc151a977b6ae6a5d8c8f`.
- Repository migration SHA-256: `213A901B2AC9EF6BDB13D7EAF0EC59E09475F7187E69F5B728916D32B7DEB3F8`.
- Repository blob: `1edb4e4039f9963b0303c2fa08c0525847d24d0a`.
- Repository file is valid UTF-8, has no BOM, has no NUL bytes, and line 193 is `"primary" BOOLEAN DEFAULT false`.
- Production byte signature `ff fe 2d 00 2d 00` and unquoted line 193 prove the running image predates both repair commits.
- Docker copies `/app/prisma` from the current builder stage; the stale artifact therefore came from an old Coolify source revision/build context, not the current Docker COPY path.
- GitHub commit status shows pushes still trigger Railway project `e38bb3da-7ab5-4654-b504-101e74c92d5b`; no Coolify deployment is registered. Coolify is therefore disconnected from the active Git push pipeline and retained its older image.

## Guardrails

- `.gitattributes` now enforces UTF-8 with LF endings for SQL files.
- `.editorconfig` already enforces UTF-8 editor saves.
- Docker build now fails if the migration has a BOM, NUL bytes, invalid UTF-8, or an unquoted `primary` column.

## Deployment

- Guardrail commit `3d8cf0c645ace918c60029900e79d416f0049953` is pushed and verified on GitHub `main`.
- GitHub reported a Railway deployment for that commit and no Coolify deployment; the Railway deployment failed.
- Coolify deployment is blocked from this shell because no Coolify URL/token or SSH host is configured.
- `api.dawaisaver.pk` and `dawaisaver.pk` currently return public DNS `NXDOMAIN`.
- Production hash comparison, no-cache rebuild, in-container checks, Prisma deploy, route checks, and mirror resume remain pending until production access is available.

## DRAP

- Last recorded progress: 43,000 processed of 199,000 (21.6%), 41,175 successful, 1,825 failed.
- Mirror remains paused pending a successful migration deployment and route verification.
