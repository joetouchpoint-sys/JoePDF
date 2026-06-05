import { useStore } from '@/store'
import { Tool } from '@/types/tool'
import { HexColorInput } from '@/components/ui/HexColorInput'
import { useHistory } from '@/hooks/useHistory'
import { UpdateAnnotationCommand } from '@/commands/UpdateAnnotationCommand'
import type { TextAnnotation, AnnotationUpdate } from '@/types/annotation'
import { clsx } from 'clsx'

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72]
const FONT_FAMILIES = [
  'DM Sans', 'Arial', 'Helvetica', 'Georgia',
  'Times New Roman', 'Trebuchet MS', 'Verdana', 'Courier New',
]

export function SelectedAnnotationBar() {
  const activeTool = useStore((s) => s.ui.activeTool)
  const selectedId = useStore((s) => s.ui.selectedAnnotationId)
  const { dispatch } = useHistory()

  const selectedAnn = useStore((s) => {
    const id = s.ui.selectedAnnotationId
    if (!id) return null
    const onCurrentPage = s.annotations.get(s.ui.currentPage)
    if (onCurrentPage) {
      const found = onCurrentPage.find((a) => a.id === id)
      if (found) return found
    }
    for (const anns of s.annotations.values()) {
      const found = anns.find((a) => a.id === id)
      if (found) return found
    }
    return null
  })

  if (activeTool !== Tool.SELECT || !selectedId || !selectedAnn || selectedAnn.type !== 'text') {
    return null
  }

  const ann = selectedAnn as TextAnnotation

  const update = (props: AnnotationUpdate) => {
    const oldValues: AnnotationUpdate = {}
    for (const key of Object.keys(props)) {
      oldValues[key] = (ann as unknown as Record<string, unknown>)[key]
    }
    dispatch(new UpdateAnnotationCommand(ann.pageIndex, ann.id, oldValues, props))
  }

  return (
    <div className="flex items-center gap-3 px-3 h-10 border-b border-amber-200 bg-amber-50 text-sm flex-shrink-0 overflow-x-auto">
      <span className="text-xs text-amber-700 font-medium whitespace-nowrap flex-shrink-0">
        Text selected
      </span>

      <div className="w-px h-5 bg-amber-200 flex-shrink-0" />

      {/* Font family */}
      <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
        <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Font</legend>
        <select
          value={ann.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white max-w-[110px]"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </fieldset>

      {/* Font size */}
      <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
        <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Size</legend>
        <select
          value={ann.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) })}
          className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white w-14"
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </fieldset>

      {/* Font colour */}
      <fieldset className="flex items-center gap-1.5 border-0 p-0 m-0">
        <legend className="text-xs text-slate-500 float-left mr-1.5 leading-[24px]">Colour</legend>
        <HexColorInput
          value={ann.fontColor}
          onChange={(hex) => update({ fontColor: hex })}
          label="Font colour"
        />
      </fieldset>

      {/* Bold / Italic */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => update({ fontBold: !ann.fontBold })}
          aria-pressed={ann.fontBold}
          title="Bold"
          className={clsx(
            'w-7 h-7 rounded flex items-center justify-center text-sm font-bold border transition-colors',
            ann.fontBold
              ? 'bg-[--color-primary] text-white border-[--color-primary]'
              : 'border-slate-200 text-slate-500 hover:border-slate-400',
          )}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => update({ fontItalic: !ann.fontItalic })}
          aria-pressed={ann.fontItalic}
          title="Italic"
          className={clsx(
            'w-7 h-7 rounded flex items-center justify-center text-sm italic border transition-colors',
            ann.fontItalic
              ? 'bg-[--color-primary] text-white border-[--color-primary]'
              : 'border-slate-200 text-slate-500 hover:border-slate-400',
          )}
        >
          I
        </button>
      </div>

      <span className="ml-auto text-xs text-amber-500/70 whitespace-nowrap pr-1 italic flex-shrink-0">
        Click away to deselect · changes are undoable
      </span>
    </div>
  )
}
