import type { StateCreator } from 'zustand'
import type { Annotation, AnnotationUpdate } from '@/types/annotation'

export interface AnnotationSlice {
  annotations: Map<number, Annotation[]>
  getAnnotations: (pageIndex: number) => Annotation[]
  addAnnotation: (pageIndex: number, annotation: Annotation) => void
  removeAnnotation: (pageIndex: number, id: string) => void
  updateAnnotation: (pageIndex: number, id: string, update: AnnotationUpdate) => void
  clearPageAnnotations: (pageIndex: number) => void
  resetAnnotations: () => void
}

export const createAnnotationSlice: StateCreator<AnnotationSlice> = (set, get) => ({
  annotations: new Map(),

  getAnnotations: (pageIndex) => get().annotations.get(pageIndex) ?? [],

  addAnnotation: (pageIndex, annotation) =>
    set((state) => {
      const next = new Map(state.annotations)
      const existing = next.get(pageIndex) ?? []
      next.set(pageIndex, [...existing, annotation])
      return { annotations: next }
    }),

  removeAnnotation: (pageIndex, id) =>
    set((state) => {
      const next = new Map(state.annotations)
      const existing = next.get(pageIndex) ?? []
      next.set(
        pageIndex,
        existing.filter((a) => a.id !== id),
      )
      return { annotations: next }
    }),

  updateAnnotation: (pageIndex, id, update) =>
    set((state) => {
      const next = new Map(state.annotations)
      const existing = next.get(pageIndex) ?? []
      next.set(
        pageIndex,
        existing.map((a) => (a.id === id ? ({ ...a, ...update } as Annotation) : a)),
      )
      return { annotations: next }
    }),

  clearPageAnnotations: (pageIndex) =>
    set((state) => {
      const next = new Map(state.annotations)
      next.delete(pageIndex)
      return { annotations: next }
    }),

  resetAnnotations: () => set({ annotations: new Map() }),
})
