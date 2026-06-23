# WHO Catalog Recovery Analysis

Date: 2026-06-23
Scope: local repository and local database snapshot only.

## Executive summary

The local repository contains WHO source files and WHO import code, but the audited database snapshot does not contain the WHO tables or any WHO rows.

What I could confirm locally:

- The WHO ATC source file is present at `WHO data/WHO ATC-DDD 2026-04-25.csv`.
- The WHO molecule seed file is present at `WHO data/who-molecule-mappings.json`.
- The ATC importer code is present in `src/modules/atc/atc.service.ts`.
- The WHO normalization rules are present in `src/modules/atc/molecule-normalizer.service.ts`.
- The audited database snapshot has zero rows in the relevant catalogue tables and no WHO import jobs.
- The database migration history stops before the WHO tables were introduced.

What I could not confirm locally:

- I could not find a local source that contains 24,690 aliases.
- The only committed alias file I found contains 50 aliases, not 24,690.

## 1) Where the WHO data lives locally

### WHO import files

| File | Purpose | Evidence |
| --- | --- | --- |
| `WHO data/WHO ATC-DDD 2026-04-25.csv` | WHO ATC master input | 7,536 rows in the file; 6,215 level-5 ATC rows |
| `WHO data/who-molecule-mappings.json` | Small committed molecule mapping sample | 10 molecule keys; 50 `pakistanNames` aliases |

### WHO import code

| File | Role | Evidence |
| --- | --- | --- |
| `src/modules/atc/atc.service.ts` | WHO ATC importer | `importWhoAtcMaster()` loads files from `WHO data/`, creates `atc_classifications`, `generics`, and `molecule_aliases` |
| `src/modules/atc/molecule-normalizer.service.ts` | WHO molecule normalization rules | Contains curated rules for `Vitamin D3`, `Acetaminophen`, and `Co-Amoxiclav` and builds alias seeds |

## 2) Where the 4,937 molecules are

They are not in the audited database.

They are derivable from the WHO ATC CSV when the importer groups level-5 rows by canonical key. I dry-ran the importer logic against the local CSV and got:

- 6,215 level-5 ATC rows
- 4,937 canonical molecules
- 19,748 alias seeds from the local CSV import logic

So the 4,937 molecules are effectively in the WHO ATC source file plus the importer logic, not in the current database snapshot.

## 3) Where the 24,690 aliases are

I could not locate a local source that contains 24,690 aliases.

What exists locally is:

- `WHO data/who-molecule-mappings.json` with 50 aliases total
- the WHO ATC importer, which generates alias seeds from the CSV normalization flow

From the checked-in WHO CSV and importer logic, the alias count I could reproduce is 19,748, not 24,690.

That means one of these is true:

- the 24,690 alias figure came from a different external WHO dataset not present in this repository,
- the alias figure was produced by a later export that is no longer checked in,
- or the 24,690 number refers to a different alias layer than the local importer generates.

## 4) Why the audited database shows zero rows

There are three direct reasons.

### A. The WHO tables are not present in the audited snapshot

The audited snapshot has no `atc_classifications`, `generic_atc_classifications`, or `molecule_aliases` tables.

### B. The migration history stops before the WHO schema was added

The `_prisma_migrations` table in the audited database stops at:

- `20260616143000_add_auth_tokens_to_users`

It does not include the later WHO-related migrations that define the ATC and molecule alias tables.

### C. No WHO import job has run in the audited snapshot

The snapshot also shows zero rows in:

- `source_providers`
- `source_provider_configs`
- `source_sync_jobs`
- `source_sync_results`
- `audit_logs`

So there is no sign that a WHO import job ever populated the catalogue in this database.

## 5) Database evidence

Relevant row counts in the audited snapshot:

| Table | Rows |
| --- | ---: |
| `generics` | 0 |
| `molecule_aliases` | not present |
| `atc_classifications` | not present |
| `generic_atc_classifications` | not present |
| `canonical_products` | 0 |
| `canonical_product_aliases` | 0 |
| `product_matches` | 0 |
| `equivalence_groups` | 0 |
| `product_equivalence` | 0 |
| `source_sync_jobs` | 0 |

## 6) Interpretation

The local repository has the WHO source material and the importer code, but the audited database is an older snapshot that predates the WHO schema and has never been backfilled.

So the answer to “where are the 4,937 molecules?” is:

- in the WHO ATC CSV plus the importer logic, not in the audited database.

And the answer to “where are the 24,690 aliases?” is:

- I could not find them locally. They are not in the audited database, and they are not in the checked-in WHO files I inspected.

## 7) Recommended recovery path

1. Apply the WHO schema migrations that create:
   - `atc_classifications`
   - `generic_atc_classifications`
   - `molecule_aliases`
2. Run the WHO import pipeline against `WHO data/WHO ATC-DDD 2026-04-25.csv`.
3. Load or reconstruct the missing large alias source if the 24,690 alias set is expected.
4. Verify row counts after import and compare them with the importer report.
5. Backfill any missing WHO-to-generic links into the active catalogue snapshot.

## 8) SQL and filesystem evidence used

### SQL

```sql
select table_name from information_schema.tables where table_schema='public' order by table_name;
select migration_name from _prisma_migrations order by finished_at;
select 'source_providers', count(*) from source_providers
union all select 'source_provider_configs', count(*) from source_provider_configs
union all select 'source_sync_jobs', count(*) from source_sync_jobs
union all select 'source_sync_results', count(*) from source_sync_results
union all select 'audit_logs', count(*) from audit_logs;
```

### Files

```text
WHO data/WHO ATC-DDD 2026-04-25.csv
WHO data/who-molecule-mappings.json
src/modules/atc/atc.service.ts
src/modules/atc/molecule-normalizer.service.ts
prisma/schema.prisma
prisma/migrations/20260617000000_add_medicine_master_data_structure/migration.sql
prisma/migrations/20260620000000_mirror_status_recovery/migration.sql
```

## 9) Conclusion

The WHO data is partially recoverable from the repository, but the audited database snapshot is not carrying it.

- 4,937 canonical molecules: confirmed derivable from the WHO ATC CSV/importer flow.
- 24,690 aliases: not found locally.
- Zero rows in the audited database: explained by missing WHO tables, missing WHO migrations in the snapshot, and no WHO import job history.
