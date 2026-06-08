/**
 * Secure redaction via canvas rasterisation.
 *
 * Security guarantee: redacted pages are rendered fresh from the *original*
 * source document (not the live annotated view) onto an offscreen canvas,
 * opaque black boxes are painted directly onto those pixels, and the
 * flattened result replaces the entire page as a PNG image — including its
 * content stream, text layer, links, form-field widgets, and any /Thumb
 * preview. Nothing from the original page object graph is copied into the
 * export, so there is no selectable text, no OCR/structure-tree remnants, no
 * hidden/Optional-Content layers, and no metadata path by which covered
 * content could be recovered via copy-paste, text extraction, or raw-byte
 * inspection.
 *
 * Trade-off: rasterised pages lose text searchability, drop any other JoePDF
 * annotations placed on that page, and increase file size. Only pages that
 * currently have at least one redaction box are rasterised, and the result is
 * always rebuilt from the clean original on every export — never layered on
 * top of a previous redaction — so moving/resizing/removing a box can't leave
 * stale exposed or over-redacted pixels behind (see handleExport's
 * clearRasterisedPage cleanup in Header.tsx).
 */

import type { PDFDocumentProxy } from './pdfRenderer'
import { renderPageOffscreen } from './pdfRenderer'
import type { RedactAnnotation } from '@/types/annotation'

export interface RedactionResult {
  /** Logical page index (0-based) */
  pageIndex: number
  /** PNG image bytes for the full rasterised page */
  pngBytes: ArrayBuffer
  /** Canvas dimensions (matches the page at the chosen scale) */
  width: number
  height: number
}

const REDACT_SCALE = 2 // render at 2× for quality

/**
 * Render a single PDF page to an offscreen canvas and return a PNG data URL.
 * Used for both redaction rasterisation and OCR input.
 */
export async function rasterisePage(
  doc: PDFDocumentProxy,
  originalPageNumber: number,
  scale = 2,
): Promise<string> {
  const canvas = await renderPageOffscreen(doc, originalPageNumber, scale)
  if (canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  return (canvas as HTMLCanvasElement).toDataURL('image/png')
}

/** Draw redaction boxes on a canvas context. */
function applyBoxes(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  boxes: RedactAnnotation[],
  scale: number,
): void {
  ctx.fillStyle = '#000000'
  for (const box of boxes) {
    ctx.fillRect(box.x * scale, box.y * scale, box.width * scale, box.height * scale)
  }
}

/**
 * Rasterise all pages that have redaction boxes.
 * Returns a RedactionResult per affected page.
 */
export async function rasteriseRedactedPages(
  doc: PDFDocumentProxy,
  redactionsByPage: Map<number, RedactAnnotation[]>,
  pageOrder: number[],
): Promise<RedactionResult[]> {
  const results: RedactionResult[] = []

  for (const [logicalIndex, boxes] of redactionsByPage) {
    if (boxes.length === 0) continue

    const originalPageNumber = (pageOrder[logicalIndex] ?? logicalIndex) + 1
    const canvas = await renderPageOffscreen(doc, originalPageNumber, REDACT_SCALE)

    const ctx = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null
    if (!ctx) throw new Error('Canvas context unavailable during redaction')

    applyBoxes(ctx, boxes, REDACT_SCALE)

    let pngBlob: Blob
    if (canvas instanceof OffscreenCanvas) {
      pngBlob = await canvas.convertToBlob({ type: 'image/png' })
    } else {
      pngBlob = await new Promise<Blob>((resolve, reject) => {
        ;(canvas as HTMLCanvasElement).toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/png',
        )
      })
    }

    const pngBytes = await pngBlob.arrayBuffer()

    results.push({
      pageIndex: logicalIndex,
      pngBytes,
      width: canvas.width,
      height: canvas.height,
    })
  }

  return results
}
