import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '@/store'

beforeEach(() => {
  useStore.getState().resetPdf()
  useStore.getState().resetAnnotations()
  useStore.getState().resetHistory()
  useStore.getState().resetUI()
})

describe('annotationSlice', () => {
  it('adds and removes annotations', () => {
    const store = useStore.getState()
    const ann = {
      id: 'test-1', type: 'text' as const, pageIndex: 0,
      x: 10, y: 20, width: 100, height: 30,
      text: 'Hello', fontSize: 14, fontFamily: 'sans-serif',
      fontColor: '#000', fontBold: false, fontItalic: false,
      align: 'left' as const, backgroundColor: null,
      opacity: 1, visible: true,
    }
    store.addAnnotation(0, ann)
    expect(store.getAnnotations(0)).toHaveLength(1)
    store.removeAnnotation(0, 'test-1')
    expect(store.getAnnotations(0)).toHaveLength(0)
  })

  it('updates annotation properties', () => {
    const store = useStore.getState()
    const ann = {
      id: 'test-2', type: 'text' as const, pageIndex: 0,
      x: 0, y: 0, width: 50, height: 20,
      text: 'Original', fontSize: 12, fontFamily: 'sans-serif',
      fontColor: '#000', fontBold: false, fontItalic: false,
      align: 'left' as const, backgroundColor: null,
      opacity: 1, visible: true,
    }
    store.addAnnotation(0, ann)
    store.updateAnnotation(0, 'test-2', { text: 'Updated' })
    expect(store.getAnnotations(0)[0]).toMatchObject({ text: 'Updated' })
  })
})

describe('historySlice', () => {
  it('executes and undoes commands', () => {
    const store = useStore.getState()
    let value = 0
    const cmd = { description: 'increment', execute: () => { value++ }, undo: () => { value-- } }

    store.dispatch(cmd)
    expect(value).toBe(1)
    expect(store.canUndo()).toBe(true)
    expect(store.canRedo()).toBe(false)

    store.undo()
    expect(value).toBe(0)
    expect(store.canUndo()).toBe(false)
    expect(store.canRedo()).toBe(true)

    store.redo()
    expect(value).toBe(1)
    expect(store.canRedo()).toBe(false)
  })

  it('truncates future on new command after undo', () => {
    const store = useStore.getState()
    let v = 0
    const mk = (n: number) => ({ description: `cmd${n}`, execute: () => { v += n }, undo: () => { v -= n } })

    store.dispatch(mk(1))
    store.dispatch(mk(2))
    store.undo()
    store.dispatch(mk(5))
    expect(useStore.getState().canRedo()).toBe(false)
    expect(useStore.getState().history.stack).toHaveLength(2)
    void v // suppress unused-vars — v is mutated by side effects
  })
})

describe('uiSlice', () => {
  it('clamps zoom between 0.25 and 4', () => {
    const store = useStore.getState()
    store.setZoom(0.1)
    expect(useStore.getState().ui.zoom).toBe(0.25)
    store.setZoom(10)
    expect(useStore.getState().ui.zoom).toBe(4)
    store.setZoom(1.5)
    expect(useStore.getState().ui.zoom).toBe(1.5)
  })

  it('tracks page rotations per page', () => {
    const store = useStore.getState()
    store.setPageRotation(0, 90)
    store.setPageRotation(2, 180)
    expect(useStore.getState().ui.pageRotations.get(0)).toBe(90)
    expect(useStore.getState().ui.pageRotations.get(2)).toBe(180)
    expect(useStore.getState().ui.pageRotations.get(1)).toBeUndefined()
  })
})
