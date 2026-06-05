import { useRef, useState, useCallback, useEffect } from 'react'
import { X, Trash2, PenLine, Type, Image as ImageIcon, Check, Upload as UploadIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/store'
import { Tool } from '@/types/tool'
import type { PendingStamp } from '@/store/uiSlice'

type SignTab = 'draw' | 'type' | 'upload'
type StampSize = 'small' | 'medium' | 'large'

const STAMP_SIZE_PX: Record<StampSize, number> = {
  small: 90,
  medium: 150,
  large: 230,
}

const SIGN_FONTS = [
  { name: 'Dancing Script', label: 'Formal' },
  { name: 'Caveat', label: 'Casual' },
  { name: 'Satisfy', label: 'Elegant' },
  { name: 'Kalam', label: 'Natural' },
] as const

const CANVAS_W = 380
const CANVAS_H = 140
const INK_COLOR = '#1a1a2e'

function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  }
}

export function SignatureDialog() {
  const open = useStore((s) => s.ui.signatureDialogOpen)
  const setOpen = useStore((s) => s.setSignatureDialogOpen)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const setPendingStamp = useStore((s) => s.setPendingStamp)

  const [tab, setTab] = useState<SignTab>('draw')
  const [typedText, setTypedText] = useState('')
  const [selectedFont, setSelectedFont] = useState<string>(SIGN_FONTS[0].name)
  const [uploadedSrc, setUploadedSrc] = useState<string | null>(null)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [stampSize, setStampSize] = useState<StampSize>('medium')

  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  // Track the last drawn midpoint for continuous bezier curves
  const prevMidRef = useRef<{ x: number; y: number } | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const resetCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }, [])

  useEffect(() => {
    if (open && tab === 'draw') {
      const t = setTimeout(() => resetCanvas(), 20)
      return () => clearTimeout(t)
    }
  }, [open, tab, resetCanvas])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pt = getCanvasPoint(e, canvas)
    isDrawingRef.current = true
    lastPointRef.current = pt
    prevMidRef.current = pt   // first "previous mid" is the start point itself
    ctx.fillStyle = INK_COLOR
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2)
    ctx.fill()
    setHasDrawing(true)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current || !prevMidRef.current) return
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const current = getCanvasPoint(e, canvas)
    const mid = {
      x: (lastPointRef.current.x + current.x) / 2,
      y: (lastPointRef.current.y + current.y) / 2,
    }
    // Draw from previous midpoint → current midpoint using lastPoint as control.
    // This creates a continuous, gapless bezier chain.
    ctx.strokeStyle = INK_COLOR
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(prevMidRef.current.x, prevMidRef.current.y)
    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, mid.x, mid.y)
    ctx.stroke()
    prevMidRef.current = mid
    lastPointRef.current = current
  }, [])

  const onPointerUp = useCallback(() => {
    // Draw the final segment to the last actual point
    if (isDrawingRef.current && lastPointRef.current && prevMidRef.current) {
      const canvas = drawCanvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = INK_COLOR
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(prevMidRef.current.x, prevMidRef.current.y)
        ctx.lineTo(lastPointRef.current.x, lastPointRef.current.y)
        ctx.stroke()
      }
    }
    isDrawingRef.current = false
    lastPointRef.current = null
    prevMidRef.current = null
  }, [])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setUploadedSrc(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleConfirm = async () => {
    let src: string | null = null
    let natW = 200
    let natH = 80

    if (tab === 'draw') {
      const canvas = drawCanvasRef.current
      if (!canvas || !hasDrawing) return
      src = canvas.toDataURL('image/png')
      natW = canvas.width
      natH = canvas.height
    } else if (tab === 'type') {
      if (!typedText.trim()) return
      const offscreen = document.createElement('canvas')
      try { await document.fonts.load(`64px "${selectedFont}"`) } catch { /* ok */ }
      const measure = document.createElement('canvas')
      const mctx = measure.getContext('2d')!
      mctx.font = `64px "${selectedFont}"`
      const metrics = mctx.measureText(typedText)
      offscreen.width = Math.max(Math.ceil(metrics.width) + 40, 100)
      offscreen.height = 120
      const ctx = offscreen.getContext('2d')!
      ctx.font = `64px "${selectedFont}"`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillStyle = INK_COLOR
      ctx.fillText(typedText, 20, 60)
      src = offscreen.toDataURL('image/png')
      natW = offscreen.width
      natH = offscreen.height
    } else if (tab === 'upload') {
      if (!uploadedSrc) return
      src = uploadedSrc
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => { natW = img.naturalWidth; natH = img.naturalHeight; resolve() }
        img.onerror = () => resolve()
        img.src = uploadedSrc
      })
    }

    if (!src) return

    const targetW = STAMP_SIZE_PX[stampSize]
    const displayW = Math.min(targetW, natW)
    const displayH = Math.round((displayW / natW) * natH)

    const stamp: PendingStamp = { src, displayW, displayH, natW, natH }
    setPendingStamp(stamp)
    setActiveTool(Tool.STAMP)
    setOpen(false)
    setTypedText('')
    setUploadedSrc(null)
    setHasDrawing(false)
  }

  if (!open) return null

  const canConfirm =
    (tab === 'draw' && hasDrawing) ||
    (tab === 'type' && !!typedText.trim()) ||
    (tab === 'upload' && !!uploadedSrc)

  const tabs = [
    { id: 'draw' as const, label: 'Draw', icon: <PenLine className="w-3.5 h-3.5" /> },
    { id: 'type' as const, label: 'Type', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'upload' as const, label: 'Upload', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Sign PDF</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click to place your signature — stamp it as many times as you like</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2',
                tab === t.id
                  ? 'border-[--color-primary] text-[--color-primary]'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Draw your signature below</span>
                <button
                  onClick={resetCanvas}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="relative">
                {/* Baseline guide — CSS only, not drawn on canvas so it won't appear in the exported stamp */}
                <div
                  className="absolute left-4 right-4 border-b border-slate-200 pointer-events-none"
                  style={{ top: `${(CANVAS_H * 0.72 / CANVAS_H) * 100}%` }}
                />
                <canvas
                  ref={drawCanvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="w-full border border-slate-200 rounded-lg bg-transparent cursor-crosshair select-none"
                  style={{ touchAction: 'none' }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">Use mouse or touch to draw</p>
            </div>
          )}

          {tab === 'type' && (
            <div className="space-y-3">
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type your name"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                {SIGN_FONTS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFont(f.name)}
                    className={clsx(
                      'border rounded-lg px-3 py-3 text-left transition-colors',
                      selectedFont === f.name
                        ? 'border-[--color-primary] bg-[--color-primary]/5'
                        : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <span
                      className="block text-xl leading-tight truncate"
                      style={{ fontFamily: `"${f.name}", cursive`, color: INK_COLOR }}
                    >
                      {typedText || 'Your name'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-3">
              {uploadedSrc ? (
                <div
                  className="relative border border-slate-200 rounded-lg p-4 flex items-center justify-center bg-slate-50"
                  style={{ minHeight: '130px' }}
                >
                  <img src={uploadedSrc} alt="Signature preview" className="max-h-24 max-w-full object-contain" />
                  <button
                    onClick={() => setUploadedSrc(null)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
                >
                  <UploadIcon className="w-8 h-8" />
                  <span className="text-sm">Click to upload signature image</span>
                  <span className="text-xs">PNG with transparent background works best</span>
                </button>
              )}
              <input ref={uploadInputRef} type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
            </div>
          )}
        </div>

        {/* Size selector */}
        <div className="px-5 pb-3 flex items-center gap-3">
          <span className="text-xs text-slate-500 flex-shrink-0">Stamp size</span>
          <div className="flex gap-1.5">
            {(['small', 'medium', 'large'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setStampSize(sz)}
                className={clsx(
                  'px-3 py-1 rounded-md text-xs font-medium border transition-colors capitalize',
                  stampSize === sz
                    ? 'border-[--color-primary] text-[--color-primary] bg-[--color-primary]/5'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300',
                )}
              >
                {sz.charAt(0).toUpperCase() + sz.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
            className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Check className="w-3.5 h-3.5" />
            Start stamping
          </button>
        </div>
      </div>
    </div>
  )
}
