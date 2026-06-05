import { useRef, useEffect, useCallback } from 'react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { PDFPage } from './PDFPage'
import { PageControls } from './PageControls'
import { DrawingOptionsBar } from '@/components/toolbar/DrawingOptionsBar'
import { SelectedAnnotationBar } from '@/components/toolbar/SelectedAnnotationBar'
import { useStore } from '@/store'

interface PDFViewerProps {
  doc: PDFDocumentProxy
}

export function PDFViewer({ doc }: PDFViewerProps) {
  const pageCount = useStore((s) => s.pdf.pageCount)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const zoom = useStore((s) => s.ui.zoom)
  const currentPage = useStore((s) => s.ui.currentPage)
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  const containerRef = useRef<HTMLDivElement>(null)

  // Suppress observer updates while a programmatic scroll is in flight (thumbnail click)
  const isProgrammaticScrollRef = useRef(false)

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

  // Track visible page with IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset['pageIndex'])
          if (!isNaN(idx)) setCurrentPage(idx)
        }
      },
      { root: containerRef.current, threshold: 0 },
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
      <div
        ref={containerRef}
        id="pdf-viewer-container"
        className="flex-1 overflow-auto scrollbar-thin bg-slate-200 p-6 flex flex-col items-center gap-6"
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
    </div>
  )
}
