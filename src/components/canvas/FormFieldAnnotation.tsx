import { Group, Rect, Text } from 'react-konva'
import type { FormFieldAnnotation } from '@/types/annotation'
import { useStore } from '@/store'

interface Props {
  annotation: FormFieldAnnotation
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
}

const FIELD_TYPE_LABEL: Record<FormFieldAnnotation['fieldType'], string> = {
  text: 'Text',
  checkbox: '☑',
  dropdown: '▼',
}

export function FormFieldAnnotationShape({ annotation, isSelected, onSelect, onDragEnd }: Props) {
  const zoom = useStore((s) => s.ui.zoom)
  const { x, y, width, height, fieldName, fieldType } = annotation
  const strokeW = 1 / zoom
  const label = `${FIELD_TYPE_LABEL[fieldType]} ${fieldName}`
  const fs = Math.min(11, Math.max(6, height * 0.45)) / zoom

  return (
    <Group
      x={x}
      y={y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
    >
      <Rect
        width={width}
        height={height}
        fill="rgba(219,234,254,0.25)"
        stroke={isSelected ? '#2563eb' : '#60a5fa'}
        strokeWidth={isSelected ? strokeW * 1.5 : strokeW}
        dash={[5 / zoom, 3 / zoom]}
        cornerRadius={2}
      />
      <Text
        x={3}
        y={height / 2 - fs / 2}
        text={label}
        fontSize={fs}
        fill="#1d4ed8"
        ellipsis
        width={width - 6}
      />
    </Group>
  )
}
