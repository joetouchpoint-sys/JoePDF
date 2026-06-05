import { useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFPageProxy } from 'pdfjs-dist'

interface PDFTextLayerProps {
  page: PDFPageProxy
  scale: number
  width: number
  height: number
  interactive: boolean
}

/**
 * Renders an invisible but selectable text layer over the PDF canvas.
 * Uses PDF.js getTextContent() + Util.transform to position each text span
 * exactly over the corresponding canvas text.
 */
export function PDFTextLayer({ page, scale, width, height, interactive }: PDFTextLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    let cancelled = false
    const viewport = page.getViewport({ scale })

    page.getTextContent().then((textContent) => {
      if (cancelled || !container) return

      for (const item of textContent.items) {
        if (!('str' in item) || !item.str) continue

        // Transform from PDF user-space to canvas/viewport coordinates
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)

        // Font height from the matrix scale components
        const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
        if (fontHeight < 1) continue

        const span = document.createElement('span')
        span.textContent = item.str

        // Position using CSS matrix transform. tx[4] = x offset, tx[5] = y offset.
        // Subtract fontHeight * 0.8 to align baseline (PDF origin is at text baseline).
        span.style.cssText = `
          position: absolute;
          left: 0;
          top: 0;
          transform: matrix(${tx[0]}, ${tx[1]}, ${tx[2]}, ${tx[3]}, ${tx[4]}, ${tx[5] - fontHeight * 0.8});
          transform-origin: 0 0;
          white-space: pre;
          font-size: ${fontHeight}px;
          line-height: 1;
          color: transparent;
        `

        container.appendChild(span)
      }
    }).catch(() => {})

    return () => { cancelled = true }
  }, [page, scale])

  return (
    <div
      ref={containerRef}
      aria-hidden={!interactive}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        overflow: 'hidden',
        // When interactive: z-index above Konva canvas so text can be selected
        // When not interactive: z-index below so Konva handles events
        zIndex: interactive ? 20 : 1,
        pointerEvents: interactive ? 'auto' : 'none',
        userSelect: interactive ? 'text' : 'none',
        cursor: interactive ? 'text' : 'default',
        // Subtle highlight when in text-select mode
        background: interactive ? 'rgba(251,191,36,0.05)' : 'transparent',
      }}
    />
  )
}
