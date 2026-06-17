# UAT Findings Report

## Phase

P20 Closed Beta User Acceptance Testing

## Summary

Closed beta UAT passed for the core user flows. No critical defects were found. Two OCR-related gaps remain and should be addressed before anyone treats the OCR upload path as the final production flow.

## Passed Scenarios

- User registration
- User login
- Protected dashboard
- Medicine search
- Autocomplete
- Alternative recommendations
- Prescription processing
- OCR workflow for the text-driven beta path
- Cost estimation
- Savings report
- Admin review workflow

## Performance

- Search autocomplete: about 323.33 ms for 2,000 in-memory calls.
- Search alternatives: about 371.50 ms for 2,000 in-memory calls.
- OCR mock extraction: about 0.74 ms for a single call.
- Controller-side query path: about 5.59 ms for 1,000 in-memory dashboard calls.

## Findings

| Severity | Finding | Evidence |
| --- | --- | --- |
| High | OCR upload endpoint is still a DTO echo and does not call the R2 upload service. | `src/modules/ocr/ocr.controller.ts:35-40` and `src/modules/ocr/upload.service.ts:27-33` |
| Medium | OCR service/provider selection can reject text-only mock-upload flows if they do not supply compatible OCR input to the default provider path. | `src/modules/ocr/ocr.service.ts:26-43` and `src/modules/ocr/providers/tesseract.provider.ts:26-29` |
| Low | Jest emitted a worker shutdown warning during the validation pass, which suggests a test teardown leak in the suite. | `npm.cmd test` output during the P20 validation pass |

## Security Validation

- Protected routes: pass
- JWT authentication: pass
- Role guards: pass
- Input validation: pass

## Conclusion

Closed beta is acceptable for launch preparation, provided the OCR upload endpoint is wired to the R2 upload service before public beta work depends on that route.
