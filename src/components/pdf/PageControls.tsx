import { useCallback, useRef } from 'react'
import { ZoomIn, ZoomOut, Maximize2, AlignCenter, RotateCcw, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { useZoom } from '@/hooks/useZoom'
import { useStore } from '@/store'

export function PageControls() {
  const { zoom, zoomIn, zoomOut, resetZoom, setZoom, MIN_ZOOM, MAX_ZOOM } = useZoom()
  const currentPage = useStore((s) => s.ui.currentPage)
  const pageCount = useStore((s) => s.pdf.pageCount)
  const pageMeta = useStore((s) => s.pdf.pageMeta)
  const setPageRotation = useStore((s) => s.setPageRotation)
  const pageRotations = useStore((s) => s.ui.pageRotations)
  const textSelectMode = useStore((s) => s.ui.textSelectMode)
  const containerRef = useRef<HTMLDivElement>(null)

  const rotateCW = useCallback(() => {
    const current = pageRotations.get(currentPage) ?? 0
    setPageRotation(currentPage, (current + 90) % 360)
  }, [currentPage, pageRotations, setPageRotation])

  const rotateCCW = useCallback(() => {
    const current = pageRotations.get(currentPage) ?? 0
    setPageRotation(currentPage, (current - 90 + 360) % 360)
  }, [currentPage, pageRotations, setPageRotation])

  const fitToWidth = useCallback(() => {
    const container = document.getElementById('pdf-viewer-container')
    if (!container) return
    const meta = pageMeta[currentPage]
    if (!meta) return
    const padding = 48
    setZoom((container.clientWidth - padding) / meta.width)
  }, [currentPage, pageMeta, setZoom])

  const fitToPage = useCallback(() => {
    const container = document.getElementById('pdf-viewer-container')
    if (!container) return
    const meta = pageMeta[currentPage]
    if (!meta) return
    const padding = 48
    const scaleW = (container.clientWidth - padding) / meta.width
    const scaleH = (container.clientHeight - padding) / meta.height
    setZoom(Math.min(scaleW, scaleH))
  }, [currentPage, pageMeta, setZoom])

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div
      ref={containerRef}
      className="h-9 flex items-center gap-1 px-2 bg-white border-b border-slate-100 text-sm flex-shrink-0"
    >
      <Tooltip content="Zoom out" shortcut="-" side="bottom">
        <Button variant="ghost" size="icon" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      <button
        className="min-w-[3.5rem] text-center text-xs font-medium text-slate-600 hover:bg-slate-100 rounded px-1.5 py-1 tabular-nums"
        onClick={resetZoom}
        aria-label={`Zoom level: ${zoomPercent}%. Click to reset.`}
        title="Click to reset to 100%"
      >
        {zoomPercent}%
      </button>

      <Tooltip content="Zoom in" shortcut="+" side="bottom">
        <Button variant="ghost" size="icon" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      <Tooltip content="Fit to width" side="bottom">
        <Button variant="ghost" size="icon" onClick={fitToWidth} aria-label="Fit to width">
          <AlignCenter className="w-3.5 h-3.5 rotate-90" />
        </Button>
      </Tooltip>

      <Tooltip content="Fit to page" side="bottom">
        <Button variant="ghost" size="icon" onClick={fitToPage} aria-label="Fit to page">
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      <Tooltip content="Rotate left" side="bottom">
        <Button variant="ghost" size="icon" onClick={rotateCCW} aria-label="Rotate page counter-clockwise">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      <Tooltip content="Rotate right" side="bottom">
        <Button variant="ghost" size="icon" onClick={rotateCW} aria-label="Rotate page clockwise">
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      <div className="ml-auto flex items-center gap-2 pr-1">
        {textSelectMode && (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
            Text select mode — click toolbar to draw
          </span>
        )}
        <span className="text-xs text-slate-400 tabular-nums">
          {pageCount > 0 && `Page ${currentPage + 1} of ${pageCount}`}
        </span>
      </div>
    </div>
  )
}
