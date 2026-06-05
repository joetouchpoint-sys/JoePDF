import { PDFDocument } from 'pdf-lib'

export interface CompressResult {
  bytes: Uint8Array
  originalSize: number
  compressedSize: number
  savingsPercent: number
}

export async function compressPDF(pdfBytes: ArrayBuffer | Uint8Array): Promise<CompressResult> {
  const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
  const originalSize = bytes.byteLength
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const compressed = await doc.save({ useObjectStreams: true })
  const compressedSize = compressed.byteLength
  const savingsPercent = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
  return { bytes: compressed, originalSize, compressedSize, savingsPercent }
}
