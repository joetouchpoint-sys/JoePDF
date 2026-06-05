import { useRef, useEffect, useState } from 'react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { renderPageToCanvas } from '@/lib/pdfRenderer'
import { AnnotationLayer } from '@/components/canvas/AnnotationLayer'
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
  const [isRendering, setIsRendering] = useState(true)
  const rotation = useStore((s) => s.ui.pageRotations.get(pageIndex) ?? 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    setIsRendering(true)

    renderPageToCanvas(doc, pageNumber, canvas, scale)
      .then(() => {
        if (cancelled) return
        setDimensions({ width: canvas.width, height: canvas.height })
        setIsRendering(false)
      })
      .catch(() => {
        if (!cancelled) setIsRendering(false)
      })

    return () => { cancelled = true }
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
          className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded"
          style={{ width: dimensions.width || 595, height: dimensions.height || 842 }}
        >
          <div className="w-5 h-5 border-2 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <canvas ref={canvasRef} className="block" />
      {!isRendering && dimensions.width > 0 && (
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', position: 'absolute', inset: 0 }}>
            <AnnotationLayer
              pageIndex={pageIndex}
              width={dimensions.width}
              height={dimensions.height}
            />
          </div>
        </div>
      )}
      {isActive && (
        <div className="absolute inset-0 ring-2 ring-[--color-primary] ring-offset-1 rounded pointer-events-none" />
      )}
    </div>
  )
}
