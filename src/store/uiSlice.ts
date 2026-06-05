import type { StateCreator } from 'zustand'
import { Tool } from '@/types/tool'

export interface UISlice {
  ui: {
    activeTool: Tool
    zoom: number
    currentPage: number
    selectedAnnotationId: string | null
    sidebarOpen: boolean
    inspectorOpen: boolean
    pageRotations: Map<number, number>
    isDirty: boolean
    isExporting: boolean
    showBrandingPanel: boolean
  }
  setActiveTool: (tool: Tool) => void
  setZoom: (zoom: number) => void
  setCurrentPage: (page: number) => void
  setSelectedAnnotationId: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setInspectorOpen: (open: boolean) => void
  setPageRotation: (pageIndex: number, rotation: number) => void
  setIsDirty: (dirty: boolean) => void
  setIsExporting: (exporting: boolean) => void
  setShowBrandingPanel: (show: boolean) => void
  resetUI: () => void
}

const initialUI = {
  activeTool: Tool.SELECT,
  zoom: 1,
  currentPage: 0,
  selectedAnnotationId: null,
  sidebarOpen: true,
  inspectorOpen: true,
  pageRotations: new Map<number, number>(),
  isDirty: false,
  isExporting: false,
  showBrandingPanel: false,
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  ui: initialUI,

  setActiveTool: (tool) => set((s) => ({ ui: { ...s.ui, activeTool: tool } })),
  setZoom: (zoom) =>
    set((s) => ({ ui: { ...s.ui, zoom: Math.min(4, Math.max(0.25, zoom)) } })),
  setCurrentPage: (page) => set((s) => ({ ui: { ...s.ui, currentPage: page } })),
  setSelectedAnnotationId: (id) =>
    set((s) => ({ ui: { ...s.ui, selectedAnnotationId: id } })),
  setSidebarOpen: (open) => set((s) => ({ ui: { ...s.ui, sidebarOpen: open } })),
  setInspectorOpen: (open) => set((s) => ({ ui: { ...s.ui, inspectorOpen: open } })),
  setPageRotation: (pageIndex, rotation) =>
    set((s) => {
      const next = new Map(s.ui.pageRotations)
      next.set(pageIndex, rotation % 360)
      return { ui: { ...s.ui, pageRotations: next } }
    }),
  setIsDirty: (dirty) => set((s) => ({ ui: { ...s.ui, isDirty: dirty } })),
  setIsExporting: (exporting) => set((s) => ({ ui: { ...s.ui, isExporting: exporting } })),
  setShowBrandingPanel: (show) =>
    set((s) => ({ ui: { ...s.ui, showBrandingPanel: show } })),
  resetUI: () => set({ ui: initialUI }),
})
