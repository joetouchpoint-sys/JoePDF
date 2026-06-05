import {
  MousePointer2, Type, Square, Circle, Minus, ArrowRight,
  Pencil, Highlighter, Image, EraserIcon,
} from 'lucide-react'
import { Tool } from '@/types/tool'
import { ToolButton } from './ToolButton'
import { clsx } from 'clsx'

interface ToolGroup {
  label: string
  tools: Array<{
    tool: Tool
    label: string
    shortcut: string
    icon: React.ReactNode
  }>
}

const toolGroups: ToolGroup[] = [
  {
    label: 'Select',
    tools: [
      { tool: Tool.SELECT, label: 'Select', shortcut: 'V', icon: <MousePointer2 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Add',
    tools: [
      { tool: Tool.TEXT, label: 'Text', shortcut: 'T', icon: <Type className="w-4 h-4" /> },
      { tool: Tool.IMAGE, label: 'Image', shortcut: 'I', icon: <Image className="w-4 h-4" /> },
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
      { tool: Tool.HIGHLIGHT, label: 'Highlight', shortcut: 'H', icon: <Highlighter className="w-4 h-4" /> },
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
  return (
    <aside
      aria-label="Drawing tools"
      className="w-12 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col items-center py-3 gap-0.5 select-none overflow-y-auto scrollbar-thin"
    >
      {toolGroups.map((group, gi) => (
        <div key={group.label} className={clsx('flex flex-col items-center gap-0.5 w-full px-1.5', gi > 0 && 'border-t border-slate-100 pt-2 mt-1.5')}>
          {group.tools.map((t) => (
            <ToolButton
              key={t.tool}
              tool={t.tool}
              label={t.label}
              shortcut={t.shortcut}
              icon={t.icon}
            />
          ))}
        </div>
      ))}
    </aside>
  )
}
