import { useRef, useEffect, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from '@/lib/pdfRenderer'
import { renderPageToCanvas } from '@/lib/pdfRenderer'
import { AnnotationLayer } from '@/components/canvas/AnnotationLayer'
import { PDFTextLayer } from './PDFTextLayer'
import { useStore } from '@/store'

interface PDFPageProps {
  doc: PDFDocumentProxy
  pageNumber: number
  pageIndex: number
  scale: number
  isActive: boolean
}

export function PDFPage({ doc, pageNumber, pageIndex, scale, isActive }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [pageProxy, setPageProxy] = useState<PDFPageProxy | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const rotation = useStore((s) => s.ui.pageRotations.get(pageIndex) ?? 0)
  const textSelectMode = useStore((s) => s.ui.textSelectMode)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsRendering(true)

    // Each page gets its own independent render handle — no cross-page cancellations
    const handle = renderPageToCanvas(doc, pageNumber, canvas, scale)

    // Get the page proxy for the text layer (separate from the render)
    doc.getPage(pageNumber).then((proxy) => setPageProxy(proxy)).catch(() => {})

    handle.promise.then(() => {
      setDimensions({ width: canvas.width, height: canvas.height })
      setIsRendering(false)
    }).catch(() => {
      setIsRendering(false)
    })

    return () => handle.cancel()
  }, [doc, pageNumber, scale])

  return (
    <div
      id={`pdf-page-${pageIndex}`}
      data-page-index={pageIndex}
      className="relative flex-shrink-0 shadow-lg bg-white"
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
    >
      {isRendering && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-50"
          style={{ width: dimensions.width || 595, height: dimensions.height || 842 }}
        >
          <div className="w-5 h-5 border-2 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <canvas ref={canvasRef} className="block" />

      {!isRendering && dimensions.width > 0 && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: textSelectMode ? 'none' : 'auto',
              zIndex: 10,
            }}
          >
            <AnnotationLayer
              pageIndex={pageIndex}
              width={dimensions.width}
              height={dimensions.height}
            />
          </div>

          {pageProxy && (
            <PDFTextLayer
              page={pageProxy}
              scale={scale}
              width={dimensions.width}
              height={dimensions.height}
              interactive={textSelectMode}
            />
          )}
        </>
      )}

      {isActive && (
        <div
          className="absolute inset-0 ring-2 ring-[--color-primary] ring-offset-1 pointer-events-none"
          style={{ zIndex: 30 }}
        />
      )}
    </div>
  )
}
