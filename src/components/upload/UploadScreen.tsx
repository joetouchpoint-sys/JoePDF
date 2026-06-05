import { useEffect, useState } from 'react'
import { DropZone } from './DropZone'
import { Shield, PenLine, EraserIcon, LayoutGrid, AlertTriangle, ExternalLink } from 'lucide-react'
import { useStore } from '@/store'
import { loadLatestDraft, deleteDraft } from '@/lib/autosave'
import { setPendingRestore } from '@/lib/autosave'
import { DEFAULT_BRANDING } from '@/types/branding'

const features = [
  {
    icon: Shield,
    title: 'Private by default',
    description: 'Your documents never leave your device. Everything is processed in your browser — nothing is uploaded.',
  },
  {
    icon: PenLine,
    title: 'Annotate and edit',
    description: 'Add text, shapes, highlights, images, and freehand drawings to any page.',
  },
  {
    icon: EraserIcon,
    title: 'Redact sensitive content',
    description: 'Permanently remove text or images you want gone. Once saved, redacted content cannot be recovered or revealed.',
  },
  {
    icon: LayoutGrid,
    title: 'Manage pages',
    description: 'Reorder, merge, split, and extract pages. Build exactly the document you need.',
  },
]

export function UploadScreen() {
  const branding = useStore((s) => s.branding)
  const setPdfBytes = useStore((s) => s.setPdfBytes)

  const [draft, setDraft] = useState<Awaited<ReturnType<typeof loadLatestDraft>>>(null)
  const [draftDismissed, setDraftDismissed] = useState(false)

  useEffect(() => {
    loadLatestDraft().then((d) => { if (d) setDraft(d) })
  }, [])

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
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 gap-10 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Autosave recovery banner */}
      {draft && !draftDismissed && (
        <div className="w-full max-w-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Unsaved work found
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              &ldquo;{draft.fileName}&rdquo; — restore your session?
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleDiscard}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 underline"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleRestore}
              className="text-xs font-semibold text-white rounded px-2.5 py-1"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Restore
            </button>
          </div>
        </div>
      )}

      {/* Brand header */}
      <div className="text-center">
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-2"
          style={{ color: branding.primaryColor || '#178351', fontFamily: "'DM Sans', system-ui" }}
        >
          {branding.orgName}
        </p>
        {branding.logoDataUrl ? (
          <img
            src={branding.logoDataUrl}
            alt={branding.appName}
            className="h-16 w-auto object-contain mx-auto mb-3"
          />
        ) : (
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: branding.secondaryColor || '#292C4F', fontFamily: "'Nunito','VAG Rounded',system-ui" }}
          >
            {branding.appName}
          </h1>
        )}
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-sm mx-auto">
          {description}
        </p>
      </div>

      <DropZone />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl w-full">
        {features.map(({ icon: Icon, title, description: desc }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2 p-5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${branding.primaryColor || '#178351'}18` }}
            >
              <Icon className="w-5 h-5" style={{ color: branding.primaryColor || '#178351' }} />
            </div>
            <p
              className="text-sm font-bold"
              style={{ color: branding.secondaryColor || '#292C4F', fontFamily: "'Nunito','VAG Rounded',system-ui" }}
            >
              {title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {branding.reportIssueUrl && (
        <a
          href={branding.reportIssueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Report an issue / suggest improvement
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
