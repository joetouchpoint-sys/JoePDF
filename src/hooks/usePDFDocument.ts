import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { loadDocument } from '@/lib/pdfRenderer'
import { useStore } from '@/store'
import type { PDFFormField, PDFFormFieldType } from '@/types/formField'

let cachedDoc: PDFDocumentProxy | null = null

export function getCachedDocument(): PDFDocumentProxy | null {
  return cachedDoc
}

export function setCachedDocument(doc: PDFDocumentProxy | null): void {
  cachedDoc = doc
}

export function usePDFDocument(): { doc: PDFDocumentProxy | null; isLoading: boolean; error: string | null } {
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const isLoading = useStore((s) => s.pdf.isLoading)
  const error = useStore((s) => s.pdf.loadError)
  const { setPdfLoading, setPdfError, setPageMeta, setFormFields } = useStore.getState()
  const docRef = useRef<PDFDocumentProxy | null>(null)
  // Use state so React re-renders when the doc changes (avoids accessing ref during render)
  const [docSnapshot, setDocSnapshot] = useState<PDFDocumentProxy | null>(null)

  useEffect(() => {
    if (!pdfBytes) {
      if (docRef.current) {
        docRef.current.destroy()
        docRef.current = null
        cachedDoc = null
        setDocSnapshot(null)
      }
      return
    }

    let cancelled = false
    setPdfLoading(true)

    loadDocument(pdfBytes)
      .then(async (doc) => {
        if (cancelled) { doc.destroy(); return }

        if (docRef.current) docRef.current.destroy()
        docRef.current = doc
        cachedDoc = doc

        const numPages = doc.numPages
        const metaPromises = Array.from({ length: numPages }, async (_, i) => {
          const page = await doc.getPage(i + 1)
          const vp = page.getViewport({ scale: 1 })

          // Detect AcroForm widget annotations (form fields)
          const annotations = await page.getAnnotations()
          const fields: PDFFormField[] = []
          for (const ann of annotations) {
            if (ann.subtype !== 'Widget') continue
            const [x1, y1, x2, y2] = ann.rect as [number, number, number, number]
            const fieldWidth = Math.abs(x2 - x1)
            const fieldHeight = Math.abs(y2 - y1)
            let fieldType: PDFFormFieldType = 'text'
            if (ann.fieldType === 'Btn') {
              fieldType = ann.radioButton ? 'radio' : 'checkbox'
            } else if (ann.fieldType === 'Ch') {
              fieldType = 'dropdown'
            } else if (ann.fieldType === 'Btn' && ann.pushButton) {
              fieldType = 'button'
            }
            fields.push({
              id: `${i}-${ann.fieldName as string}-${x1}`,
              fieldName: (ann.fieldName as string) || `field_${i}_${fields.length}`,
              fieldType,
              rect: { x: x1, y: y1, width: fieldWidth, height: fieldHeight },
              pageIndex: i,
              defaultValue: (ann.fieldValue as string | boolean) ?? '',
              options: (ann.options as Array<{ value: string; displayValue: string }> | undefined)
                ?.map((o) => o.displayValue ?? o.value),
              radioGroupName: ann.radioButton ? (ann.fieldName as string) : undefined,
            })
          }
          if (fields.length > 0) setFormFields(i, fields)

          page.cleanup()
          return { originalIndex: i, width: vp.width, height: vp.height, rotation: 0 }
        })

        const meta = await Promise.all(metaPromises)
        if (!cancelled) {
          setPageMeta(meta)
          setPdfLoading(false)
          setDocSnapshot(doc)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error
            ? err.message
            : 'Failed to load PDF. The file may be damaged or encrypted.'
          setPdfError(msg)
          setDocSnapshot(null)
        }
      })

    return () => { cancelled = true }
  }, [pdfBytes, setPdfLoading, setPdfError, setPageMeta])

  return { doc: docSnapshot, isLoading, error }
}
