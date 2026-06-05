/**
 * Word export — embeds each PDF page as a full-width PNG image in a .docx file.
 *
 * Note: this produces a document-as-images Word file. Text in the resulting
 * .docx is not directly editable; the document is a faithful visual copy of
 * the PDF at the time of export (including all annotations). This is the only
 * reliable browser-only PDF→Word conversion approach.
 */

import { Document, Packer, Paragraph, ImageRun, AlignmentType } from 'docx'
import type { PDFDocumentProxy } from './pdfRenderer'

// A4 page width in EMUs at 96 DPI: 8.27 inches × 914400 EMUs/inch
const A4_WIDTH_EMU = 7_772_400
const RENDER_SCALE = 1.5 // render at 1.5× for quality

export interface WordExportOptions {
  fileName: string
  pageOrder: number[]
}

export async function exportToWord(
  doc: PDFDocumentProxy,
  options: WordExportOptions,
): Promise<void> {
  const { fileName, pageOrder } = options
  const paragraphs: Paragraph[] = []

  for (let logicalIdx = 0; logicalIdx < pageOrder.length; logicalIdx++) {
    const originalPageNum = (pageOrder[logicalIdx] ?? logicalIdx) + 1
    const page = await doc.getPage(originalPageNum)
    const viewport = page.getViewport({ scale: RENDER_SCALE })

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx as any, viewport, canvas }).promise
    page.cleanup()

    const pngBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
    )
    const pngBuffer = await pngBlob.arrayBuffer()

    // Scale the image to fit the A4 page width, preserving aspect ratio
    const aspectRatio = canvas.height / canvas.width
    const widthEmu = A4_WIDTH_EMU
    const heightEmu = Math.round(widthEmu * aspectRatio)

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: new Uint8Array(pngBuffer),
            transformation: { width: Math.round(widthEmu / 9144), height: Math.round(heightEmu / 9144) },
            type: 'png',
          }),
        ],
        spacing: { before: 0, after: 0 },
      }),
    )
  }

  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        },
        children: paragraphs,
      },
    ],
  })

  const base64 = await Packer.toBase64String(wordDoc)
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)!
  }

  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.replace(/\.pdf$/i, '') + '.docx'
  a.click()
  URL.revokeObjectURL(url)
}
