import { create } from 'zustand'
import { createPdfSlice, type PDFSlice } from './pdfSlice'
import { createAnnotationSlice, type AnnotationSlice } from './annotationSlice'
import { createHistorySlice, type HistorySlice } from './historySlice'
import { createUISlice, type UISlice } from './uiSlice'
import { createBrandingSlice, type BrandingSlice } from './brandingSlice'

export type AppStore = PDFSlice &
  AnnotationSlice &
  HistorySlice &
  UISlice &
  BrandingSlice

export const useStore = create<AppStore>()((...args) => ({
  ...createPdfSlice(...args),
  ...createAnnotationSlice(...args),
  ...createHistorySlice(...args),
  ...createUISlice(...args),
  ...createBrandingSlice(...args),
}))

export const resetAllState = () => {
  const store = useStore.getState()
  store.resetPdf()
  store.resetAnnotations()
  store.resetHistory()
  store.resetUI()
}
