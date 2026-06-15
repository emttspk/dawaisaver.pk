# API Controller Layer

## Purpose

Expose the existing runtime engines through REST APIs without adding new business logic layers.

## Scope

- Search
- Autocomplete
- Alternatives
- Price intelligence
- Matching evaluation
- DRAP import
- Source sync and health
- Discovery candidate review

## Route Map

- `GET /api/search`
- `GET /api/search/products`
- `GET /api/search/generics`
- `GET /api/search/autocomplete`
- `GET /api/search/alternatives/:id`
- `GET /api/search/trending`
- `GET /api/prices/product/:id`
- `GET /api/prices/city/:city`
- `POST /api/matching/evaluate`
- `GET /api/discovery/candidates`
- `POST /api/discovery/review`
- `POST /api/drap/import`
- `POST /api/sources/sync`
- `GET /api/sources/health`

## Request Validation

All controller inputs use DTO validation. Query and body payloads are validated with Nest `ValidationPipe` and class-validator decorators.

## Response Standard

Success responses use:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "timestamp": "2026-06-15T00:00:00.000Z"
}
```

Error responses use:

```json
{
  "success": false,
  "error": "Message",
  "code": 400,
  "timestamp": "2026-06-15T00:00:00.000Z"
}
```

## Swagger

Swagger is available at `/api/docs` and is generated from the live Nest controllers.

## Recovery Notes

- Keep the `/api` prefix stable for future controllers.
- Keep controllers thin and delegate to the existing engine services.
- Use placeholder guards only until real authentication is added.
