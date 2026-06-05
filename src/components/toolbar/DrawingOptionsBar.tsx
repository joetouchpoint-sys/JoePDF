import { useStore } from '@/store'
import { Tool } from '@/types/tool'
import { clsx } from 'clsx'



const STROKE_WIDTHS = [1, 2, 3, 5, 8]
const FONT_SIZES = [10, 12, 14, 16, 20, 24, 32, 48]

export function DrawingOptionsBar() {
  const activeTool = useStore((s) => s.ui.activeTool)
  const defaults = useStore((s) => s.ui.drawingDefaults)
  const setDefaults = useStore((s) => s.setDrawingDefaults)

  const isShapeTool = activeTool === Tool.RECT || activeTool === Tool.ELLIPSE
  const isLineTool = activeTool === Tool.LINE || activeTool === Tool.ARROW
  const isFreehand = activeTool === Tool.FREEHAND
  const isTextTool = activeTool === Tool.TEXT
  const isHighlight = activeTool === Tool.HIGHLIGHT
  const isDrawing = isShapeTool || isLineTool || isFreehand || isTextTool || isHighlight

  if (!isDrawing) return null

  const handleColor = (key: 'strokeColor' | 'fillColor' | 'fontColor' | 'highlightColor', val: string) => {
    if (val === 'none') {
      if (key === 'fillColor') setDefaults({ fillColor: null })
    } else {
      setDefaults({ [key]: val })
    }
  }

  return (
    <div className="flex items-center gap-4 px-3 h-9 border-b border-slate-100 bg-slate-50 text-sm flex-shrink-0 overflow-x-auto">
      {(isShapeTool || isLineTool || isFreehand) && (
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Stroke</span>
          <input
            type="color"
            value={defaults.strokeColor}
            onChange={(e) => handleColor('strokeColor', e.target.value)}
            className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
          />
        </label>
      )}

      {isShapeTool && (
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Fill</span>
          <div className="relative flex items-center gap-1">
            <input
              type="color"
              value={defaults.fillColor ?? '#ffffff'}
              onChange={(e) => handleColor('fillColor', e.target.value)}
              className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setDefaults({ fillColor: null })}
              title="No fill"
              className={clsx(
                'text-[10px] leading-none px-1 py-0.5 rounded border transition-colors',
                defaults.fillColor === null
                  ? 'border-[--color-primary] bg-blue-50 text-[--color-primary]'
                  : 'border-slate-200 text-slate-400 hover:border-slate-400',
              )}
            >
              None
            </button>
          </div>
        </label>
      )}

      {(isShapeTool || isLineTool || isFreehand) && (
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Width</span>
          <div className="flex items-center gap-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDefaults({ strokeWidth: w })}
                aria-label={`Stroke width ${w}px`}
                className={clsx(
                  'rounded flex items-center justify-center w-7 h-6 transition-colors border',
                  defaults.strokeWidth === w
                    ? 'border-[--color-primary] bg-blue-50'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                <div
                  className="rounded-full bg-slate-700"
                  style={{ width: Math.min(w * 3, 20), height: w }}
                />
              </button>
            ))}
          </div>
        </label>
      )}

      {isTextTool && (
        <>
          <label className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">Colour</span>
            <input
              type="color"
              value={defaults.fontColor}
              onChange={(e) => handleColor('fontColor', e.target.value)}
              className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">Size</span>
            <select
              value={defaults.fontSize}
              onChange={(e) => setDefaults({ fontSize: Number(e.target.value) })}
              className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </>
      )}

      {isHighlight && (
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Colour</span>
          <input
            type="color"
            value={defaults.highlightColor}
            onChange={(e) => handleColor('highlightColor', e.target.value)}
            className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
          />
        </label>
      )}

      <span className="ml-auto text-xs text-slate-400 whitespace-nowrap pr-1">
        {isTextTool ? 'Click to place text' : isHighlight ? 'Drag to highlight area' : 'Drag to draw'}
      </span>
    </div>
  )
}
