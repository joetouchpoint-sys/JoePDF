import { PDFDocument } from 'pdf-lib'

/**
 * Append all pages from appendBytes to the end of baseBytes.
 * Returns the merged PDF as an ArrayBuffer.
 */
export async function mergePDF(
  baseBytes: ArrayBuffer,
  appendBytes: ArrayBuffer,
): Promise<ArrayBuffer> {
  const baseDoc = await PDFDocument.load(baseBytes)
  const srcDoc = await PDFDocument.load(appendBytes)

  const pageIndices = Array.from({ length: srcDoc.getPageCount() }, (_, i) => i)
  const copiedPages = await baseDoc.copyPages(srcDoc, pageIndices)
  for (const page of copiedPages) baseDoc.addPage(page)

  const merged = await baseDoc.save()
  return merged.buffer.slice(merged.byteOffset, merged.byteOffset + merged.byteLength) as ArrayBuffer
}

/**
 * Split the PDF at splitAfterPage (0-based logical index).
 * Returns [part1Bytes, part2Bytes].
 */
export async function splitPDF(
  originalBytes: ArrayBuffer,
  pageOrder: number[],
  splitAfterPage: number,
): Promise<[ArrayBuffer, ArrayBuffer]> {
  const srcDoc = await PDFDocument.load(originalBytes)

  const part1Indices = pageOrder.slice(0, splitAfterPage + 1)
  const part2Indices = pageOrder.slice(splitAfterPage + 1)

  const doc1 = await PDFDocument.create()
  const doc2 = await PDFDocument.create()

  const pages1 = await doc1.copyPages(srcDoc, part1Indices)
  for (const p of pages1) doc1.addPage(p)

  const pages2 = await doc2.copyPages(srcDoc, part2Indices)
  for (const p of pages2) doc2.addPage(p)

  const b1 = await doc1.save()
  const b2 = await doc2.save()

  const toAB = (u: Uint8Array): ArrayBuffer =>
    u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer

  return [toAB(b1), toAB(b2)]
}
