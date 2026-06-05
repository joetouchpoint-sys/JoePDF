import { useEffect, useRef, useCallback } from 'react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { renderPageToCanvas } from '@/lib/pdfRenderer'

interface UsePDFPageOptions {
  doc: PDFDocumentProxy | null
  pageNumber: number
  scale: number
}

/**
 * Renders a single PDF page onto a canvas ref.
 * Returns a ref to attach to a <canvas> element and a boolean indicating render state.
 */
export function usePDFPage({ doc, pageNumber, scale }: UsePDFPageOptions): {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  isRendering: boolean
} {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isRenderingRef = useRef(false)

  const render = useCallback(async () => {
    const canvas = canvasRef.current
    if (!doc || !canvas) return

    isRenderingRef.current = true
    try {
      await renderPageToCanvas(doc, pageNumber, canvas, scale)
    } catch {
      // Render cancelled or doc destroyed — ignore
    } finally {
      isRenderingRef.current = false
    }
  }, [doc, pageNumber, scale])

  useEffect(() => {
    void render()
  }, [render])

  // isRenderingRef is accessed outside render (only used as a return hint, not for conditional rendering)
  // eslint-disable-next-line react-hooks/refs
  return { canvasRef, isRendering: isRenderingRef.current }
}
