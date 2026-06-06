import { useState, useCallback } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store'
import { useHistory } from '@/hooks/useHistory'
import { AddAnnotationCommand } from '@/commands/AddAnnotationCommand'
import { generateId } from '@/utils/fileUtils'
import type { FormFieldAnnotation } from '@/types/annotation'

export function FormFieldDialog() {
  const pendingFormField = useStore((s) => s.ui.pendingFormField)
  const setPendingFormField = useStore((s) => s.setPendingFormField)
  const { dispatch } = useHistory()

  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState<FormFieldAnnotation['fieldType']>('text')
  const [placeholder, setPlaceholder] = useState('')
  const [optionsRaw, setOptionsRaw] = useState('')

  const open = pendingFormField !== null

  const handleClose = useCallback(() => {
    setPendingFormField(null)
    setFieldName('')
    setFieldType('text')
    setPlaceholder('')
    setOptionsRaw('')
  }, [setPendingFormField])

  const handleConfirm = useCallback(() => {
    if (!pendingFormField) return
    const name = fieldName.trim() || `field_${generateId().slice(0, 6)}`
    const ann: FormFieldAnnotation = {
      id: generateId(),
      type: 'formfield',
      pageIndex: pendingFormField.pageIndex,
      x: pendingFormField.x,
      y: pendingFormField.y,
      width: pendingFormField.width,
      height: pendingFormField.height,
      opacity: 1,
      visible: true,
      fieldType,
      fieldName: name,
      placeholder,
      options: fieldType === 'dropdown'
        ? optionsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    }
    dispatch(new AddAnnotationCommand(pendingFormField.pageIndex, ann))
    handleClose()
  }, [pendingFormField, fieldName, fieldType, placeholder, optionsRaw, dispatch, handleClose])

  return (
    <Dialog open={open} onClose={handleClose} title="Add form field">
      <div className="flex flex-col gap-4 p-5">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
            Field type
          </label>
          <div className="flex gap-2">
            {(['text', 'checkbox', 'dropdown'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFieldType(t)}
                className={`flex-1 py-1.5 text-sm rounded-md border transition-colors capitalize ${
                  fieldType === t
                    ? 'border-[--color-primary] bg-[--color-primary] text-white'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
            Field name <span className="font-normal text-slate-400">(unique identifier in the PDF)</span>
          </label>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="e.g. signature, date, notes"
            aria-label="Field name"
            autoFocus
            className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          />
        </div>

        {fieldType === 'text' && (
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
              Placeholder text <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="e.g. Enter your name…"
              aria-label="Placeholder text"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
        )}

        {fieldType === 'dropdown' && (
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
              Options <span className="font-normal text-slate-400">(one per line)</span>
            </label>
            <textarea
              value={optionsRaw}
              onChange={(e) => setOptionsRaw(e.target.value)}
              placeholder={'Option 1\nOption 2\nOption 3'}
              rows={4}
              aria-label="Dropdown options"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] resize-none"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
          <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>Add field</Button>
        </div>
      </div>
    </Dialog>
  )
}
