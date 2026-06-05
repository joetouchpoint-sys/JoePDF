import { PDFDocument } from 'pdf-lib'

export interface CompressResult {
  bytes: Uint8Array
  originalSize: number
  compressedSize: number
  savingsPercent: number
}

export async function compressPDF(pdfBytes: Uint8Array): Promise<CompressResult> {
  const originalSize = pdfBytes.byteLength
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const compressed = await doc.save({ useObjectStreams: true })
  const compressedSize = compressed.byteLength
  const savingsPercent = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
  return { bytes: compressed, originalSize, compressedSize, savingsPercent }
}
