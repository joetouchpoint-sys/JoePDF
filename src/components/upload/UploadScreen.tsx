import { DropZone } from './DropZone'
import { FileText, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Private by default',
    description: 'Your documents never leave your browser. All processing happens locally.',
  },
  {
    icon: FileText,
    title: 'Annotate and edit',
    description: 'Add text, shapes, highlights, images, and freehand drawings.',
  },
  {
    icon: Zap,
    title: 'Secure redaction',
    description: 'Permanently remove sensitive content with canvas rasterisation.',
  },
]

export function UploadScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 gap-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Open a document</h1>
        <p className="text-slate-500 text-base">
          Edit, annotate, and redact PDF documents — entirely in your browser.
        </p>
      </div>

      <DropZone />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2 p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[--color-primary]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
