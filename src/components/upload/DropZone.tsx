import { useCallback, useState, useRef } from 'react'
import { clsx } from 'clsx'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { isPdfBuffer } from '@/utils/fileUtils'
import { useStore } from '@/store'
import { resetAllState } from '@/store'

export function DropZone() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const setPdfBytes = useStore((s) => s.setPdfBytes)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a PDF file.')
        return
      }

      if (file.size > 200 * 1024 * 1024) {
        setError('File is too large. Maximum size is 200 MB.')
        return
      }

      const buffer = await file.arrayBuffer()

      if (!isPdfBuffer(buffer)) {
        setError('This file does not appear to be a valid PDF.')
        return
      }

      resetAllState()
      setPdfBytes(buffer, file.name)
    },
    [setPdfBytes],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) void processFile(file)
    },
    [processFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void processFile(file)
      e.target.value = ''
    },
    [processFile],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop zone: drag a PDF here or click to browse"
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      className={clsx(
        'w-full max-w-lg border-2 border-dashed rounded-2xl px-8 py-14 flex flex-col items-center gap-4',
        'cursor-pointer transition-all duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2',
        isDragOver
          ? 'border-[--color-primary] bg-blue-50 scale-[1.01]'
          : 'border-slate-200 bg-white hover:border-[--color-primary] hover:bg-slate-50',
      )}
    >
      <div className={clsx(
        'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
        isDragOver ? 'bg-blue-100' : 'bg-slate-100',
      )}>
        {isDragOver ? (
          <FileText className="w-8 h-8 text-[--color-primary]" />
        ) : (
          <Upload className="w-8 h-8 text-slate-400" />
        )}
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-slate-700">
          {isDragOver ? 'Release to open' : 'Drop a PDF here'}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          or <span className="text-[--color-primary] font-medium">browse to upload</span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400">PDF files up to 200 MB</p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={handleChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
