export type AnnotationType =
  | 'text'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'highlight'
  | 'redact'
  | 'image'
  | 'formfield'

interface BaseAnnotation {
  id: string
  type: AnnotationType
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  opacity: number
  visible: boolean
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontColor: string
  fontBold: boolean
  fontItalic: boolean
  align: 'left' | 'center' | 'right'
  backgroundColor: string | null
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect'
  fillColor: string | null
  strokeColor: string
  strokeWidth: number
  cornerRadius: number
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: 'ellipse'
  fillColor: string | null
  strokeColor: string
  strokeWidth: number
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line'
  points: number[]
  strokeColor: string
  strokeWidth: number
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow'
  points: number[]
  strokeColor: string
  strokeWidth: number
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand'
  points: number[]
  strokeColor: string
  strokeWidth: number
  tension: number
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight'
  fillColor: string
}

export interface RedactAnnotation extends BaseAnnotation {
  type: 'redact'
  applied: boolean
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image'
  src: string
  naturalWidth: number
  naturalHeight: number
}

export interface FormFieldAnnotation extends BaseAnnotation {
  type: 'formfield'
  fieldType: 'text' | 'checkbox' | 'dropdown'
  fieldName: string
  placeholder: string
  options: string[]
}

export type Annotation =
  | TextAnnotation
  | RectAnnotation
  | EllipseAnnotation
  | LineAnnotation
  | ArrowAnnotation
  | FreehandAnnotation
  | HighlightAnnotation
  | RedactAnnotation
  | ImageAnnotation
  | FormFieldAnnotation

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnnotationUpdate = Record<string, any>
