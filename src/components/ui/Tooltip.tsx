import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  shortcut?: string
}

export function Tooltip({ content, children, side = 'right', shortcut }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 400)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  const positionStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          role="tooltip"
          className={clsx(
            'absolute z-50 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white shadow-lg pointer-events-none',
            positionStyles[side],
          )}
        >
          {content}
          {shortcut && <span className="ml-1.5 opacity-60">({shortcut})</span>}
        </div>
      )}
    </div>
  )
}
