import { useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { PDFViewer } from '@/components/pdf/PDFViewer'
import { UploadScreen } from '@/components/upload/UploadScreen'
import { BrandingProvider } from '@/components/branding/BrandingProvider'
import { BrandingConfigPanel } from '@/components/branding/BrandingConfigPanel'
import { SplitByGroupsDialog } from '@/components/pdf/SplitByGroupsDialog'
import { CompressDialog } from '@/components/pdf/CompressDialog'
import { SignatureDialog } from '@/components/pdf/SignatureDialog'
import { SplitPageDialog } from '@/components/pdf/SplitPageDialog'
import { MergePDFDialog } from '@/components/pdf/MergePDFDialog'
import { ToastContainer } from '@/components/ui/Toast'
import { usePDFDocument } from '@/hooks/usePDFDocument'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAutosave } from '@/hooks/useAutosave'
import { useStore } from '@/store'

function AppFooter() {
  const branding = useStore((s) => s.branding)
  const hasAny = branding.footerText || branding.supportEmail || branding.reportIssueUrl
  if (!hasAny) return null

  const hasSeparator = (branding.footerText || branding.supportEmail) && branding.reportIssueUrl

  return (
    <footer className="h-7 flex-shrink-0 flex items-center justify-center gap-4 px-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
      {branding.footerText && (
        <span className="text-xs text-slate-400 dark:text-slate-500">{branding.footerText}</span>
      )}
      {branding.footerText && branding.supportEmail && (
        <span className="text-slate-200 dark:text-slate-600 text-xs">·</span>
      )}
      {branding.supportEmail && (
        <a
          href={`mailto:${branding.supportEmail}`}
          className="text-xs hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          {branding.supportEmail}
        </a>
      )}
      {hasSeparator && <span className="text-slate-200 dark:text-slate-600 text-xs">·</span>}
      {branding.reportIssueUrl && (
        <a
          href={branding.reportIssueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Report an issue
        </a>
      )}
    </footer>
  )
}

function EditorContent() {
  const { doc, isLoading, error } = usePDFDocument()
  const hasPDF = useStore((s) => !!s.pdf.pdfBytes)

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <Sidebar doc={doc} />

      <main
        className={hasPDF ? 'flex-1 flex flex-col min-w-0 overflow-hidden' : 'flex-1 flex flex-col min-w-0 overflow-y-auto'}
        role="main"
        id="main-content"
      >
        {!hasPDF && <UploadScreen />}

        {hasPDF && isLoading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Loading document…</span>
          </div>
        )}

        {hasPDF && error && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
              <p className="text-red-700 dark:text-red-400 font-medium mb-1">Failed to load PDF</p>
              <p className="text-red-600 dark:text-red-500 text-sm">{error}</p>
            </div>
          </div>
        )}

        {hasPDF && !isLoading && !error && doc && <PDFViewer doc={doc} />}
      </main>
    </div>
  )
}

export function AppShell() {
  useKeyboardShortcuts()
  useAutosave()

  // Warn on refresh/tab-close whenever a document is open
  const hasPDF = useStore((s) => !!s.pdf.pdfBytes)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasPDF) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasPDF])

  return (
    <BrandingProvider>
      <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Header />
        <EditorContent />
        <AppFooter />
      </div>
      <BrandingConfigPanel />
      <SplitByGroupsDialog />
      <CompressDialog />
      <SignatureDialog />
      <SplitPageDialog />
      <MergePDFDialog />
      <ToastContainer />
    </BrandingProvider>
  )
}
