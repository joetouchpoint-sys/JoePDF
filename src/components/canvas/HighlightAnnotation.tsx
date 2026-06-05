import { useRef } from 'react'
import { Rect, Group } from 'react-konva'
import type Konva from 'konva'
import type { HighlightAnnotation } from '@/types/annotation'
import { SelectionTransformer } from './SelectionTransformer'

interface Props {
  annotation: HighlightAnnotation
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
  onResizeEnd: (geo: { x: number; y: number; width: number; height: number }) => void
}

export function HighlightAnnotationShape({ annotation, isSelected, onSelect, onDragEnd, onResizeEnd }: Props) {
  const rectRef = useRef<Konva.Rect>(null)

  return (
    <Group>
      <Rect
        ref={rectRef}
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        fill={annotation.fillColor}
        opacity={annotation.opacity}
        visible={annotation.visible}
        globalCompositeOperation="multiply"
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      />
      <SelectionTransformer nodeRef={rectRef} isSelected={isSelected} onResizeEnd={onResizeEnd} />
    </Group>
  )
}
