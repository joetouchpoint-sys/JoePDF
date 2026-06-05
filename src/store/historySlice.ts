import type { StateCreator } from 'zustand'
import type { Command } from '@/types/command'

const MAX_HISTORY = 100

export interface HistorySlice {
  history: {
    stack: Command[]
    pointer: number
  }
  dispatch: (command: Command) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  resetHistory: () => void
}

export const createHistorySlice: StateCreator<HistorySlice> = (set, get) => ({
  history: { stack: [], pointer: -1 },

  dispatch: (command) => {
    command.execute()
    set((state) => {
      const truncated = state.history.stack.slice(0, state.history.pointer + 1)
      const next = [...truncated, command]
      const capped = next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
      return { history: { stack: capped, pointer: capped.length - 1 } }
    })
  },

  undo: () => {
    const { history } = get()
    if (history.pointer < 0) return
    const command = history.stack[history.pointer]
    command?.undo()
    set((state) => ({
      history: { ...state.history, pointer: state.history.pointer - 1 },
    }))
  },

  redo: () => {
    const { history } = get()
    if (history.pointer >= history.stack.length - 1) return
    const command = history.stack[history.pointer + 1]
    command?.execute()
    set((state) => ({
      history: { ...state.history, pointer: state.history.pointer + 1 },
    }))
  },

  canUndo: () => get().history.pointer >= 0,
  canRedo: () => get().history.pointer < get().history.stack.length - 1,

  resetHistory: () => set({ history: { stack: [], pointer: -1 } }),
})
