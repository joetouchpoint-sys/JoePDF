import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { saveDraft, deleteDraft, consumePendingRestore, type AutosaveDraft } from '@/lib/autosave'
import { showToast } from '@/components/ui/Toast'

const SESSION_KEY = 'joepdf_autosave_session'
const INITIAL_DELAY_MS = 2 * 60 * 1000  // wait 2 min before first periodic save
const INTERVAL_MS = 60 * 1000           // then save every 1 min

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildDraft(id: string, includePdfBytes: boolean): AutosaveDraft {
  const state = useStore.getState()
  return {
    id,
    savedAt: Date.now(),
    fileName: state.pdf.fileName ?? 'document.pdf',
    pdfBytes: includePdfBytes ? (state.pdf.pdfBytes ?? new ArrayBuffer(0)) : new ArrayBuffer(0),
    annotations: Array.from(state.annotations.entries()) as [number, import('@/types/annotation').Annotation[]][],
    pageOrder: [...state.pdf.pageOrder],
    pageRotations: Array.from(state.ui.pageRotations.entries()),
    drawingDefaults: { ...state.ui.drawingDefaults },
  }
}

export function useAutosave() {
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const pageCount = useStore((s) => s.pdf.pageCount)
  const sessionIdRef = useRef<string | null>(null)
  const initialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearTimers() {
    if (initialTimerRef.current) { clearTimeout(initialTimerRef.current); initialTimerRef.current = null }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  // Start/stop autosave session when PDF loads/unloads
  useEffect(() => {
    if (pdfBytes) {
      // Restore session ID if this tab already had one (hot-reload resilience)
      const existingId = sessionStorage.getItem(SESSION_KEY)
      const id = existingId ?? generateId()
      sessionStorage.setItem(SESSION_KEY, id)
      sessionIdRef.current = id

      // Save initial draft immediately (includes pdfBytes — only written once)
      void saveDraft(buildDraft(id, true))

      // After 2 min, start saving annotations+state every minute
      initialTimerRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          if (sessionIdRef.current) {
            void saveDraft(buildDraft(sessionIdRef.current, false))
          }
        }, INTERVAL_MS)
      }, INITIAL_DELAY_MS)
    } else {
      // PDF was closed via the confirm dialog — delete the draft
      clearTimers()
      const id = sessionIdRef.current ?? sessionStorage.getItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      sessionIdRef.current = null
      if (id) void deleteDraft(id)
    }

    return clearTimers
  }, [pdfBytes])

  // Apply pending restore data once the PDF has finished loading (pageCount > 0)
  useEffect(() => {
    if (pageCount === 0) return
    const pending = consumePendingRestore()
    if (!pending) return

    const store = useStore.getState()

    // Restore annotations
    for (const [pageIdx, anns] of pending.annotations) {
      for (const ann of anns) {
        store.addAnnotation(pageIdx, ann)
      }
    }

    // Restore page order only if sizes match (guards against wrong-PDF recovery)
    if (pending.pageOrder.length === pageCount) {
      store.setPageOrder(pending.pageOrder)
    }

    // Restore page rotations
    for (const [pageIdx, rotation] of pending.pageRotations) {
      store.setPageRotation(pageIdx, rotation)
    }

    // Restore drawing defaults
    store.setDrawingDefaults(pending.drawingDefaults)
    store.setIsDirty(true)

    showToast(`Restored "${pending.fileName}" from autosave.`, 'success')
  }, [pageCount])
}

/** Call this when the user intentionally closes or downloads — clears the draft */
export function clearAutosaveDraft() {
  const id = sessionStorage.getItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  if (id) void deleteDraft(id)
}
