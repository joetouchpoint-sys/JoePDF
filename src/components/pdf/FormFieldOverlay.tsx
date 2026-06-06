import { useStore } from '@/store'

interface FormFieldOverlayProps {
  pageIndex: number
  scale: number
}

export function FormFieldOverlay({ pageIndex, scale }: FormFieldOverlayProps) {
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const pageMeta = useStore((s) => s.pdf.pageMeta)
  const formFields = useStore((s) => s.formFields)
  const formValues = useStore((s) => s.formValues)
  const setFormValue = useStore((s) => s.setFormValue)

  const originalIdx = pageOrder[pageIndex] ?? pageIndex
  const fields = formFields.get(originalIdx) ?? []
  if (fields.length === 0) return null

  const pageHeightPts = pageMeta[originalIdx]?.height ?? 842

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden
    >
      {fields.map((field) => {
        const left = field.rect.x * scale
        const top = (pageHeightPts - field.rect.y - field.rect.height) * scale
        const w = field.rect.width * scale
        const h = field.rect.height * scale
        const value = formValues[field.fieldName] ?? field.defaultValue

        const commonStyle: React.CSSProperties = {
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          pointerEvents: 'auto',
          fontSize: Math.max(8, h * 0.55),
          background: 'rgba(219, 234, 254, 0.5)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          borderRadius: 2,
          boxSizing: 'border-box',
          outline: 'none',
          padding: '1px 3px',
        }

        if (field.fieldType === 'checkbox') {
          return (
            <input
              key={field.id}
              type="checkbox"
              checked={value === true || value === field.fieldName || value === 'Yes' || value === 'On'}
              onChange={(e) => setFormValue(field.fieldName, e.target.checked)}
              style={{ ...commonStyle, padding: 0, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              aria-label={field.fieldName}
            />
          )
        }

        if (field.fieldType === 'radio') {
          return (
            <input
              key={field.id}
              type="radio"
              name={field.radioGroupName ?? field.fieldName}
              value={field.fieldName}
              checked={formValues[field.radioGroupName ?? field.fieldName] === field.fieldName}
              onChange={() => setFormValue(field.radioGroupName ?? field.fieldName, field.fieldName)}
              style={{ ...commonStyle, padding: 0, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              aria-label={field.fieldName}
            />
          )
        }

        if (field.fieldType === 'dropdown') {
          return (
            <select
              key={field.id}
              value={String(value)}
              onChange={(e) => setFormValue(field.fieldName, e.target.value)}
              style={{ ...commonStyle, cursor: 'pointer' }}
              aria-label={field.fieldName}
            >
              <option value="" />
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )
        }

        // Default: text input
        return (
          <input
            key={field.id}
            type="text"
            value={String(value)}
            onChange={(e) => setFormValue(field.fieldName, e.target.value)}
            style={commonStyle}
            aria-label={field.fieldName}
            placeholder={field.fieldName}
          />
        )
      })}
    </div>
  )
}
