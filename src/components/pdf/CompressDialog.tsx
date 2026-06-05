import { useState } from 'react'
import { Download, FileArchive } from 'lucide-react'
import { useStore } from '@/store'
import { compressPDF, type CompressResult } from '@/lib/compressPDF'
import { downloadFile, formatFileSize } from '@/utils/fileUtils'
import { showToast } from '@/components/ui/Toast'

type State = 'idle' | 'compressing' | 'done' | 'error'

export function CompressDialog() {
  const open = useStore((s) => s.ui.compressDialogOpen)
  const setOpen = useStore((s) => s.setCompressDialogOpen)
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const fileName = useStore((s) => s.pdf.fileName)

  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<CompressResult | null>(null)

  const reset = () => { setState('idle'); setResult(null) }

  const handleCompress = async () => {
    if (!pdfBytes) return
    setState('compressing')
    try {
      const res = await compressPDF(pdfBytes)
      setResult(res)
      setState('done')
    } catch {
      setState('error')
      showToast('Compression failed. The PDF may be encrypted.', 'error')
    }
  }

  const handleDownload = () => {
    if (!result) return
    const base = (fileName ?? 'document').replace(/\.pdf$/i, '')
    downloadFile(result.bytes, `${base}-compressed.pdf`)
    setOpen(false)
    reset()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <FileArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Compress PDF</h3>
              <p className="text-xs text-slate-500">Reduce file size without losing quality</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 min-h-[100px]">
          {state === 'idle' && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Current size</span>
                <span className="font-medium font-mono">{formatFileSize(pdfBytes?.byteLength ?? 0)}</span>
              </div>
              <p className="text-slate-400 pt-1 border-t border-slate-200 leading-relaxed">
                Removes redundant data and repackages the PDF. Typically saves 5–30%. Image-heavy or already-optimised PDFs may see less.
              </p>
            </div>
          )}

          {state === 'compressing' && (
            <div className="flex items-center justify-center py-4 gap-3">
              <div className="w-5 h-5 border-2 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-600">Compressing…</span>
            </div>
          )}

          {state === 'done' && result && (
            <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Original</span>
                <span className="font-mono">{formatFileSize(result.originalSize)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Compressed</span>
                <span className="font-mono">{formatFileSize(result.compressedSize)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-200 font-medium">
                <span className="text-green-700">Saved</span>
                <span className="font-mono text-green-700">
                  {result.savingsPercent > 0
                    ? `${result.savingsPercent}% · ${formatFileSize(result.originalSize - result.compressedSize)}`
                    : 'Already optimised — no reduction'}
                </span>
              </div>
            </div>
          )}

          {state === 'error' && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              Compression failed. The PDF may be encrypted or malformed.
            </p>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={() => { setOpen(false); reset() }}
            className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {state === 'done' ? 'Close' : 'Cancel'}
          </button>
          {state !== 'done' ? (
            <button
              onClick={() => void handleCompress()}
              disabled={state === 'compressing'}
              className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {state === 'compressing' && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {state === 'compressing' ? 'Compressing…' : 'Compress'}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="flex-1 rounded-lg py-2 text-sm font-semibold text-white flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
