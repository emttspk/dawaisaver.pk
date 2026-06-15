# API Specification

## API Style

Initial API style is REST over JSON with explicit versioning under `/api/v1`.

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
- `/admin/review`
- `/admin/crawl-jobs`
- `/admin/imports`
- `/audit-logs`

## Example Endpoints

```text
GET    /api/v1/medicines/search?q=
GET    /api/v1/products/:id
GET    /api/v1/products/:id/prices
GET    /api/v1/search?q=
GET    /api/v1/search/products?q=
GET    /api/v1/search/generics?q=
GET    /api/v1/search/autocomplete?q=
GET    /api/v1/search/alternatives/:id
GET    /api/v1/search/trending
POST   /api/v1/prescriptions
GET    /api/v1/prescriptions/:id/report
POST   /api/v1/bills
GET    /api/v1/bills/:id/report
GET    /api/v1/admin/review/unknown-products
PATCH  /api/v1/admin/review/unknown-products/:id
POST   /api/v1/admin/crawl-jobs
GET    /api/v1/admin/crawl-jobs/:id
```

## Response Principles

- Include stable IDs.
- Include confidence scores for intelligence outputs.
- Include review status where relevant.
- Include source attribution for prices and catalog data.
- Avoid exposing raw user uploads except to authorized owners and reviewers.

## Search API Foundation

Search endpoints are backend-only contracts over canonical medicine data. They must use canonical identity, matching confidence, price intelligence, availability, and popularity signals.

Search endpoints:

- `GET /api/v1/search`
- `GET /api/v1/search/products`
- `GET /api/v1/search/generics`
- `GET /api/v1/search/autocomplete`
- `GET /api/v1/search/alternatives/:id`
- `GET /api/v1/search/trending`

Search result DTOs:

- `SearchResultDto`
- `AutocompleteDto`
- `AlternativeResultDto`
- `TrendingResultDto`
