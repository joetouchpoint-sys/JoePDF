import { useRef, useEffect, useState, useCallback } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from '@/lib/pdfRenderer'
import { renderPageToCanvas } from '@/lib/pdfRenderer'
import { rasterisePage } from '@/lib/redactionEngine'
import { AnnotationLayer } from '@/components/canvas/AnnotationLayer'
import { PDFTextLayer } from './PDFTextLayer'
import { FormFieldOverlay } from './FormFieldOverlay'
import { OcrTextLayer } from './OcrTextLayer'
import { useStore } from '@/store'
import { showToast } from '@/components/ui/Toast'

interface PDFPageProps {
  doc: PDFDocumentProxy
  pageNumber: number
  pageIndex: number
  scale: number
  isActive: boolean
}

export function PDFPage({ doc, pageNumber, pageIndex, scale, isActive }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [pageProxy, setPageProxy] = useState<PDFPageProxy | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const [hasNativeText, setHasNativeText] = useState(true)
  const [isOcrRunning, setIsOcrRunning] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const rotation = useStore((s) => s.ui.pageRotations.get(pageIndex) ?? 0)
  const textSelectMode = useStore((s) => s.ui.textSelectMode)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const pageMeta = useStore((s) => s.pdf.pageMeta)
  const ocrLayers = useStore((s) => s.ocrLayers)
  const setOcrLayer = useStore((s) => s.setOcrLayer)
  const originalIdx = pageOrder[pageIndex] ?? pageIndex
  const hasOcrLayer = !!ocrLayers.get(originalIdx)

  // Only render once the page scrolls near the viewport — prevents iOS canvas memory exhaustion
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!hasBeenVisible) return
    const canvas = canvasRef.current
    if (!canvas) return

    setIsRendering(true)

    const handle = renderPageToCanvas(doc, pageNumber, canvas, scale)

    doc.getPage(pageNumber).then((proxy) => setPageProxy(proxy)).catch(() => {})

    handle.promise.then(() => {
      setDimensions({ width: canvas.width, height: canvas.height })
      setIsRendering(false)
    }).catch(() => {
      setIsRendering(false)
    })

    return () => handle.cancel()
  }, [doc, pageNumber, scale, hasBeenVisible])

  // Check if the page has native selectable text after the proxy is ready
  useEffect(() => {
    if (!pageProxy) return
    pageProxy.getTextContent().then((tc) => {
      setHasNativeText(tc.items.length > 0)
    }).catch(() => {})
  }, [pageProxy])

  const handleRunOcr = useCallback(async () => {
    if (isOcrRunning) return
    setIsOcrRunning(true)
    setOcrProgress(0)
    try {
      const { recognisePage } = await import('@/lib/ocr')
      const dataUrl = await rasterisePage(doc, pageNumber, 2)
      const pageH = pageMeta[originalIdx]?.height ?? 842
      const words = await recognisePage(dataUrl, pageH, 2, setOcrProgress)
      setOcrLayer(originalIdx, words)
      if (words.length === 0) {
        showToast('No text could be found on this page. The scan quality may be too low.', 'warning')
      } else {
        showToast(`Done — found ${words.length} words. Switch to "Select text" mode to copy.`, 'success')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err) || 'OCR failed.', 'error')
    } finally {
      setIsOcrRunning(false)
    }
  }, [doc, pageNumber, originalIdx, pageMeta, setOcrLayer, isOcrRunning])

  // A4 proportions as placeholder while not yet visible / rendering
  const placeholderW = Math.floor(595 * scale)
  const placeholderH = Math.floor(842 * scale)
  const displayW = dimensions.width || placeholderW
  const displayH = dimensions.height || placeholderH

  return (
    <div
      ref={outerRef}
      id={`pdf-page-${pageIndex}`}
      data-page-index={pageIndex}
      className="relative flex-shrink-0 shadow-lg bg-white"
      style={{
        width: displayW,
        height: displayH,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
    >
      {(!hasBeenVisible || isRendering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          {hasBeenVisible && (
            <div className="w-5 h-5 border-2 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
          )}
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

          <FormFieldOverlay
            pageIndex={pageIndex}
            scale={scale}
          />

          <OcrTextLayer
            pageIndex={pageIndex}
            scale={scale}
          />
        </>
      )}

      {/* OCR button — shown on scanned pages with no native or OCR text */}
      {!isRendering && !hasNativeText && !hasOcrLayer && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 20 }}>
          <button
            type="button"
            onClick={handleRunOcr}
            disabled={isOcrRunning}
            aria-label="Attempt to convert scanned page to selectable text"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white rounded-md shadow disabled:opacity-70 disabled:pointer-events-none"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isOcrRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                {ocrProgress > 0 ? `${ocrProgress}%` : 'Starting…'}
              </>
            ) : (
              'Make text selectable'
            )}
          </button>
        </div>
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
