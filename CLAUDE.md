# JoePDF — Claude Code Context

Browser-based PDF editor for internal company use. No backend. All processing runs client-side.

## Stack
- React 19 + TypeScript 6 + Vite 8
- pdfjs-dist v5 (rendering) + pdf-lib v1.17 (modification)
- Konva.js + react-konva (canvas annotation overlay)
- Zustand v5 + Immer (state management, command pattern undo/redo)
- Tailwind CSS v3 (utility styling)
- Vitest v4 + RTL (unit tests) · Playwright (E2E)

## Key architecture decisions
- **No backend** — static SPA, fully browser-only
- **Konva not Fabric.js** — Fabric requires `unsafe-eval` (breaks CSP); Konva is CSP-compliant
- **Canvas rasterisation for redaction** — renders page to offscreen canvas, draws black rectangles, exports as PNG. Only browser-only method that truly removes content
- **Command pattern** — every edit dispatched through `historySlice.dispatch(cmd)` for undo/redo
- **Coordinate transform** — Konva = top-left origin; pdf-lib = bottom-left origin. All transforms centralised in `src/utils/coordinates.ts`

## Running the project
```bash
npm run dev          # dev server on http://localhost:5173
npm run build        # production build → dist/
npm test             # Vitest unit tests
npm run test:e2e     # Playwright E2E (requires dev server)
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
```

## Key files
- `src/store/` — Zustand slices (pdf, annotations, history, ui, branding)
- `src/commands/` — Command pattern (undo/redo)
- `src/lib/pdfRenderer.ts` — PDF.js wrapper
- `src/lib/pdfExporter.ts` — Export pipeline (pdf-lib)
- `src/lib/redactionEngine.ts` — Secure canvas rasterisation
- `src/lib/annotationSerializer.ts` — Annotation → pdf-lib drawing ops
- `src/utils/coordinates.ts` — Konva ↔ pdf-lib coordinate transform
- `src/components/canvas/AnnotationLayer.tsx` — All annotation rendering
- `src/components/layout/AppShell.tsx` — Top-level app layout

## Current status
All 12 MVP stages implemented. TypeScript clean. 16 unit tests passing.

## Known TypeScript workarounds
- `AnnotationUpdate` is `Record<string, any>` to allow partial updates to the discriminated union without requiring type narrowing at every call site
- pdfjs-dist v5 `render()` and `getDocument()` use `any` casts where the typings are stricter than the runtime API
