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
 *
 * Coordinate note: PDF.js viewport.transform already accounts for the Y-flip
 * (PDF bottom-left → screen top-left). After Util.transform, tx[4]/tx[5] are
 * correct screen-space coordinates. We must NOT re-apply the Y flip in the CSS
 * matrix — instead we extract just the rotation angle and use plain font-size +
 * top/left positioning, which avoids the upside-down text bug.
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
        if (!('str' in item) || !item.str.trim()) continue

        // Combine the viewport transform with the text item transform.
        // viewport.transform = [scale, 0, 0, -scale, 0, pageHeightPx]
        // After multiplication, tx[4]/tx[5] are the baseline position in screen px.
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)

        // Font height: use the Y-axis column of the matrix (tx[2], tx[3]).
        // For upright text tx[3] = -fontHeight (negative because of Y-flip).
        // sqrt gives the absolute magnitude regardless of sign.
        const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
        if (fontHeight < 2) continue

        // Rotation angle from the X-axis column (tx[0], tx[1]).
        // Negate to convert from PDF-space rotation to CSS-space rotation.
        const angle = Math.atan2(tx[1], tx[0])

        const span = document.createElement('span')
        span.textContent = item.str

        // tx[5] is the baseline Y in screen px (already flipped by viewport).
        // CSS `top` positions the TOP of the element, so subtract fontHeight to
        // align the element's bottom edge (≈ baseline) with tx[5].
        // transform-origin: 0 100% means rotate around the bottom-left corner
        // so the baseline anchor stays fixed during rotation.
        span.style.cssText = `
          position: absolute;
          left: ${tx[4]}px;
          top: ${tx[5] - fontHeight}px;
          font-size: ${fontHeight}px;
          transform: rotate(${-angle}rad);
          transform-origin: 0 100%;
          white-space: pre;
          line-height: 1;
          color: transparent;
          cursor: text;
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
        zIndex: interactive ? 20 : 1,
        pointerEvents: interactive ? 'auto' : 'none',
        userSelect: interactive ? 'text' : 'none',
        background: interactive ? 'rgba(160,218,0,0.06)' : 'transparent',
      }}
    />
  )
}
