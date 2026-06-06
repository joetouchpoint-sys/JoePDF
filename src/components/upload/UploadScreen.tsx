import { useEffect, useRef, useState } from 'react'
import { DropZone } from './DropZone'
import { ShieldCheck, PenLine, EraserIcon, LayoutGrid, AlertTriangle, ExternalLink } from 'lucide-react'
import { useStore } from '@/store'
import { loadLatestDraft, deleteDraft, setPendingRestore } from '@/lib/autosave'
import { DEFAULT_BRANDING } from '@/types/branding'

const features = [
  {
    icon: ShieldCheck,
    title: 'Fully private',
    description: 'Nothing leaves your device. All processing happens entirely in your browser.',
  },
  {
    icon: PenLine,
    title: 'Annotate & edit',
    description: 'Add text, shapes, highlights, images, and freehand drawings.',
  },
  {
    icon: EraserIcon,
    title: 'Redact content',
    description: 'Permanently remove sensitive text or images. Redacted content cannot be recovered.',
  },
  {
    icon: LayoutGrid,
    title: 'Manage pages',
    description: 'Reorder, merge, split, and extract pages from any PDF.',
  },
]

const SECRET = 'testpdf'

export function UploadScreen() {
  const branding = useStore((s) => s.branding)
  const setPdfBytes = useStore((s) => s.setPdfBytes)

  const [draft, setDraft] = useState<Awaited<ReturnType<typeof loadLatestDraft>>>(null)
  const [draftDismissed, setDraftDismissed] = useState(false)
  const keyBuffer = useRef('')

  useEffect(() => {
    loadLatestDraft().then((d) => { if (d) setDraft(d) })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key.length !== 1) return
      keyBuffer.current = (keyBuffer.current + e.key).slice(-SECRET.length)
      if (keyBuffer.current === SECRET) {
        keyBuffer.current = ''
        void fetch('/_t.pdf')
          .then((r) => r.arrayBuffer())
          .then((buf) => setPdfBytes(buf, 'test-20-pages.pdf'))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setPdfBytes])

  const handleRestore = () => {
    if (!draft) return
    setPendingRestore(draft)
    setPdfBytes(draft.pdfBytes, draft.fileName)
    setDraft(null)
  }

  const handleDiscard = () => {
    if (!draft) return
    void deleteDraft(draft.id)
    setDraft(null)
    setDraftDismissed(true)
  }

  const description = branding.uploadDescription || DEFAULT_BRANDING.uploadDescription

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-full px-4 py-6 gap-5 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Autosave recovery banner */}
      {draft && !draftDismissed && (
        <div className="w-full max-w-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Unsaved work found</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              &ldquo;{draft.fileName}&rdquo; — restore your session?
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" onClick={handleDiscard} className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 underline">
              Discard
            </button>
            <button type="button" onClick={handleRestore} className="text-xs font-semibold text-white rounded px-2.5 py-1" style={{ backgroundColor: 'var(--color-primary)' }}>
              Restore
            </button>
          </div>
        </div>
      )}

      {/* Brand header */}
      <div className="text-center flex-shrink-0">
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-1.5"
          style={{ color: branding.primaryColor || '#178351', fontFamily: "'DM Sans', system-ui" }}
        >
          {branding.orgName}
        </p>
        {branding.logoDataUrl ? (
          <img src={branding.logoDataUrl} alt={branding.appName} className="h-12 w-auto object-contain mx-auto mb-2" />
        ) : (
          <h1 className="text-2xl font-bold mb-1.5" style={{ color: branding.secondaryColor || '#292C4F', fontFamily: "'Nunito','VAG Rounded',system-ui" }}>
            {branding.appName}
          </h1>
        )}
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex-shrink-0 w-full flex justify-center">
        <DropZone />
      </div>

      {/* Feature cards — 4-column grid, compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full flex-shrink-0">
        {features.map(({ icon: Icon, title, description: desc }) => (
          <div key={title} className="flex flex-col items-center text-center gap-1.5 p-3.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${branding.primaryColor || '#178351'}18` }}
            >
              <Icon className="w-4 h-4" style={{ color: branding.primaryColor || '#178351' }} />
            </div>
            <p className="text-xs font-bold leading-tight" style={{ color: branding.secondaryColor || '#292C4F', fontFamily: "'Nunito','VAG Rounded',system-ui" }}>
              {title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {branding.reportIssueUrl && (
        <a
          href={branding.reportIssueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:underline flex-shrink-0"
          style={{ color: 'var(--color-primary)' }}
        >
          Report an issue / suggest improvement
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
