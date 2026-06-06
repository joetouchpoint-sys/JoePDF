import { useStore } from '@/store'
import { useAnnotations } from '@/hooks/useAnnotations'
import { useHistory } from '@/hooks/useHistory'
import { UpdateAnnotationCommand } from '@/commands/UpdateAnnotationCommand'
import { DeleteAnnotationCommand } from '@/commands/DeleteAnnotationCommand'
import type { Annotation } from '@/types/annotation'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'
import { useBranding } from '@/hooks/useBranding'

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border border-slate-200 dark:border-slate-600"
        />
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase">{value}</span>
      </div>
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 text-xs text-right border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
      />
    </div>
  )
}

function TextAnnotationControls({
  annotation,
  update,
}: {
  annotation: Extract<Annotation, { type: 'text' }>
  update: (updates: Partial<Annotation>) => void
}) {
  const { branding } = useBranding()
  const fonts = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times-Roman', label: 'Times New Roman' },
    { value: 'Courier', label: 'Courier' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    ...(branding.customFontBase64 && branding.customFontName
      ? [{ value: branding.customFontName, label: `${branding.customFontName} (brand)` }]
      : []),
  ]

  return (
    <>
      <ColorInput label="Colour" value={annotation.fontColor} onChange={(v) => update({ fontColor: v })} />
      <NumberInput label="Font size" value={annotation.fontSize} onChange={(v) => update({ fontSize: v })} min={6} max={96} />
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">Font</label>
        <select
          value={annotation.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
        >
          {fonts.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => update({ fontBold: !annotation.fontBold })}
          className={`flex-1 text-xs py-1 rounded border transition-colors ${annotation.fontBold ? 'bg-[--color-primary] text-white border-[--color-primary]' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          B
        </button>
        <button
          onClick={() => update({ fontItalic: !annotation.fontItalic })}
          className={`flex-1 text-xs py-1 rounded border italic transition-colors ${annotation.fontItalic ? 'bg-[--color-primary] text-white border-[--color-primary]' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          I
        </button>
      </div>
    </>
  )
}

interface AnnotationPropsProps {
  annotation: Annotation
  pageIndex: number
}

function AnnotationProps({ annotation, pageIndex }: AnnotationPropsProps) {
  const { dispatch } = useHistory()

  const update = (updates: Partial<Annotation>) => {
    dispatch(new UpdateAnnotationCommand(pageIndex, annotation.id, annotation, { ...annotation, ...updates }))
  }

  return (
    <div className="flex flex-col gap-3">
      <NumberInput label="Opacity" value={Math.round(annotation.opacity * 100)} onChange={(v) => update({ opacity: v / 100 })} min={10} max={100} />

      {(annotation.type === 'rect' || annotation.type === 'ellipse') && (
        <>
          <ColorInput label="Stroke" value={annotation.strokeColor} onChange={(v) => update({ strokeColor: v })} />
          <NumberInput label="Stroke width" value={annotation.strokeWidth} onChange={(v) => update({ strokeWidth: v })} min={1} max={20} />
          <ColorInput
            label="Fill"
            value={annotation.fillColor ?? '#ffffff'}
            onChange={(v) => update({ fillColor: v })}
          />
        </>
      )}

      {(annotation.type === 'line' || annotation.type === 'arrow' || annotation.type === 'freehand') && (
        <>
          <ColorInput label="Colour" value={annotation.strokeColor} onChange={(v) => update({ strokeColor: v })} />
          <NumberInput label="Stroke width" value={annotation.strokeWidth} onChange={(v) => update({ strokeWidth: v })} min={1} max={30} />
        </>
      )}

      {annotation.type === 'text' && (
        <TextAnnotationControls annotation={annotation} update={update} />
      )}

      {annotation.type === 'highlight' && (
        <ColorInput label="Colour" value={annotation.fillColor} onChange={(v) => update({ fillColor: v })} />
      )}
    </div>
  )
}

export function InspectorPanel() {
  const currentPage = useStore((s) => s.ui.currentPage)
  const selectedId = useStore((s) => s.ui.selectedAnnotationId)
  const annotations = useAnnotations(currentPage)
  const { dispatch } = useHistory()
  const setSelectedId = useStore((s) => s.setSelectedAnnotationId)

  const selectedAnnotation = annotations.find((a) => a.id === selectedId)

  const handleDelete = () => {
    if (!selectedAnnotation) return
    dispatch(new DeleteAnnotationCommand(currentPage, selectedAnnotation))
    setSelectedId(null)
  }

  return (
    <aside
      aria-label="Properties"
      className="w-52 flex-shrink-0 border-l border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Properties</h2>
        {selectedAnnotation && (
          <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete selected">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {selectedAnnotation ? (
          <>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-3 capitalize">{selectedAnnotation.type}</p>
            <AnnotationProps annotation={selectedAnnotation} pageIndex={currentPage} />
          </>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4 leading-relaxed">
            Select an object on the canvas to edit its properties.
          </p>
        )}
      </div>
    </aside>
  )
}
