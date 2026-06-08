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
  RedactAnnotation, ImageAnnotation, FormFieldAnnotation,
} from '@/types/annotation'
import { TextAnnotationShape } from './TextAnnotation'
import { ShapeAnnotationShape } from './ShapeAnnotation'
import { FreehandAnnotationShape } from './FreehandAnnotation'
import { HighlightAnnotationShape } from './HighlightAnnotation'
import { RedactionBoxShape } from './RedactionBox'
import { ImageAnnotationShape } from './ImageAnnotation'
import { FormFieldAnnotationShape } from './FormFieldAnnotation'
import { importImage } from '@/lib/imageImporter'
import { showToast } from '@/components/ui/Toast'
import type { DrawingDefaults } from '@/store/uiSlice'

interface AnnotationLayerProps {
  pageIndex: number
  width: number
  height: number
}

export function AnnotationLayer({ pageIndex, width, height }: AnnotationLayerProps) {
  const activeTool = useStore((s) => s.ui.activeTool)
  const textSelectMode = useStore((s) => s.ui.textSelectMode)
  const zoom = useStore((s) => s.ui.zoom)
  const selectedId = useStore((s) => s.ui.selectedAnnotationId)
  const newlyCreatedId = useStore((s) => s.ui.newlyCreatedId)
  const setSelectedId = useStore((s) => s.setSelectedAnnotationId)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const setNewlyCreatedId = useStore((s) => s.setNewlyCreatedId)
  const drawingDefaults = useStore((s) => s.ui.drawingDefaults)
  const annotations = useAnnotations(pageIndex)
  const { dispatch } = useHistory()
  const stageRef = useRef<Konva.Stage>(null)
  const isDrawingRef = useRef(false)
  const drawStartRef = useRef({ x: 0, y: 0 })
  const freehandPointsRef = useRef<number[]>([])
  const activeDrawingId = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  // Canvas text doesn't repaint itself once a custom branding font finishes
  // loading (see brandingLoader.applyBrandingToDom) — force a redraw so text
  // annotations switch from the fallback font to the real one.
  useEffect(() => {
    const handler = () => stageRef.current?.getLayers()[0]?.batchDraw()
    window.addEventListener('joepdf:fonts-ready', handler)
    return () => window.removeEventListener('joepdf:fonts-ready', handler)
  }, [])

  // Use getRelativePointerPosition to get coordinates in stage space (PDF units).
  // The Stage has scaleX/scaleY = zoom, so relative position = canvas_px / zoom = PDF units.
  const getPos = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    const pos = stage?.getRelativePointerPosition()
    return pos ?? { x: 0, y: 0 }
  }, [])

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === Tool.SELECT) {
        if (e.target === e.target.getStage()) setSelectedId(null)
        return
      }
      if (activeTool === Tool.IMAGE) return

      const pos = getPos(e)
      const id = generateId()

      // Stamp: place signature/image at click position (stays in STAMP mode for multi-stamp)
      if (activeTool === Tool.STAMP) {
        const stamp = useStore.getState().ui.pendingStamp
        if (!stamp) return
        const ann: ImageAnnotation = {
          id, type: 'image', pageIndex,
          x: pos.x - stamp.displayW / (2 * zoom),
          y: pos.y - stamp.displayH / (2 * zoom),
          width: stamp.displayW / zoom,
          height: stamp.displayH / zoom,
          src: stamp.src,
          naturalWidth: stamp.natW,
          naturalHeight: stamp.natH,
          opacity: 1, visible: true,
        }
        dispatch(new AddAnnotationCommand(pageIndex, ann))
        return
      }

      // Text: single click places a text box and immediately opens editor
      if (activeTool === Tool.TEXT) {
        const ann: TextAnnotation = {
          id, type: 'text', pageIndex,
          x: pos.x, y: pos.y, width: 200, height: 40,
          text: 'Type here…',
          fontSize: drawingDefaults.fontSize,
          fontFamily: drawingDefaults.fontFamily,
          fontColor: drawingDefaults.fontColor,
          fontBold: false, fontItalic: false,
          align: 'left', backgroundColor: null,
          opacity: 1, visible: true,
        }
        dispatch(new AddAnnotationCommand(pageIndex, ann))
        setSelectedId(id)
        setNewlyCreatedId(id)
        setActiveTool(Tool.SELECT)
        return
      }

      isDrawingRef.current = true
      drawStartRef.current = pos
      activeDrawingId.current = id

      if (activeTool === Tool.FREEHAND) {
        freehandPointsRef.current = [pos.x, pos.y]
        const ann: FreehandAnnotation = {
          id, type: 'freehand', pageIndex,
          x: pos.x, y: pos.y, width: 0, height: 0,
          points: [pos.x, pos.y],
          strokeColor: drawingDefaults.strokeColor,
          strokeWidth: drawingDefaults.strokeWidth,
          tension: 0.5, opacity: 1, visible: true,
        }
        dispatch(new AddAnnotationCommand(pageIndex, ann))
        return
      }

      const ann = buildAnnotation(activeTool, id, pageIndex, pos.x, pos.y, drawingDefaults)
      if (ann) dispatch(new AddAnnotationCommand(pageIndex, ann))
    },
    [activeTool, pageIndex, dispatch, getPos, setSelectedId, setActiveTool, setNewlyCreatedId, drawingDefaults, zoom],
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingRef.current || !activeDrawingId.current) return
      const pos = getPos(e)
      const id = activeDrawingId.current
      const start = drawStartRef.current

      if (activeTool === Tool.FREEHAND) {
        freehandPointsRef.current = [...freehandPointsRef.current, pos.x, pos.y]
        useStore.getState().updateAnnotation(pageIndex, id, { points: freehandPointsRef.current })
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

    if (activeTool === Tool.FORM_FIELD) {
      const ann = useStore.getState().annotations.get(pageIndex)?.find((a) => a.id === id)
      if (ann && ann.width >= 8 && ann.height >= 8) {
        // Remove the temp rect and open the dialog instead
        useStore.getState().removeAnnotation(pageIndex, ann.id)
        useStore.getState().setPendingFormField({
          pageIndex,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
        })
      } else if (id) {
        useStore.getState().removeAnnotation(pageIndex, id)
      }
      setActiveTool(Tool.SELECT)
      return
    }

    if (id) {
      const ann = useStore.getState().annotations.get(pageIndex)?.find((a) => a.id === id)
      // Remove zero-size annotations (except freehand and text which have defaults)
      if (ann && ann.width < 4 && ann.height < 4 && ann.type !== 'freehand' && ann.type !== 'text') {
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
          const imgWidth = Math.min(imported.naturalWidth, width / 2)
          const imgHeight = (imported.naturalHeight / imported.naturalWidth) * imgWidth
          const ann: ImageAnnotation = {
            id, type: 'image', pageIndex,
            x: width / 2 - imgWidth / 2, y: 50,
            width: imgWidth, height: imgHeight,
            src: imported.src,
            naturalWidth: imported.naturalWidth, naturalHeight: imported.naturalHeight,
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
  }, [activeTool, pageIndex, width, dispatch, setActiveTool])

  useEffect(() => {
    if (activeTool === Tool.IMAGE) handleImageTool()
  }, [activeTool, handleImageTool])

  // When text select mode is on, Konva canvas passes events through
  if (textSelectMode) return null

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      // Scale the Konva coordinate system so 1 stage unit = 1 PDF user-space unit.
      // Annotations are stored in PDF units; the stage renders them at zoom×zoom scale.
      scaleX={zoom}
      scaleY={zoom}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: getCursor(activeTool),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={(e) => handleMouseDown(e as unknown as Konva.KonvaEventObject<MouseEvent>)}
      onTouchMove={(e) => handleMouseMove(e as unknown as Konva.KonvaEventObject<MouseEvent>)}
      onTouchEnd={handleMouseUp}
    >
      <Layer>
        {annotations.map((ann) => {
          const isSelected = selectedId === ann.id && activeTool === Tool.SELECT
          const autoEdit = ann.id === newlyCreatedId
          const onSelect = () => activeTool === Tool.SELECT && setSelectedId(ann.id)
          const onDragEnd = (newPos: { x: number; y: number }) => {
            dispatch(new MoveAnnotationCommand(pageIndex, ann.id, { x: ann.x, y: ann.y }, newPos))
          }
          const onResizeEnd = (geo: { x: number; y: number; width: number; height: number }) => {
            dispatch(new ResizeAnnotationCommand(pageIndex, ann.id,
              { x: ann.x, y: ann.y, width: ann.width, height: ann.height }, geo))
          }

          switch (ann.type) {
            case 'text':
              return (
                <TextAnnotationShape
                  key={ann.id}
                  annotation={ann as TextAnnotation}
                  isSelected={isSelected}
                  autoEdit={autoEdit}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
                  onResizeEnd={onResizeEnd}
                  onEditDone={() => setNewlyCreatedId(null)}
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
            case 'formfield':
              return (
                <FormFieldAnnotationShape
                  key={ann.id}
                  annotation={ann as FormFieldAnnotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onDragEnd={onDragEnd}
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
    case Tool.STAMP: return 'copy'
    case Tool.FORM_FIELD:
    case Tool.REDACT:
    case Tool.RECT:
    case Tool.ELLIPSE:
    case Tool.HIGHLIGHT:
    case Tool.LINE:
    case Tool.ARROW:
    case Tool.FREEHAND: return 'crosshair'
    default: return 'default'
  }
}

function buildAnnotation(
  tool: Tool,
  id: string,
  pageIndex: number,
  x: number,
  y: number,
  d: DrawingDefaults,
): Annotation | null {
  const base = { id, pageIndex, x, y, width: 0, height: 0, opacity: 1, visible: true }
  const strokeColor = d.strokeNone ? 'transparent' : d.strokeColor
  const strokeWidth = d.strokeNone ? 0 : d.strokeWidth
  switch (tool) {
    case Tool.RECT:
      return { ...base, type: 'rect', fillColor: d.fillColor, strokeColor, strokeWidth, cornerRadius: 0 }
    case Tool.ELLIPSE:
      return { ...base, type: 'ellipse', fillColor: d.fillColor, strokeColor, strokeWidth }
    case Tool.LINE:
      return { ...base, type: 'line', points: [x, y, x, y], strokeColor, strokeWidth }
    case Tool.ARROW:
      return { ...base, type: 'arrow', points: [x, y, x, y], strokeColor, strokeWidth }
    case Tool.HIGHLIGHT:
      return { ...base, type: 'highlight', fillColor: d.highlightColor, opacity: 0.45 }
    case Tool.REDACT:
      return { ...base, type: 'redact', applied: false }
    case Tool.FORM_FIELD:
      // Temporary placeholder rect used for drag feedback — removed when dialog opens
      return { ...base, type: 'rect', fillColor: 'rgba(219,234,254,0.2)', strokeColor: '#60a5fa', strokeWidth: 1, cornerRadius: 2 }
    default:
      return null
  }
}
