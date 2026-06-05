import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { loadDocument } from '@/lib/pdfRenderer'
import { useStore } from '@/store'

let cachedDoc: PDFDocumentProxy | null = null

export function getCachedDocument(): PDFDocumentProxy | null {
  return cachedDoc
}

export function setCachedDocument(doc: PDFDocumentProxy | null): void {
  cachedDoc = doc
}

/**
 * Loads a PDF document from the store's pdfBytes and updates pageMeta.
 * The loaded PDFDocumentProxy is cached in module scope (not in React state)
 * to avoid triggering unnecessary re-renders when passing it as a prop.
 */
export function usePDFDocument(): { doc: PDFDocumentProxy | null; isLoading: boolean; error: string | null } {
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const isLoading = useStore((s) => s.pdf.isLoading)
  const error = useStore((s) => s.pdf.loadError)
  const { setPdfLoading, setPdfError, setPageMeta } = useStore.getState()
  const docRef = useRef<PDFDocumentProxy | null>(null)

  useEffect(() => {
    if (!pdfBytes) {
      if (docRef.current) {
        docRef.current.destroy()
        docRef.current = null
        cachedDoc = null
      }
      return
    }

    let cancelled = false
    setPdfLoading(true)

    loadDocument(pdfBytes)
      .then(async (doc) => {
        if (cancelled) {
          doc.destroy()
          return
        }

        if (docRef.current) {
          docRef.current.destroy()
        }
        docRef.current = doc
        cachedDoc = doc

        const numPages = doc.numPages
        const metaPromises = Array.from({ length: numPages }, async (_, i) => {
          const page = await doc.getPage(i + 1)
          const vp = page.getViewport({ scale: 1 })
          page.cleanup()
          return {
            originalIndex: i,
            width: vp.width,
            height: vp.height,
            rotation: 0,
          }
        })

        const meta = await Promise.all(metaPromises)
        if (!cancelled) {
          setPageMeta(meta)
          setPdfLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to load PDF. The file may be damaged or encrypted.'
          setPdfError(msg)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pdfBytes, setPdfLoading, setPdfError, setPageMeta])

  return { doc: docRef.current, isLoading, error }
}
