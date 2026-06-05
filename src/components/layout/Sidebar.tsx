import { useStore } from '@/store'
import { ThumbnailPanel } from '@/components/pdf/ThumbnailPanel'
import { ToolBar } from '@/components/toolbar/ToolBar'
import type { PDFDocumentProxy } from '@/lib/pdfRenderer'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  doc: PDFDocumentProxy | null
}

export function Sidebar({ doc }: SidebarProps) {
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)

  return (
    <div className="flex h-full relative">
      {/* Tool bar — always visible */}
      {doc && <ToolBar />}

      {/* Thumbnail panel — collapsible */}
      <aside
        aria-label="Page navigation"
        className={`
          bg-white border-r border-slate-100 flex flex-col overflow-hidden transition-all duration-200
          ${sidebarOpen ? 'w-[136px]' : 'w-0'}
        `}
      >
        {sidebarOpen && doc && (
          <div className="overflow-y-auto scrollbar-thin flex-1">
            <ThumbnailPanel doc={doc} />
          </div>
        )}
      </aside>

      {/* Toggle button */}
      {doc && (
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarOpen}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-4 h-8 bg-white border border-l-0 border-slate-200 rounded-r flex items-center justify-center text-slate-400 hover:text-slate-600 z-10"
        >
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      )}
    </div>
  )
}
