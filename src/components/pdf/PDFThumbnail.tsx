import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { renderPageToCanvas } from '@/lib/pdfRenderer'
import { clsx } from 'clsx'

const THUMB_WIDTH = 104

interface PDFThumbnailProps {
  doc: PDFDocumentProxy
  pageNumber: number
  pageIndex: number
  isActive: boolean
  onClick: () => void
}

export function PDFThumbnail({ doc, pageNumber, pageIndex, isActive, onClick }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false

    doc.getPage(pageNumber).then((page) => {
      if (cancelled) return
      const vp = page.getViewport({ scale: 1 })
      const scale = THUMB_WIDTH / vp.width
      page.cleanup()
      return renderPageToCanvas(doc, pageNumber, canvas, scale)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [doc, pageNumber])

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Go to page ${pageIndex + 1}`}
      aria-current={isActive ? 'true' : undefined}
      className={clsx(
        'flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all w-full',
        'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]',
        isActive && 'bg-blue-50',
      )}
    >
      <div className={clsx(
        'rounded overflow-hidden shadow-sm border transition-all',
        isActive ? 'border-[--color-primary] shadow-blue-100' : 'border-slate-200',
      )}>
        <canvas ref={canvasRef} style={{ display: 'block', width: THUMB_WIDTH }} />
      </div>
      <span className={clsx(
        'text-xs tabular-nums',
        isActive ? 'text-[--color-primary] font-semibold' : 'text-slate-500',
      )}>
        {pageIndex + 1}
      </span>
    </button>
  )
}
