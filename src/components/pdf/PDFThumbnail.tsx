import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy, RenderHandle } from '@/lib/pdfRenderer'
import { renderPageToCanvas } from '@/lib/pdfRenderer'
import { clsx } from 'clsx'

const THUMB_WIDTH = 104

interface PDFThumbnailProps {
  doc: PDFDocumentProxy
  pageNumber: number
  pageIndex: number
  isActive: boolean
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

export function PDFThumbnail({
  doc, pageNumber, pageIndex, isActive, isSelected, onClick,
}: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scale = THUMB_WIDTH / 595 // default A4 until page loads
    let handle: RenderHandle = { promise: Promise.resolve(), cancel: () => {} }

    doc.getPage(pageNumber).then((page) => {
      const vp = page.getViewport({ scale: 1 })
      scale = THUMB_WIDTH / vp.width
      page.cleanup()
      handle = renderPageToCanvas(doc, pageNumber, canvas, scale)
      return handle.promise
    }).catch(() => {})

    return () => handle.cancel()
  }, [doc, pageNumber])

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Page ${pageIndex + 1}${isSelected ? ' (selected)' : ''}`}
      aria-current={isActive ? 'true' : undefined}
      aria-pressed={isSelected}
      className={clsx(
        'flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all w-full',
        'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]',
        isActive && !isSelected && 'bg-blue-50',
        isSelected && 'bg-green-50',
      )}
    >
      <div className={clsx(
        'rounded overflow-hidden shadow-sm border-2 transition-all relative',
        isSelected
          ? 'border-[--color-primary] shadow-green-100'
          : isActive
            ? 'border-blue-400 shadow-blue-100'
            : 'border-slate-200',
      )}>
        <canvas ref={canvasRef} style={{ display: 'block', width: THUMB_WIDTH }} />
        {/* Selection tick */}
        {isSelected && (
          <div
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            ✓
          </div>
        )}
      </div>
      <span className={clsx(
        'text-xs tabular-nums',
        isSelected ? 'text-[--color-primary] font-semibold' : isActive ? 'text-blue-600 font-semibold' : 'text-slate-500',
      )}>
        {pageIndex + 1}
      </span>
    </button>
  )
}
