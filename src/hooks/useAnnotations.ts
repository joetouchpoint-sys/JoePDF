import { useStore } from '@/store'
import type { Annotation } from '@/types/annotation'

// Stable reference for pages with no annotations — avoids infinite re-renders
// caused by `?? []` returning a new array on every selector call.
const EMPTY: Annotation[] = [] as Annotation[]

export function useAnnotations(pageIndex: number): Annotation[] {
  return useStore((s) => s.annotations.get(pageIndex) ?? EMPTY)
}
