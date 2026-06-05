import type { StateCreator } from 'zustand'
import { Tool } from '@/types/tool'

export interface DrawingDefaults {
  strokeColor: string
  strokeNone: boolean
  fillColor: string | null
  strokeWidth: number
  fontSize: number
  fontFamily: string
  fontColor: string
  highlightColor: string
}

export interface PendingStamp {
  src: string
  displayW: number
  displayH: number
  natW: number
  natH: number
}

export interface UISlice {
  ui: {
    activeTool: Tool
    zoom: number
    currentPage: number
    selectedAnnotationId: string | null
    sidebarOpen: boolean
    toolbarExpanded: boolean
    inspectorOpen: boolean
    pageRotations: Map<number, number>
    isDirty: boolean
    isExporting: boolean
    showBrandingPanel: boolean
    textSelectMode: boolean
    drawingDefaults: DrawingDefaults
    newlyCreatedId: string | null
    splitByGroupsOpen: boolean
    splitPageDialogOpen: boolean
    mergePDFDialogOpen: boolean
    compressDialogOpen: boolean
    signatureDialogOpen: boolean
    pendingStamp: PendingStamp | null
  }
  setActiveTool: (tool: Tool) => void
  setZoom: (zoom: number) => void
  setCurrentPage: (page: number) => void
  setSelectedAnnotationId: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setToolbarExpanded: (expanded: boolean) => void
  setInspectorOpen: (open: boolean) => void
  setPageRotation: (pageIndex: number, rotation: number) => void
  setIsDirty: (dirty: boolean) => void
  setIsExporting: (exporting: boolean) => void
  setShowBrandingPanel: (show: boolean) => void
  setTextSelectMode: (on: boolean) => void
  setDrawingDefaults: (d: Partial<DrawingDefaults>) => void
  setNewlyCreatedId: (id: string | null) => void
  setSplitByGroupsOpen: (open: boolean) => void
  setSplitPageDialogOpen: (open: boolean) => void
  setMergePDFDialogOpen: (open: boolean) => void
  setCompressDialogOpen: (open: boolean) => void
  setSignatureDialogOpen: (open: boolean) => void
  setPendingStamp: (stamp: PendingStamp | null) => void
  resetUI: () => void
}

const initialDrawingDefaults: DrawingDefaults = {
  strokeColor: '#178351',
  strokeNone: false,
  fillColor: null,
  strokeWidth: 2,
  fontSize: 16,
  fontFamily: 'DM Sans',
  fontColor: '#292C4F',
  highlightColor: '#A0DA00',
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

const initialUI = {
  activeTool: Tool.SELECT,
  zoom: isMobile ? 0.5 : 1,
  currentPage: 0,
  selectedAnnotationId: null,
  sidebarOpen: !isMobile,
  toolbarExpanded: !isMobile,
  inspectorOpen: true,
  pageRotations: new Map<number, number>(),
  isDirty: false,
  isExporting: false,
  showBrandingPanel: false,
  textSelectMode: false,
  drawingDefaults: initialDrawingDefaults,
  newlyCreatedId: null,
  splitByGroupsOpen: false,
  splitPageDialogOpen: false,
  mergePDFDialogOpen: false,
  compressDialogOpen: false,
  signatureDialogOpen: false,
  pendingStamp: null as PendingStamp | null,
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  ui: initialUI,

  setActiveTool: (tool) =>
    set((s) => ({ ui: { ...s.ui, activeTool: tool, textSelectMode: false } })),
  setZoom: (zoom) =>
    set((s) => ({ ui: { ...s.ui, zoom: Math.min(4, Math.max(0.25, zoom)) } })),
  setCurrentPage: (page) => set((s) => ({ ui: { ...s.ui, currentPage: page } })),
  setSelectedAnnotationId: (id) =>
    set((s) => ({ ui: { ...s.ui, selectedAnnotationId: id } })),
  setSidebarOpen: (open) => set((s) => ({ ui: { ...s.ui, sidebarOpen: open } })),
  setToolbarExpanded: (expanded) => set((s) => ({ ui: { ...s.ui, toolbarExpanded: expanded } })),
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
  setTextSelectMode: (on) =>
    set((s) => ({ ui: { ...s.ui, textSelectMode: on, activeTool: on ? Tool.SELECT : s.ui.activeTool } })),
  setDrawingDefaults: (d) =>
    set((s) => ({ ui: { ...s.ui, drawingDefaults: { ...s.ui.drawingDefaults, ...d } } })),
  setNewlyCreatedId: (id) => set((s) => ({ ui: { ...s.ui, newlyCreatedId: id } })),
  setSplitByGroupsOpen: (open) => set((s) => ({ ui: { ...s.ui, splitByGroupsOpen: open } })),
  setSplitPageDialogOpen: (open) => set((s) => ({ ui: { ...s.ui, splitPageDialogOpen: open } })),
  setMergePDFDialogOpen: (open) => set((s) => ({ ui: { ...s.ui, mergePDFDialogOpen: open } })),
  setCompressDialogOpen: (open) => set((s) => ({ ui: { ...s.ui, compressDialogOpen: open } })),
  setSignatureDialogOpen: (open) => set((s) => ({ ui: { ...s.ui, signatureDialogOpen: open } })),
  setPendingStamp: (stamp) => set((s) => ({ ui: { ...s.ui, pendingStamp: stamp } })),
  resetUI: () => set({ ui: initialUI }),
})
