# API Specification

## API Style

Initial API style is REST over JSON under `/api`.

## Core Resource Groups

- `/auth`
- `/users`
- `/medicines`
- `/generics`
- `/products`
- `/prices`
- `/prescriptions`
- `/bills`
- `/recommendations`
- `/search`
- `/matching`
- `/discovery`
- `/sources`
- `/drap`
- `/admin/review`
- `/admin/crawl-jobs`
- `/admin/imports`
- `/audit-logs`
- `/docs`

## Example Endpoints

```text
GET    /api/search?q=
GET    /api/search/products?q=
GET    /api/search/generics?q=
GET    /api/search/autocomplete?q=
GET    /api/search/alternatives/:id
GET    /api/search/trending
GET    /api/prices/product/:id
GET    /api/prices/city/:city
POST   /api/matching/evaluate
GET    /api/discovery/candidates
POST   /api/discovery/review
POST   /api/sources/sync
GET    /api/sources/health
POST   /api/drap/import
POST   /api/prescriptions
GET    /api/prescriptions/:id/report
POST   /api/bills
GET    /api/bills/:id/report
GET    /api/admin/review/unknown-products
PATCH  /api/admin/review/unknown-products/:id
POST   /api/admin/crawl-jobs
GET    /api/admin/crawl-jobs/:id
```

## Response Principles

- Include stable IDs.
- Include confidence scores for intelligence outputs.
- Include review status where relevant.
- Include source attribution for prices and catalog data.
- Avoid exposing raw user uploads except to authorized owners and reviewers.
- Wrap success payloads with `{ success, data, meta, timestamp }`.
- Wrap failures with `{ success: false, error, code, timestamp }`.

## Search API Foundation

Search endpoints are backend-only contracts over canonical medicine data. They must use canonical identity, matching confidence, price intelligence, availability, and popularity signals.

Search endpoints:

- `GET /api/search`
- `GET /api/search/products`
- `GET /api/search/generics`
- `GET /api/search/autocomplete`
- `GET /api/search/alternatives/:id`
- `GET /api/search/trending`

Search result DTOs:

- `SearchResultDto`
- `AutocompleteDto`
- `AlternativeResultDto`
- `TrendingResultDto`

## Controller Layer

The controller layer now exposes REST endpoints for search, discovery, matching, price intelligence, DRAP import, and source sync over the `/api` prefix. Swagger is available at `/api/docs`.
