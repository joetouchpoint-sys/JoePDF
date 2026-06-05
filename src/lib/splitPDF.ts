import { PDFDocument } from 'pdf-lib'
import { downloadFile } from '@/utils/fileUtils'

export async function splitPDFAtPage(
  pdfBytes: ArrayBuffer | Uint8Array,
  splitAfterPage: number,
  pageCount: number,
  pageOrder: number[],
  baseName: string,
): Promise<void> {
  const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
  const srcDoc = await PDFDocument.load(bytes)

  const leftIndices = Array.from({ length: splitAfterPage }, (_, i) => pageOrder[i] ?? i)
  const rightIndices = Array.from(
    { length: pageCount - splitAfterPage },
    (_, i) => pageOrder[splitAfterPage + i] ?? (splitAfterPage + i),
  )

  const leftDoc = await PDFDocument.create()
  const leftPages = await leftDoc.copyPages(srcDoc, leftIndices)
  leftPages.forEach((p) => leftDoc.addPage(p))
  const leftBytes = await leftDoc.save()

  const rightDoc = await PDFDocument.create()
  const rightPages = await rightDoc.copyPages(srcDoc, rightIndices)
  rightPages.forEach((p) => rightDoc.addPage(p))
  const rightBytes = await rightDoc.save()

  downloadFile(leftBytes, `${baseName}-part1-pages1-${splitAfterPage}.pdf`)
  await new Promise<void>((r) => setTimeout(r, 200))
  downloadFile(rightBytes, `${baseName}-part2-pages${splitAfterPage + 1}-${pageCount}.pdf`)
}
