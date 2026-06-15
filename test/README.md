# Test Structure

## Unit Tests

Unit tests live next to modules as `*.spec.ts` or `*.test.ts`.

## Integration Tests

Future integration tests should live under this directory and use a disposable PostgreSQL database from `docker-compose.yml`.

## Current Status

The backend runtime includes Jest configuration and a health service unit test. Existing module test scaffolds remain plain exported functions until the runtime test harness is expanded.

