import { useRef } from 'react'
import { Rect, Ellipse, Line, Arrow, Group } from 'react-konva'
import type Konva from 'konva'
import type { RectAnnotation, EllipseAnnotation, LineAnnotation, ArrowAnnotation } from '@/types/annotation'
import { SelectionTransformer } from './SelectionTransformer'

type ShapeAnn = RectAnnotation | EllipseAnnotation | LineAnnotation | ArrowAnnotation

interface Props {
  annotation: ShapeAnn
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
  onResizeEnd: (geo: { x: number; y: number; width: number; height: number }) => void
}

export function ShapeAnnotationShape({ annotation, isSelected, onSelect, onDragEnd, onResizeEnd }: Props) {
  const shapeRef = useRef<Konva.Node>(null)
  const common = {
    draggable: isSelected,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
      onDragEnd({ x: e.target.x(), y: e.target.y() }),
    opacity: annotation.opacity,
    visible: annotation.visible,
  }

  let shape: React.ReactNode

  switch (annotation.type) {
    case 'rect': {
      const a = annotation
      shape = (
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          x={a.x} y={a.y} width={a.width} height={a.height}
          fill={a.fillColor ?? undefined}
          stroke={a.strokeColor} strokeWidth={a.strokeWidth}
          cornerRadius={a.cornerRadius}
          {...common}
        />
      )
      break
    }
    case 'ellipse': {
      const a = annotation
      shape = (
        <Ellipse
          ref={shapeRef as React.RefObject<Konva.Ellipse>}
          x={a.x + a.width / 2} y={a.y + a.height / 2}
          radiusX={a.width / 2} radiusY={a.height / 2}
          fill={a.fillColor ?? undefined}
          stroke={a.strokeColor} strokeWidth={a.strokeWidth}
          {...common}
        />
      )
      break
    }
    case 'line': {
      const a = annotation
      shape = (
        <Line
          ref={shapeRef as React.RefObject<Konva.Line>}
          x={0} y={0}
          points={a.points}
          stroke={a.strokeColor} strokeWidth={a.strokeWidth}
          lineCap="round" lineJoin="round"
          {...common}
        />
      )
      break
    }
    case 'arrow': {
      const a = annotation
      shape = (
        <Arrow
          ref={shapeRef as React.RefObject<Konva.Arrow>}
          x={0} y={0}
          points={a.points}
          stroke={a.strokeColor} strokeWidth={a.strokeWidth}
          fill={a.strokeColor}
          pointerLength={10} pointerWidth={8}
          lineCap="round"
          {...common}
        />
      )
      break
    }
  }

  return (
    <Group>
      {shape}
      {annotation.type !== 'line' && annotation.type !== 'arrow' && (
        <SelectionTransformer
          nodeRef={shapeRef}
          isSelected={isSelected}
          onResizeEnd={onResizeEnd}
        />
      )}
    </Group>
  )
}
