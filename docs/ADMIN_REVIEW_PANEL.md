# Admin Review Panel

## Purpose

The Admin Review Panel provides human review workflows for OCR results, medicine matching, discovery candidates, and price anomalies.

## Architecture

```mermaid
graphTB
    subgraph Admin Panel
        Dashboard[Dashboard]
        Nav[Navigation Tabs]
        Tabs[OCR | Prescription | Discovery | Price | Sources]
    end
    
    subgraph Review Workflows
        OcrReview[OCR Review Queue]
        PrescReview[Prescription Review]
        DiscReview[Discovery Review]
        PriceReview[Price Anomaly Review]
        SourceHealth[Source Health]
    end
    
    Dashboard --> Nav
    Nav --> Tabs
    Tabs --> OcrReview
    Tabs --> PrescReview
    Tabs --> DiscReview
    Tabs --> PriceReview
    Tabs --> SourceHealth
```

## Pages

### Dashboard
- Main entry point
- Tab navigation for review queues

### OCR Review Queue
- Shows OCR jobs with extracted text
- Displays confidence scores
- Approve/Reject/Edit actions

### Prescription Review Queue
- Shows prescription items needing review
- Matched products and confidence breakdown
- Alternative matches display

### Discovery Review Queue
- Shows discovery candidates
- Evidence list display
- Approve/Merge/Reject actions

### Price Anomaly Review
- Shows detected price anomalies
- Price history display
- Approve/Ignore actions

### Source Health
- Provider health status
- Sync job status
- Error logs

## Authentication

Foundation includes:
- `AdminAuthContext` - Authentication context
- `useAuth` hook - Auth state access
- Role-based access (USER, ADMIN, REVIEWER)

## API Client

`src/services/api-client.ts` integrates with existing backend APIs:
- `/api/ocr/jobs`
- `/api/prescriptions/reviews`
- `/api/discovery/candidates`
- `/api/prices/anomalies`

## Deployment

- Runs on port 3001 by default
- Proxies `/api` to backend (port 3000)
- Built with Vite + React + Tailwind CSS