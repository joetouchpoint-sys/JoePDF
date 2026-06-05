import { useRef, useState } from 'react'

interface HexColorInputProps {
  value: string
  onChange: (hex: string) => void
  disabled?: boolean
  label?: string
}

export function HexColorInput({ value, onChange, disabled, label }: HexColorInputProps) {
  // null = not editing, show external value; string = user is actively typing
  const [draft, setDraft] = useState<string | null>(null)
  const nativeRef = useRef<HTMLInputElement>(null)

  const safeNative = /^#[0-9a-fA-F]{6}$/i.test(value) ? value.toLowerCase() : '#000000'
  const displayHex = draft !== null ? draft : value.toUpperCase()

  const commit = (raw: string) => {
    let hex = raw.trim()
    if (!hex.startsWith('#')) hex = '#' + hex
    if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
      hex = '#' + [hex[1], hex[2], hex[3]].map((c) => c!.repeat(2)).join('')
    }
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex.toLowerCase())
    }
    setDraft(null)
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => nativeRef.current?.click()}
        className="w-6 h-6 flex-shrink-0 rounded border border-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: safeNative }}
        title={label ?? 'Pick colour'}
        aria-label={label ?? 'Pick colour'}
      />
      <input
        ref={nativeRef}
        type="color"
        value={safeNative}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        type="text"
        value={displayHex}
        onFocus={() => setDraft(value.toUpperCase())}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value) }}
        disabled={disabled}
        maxLength={7}
        spellCheck={false}
        className="w-20 text-xs font-mono border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[--color-primary] disabled:opacity-40"
        aria-label={label ? `${label} hex code` : 'Hex colour code'}
      />
    </div>
  )
}
