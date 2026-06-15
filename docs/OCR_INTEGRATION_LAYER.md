# OCR Integration Layer

## Purpose

The OCR Integration Layer provides a pluggable architecture for extracting text from prescription images. It supports multiple OCR providers with priority-based fallback.

## Architecture

```mermaid
graphTB
    subgraph OCR Layer
        API[OCR API Endpoints]
        SVC[OcrService]
        REG[OcrProviderRegistry]
        FAC[OcrProviderFactory]
    end
    
    subgraph Providers
        GV[Google Vision]
        TS[Tesseract]
        MO[Mock Provider]
    end
    
    subgraph Services
        UP[UploadService]
        VF[FileValidatorService]
        IP[ImagePreprocessorService]
    end
    
    API --> SVC
    SVC --> REG
    REG --> FAC
    FAC --> GV
    FAC --> TS
    FAC --> MO
    API --> UP
    API --> VF
    API --> IP
```

## Provider Priority

1. **Google Vision** - Primary provider (requires `GOOGLE_CLOUD_VISION_API_KEY`)
2. **Tesseract** - Secondary provider (local OCR)
3. **Mock Provider** - Fallback for development/testing

## Supported File Types

- JPEG/JPG
- PNG
- PDF

## API Endpoints

### POST /api/ocr/upload
Upload an image file for OCR processing.

### POST /api/ocr/process
Process OCR on an uploaded image or existing text.

### GET /api/ocr/:id
Get OCR job details by ID.

### GET /api/ocr/:id/result
Get OCR result by job ID.

## Confidence Scoring

The layer calculates three confidence levels:

- **Text Confidence**: Confidence from OCR engine (0-1)
- **Medicine Confidence**: Ratio of matched medicines to total lines
- **Overall Confidence**: Average of text and medicine confidence

Review is required when overall confidence < 0.7.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLOUD_VISION_API_KEY` | Google Cloud Vision API key | No (optional) |
| `UPLOAD_DIR` | Directory for uploaded files | No (defaults to `uploads`) |

## Database Tables

- `ocr_jobs` - OCR processing job records
- `ocr_results` - OCR extraction results with confidence scores
- `ocr_provider_logs` - Provider execution logs

## Usage

```typescript
// Inject OcrService
constructor(private readonly ocr: OcrService) {}

// Extract text with default provider
const result = await this.ocr.extractText({
  imageReference: 'gs://bucket/image.jpg',
  city: 'Karachi',
});

// Calculate confidence
const confidence = this.ocr.calculateConfidence(result);
```