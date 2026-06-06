export type PDFFormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button'

export interface PDFFormField {
  id: string
  fieldName: string
  fieldType: PDFFormFieldType
  /** Bounding rect in PDF user-space units (bottom-left origin) */
  rect: { x: number; y: number; width: number; height: number }
  /** Original (non-logical) page index */
  pageIndex: number
  defaultValue: string | boolean
  options?: string[]
  /** For radio groups — all buttons in the group share a name */
  radioGroupName?: string
}

export interface OcrWord {
  text: string
  /** In PDF user-space units (bottom-left origin) */
  x: number
  y: number
  width: number
  height: number
  confidence: number
}
