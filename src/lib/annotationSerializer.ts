/**
 * Converts JoePDF annotations to pdf-lib drawing operations.
 *
 * Coordinate system note:
 *   Konva uses top-left origin (Y↓). pdf-lib uses bottom-left origin (Y↑).
 *   All Y coordinates are transformed: pdfY = pageHeightPt - canvasY/scale - annotationHeightPt
 */

import { PDFPage, PDFDocument, StandardFonts, LineCapStyle } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import type { Annotation } from '@/types/annotation'
import { hexToPdfRgb } from '@/utils/colorUtils'
import type { DmSansFontSet } from './dmSansFont'

interface SerialiseOptions {
  scale: number
  pageWidthPt: number
  pageHeightPt: number
  customFont?: { name: string; bytes: Uint8Array } | null
  dmSansFonts?: DmSansFontSet
}

function canvasYToPdfY(
  canvasY: number,
  annotHeightPx: number,
  scale: number,
  pageHeightPt: number,
): number {
  return pageHeightPt - canvasY / scale - annotHeightPx / scale
}

export async function serialiseAnnotations(
  pdfDoc: PDFDocument,
  page: PDFPage,
  annotations: Annotation[],
  opts: SerialiseOptions,
): Promise<void> {
  const { scale, pageHeightPt, customFont, dmSansFonts } = opts

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
  const courier = await pdfDoc.embedFont(StandardFonts.Courier)
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold)
  const courierOblique = await pdfDoc.embedFont(StandardFonts.CourierOblique)
  const courierBoldOblique = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique)

  // Embed DM Sans variants once if font data was provided
  let dmSansEmbed: { regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont } | null = null
  if (dmSansFonts) {
    try {
      const [regular, bold, italic, boldItalic] = await Promise.all([
        pdfDoc.embedFont(dmSansFonts.regular, { subset: true }),
        pdfDoc.embedFont(dmSansFonts.bold, { subset: true }),
        pdfDoc.embedFont(dmSansFonts.italic, { subset: true }),
        pdfDoc.embedFont(dmSansFonts.boldItalic, { subset: true }),
      ])
      dmSansEmbed = { regular, bold, italic, boldItalic }
    } catch {
      // Fall through to Helvetica if DM Sans embedding fails
    }
  }

  // Embed custom (branding) font once, lazily on first use
  let embeddedCustomFont: PDFFont | null = null
  async function getCustomFont() {
    if (!embeddedCustomFont && customFont) {
      try {
        embeddedCustomFont = await pdfDoc.embedFont(customFont.bytes)
      } catch {
        // Fall back to Helvetica if embedding fails
      }
    }
    return embeddedCustomFont
  }

  function pickStandardFont(family: string, bold: boolean, italic: boolean): PDFFont {
    const f = family.toLowerCase()
    if (f.includes('times') || f === 'georgia') {
      return bold && italic ? timesBoldItalic : bold ? timesBold : italic ? timesItalic : timesRoman
    }
    if (f.includes('courier')) {
      return bold && italic ? courierBoldOblique : bold ? courierBold : italic ? courierOblique : courier
    }
    // Helvetica / Arial / Verdana / DM Sans fallback / default
    return bold && italic ? helveticaBoldOblique : bold ? helveticaBold : italic ? helveticaOblique : helvetica
  }

  for (const ann of annotations) {
    if (!ann.visible || ann.type === 'redact' || ann.type === 'formfield') continue

    const x = ann.x / scale
    const width = ann.width / scale
    const height = ann.height / scale
    const y = canvasYToPdfY(ann.y, ann.height, scale, pageHeightPt)

    switch (ann.type) {
      case 'text': {
        const isDmSans = ann.fontFamily === 'DM Sans'
        const usesCustomFont = customFont && ann.fontFamily === customFont.name
        let font: PDFFont
        if (isDmSans && dmSansEmbed) {
          font = ann.fontBold && ann.fontItalic ? dmSansEmbed.boldItalic
            : ann.fontBold ? dmSansEmbed.bold
            : ann.fontItalic ? dmSansEmbed.italic
            : dmSansEmbed.regular
        } else if (usesCustomFont) {
          font = (await getCustomFont()) ?? helvetica
        } else {
          font = pickStandardFont(ann.fontFamily, ann.fontBold, ann.fontItalic)
        }
        const fontSize = ann.fontSize / scale
        page.drawText(ann.text || ' ', {
          x,
          y: y + height - fontSize,
          size: fontSize,
          font,
          color: hexToPdfRgb(ann.fontColor),
          opacity: ann.opacity,
          maxWidth: width,
        })
        break
      }

      case 'rect':
        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: ann.fillColor ? hexToPdfRgb(ann.fillColor) : undefined,
          borderColor: hexToPdfRgb(ann.strokeColor),
          borderWidth: ann.strokeWidth / scale,
          opacity: ann.opacity,
          borderOpacity: ann.opacity,
        })
        break

      case 'ellipse':
        page.drawEllipse({
          x: x + width / 2,
          y: y + height / 2,
          xScale: width / 2,
          yScale: height / 2,
          color: ann.fillColor ? hexToPdfRgb(ann.fillColor) : undefined,
          borderColor: hexToPdfRgb(ann.strokeColor),
          borderWidth: ann.strokeWidth / scale,
          opacity: ann.opacity,
          borderOpacity: ann.opacity,
        })
        break

      case 'line':
      case 'arrow': {
        const pts = ann.points
        if (pts.length < 4) break
        const x1 = (pts[0] ?? 0) / scale
        const y1 = pageHeightPt - (pts[1] ?? 0) / scale
        const x2 = (pts[2] ?? 0) / scale
        const y2 = pageHeightPt - (pts[3] ?? 0) / scale
        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: ann.strokeWidth / scale,
          color: hexToPdfRgb(ann.strokeColor),
          opacity: ann.opacity,
          lineCap: LineCapStyle.Round,
        })
        break
      }

      case 'highlight':
        page.drawRectangle({
          x,
          y,
          width,
          height,
          color: hexToPdfRgb(ann.fillColor),
          opacity: ann.opacity * 0.4,
        })
        break

      case 'freehand': {
        const pts = ann.points
        if (pts.length < 4) break
        for (let i = 0; i < pts.length - 2; i += 2) {
          page.drawLine({
            start: { x: (pts[i] ?? 0) / scale, y: pageHeightPt - (pts[i + 1] ?? 0) / scale },
            end: { x: (pts[i + 2] ?? 0) / scale, y: pageHeightPt - (pts[i + 3] ?? 0) / scale },
            thickness: ann.strokeWidth / scale,
            color: hexToPdfRgb(ann.strokeColor),
            opacity: ann.opacity,
            lineCap: LineCapStyle.Round,
          })
        }
        break
      }

      case 'image': {
        try {
          const isPng = ann.src.startsWith('data:image/png')
          const base64 = ann.src.split(',')[1]
          if (!base64) break
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
          const img = isPng
            ? await pdfDoc.embedPng(bytes)
            : await pdfDoc.embedJpg(bytes)
          page.drawImage(img, { x, y, width, height, opacity: ann.opacity })
        } catch {
          // Skip images that fail to embed
        }
        break
      }
    }
  }
}
