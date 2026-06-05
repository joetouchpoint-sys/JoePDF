import { useStore } from '@/store'
import { ThumbnailPanel } from '@/components/pdf/ThumbnailPanel'
import { ToolBar } from '@/components/toolbar/ToolBar'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  doc: PDFDocumentProxy | null
}

export function Sidebar({ doc }: SidebarProps) {
  const hasPDF = useStore((s) => !!s.pdf.pdfBytes)
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)

  // Don't render anything until a document is loaded
  if (!hasPDF) return null

  return (
    <div className="flex h-full relative flex-shrink-0">
      <ToolBar />

      {/* Thumbnail panel — collapsible */}
      <aside
        aria-label="Page navigation"
        className={`
          bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all duration-200
          ${sidebarOpen ? 'w-[136px]' : 'w-0'}
        `}
      >
        {sidebarOpen && doc && (
          <div className="overflow-y-auto overflow-x-hidden scrollbar-thin flex-1">
            <ThumbnailPanel doc={doc} />
          </div>
        )}
      </aside>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={sidebarOpen}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-4 h-8 bg-white dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 z-10"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </div>
  )
}
