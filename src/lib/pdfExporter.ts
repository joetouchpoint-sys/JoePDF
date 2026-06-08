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
import type { Annotation, FormFieldAnnotation } from '@/types/annotation'
import type { PageMeta } from '@/types/pdf'
import { serialiseAnnotations } from './annotationSerializer'
import { loadDmSansFonts } from './dmSansFont'
import type { DmSansFontSet } from './dmSansFont'

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
  formValues?: Record<string, string | boolean>
  flattenForms?: boolean
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
    formValues,
    flattenForms,
  } = input

  const srcDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: false })

  // Fill AcroForm values into the source document before copying pages
  if (formValues && Object.keys(formValues).length > 0) {
    try {
      const form = srcDoc.getForm()
      for (const [fieldName, value] of Object.entries(formValues)) {
        try {
          const field = form.getFieldMaybe(fieldName)
          if (!field) continue
          const fieldType = field.constructor.name
          if (fieldType === 'PDFTextField' && typeof value === 'string') {
            ;(field as import('pdf-lib').PDFTextField).setText(value)
          } else if (fieldType === 'PDFCheckBox') {
            ;(field as import('pdf-lib').PDFCheckBox)[value ? 'check' : 'uncheck']()
          } else if (fieldType === 'PDFDropdown' && typeof value === 'string') {
            ;(field as import('pdf-lib').PDFDropdown).select(value)
          } else if (fieldType === 'PDFRadioGroup' && typeof value === 'string') {
            ;(field as import('pdf-lib').PDFRadioGroup).select(value)
          }
        } catch {
          // Best-effort: skip fields that can't be filled
        }
      }
      if (flattenForms) {
        try { form.flatten() } catch { /* best-effort */ }
      }
    } catch {
      // No form in document — ignore
    }
  }

  // Load DM Sans fonts if any text annotation uses that family
  let dmSansFonts: DmSansFontSet | undefined
  const hasDmSans = [...annotationsByPage.values()].flat()
    .some((a) => a.type === 'text' && (a as Extract<Annotation, { type: 'text' }>).fontFamily === 'DM Sans')
  if (hasDmSans) {
    try { dmSansFonts = await loadDmSansFonts() } catch { /* fall back to Helvetica */ }
  }

  const outDoc = await PDFDocument.create()

  for (let logicalIdx = 0; logicalIdx < pageOrder.length; logicalIdx++) {
    const originalIdx = pageOrder[logicalIdx] ?? logicalIdx
    const rasterised = rasterisedPages.get(logicalIdx)
    let outPage

    if (rasterised) {
      // Redacted page — replace with PNG image
      const srcMeta = pageMeta[originalIdx]
      const pageW = srcMeta?.width ?? 595
      const pageH = srcMeta?.height ?? 842

      const pngImage = await outDoc.embedPng(rasterised)
      outPage = outDoc.addPage([pageW, pageH])
      outPage.drawImage(pngImage, { x: 0, y: 0, width: pageW, height: pageH })
    } else {
      // Normal page — copy from source and add annotations
      const [copiedPage] = await outDoc.copyPages(srcDoc, [originalIdx])
      if (!copiedPage) continue
      outDoc.addPage(copiedPage)

      outPage = outDoc.getPage(outDoc.getPageCount() - 1)
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
          dmSansFonts,
        })
      }
    }

    // Apply rotation — must happen for both rasterised and normal pages
    const rotation = pageRotations.get(logicalIdx)
    if (rotation) {
      const currentRotation = outPage.getRotation().angle
      outPage.setRotation(degrees((currentRotation + rotation) % 360))
    }
  }

  // Create AcroForm fields for FormFieldAnnotations
  const formFieldAnnotations: Array<{ logicalIdx: number; ann: FormFieldAnnotation }> = []
  for (const [logicalIdx, anns] of annotationsByPage) {
    for (const ann of anns) {
      if (ann.type === 'formfield') {
        formFieldAnnotations.push({ logicalIdx, ann: ann as FormFieldAnnotation })
      }
    }
  }
  if (formFieldAnnotations.length > 0) {
    try {
      const form = outDoc.getForm()
      for (const { logicalIdx, ann } of formFieldAnnotations) {
        const outPageIdx = pageOrder.indexOf(pageOrder[logicalIdx] ?? logicalIdx)
        const outPage = outDoc.getPage(outPageIdx < 0 ? logicalIdx : outPageIdx)
        const { height: pageH } = outPage.getSize()
        const scale = 1
        // Konva top-left → PDF bottom-left coordinate transform
        const pdfX = ann.x / scale
        const pdfY = pageH - (ann.y + ann.height) / scale
        const pdfW = ann.width / scale
        const pdfH = ann.height / scale

        try {
          if (ann.fieldType === 'checkbox') {
            const cb = form.createCheckBox(ann.fieldName)
            cb.addToPage(outPage, { x: pdfX, y: pdfY, width: pdfW, height: pdfH })
          } else if (ann.fieldType === 'dropdown' && ann.options.length > 0) {
            const dd = form.createDropdown(ann.fieldName)
            dd.addOptions(ann.options)
            dd.addToPage(outPage, { x: pdfX, y: pdfY, width: pdfW, height: pdfH })
          } else {
            const tf = form.createTextField(ann.fieldName)
            if (ann.placeholder) tf.setText('')
            tf.addToPage(outPage, { x: pdfX, y: pdfY, width: pdfW, height: pdfH })
          }
        } catch {
          // Field name collision or unsupported — skip silently
        }
      }
    } catch {
      // Best-effort AcroForm creation
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
