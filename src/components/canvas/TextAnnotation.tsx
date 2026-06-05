import { useRef, useState } from 'react'
import { Text, Group } from 'react-konva'
import type Konva from 'konva'
import type { TextAnnotation } from '@/types/annotation'
import { SelectionTransformer } from './SelectionTransformer'
import { useHistory } from '@/hooks/useHistory'
import { UpdateAnnotationCommand } from '@/commands/UpdateAnnotationCommand'

interface Props {
  annotation: TextAnnotation
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
  onResizeEnd: (geo: { x: number; y: number; width: number; height: number }) => void
  pageIndex: number
}

export function TextAnnotationShape({ annotation, isSelected, onSelect, onDragEnd, onResizeEnd, pageIndex }: Props) {
  const textRef = useRef<Konva.Text>(null)
  const [editing, setEditing] = useState(false)
  const { dispatch } = useHistory()

  const startEdit = () => {
    const node = textRef.current
    if (!node) return
    setEditing(true)

    const stage = node.getStage()
    const container = stage?.container()
    if (!container) return

    const absPos = node.getAbsolutePosition()
    const stageBox = container.getBoundingClientRect()

    const textarea = document.createElement('textarea')
    textarea.value = annotation.text
    textarea.style.cssText = `
      position: fixed;
      top: ${stageBox.top + absPos.y}px;
      left: ${stageBox.left + absPos.x}px;
      width: ${Math.max(100, annotation.width)}px;
      min-height: 24px;
      font-size: ${annotation.fontSize}px;
      font-family: ${annotation.fontFamily};
      font-weight: ${annotation.fontBold ? 'bold' : 'normal'};
      font-style: ${annotation.fontItalic ? 'italic' : 'normal'};
      color: ${annotation.fontColor};
      border: 2px solid #1d4ed8;
      border-radius: 4px;
      background: rgba(255,255,255,0.95);
      padding: 2px 4px;
      outline: none;
      resize: none;
      overflow: hidden;
      z-index: 9999;
      line-height: 1.4;
    `

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const commit = () => {
      const newText = textarea.value.trim() || annotation.text
      if (newText !== annotation.text) {
        dispatch(new UpdateAnnotationCommand(pageIndex, annotation.id, { text: annotation.text }, { text: newText }))
      }
      textarea.remove()
      setEditing(false)
    }

    textarea.addEventListener('blur', commit, { once: true })
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        commit()
      }
      if (e.key === 'Escape') {
        textarea.value = annotation.text
        commit()
      }
    })
  }

  return (
    <Group>
      <Text
        ref={textRef}
        x={annotation.x}
        y={annotation.y}
        width={Math.max(annotation.width, 20)}
        height={Math.max(annotation.height, 20)}
        text={annotation.text}
        fontSize={annotation.fontSize}
        fontFamily={annotation.fontFamily}
        fontStyle={[annotation.fontBold ? 'bold' : '', annotation.fontItalic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal'}
        fill={annotation.fontColor}
        align={annotation.align}
        opacity={annotation.opacity}
        visible={annotation.visible && !editing}
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={startEdit}
        onDblTap={startEdit}
        onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      />
      <SelectionTransformer nodeRef={textRef} isSelected={isSelected} onResizeEnd={onResizeEnd} />
    </Group>
  )
}
