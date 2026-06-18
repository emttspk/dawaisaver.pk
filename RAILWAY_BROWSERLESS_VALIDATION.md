# Railway Browserless Validation

## Date

2026-06-18

## Token Source

- Source: Windows User environment
- Variable: `RAILWAY_TOKEN`
- Token type: Railway project token
- Token name in Railway: `codex-dawaisaver-production`
- Project: `dawaisaver.pk`
- Project ID: `e38bb3da-7ab5-4654-b504-101e74c92d5b`
- Environment: `production`
- Environment ID: `8c0cc558-e375-4d41-8286-21706161c538`
- Service: `dawaisaver.pk`
- Service ID: `d9fc0b7d-535b-4db4-b2eb-93dfc39d31c9`

The token value is intentionally not stored in this repository.

## Credential State

| Check | Result |
|---|---|
| User `RAILWAY_TOKEN` | Present, redacted as `6709...6215`, length 36 |
| User `RAILWAY_API_TOKEN` | Absent |
| Railway browser token fields | Empty in `C:\Users\Nazim\.railway\config.json` |
| Railway session marker files | Absent |
| Windows Credential Manager Railway entries | None found |
| Local project metadata | `.railway/project.json` created with project/environment/service IDs only |

## Validation Commands

Commands used for browserless validation:

```powershell
$env:RAILWAY_TOKEN = [Environment]::GetEnvironmentVariable("RAILWAY_TOKEN", "User")
Remove-Item Env:RAILWAY_API_TOKEN -ErrorAction SilentlyContinue
railway.cmd status
railway.cmd status --json
```

`railway whoami` was also tested. Because the installed credential is a project token, Railway rejects account identity lookup. This is expected for project-token authentication and does not indicate browser dependency.

## Validation Results

| Command | Result |
|---|---|
| `railway.cmd status` | Pass |
| `railway.cmd status --json` | Pass |
| `railway.cmd whoami` | Expected project-token limitation: unauthorized for account identity lookup |

Verified Railway status:

- Workspace: `emttspk's Projects`
- Project: `dawaisaver.pk`
- Project ID: `e38bb3da-7ab5-4654-b504-101e74c92d5b`
- Environment: `production`
- Environment ID: `8c0cc558-e375-4d41-8286-21706161c538`
- Service present in JSON: `dawaisaver.pk`
- Service ID present in JSON: `d9fc0b7d-535b-4db4-b2eb-93dfc39d31c9`
- Public service URL: `https://dawaisaverpk-production.up.railway.app`
- Database present: `Postgres`

The human `railway status` output still displays linked service as `None` because `railway link` requires account/workspace authentication. The local repository link is therefore recorded in `.railway/project.json` using verified Railway IDs, while project-token commands continue to resolve to the correct DawaiSaver project.

## Recovery Procedure

Use this procedure after token rotation:

```powershell
reg delete "HKCU\Environment" /v "RAILWAY_API_TOKEN" /f 2>$null
[Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", "<fresh-dawaisaver-project-token>", "User")
```

Then restart:

- VS Code
- Codex
- Kilo Code
- All open terminals

Validate:

```powershell
$env:RAILWAY_TOKEN = [Environment]::GetEnvironmentVariable("RAILWAY_TOKEN", "User")
Remove-Item Env:RAILWAY_API_TOKEN -ErrorAction SilentlyContinue
railway.cmd status
```

The command must report project `dawaisaver.pk` and project ID `e38bb3da-7ab5-4654-b504-101e74c92d5b`.

## Permanent Authentication Standard

- Use exactly one Railway credential source on this workstation: Windows User `RAILWAY_TOKEN`.
- Do not set `RAILWAY_API_TOKEN` unless a separate account/workspace token is intentionally introduced.
- Do not use browser login for Codex, Kilo Code, VS Code automation, or CI.
- Do not store Railway token values in repo files.
- Keep `.railway/project.json` limited to non-secret project metadata.
- Treat `railway whoami` as non-authoritative when using a project token.
- Treat `railway status` and `railway status --json` as the project-token validation commands.
