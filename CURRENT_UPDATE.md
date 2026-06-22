# CURRENT UPDATE

Date: 2026-06-22
Project: DawaiSaver.pk
Update: Mirror status frontend and runtime-state restoration

## Root Causes

### Frontend error

The deployed admin bundle (`/assets/index-79b1f96a.js`) treated every response containing `success` as a data envelope and always returned `response.data`. Mirror control endpoints return a direct object such as `{ success: true, message: "..." }`, so the deployed client returned `undefined`. The action handler then read `result.message`, producing `Cannot read properties of undefined (reading 'message')`.

The source client had a partial envelope correction that was not present in the deployed bundle. This change additionally makes error extraction safe for absent, string, and nested error values. The status page now loads `/admin/mirror-status` and `/admin/mirror/runtime` independently with `Promise.allSettled`, validates the status payload, uses optional action messages, and never dereferences an unknown caught value.

### False `INTERRUPTED` state

`getMirrorRuntimeState()` queried for any `RUNNING` mirror batch with `updated_at` older than 30 minutes. A multi-worker run could therefore be reported globally as `INTERRUPTED` because of one stale sibling even while another worker continued updating checkpoints, counters, and archive uploads.

The runtime check now selects the newest `RUNNING` mirror batch heartbeat. The mirror is interrupted only when the newest active heartbeat is stale. The runtime endpoint also returns the actual computed `RUNNING`, `PAUSED`, or `INTERRUPTED` value as `effectiveState`; it no longer collapses `INTERRUPTED` to the database control row's uppercase value.

## Acquisition and Recovery Findings

- `mirror_runtime_control` is the runtime gate. `start`, `resume`, and `recover` set its row to `running`; pause/stop change the gate.
- The mirror job reads stable worker batch IDs and stored checkpoints and passes them to `runMirrorAcquisition()` as `resumeFrom`.
- The API process has no startup worker launcher. Control handlers change authorization state but do not spawn the acquisition CLI. The deployed acquisition worker is therefore operationally separate from the API controls.
- Because production checkpoints and archive uploads were observed continuing, the symptom is a false status calculation rather than stopped acquisition. Acquisition logic was not modified.

## Production Evidence

- Public admin deployment responds HTTP 200 at `https://dawaisaver-admin.pages.dev`.
- Its deployed asset was `index-79b1f96a.js` and contained the failing sequence: generic envelope unwrap to `data`, followed by an unguarded control-result `.message` read.
- After the fix was pushed, the public asset changed to `index-d5cb3f3c.js`; the deployed bundle contains independent `Promise.allSettled` loading, unexpected-response handling, the safe action fallback, and the runtime endpoint call.
- The same-origin mirror endpoints are reachable and protected: unauthenticated requests to `/api/admin/mirror-status` and `/api/admin/mirror/runtime` returned HTTP 401.
- Direct SSH verification was attempted with all available workstation identities; the host rejected public-key authentication.
- The configured Coolify API was also queried read-only but returned HTTP 503 `no available server`.
- The public production API hostname recorded in older documentation does not currently resolve. Consequently, a fresh authenticated PostgreSQL snapshot of checkpoint, worker count, control row, and batch state could not be collected from this environment. Previously supplied production evidence remains: batch `cfd99bd1-0953-4146-8e50-bc0c799ddbfb`, checkpoint `processed=6400`, `parsed=6246`, `failed=154`, archive uploads advancing.

## Changes

- `apps/admin/src/services/api-client.ts`: defensive response/error handling.
- `apps/admin/src/pages/MirrorStatusDashboard.tsx`: independent endpoint loading, payload validation, and safe error/action messages.
- `src/modules/drap/drap.freeze.ts`: newest-heartbeat interruption calculation.
- `src/modules/drap/controllers/admin-mirror-runtime.controller.ts`: truthful effective runtime state.
- `src/modules/drap/testing/drap.freeze.test.ts`: fresh-worker and all-stale regression cases.
- `.gitignore`: explicit exclusion for archived/current-update snapshots.

Superseded update snapshots remain under the ignored `docs/archive/` area; `CURRENT_UPDATE.md` is the only active update document.

## Verification

- Runtime-state unit tests: 4 passed.
- API build: passed (`npm.cmd run build`).
- Admin build: passed (`npm.cmd run build --prefix apps/admin`).
- Public admin fix deployment: verified (`index-d5cb3f3c.js`).
- Infrastructure, Coolify configuration, R2 configuration, and acquisition logic were not changed.
