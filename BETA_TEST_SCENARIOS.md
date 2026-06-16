# Beta Test Scenarios

## Medicine Search

1. Search for `Panadol`.
2. Verify product result includes brand, generic, strength, dosage form, and manufacturer.
3. Search for `Paracetamol`.
4. Verify generic search returns matching products.

## Alternatives

1. Open Panadol product details.
2. Request alternatives.
3. Verify Calpol appears only as same active ingredient, strength, and dosage form.
4. Confirm safety wording: "Equivalent options with same active ingredient, strength, and dosage form."

## Prescription Text

1. Submit a text prescription containing Panadol 500mg.
2. Verify parser extracts medicine lines.
3. Verify matched item references the beta dataset.
4. Verify unmatched lines are reviewable.

## OCR Upload

1. Upload a small prescription image.
2. Verify file validation rejects unsupported types.
3. Verify OCR process returns a reviewable result.
4. Verify uploaded file persistence is R2-backed before this scenario is marked production-ready.

## Admin Review

1. Login as an admin or reviewer.
2. Open OCR review queue.
3. Open prescription review queue.
4. Approve or reject a review item.
5. Verify the decision is reflected in the API response.

## Health And Operations

1. Check `/health/application`.
2. Check `/health/database`.
3. Check `/health`.
4. Confirm startup diagnostics show `databaseConfigured=true` after database restoration.
