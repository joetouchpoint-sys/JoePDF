import { useRef, useState, useEffect, useCallback } from 'react'
import { Text, Group } from 'react-konva'
import type Konva from 'konva'
import type { TextAnnotation } from '@/types/annotation'
import { SelectionTransformer } from './SelectionTransformer'
import { useHistory } from '@/hooks/useHistory'
import { UpdateAnnotationCommand } from '@/commands/UpdateAnnotationCommand'

interface Props {
  annotation: TextAnnotation
  isSelected: boolean
  autoEdit?: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
  onResizeEnd: (geo: { x: number; y: number; width: number; height: number }) => void
  onEditDone?: () => void
  pageIndex: number
}

export function TextAnnotationShape({
  annotation, isSelected, autoEdit, onSelect, onDragEnd, onResizeEnd, onEditDone, pageIndex,
}: Props) {
  const textRef = useRef<Konva.Text>(null)
  const [editing, setEditing] = useState(false)
  const { dispatch } = useHistory()

  const startEdit = useCallback(() => {
    const node = textRef.current
    if (!node) return
    setEditing(true)

    const stage = node.getStage()
    const container = stage?.container()
    if (!container) return

    const absPos = node.getAbsolutePosition()
    const stageBox = container.getBoundingClientRect()

    const textarea = document.createElement('textarea')
    // Pre-select the placeholder text so user can just type over it
    const isPlaceholder = annotation.text === 'Type here…'
    textarea.value = isPlaceholder ? '' : annotation.text
    textarea.placeholder = 'Type here…'
    textarea.style.cssText = `
      position: fixed;
      top: ${stageBox.top + absPos.y}px;
      left: ${stageBox.left + absPos.x}px;
      width: ${Math.max(200, annotation.width)}px;
      min-height: ${Math.max(annotation.fontSize + 8, 32)}px;
      font-size: ${annotation.fontSize}px;
      font-family: ${annotation.fontFamily};
      font-weight: ${annotation.fontBold ? 'bold' : 'normal'};
      font-style: ${annotation.fontItalic ? 'italic' : 'normal'};
      color: ${annotation.fontColor};
      border: 2px solid #1d4ed8;
      border-radius: 4px;
      background: rgba(255,255,255,0.97);
      padding: 4px 6px;
      outline: none;
      resize: horizontal;
      overflow: hidden;
      z-index: 9999;
      line-height: 1.4;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    `

    document.body.appendChild(textarea)
    textarea.focus()
    if (!isPlaceholder) textarea.select()

    let committed = false
    const commit = () => {
      if (committed) return
      committed = true
      const newText = textarea.value.trim()
      const finalText = newText || (isPlaceholder ? 'Text' : annotation.text)
      if (finalText !== annotation.text) {
        dispatch(new UpdateAnnotationCommand(pageIndex, annotation.id,
          { text: annotation.text }, { text: finalText }))
      }
      if (textarea.isConnected) textarea.remove()
      setEditing(false)
      onEditDone?.()
    }

    textarea.addEventListener('blur', commit, { once: true })
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
      if (e.key === 'Escape') { textarea.value = isPlaceholder ? '' : annotation.text; commit() }
    })
  }, [annotation, pageIndex, dispatch, onEditDone])

  // Auto-open editor when this annotation is newly created
  useEffect(() => {
    if (autoEdit) {
      // Small delay so the Konva node finishes mounting
      const t = setTimeout(startEdit, 50)
      return () => clearTimeout(t)
    }
  }, [autoEdit, startEdit])

  const fontStyle = [
    annotation.fontBold ? 'bold' : '',
    annotation.fontItalic ? 'italic' : '',
  ].filter(Boolean).join(' ') || 'normal'

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
        fontStyle={fontStyle}
        fill={annotation.text === 'Type here…' ? '#94a3b8' : annotation.fontColor}
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
