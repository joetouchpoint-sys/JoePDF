import { useCallback } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { PDFThumbnail } from './PDFThumbnail'
import { useStore } from '@/store'
import { ReorderPagesCommand } from '@/commands/ReorderPagesCommand'
import { useHistory } from '@/hooks/useHistory'
import { GripVertical } from 'lucide-react'

interface SortableThumbProps {
  id: string
  doc: PDFDocumentProxy
  pageNumber: number
  pageIndex: number
  isActive: boolean
  onClick: () => void
}

function SortableThumb({ id, doc, pageNumber, pageIndex, isActive, onClick }: SortableThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 z-10 p-0.5"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      <PDFThumbnail
        doc={doc}
        pageNumber={pageNumber}
        pageIndex={pageIndex}
        isActive={isActive}
        onClick={onClick}
      />
    </div>
  )
}

interface ThumbnailPanelProps {
  doc: PDFDocumentProxy
}

export function ThumbnailPanel({ doc }: ThumbnailPanelProps) {
  const pageCount = useStore((s) => s.pdf.pageCount)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const currentPage = useStore((s) => s.ui.currentPage)
  const setCurrentPage = useStore((s) => s.setCurrentPage)
  const { dispatch } = useHistory()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = pageOrder.findIndex((_, i) => `page-${i}` === active.id)
      const newIndex = pageOrder.findIndex((_, i) => `page-${i}` === over.id)
      if (oldIndex < 0 || newIndex < 0) return

      const newOrder = arrayMove(pageOrder, oldIndex, newIndex)
      dispatch(new ReorderPagesCommand(pageOrder, newOrder))
    },
    [pageOrder, dispatch],
  )

  const ids = Array.from({ length: pageCount }, (_, i) => `page-${i}`)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <nav
          aria-label="Page thumbnails"
          className="flex flex-col items-center gap-1 px-2 py-3"
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
                onClick={() => setCurrentPage(i)}
              />
            )
          })}
        </nav>
      </SortableContext>
    </DndContext>
  )
}
