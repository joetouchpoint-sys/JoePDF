import { useState } from 'react'
import { useStore } from '@/store'
import { splitPDFAtPage } from '@/lib/splitPDF'
import { showToast } from '@/components/ui/Toast'

export function SplitPageDialog() {
  const open = useStore((s) => s.ui.splitPageDialogOpen)
  const setOpen = useStore((s) => s.setSplitPageDialogOpen)
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const pageCount = useStore((s) => s.pdf.pageCount)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const fileName = useStore((s) => s.pdf.fileName)

  const [rawValue, setRawValue] = useState('1')
  const [isSplitting, setIsSplitting] = useState(false)

  if (!open) return null

  const parsed = parseInt(rawValue, 10)
  const isInt = rawValue.trim() !== '' && !rawValue.includes('.')
  const splitAt = isInt ? parsed : NaN

  let error: string | null = null
  if (!isInt || isNaN(splitAt)) error = 'Enter a whole number'
  else if (splitAt < 1) error = 'Minimum is 1'
  else if (splitAt >= pageCount) error = `Must be less than ${pageCount} (the total page count)`

  const isValid = error === null

  const handleConfirm = async () => {
    if (!isValid || !pdfBytes || isSplitting) return
    setIsSplitting(true)
    try {
      const base = (fileName ?? 'document').replace(/\.pdf$/i, '')
      await splitPDFAtPage(pdfBytes, splitAt, pageCount, pageOrder, base)
      showToast(`Split into 2 PDFs — check your downloads.`, 'success')
      setOpen(false)
    } catch {
      showToast('Failed to split PDF.', 'error')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
      onClick={(e) => { if (e.target === e.currentTarget && !isSplitting) setOpen(false) }}
    >
      <div className="bg-white rounded-xl shadow-xl w-96 mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Split PDF</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Splits this {pageCount}-page document into two separate PDFs
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label htmlFor="split-at-page" className="block text-sm font-medium text-slate-700 mb-1.5">
              Split after page
            </label>
            <input
              id="split-at-page"
              type="number"
              min={1}
              max={pageCount - 1}
              step={1}
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              disabled={isSplitting}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent disabled:opacity-50"
              autoFocus
            />
            {error ? (
              <p className="text-xs text-red-500 mt-1.5">{error}</p>
            ) : (
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 space-y-0.5">
                <p>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Part 1:</span>
                  {' '}pages 1–{splitAt}
                </p>
                <p>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Part 2:</span>
                  {' '}pages {splitAt + 1}–{pageCount}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-4">
          <button
            onClick={() => setOpen(false)}
            disabled={isSplitting}
            className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={!isValid || isSplitting}
            className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isSplitting && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSplitting ? 'Splitting…' : 'Split & download'}
          </button>
        </div>
      </div>
    </div>
  )
}
