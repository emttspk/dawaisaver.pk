# API Specification

## API Style

Initial API style is REST over JSON under `/api`.

## Core Resource Groups

- `/auth` - Authentication endpoints
- `/users` - User management
- `/medicines` - Medicine catalog
- `/generics` - Generic names
- `/products` - Product data
- `/prices` - Price intelligence
- `/ocr` - OCR processing
- `/prescriptions` - Prescription processing
- `/bills` - Bill intelligence
- `/recommendations` - Medicine recommendations
- `/search` - Search functionality
- `/matching` - Medicine matching
- `/discovery` - Product discovery
- `/sources` - Data sources
- `/drap` - DRAP import
- `/admin/review` - Admin review queues
- `/admin/crawl-jobs` - Crawler jobs
- `/admin/imports` - Admin imports
- `/audit-logs` - Audit trail
- `/docs` - Swagger documentation

## Core Resource Groups

- `/auth`
- `/users`
- `/medicines`
- `/generics`
- `/products`
- `/prices`
- `/ocr`
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

## User-Facing API Endpoints

### Search API
- `GET /api/search?q=` - Product search
- `GET /api/search/products?q=` - Product search
- `GET /api/search/generics?q=` - Generic search
- `GET /api/search/autocomplete?q=` - Autocomplete
- `GET /api/search/alternatives/:id` - Alternative search
- `GET /api/search/trending` - Trending medicines

### Prescription API
- `POST /api/prescriptions/text` - Text prescription submission
- `POST /api/prescriptions/mock-upload` - Mock upload
- `GET /api/prescriptions/:id` - Get prescription
- `GET /api/prescriptions/:id/items` - Get items
- `GET /api/prescriptions/:id/cost-estimate` - Get cost estimate
- `POST /api/prescriptions/:id/review` - Review action

### OCR API
- `POST /api/ocr/upload`
- `POST /api/ocr/process`
- `GET /api/ocr/:id`
- `GET /api/ocr/:id/result`

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
POST   /api/ocr/upload
POST   /api/ocr/process
GET    /api/ocr/:id
GET    /api/ocr/:id/result
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

## Prescription Processing Pipeline

Prescription endpoints support text submission, mock uploads, item retrieval, cost estimates, and review actions.

Prescription endpoints:

- `POST /api/prescriptions/text`
- `POST /api/prescriptions/mock-upload`
- `GET /api/prescriptions/:id`
- `GET /api/prescriptions/:id/items`
- `GET /api/prescriptions/:id/cost-estimate`
- `POST /api/prescriptions/:id/review`

Prescription response contracts should preserve:

- raw text provenance
- extracted item lines
- matched canonical medicine identity
- confidence scores
- review-required flags
- cost estimate breakdowns
- high-risk medication warnings

## Controller Layer

The controller layer now exposes REST endpoints for search, discovery, matching, price intelligence, prescription processing, DRAP import, and source sync over the `/api` prefix. Swagger is available at `/api/docs`.
