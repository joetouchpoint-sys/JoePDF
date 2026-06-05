import { useRef } from 'react'
import { Line, Group } from 'react-konva'
import type Konva from 'konva'
import type { FreehandAnnotation } from '@/types/annotation'

interface Props {
  annotation: FreehandAnnotation
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
}

export function FreehandAnnotationShape({ annotation, isSelected, onSelect, onDragEnd }: Props) {
  const lineRef = useRef<Konva.Line>(null)

  return (
    <Group>
      <Line
        ref={lineRef}
        x={0} y={0}
        points={annotation.points}
        stroke={annotation.strokeColor}
        strokeWidth={annotation.strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={annotation.tension}
        opacity={annotation.opacity}
        visible={annotation.visible}
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
        hitStrokeWidth={12}
      />
    </Group>
  )
}
