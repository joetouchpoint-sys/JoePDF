import { clsx } from 'clsx'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Tool } from '@/types/tool'
import { useStore } from '@/store'

interface ToolButtonProps {
  tool: Tool
  label: string
  shortcut?: string
  icon: React.ReactNode
  disabled?: boolean
  expanded?: boolean
}

export function ToolButton({ tool, label, shortcut, icon, disabled, expanded }: ToolButtonProps) {
  const activeTool = useStore((s) => s.ui.activeTool)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const isActive = activeTool === tool

  const button = (
    <button
      type="button"
      onClick={() => setActiveTool(tool)}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={label}
      className={clsx(
        'flex items-center gap-2 rounded-lg transition-all duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-40',
        expanded ? 'w-full px-2 py-1.5 text-xs font-medium' : 'w-9 h-9 justify-center',
        isActive
          ? 'bg-[--color-primary] text-white shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200',
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {expanded && <span className="truncate">{label}</span>}
      {expanded && shortcut && (
        <span className={clsx('ml-auto text-[10px] flex-shrink-0', isActive ? 'opacity-70' : 'opacity-40')}>
          {shortcut}
        </span>
      )}
    </button>
  )

  if (expanded) return button

  return (
    <Tooltip content={label} shortcut={shortcut} side="right">
      {button}
    </Tooltip>
  )
}
