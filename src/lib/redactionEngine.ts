/**
 * Secure redaction via canvas rasterisation.
 *
 * Security guarantee: the original page content stream is replaced entirely
 * with a PNG image. There is no selectable text, no hidden layer, and no
 * possibility of recovering redacted content by copy-paste or text extraction.
 *
 * Trade-off: rasterised pages lose text searchability and increase file size.
 * Only pages that contain at least one redaction box are rasterised.
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
