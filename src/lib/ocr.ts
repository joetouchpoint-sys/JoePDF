import type { OcrWord } from '@/types/formField'

// Worker is lazily created and reused across pages
let workerPromise: Promise<import('tesseract.js').Worker> | null = null

async function getWorker(): Promise<import('tesseract.js').Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      return worker
    })()
  }
  return workerPromise
}

/**
 * Run OCR on a single page image and return positioned word results.
 * @param imageDataUrl - PNG data URL of the rasterised page
 * @param pageHeightPts - PDF page height in user-space units (for Y-flip)
 * @param renderScale - scale used when rasterising (to convert pixel coords back to PDF units)
 * @param onProgress - called with 0-100 progress values
 */
export async function recognisePage(
  imageDataUrl: string,
  pageHeightPts: number,
  renderScale: number,
  onProgress?: (pct: number) => void,
): Promise<OcrWord[]> {
  const worker = await getWorker()

  const result = await worker.recognize(imageDataUrl, undefined, {
    blocks: false,
    hocr: false,
    tsv: false,
    text: false,
    box: false,
  })

  onProgress?.(100)

  const words: OcrWord[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const word of (result.data as any).words ?? []) {
    if (!word.text?.trim() || word.confidence < 30) continue
    const { x0, y0, x1, y1 } = word.bbox as { x0: number; y0: number; x1: number; y1: number }
    // Convert from rendered-pixel coords to PDF user-space units
    const pdfX = x0 / renderScale
    const pdfW = (x1 - x0) / renderScale
    const pdfH = (y1 - y0) / renderScale
    // Flip Y: PDF bottom-left origin
    const pdfY = pageHeightPts - y1 / renderScale

    words.push({
      text: String(word.text),
      x: pdfX,
      y: pdfY,
      width: pdfW,
      height: pdfH,
      confidence: Number(word.confidence),
    })
  }

  return words
}

/** Terminate the Tesseract worker to free WASM memory. Call when PDF is closed. */
export async function teardownOcr(): Promise<void> {
  if (!workerPromise) return
  const worker = await workerPromise
  await worker.terminate()
  workerPromise = null
}
