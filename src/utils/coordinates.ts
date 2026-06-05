/**
 * Coordinate transforms between Konva canvas space and pdf-lib page space.
 *
 * Konva: top-left origin, Y increases downward, units = CSS pixels at current zoom.
 * pdf-lib: bottom-left origin, Y increases upward, units = PDF user-space points (1pt = 1/72in).
 *
 * At 96 DPI (CSS standard), 1 CSS pixel = 96/72 = 1.3333... pt.
 * PDF.js uses a 1:1 mapping where 1px of the rendered canvas = 1pt / scale factor.
 * At zoom=1, PDF.js renders at 96 DPI (configurable via viewport).
 */

export interface CanvasPoint {
  x: number
  y: number
}

export interface PDFPoint {
  x: number
  y: number
}

export interface PageDimensions {
  /** Page width in PDF user-space units (points) */
  widthPt: number
  /** Page height in PDF user-space units (points) */
  heightPt: number
}

/**
 * Convert Konva canvas coords (at given zoom scale) to pdf-lib page coords.
 * annotationHeight is needed because pdf-lib draws from bottom-left of the annotation.
 */
export function canvasToPdf(
  canvasX: number,
  canvasY: number,
  annotationWidthPx: number,
  annotationHeightPx: number,
  scale: number,
  page: PageDimensions,
): { x: number; y: number; width: number; height: number } {
  const width = annotationWidthPx / scale
  const height = annotationHeightPx / scale

  const pdfX = canvasX / scale
  const pdfY = page.heightPt - canvasY / scale - height

  return {
    x: Math.round(pdfX * 100) / 100,
    y: Math.round(pdfY * 100) / 100,
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
  }
}

/**
 * Convert a scaled canvas coordinate to an unscaled PDF user-space value.
 * Use for font sizes, stroke widths, etc.
 */
export function scaledPxToPt(px: number, scale: number): number {
  return Math.round((px / scale) * 100) / 100
}

/**
 * Derive the scale factor PDF.js uses for a page: canvas pixels per PDF user-space unit.
 * viewport.width is canvas pixels; page.view[2] is page width in user-space units.
 */
export function getPageScale(
  viewportWidth: number,
  pageWidthPt: number,
): number {
  return viewportWidth / pageWidthPt
}

/**
 * Convert Konva points array (flat [x0,y0,x1,y1,...]) from canvas space to PDF space.
 */
export function canvasPointsToPdf(
  points: number[],
  scale: number,
  pageHeightPt: number,
): number[] {
  const result: number[] = []
  for (let i = 0; i < points.length; i += 2) {
    const px = points[i] ?? 0
    const py = points[i + 1] ?? 0
    result.push(px / scale, pageHeightPt - py / scale)
  }
  return result
}

export { }
