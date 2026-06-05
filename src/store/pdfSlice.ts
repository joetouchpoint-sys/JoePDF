import type { StateCreator } from 'zustand'
import type { PDFState, PageMeta } from '@/types/pdf'

export interface PDFSlice {
  pdf: PDFState
  setPdfBytes: (bytes: ArrayBuffer, fileName: string) => void
  setPdfLoading: (loading: boolean) => void
  setPdfError: (error: string | null) => void
  setPageMeta: (meta: PageMeta[]) => void
  setPageOrder: (order: number[]) => void
  setRasterisedPage: (logicalIndex: number, pngBytes: ArrayBuffer) => void
  clearRasterisedPage: (logicalIndex: number) => void
  resetPdf: () => void
}

const initialPdfState: PDFState = {
  fileName: null,
  pdfBytes: null,
  pageCount: 0,
  pageOrder: [],
  pageMeta: [],
  rasterisedPages: new Map(),
  isLoading: false,
  loadError: null,
}

export const createPdfSlice: StateCreator<PDFSlice> = (set) => ({
  pdf: initialPdfState,

  setPdfBytes: (bytes, fileName) =>
    set((state) => ({
      pdf: {
        ...state.pdf,
        pdfBytes: bytes,
        fileName,
        loadError: null,
        rasterisedPages: new Map(),
      },
    })),

  setPdfLoading: (loading) =>
    set((state) => ({ pdf: { ...state.pdf, isLoading: loading } })),

  setPdfError: (error) =>
    set((state) => ({
      pdf: { ...state.pdf, loadError: error, isLoading: false },
    })),

  setPageMeta: (meta) =>
    set((state) => ({
      pdf: {
        ...state.pdf,
        pageMeta: meta,
        pageCount: meta.length,
        pageOrder: meta.map((_, i) => i),
      },
    })),

  setPageOrder: (order) =>
    set((state) => ({ pdf: { ...state.pdf, pageOrder: order } })),

  setRasterisedPage: (logicalIndex, pngBytes) =>
    set((state) => {
      const next = new Map(state.pdf.rasterisedPages)
      next.set(logicalIndex, pngBytes)
      return { pdf: { ...state.pdf, rasterisedPages: next } }
    }),

  clearRasterisedPage: (logicalIndex) =>
    set((state) => {
      const next = new Map(state.pdf.rasterisedPages)
      next.delete(logicalIndex)
      return { pdf: { ...state.pdf, rasterisedPages: next } }
    }),

  resetPdf: () => set({ pdf: initialPdfState }),
})
