# Next Actions

## Current Task

DawaiSaver Migration Freeze Phase.

## Completed

- Removed Railway deployment config and superseded Railway reports.
- Updated the deployment docs to Hetzner/Coolify.
- Replaced old Railway API defaults in the frontends.
- Renamed the DRAP mirror bootstrap job to a platform-neutral name.
- Added mirror freeze guards and migration-mode defaults.
- Kept the catalog recovery pipeline and CLI in place, but deferred execution.
- Passed `npm run build`.
- Passed `npm test -- --runInBand`.

## Next

1. Verify the mirror status stays paused.
2. Confirm no startup autorun or worker path can start mirror acquisition.
3. Confirm admin-triggered DRAP acquisition is blocked while migration mode is active.
4. Keep catalog recovery deferred until migration verification is explicitly approved.

## Exact Next Prompt

Verify the DRAP mirror freeze on Hetzner and confirm no acquisition path can start automatically while MIRROR_ENABLED=false and MIRROR_MIGRATION_MODE=true. Do not resume catalog recovery yet.
