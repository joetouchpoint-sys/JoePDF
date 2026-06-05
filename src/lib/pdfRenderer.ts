import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'

// Point the worker at pdfjs-dist's own worker bundle.
// Vite resolves the import.meta.url form for node_modules assets automatically.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export type { PDFDocumentProxy, PDFPageProxy }

let activeRenderTask: RenderTask | null = null

/** Load a PDF from an ArrayBuffer. Returns the document proxy. */
export async function loadDocument(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const copy = buffer.slice(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = pdfjsLib.getDocument({ data: copy as any, disableAutoFetch: true })
  return loadingTask.promise
}

/** Get page dimensions in PDF user-space points without rendering. */
export async function getPageInfo(
  doc: PDFDocumentProxy,
  pageNumber: number,
): Promise<{ widthPt: number; heightPt: number }> {
  const page = await doc.getPage(pageNumber)
  const vp = page.getViewport({ scale: 1 })
  const result = { widthPt: vp.width, heightPt: vp.height }
  page.cleanup()
  return result
}

/**
 * Render a PDF page onto the provided canvas element.
 * Cancels any in-flight render task before starting a new one.
 */
export async function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number,
): Promise<void> {
  if (activeRenderTask) {
    activeRenderTask.cancel()
    activeRenderTask = null
  }

  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTask = page.render({ canvasContext: ctx as any, viewport, canvas })
  activeRenderTask = renderTask

  try {
    await renderTask.promise
  } catch (err) {
    if ((err as Error).message?.includes('Rendering cancelled')) return
    throw err
  } finally {
    activeRenderTask = null
    page.cleanup()
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
  const renderTask = page.render({ canvasContext: ctx, viewport, canvas: htmlCanvas as any })
  await renderTask.promise
  page.cleanup()
  return canvas
}
