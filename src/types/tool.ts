export enum Tool {
  SELECT = 'SELECT',
  TEXT = 'TEXT',
  RECT = 'RECT',
  ELLIPSE = 'ELLIPSE',
  LINE = 'LINE',
  ARROW = 'ARROW',
  FREEHAND = 'FREEHAND',
  HIGHLIGHT = 'HIGHLIGHT',
  REDACT = 'REDACT',
  IMAGE = 'IMAGE',
  STAMP = 'STAMP',
  FORM_FIELD = 'FORM_FIELD',
}

export interface ToolInfo {
  id: Tool
  label: string
  shortcut?: string
  group: 'select' | 'shapes' | 'drawing' | 'redact' | 'media'
}

export const TOOL_REGISTRY: ToolInfo[] = [
  { id: Tool.SELECT, label: 'Select', shortcut: 'V', group: 'select' },
  { id: Tool.TEXT, label: 'Text', shortcut: 'T', group: 'drawing' },
  { id: Tool.RECT, label: 'Rectangle', shortcut: 'R', group: 'shapes' },
  { id: Tool.ELLIPSE, label: 'Ellipse', shortcut: 'E', group: 'shapes' },
  { id: Tool.LINE, label: 'Line', shortcut: 'L', group: 'shapes' },
  { id: Tool.ARROW, label: 'Arrow', shortcut: 'A', group: 'shapes' },
  { id: Tool.FREEHAND, label: 'Freehand', shortcut: 'F', group: 'drawing' },
  { id: Tool.HIGHLIGHT, label: 'Highlight', shortcut: 'H', group: 'drawing' },
  { id: Tool.IMAGE, label: 'Image', shortcut: 'I', group: 'media' },
  { id: Tool.REDACT, label: 'Redact', shortcut: 'X', group: 'redact' },
]
