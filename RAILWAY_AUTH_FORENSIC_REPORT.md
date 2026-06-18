# Railway Auth Forensic Report

## Date

2026-06-18

## Root Cause

Railway authentication was inconsistent because multiple tools inherited different Railway token sources, and none of the discovered active tokens were valid for the expected DawaiSaver.pk Railway project.

Expected Railway target:

- Project: `dawaisaver.pk`
- Project ID: `e38bb3da-7ab5-4654-b504-101e74c92d5b`
- Expected service: `dawaisaver.pk`

Conflicting sources found:

| Source | State | Result |
|---|---|---|
| Current Codex process env | `RAILWAY_TOKEN` and `RAILWAY_API_TOKEN` set to the same 36-character token, redacted as `aa4c...fcf7` | Railway rejected it as invalid |
| Windows User env / `HKCU\Environment` | `RAILWAY_TOKEN` and `RAILWAY_API_TOKEN` set to the same 43-character token, redacted as `wGLP...nAxv` | Railway rejected it as unauthorized |
| Historical automation token | Project-scoped token used in prior Railway commands | Resolved to a non-DawaiSaver project |
| Railway browser login cache | `C:\Users\Nazim\.railway\config.json` exists, but token fields are empty | No usable browser login |
| Railway project link | No workspace `.railway` directory in `D:\DawaiSaver.pk` | No stable local project link |

## Evidence

| Check | Result |
|---|---|
| `railway.cmd whoami` with inherited env | Unauthorized / invalid `RAILWAY_TOKEN` |
| `railway.cmd status` with inherited env | Invalid `RAILWAY_TOKEN` |
| `railway.cmd whoami` after clearing Railway env vars | `Please login` |
| `railway.cmd status` after clearing Railway env vars | `Please login` |
| Explicit Windows User token test | Unauthorized |
| Historical automation token test | Wrong project context, not DawaiSaver |
| `cmdkey.exe /list` filtered for Railway | No Railway Credential Manager entries |

Historical project docs also record prior wrong contexts:

- Obsolete Railway forensic reports recorded a non-DawaiSaver linked project.
- `ENVIRONMENT_AUDIT.md`: same wrong project warning
- `PROJECT_RISKS.md`: requires DawaiSaver project ID before Railway mutations
- `PROJECT_MEMORY.md`: expected project is `dawaisaver.pk` (`e38bb3da-7ab5-4654-b504-101e74c92d5b`)

## Credential Locations

| Location | Finding | Action |
|---|---|---|
| Current Codex process env | Stale inherited Railway vars still appear in child commands | Restart Codex/VS Code to flush |
| `HKCU\Environment` | Stale `RAILWAY_TOKEN` and `RAILWAY_API_TOKEN` | Deleted |
| `C:\Users\Nazim\.railway\config.json` | Empty `user.token`, `accessToken`, and `refreshToken` | No secret remains |
| `C:\Users\Nazim\.railway\sessions\*.session` | Stale session marker | Deleted |
| `C:\Users\Nazim\.codex\.sandbox\*.log` | Historical command lines contain Railway token assignments | Credential residue, not active auth |
| VS Code global/workspace storage | Railway-related binary/history matches | Credential residue, not active auth |
| Repo `.env.example`, `.env.test`, `apps\admin\.env` | No active Railway auth variables | No action |
| PowerShell profile and Git Bash profile search | No Railway auth variables | No action |
| VS Code `settings.json` | No Railway token setting | No action |

## CLI Storage And Precedence

Installed Railway CLI:

- Path: `C:\Users\Nazim\AppData\Roaming\npm\railway.cmd`
- Version: `railway 4.66.0`
- User config: `C:\Users\Nazim\.railway\config.json`
- Session markers: `C:\Users\Nazim\.railway\sessions\*.session`

The installed CLI README states:

- `RAILWAY_TOKEN` is for project-level actions.
- `RAILWAY_API_TOKEN` is for account/workspace-level actions.
- `railway login --browserless` is the browserless login path.

Observed precedence:

1. Environment tokens are used before stored browser credentials.
2. `RAILWAY_TOKEN` drives project-level commands and fails hard if invalid.
3. `RAILWAY_API_TOKEN` drives account/workspace commands and fails if invalid or project-scoped.
4. If env vars are cleared, the CLI falls back to `C:\Users\Nazim\.railway\config.json`.
5. If stored login tokens are empty, CLI returns `Please login`.

Proof: clearing both Railway env vars changed the CLI error from invalid token to `Please login`.

## Tool Matrix

| Tool | Credential Source Observed | Account / Workspace | Project Access |
|---|---|---|---|
| Railway CLI in current Codex | Inherited invalid env token | Unknown | None |
| Clean CLI process | Empty Railway config after env clear | None | None |
| Fresh normal terminal after cleanup | No HKCU Railway env vars | None until fresh token is set | None until fresh token is set |
| Codex | Parent process currently still injects stale Railway vars | Unknown | Requires restart and fresh token |
| Kilo Code / VS Code | No token in settings; may inherit VS Code env or use extension browser auth | Requires restart after cleanup | Requires fresh token |
| VS Code Railway extension | No active token setting found; possible state DB residue | Not proven active | Not proven active |
| GitHub workflows | No Railway workflow token found in this workspace | Not applicable | Not applicable |

## Permanent Fix Applied

Completed:

- Deleted stale Windows User `RAILWAY_TOKEN`.
- Deleted stale Windows User `RAILWAY_API_TOKEN`.
- Removed stale Railway session marker files.
- Verified Railway Credential Manager has no Railway entries.
- Verified project `.env` files do not contain active Railway auth variables.
- Installed the new DawaiSaver project token as Windows User `RAILWAY_TOKEN`.
- Verified Windows User `RAILWAY_API_TOKEN` is absent.
- Added `.railway/project.json` with non-secret project metadata.
- Verified `railway status` resolves to project `dawaisaver.pk`.
- Verified `railway status --json` resolves to project ID `e38bb3da-7ab5-4654-b504-101e74c92d5b`.

Known limitation:

The current already-running Codex host still injects inherited stale process variables into child commands. Restarting VS Code/Codex/Kilo Code and all terminals is required for those tools to inherit the corrected Windows User environment. Until that restart, Railway commands from this Codex session must explicitly load the User token into the process environment.

## Railway Auth Standard

- Use exactly one active Railway token source.
- Use `RAILWAY_API_TOKEN` only for an account/workspace token.
- Use `RAILWAY_TOKEN` only for a DawaiSaver project token.
- Do not set both names to the same token unless Railway explicitly documents that token as valid for both surfaces.
- Do not rely on browser login for Codex, Kilo, VS Code automation, or CI.
- Do not store Railway tokens in repo `.env` files.
- Do not run Railway mutations unless `railway status` reports project ID `e38bb3da-7ab5-4654-b504-101e74c92d5b`.

## Recovery Procedure

After rotating the DawaiSaver Railway project token:

```powershell
reg delete "HKCU\Environment" /v "RAILWAY_TOKEN" /f 2>$null
reg delete "HKCU\Environment" /v "RAILWAY_API_TOKEN" /f 2>$null
[Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", "<fresh-dawaisaver-project-token>", "User")
```

Then restart VS Code, Codex, Kilo Code, and all terminals.

## Verification Checklist

From a fresh terminal after restart:

```powershell
railway status
railway status --json
```

Required:

- `railway status` reports `dawaisaver.pk`.
- `railway status` reports project ID `e38bb3da-7ab5-4654-b504-101e74c92d5b`.
- No command reports a non-DawaiSaver project.
- No command reports `Invalid RAILWAY_TOKEN`.
- No command reports `Please login`.

Note: `railway whoami` is expected to fail with a project token because it is an account identity command.

Current status: stale credential cleanup is complete and browserless DawaiSaver project-token validation passes through `railway status` and `railway status --json`.
