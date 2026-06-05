import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { useHistory } from '@/hooks/useHistory'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { DeletePageCommand } from '@/commands/DeletePageCommand'
import { DuplicatePageCommand } from '@/commands/DuplicatePageCommand'
import { deletePageAt, duplicatePage, extractPageRange } from '@/lib/pageManager'
import { exportPDF } from '@/lib/pdfExporter'
import { downloadFile } from '@/utils/fileUtils'
import { showToast } from '@/components/ui/Toast'
import { Copy, Trash2, Download } from 'lucide-react'

interface PageActionsMenuProps {
  pageIndex: number
}

export function PageActionsMenu({ pageIndex }: PageActionsMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const pageMeta = useStore((s) => s.pdf.pageMeta)
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const annotations = useStore((s) => s.annotations)
  const pageRotations = useStore((s) => s.ui.pageRotations)
  const { dispatch } = useHistory()

  const handleDelete = useCallback(() => {
    const newOrder = deletePageAt(pageOrder, pageIndex)
    const anns = annotations.get(pageIndex) ?? []
    dispatch(new DeletePageCommand(pageIndex, pageOrder, newOrder, anns))
    setShowDeleteConfirm(false)
    showToast('Page deleted.', 'success')
  }, [pageIndex, pageOrder, annotations, dispatch])

  const handleDuplicate = useCallback(() => {
    const newOrder = duplicatePage(pageOrder, pageIndex)
    dispatch(new DuplicatePageCommand(pageOrder, newOrder))
    showToast('Page duplicated.', 'success')
  }, [pageIndex, pageOrder, dispatch])

  const handleExtract = useCallback(async () => {
    if (!pdfBytes) return
    try {
      const extractOrder = extractPageRange(pageOrder, pageIndex, pageIndex)
      const extractMeta = pageMeta.slice(pageIndex, pageIndex + 1)
      const extractAnnotations = new Map<number, ReturnType<typeof annotations.get>>()
      const ann = annotations.get(pageIndex)
      if (ann) extractAnnotations.set(0, ann)

      const bytes = await exportPDF({
        originalBytes: pdfBytes,
        pageOrder: extractOrder,
        pageMeta: extractMeta,
        annotationsByPage: extractAnnotations as Map<number, import('@/types/annotation').Annotation[]>,
        rasterisedPages: new Map(),
        pageRotations: new Map([[0, pageRotations.get(pageIndex) ?? 0]]),
        fileName: `page-${pageIndex + 1}.pdf`,
        options: { removeMetadata: false },
      })
      downloadFile(bytes, `page-${pageIndex + 1}.pdf`)
      showToast(`Page ${pageIndex + 1} extracted.`, 'success')
    } catch {
      showToast('Failed to extract page.', 'error')
    }
  }, [pageIndex, pageOrder, pageMeta, pdfBytes, annotations, pageRotations])

  return (
    <>
      <div className="flex gap-0.5">
        <Button variant="ghost" size="icon" onClick={handleDuplicate} aria-label={`Duplicate page ${pageIndex + 1}`}>
          <Copy className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleExtract} aria-label={`Extract page ${pageIndex + 1}`}>
          <Download className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label={`Delete page ${pageIndex + 1}`}
          disabled={pageOrder.length <= 1}
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete page?"
        message={`Page ${pageIndex + 1} will be removed. This can be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </>
  )
}
