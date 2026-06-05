import { useEffect } from 'react'
import { useStore } from '@/store'
import { Tool } from '@/types/tool'

export function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = useStore.getState()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isInput) return

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
        return
      }

      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        if (canRedo()) redo()
        return
      }

      if (ctrl && e.key === 's') {
        e.preventDefault()
        // Trigger export via custom event
        window.dispatchEvent(new CustomEvent('joepdf:export'))
        return
      }

      if (e.key === 'Escape') {
        useStore.getState().setActiveTool(Tool.SELECT)
        useStore.getState().setSelectedAnnotationId(null)
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedId = useStore.getState().ui.selectedAnnotationId
        if (selectedId) {
          window.dispatchEvent(new CustomEvent('joepdf:delete-selected', { detail: selectedId }))
        }
        return
      }

      // Tool shortcuts
      if (!ctrl) {
        // Q — toggle text-select mode
        if (e.key === 'q' || e.key === 'Q') {
          const { ui, setTextSelectMode } = useStore.getState()
          setTextSelectMode(!ui.textSelectMode)
          return
        }

        // G — open split by groups dialog
        if (e.key === 'g' || e.key === 'G') {
          const hasPDF = !!useStore.getState().pdf.pdfBytes
          if (hasPDF) useStore.getState().setSplitByGroupsOpen(true)
          return
        }

        const toolMap: Record<string, Tool> = {
          v: Tool.SELECT, V: Tool.SELECT,
          t: Tool.TEXT, T: Tool.TEXT,
          r: Tool.RECT, R: Tool.RECT,
          e: Tool.ELLIPSE, E: Tool.ELLIPSE,
          l: Tool.LINE, L: Tool.LINE,
          a: Tool.ARROW, A: Tool.ARROW,
          f: Tool.FREEHAND, F: Tool.FREEHAND,
          h: Tool.HIGHLIGHT, H: Tool.HIGHLIGHT,
          i: Tool.IMAGE, I: Tool.IMAGE,
          x: Tool.REDACT, X: Tool.REDACT,
        }
        const tool = toolMap[e.key]
        if (tool) {
          useStore.getState().setActiveTool(tool)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo])
}
