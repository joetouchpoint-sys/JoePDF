import { PDFDocument } from 'pdf-lib'

export async function mergePDFs(
  firstBytes: ArrayBuffer | Uint8Array,
  secondBytes: ArrayBuffer | Uint8Array,
  position: 'append' | 'prepend',
): Promise<Uint8Array> {
  const a = firstBytes instanceof Uint8Array ? firstBytes : new Uint8Array(firstBytes)
  const b = secondBytes instanceof Uint8Array ? secondBytes : new Uint8Array(secondBytes)

  const [docA, docB] = await Promise.all([PDFDocument.load(a), PDFDocument.load(b)])
  const merged = await PDFDocument.create()

  const [first, second] = position === 'append' ? [docA, docB] : [docB, docA]
  const firstPages = await merged.copyPages(first, first.getPageIndices())
  firstPages.forEach((p) => merged.addPage(p))
  const secondPages = await merged.copyPages(second, second.getPageIndices())
  secondPages.forEach((p) => merged.addPage(p))

  return merged.save()
}
