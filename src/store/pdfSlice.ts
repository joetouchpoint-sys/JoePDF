import type { StateCreator } from 'zustand'
import type { PDFState, PageMeta } from '@/types/pdf'
import type { PDFFormField, OcrWord } from '@/types/formField'

export interface PDFSlice {
  pdf: PDFState
  formFields: Map<number, PDFFormField[]>
  formValues: Record<string, string | boolean>
  ocrLayers: Map<number, OcrWord[]>
  setPdfBytes: (bytes: ArrayBuffer, fileName: string) => void
  setPdfLoading: (loading: boolean) => void
  setPdfError: (error: string | null) => void
  setPageMeta: (meta: PageMeta[]) => void
  setPageOrder: (order: number[]) => void
  setRasterisedPage: (logicalIndex: number, pngBytes: ArrayBuffer) => void
  clearRasterisedPage: (logicalIndex: number) => void
  setFormFields: (pageIndex: number, fields: PDFFormField[]) => void
  setFormValue: (fieldName: string, value: string | boolean) => void
  setOcrLayer: (pageIndex: number, words: OcrWord[]) => void
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
  formFields: new Map(),
  formValues: {},
  ocrLayers: new Map(),

  setPdfBytes: (bytes, fileName) =>
    set((state) => ({
      pdf: {
        ...state.pdf,
        pdfBytes: bytes,
        fileName,
        loadError: null,
        rasterisedPages: new Map(),
      },
      formFields: new Map(),
      formValues: {},
      ocrLayers: new Map(),
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

  setFormFields: (pageIndex, fields) =>
    set((state) => {
      const next = new Map(state.formFields)
      next.set(pageIndex, fields)
      return { formFields: next }
    }),

  setFormValue: (fieldName, value) =>
    set((state) => ({ formValues: { ...state.formValues, [fieldName]: value } })),

  setOcrLayer: (pageIndex, words) =>
    set((state) => {
      const next = new Map(state.ocrLayers)
      next.set(pageIndex, words)
      return { ocrLayers: next }
    }),

  resetPdf: () => set({ pdf: initialPdfState, formFields: new Map(), formValues: {}, ocrLayers: new Map() }),
})
