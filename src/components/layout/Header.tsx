import { useEffect, useState, useCallback } from 'react'
import { Undo2, Redo2, Download, Settings2, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { useStore, resetAllState } from '@/store'
import { useHistory } from '@/hooks/useHistory'
import { exportPDF } from '@/lib/pdfExporter'
import { downloadFile } from '@/utils/fileUtils'
import { showToast } from '@/components/ui/Toast'
import { rasteriseRedactedPages } from '@/lib/redactionEngine'
import { getCachedDocument } from '@/hooks/usePDFDocument'
import type { RedactAnnotation, Annotation } from '@/types/annotation'

export function Header() {
  const branding = useStore((s) => s.branding)
  const fileName = useStore((s) => s.pdf.fileName)
  const isDirty = useStore((s) => s.ui.isDirty)
  const isExporting = useStore((s) => s.ui.isExporting)
  const setShowBrandingPanel = useStore((s) => s.setShowBrandingPanel)
  const setIsExporting = useStore((s) => s.setIsExporting)
  const setIsDirty = useStore((s) => s.setIsDirty)
  const setRasterisedPage = useStore((s) => s.setRasterisedPage)
  const { undo, redo, canUndo, canRedo } = useHistory()
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showRedactConfirm, setShowRedactConfirm] = useState(false)
  const [pendingRedactCount, setPendingRedactCount] = useState(0)

  // Track dirty state: use the annotation count (primitive) to avoid Map reference issues
  const annotationCount = useStore((s) => {
    let count = 0
    for (const v of s.annotations.values()) count += v.length
    return count
  })
  useEffect(() => {
    if (annotationCount > 0) setIsDirty(true)
  }, [annotationCount, setIsDirty])

  // Listen for Ctrl+S to trigger export
  useEffect(() => {
    const handler = () => void handleExport()
    window.addEventListener('joepdf:export', handler)
    return () => window.removeEventListener('joepdf:export', handler)
  })

  const checkForPendingRedactions = useCallback(() => {
    let count = 0
    for (const anns of useStore.getState().annotations.values()) {
      count += (anns as Annotation[]).filter(
        (a): a is RedactAnnotation => a.type === 'redact' && !a.applied
      ).length
    }
    return count
  }, [])

  const handleExportClick = useCallback(() => {
    const redactCount = checkForPendingRedactions()
    if (redactCount > 0) {
      setPendingRedactCount(redactCount)
      setShowRedactConfirm(true)
    } else {
      void handleExport()
    }
  }, [checkForPendingRedactions])

  const handleExport = useCallback(async (applyRedactions = false) => {
    const store = useStore.getState()
    const { pdf, annotations } = store
    if (!pdf.pdfBytes) return

    setIsExporting(true)
    try {
      // Apply redactions if requested
      if (applyRedactions) {
        const doc = getCachedDocument()
        if (doc) {
          const redactionsByPage = new Map<number, RedactAnnotation[]>()
          for (const [pageIdx, anns] of annotations) {
            const boxes = (anns as Annotation[]).filter(
              (a): a is RedactAnnotation => a.type === 'redact' && !a.applied
            )
            if (boxes.length > 0) redactionsByPage.set(pageIdx, boxes)
          }

          const results = await rasteriseRedactedPages(doc, redactionsByPage, pdf.pageOrder)
          for (const result of results) {
            setRasterisedPage(result.pageIndex, result.pngBytes)
          }
        }
      }

      const freshStore = useStore.getState()
      const annotsByPage = new Map<number, Annotation[]>()
      for (const [k, v] of freshStore.annotations) {
        annotsByPage.set(k, v as Annotation[])
      }

      const bytes = await exportPDF({
        originalBytes: freshStore.pdf.pdfBytes!,
        pageOrder: freshStore.pdf.pageOrder,
        pageMeta: freshStore.pdf.pageMeta,
        annotationsByPage: annotsByPage,
        rasterisedPages: freshStore.pdf.rasterisedPages,
        pageRotations: freshStore.ui.pageRotations,
        fileName: freshStore.pdf.fileName ?? 'document.pdf',
        options: { removeMetadata: false },
      })

      const outName = (freshStore.pdf.fileName ?? 'document').replace(/\.pdf$/i, '') + '-edited.pdf'
      downloadFile(bytes, outName)
      setIsDirty(false)
      showToast('PDF downloaded successfully.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed.', 'error')
    } finally {
      setIsExporting(false)
    }
  }, [setIsExporting, setIsDirty, setRasterisedPage])

  const hasPDF = !!fileName

  return (
    <>
      <header className="h-12 flex-shrink-0 flex items-center gap-3 px-4 bg-white border-b border-slate-100 select-none">
        {/* Logo / brand */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          {branding.logoDataUrl ? (
            <img src={branding.logoDataUrl} alt={branding.orgName} className="h-7 w-auto" />
          ) : (
            <div className="w-7 h-7 rounded-md bg-[--color-primary] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-sm font-semibold text-slate-800 hidden sm:block truncate max-w-[140px]">
            {branding.appName}
          </span>
        </div>

        {hasPDF && (
          <>
            <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

            {/* File name + unsaved indicator */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-sm text-slate-600 truncate">{fileName}</span>
              {isDirty && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
                  title="Unsaved changes"
                  aria-label="Unsaved changes"
                />
              )}
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5">
              <Tooltip content="Undo" shortcut="Ctrl+Z" side="bottom">
                <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
                  <Undo2 className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Redo" shortcut="Ctrl+Y" side="bottom">
                <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
                  <Redo2 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>

            <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

            {/* Close document */}
            <Tooltip content="Close document" side="bottom">
              <Button
                variant="ghost" size="icon"
                onClick={() => setShowCloseConfirm(true)}
                aria-label="Close document"
              >
                <X className="w-4 h-4" />
              </Button>
            </Tooltip>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip content="Settings & branding" side="bottom">
            <Button variant="ghost" size="icon" onClick={() => setShowBrandingPanel(true)} aria-label="Settings">
              <Settings2 className="w-4 h-4" />
            </Button>
          </Tooltip>

          {hasPDF && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportClick}
              isLoading={isExporting}
              aria-label="Download edited PDF"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => { resetAllState(); setShowCloseConfirm(false) }}
        title="Close document?"
        message="Any unsaved changes will be lost. Are you sure you want to close this document?"
        confirmLabel="Close"
        confirmVariant="danger"
      />

      <ConfirmDialog
        open={showRedactConfirm}
        onClose={() => setShowRedactConfirm(false)}
        onConfirm={() => {
          setShowRedactConfirm(false)
          void handleExport(true)
        }}
        title={`Apply ${pendingRedactCount} pending redaction${pendingRedactCount !== 1 ? 's' : ''}?`}
        message="Redacted pages will be permanently rasterised to images. Text under redaction boxes cannot be recovered. The original document is not modified. Continue?"
        confirmLabel="Apply & download"
        confirmVariant="danger"
      />
    </>
  )
}
