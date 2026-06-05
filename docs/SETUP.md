# Development Setup

## Prerequisites

- **Node.js 22+** — install via [nodejs.org](https://nodejs.org/) or `winget install OpenJS.NodeJS.LTS`
- **Git**

## Quick start

```bash
git clone https://github.com/joetouchpoint-sys/JoePDF.git
cd JoePDF
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server at `localhost:5173` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run type-check` | TypeScript type check (no emit) |
| `npm run lint` | ESLint with zero-warning threshold |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright E2E tests (requires dev server running) |

## Project structure

```
src/
  components/       UI components
    canvas/         Konva annotation shapes
    layout/         App shell, header, sidebar, inspector
    pdf/            PDF viewer, thumbnails, page controls
    toolbar/        Tool buttons
    upload/         Drop zone and upload screen
    ui/             Shared primitives (Button, Dialog, Toast)
    branding/       Branding config panel and provider
  commands/         Command pattern (undo/redo)
  hooks/            React hooks
  lib/              Core library (pdfRenderer, pdfExporter, redactionEngine...)
  store/            Zustand slices
  types/            TypeScript type definitions
  utils/            Utility functions
  test/             Test setup and unit tests
```

## Architecture notes

- **No backend** — everything runs in the browser
- **State management** — Zustand v5 with Immer
- **Undo/redo** — Command pattern; every edit dispatched through `historySlice.dispatch(cmd)`
- **PDF rendering** — PDF.js (`pdfjs-dist`) renders pages to `<canvas>` elements
- **Annotations** — Konva.js (`react-konva`) overlays an interactive canvas per page
- **PDF export** — pdf-lib re-assembles the document with annotations drawn as native PDF ops
- **Redaction** — Canvas rasterisation (page → PNG → new pdf-lib page), permanent content removal

## TypeScript path aliases

Use `@/` for absolute imports from `src/`:

```ts
import { useStore } from '@/store'
import { Button } from '@/components/ui/Button'
```

## Troubleshooting

**PDF.js worker error in browser console**: The worker URL is resolved at runtime via `import.meta.url`. In dev mode, Vite serves it from node_modules. This is expected.

**`useStore` selector causing infinite re-renders**: Never return `?? []` or `?? {}` inline in a Zustand selector. Use a stable module-level constant instead.
