import { useRef, useEffect, useCallback, useState } from 'react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { PDFPage } from './PDFPage'
import { PageControls } from './PageControls'
import { DrawingOptionsBar } from '@/components/toolbar/DrawingOptionsBar'
import { SelectedAnnotationBar } from '@/components/toolbar/SelectedAnnotationBar'
import { useStore } from '@/store'
import { Tool } from '@/types/tool'

interface PDFViewerProps {
  doc: PDFDocumentProxy
}

export function PDFViewer({ doc }: PDFViewerProps) {
  const pageCount = useStore((s) => s.pdf.pageCount)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const zoom = useStore((s) => s.ui.zoom)
  const currentPage = useStore((s) => s.ui.currentPage)
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  const activeTool = useStore((s) => s.ui.activeTool)
  const pendingStamp = useStore((s) => s.ui.pendingStamp)
  const containerRef = useRef<HTMLDivElement>(null)

  // Suppress observer updates while a programmatic scroll is in flight (thumbnail click)
  const isProgrammaticScrollRef = useRef(false)

  // Track ghost cursor position for stamp mode
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (activeTool !== Tool.STAMP) { setGhostPos(null); return }
    const onMove = (e: MouseEvent) => setGhostPos({ x: e.clientX, y: e.clientY })
    const onLeave = () => setGhostPos(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [activeTool])

  // Scroll to active page when currentPage changes externally (thumbnail click)
  useEffect(() => {
    const el = document.getElementById(`pdf-page-${currentPage}`)
    if (el) {
      isProgrammaticScrollRef.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      const t = setTimeout(() => { isProgrammaticScrollRef.current = false }, 800)
      return () => clearTimeout(t)
    }
  }, [currentPage])

  // Keep a map of all currently visible pages so we always pick the most-visible one
  const visiblePagesRef = useRef<Map<number, number>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect()
    visiblePagesRef.current.clear()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return

        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset['pageIndex'])
          if (!isNaN(idx)) {
            if (entry.isIntersecting && entry.intersectionRatio > 0) {
              visiblePagesRef.current.set(idx, entry.intersectionRatio)
            } else {
              visiblePagesRef.current.delete(idx)
            }
          }
        })

        let maxRatio = 0
        let mostVisible = -1
        for (const [idx, ratio] of visiblePagesRef.current) {
          if (ratio > maxRatio) { maxRatio = ratio; mostVisible = idx }
        }
        if (mostVisible >= 0) setCurrentPage(mostVisible)
      },
      { root: containerRef.current, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] },
    )

    document.querySelectorAll('[data-page-index]').forEach((el) => {
      observerRef.current?.observe(el)
    })
  }, [setCurrentPage])

  useEffect(() => {
    const timer = setTimeout(setupObserver, 300)
    return () => {
      clearTimeout(timer)
      observerRef.current?.disconnect()
    }
  }, [pageCount, zoom, setupObserver])

  if (pageCount === 0) return null

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageControls />
      <DrawingOptionsBar />
      <SelectedAnnotationBar />

      {/* Stamp mode banner */}
      {activeTool === Tool.STAMP && pendingStamp && (
        <div className="flex items-center justify-between gap-3 px-3 h-8 bg-violet-50 border-b border-violet-200 text-xs text-violet-700 flex-shrink-0">
          <span className="font-medium">Stamp mode — click anywhere on the PDF to place your signature</span>
          <button
            onClick={() => {
              useStore.getState().setActiveTool(Tool.SELECT)
              useStore.getState().setPendingStamp(null)
            }}
            className="text-violet-500 hover:text-violet-700 underline"
          >
            Done (Esc)
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        id="pdf-viewer-container"
        className="flex-1 overflow-auto scrollbar-thin bg-slate-200 p-6 flex flex-col items-center gap-6"
        style={{ cursor: activeTool === Tool.STAMP ? 'copy' : undefined }}
      >
        {Array.from({ length: pageCount }, (_, i) => {
          const originalPageNumber = (pageOrder[i] ?? i) + 1
          return (
            <PDFPage
              key={`${i}-${originalPageNumber}`}
              doc={doc}
              pageNumber={originalPageNumber}
              pageIndex={i}
              scale={zoom}
              isActive={i === currentPage}
            />
          )
        })}
        <div className="h-12 flex-shrink-0" aria-hidden />
      </div>

      {/* Stamp ghost image follows cursor */}
      {activeTool === Tool.STAMP && pendingStamp && ghostPos && (
        <img
          src={pendingStamp.src}
          aria-hidden
          style={{
            position: 'fixed',
            left: ghostPos.x - pendingStamp.displayW / 2,
            top: ghostPos.y - pendingStamp.displayH / 2,
            width: pendingStamp.displayW,
            height: pendingStamp.displayH,
            opacity: 0.55,
            pointerEvents: 'none',
            zIndex: 9998,
          }}
        />
      )}
    </div>
  )
}
