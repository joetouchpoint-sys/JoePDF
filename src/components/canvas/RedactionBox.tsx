import { useRef } from 'react'
import { Rect, Group } from 'react-konva'
import type Konva from 'konva'
import type { RedactAnnotation } from '@/types/annotation'
import { SelectionTransformer } from './SelectionTransformer'

interface Props {
  annotation: RedactAnnotation
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
  onResizeEnd: (geo: { x: number; y: number; width: number; height: number }) => void
}

export function RedactionBoxShape({ annotation, isSelected, onSelect, onDragEnd, onResizeEnd }: Props) {
  const rectRef = useRef<Konva.Rect>(null)

  return (
    <Group>
      <Rect
        ref={rectRef}
        x={annotation.x}
        y={annotation.y}
        width={Math.max(annotation.width, 10)}
        height={Math.max(annotation.height, 10)}
        fill={annotation.applied ? '#000000' : '#1a1a1a'}
        stroke={annotation.applied ? undefined : '#ef4444'}
        strokeWidth={annotation.applied ? 0 : 1.5}
        dash={annotation.applied ? undefined : [6, 3]}
        opacity={annotation.applied ? 1 : 0.85}
        visible={annotation.visible}
        draggable={isSelected && !annotation.applied}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      />
      {!annotation.applied && (
        <SelectionTransformer nodeRef={rectRef} isSelected={isSelected} onResizeEnd={onResizeEnd} />
      )}
    </Group>
  )
}
