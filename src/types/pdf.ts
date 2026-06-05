export interface PageMeta {
  originalIndex: number
  width: number
  height: number
  rotation: number
}

export interface PDFState {
  fileName: string | null
  pdfBytes: ArrayBuffer | null
  pageCount: number
  pageOrder: number[]
  pageMeta: PageMeta[]
  rasterisedPages: Map<number, ArrayBuffer>
  isLoading: boolean
  loadError: string | null
}
