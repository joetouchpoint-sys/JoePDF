import { useCallback } from 'react'
import { useStore } from '@/store'

export const ZOOM_STEP = 0.25
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 4

export function useZoom() {
  const zoom = useStore((s) => s.ui.zoom)
  const setZoom = useStore((s) => s.setZoom)

  const zoomIn = useCallback(() => {
    setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))
  }, [zoom, setZoom])

  const zoomOut = useCallback(() => {
    setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))
  }, [zoom, setZoom])

  const resetZoom = useCallback(() => setZoom(1), [setZoom])

  const fitToWidth = useCallback(
    (containerWidth: number, pageWidthPt: number) => {
      const padding = 48
      setZoom((containerWidth - padding) / pageWidthPt)
    },
    [setZoom],
  )

  const fitToPage = useCallback(
    (containerWidth: number, containerHeight: number, pageWidthPt: number, pageHeightPt: number) => {
      const padding = 48
      const scaleW = (containerWidth - padding) / pageWidthPt
      const scaleH = (containerHeight - padding) / pageHeightPt
      setZoom(Math.min(scaleW, scaleH))
    },
    [setZoom],
  )

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWidth,
    fitToPage,
    MIN_ZOOM,
    MAX_ZOOM,
  }
}
