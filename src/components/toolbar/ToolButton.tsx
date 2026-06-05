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
}

export function ToolButton({ tool, label, shortcut, icon, disabled }: ToolButtonProps) {
  const activeTool = useStore((s) => s.ui.activeTool)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const isActive = activeTool === tool

  return (
    <Tooltip content={label} shortcut={shortcut} side="right">
      <button
        type="button"
        onClick={() => setActiveTool(tool)}
        disabled={disabled}
        aria-pressed={isActive}
        aria-label={label}
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-40',
          isActive
            ? 'bg-[--color-primary] text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
        )}
      >
        {icon}
      </button>
    </Tooltip>
  )
}
