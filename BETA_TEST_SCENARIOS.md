# Beta Test Scenarios

## Search Test

Confirm common drug searches return seeded products, canonical matches, and alternatives.

## Alternative Test

Confirm the UI or API can surface at least one sensible alternative for a matched product.

## Login Test

Confirm user login and admin login behave normally and preserve session state.

## Prescription Text Test

Confirm OCR text from a sample prescription reaches the review workflow without corruption.

## OCR Upload Test

Confirm the upload path stores the object in R2 and returns a readable object path or URL.

## Admin Review Test

Confirm an admin can review a candidate, approve or reject it, and see the decision persisted.

## Health Endpoint Test

Confirm `/health`, `/health/application`, and `/health/database` return healthy responses.
