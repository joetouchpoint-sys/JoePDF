import { useState } from 'react'
import { useStore } from '@/store'
import { downloadFile } from '@/utils/fileUtils'
import { showToast } from '@/components/ui/Toast'

export function SplitByGroupsDialog() {
  const open = useStore((s) => s.ui.splitByGroupsOpen)
  const setSplitByGroupsOpen = useStore((s) => s.setSplitByGroupsOpen)
  const pdfBytes = useStore((s) => s.pdf.pdfBytes)
  const pageCount = useStore((s) => s.pdf.pageCount)
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const fileName = useStore((s) => s.pdf.fileName)

  const [rawValue, setRawValue] = useState('2')
  const [isSplitting, setIsSplitting] = useState(false)
  const [useZip, setUseZip] = useState(false)

  if (!open) return null

  const parsed = parseInt(rawValue, 10)
  const isInt = rawValue.trim() !== '' && !rawValue.includes('.')
  const groupSize = isInt ? parsed : NaN

  let error: string | null = null
  if (!isInt || isNaN(groupSize)) error = 'Enter a whole number'
  else if (groupSize < 1) error = 'Minimum is 1 page per group'
  else if (groupSize > pageCount) error = `Maximum is ${pageCount} (the total number of pages)`

  const isValid = error === null
  const numGroups = isValid ? Math.ceil(pageCount / groupSize) : 0
  const remainder = isValid ? pageCount % groupSize : 0
  const lastGroupSize = remainder === 0 ? groupSize : remainder
  const isUneven = isValid && lastGroupSize !== groupSize
  const offerZip = isValid && numGroups >= 5

  const handleClose = () => {
    if (!isSplitting) setSplitByGroupsOpen(false)
  }

  const handleConfirm = async () => {
    if (!isValid || !pdfBytes || isSplitting) return
    setIsSplitting(true)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const srcDoc = await PDFDocument.load(pdfBytes)
      const base = (fileName ?? 'document').replace(/\.pdf$/i, '')

      type GroupFile = { name: string; bytes: Uint8Array }
      const files: GroupFile[] = []

      for (let g = 0; g < numGroups; g++) {
        const startIdx = g * groupSize
        const endIdx = Math.min(startIdx + groupSize, pageCount)
        const srcIndices = Array.from(
          { length: endIdx - startIdx },
          (_, i) => pageOrder[startIdx + i] ?? (startIdx + i),
        )
        const outDoc = await PDFDocument.create()
        const pages = await outDoc.copyPages(srcDoc, srcIndices)
        pages.forEach(p => outDoc.addPage(p))
        const bytes = await outDoc.save()
        files.push({
          name: `${base}-group${g + 1}-pages${startIdx + 1}-${endIdx}.pdf`,
          bytes,
        })
      }

      if (useZip && offerZip) {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        for (const f of files) zip.file(f.name, f.bytes)
        const zipBytes = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' })
        downloadFile(zipBytes, `${base}-groups.zip`, 'application/zip')
      } else {
        for (let i = 0; i < files.length; i++) {
          downloadFile(files[i]!.bytes, files[i]!.name)
          if (i < files.length - 1) await new Promise<void>(r => setTimeout(r, 250))
        }
      }

      showToast(`Split into ${numGroups} PDF${numGroups > 1 ? 's' : ''}${useZip && offerZip ? ' (zipped)' : ''} — check your downloads.`, 'success')
      setSplitByGroupsOpen(false)
    } catch {
      showToast('Failed to split PDF into groups.', 'error')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-96 mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Split into page groups</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Each group is downloaded as a separate PDF file
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label
              htmlFor="split-group-size"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Pages per group
            </label>
            <input
              id="split-group-size"
              type="number"
              min={1}
              max={pageCount}
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
                  Creates{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {numGroups} PDF{numGroups !== 1 ? 's' : ''}
                  </span>
                  {' '}of {groupSize} page{groupSize !== 1 ? 's' : ''} each
                  {isUneven && (
                    <span className="text-slate-400">
                      {' '}(final PDF has {lastGroupSize} page{lastGroupSize !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
                {numGroups > 15 && !useZip && (
                  <p className="text-amber-600">
                    Your browser may ask permission before downloading {numGroups} files.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ZIP option — only shown for 5+ groups */}
          {offerZip && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useZip}
                onChange={(e) => setUseZip(e.target.checked)}
                className="w-4 h-4 rounded accent-[--color-primary]"
              />
              <span className="text-sm text-slate-700">
                Download as a single ZIP file
                <span className="text-xs text-slate-400 ml-1">({numGroups} PDFs inside)</span>
              </span>
            </label>
          )}

          {isValid && (
            <div className="rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-500">
              <p className="font-medium text-slate-600 mb-1">Preview</p>
              {Array.from({ length: Math.min(numGroups, 5) }, (_, g) => {
                const start = g * groupSize + 1
                const end = Math.min((g + 1) * groupSize, pageCount)
                return (
                  <p key={g}>
                    PDF {g + 1}: pages {start}–{end}
                  </p>
                )
              })}
              {numGroups > 5 && (
                <p className="text-slate-400">…and {numGroups - 5} more</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-4">
          <button
            onClick={handleClose}
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
