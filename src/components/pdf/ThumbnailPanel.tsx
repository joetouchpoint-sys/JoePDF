import { useCallback, useState, useRef } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type Modifier,
} from '@dnd-kit/core'

// Prevent horizontal drift when dragging thumbnails in the narrow sidebar
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  RotateCcw, RotateCw, Trash2, Copy, Download,
  FilePlus, Scissors, X, LayoutGrid, ChevronUp, ChevronDown,
} from 'lucide-react'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { PDFThumbnail } from './PDFThumbnail'
import { useStore } from '@/store'
import { ReorderPagesCommand } from '@/commands/ReorderPagesCommand'
import { DeletePageCommand } from '@/commands/DeletePageCommand'
import { DuplicatePageCommand } from '@/commands/DuplicatePageCommand'
import { useHistory } from '@/hooks/useHistory'
import { mergePDF, splitPDF } from '@/lib/pdfMerger'
import { deletePageAt, duplicatePage } from '@/lib/pageManager'
import { downloadFile, isPdfBuffer } from '@/utils/fileUtils'
import { showToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { clsx } from 'clsx'

// ── SortableThumb ─────────────────────────────────────────────────────────────

interface SortableThumbProps {
  id: string
  doc: PDFDocumentProxy
  pageNumber: number
  pageIndex: number
  isActive: boolean
  isSelected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  canDelete: boolean
  onThumbClick: (e: React.MouseEvent) => void
  onRotateCW: () => void
  onRotateCCW: () => void
  onDelete: () => void
  onDuplicate: () => void
  onExtract: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function SortableThumb({
  id, doc, pageNumber, pageIndex, isActive, isSelected,
  canMoveUp, canMoveDown, canDelete,
  onThumbClick, onRotateCW, onRotateCCW, onDelete, onDuplicate, onExtract,
  onMoveUp, onMoveDown,
}: SortableThumbProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id })

  // Stop pointer events on buttons from bubbling up to the dnd-kit listeners,
  // which would incorrectly start a drag when clicking a button.
  const noDrag = (e: React.PointerEvent) => e.stopPropagation()

  const actionBtn = clsx(
    'w-6 h-6 bg-white/90 border border-slate-200 rounded',
    'flex items-center justify-center shadow-sm transition-colors',
  )

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="relative group w-full select-none"
    >
      {/* Move up / down — stop drag propagation so the buttons still fire */}
      <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <button
          type="button"
          onPointerDown={noDrag}
          onClick={onMoveUp}
          disabled={!canMoveUp}
          title="Move page up"
          className={clsx(
            'pointer-events-auto w-5 h-5 bg-white/90 border border-slate-200 rounded',
            'flex items-center justify-center shadow-sm transition-colors',
            canMoveUp
              ? 'text-slate-500 hover:text-[--color-primary] hover:border-[--color-primary]'
              : 'text-slate-300 cursor-not-allowed',
          )}
        >
          <ChevronUp className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onPointerDown={noDrag}
          onClick={onMoveDown}
          disabled={!canMoveDown}
          title="Move page down"
          className={clsx(
            'pointer-events-auto w-5 h-5 bg-white/90 border border-slate-200 rounded',
            'flex items-center justify-center shadow-sm transition-colors',
            canMoveDown
              ? 'text-slate-500 hover:text-[--color-primary] hover:border-[--color-primary]'
              : 'text-slate-300 cursor-not-allowed',
          )}
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* PDFThumbnail — clicking it navigates; dragging starts the sort */}
      <PDFThumbnail
        doc={doc}
        pageNumber={pageNumber}
        pageIndex={pageIndex}
        isActive={isActive}
        isSelected={isSelected}
        onClick={onThumbClick}
      />

      {/* Page action buttons — stop drag so these never accidentally start a drag */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onPointerDown={noDrag}
          onClick={onRotateCCW}
          title="Rotate left"
          className={clsx(actionBtn, 'text-slate-500 hover:text-[--color-primary] hover:border-[--color-primary]')}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        <button
          type="button"
          onPointerDown={noDrag}
          onClick={onRotateCW}
          title="Rotate right"
          className={clsx(actionBtn, 'text-slate-500 hover:text-[--color-primary] hover:border-[--color-primary]')}
        >
          <RotateCw className="w-3 h-3" />
        </button>
        <button
          type="button"
          onPointerDown={noDrag}
          onClick={onDuplicate}
          title="Duplicate page"
          className={clsx(actionBtn, 'text-slate-500 hover:text-[--color-primary] hover:border-[--color-primary]')}
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          type="button"
          onPointerDown={noDrag}
          onClick={onExtract}
          title="Extract this page"
          className={clsx(actionBtn, 'text-slate-500 hover:text-[--color-primary] hover:border-[--color-primary]')}
        >
          <Download className="w-3 h-3" />
        </button>
        {canDelete && (
          <button
            type="button"
            onPointerDown={noDrag}
            onClick={onDelete}
            title="Delete page"
            className={clsx(actionBtn, 'text-slate-400 hover:text-red-500 hover:border-red-300')}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── SplitDialog (split into 2 at a point) ─────────────────────────────────────

interface SplitDialogProps {
  open: boolean
  pageCount: number
  onClose: () => void
  onConfirm: (splitAfter: number) => void
}

function SplitDialog({ open, pageCount, onClose, onConfirm }: SplitDialogProps) {
  const [splitAfter, setSplitAfter] = useState(1)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-80 mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Split PDF</h3>
          <p className="text-xs text-slate-500 mt-0.5">Creates two separate PDF files</p>
        </div>
        <div className="px-5 py-4">
          <label className="block text-sm text-slate-600 mb-2">Split after page</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={pageCount - 1}
              value={splitAfter}
              onChange={(e) => setSplitAfter(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold text-[--color-primary] w-8 text-center">{splitAfter}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Part 1: pages 1–{splitAfter} · Part 2: pages {splitAfter + 1}–{pageCount}
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-4">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(splitAfter - 1)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Split &amp; download
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ThumbnailPanel ────────────────────────────────────────────────────────────

interface ThumbnailPanelProps {
  doc: PDFDocumentProxy
}

export function ThumbnailPanel({ doc }: ThumbnailPanelProps) {
  const pageCount = useStore((s) => s.pdf.pageCount)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const currentPage = useStore((s) => s.ui.currentPage)
  const _pageMeta = useStore((s) => s.pdf.pageMeta); void _pageMeta
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const fileName = useStore((s) => s.pdf.fileName)
  const pageRotations = useStore((s) => s.ui.pageRotations)
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  const setPageRotation = useStore((s) => s.setPageRotation)
  const setPdfBytes = useStore((s) => s.setPdfBytes)
  const annotations = useStore((s) => s.annotations)
  const setSplitByGroupsOpen = useStore((s) => s.setSplitByGroupsOpen)
  const { dispatch } = useHistory()

  // Multi-select state
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => new Set())
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)

  // Dialog / operation state
  const [showSplit, setShowSplit] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const mergeInputRef = useRef<HTMLInputElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // ── drag-to-reorder ─────────────────────────────────────────────────────────
  // Read pageOrder from getState() to avoid stale-closure issues on rapid drags.

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const { pageOrder: currentOrder } = useStore.getState().pdf
      const oldIndex = currentOrder.findIndex((_, i) => `page-${i}` === active.id)
      const newIndex = currentOrder.findIndex((_, i) => `page-${i}` === over.id)
      if (oldIndex < 0 || newIndex < 0) return
      dispatch(new ReorderPagesCommand(currentOrder, arrayMove(currentOrder, oldIndex, newIndex)))
      setSelectedIndices(new Set())
    },
    [dispatch],
  )

  // ── move up / move down ─────────────────────────────────────────────────────
  // Also uses getState() so rapid clicks always move against the latest order,
  // not a stale React closure snapshot.

  const handleMove = useCallback(
    (pageIndex: number, direction: 1 | -1) => {
      const { pageOrder: currentOrder, pageCount: currentCount } = useStore.getState().pdf
      const newIndex = pageIndex + direction
      if (newIndex < 0 || newIndex >= currentCount) return
      dispatch(new ReorderPagesCommand(currentOrder, arrayMove(currentOrder, pageIndex, newIndex)))
      setCurrentPage(newIndex)
      setSelectedIndices(new Set())
    },
    [dispatch, setCurrentPage],
  )

  // ── multi-select ────────────────────────────────────────────────────────────

  const handleThumbClick = useCallback((i: number, e: React.MouseEvent) => {
    setCurrentPage(i)
    if (e.shiftKey && lastClickedIndex !== null) {
      const min = Math.min(i, lastClickedIndex)
      const max = Math.max(i, lastClickedIndex)
      const next = new Set<number>()
      for (let j = min; j <= max; j++) next.add(j)
      setSelectedIndices(next)
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedIndices(prev => {
        const next = new Set(prev)
        if (next.has(i)) next.delete(i)
        else next.add(i)
        return next
      })
      setLastClickedIndex(i)
    } else {
      setSelectedIndices(new Set())
      setLastClickedIndex(i)
    }
  }, [lastClickedIndex, setCurrentPage])

  // ── page operations ─────────────────────────────────────────────────────────

  const handleRotate = (pageIndex: number, direction: 1 | -1) => {
    const current = pageRotations.get(pageIndex) ?? 0
    setPageRotation(pageIndex, (current + direction * 90 + 360) % 360)
  }

  const handleDuplicate = (pageIndex: number) => {
    const newOrder = duplicatePage(pageOrder, pageIndex)
    dispatch(new DuplicatePageCommand(pageOrder, newOrder))
    showToast('Page duplicated.', 'success')
  }

  const handleDelete = (pageIndex: number) => {
    const newOrder = deletePageAt(pageOrder, pageIndex)
    const anns = annotations.get(pageIndex) ?? []
    dispatch(new DeletePageCommand(pageIndex, pageOrder, newOrder, anns))
    if (currentPage >= newOrder.length) setCurrentPage(Math.max(0, newOrder.length - 1))
    showToast('Page deleted.', 'success')
    setDeleteIndex(null)
    setSelectedIndices(prev => {
      const next = new Set(prev)
      next.delete(pageIndex)
      return next
    })
  }

  const handleExtract = async (pageIndex: number) => {
    if (!pdfBytes) return
    try {
      const { PDFDocument } = await import('pdf-lib')
      const srcDoc = await PDFDocument.load(pdfBytes)
      const outDoc = await PDFDocument.create()
      const [p] = await outDoc.copyPages(srcDoc, [pageOrder[pageIndex] ?? pageIndex])
      if (p) outDoc.addPage(p)
      const bytes = await outDoc.save()
      const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
      downloadFile(new Uint8Array(ab), `page-${pageIndex + 1}.pdf`)
      showToast(`Page ${pageIndex + 1} extracted.`, 'success')
    } catch {
      showToast('Failed to extract page.', 'error')
    }
  }

  const handleExtractSelected = async () => {
    if (!pdfBytes || selectedIndices.size === 0) return
    setIsExtracting(true)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const srcDoc = await PDFDocument.load(pdfBytes)
      const outDoc = await PDFDocument.create()
      const sorted = Array.from(selectedIndices).sort((a, b) => a - b)
      const srcPageIndices = sorted.map(i => pageOrder[i] ?? i)
      const pages = await outDoc.copyPages(srcDoc, srcPageIndices)
      pages.forEach(p => outDoc.addPage(p))
      const bytes = await outDoc.save()
      const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
      const base = (fileName ?? 'document').replace(/\.pdf$/i, '')
      const label = sorted.length <= 4
        ? sorted.map(i => i + 1).join('-')
        : `${sorted[0]! + 1}-to-${sorted[sorted.length - 1]! + 1}`
      downloadFile(new Uint8Array(ab), `${base}-pages-${label}.pdf`)
      showToast(`${selectedIndices.size} page${selectedIndices.size > 1 ? 's' : ''} extracted.`, 'success')
      setSelectedIndices(new Set())
    } catch {
      showToast('Failed to extract pages.', 'error')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSplit = async (splitAfterLogical: number) => {
    if (!pdfBytes) return
    setShowSplit(false)
    try {
      const [b1, b2] = await splitPDF(pdfBytes, pageOrder, splitAfterLogical)
      const base = (fileName ?? 'document').replace(/\.pdf$/i, '')
      downloadFile(new Uint8Array(b1), `${base}-part1.pdf`)
      downloadFile(new Uint8Array(b2), `${base}-part2.pdf`)
      showToast('Split into two files — check your downloads.', 'success')
    } catch {
      showToast('Failed to split PDF.', 'error')
    }
  }

  const handleMerge = () => {
    if (!mergeInputRef.current) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/pdf,.pdf'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file || !pdfBytes) return
        setIsMerging(true)
        try {
          const appendBytes = await file.arrayBuffer()
          if (!isPdfBuffer(appendBytes)) {
            showToast('Selected file is not a valid PDF.', 'error')
            return
          }
          const merged = await mergePDF(pdfBytes, appendBytes)
          const newName = (fileName ?? 'document').replace(/\.pdf$/i, '') + '-merged.pdf'
          setPdfBytes(merged, newName)
          showToast(`Merged ${file.name} — ${pageCount} + new pages.`, 'success')
        } catch {
          showToast('Failed to merge PDFs.', 'error')
        } finally {
          setIsMerging(false)
        }
      }
      mergeInputRef.current = input
    }
    mergeInputRef.current.click()
  }

  // ── render ──────────────────────────────────────────────────────────────────

  const hasSelection = selectedIndices.size > 0
  const ids = Array.from({ length: pageCount }, (_, i) => `page-${i}`)

  return (
    <>
      {/* Panel header */}
      <div className="border-b border-slate-100">
        <div className="flex items-center justify-between px-2 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Pages ({pageCount})
          </span>
          <div className="flex gap-0.5">
            {hasSelection ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleExtractSelected()}
                  disabled={isExtracting}
                  title={`Download ${selectedIndices.size} selected page${selectedIndices.size > 1 ? 's' : ''} as PDF`}
                  className={clsx(
                    'flex items-center gap-1 px-2 h-6 rounded text-[10px] font-semibold text-white transition-colors',
                    isExtracting ? 'opacity-50' : 'hover:opacity-90',
                  )}
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Download className="w-3 h-3" />
                  {isExtracting ? '…' : `${selectedIndices.size} page${selectedIndices.size > 1 ? 's' : ''}`}
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedIndices(new Set()); setLastClickedIndex(null) }}
                  title="Clear selection"
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleMerge}
                  disabled={isMerging}
                  title="Merge another PDF"
                  className={clsx(
                    'w-6 h-6 rounded flex items-center justify-center transition-colors',
                    'text-slate-400 hover:text-[--color-primary] hover:bg-slate-100',
                    isMerging && 'opacity-50',
                  )}
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                {pageCount > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowSplit(true)}
                      title="Split PDF in two"
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-[--color-primary] hover:bg-slate-100 transition-colors"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitByGroupsOpen(true)}
                      title="Split into page groups"
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-[--color-primary] hover:bg-slate-100 transition-colors"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <p className="px-2 pb-1.5 text-[10px] text-slate-400">
          {hasSelection
            ? 'Shift+click to extend · Ctrl+click to toggle'
            : 'Drag to reorder · Ctrl+click to select'}
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <nav
            aria-label="Page thumbnails"
            className="flex flex-col items-center gap-1 px-2 py-2"
          >
            {Array.from({ length: pageCount }, (_, i) => {
              const originalPageNum = (pageOrder[i] ?? i) + 1
              return (
                <SortableThumb
                  key={`page-${i}`}
                  id={`page-${i}`}
                  doc={doc}
                  pageNumber={originalPageNum}
                  pageIndex={i}
                  isActive={i === currentPage}
                  isSelected={selectedIndices.has(i)}
                  canMoveUp={i > 0}
                  canMoveDown={i < pageCount - 1}
                  canDelete={pageCount > 1}
                  onThumbClick={(e) => handleThumbClick(i, e)}
                  onRotateCW={() => handleRotate(i, 1)}
                  onRotateCCW={() => handleRotate(i, -1)}
                  onDuplicate={() => handleDuplicate(i)}
                  onExtract={() => void handleExtract(i)}
                  onDelete={() => setDeleteIndex(i)}
                  onMoveUp={() => handleMove(i, -1)}
                  onMoveDown={() => handleMove(i, 1)}
                />
              )
            })}
          </nav>
        </SortableContext>
      </DndContext>

      <SplitDialog
        open={showSplit}
        pageCount={pageCount}
        onClose={() => setShowSplit(false)}
        onConfirm={(n) => void handleSplit(n)}
      />

      <ConfirmDialog
        open={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        onConfirm={() => deleteIndex !== null && handleDelete(deleteIndex)}
        title="Delete page?"
        message={`Page ${(deleteIndex ?? 0) + 1} will be removed. You can undo this.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </>
  )
}
