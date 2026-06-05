import { useEffect, useState, useCallback, useRef } from 'react'
import { Undo2, Redo2, Download, Settings2, X, FileText, FileType2, ChevronDown } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { useStore, resetAllState } from '@/store'
import { useHistory } from '@/hooks/useHistory'
import { exportPDF } from '@/lib/pdfExporter'
import { exportToWord } from '@/lib/wordExporter'
import { downloadFile } from '@/utils/fileUtils'
import { showToast } from '@/components/ui/Toast'
import { rasteriseRedactedPages } from '@/lib/redactionEngine'
import { getCachedDocument } from '@/hooks/usePDFDocument'
import type { RedactAnnotation, Annotation } from '@/types/annotation'
import { clsx } from 'clsx'

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
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const annotationCount = useStore((s) => {
    let count = 0
    for (const v of s.annotations.values()) count += v.length
    return count
  })
  useEffect(() => {
    if (annotationCount > 0) setIsDirty(true)
  }, [annotationCount, setIsDirty])

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = () => void handleExport()
    window.addEventListener('joepdf:export', handler)
    return () => window.removeEventListener('joepdf:export', handler)
  })

  const checkForPendingRedactions = useCallback(() => {
    let count = 0
    for (const anns of useStore.getState().annotations.values()) {
      count += (anns as Annotation[]).filter(
        (a): a is RedactAnnotation => a.type === 'redact' && !a.applied,
      ).length
    }
    return count
  }, [])

  const handleExportClick = useCallback(() => {
    setExportMenuOpen(false)
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
      if (applyRedactions) {
        const doc = getCachedDocument()
        if (doc) {
          const redactionsByPage = new Map<number, RedactAnnotation[]>()
          for (const [pageIdx, anns] of annotations) {
            const boxes = (anns as Annotation[]).filter(
              (a): a is RedactAnnotation => a.type === 'redact' && !a.applied,
            )
            if (boxes.length > 0) redactionsByPage.set(pageIdx, boxes)
          }
          const results = await rasteriseRedactedPages(doc, redactionsByPage, pdf.pageOrder)
          for (const result of results) setRasterisedPage(result.pageIndex, result.pngBytes)
        }
      }

      const freshStore = useStore.getState()
      const annotsByPage = new Map<number, Annotation[]>()
      for (const [k, v] of freshStore.annotations) annotsByPage.set(k, v as Annotation[])

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
      showToast('PDF downloaded.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed.', 'error')
    } finally {
      setIsExporting(false)
    }
  }, [setIsExporting, setIsDirty, setRasterisedPage])

  const handleWordExport = useCallback(async () => {
    setExportMenuOpen(false)
    const { pdf } = useStore.getState()
    const doc = getCachedDocument()
    if (!doc || !pdf.pdfBytes) return

    setIsExporting(true)
    showToast('Converting to Word — this may take a moment…', 'info', 6000)
    try {
      await exportToWord(doc, {
        fileName: pdf.fileName ?? 'document',
        pageOrder: pdf.pageOrder,
      })
      showToast('Word document downloaded. Pages are embedded as images.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Word export failed.', 'error')
    } finally {
      setIsExporting(false)
    }
  }, [setIsExporting])

  const hasPDF = !!fileName

  // Use navy blue for header background (Family Action brand)
  const headerBg = branding.secondaryColor || '#292C4F'

  return (
    <>
      <header
        className="h-12 flex-shrink-0 flex items-center gap-3 px-4 select-none"
        style={{ backgroundColor: headerBg }}
      >
        {/* Logo / brand — compact single-line to avoid header overflow */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0 max-w-[200px]">
          {branding.logoDataUrl ? (
            <img src={branding.logoDataUrl} alt={branding.orgName} className="h-7 w-auto max-w-[120px] object-contain" />
          ) : (
            <>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: branding.primaryColor || '#178351' }}
              >
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                className="text-sm font-bold text-white leading-none truncate hidden sm:block"
                style={{ fontFamily: "'Nunito', 'VAG Rounded', system-ui, sans-serif" }}
                title={`${branding.orgName} — ${branding.appName}`}
              >
                {branding.appName}
              </span>
            </>
          )}
        </div>

        {hasPDF && (
          <>
            <div className="w-px h-5 bg-white/20 flex-shrink-0" />

            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-sm text-white/90 truncate">{fileName}</span>
              {isDirty && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: branding.accentColor || '#A0DA00' }}
                  title="Unsaved changes"
                  aria-label="Unsaved changes"
                />
              )}
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5">
              <Tooltip content="Undo" shortcut="Ctrl+Z" side="bottom">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                  className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Redo" shortcut="Ctrl+Y" side="bottom">
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                  className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <div className="w-px h-5 bg-white/20 flex-shrink-0" />

            <Tooltip content="Close document" side="bottom">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(true)}
                aria-label="Close document"
                className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Tooltip>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Tooltip content="Settings & branding" side="bottom">
            <button
              type="button"
              onClick={() => setShowBrandingPanel(true)}
              aria-label="Settings"
              className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </Tooltip>

          {hasPDF && (
            <div ref={exportMenuRef} className="relative">
              {/* Split button: primary action (PDF) + dropdown (Word) */}
              <div className="flex rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={handleExportClick}
                  disabled={isExporting}
                  aria-label="Download PDF"
                  className={clsx(
                    'flex items-center gap-1.5 px-3 h-8 text-sm font-semibold text-white transition-all',
                    'disabled:opacity-60 disabled:pointer-events-none',
                  )}
                  style={{ backgroundColor: branding.primaryColor || '#178351' }}
                >
                  {isExporting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((o) => !o)}
                  disabled={isExporting}
                  aria-label="More export options"
                  aria-expanded={exportMenuOpen}
                  className="flex items-center justify-center w-7 h-8 border-l border-white/20 text-white/80 hover:text-white hover:brightness-110 transition-all disabled:opacity-60 disabled:pointer-events-none"
                  style={{ backgroundColor: branding.primaryColor || '#178351' }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                  <button
                    type="button"
                    onClick={handleExportClick}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Download as PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleWordExport}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileType2 className="w-4 h-4 text-blue-400" />
                    <span>
                      Download as Word
                      <span className="block text-xs text-slate-400 leading-tight">Pages as images</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => { resetAllState(); setShowCloseConfirm(false) }}
        title="Close document?"
        message="Any unsaved changes will be lost."
        confirmLabel="Close"
        confirmVariant="danger"
      />

      <ConfirmDialog
        open={showRedactConfirm}
        onClose={() => setShowRedactConfirm(false)}
        onConfirm={() => { setShowRedactConfirm(false); void handleExport(true) }}
        title={`Apply ${pendingRedactCount} pending redaction${pendingRedactCount !== 1 ? 's' : ''}?`}
        message="Redacted pages will be permanently rasterised to images. Text under redaction boxes cannot be recovered. Continue?"
        confirmLabel="Apply & download"
        confirmVariant="danger"
      />
    </>
  )
}
