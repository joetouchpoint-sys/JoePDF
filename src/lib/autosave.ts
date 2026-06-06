import type { Annotation } from '@/types/annotation'
import type { DrawingDefaults } from '@/store/uiSlice'

const DB_NAME = 'joepdf_autosave'
const STORE_NAME = 'drafts'
const DB_VERSION = 1
const MAX_DRAFT_AGE_MS = 48 * 60 * 60 * 1000 // 48 hours

export interface AutosaveDraft {
  id: string
  savedAt: number
  fileName: string
  pdfBytes: ArrayBuffer
  annotations: [number, Annotation[]][]
  pageOrder: number[]
  pageRotations: [number, number][]
  drawingDefaults: DrawingDefaults
}

// Holds restore payload between PDF load and page-count becoming available
let pendingRestoreData: Omit<AutosaveDraft, 'pdfBytes'> | null = null

export function setPendingRestore(draft: Omit<AutosaveDraft, 'pdfBytes'>): void {
  pendingRestoreData = draft
}

export function consumePendingRestore(): Omit<AutosaveDraft, 'pdfBytes'> | null {
  const r = pendingRestoreData
  pendingRestoreData = null
  return r
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDraft(draft: AutosaveDraft): Promise<void> {
  let db: IDBDatabase | null = null
  try {
    db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(draft)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Silently fail — autosave is best-effort
  } finally {
    db?.close()
  }
}

export async function loadLatestDraft(): Promise<AutosaveDraft | null> {
  let db: IDBDatabase | null = null
  try {
    db = await openDB()
    return await new Promise<AutosaveDraft | null>((resolve, reject) => {
      const tx = db!.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => {
        const all = (req.result as AutosaveDraft[])
          .filter((d) => Date.now() - d.savedAt < MAX_DRAFT_AGE_MS)
          .sort((a, b) => b.savedAt - a.savedAt)
        resolve(all[0] ?? null)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  } finally {
    db?.close()
  }
}

export async function deleteDraft(id: string): Promise<void> {
  let db: IDBDatabase | null = null
  try {
    db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db!.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve() // Ignore delete errors
    })
  } catch {
    // Ignore
  } finally {
    db?.close()
  }
}

export function formatRelativeTime(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}
