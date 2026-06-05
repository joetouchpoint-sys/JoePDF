import { useRef, useState } from 'react'
import { Upload as UploadIcon, X } from 'lucide-react'
import { useStore } from '@/store'
import { mergePDFs } from '@/lib/mergePDF'
import { downloadFile, formatFileSize } from '@/utils/fileUtils'
import { showToast } from '@/components/ui/Toast'
import { clsx } from 'clsx'

export function MergePDFDialog() {
  const open = useStore((s) => s.ui.mergePDFDialogOpen)
  const setOpen = useStore((s) => s.setMergePDFDialogOpen)
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const pageCount = useStore((s) => s.pdf.pageCount)
  const fileName = useStore((s) => s.pdf.fileName)

  const [secondFile, setSecondFile] = useState<{ name: string; bytes: Uint8Array; pageCount: number } | null>(null)
  const [position, setPosition] = useState<'append' | 'prepend'>('append')
  const [isMerging, setIsMerging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.match(/\.pdf$/i)) { showToast('Please select a PDF file.', 'error'); return }
    const ab = await file.arrayBuffer()
    const bytes = new Uint8Array(ab)
    // Quick page count from pdf-lib
    try {
      const { PDFDocument } = await import('pdf-lib')
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      setSecondFile({ name: file.name, bytes, pageCount: doc.getPageCount() })
    } catch {
      showToast('Could not read the selected PDF.', 'error')
    }
    e.target.value = ''
  }

  const handleMerge = async () => {
    if (!pdfBytes || !secondFile || isMerging) return
    setIsMerging(true)
    try {
      const merged = await mergePDFs(pdfBytes, secondFile.bytes, position)
      const base = (fileName ?? 'document').replace(/\.pdf$/i, '')
      downloadFile(merged, `${base}-merged.pdf`)
      showToast('Merged PDF downloaded.', 'success')
      setOpen(false)
      setSecondFile(null)
    } catch {
      showToast('Failed to merge PDFs.', 'error')
    } finally {
      setIsMerging(false)
    }
  }

  const currentName = fileName ?? 'current document'
  const secondName = secondFile?.name ?? 'second PDF'

  const firstLabel = position === 'append' ? currentName : secondName
  const secondLabel = position === 'append' ? secondName : currentName

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
      onClick={(e) => { if (e.target === e.currentTarget && !isMerging) setOpen(false) }}
    >
      <div className="bg-white rounded-xl shadow-xl w-[420px] mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Merge PDFs</h3>
          <p className="text-xs text-slate-500 mt-0.5">Combine two PDF files into one</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Current PDF */}
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
            <p className="font-medium text-slate-700 truncate">{currentName}</p>
            <p className="text-slate-400 mt-0.5">{pageCount} page{pageCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Second PDF */}
          {secondFile ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs relative">
              <p className="font-medium text-slate-700 truncate pr-6">{secondFile.name}</p>
              <p className="text-slate-400 mt-0.5">{secondFile.pageCount} page{secondFile.pageCount !== 1 ? 's' : ''} · {formatFileSize(secondFile.bytes.byteLength)}</p>
              <button
                onClick={() => setSecondFile(null)}
                className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-lg p-4 flex items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors text-sm"
            >
              <UploadIcon className="w-4 h-4" />
              Upload second PDF
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="sr-only" onChange={handleFileSelect} />

          {/* Order toggle */}
          {secondFile && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-600">Order in merged file</p>
              <div className="flex gap-2">
                {(['append', 'prepend'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPosition(opt)}
                    className={clsx(
                      'flex-1 border rounded-lg py-1.5 text-xs font-medium transition-colors',
                      position === opt
                        ? 'border-[--color-primary] bg-[--color-primary]/5 text-[--color-primary]'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                  >
                    {opt === 'append' ? 'Current first' : 'Second first'}
                  </button>
                ))}
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] text-slate-500 space-y-0.5">
                <p><span className="font-medium text-slate-600">1.</span> {firstLabel}</p>
                <p><span className="font-medium text-slate-600">2.</span> {secondLabel}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-4">
          <button
            onClick={() => { setOpen(false); setSecondFile(null) }}
            disabled={isMerging}
            className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleMerge()}
            disabled={!secondFile || isMerging}
            className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isMerging && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isMerging ? 'Merging…' : 'Merge & download'}
          </button>
        </div>
      </div>
    </div>
  )
}
