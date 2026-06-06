import type Tesseract from 'tesseract.js'
import type { OcrWord } from '@/types/formField'

let workerPromise: Promise<Tesseract.Worker> | null = null

async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`
    const workerPath = `${base}tesseract-worker.min.js`
    // corePath points to a specific .js file — Tesseract skips SIMD detection and uses it directly.
    // SIMD is supported on all modern browsers (Chrome 91+, Edge 91+, Firefox 89+, Safari 16.4+).
    const corePath = `${base}tesseract-core-simd-lstm.wasm.js`

    workerPromise = import('tesseract.js')
      .then(({ createWorker }) => createWorker('eng', undefined, { workerPath, corePath }))

    // Reset on failure so subsequent calls can retry
    workerPromise.catch(() => { workerPromise = null })
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
  let worker: Tesseract.Worker
  try {
    worker = await getWorker()
  } catch (err) {
    throw new Error(
      `Could not start OCR engine: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  onProgress?.(10)

  let result: Tesseract.RecognizeResult
  try {
    result = await worker.recognize(imageDataUrl, undefined, {
      blocks: true, // words are nested inside blocks → paragraphs → lines → words
      hocr: false,
      tsv: false,
      text: false,
      box: false,
    })
  } catch (err) {
    throw new Error(
      `OCR recognition failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  onProgress?.(100)

  const words: OcrWord[] = []
  for (const block of result.data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const word of line.words ?? []) {
          if (!word.text?.trim() || word.confidence < 30) continue
          const { x0, y0: _y0, x1, y1 } = word.bbox
          const pdfX = x0 / renderScale
          const pdfW = (x1 - x0) / renderScale
          const pdfH = (y1 - _y0) / renderScale
          // Flip Y: PDF uses bottom-left origin
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
      }
    }
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
