import { useStore } from '@/store'

interface OcrTextLayerProps {
  pageIndex: number
  scale: number
}

export function OcrTextLayer({ pageIndex, scale }: OcrTextLayerProps) {
  const pageOrder = useStore((s) => s.pdf.pageOrder)
  const pageMeta = useStore((s) => s.pdf.pageMeta)
  const ocrLayers = useStore((s) => s.ocrLayers)
  const textSelectMode = useStore((s) => s.ui.textSelectMode)

  const originalIdx = pageOrder[pageIndex] ?? pageIndex
  const words = ocrLayers.get(originalIdx)
  if (!words || words.length === 0) return null

  const pageHeightPts = pageMeta[originalIdx]?.height ?? 842

  return (
    <div
      className="pdfTextLayer"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        userSelect: textSelectMode ? 'text' : 'none',
        pointerEvents: textSelectMode ? 'auto' : 'none',
      }}
    >
      {words.map((word, i) => {
        const left = word.x * scale
        const top = (pageHeightPts - word.y - word.height) * scale
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width: word.width * scale,
              height: word.height * scale,
              fontSize: Math.max(6, word.height * scale * 0.85),
              lineHeight: 1,
              whiteSpace: 'pre',
              color: 'transparent',
              cursor: 'text',
              transformOrigin: '0 100%',
            }}
          >
            {word.text}{' '}
          </span>
        )
      })}
    </div>
  )
}
