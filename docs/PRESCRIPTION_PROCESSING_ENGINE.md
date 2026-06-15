# Prescription Processing Engine

## Purpose

The prescription processing engine converts user-uploaded prescriptions into parsed medicine items, matched products, cost estimates, and savings reports.

## Flow

```mermaid
sequenceDiagram
  participant User
  participant API
  participant R2
  participant OCR
  participant Parser
  participant Matcher
  participant Optimizer
  participant Review

  User->>API: upload prescription image
  API->>R2: store image
  API->>OCR: enqueue OCR job
  OCR->>Parser: extracted text
  Parser->>Matcher: medicine candidates
  Matcher->>Optimizer: matched items
  Optimizer->>API: savings report
  Matcher->>Review: low-confidence items
```

## Required Outputs

- original upload reference
- OCR text
- parsed prescription items
- candidate product matches
- confidence scores
- unknown items
- cost optimization report
- review status

## Safety Rules

- Do not provide diagnosis.
- Do not instruct users to change prescribed medicine without pharmacist or clinician confirmation.
- Clearly label alternatives as comparison candidates.
- Preserve source image and parsing audit trail.

