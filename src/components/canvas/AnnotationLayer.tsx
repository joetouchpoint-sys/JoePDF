import { useRef, useCallback, useEffect } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { useStore } from '@/store'
import { Tool } from '@/types/tool'
import { useAnnotations } from '@/hooks/useAnnotations'
import { useHistory } from '@/hooks/useHistory'
import { generateId } from '@/utils/fileUtils'
import { AddAnnotationCommand } from '@/commands/AddAnnotationCommand'
import { DeleteAnnotationCommand } from '@/commands/DeleteAnnotationCommand'
import { MoveAnnotationCommand } from '@/commands/MoveAnnotationCommand'
import { ResizeAnnotationCommand } from '@/commands/ResizeAnnotationCommand'
import type {
  Annotation, TextAnnotation, RectAnnotation, EllipseAnnotation,
  LineAnnotation, ArrowAnnotation, FreehandAnnotation, HighlightAnnotation,
  RedactAnnotation, ImageAnnotation,
} from '@/types/annotation'
import { TextAnnotationShape } from './TextAnnotation'
import { ShapeAnnotationShape } from './ShapeAnnotation'
import { FreehandAnnotationShape } from './FreehandAnnotation'
import { HighlightAnnotationShape } from './HighlightAnnotation'
import { RedactionBoxShape } from './RedactionBox'
import { ImageAnnotationShape } from './ImageAnnotation'
import { importImage } from '@/lib/imageImporter'
import { showToast } from '@/components/ui/Toast'

interface AnnotationLayerProps {
  pageIndex: number
  width: number
  height: number
}

export function AnnotationLayer({ pageIndex, width, height }: AnnotationLayerProps) {
  const activeTool = useStore((s) => s.ui.activeTool)
  const selectedId = useStore((s) => s.ui.selectedAnnotationId)
  const setSelectedId = useStore((s) => s.setSelectedAnnotationId)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const annotations = useAnnotations(pageIndex)
  const { dispatch } = useHistory()
  const stageRef = useRef<Konva.Stage>(null)
  const isDrawingRef = useRef(false)
  const drawStartRef = useRef({ x: 0, y: 0 })
  const freehandPointsRef = useRef<number[]>([])
  const activeDrawingId = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Delete selected annotation on custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      const ann = annotations.find((a) => a.id === id)
      if (ann) {
        dispatch(new DeleteAnnotationCommand(pageIndex, ann))
        setSelectedId(null)
      }
    }
    window.addEventListener('joepdf:delete-selected', handler)
    return () => window.removeEventListener('joepdf:delete-selected', handler)
  }, [annotations, pageIndex, dispatch, setSelectedId])

  const getPos = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    return pos ?? { x: 0, y: 0 }
  }, [])

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === Tool.SELECT) {
        if (e.target === e.target.getStage()) {
          setSelectedId(null)
        }
        return
      }

      if (activeTool === Tool.IMAGE) return

      const pos = getPos(e)
      isDrawingRef.current = true
      drawStartRef.current = pos
      const id = generateId()
      activeDrawingId.current = id

      if (activeTool === Tool.FREEHAND) {
        freehandPointsRef.current = [pos.x, pos.y]
        const ann: FreehandAnnotation = {
          id, type: 'freehand', pageIndex,
          x: pos.x, y: pos.y, width: 0, height: 0,
          points: [pos.x, pos.y], strokeColor: '#1d4ed8',
          strokeWidth: 3, tension: 0.5, opacity: 1, visible: true,
        }
        dispatch(new AddAnnotationCommand(pageIndex, ann))
        return
      }

      const defaults = getDefaultAnnotation(activeTool, id, pageIndex, pos.x, pos.y)
      if (defaults) {
        dispatch(new AddAnnotationCommand(pageIndex, defaults))
      }
    },
    [activeTool, pageIndex, dispatch, getPos, setSelectedId],
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingRef.current || !activeDrawingId.current) return
      const pos = getPos(e)
      const id = activeDrawingId.current
      const start = drawStartRef.current

      if (activeTool === Tool.FREEHAND) {
        freehandPointsRef.current = [...freehandPointsRef.current, pos.x, pos.y]
        useStore.getState().updateAnnotation(pageIndex, id, {
          points: freehandPointsRef.current,
        })
        return
      }

      const x = Math.min(pos.x, start.x)
      const y = Math.min(pos.y, start.y)
      const w = Math.abs(pos.x - start.x)
      const h = Math.abs(pos.y - start.y)

      if (activeTool === Tool.LINE || activeTool === Tool.ARROW) {
        useStore.getState().updateAnnotation(pageIndex, id, {
          points: [start.x, start.y, pos.x, pos.y],
          x: start.x, y: start.y, width: w, height: h,
        })
      } else {
        useStore.getState().updateAnnotation(pageIndex, id, { x, y, width: w, height: h })
      }
    },
    [activeTool, pageIndex, getPos],
  )

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const id = activeDrawingId.current
    activeDrawingId.current = null

    if (id) {
      const ann = useStore.getState().annotations.get(pageIndex)?.find((a) => a.id === id)
      if (ann && ann.width < 4 && ann.height < 4 && ann.type !== 'freehand') {
        useStore.getState().removeAnnotation(pageIndex, id)
      }
    }

    if (activeTool !== Tool.SELECT && activeTool !== Tool.REDACT && activeTool !== Tool.FREEHAND) {
      setActiveTool(Tool.SELECT)
    }
  }, [activeTool, pageIndex, setActiveTool])

  const handleImageTool = useCallback(() => {
    if (activeTool !== Tool.IMAGE) return
    if (!fileInputRef.current) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          const imported = await importImage(file)
          const id = generateId()
          const centerX = width / 2 - Math.min(imported.naturalWidth, width / 2) / 2
          const ann: ImageAnnotation = {
            id, type: 'image', pageIndex,
            x: centerX, y: 50,
            width: Math.min(imported.naturalWidth, width / 2),
            height: Math.min(imported.naturalHeight, height / 2),
            src: imported.src,
            naturalWidth: imported.naturalWidth,
            naturalHeight: imported.naturalHeight,
            opacity: 1, visible: true,
          }
          dispatch(new AddAnnotationCommand(pageIndex, ann))
          setActiveTool(Tool.SELECT)
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Failed to import image.', 'error')
        }
      }
      fileInputRef.current = input
    }
    fileInputRef.current.click()
  }, [activeTool, pageIndex, width, height, dispatch, setActiveTool])

  useEffect(() => {
    if (activeTool === Tool.IMAGE) {
      handleImageTool()
    }
  }, [activeTool, handleImageTool])

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: getCursor(activeTool),
        pointerEvents: activeTool === Tool.SELECT ? 'auto' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {annotations.map((ann) => {
          const isSelected = selectedId === ann.id && activeTool === Tool.SELECT
          const onSelect = () => activeTool === Tool.SELECT && setSelectedId(ann.id)
          const onDragEnd = (newPos: { x: number; y: number }) => {
            const old = { x: ann.x, y: ann.y }
            dispatch(new MoveAnnotationCommand(pageIndex, ann.id, old, newPos))
          }
          const onResizeEnd = (geo: { x: number; y: number; width: number; height: number }) => {
            const old = { x: ann.x, y: ann.y, width: ann.width, height: ann.height }
            dispatch(new ResizeAnnotationCommand(pageIndex, ann.id, old, geo))
          }

          switch (ann.type) {
            case 'text':
              return (
                <TextAnnotationShape
                  key={ann.id}
                  annotation={ann as TextAnnotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
                  onResizeEnd={onResizeEnd}
                  pageIndex={pageIndex}
                />
              )
            case 'rect':
            case 'ellipse':
            case 'line':
            case 'arrow':
              return (
                <ShapeAnnotationShape
                  key={ann.id}
                  annotation={ann as RectAnnotation | EllipseAnnotation | LineAnnotation | ArrowAnnotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
                  onResizeEnd={onResizeEnd}
                />
              )
            case 'freehand':
              return (
                <FreehandAnnotationShape
                  key={ann.id}
                  annotation={ann as FreehandAnnotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
                />
              )
            case 'highlight':
              return (
                <HighlightAnnotationShape
                  key={ann.id}
                  annotation={ann as HighlightAnnotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
                  onResizeEnd={onResizeEnd}
                />
              )
            case 'redact':
              return (
                <RedactionBoxShape
                  key={ann.id}
                  annotation={ann as RedactAnnotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
                  onResizeEnd={onResizeEnd}
                />
              )
            case 'image':
              return (
                <ImageAnnotationShape
                  key={ann.id}
                  annotation={ann as ImageAnnotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
                  onResizeEnd={onResizeEnd}
                />
              )
            default:
              return null
          }
        })}
      </Layer>
    </Stage>
  )
}

function getCursor(tool: Tool): string {
  switch (tool) {
    case Tool.TEXT: return 'text'
    case Tool.REDACT:
    case Tool.RECT:
    case Tool.ELLIPSE:
    case Tool.HIGHLIGHT: return 'crosshair'
    case Tool.LINE:
    case Tool.ARROW: return 'crosshair'
    case Tool.FREEHAND: return 'crosshair'
    case Tool.IMAGE: return 'default'
    default: return 'default'
  }
}

function getDefaultAnnotation(
  tool: Tool,
  id: string,
  pageIndex: number,
  x: number,
  y: number,
): Annotation | null {
  const base = { id, pageIndex, x, y, width: 0, height: 0, opacity: 1, visible: true }

  switch (tool) {
    case Tool.TEXT:
      return { ...base, type: 'text', text: 'Text', fontSize: 16, fontFamily: 'sans-serif',
        fontColor: '#1e293b', fontBold: false, fontItalic: false, align: 'left', backgroundColor: null }
    case Tool.RECT:
      return { ...base, type: 'rect', fillColor: null, strokeColor: '#1d4ed8', strokeWidth: 2, cornerRadius: 0 }
    case Tool.ELLIPSE:
      return { ...base, type: 'ellipse', fillColor: null, strokeColor: '#1d4ed8', strokeWidth: 2 }
    case Tool.LINE:
      return { ...base, type: 'line', points: [x, y, x, y], strokeColor: '#1d4ed8', strokeWidth: 2 }
    case Tool.ARROW:
      return { ...base, type: 'arrow', points: [x, y, x, y], strokeColor: '#1d4ed8', strokeWidth: 2 }
    case Tool.HIGHLIGHT:
      return { ...base, type: 'highlight', fillColor: '#fde047', opacity: 0.5 }
    case Tool.REDACT:
      return { ...base, type: 'redact', applied: false }
    default:
      return null
  }
}
