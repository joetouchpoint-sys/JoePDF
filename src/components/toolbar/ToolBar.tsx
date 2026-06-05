import {
  MousePointer2, Type, Square, Circle, Minus, ArrowRight,
  Pencil, Highlighter, Image as ImageIcon, EraserIcon,
  ChevronRight, ChevronLeft, MousePointerClick, LayoutGrid,
} from 'lucide-react'
import { Tool } from '@/types/tool'
import { ToolButton } from './ToolButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { useStore } from '@/store'
import { clsx } from 'clsx'

interface ToolGroupDef {
  label: string
  tools: Array<{
    tool: Tool
    label: string
    shortcut: string
    icon: React.ReactNode
  }>
}

const toolGroups: ToolGroupDef[] = [
  {
    label: 'Select',
    tools: [
      { tool: Tool.SELECT, label: 'Select', shortcut: 'V', icon: <MousePointer2 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Add content',
    tools: [
      { tool: Tool.TEXT, label: 'Add text', shortcut: 'T', icon: <Type className="w-4 h-4" /> },
      { tool: Tool.IMAGE, label: 'Add image', shortcut: 'I', icon: <ImageIcon className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Shapes',
    tools: [
      { tool: Tool.RECT, label: 'Rectangle', shortcut: 'R', icon: <Square className="w-4 h-4" /> },
      { tool: Tool.ELLIPSE, label: 'Ellipse', shortcut: 'E', icon: <Circle className="w-4 h-4" /> },
      { tool: Tool.LINE, label: 'Line', shortcut: 'L', icon: <Minus className="w-4 h-4" /> },
      { tool: Tool.ARROW, label: 'Arrow', shortcut: 'A', icon: <ArrowRight className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Draw',
    tools: [
      { tool: Tool.FREEHAND, label: 'Freehand', shortcut: 'F', icon: <Pencil className="w-4 h-4" /> },
      { tool: Tool.HIGHLIGHT, label: 'Highlight area', shortcut: 'H', icon: <Highlighter className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Redact',
    tools: [
      { tool: Tool.REDACT, label: 'Redact', shortcut: 'X', icon: <EraserIcon className="w-4 h-4" /> },
    ],
  },
]

export function ToolBar() {
  const expanded = useStore((s) => s.ui.toolbarExpanded)
  const setExpanded = useStore((s) => s.setToolbarExpanded)
  const textSelectMode = useStore((s) => s.ui.textSelectMode)
  const setTextSelectMode = useStore((s) => s.setTextSelectMode)
  const hasPDF = useStore((s) => !!s.pdf.pdfBytes)
  const setSplitByGroupsOpen = useStore((s) => s.setSplitByGroupsOpen)

  return (
    <aside
      aria-label="Drawing tools"
      className={clsx(
        'flex-shrink-0 bg-white border-r border-slate-100 flex flex-col py-3 gap-0.5 select-none overflow-y-auto scrollbar-thin transition-all duration-200',
        expanded ? 'w-40' : 'w-12',
      )}
    >
      {/* Expand/collapse toggle */}
      <div className={clsx('flex mb-1 px-1.5', expanded ? 'justify-end' : 'justify-center')}>
        <Tooltip content={expanded ? 'Collapse toolbar' : 'Expand toolbar'} side="right">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse toolbar' : 'Expand toolbar'}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {expanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>

      {toolGroups.map((group, gi) => (
        <div
          key={group.label}
          className={clsx(
            'flex flex-col gap-0.5 w-full px-1.5',
            gi > 0 && 'border-t border-slate-100 pt-2 mt-1',
          )}
        >
          {expanded && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-0.5">
              {group.label}
            </p>
          )}
          {group.tools.map((t) => (
            <ToolButton
              key={t.tool}
              tool={t.tool}
              label={t.label}
              shortcut={t.shortcut}
              icon={t.icon}
              expanded={expanded}
            />
          ))}
        </div>
      ))}

      {/* Page tools */}
      <div className="border-t border-slate-100 pt-2 mt-1 px-1.5 flex flex-col gap-0.5">
        {expanded && (
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-0.5">
            Page tools
          </p>
        )}
        <Tooltip content="Split PDF into equal-size page groups" shortcut="G" side="right">
          <button
            type="button"
            onClick={() => setSplitByGroupsOpen(true)}
            disabled={!hasPDF}
            aria-label="Split into page groups"
            className={clsx(
              'flex items-center gap-2 rounded-lg transition-all duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]',
              expanded ? 'w-full px-2 py-1.5 text-xs font-medium' : 'w-9 h-9 justify-center',
              hasPDF
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                : 'text-slate-300 cursor-not-allowed',
            )}
          >
            <LayoutGrid className="w-4 h-4 flex-shrink-0" />
            {expanded && <span className="flex-1 truncate">Split by groups</span>}
            {expanded && <span className="ml-auto text-[10px] opacity-40 flex-shrink-0">G</span>}
          </button>
        </Tooltip>
      </div>

      {/* Text select mode — allows copying text from PDF */}
      <div className="border-t border-slate-100 pt-2 mt-1 px-1.5">
        {expanded && (
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-0.5">
            PDF text
          </p>
        )}
        <Tooltip content="Select & copy text from PDF" shortcut="Q" side="right">
          <button
            type="button"
            onClick={() => setTextSelectMode(!textSelectMode)}
            aria-pressed={textSelectMode}
            aria-label="Select text from PDF"
            className={clsx(
              'flex items-center gap-2 rounded-lg transition-all duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]',
              expanded ? 'w-full px-2 py-1.5 text-xs font-medium' : 'w-9 h-9 justify-center',
              textSelectMode
                ? 'bg-amber-100 text-amber-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            )}
          >
            <MousePointerClick className="w-4 h-4 flex-shrink-0" />
            {expanded && <span className="flex-1 truncate">Select text</span>}
            {expanded && (
              <span className={clsx('ml-auto text-[10px] flex-shrink-0', textSelectMode ? 'opacity-70' : 'opacity-40')}>
                Q
              </span>
            )}
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}
