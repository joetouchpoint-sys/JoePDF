import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

/**
 * Worker URL fixes for cross-browser compatibility:
 * 1. Use import.meta.env.BASE_URL so the path is correct on GitHub Pages
 *    (/JoePDF/pdf.worker.min.js) and in development (/pdf.worker.min.js).
 * 2. Use .js extension — Chrome rejects .mjs workers served without an
 *    explicit application/javascript Content-Type header (GitHub Pages omits it).
 *
 * The file is copied to dist/ by vite-plugin-static-copy (see vite.config.ts).
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.js`

export type { PDFDocumentProxy, PDFPageProxy }

/** Load a PDF from an ArrayBuffer. Returns the document proxy. */
export async function loadDocument(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const copy = buffer.slice(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = pdfjsLib.getDocument({ data: copy as any, disableAutoFetch: true })
  return loadingTask.promise
}

export interface RenderHandle {
  promise: Promise<void>
  cancel: () => void
}

/**
 * Render a PDF page onto the provided canvas element.
 *
 * Returns a { promise, cancel } handle so each caller can independently
 * cancel its own render without disrupting other pages. Previously a single
 * module-level task was used, which caused pages to cancel each other during
 * simultaneous rendering (visible as blank pages in Chrome).
 */
export function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number,
): RenderHandle {
  let cancelled = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let renderTask: any = null

  const promise = (async () => {
    const page = await doc.getPage(pageNumber)
    if (cancelled) { page.cleanup(); return }

    const viewport = page.getViewport({ scale })
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    const ctx = canvas.getContext('2d')
    if (!ctx) { page.cleanup(); throw new Error('Canvas 2D context unavailable') }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderTask = page.render({ canvasContext: ctx as any, viewport, canvas })

    try {
      await renderTask.promise
    } catch (err) {
      // Swallow cancellation — not an error
      if (cancelled || (err as Error).message?.includes('Rendering cancelled')) return
      throw err
    } finally {
      renderTask = null
      page.cleanup()
    }
  })()

  return {
    promise,
    cancel: () => {
      cancelled = true
      renderTask?.cancel()
    },
  }
}

/**
 * Render a page to an offscreen canvas at the given scale.
 * Used by the redaction engine and thumbnail generator.
 */
export async function renderPageOffscreen(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
): Promise<OffscreenCanvas | HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(Math.floor(viewport.width), Math.floor(viewport.height))
      : (() => {
          const c = document.createElement('canvas')
          c.width = Math.floor(viewport.width)
          c.height = Math.floor(viewport.height)
          return c
        })()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = canvas.getContext('2d') as any
  if (!ctx) throw new Error('Offscreen canvas 2D context unavailable')

  const htmlCanvas = canvas instanceof HTMLCanvasElement ? canvas : undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = page.render({ canvasContext: ctx, viewport, canvas: htmlCanvas as any })
  await task.promise
  page.cleanup()
  return canvas
}
