# Current Update - P46 DRAP Mirror Failure Analysis

## Date

2026-06-18

## Status

Production DRAP mirror completion has been verified from live Railway logs. The mirror finished `COMPLETED_WITH_ERRORS` at 50,000 registrations with 46,430 parsed successes and 3,570 failures. The downstream searchable catalog surface still returns no products or generics for known queries, so the mirror result is not the same thing as a live catalog load.

## Verified Target

- Project: `dawaisaver.pk`
- Project ID: `e38bb3da-7ab5-4654-b504-101e74c92d5b`
- Environment: `production`
- Environment ID: `8c0cc558-e375-4d41-8286-21706161c538`
- Service: `dawaisaver.pk`
- Service ID: `d9fc0b7d-535b-4db4-b2eb-93dfc39d31c9`

## Mirror Evidence

- Run ID: `dc30a1d4-bb6b-4bff-a967-047a45dfcb7a`
- Start time: `2026-06-18 13:54:49 UTC`
- End time: `2026-06-18 15:01:23 UTC`
- Worker count: `4`
- Target count: `50,000`
- Registration range: `041350-091349`
- Success rate: `92.86%`

## Authentication State

- Single active Railway source: Windows User `RAILWAY_TOKEN`
- User `RAILWAY_API_TOKEN`: absent
- Railway browser cache token fields: empty
- Railway session marker files: absent
- Windows Credential Manager Railway entries: none found
- Local project metadata: `.railway/project.json`

## Validation

- `railway status`: passed with DawaiSaver project
- `railway status --json`: passed with DawaiSaver project ID
- `railway whoami`: expected account-scope failure because the installed credential is a project token

## Mirror Analysis Notes

- The mirror run completed with 3,570 row failures and zero retries.
- The live logs show no fetch-retry exhaustion, so the failures are not being driven by timeout retry loops.
- The acquisition code records row failures under a shared failure path, so exact HTTP/parser/archive/database split still needs protected row-table inspection.
- Public `/api/search/products` and `/api/search/generics` queries for known terms return empty results, which strongly suggests the production product catalog has not been materialized yet.
- I could not safely query the production database tables directly from this shell because Railway connect requires a local `psql` client and the host is not reachable through the plain Prisma runtime path.

## Notes

`railway link` requires account/workspace authentication and cannot be completed with a project token. The repository now has a non-secret local `.railway/project.json` file with the verified project, environment, and service IDs.

## Next

Validate the repository build, then decide whether the failed registrations should be retried in a follow-up mirror run.
