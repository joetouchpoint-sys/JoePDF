import { useStore } from '@/store'
import type { Command } from '@/types/command'

export function useHistory() {
  const dispatch = useStore((s) => s.dispatch)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.canUndo())
  const canRedo = useStore((s) => s.canRedo())
  const pointer = useStore((s) => s.history.pointer)
  const stackLength = useStore((s) => s.history.stack.length)

  return {
    dispatch: (command: Command) => dispatch(command),
    undo,
    redo,
    canUndo,
    canRedo,
    historySize: stackLength,
    currentPointer: pointer,
  }
}
