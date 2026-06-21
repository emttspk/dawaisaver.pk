# CURRENT UPDATE

Date: 2026-06-21
Project: DawaiSaver.pk
Audit: DRAP mirror performance forensics

## Executive finding

The dashboard rate of `0.20/sec` is not an observed processing rate and must not be used for capacity planning. The last two source-controlled production observations bracket the counter change from 46,550 to 47,550 across 19 hours, 15 minutes, and 22 seconds. The evidence-based interval rate is therefore **0.0144 registrations/sec** (1,000 / 69,322 seconds).

The current slowdown is not explained by DRAP, PostgreSQL, gzip, or R2 latency measurements. The dominant observed condition is worker inactivity/control-plane waiting: the 46,550 snapshot explicitly reported `effectiveState=PAUSED`, `MIRROR_ENABLED=false`, and `MIRROR_MIGRATION_MODE=true`. A later dashboard snapshot showed 47,550 and 17 configured workers, but no authenticated runtime evidence proves that those workers were actively fetching at the time of this audit.

## Fix applied

The runtime gate now treats the persisted mirror control row as authoritative when it exists. A control state of `running` now overrides the env pause gate, while the env values remain the fallback only when no control row is present yet.

- `src/modules/drap/drap.freeze.ts`: moved the control-table check ahead of the env gate and added a `clearPrismaService()` test seam.
- `src/modules/drap/testing/drap.freeze.test.ts`: added a regression test that proves `running` overrides the env pause gate.
- Validation: `npm.cmd run build` passed, and the targeted mirror-gate test passed.

## Latest live verification attempt

- SSH to `root@178.105.221.236` and `ubuntu@178.105.221.236` with the tracked key still returns `Permission denied (publickey,password)`.
- Wrangler identity is valid, but `wrangler r2 bucket info dawaisaver-pk` still reports `object_count: 0` and `bucket_size: 0 B`.
- No authenticated admin or database session was reachable from this workspace, so a true 10-minute live counter observation could not be completed here.
- The earlier runtime fix is still the best available mitigation, but post-deploy counter movement remains unverified from this shell.
- The latest verifiable completion percentage remains **95.1%** if the target is still 50,000 registrations, but that is a stale snapshot value, not a fresh live read.

## Timestamp evidence for the last 1,000

| Counter observation | Timestamp (PKT, UTC+05:00) | Evidence |
| --- | --- | --- |
| 46,550 processed | 2026-06-20 21:04:14 | Git commit `0703954`; authenticated production snapshot recorded `status=PAUSED` |
| 47,550 processed | 2026-06-21 16:19:36 | Git commit `9c1b77f`; dashboard snapshot |

- Observed elapsed time: **69,322 seconds** = **19:15:22**.
- Observed throughput: **0.014425 registrations/sec** = **51.93 registrations/hour**.
- These are observation timestamps, not database row timestamps. They form the narrowest durable evidence window available after production SSH rejected both documented keys and the protected status endpoint returned HTTP 401.
- The database schema has `created_at` and `updated_at` on `import_batch_items`; an authenticated database query is still required to recover exact row-processing timestamps rather than observation bounds.

## Railway historical comparison

The valid historical comparator is the P40 1,000-registration live test on 2026-06-18, not the mock benchmark and not a dashboard projection.

| Metric | Railway P40 live 1,000 | Hetzner observed 46,550 to 47,550 | Comparison |
| --- | ---: | ---: | ---: |
| Elapsed time | 79.533 s | 69,322 s | Hetzner observation window 871.6x longer |
| Throughput | 12.57/sec | 0.014425/sec | Hetzner interval 99.885% lower |
| DRAP response | 65.50 ms average | Not recoverable without DB/archive access | No current latency regression proven |
| Database write | 8.81 ms average | Not recoverable without DB/archive access | No current DB regression proven |
| Parse | 0.24 ms average | Not recoverable | Negligible in historical run |
| gzip creation | 403.94 ms for the 1,000-record segment | Not recoverable | 0.404 ms/record amortized historically |
| R2 upload | 3,274.03 ms for the batch | No objects in named bucket | Async; 3.274 ms/record amortized historically |

At the Railway P40 active-processing rate, 1,000 records require about 79.55 seconds. Compared with the 69,322-second observation interval, **at least 69,242 seconds (99.885%) are implied non-processing/wait time** if the active service times remained comparable. This is an inference from the two runs, not a direct worker-idle timer.

## Worker, queue, and archive verification

- Production API health: HTTP 200 on 2026-06-21; the application is reachable.
- Protected mirror status: HTTP 401 without an authorized admin session; current worker execution cannot be proven from the public endpoint.
- SSH: `root`, `ubuntu`, `nazim`, and `coolify` access rejected the available documented keys; container/process inspection is blocked.
- Latest SSH retry on `root` and `ubuntu` again failed with `Permission denied (publickey,password)`.
- Last proven state at 46,550: paused, so workers were waiting rather than processing.
- Later state at 47,550: 17 workers were configured; configured worker count does not prove active work.
- Queue depth: **unverified**. This mirror partitions registration ranges across in-process workers; no Cloudflare Queue binding exists in the mirror code. The relevant backlog is remaining assigned registrations plus archive `pendingSegments`, neither of which is publicly readable.
- Wrangler 4.100.0 authentication: verified for Cloudflare account `85f6...a474`.
- R2 bucket `dawaisaver-pk`: **0 objects, 0 B** at audit time. Therefore archive upload duration for the current run is unavailable and successful persistence to this named bucket/account is not verified.
- Latest Wrangler probe confirmed the same empty-bucket state.
- Last successful processed counter: **47,550** (45,178 successes, 2,372 failures) from the last durable dashboard snapshot.
- Last exact registration number: not exposed by the 47,550 snapshot. The last independently recorded historical Railway run reported `last_registration_seen=053849` and a highest batch checkpoint of `091349`; neither should be mislabeled as the current Hetzner value.

## Bottleneck ranking by impact

1. **Worker inactivity / runtime control waiting — dominant (approximately 99.885% of the observed interval versus the Railway active baseline).** Fix execution-state visibility and prove counters advance before adding workers.
2. **Archive persistence/configuration mismatch — critical durability issue, unquantified throughput impact.** The named R2 bucket is empty despite prior “configured” claims. This may be wrong-account/wrong-bucket configuration or failed uploads.
3. **DRAP fetch latency — largest measured active-path cost.** Historical average 65.50 ms, 7.4x the database-write average, but no current regression is proven.
4. **R2 batch upload — 3,274.03 ms per historical 1,000-record segment, asynchronous.** It can affect finalization or a sustained upload backlog, but it was outside the per-record hot path.
5. **Database write — historical average 8.81 ms/record.** Material but not a bottleneck at the validated 12.57/sec Railway rate.
6. **gzip creation — historical 403.94 ms/1,000 (0.404 ms/record amortized).** Negligible relative to the current wait interval.
7. **Parsing — historical 0.24 ms/record.** Negligible.

## Recommendations

- **Worker count:** restore and verify **4 workers on Hetzner** first. Do not run 17 until per-worker heartbeats, current registration, checkpoint age, and pending archive count are visible. Scale to 8 only if four workers are continuously busy, DRAP error/rate-limit levels remain acceptable, DB write p95 stays low, and archive backlog remains zero.
- **gzip batching:** **keep enabled at 1,000 records**. The validated batched implementation improved the historical live rate from 0.77/sec (per-product R2 uploads) to 12.57/sec and gzip cost was only 0.404 ms/record amortized.
- Correct Coolify execution gates to `MIRROR_ENABLED=true`, `MIRROR_MIGRATION_MODE=false`, and database control `running`, then restart only the mirror/API service if required.
- Verify the R2 account ID and bucket used inside Coolify. Require the next segment to appear in Wrangler and compare manifest `createdAt`/`uploadedAt` for exact upload duration.
- Add a protected forensic endpoint or structured log containing worker ID, current registration, last completion timestamp, fetch/db/archive/upload timings, and pending segment count. Dashboard counters alone cannot distinguish active work from stale state.
- Query `import_batch_items` for the rows corresponding to the 46,550th and 47,550th processed positions, ordered by `created_at`, to replace the Git observation bounds with exact database timestamps.

## Protected Scope Protocol

- No application code, schema, API contract, WHO normalization, matching logic, composition generation, search behavior, or price-intelligence behavior was changed.
- The audit changed documentation only.
- The superseded current-update document was removed after being archived elsewhere; component READMEs and generated catalogue documentation remain active and were not incorrectly archived.

## Verification status

- Evidence used: Git history timestamps and snapshots, live public API health, protected endpoint authorization response, application timing implementation, historical P38/P40 live-run reports, Wrangler identity, and Wrangler R2 bucket metadata.
- Blocked evidence: production DB row timestamps, Coolify container logs/process list, current protected mirror status, current archive manifest, exact queue/backlog depth, and post-deploy live throughput verification.
