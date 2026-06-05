# JoePDF

A secure, browser-based PDF editor for internal company use. All document processing happens entirely in your browser — no uploads, no tracking, no backend required.

## Features (MVP)

- **PDF viewer** — drag-and-drop upload, multi-page navigation, page thumbnails, zoom (25–400%), fit-page/fit-width, per-page rotation
- **Annotations** — add text, rectangles, ellipses, lines, arrows, freehand drawing, highlights, and image stamps
- **Redaction** — draw redaction boxes, apply permanent canvas rasterisation (content is physically removed, not just hidden)
- **Page management** — reorder via drag-and-drop, delete, duplicate, extract pages
- **Undo/redo** — full command pattern, 100-level history, Ctrl+Z/Y keyboard shortcuts
- **Branding** — configurable organisation name, logo, and colour scheme
- **Export** — download the edited PDF with all annotations burned in

## Privacy

Documents never leave your browser. JoePDF contains no analytics, telemetry, or external tracking. See [docs/SECURITY.md](docs/SECURITY.md) for the full security and privacy overview.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # production build → dist/
```

## Docker

```bash
docker build -t joepdf .
docker run -p 8080:80 joepdf
```

## Documentation

- [Setup guide](docs/SETUP.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Branding guide](docs/BRANDING.md)
- [Security overview](docs/SECURITY.md)

## Technology

| Library | Version | Licence | Role |
|---|---|---|---|
| React | 19 | MIT | UI framework |
| pdfjs-dist | 5.x | Apache 2.0 | PDF rendering |
| pdf-lib | 1.17 | MIT | PDF creation and modification |
| Konva / react-konva | 10 / 19 | MIT | Interactive annotation canvas |
| Zustand | 5 | MIT | State management |
| Tailwind CSS | 3 | MIT | Styling |
| Vite | 8 | MIT | Build tool |
| Vitest | 4 | MIT | Unit testing |
| Playwright | 1 | Apache 2.0 | E2E testing |

## Licence

MIT
