# PWA Frontend Foundation

## Purpose

The PWA frontend provides the customer-facing application for DawaiSaver.pk, allowing users to search medicines, upload prescriptions, compare alternatives, and view cost savings.

## Architecture

```mermaid
graphTB
    subgraph PWA Frontend
        App[App Shell]
        Routes[React Router]
        Pages[Pages]
        Components[Components]
    end
    
    subgraph Pages
        Home[Home]
        Search[Medicine Search]
        Details[Medicine Details]
        Upload[Prescription Upload]
        Dashboard[User Dashboard]
    end
    
    App --> Routes
    Routes --> Pages
    Pages --> Components
```

## Pages

### Home
- Hero section with search bar
- Upload prescription CTA
- Benefits section
- FAQ section

### Medicine Search
- Search input with autocomplete
- Results grid with brand/generic names
- Price display

### Medicine Details
- Product information
- Alternatives comparison
- Price statistics
- Availability info

### Prescription Upload
- File upload with drag & drop
- OCR processing
- Savings report display

### User Dashboard
- Prescription history
- Savings summary
- Account settings

## PWA Features

- Install prompt
- Offline shell
- Manifest
- Service worker
- App icons (192x192, 512x512)

## API Integration

Connects to backend APIs:
- `GET /api/search` - Product search
- `GET /api/search/autocomplete` - Autocomplete
- `GET /api/search/trending` - Trending medicines
- `POST /api/ocr/upload` - Image upload
- `POST /api/ocr/process` - OCR processing
- `GET /api/prescriptions/:id` - Prescription details

## Deployment

- Runs on port 3000 by default
- Built with Vite + React + Tailwind CSS
- Deployable to Cloudflare Pages or Vercel