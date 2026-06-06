/**
 * PDF export pipeline.
 *
 * Steps:
 * 1. Load original bytes into pdf-lib.
 * 2. Build the output page list from the store's page order.
 * 3. For each page with rasterised content (redactions applied):
 *    embed the PNG and replace the page with a full-bleed image.
 * 4. For other pages: draw JoePDF annotations using annotationSerializer.
 * 5. Optionally strip metadata.
 * 6. Return the output Uint8Array.
 */

import { PDFDocument, PDFName, degrees } from 'pdf-lib'
import type { Annotation } from '@/types/annotation'
import type { PageMeta } from '@/types/pdf'
import { serialiseAnnotations } from './annotationSerializer'

export interface ExportOptions {
  removeMetadata: boolean
}

export interface ExportInput {
  originalBytes: ArrayBuffer
  pageOrder: number[]
  pageMeta: PageMeta[]
  annotationsByPage: Map<number, Annotation[]>
  rasterisedPages: Map<number, ArrayBuffer>
  pageRotations: Map<number, number>
  fileName: string
  options: ExportOptions
  customFont?: { name: string; bytes: Uint8Array } | null
}

export async function exportPDF(input: ExportInput): Promise<Uint8Array> {
  const {
    originalBytes,
    pageOrder,
    pageMeta,
    annotationsByPage,
    rasterisedPages,
    pageRotations,
    options,
    customFont,
  } = input

  const srcDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: false })
  const outDoc = await PDFDocument.create()

  for (let logicalIdx = 0; logicalIdx < pageOrder.length; logicalIdx++) {
    const originalIdx = pageOrder[logicalIdx] ?? logicalIdx
    const rasterised = rasterisedPages.get(logicalIdx)

    if (rasterised) {
      // Redacted page — replace with PNG image
      const srcMeta = pageMeta[originalIdx]
      const pageW = srcMeta?.width ?? 595
      const pageH = srcMeta?.height ?? 842

      const pngImage = await outDoc.embedPng(rasterised)
      const newPage = outDoc.addPage([pageW, pageH])
      newPage.drawImage(pngImage, { x: 0, y: 0, width: pageW, height: pageH })
    } else {
      // Normal page — copy from source and add annotations
      const [copiedPage] = await outDoc.copyPages(srcDoc, [originalIdx])
      if (!copiedPage) continue
      outDoc.addPage(copiedPage)

      const outPage = outDoc.getPage(outDoc.getPageCount() - 1)
      const annotations = annotationsByPage.get(logicalIdx) ?? []
      const nonRedact = annotations.filter((a) => a.type !== 'redact')

      if (nonRedact.length > 0) {
        const viewport = copiedPage.getSize()
        // Annotations are stored in PDF user-space units (scale=1 coordinate system),
        // so no scaling conversion is needed.
        await serialiseAnnotations(outDoc, outPage, nonRedact, {
          scale: 1,
          pageWidthPt: viewport.width,
          pageHeightPt: viewport.height,
          customFont,
        })
      }

      // Apply rotation
      const rotation = pageRotations.get(logicalIdx)
      if (rotation) {
        const currentRotation = outPage.getRotation().angle
        outPage.setRotation(degrees((currentRotation + rotation) % 360))
      }
    }
  }

  if (options.removeMetadata) {
    stripMetadata(outDoc)
  }

  return outDoc.save({ useObjectStreams: true })
}

function stripMetadata(doc: PDFDocument): void {
  try {
    doc.setTitle('')
    doc.setAuthor('')
    doc.setSubject('')
    doc.setKeywords([])
    doc.setCreator('JoePDF')
    doc.setProducer('JoePDF')
  } catch {
    // Best-effort
  }

  try {
    const catalog = doc.catalog
    if (catalog.has(PDFName.of('Metadata'))) {
      catalog.delete(PDFName.of('Metadata'))
    }
  } catch {
    // Best-effort
  }
}
