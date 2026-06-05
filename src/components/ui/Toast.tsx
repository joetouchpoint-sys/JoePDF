/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const toastEvents = new EventTarget()

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  toastEvents.dispatchEvent(new CustomEvent('toast', { detail: { id, type, message, duration } }))
}

const iconMap: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
}

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
}

const iconColorMap: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = iconMap[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md text-sm max-w-sm',
        colorMap[toast.type],
      )}
    >
      <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', iconColorMap[toast.type])} />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const toast = (e as CustomEvent<Toast>).detail
      setToasts((prev) => [...prev.slice(-4), toast])
    }
    toastEvents.addEventListener('toast', handler)
    return () => toastEvents.removeEventListener('toast', handler)
  }, [])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={remove} />
        </div>
      ))}
    </div>
  )
}
