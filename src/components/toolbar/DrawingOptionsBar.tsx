import { useStore } from '@/store'
import { Tool } from '@/types/tool'
import { HexColorInput } from '@/components/ui/HexColorInput'
import { clsx } from 'clsx'

const STROKE_WIDTHS = [1, 2, 3, 5, 8]
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72]
const FONT_FAMILIES = [
  'DM Sans',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Courier New',
]

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

  return (
    <div className="flex items-center gap-3 px-3 h-10 border-b border-slate-200 bg-white text-sm flex-shrink-0 overflow-x-auto">

      {/* Stroke colour + none toggle — shapes, lines, freehand */}
      {(isShapeTool || isLineTool || isFreehand) && (
        <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
          <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Stroke</legend>
          <HexColorInput
            value={defaults.strokeNone ? '#cccccc' : defaults.strokeColor}
            onChange={(hex) => setDefaults({ strokeColor: hex, strokeNone: false })}
            disabled={defaults.strokeNone}
            label="Stroke colour"
          />
          <button
            type="button"
            onClick={() => setDefaults({ strokeNone: !defaults.strokeNone })}
            className={clsx(
              'text-[10px] leading-none px-1.5 py-1 rounded border transition-colors whitespace-nowrap',
              defaults.strokeNone
                ? 'border-[--color-primary] bg-green-50 text-[--color-primary] font-medium'
                : 'border-slate-200 text-slate-400 hover:border-slate-400',
            )}
            title="No stroke"
          >
            None
          </button>
        </fieldset>
      )}

      {/* Fill colour + none toggle — shapes only */}
      {isShapeTool && (
        <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
          <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Fill</legend>
          <HexColorInput
            value={defaults.fillColor ?? '#ffffff'}
            onChange={(hex) => setDefaults({ fillColor: hex })}
            disabled={defaults.fillColor === null}
            label="Fill colour"
          />
          <button
            type="button"
            onClick={() => setDefaults({ fillColor: defaults.fillColor === null ? '#ffffff' : null })}
            className={clsx(
              'text-[10px] leading-none px-1.5 py-1 rounded border transition-colors whitespace-nowrap',
              defaults.fillColor === null
                ? 'border-[--color-primary] bg-green-50 text-[--color-primary] font-medium'
                : 'border-slate-200 text-slate-400 hover:border-slate-400',
            )}
            title="No fill"
          >
            None
          </button>
        </fieldset>
      )}

      {/* Stroke width buttons */}
      {(isShapeTool || isLineTool || isFreehand) && !defaults.strokeNone && (
        <fieldset className="flex items-center gap-1 border-0 p-0 m-0">
          <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Width</legend>
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setDefaults({ strokeWidth: w })}
              aria-label={`${w}px stroke`}
              className={clsx(
                'rounded flex items-center justify-center w-7 h-6 transition-colors border',
                defaults.strokeWidth === w
                  ? 'border-[--color-primary] bg-green-50'
                  : 'border-slate-200 hover:border-slate-400',
              )}
            >
              <div
                className="rounded-full bg-slate-600"
                style={{ width: Math.min(w * 3, 20), height: w }}
              />
            </button>
          ))}
        </fieldset>
      )}

      {/* Text tool options */}
      {isTextTool && (
        <>
          <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
            <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Font</legend>
            <select
              value={defaults.fontFamily}
              onChange={(e) => setDefaults({ fontFamily: e.target.value })}
              className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white max-w-[110px]"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </fieldset>
          <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
            <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Size</legend>
            <select
              value={defaults.fontSize}
              onChange={(e) => setDefaults({ fontSize: Number(e.target.value) })}
              className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white w-14"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </fieldset>
          <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
            <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Colour</legend>
            <HexColorInput
              value={defaults.fontColor}
              onChange={(hex) => setDefaults({ fontColor: hex })}
              label="Font colour"
            />
          </fieldset>
        </>
      )}

      {/* Highlight colour */}
      {isHighlight && (
        <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
          <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Colour</legend>
          <HexColorInput
            value={defaults.highlightColor}
            onChange={(hex) => setDefaults({ highlightColor: hex })}
            label="Highlight colour"
          />
        </fieldset>
      )}

      <span className="ml-auto text-xs text-slate-400 whitespace-nowrap pr-1 italic">
        {isTextTool ? 'Click anywhere on the page to place text' : isHighlight ? 'Drag to highlight an area' : 'Drag to draw — release to finish'}
      </span>
    </div>
  )
}
