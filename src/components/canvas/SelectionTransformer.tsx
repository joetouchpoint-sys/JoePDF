import { useRef, useEffect } from 'react'
import { Transformer } from 'react-konva'
import type Konva from 'konva'

interface SelectionTransformerProps {
  nodeRef: React.RefObject<Konva.Node | null>
  isSelected: boolean
  onResizeEnd?: (geo: { x: number; y: number; width: number; height: number }) => void
  keepAspectRatio?: boolean
}

export function SelectionTransformer({ nodeRef, isSelected, onResizeEnd, keepAspectRatio = false }: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (!transformerRef.current) return
    if (isSelected && nodeRef.current) {
      transformerRef.current.nodes([nodeRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    } else {
      transformerRef.current.nodes([])
    }
  }, [isSelected, nodeRef])

  if (!isSelected) return null

  return (
    <Transformer
      ref={transformerRef}
      keepRatio={keepAspectRatio}
      rotateEnabled={false}
      borderStroke="#1d4ed8"
      borderStrokeWidth={1}
      anchorStroke="#1d4ed8"
      anchorFill="#fff"
      anchorSize={8}
      anchorCornerRadius={2}
      onTransformEnd={() => {
        const node = nodeRef.current
        if (!node || !onResizeEnd) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        onResizeEnd({
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * scaleX),
          height: Math.max(10, node.height() * scaleY),
        })
      }}
    />
  )
}
