import { useRef, useEffect, useState } from 'react'
import { Image as KonvaImage, Group } from 'react-konva'
import type Konva from 'konva'
import type { ImageAnnotation } from '@/types/annotation'
import { SelectionTransformer } from './SelectionTransformer'

interface Props {
  annotation: ImageAnnotation
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (pos: { x: number; y: number }) => void
  onResizeEnd: (geo: { x: number; y: number; width: number; height: number }) => void
}

export function ImageAnnotationShape({ annotation, isSelected, onSelect, onDragEnd, onResizeEnd }: Props) {
  const imageRef = useRef<Konva.Image>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const image = new Image()
    image.src = annotation.src
    image.onload = () => setImg(image)
  }, [annotation.src])

  if (!img) return null

  return (
    <Group>
      <KonvaImage
        ref={imageRef}
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        image={img}
        opacity={annotation.opacity}
        visible={annotation.visible}
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      />
      <SelectionTransformer
        nodeRef={imageRef}
        isSelected={isSelected}
        onResizeEnd={onResizeEnd}
        keepAspectRatio
      />
    </Group>
  )
}
