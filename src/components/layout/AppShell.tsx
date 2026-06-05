import { useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { InspectorPanel } from './InspectorPanel'
import { PDFViewer } from '@/components/pdf/PDFViewer'
import { UploadScreen } from '@/components/upload/UploadScreen'
import { BrandingProvider } from '@/components/branding/BrandingProvider'
import { BrandingConfigPanel } from '@/components/branding/BrandingConfigPanel'
import { ToastContainer } from '@/components/ui/Toast'
import { usePDFDocument } from '@/hooks/usePDFDocument'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useStore } from '@/store'

function EditorContent() {
  const { doc, isLoading, error } = usePDFDocument()
  const hasPDF = useStore((s) => !!s.pdf.pdfBytes)
  const inspectorOpen = useStore((s) => s.ui.inspectorOpen)

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <Sidebar doc={doc} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" role="main" id="main-content">
        {!hasPDF && <UploadScreen />}

        {hasPDF && isLoading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-500">Loading document…</span>
          </div>
        )}

        {hasPDF && error && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
              <p className="text-red-700 font-medium mb-1">Failed to load PDF</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {hasPDF && !isLoading && !error && doc && <PDFViewer doc={doc} />}
      </main>

      {hasPDF && doc && inspectorOpen && <InspectorPanel />}
    </div>
  )
}

export function AppShell() {
  useKeyboardShortcuts()

  // Warn on unload if dirty
  const isDirty = useStore((s) => s.ui.isDirty)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  return (
    <BrandingProvider>
      <div className="flex flex-col h-full overflow-hidden bg-slate-50">
        <Header />
        <EditorContent />
      </div>
      <BrandingConfigPanel />
      <ToastContainer />
    </BrandingProvider>
  )
}
